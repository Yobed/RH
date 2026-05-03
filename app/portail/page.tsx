import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { requirePortailContext } from "@/lib/portail";
import { calculerJoursAcquis, calculerSoldeConges } from "@/lib/conges-ci";
import { format, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, CalendarDays, UserCircle, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portail salarié — RH Manager CI" };

const fcfa = (n: number): string =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n ?? 0);

export default async function PortailHome() {
  const ctx = await requirePortailContext();
  const supabase = createServerClient();
  const year = new Date().getFullYear();

  const [{ data: emp }, { data: latestBulletin }, { data: pendingLeaves }] = await Promise.all([
    supabase
      .from("employees")
      .select("full_name, matricule, poste, departement, date_embauche, type_contrat, salaire_brut")
      .eq("id", ctx.employeeId)
      .single(),
    supabase
      .from("bulletins_paie")
      .select("periode, salaire_brut, salaire_net, net_to_pay")
      .eq("employee_id", ctx.employeeId)
      .order("periode", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("conges")
      .select("id, type, date_debut, date_fin, nb_jours, statut")
      .eq("employee_id", ctx.employeeId)
      .in("statut", ["en_attente", "soumis"])
      .order("date_debut", { ascending: true }),
  ]);

  // Solde de congés
  const { data: balance } = await supabase
    .from("leave_balances")
    .select("jours_acquis, jours_pris, solde, annee")
    .eq("employee_id", ctx.employeeId)
    .eq("annee", year)
    .maybeSingle();

  const joursAcquis = balance?.jours_acquis ?? calculerJoursAcquis(emp?.date_embauche ?? null, year);
  const joursPris = balance?.jours_pris ?? 0;
  const soldeConges = balance?.solde ?? calculerSoldeConges(joursAcquis, joursPris);

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
          Bonjour
        </p>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">
          {emp?.full_name ?? "Salarié"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-snug">
          {emp?.poste ?? "—"}
          {emp?.departement ? ` · ${emp.departement}` : ""}
          {emp?.type_contrat ? ` · ${emp.type_contrat}` : ""}
          {emp?.date_embauche
            ? ` · embauché le ${format(new Date(emp.date_embauche), "d MMMM yyyy", { locale: fr })}`
            : ""}
        </p>
      </header>

      {/* Cartes synthèse */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card
          title="Solde de congés"
          value={`${soldeConges.toFixed(1)} j`}
          sub={`${joursAcquis.toFixed(1)} acquis · ${joursPris.toFixed(1)} pris`}
          href="/portail/conges"
          icon={CalendarDays}
        />
        <Card
          title="Dernier bulletin"
          value={latestBulletin ? fcfa(Number(latestBulletin.net_to_pay ?? latestBulletin.salaire_net ?? 0)) : "—"}
          sub={latestBulletin ? `Net ${latestBulletin.periode}` : "Aucun bulletin"}
          href="/portail/bulletins"
          icon={FileText}
        />
        <Card
          title="Demandes en attente"
          value={(pendingLeaves ?? []).length.toString()}
          sub="À valider par le service RH"
          href="/portail/conges"
          icon={CalendarDays}
        />
      </section>

      {/* Mes infos */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Mes informations</h2>
          <Link href="/portail/profil" className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
            Modifier <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 p-4 sm:p-5">
          <Info label="Matricule" value={emp?.matricule ?? "—"} />
          <Info label="Poste" value={emp?.poste ?? "—"} />
          <Info label="Département" value={emp?.departement ?? "—"} />
          <Info label="Type de contrat" value={emp?.type_contrat ?? "—"} />
        </dl>
      </section>

      {/* Demandes en attente */}
      {pendingLeaves && pendingLeaves.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Demandes en cours de validation</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {pendingLeaves.map((l) => (
              <li key={l.id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 capitalize">{l.type}</p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    Du {format(new Date(l.date_debut), "d MMM", { locale: fr })}{" "}
                    au {format(new Date(l.date_fin), "d MMM yyyy", { locale: fr })} · {l.nb_jours} j
                  </p>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  En attente
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Card({
  title, value, sub, href, icon: Icon,
}: {
  title: string;
  value: string;
  sub: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 hover:border-slate-300 transition-colors flex flex-col gap-1"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-500 font-medium">{title}</p>
        <Icon className="h-3.5 w-3.5 text-slate-400" />
      </div>
      <p className="text-xl sm:text-2xl font-semibold text-slate-900 tabular-nums leading-tight">{value}</p>
      <p className="text-[11px] text-slate-500 leading-snug">{sub}</p>
    </Link>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</dt>
      <dd className="text-sm font-medium text-slate-900 mt-0.5 truncate">{value}</dd>
    </div>
  );
}
