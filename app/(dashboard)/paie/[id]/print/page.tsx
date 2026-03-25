import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/rh/PrintButton";
import {
  calculerBulletin,
  calculerChargesPatronales,
  TAUX_CNPS_RETRAITE_SALARIE,
  CMU_MENSUEL,
  CHARGES_PATRONALES_TAUX,
  PLAFOND_FAMILIALES,
} from "@/lib/paie-ci";

export const metadata = { title: "Bulletin de paie" };

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(Math.round(n));

const pct = (n: number) => `${(n * 100).toFixed(2).replace(/\.?0+$/, "")}%`;

function moisLabel(periode: string): string {
  const [year, month] = periode.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("fr-CI", { month: "long", year: "numeric" }).toUpperCase();
}

function periodeLabel(periode: string): string {
  const [year, month] = periode.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  const last = new Date(Number(year), Number(month), 0);
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" };
  return `${d.toLocaleDateString("fr-CI", opts)} au ${last.toLocaleDateString("fr-CI", opts)}`;
}

export default async function PrintBulletinPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();

  const { data: bulletin } = await supabase
    .from("bulletins_paie")
    .select(`
      id, periode, salaire_brut, cnps_salarie, its, autres_retenues, avances, salaire_net, statut,
      employees!inner(
        id, full_name, poste, matricule, date_embauche, departement, type_contrat, company_id
      )
    `)
    .eq("id", params.id)
    .single();

  if (!bulletin) notFound();

  const emp = bulletin.employees as unknown as {
    id: string;
    full_name: string;
    poste: string;
    matricule: string;
    date_embauche: string;
    departement: string | null;
    type_contrat: string | null;
    company_id: string;
  } | null;

  // Recalcul depuis le brut (authoritative)
  const calc = calculerBulletin(
    Number(bulletin.salaire_brut),
    Number(bulletin.autres_retenues ?? 0),
    Number(bulletin.avances ?? 0)
  );
  const patronales = calculerChargesPatronales(Number(bulletin.salaire_brut));

  // Info entreprise
  const { data: company } = emp?.company_id
    ? await supabase.from("companies").select("*").eq("id", emp.company_id).single()
    : { data: null };

  const companyNom = (company as Record<string, string> | null)?.name
    ?? (company as Record<string, string> | null)?.raison_sociale
    ?? "VOTRE ENTREPRISE";
  const companyNif = (company as Record<string, string> | null)?.nif ?? "—";
  const companyAdresse = (company as Record<string, string> | null)?.adresse
    ?? (company as Record<string, string> | null)?.address
    ?? "Abidjan, Côte d'Ivoire";
  const companyCnps = (company as Record<string, string> | null)?.cnps_matricule ?? "—";

  // Cumuls (bulletins du même employé sur l'année)
  const annee = bulletin.periode.slice(0, 4);
  const { data: bulletinsAnnee } = await supabase
    .from("bulletins_paie")
    .select("salaire_brut, cnps_salarie, its, salaire_net, periode")
    .eq("employee_id", emp?.id ?? "")
    .like("periode", `${annee}-%`);

  const cumBrut = bulletinsAnnee?.reduce((s, b) => s + Number(b.salaire_brut), 0) ?? 0;
  const cumCharges = bulletinsAnnee?.reduce((s, b) => s + Number(b.cnps_salarie) + Number(b.its), 0) ?? 0;
  const cumNet = bulletinsAnnee?.reduce((s, b) => s + Number(b.salaire_net), 0) ?? 0;
  const numBulletin = String(bulletinsAnnee?.findIndex((b) => b.periode === bulletin.periode) ?? 0 + 1).padStart(3, "0");

  const dateGeneration = new Date().toLocaleDateString("fr-CI");

  return (
    <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">
      {/* Boutons (cachés à l'impression) */}
      <div className="mb-4 flex gap-3 px-6 print:hidden">
        <PrintButton />
        <a
          href="/paie"
          className="rounded-md border bg-white px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          ← Retour
        </a>
      </div>

      {/* Bulletin A4 */}
      <div className="mx-auto max-w-[210mm] bg-white shadow-lg print:shadow-none print:mx-0 print:max-w-full">
        <div className="p-8 print:p-6 space-y-0">

          {/* ═══════════════════════════════════════════════════════════
              EN-TÊTE : Employeur + Titre
          ═══════════════════════════════════════════════════════════ */}
          <div className="flex items-start justify-between border-b-2 border-gray-800 pb-4 mb-4">
            {/* Identité employeur */}
            <div className="space-y-0.5">
              <p className="text-base font-bold uppercase tracking-wide">{companyNom}</p>
              <p className="text-xs text-gray-600">NIF : {companyNif}</p>
              <p className="text-xs text-gray-600">Matricule CNPS : {companyCnps}</p>
              <p className="text-xs text-gray-600">{companyAdresse}</p>
            </div>
            {/* Titre + Période */}
            <div className="text-right">
              <p className="text-xl font-extrabold uppercase tracking-widest text-gray-800">
                Bulletin de Paie
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-700">
                {moisLabel(bulletin.periode)}
              </p>
              <p className="text-xs text-gray-500">N° {numBulletin}/{annee}</p>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              IDENTITÉ SALARIÉ — 2 colonnes
          ═══════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 gap-4 border border-gray-300 rounded p-3 mb-4 bg-gray-50 text-xs">
            <div className="space-y-1">
              <p><span className="font-semibold text-gray-600 uppercase">NOM :</span> {emp?.full_name ?? "—"}</p>
              <p><span className="font-semibold text-gray-600 uppercase">Matricule :</span> {emp?.matricule}</p>
              <p><span className="font-semibold text-gray-600 uppercase">Poste :</span> {emp?.poste}</p>
              {emp?.departement && (
                <p><span className="font-semibold text-gray-600 uppercase">Département :</span> {emp.departement}</p>
              )}
            </div>
            <div className="space-y-1">
              <p><span className="font-semibold text-gray-600 uppercase">Période :</span> {periodeLabel(bulletin.periode)}</p>
              <p><span className="font-semibold text-gray-600 uppercase">Contrat :</span> {emp?.type_contrat ?? "—"}</p>
              <p>
                <span className="font-semibold text-gray-600 uppercase">Embauche :</span>{" "}
                {emp?.date_embauche ? new Date(emp.date_embauche).toLocaleDateString("fr-CI") : "—"}
              </p>
              <p><span className="font-semibold text-gray-600 uppercase">Statut :</span> {bulletin.statut}</p>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              SECTION 1 — ÉLÉMENTS DE RÉMUNÉRATION
          ═══════════════════════════════════════════════════════════ */}
          <div className="mb-4">
            <div className="bg-gray-800 text-white text-xs font-semibold uppercase px-3 py-1.5 tracking-wide rounded-t">
              Éléments de Rémunération
            </div>
            <table className="w-full text-xs border border-t-0 border-gray-300">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="px-3 py-1.5 text-left font-semibold text-gray-600 w-[45%]">RUBRIQUE</th>
                  <th className="px-3 py-1.5 text-right font-semibold text-gray-600">BASE</th>
                  <th className="px-3 py-1.5 text-right font-semibold text-gray-600">TAUX</th>
                  <th className="px-3 py-1.5 text-right font-semibold text-gray-600">MONTANT</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-1.5">Salaire de base</td>
                  <td className="px-3 py-1.5 text-right text-gray-500">—</td>
                  <td className="px-3 py-1.5 text-right text-gray-500">—</td>
                  <td className="px-3 py-1.5 text-right font-medium">{fmt(bulletin.salaire_brut)}</td>
                </tr>
                {Number(bulletin.autres_retenues ?? 0) > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="px-3 py-1.5">Autres éléments de rémunération</td>
                    <td className="px-3 py-1.5 text-right text-gray-500">—</td>
                    <td className="px-3 py-1.5 text-right text-gray-500">—</td>
                    <td className="px-3 py-1.5 text-right font-medium">{fmt(0)}</td>
                  </tr>
                )}
                <tr className="bg-gray-50 border-t border-gray-400">
                  <td className="px-3 py-1.5 font-bold uppercase text-gray-800" colSpan={3}>Total Brut</td>
                  <td className="px-3 py-1.5 text-right font-bold text-gray-800">{fmt(bulletin.salaire_brut)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              SECTION 2 — CHARGES SOCIALES (bicolonne)
          ═══════════════════════════════════════════════════════════ */}
          <div className="mb-4">
            <div className="bg-gray-800 text-white text-xs font-semibold uppercase px-3 py-1.5 tracking-wide rounded-t">
              Charges Sociales
            </div>
            <div className="grid grid-cols-2 gap-0 border border-t-0 border-gray-300">
              {/* Salariales */}
              <div className="border-r border-gray-300">
                <div className="bg-blue-50 border-b border-gray-300 px-3 py-1 text-xs font-semibold text-blue-700 uppercase">
                  Part Salariale
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-2 py-1 text-left font-medium text-gray-500">Cotisation</th>
                      <th className="px-2 py-1 text-right font-medium text-gray-500">Taux</th>
                      <th className="px-2 py-1 text-right font-medium text-gray-500">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="px-2 py-1">CNPS Retraite</td>
                      <td className="px-2 py-1 text-right text-gray-500">{pct(TAUX_CNPS_RETRAITE_SALARIE)}</td>
                      <td className="px-2 py-1 text-right text-red-600">− {fmt(calc.cnps_retraite)}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-2 py-1">CMU (CNAM)</td>
                      <td className="px-2 py-1 text-right text-gray-500">Forfait</td>
                      <td className="px-2 py-1 text-right text-red-600">− {fmt(calc.cmu_salarie)}</td>
                    </tr>
                    <tr className="bg-blue-50 border-t border-gray-300">
                      <td className="px-2 py-1 font-bold" colSpan={2}>Total salarial</td>
                      <td className="px-2 py-1 text-right font-bold text-red-700">− {fmt(calc.cnps_salarie)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Patronales */}
              <div>
                <div className="bg-amber-50 border-b border-gray-300 px-3 py-1 text-xs font-semibold text-amber-700 uppercase">
                  Part Patronale
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-2 py-1 text-left font-medium text-gray-500">Cotisation</th>
                      <th className="px-2 py-1 text-right font-medium text-gray-500">Taux</th>
                      <th className="px-2 py-1 text-right font-medium text-gray-500">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="px-2 py-1">Prestations familiales</td>
                      <td className="px-2 py-1 text-right text-gray-500">{pct(CHARGES_PATRONALES_TAUX.familiales)}<span className="text-gray-400"> *</span></td>
                      <td className="px-2 py-1 text-right">{fmt(patronales.familiales)}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-2 py-1">Maternité</td>
                      <td className="px-2 py-1 text-right text-gray-500">{pct(CHARGES_PATRONALES_TAUX.maternite)}</td>
                      <td className="px-2 py-1 text-right">{fmt(patronales.maternite)}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-2 py-1">Retraite</td>
                      <td className="px-2 py-1 text-right text-gray-500">{pct(CHARGES_PATRONALES_TAUX.retraite)}</td>
                      <td className="px-2 py-1 text-right">{fmt(patronales.retraite)}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-2 py-1">AT/MP</td>
                      <td className="px-2 py-1 text-right text-gray-500">{pct(CHARGES_PATRONALES_TAUX.at_mp)}<span className="text-gray-400"> **</span></td>
                      <td className="px-2 py-1 text-right">{fmt(patronales.at_mp)}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-2 py-1">CMU (CNAM)</td>
                      <td className="px-2 py-1 text-right text-gray-500">Forfait</td>
                      <td className="px-2 py-1 text-right">{fmt(patronales.cmu)}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-2 py-1">FDFP</td>
                      <td className="px-2 py-1 text-right text-gray-500">{pct(CHARGES_PATRONALES_TAUX.fdfp)}</td>
                      <td className="px-2 py-1 text-right">{fmt(patronales.fdfp)}</td>
                    </tr>
                    <tr className="bg-amber-50 border-t border-gray-300">
                      <td className="px-2 py-1 font-bold" colSpan={2}>Total patronal</td>
                      <td className="px-2 py-1 text-right font-bold">{fmt(patronales.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5 px-1">
              * Base plafonnée à {fmt(PLAFOND_FAMILIALES)}/mois · ** Taux moyen indicatif — variable selon secteur
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              SECTION 3 — IMPÔT SUR LE REVENU
          ═══════════════════════════════════════════════════════════ */}
          <div className="mb-4">
            <div className="bg-gray-800 text-white text-xs font-semibold uppercase px-3 py-1.5 tracking-wide rounded-t">
              Impôt sur le Revenu (ITS)
            </div>
            <table className="w-full text-xs border border-t-0 border-gray-300">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-1.5 text-gray-600 w-2/3">Salaire brut</td>
                  <td className="px-3 py-1.5 text-right">{fmt(bulletin.salaire_brut)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-1.5 text-gray-600">− CNPS retraite salariale</td>
                  <td className="px-3 py-1.5 text-right text-red-600">− {fmt(calc.cnps_retraite)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-1.5 text-gray-600">− Abattement charges professionnelles (15%)</td>
                  <td className="px-3 py-1.5 text-right text-red-600">− {fmt(Math.round(bulletin.salaire_brut * 0.15))}</td>
                </tr>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <td className="px-3 py-1.5 font-semibold">= Base imposable ITS</td>
                  <td className="px-3 py-1.5 text-right font-semibold">{fmt(calc.base_imposable)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-1.5 text-gray-600">ITS retenu (barème progressif CGI CI Art. 116)</td>
                  <td className="px-3 py-1.5 text-right text-red-600">− {fmt(calc.its)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              NET À PAYER
          ═══════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Récapitulatif retenues */}
            <div className="border border-gray-300 rounded p-3 text-xs space-y-1">
              <p className="font-semibold text-gray-600 uppercase text-[10px] mb-2">Récapitulatif des retenues</p>
              <div className="flex justify-between">
                <span>Brut total</span>
                <span className="font-medium">{fmt(bulletin.salaire_brut)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>− CNPS retraite ({pct(TAUX_CNPS_RETRAITE_SALARIE)})</span>
                <span>{fmt(calc.cnps_retraite)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>− CMU salariale</span>
                <span>{fmt(CMU_MENSUEL)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>− ITS</span>
                <span>{fmt(calc.its)}</span>
              </div>
              {Number(bulletin.autres_retenues ?? 0) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>− Autres retenues</span>
                  <span>{fmt(Number(bulletin.autres_retenues))}</span>
                </div>
              )}
              {Number(bulletin.avances ?? 0) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>− Avances / Acomptes</span>
                  <span>{fmt(Number(bulletin.avances))}</span>
                </div>
              )}
            </div>

            {/* Net à payer */}
            <div className="flex flex-col items-center justify-center rounded border-2 border-emerald-500 bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-1">
                Net à Payer
              </p>
              <p className="text-3xl font-extrabold text-emerald-700">{fmt(calc.salaire_net)}</p>
              <p className="text-[10px] text-emerald-600 mt-1">
                Coût total employeur : {fmt(bulletin.salaire_brut + patronales.total)}
              </p>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              CUMULS ANNUELS
          ═══════════════════════════════════════════════════════════ */}
          <div className="mb-4">
            <div className="bg-gray-700 text-white text-xs font-semibold uppercase px-3 py-1.5 tracking-wide rounded-t">
              Cumuls {annee}
            </div>
            <table className="w-full text-xs border border-t-0 border-gray-300">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="px-3 py-1.5 text-left font-medium text-gray-600 w-1/3"></th>
                  <th className="px-3 py-1.5 text-right font-medium text-gray-600">Mois courant</th>
                  <th className="px-3 py-1.5 text-right font-medium text-gray-600">Cumul {annee}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-1.5 font-medium">Brut</td>
                  <td className="px-3 py-1.5 text-right">{fmt(bulletin.salaire_brut)}</td>
                  <td className="px-3 py-1.5 text-right font-medium">{fmt(cumBrut)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="px-3 py-1.5 font-medium">Charges salariales</td>
                  <td className="px-3 py-1.5 text-right text-red-600">
                    {fmt(calc.cnps_salarie + calc.its)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-red-600">{fmt(cumCharges)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-1.5 font-bold">Net payé</td>
                  <td className="px-3 py-1.5 text-right font-bold text-emerald-700">{fmt(calc.salaire_net)}</td>
                  <td className="px-3 py-1.5 text-right font-bold text-emerald-700">{fmt(cumNet)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              PIED DE PAGE — Mentions obligatoires
          ═══════════════════════════════════════════════════════════ */}
          <div className="border-t-2 border-gray-800 pt-3">
            <div className="grid grid-cols-2 gap-6 text-[10px] text-gray-500">
              <div className="space-y-1">
                <p className="font-semibold text-gray-600 uppercase">Paiement & Références</p>
                <p>Convention Collective : CCI AICI-UGTCI</p>
                <p>Barème ITS : CGI CI Art. 116 — Loi de Finances 2026</p>
                <p>CNPS retraite : 6,30% sal. / 7,70% pat. — plafond {fmt(1_647_315)}/mois</p>
                <p>CMU (CNAM) : forfait {fmt(CMU_MENSUEL)}/mois chaque part</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="font-semibold text-gray-600 uppercase">Organismes</p>
                <p>CNPS CI — www.cnps.ci</p>
                <p>CNAM CI — www.cnam.ci</p>
                <p>DGI CI — Barème ITS DGBF 2026</p>
                <p className="mt-2 text-gray-400">Généré le {dateGeneration} — RH Manager CI</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
              <p className="text-[10px] text-gray-400 italic">
                Ce bulletin est établi conformément au Code du Travail CI (Loi n°2015-532) et aux textes en vigueur.
                Conservez ce document — il peut vous être demandé par la CNPS ou l&apos;administration fiscale.
              </p>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-medium">Signature employeur</p>
                <div className="mt-2 h-8 w-24 border-b border-gray-400"></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
