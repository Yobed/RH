import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/rh/PrintButton";
import {
  calculerBulletin,
  calculerITS,
  TAUX_CNPS_RETRAITE_SALARIE,
  PLAFOND_CNPS_MENSUEL,
  CMU_MENSUEL,
  SMIG_MENSUEL,
} from "@/lib/paie-ci";

export const metadata = { title: "Bulletin de paie" };

/** Formateur nombre sans symbole devise — séparateur espace (fr-CI) */
const n = (v: number) => new Intl.NumberFormat("fr-CI").format(Math.round(v));

/** Formateur avec deux décimales pour les taux */
const taux = (v: number) => v.toFixed(2).replace(".", ",");

function moisLabel(periode: string): string {
  const [year, month] = periode.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d
    .toLocaleDateString("fr-CI", { month: "long", year: "numeric" })
    .toUpperCase();
}

function periodeDebut(periode: string): string {
  const [year, month] = periode.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("fr-CI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function periodeFin(periode: string): string {
  const [year, month] = periode.split("-");
  const last = new Date(Number(year), Number(month), 0);
  return last.toLocaleDateString("fr-CI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function joursMois(periode: string): number {
  const [year, month] = periode.split("-");
  return new Date(Number(year), Number(month), 0).getDate();
}

function formatAnciennete(dateEmbauche: string): string {
  const debut = new Date(dateEmbauche);
  const now = new Date();
  let years = now.getFullYear() - debut.getFullYear();
  let months = now.getMonth() - debut.getMonth();
  let days = now.getDate() - debut.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) { years -= 1; months += 12; }
  if (years === 0 && months === 0) return `${days} jour${days > 1 ? "s" : ""}`;
  const y = String(years).padStart(2, "0");
  const m = String(months).padStart(2, "0");
  const d = String(days).padStart(2, "0");
  return `${y} an${years > 1 ? "s" : ""} ${m} mois ${d} jour${days > 1 ? "s" : ""}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cellule de tableau
// ─────────────────────────────────────────────────────────────────────────────
function Td({
  children,
  right = false,
  bold = false,
  className = "",
  colSpan,
  rowSpan,
}: {
  children?: React.ReactNode;
  right?: boolean;
  bold?: boolean;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={`border border-gray-400 px-1 py-[2px] ${right ? "text-right" : ""} ${bold ? "font-bold" : ""} ${className}`}
    >
      {children}
    </td>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default async function PrintBulletinPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerClient();

  const { data: bulletin } = await supabase
    .from("bulletins_paie")
    .select(
      `id, periode, salaire_brut, cnps_salarie, its, autres_retenues, avances, salaire_net, statut,
       employees!inner(
         id, full_name, poste, matricule, date_embauche, departement, type_contrat, company_id,
         civilite, nb_enfants, etat_civil, categorie
       )`
    )
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
    civilite: string | null;
    nb_enfants: number | null;
    etat_civil: string | null;
    categorie: string | null;
  } | null;

  const { data: company } = emp?.company_id
    ? await supabase.from("companies").select("*").eq("id", emp.company_id).single()
    : { data: null };

  const companyNom =
    (company as Record<string, string> | null)?.raison_sociale ??
    (company as Record<string, string> | null)?.name ??
    "VOTRE ENTREPRISE";
  const companyAdresse =
    (company as Record<string, string> | null)?.adresse ??
    (company as Record<string, string> | null)?.address ??
    "Abidjan, Côte d'Ivoire";
  const companyCnps = (company as Record<string, string> | null)?.cnps_matricule ?? "—";
  const companyNccm = (company as Record<string, string> | null)?.nccm ?? "—";
  const companyNcc = (company as Record<string, string> | null)?.ncc ?? "—";

  // Cumuls annuels
  const annee = bulletin.periode.slice(0, 4);
  const { data: bulletinsAnnee } = await supabase
    .from("bulletins_paie")
    .select("salaire_brut, cnps_salarie, its, salaire_net, periode")
    .eq("employee_id", emp?.id ?? "")
    .like("periode", `${annee}-%`);

  // ── Calculs ────────────────────────────────────────────────────────────────
  const brut = Number(bulletin.salaire_brut);
  const autresRetenues = Number(bulletin.autres_retenues ?? 0);
  const avances = Number(bulletin.avances ?? 0);

  // Salariales
  const baseCNPS = Math.min(brut, PLAFOND_CNPS_MENSUEL);
  const cnps_retraite_sal = Math.round(baseCNPS * TAUX_CNPS_RETRAITE_SALARIE);
  const cmu_sal = CMU_MENSUEL;
  const abattement = Math.round(brut * 0.15);
  const base_its = Math.max(0, brut - cnps_retraite_sal - abattement);
  const its = calculerITS(base_its);
  const total_retenues_sal = cnps_retraite_sal + cmu_sal + its + autresRetenues + avances;
  const net_a_payer = Math.max(0, brut - total_retenues_sal);

  // Patronales
  const cnps_retraite_pat = Math.round(Math.min(brut, PLAFOND_CNPS_MENSUEL) * 0.077);
  const cnps_at_base = SMIG_MENSUEL; // 75 000
  const cnps_at_mp = Math.round(cnps_at_base * 0.03);
  const cnps_famil_base = SMIG_MENSUEL; // 75 000
  const cnps_famil_mat = Math.round(cnps_famil_base * 0.0575); // 5% + 0.75%
  const fdfp_ta = Math.round(brut * 0.004);
  const fdfp_tfc = Math.round(brut * 0.006);
  const cmu_pat = CMU_MENSUEL;
  const total_retenues_pat =
    cnps_retraite_pat + cnps_at_mp + cnps_famil_mat + fdfp_ta + fdfp_tfc + cmu_pat;

  // Cumuls
  const nbMois = bulletinsAnnee?.length ?? 1;
  const cumBrutSocial = bulletinsAnnee?.reduce((s, b) => s + Number(b.salaire_brut), 0) ?? brut;
  const cumIts = bulletinsAnnee?.reduce((s, b) => s + Number(b.its), 0) ?? its;
  const cumCnps = bulletinsAnnee?.reduce((s, b) => s + Number(b.cnps_salarie), 0) ?? (cnps_retraite_sal + cmu_sal);
  const cumNet = bulletinsAnnee?.reduce((s, b) => s + Number(b.salaire_net), 0) ?? net_a_payer;

  // Parts IGR
  const isMarried = emp?.etat_civil?.toLowerCase().includes("mari");
  const partsBase = isMarried ? 2 : 1;
  const partsIGR = partsBase + Math.round((emp?.nb_enfants ?? 0) * 0.5 * 2) / 2;

  const civiliteLabel = emp?.civilite ? `${emp.civilite} ` : "";
  const jours = joursMois(bulletin.periode);

  // ── Ligne vide ──────────────────────────────────────────────────────────────
  const EmptyRow = () => (
    <tr className="h-4">
      <Td /><Td /><Td /><Td /><Td /><Td /><Td /><Td />
    </tr>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-6 print:bg-white print:py-0">
      {/* Contrôles (cachés à l'impression) */}
      <div className="mb-4 flex gap-3 px-6 print:hidden">
        <PrintButton />
        <a
          href="/paie"
          className="rounded-md border bg-white px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          ← Retour
        </a>
      </div>

      {/* ─── Feuille A4 ─────────────────────────────────────────────────── */}
      <div
        className="mx-auto bg-white shadow-lg print:shadow-none print:mx-0"
        style={{ width: "210mm", minHeight: "297mm" }}
      >
        <div className="px-6 py-4 text-[10px] leading-tight">

          {/* Filigrane */}
          <div className="text-right text-[8px] text-gray-400 mb-0.5">
            LOGICPAIE, RH V1.0
          </div>

          {/* ── EN-TÊTE ─────────────────────────────────────────────────── */}
          <div className="flex justify-between items-start mb-2">
            <div className="space-y-0.5">
              <p className="text-[13px] font-bold uppercase tracking-wide">{companyNom}</p>
              <p>{companyNom}</p>
              <p>{companyAdresse}</p>
              <p>N°CCM : {companyNccm} &nbsp;–&nbsp; N°CC : {companyNcc}</p>
              <p>N°CNPS : {companyCnps}</p>
            </div>
            <div className="text-right">
              <p className="text-[15px] font-extrabold uppercase tracking-widest">BULLETIN DE PAIE</p>
              <p className="text-[11px] font-semibold mt-0.5">{moisLabel(bulletin.periode)}</p>
            </div>
          </div>

          {/* ── IDENTITÉ EMPLOYÉ ─────────────────────────────────────────── */}
          <div className="flex gap-3 mb-3">
            {/* Infos gauche */}
            <div className="flex-1 border border-gray-400 p-2 space-y-0.5">
              <div className="grid grid-cols-2 gap-x-4">
                <p><span className="font-semibold">Matricule :</span> {emp?.matricule}</p>
                <p><span className="font-semibold">N° CNPS :</span> {emp?.matricule}</p>
                <p><span className="font-semibold">Direction :</span> {emp?.departement ?? "—"}</p>
                <p><span className="font-semibold">Service :</span> {emp?.departement ?? "—"}</p>
                <p><span className="font-semibold">Emploi :</span> {emp?.poste}</p>
                <p><span className="font-semibold">Catégorie :</span> {emp?.categorie ?? "—"}</p>
                <p><span className="font-semibold">Parts IGR :</span> {partsIGR}</p>
                <p>
                  <span className="font-semibold">Date entrée :</span>{" "}
                  {emp?.date_embauche
                    ? new Date(emp.date_embauche).toLocaleDateString("fr-CI")
                    : "—"}
                </p>
                <p className="col-span-2">
                  <span className="font-semibold">Ancienneté :</span>{" "}
                  {emp?.date_embauche ? formatAnciennete(emp.date_embauche) : "—"}
                </p>
              </div>
            </div>

            {/* Nom employé (bandeau vert) */}
            <div
              className="flex flex-col justify-center p-3 text-white min-w-[180px]"
              style={{ backgroundColor: "#2e7d60" }}
            >
              <p className="text-[12px] font-bold uppercase">
                {civiliteLabel}{emp?.full_name}
              </p>
              <p className="mt-1">{companyAdresse}</p>
            </div>
          </div>

          {/* ── TABLE PRINCIPALE ─────────────────────────────────────────── */}
          <table className="w-full border-collapse text-[9.5px]">
            <thead>
              <tr className="bg-gray-100">
                <td
                  rowSpan={2}
                  className="border border-gray-500 px-1 py-1 text-center font-bold w-5"
                >
                  N°
                </td>
                <td
                  rowSpan={2}
                  className="border border-gray-500 px-1 py-1 font-bold"
                >
                  DÉSIGNATION
                </td>
                <td
                  rowSpan={2}
                  className="border border-gray-500 px-1 py-1 text-center font-bold w-20"
                >
                  BASE
                </td>
                <td
                  colSpan={3}
                  className="border border-gray-500 px-1 py-0.5 text-center font-bold"
                >
                  PART SALARIALE
                </td>
                <td
                  colSpan={2}
                  className="border border-gray-500 px-1 py-0.5 text-center font-bold"
                >
                  PART PATRONALE
                </td>
              </tr>
              <tr className="bg-gray-100">
                <td className="border border-gray-500 px-1 py-0.5 text-center font-semibold w-14">
                  Nbre/taux
                </td>
                <td className="border border-gray-500 px-1 py-0.5 text-center font-semibold w-20">
                  GAINS
                </td>
                <td className="border border-gray-500 px-1 py-0.5 text-center font-semibold w-20">
                  RETENUES
                </td>
                <td className="border border-gray-500 px-1 py-0.5 text-center font-semibold w-14">
                  Nbre/taux
                </td>
                <td className="border border-gray-500 px-1 py-0.5 text-center font-semibold w-20">
                  RETENUES
                </td>
              </tr>
            </thead>

            <tbody>
              {/* ── 01 — Salaire de base ── */}
              <tr>
                <Td className="text-center">01</Td>
                <Td>Salaire Catégoriel</Td>
                <Td right>{n(brut)}</Td>
                <Td right>{jours},00</Td>
                <Td right>{n(brut)}</Td>
                <Td /><Td /><Td />
              </tr>

              {/* Lignes vides pour primes supplémentaires */}
              {[2, 3, 4, 5, 6, 7, 8].map((i) => (
                <EmptyRow key={i} />
              ))}

              {/* ── 30 — Total brut ── */}
              <tr className="border-t-2 border-gray-700">
                <Td className="text-center" bold>30</Td>
                <Td bold>Total brut</Td>
                <Td />
                <Td />
                <Td right bold>{n(brut)}</Td>
                <Td /><Td /><Td />
              </tr>

              {/* ── 31 — Brut fiscal employé ── */}
              <tr>
                <Td className="text-center">31</Td>
                <Td>Brut fiscal employé</Td>
                <Td right>{n(brut)}</Td>
                <Td /><Td /><Td /><Td /><Td />
              </tr>

              {/* ── 32 — Brut fiscal employeur ── */}
              <tr>
                <Td className="text-center">32</Td>
                <Td>Brut fiscal employeur</Td>
                <Td right>{n(brut)}</Td>
                <Td /><Td /><Td /><Td /><Td />
              </tr>

              {/* ── 33 — Brut social ── */}
              <tr>
                <Td className="text-center">33</Td>
                <Td>Brut social</Td>
                <Td right>{n(brut)}</Td>
                <Td /><Td /><Td /><Td /><Td />
              </tr>

              {/* Ligne vide */}
              <EmptyRow />

              {/* ── 34 — ITS ── */}
              <tr>
                <Td className="text-center">34</Td>
                <Td>ITS, Imp. sur Trait. et Sal.</Td>
                <Td right>{n(brut)}</Td>
                <Td />
                <Td />
                <Td right>{n(its)}</Td>
                <Td />
                <Td />
              </tr>

              {/* ── 35 — CNPS Retraite ── */}
              <tr>
                <Td className="text-center">35</Td>
                <Td>CNPS, Régime de Retraite</Td>
                <Td right>{n(baseCNPS)}</Td>
                <Td right>{taux(TAUX_CNPS_RETRAITE_SALARIE * 100)}</Td>
                <Td />
                <Td right>{n(cnps_retraite_sal)}</Td>
                <Td right>7,70</Td>
                <Td right>{n(cnps_retraite_pat)}</Td>
              </tr>

              {/* ── 36 — CNPS Accident Travail ── */}
              <tr>
                <Td className="text-center">36</Td>
                <Td>CNPS, Accident Travail</Td>
                <Td right>{n(cnps_at_base)}</Td>
                <Td /><Td /><Td />
                <Td right>3,00</Td>
                <Td right>{n(cnps_at_mp)}</Td>
              </tr>

              {/* ── 37 — CNPS Prestations Familiales + Maternité ── */}
              <tr>
                <Td className="text-center">37</Td>
                <Td>CNPS, Prest. Famil.</Td>
                <Td right>{n(cnps_famil_base)}</Td>
                <Td /><Td /><Td />
                <Td right>5,75</Td>
                <Td right>{n(cnps_famil_mat)}</Td>
              </tr>

              {/* ── 38 — FDFP Taxe Apprentissage ── */}
              <tr>
                <Td className="text-center">38</Td>
                <Td>FDFP, Taxe Apprentissage</Td>
                <Td right>{n(brut)}</Td>
                <Td /><Td /><Td />
                <Td right>0,40</Td>
                <Td right>{n(fdfp_ta)}</Td>
              </tr>

              {/* ── 39 — FDFP Taxe Formation Continue ── */}
              <tr>
                <Td className="text-center">39</Td>
                <Td>FDFP, Taxe Form. Continue</Td>
                <Td right>{n(brut)}</Td>
                <Td /><Td /><Td />
                <Td right>0,60</Td>
                <Td right>{n(fdfp_tfc)}</Td>
              </tr>

              {/* ── 43 — CMU ── */}
              <tr>
                <Td className="text-center">43</Td>
                <Td>CMU (CNAM)</Td>
                <Td />
                <Td />
                <Td />
                <Td right>{n(cmu_sal)}</Td>
                <Td />
                <Td right>{n(cmu_pat)}</Td>
              </tr>

              {/* Autres retenues si présentes */}
              {autresRetenues > 0 && (
                <tr>
                  <Td className="text-center">44</Td>
                  <Td>Autres retenues</Td>
                  <Td />
                  <Td />
                  <Td />
                  <Td right>{n(autresRetenues)}</Td>
                  <Td />
                  <Td />
                </tr>
              )}
              {avances > 0 && (
                <tr>
                  <Td className="text-center">45</Td>
                  <Td>Avances / Acomptes</Td>
                  <Td />
                  <Td />
                  <Td />
                  <Td right>{n(avances)}</Td>
                  <Td />
                  <Td />
                </tr>
              )}

              {/* Ligne vide */}
              <EmptyRow />

              {/* ── Ligne totaux colonnes ── */}
              <tr className="border-t-2 border-gray-700 bg-gray-50">
                <Td /><Td /><Td />
                <Td />
                <Td right bold>{n(brut)}</Td>
                <Td right bold>{n(total_retenues_sal)}</Td>
                <Td />
                <Td right bold>{n(total_retenues_pat)}</Td>
              </tr>

              {/* ── 50 — NET À PAYER ── */}
              <tr className="border-t-2 border-gray-900 bg-gray-100">
                <Td className="text-center" bold>50</Td>
                <td
                  colSpan={5}
                  className="border border-gray-500 px-2 py-1 font-bold text-[12px] uppercase"
                >
                  NET À PAYER :
                </td>
                <Td />
                <Td right bold className="text-[13px]">
                  {n(net_a_payer)}
                </Td>
              </tr>

              {/* ── Arrondi ── */}
              <tr>
                <Td /><Td className="italic text-gray-500">Arrondi :</Td>
                <Td /><Td /><Td /><Td /><Td /><Td />
              </tr>
            </tbody>
          </table>

          {/* ── BARRE PÉRIODE / PAIEMENT ──────────────────────────────────── */}
          <div className="flex gap-6 border border-gray-400 mt-1 px-3 py-1 text-[9.5px] bg-gray-50">
            <span>
              Période du{" "}
              <span className="font-semibold">{periodeDebut(bulletin.periode)}</span> au{" "}
              <span className="font-semibold">{periodeFin(bulletin.periode)}</span>
            </span>
            <span>
              Date de paie :{" "}
              <span className="font-semibold">{periodeFin(bulletin.periode)}</span>
            </span>
            <span>
              Mode de paie : <span className="font-semibold">Virement</span>
            </span>
          </div>

          {/* ── CUMULS ────────────────────────────────────────────────────── */}
          <table className="w-full border-collapse text-[9px] mt-2">
            <thead>
              <tr className="bg-gray-100">
                <td
                  rowSpan={2}
                  className="border border-gray-400 px-1 py-0.5 font-bold text-center w-14"
                >
                  CUMULS
                </td>
                <td
                  colSpan={2}
                  className="border border-gray-400 px-1 py-0.5 text-center font-semibold"
                >
                  Heures
                </td>
                <td
                  colSpan={2}
                  className="border border-gray-400 px-1 py-0.5 text-center font-semibold"
                >
                  Congés
                </td>
                <td className="border border-gray-400 px-1 py-0.5 text-center font-semibold">
                  Brut social
                </td>
                <td className="border border-gray-400 px-1 py-0.5 text-center font-semibold">
                  Brut fiscal
                </td>
                <td className="border border-gray-400 px-1 py-0.5 text-center font-semibold">
                  ITS
                </td>
                <td className="border border-gray-400 px-1 py-0.5 text-center font-semibold">
                  Retraite
                </td>
                <td
                  rowSpan={2}
                  className="border border-gray-400 px-1 py-0.5 text-center font-semibold"
                >
                  Emargement
                </td>
              </tr>
              <tr className="bg-gray-100">
                <td className="border border-gray-400 px-1 py-0.5 text-center">pris</td>
                <td className="border border-gray-400 px-1 py-0.5 text-center">acquis</td>
                <td className="border border-gray-400 px-1 py-0.5 text-center">pris</td>
                <td className="border border-gray-400 px-1 py-0.5 text-center">à Prendre</td>
                <td className="border border-gray-400 px-1" />
                <td className="border border-gray-400 px-1" />
                <td className="border border-gray-400 px-1" />
                <td className="border border-gray-400 px-1" />
              </tr>
            </thead>
            <tbody>
              {/* Période courante */}
              <tr>
                <td className="border border-gray-400 px-1 py-0.5 font-semibold text-center">
                  Période
                </td>
                <td className="border border-gray-400 px-1 py-0.5 text-right">173,33</td>
                <td className="border border-gray-400 px-1" />
                <td className="border border-gray-400 px-1" />
                <td className="border border-gray-400 px-1" />
                <td className="border border-gray-400 px-1 py-0.5 text-right">{n(brut)}</td>
                <td className="border border-gray-400 px-1 py-0.5 text-right">{n(brut)}</td>
                <td className="border border-gray-400 px-1 py-0.5 text-right">{n(its)}</td>
                <td className="border border-gray-400 px-1 py-0.5 text-right">{n(cnps_retraite_sal)}</td>
                <td className="border border-gray-400 px-1" />
              </tr>
              {/* Cumul année */}
              <tr>
                <td className="border border-gray-400 px-1 py-0.5 font-semibold text-center">
                  Année
                </td>
                <td className="border border-gray-400 px-1 py-0.5 text-right">
                  {n(173.33 * nbMois)}
                </td>
                <td className="border border-gray-400 px-1" />
                <td className="border border-gray-400 px-1" />
                <td className="border border-gray-400 px-1" />
                <td className="border border-gray-400 px-1 py-0.5 text-right">{n(cumBrutSocial)}</td>
                <td className="border border-gray-400 px-1 py-0.5 text-right">{n(cumBrutSocial)}</td>
                <td className="border border-gray-400 px-1 py-0.5 text-right">{n(cumIts)}</td>
                <td className="border border-gray-400 px-1 py-0.5 text-right">{n(cumCnps - CMU_MENSUEL * nbMois)}</td>
                <td className="border border-gray-400 px-1" />
              </tr>
            </tbody>
          </table>

          {/* ── PIED DE PAGE ──────────────────────────────────────────────── */}
          <p className="text-center text-[8.5px] text-gray-500 mt-3 border-t border-gray-200 pt-2">
            Pour vous aider à faire valoir vos droits, conservez ce bulletin sans limitation de durée.
            &nbsp;|&nbsp;
            ITS : Barème CGI CI Art. 116 — CNPS retraite : 6,30% sal. / 7,70% pat. — CMU : forfait {n(CMU_MENSUEL)} FCFA/mois
          </p>

        </div>
      </div>
    </div>
  );
}
