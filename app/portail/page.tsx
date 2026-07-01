import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { requirePortailContext } from "@/lib/portail";
import { calculerJoursAcquis, calculerSoldeConges } from "@/lib/conges-ci";
import { format, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, CalendarDays, ArrowRight } from "lucide-react";
import { PointageWidget } from "@/components/portail/PointageWidget";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portail salarié — RH Manager CI" };

const fcfa = (n: number): string =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n ?? 0);

export default async function PortailHome() {
  const ctx = await requirePortailContext();
  const supabase = createServerClient();
  const year = new Date().getFullYear();

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: emp }, { data: latestBulletin }, { data: pendingLeaves }, { data: todayEntries }] = await Promise.all([
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
    supabase
      .from("time_entries")
      .select("id, clock_in, clock_out, worked_minutes")
      .eq("employee_id", ctx.employeeId)
      .eq("date", today)
      .order("clock_in", { ascending: true }),
  ]);

  const activeEntry = (todayEntries ?? []).find((e) => !e.clock_out) ?? null;
  const todayMinutes = (todayEntries ?? [])
    .filter((e) => e.worked_minutes)
    .reduce((sum, e) => sum + (e.worked_minutes ?? 0), 0);

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
      {/* Héro salarié — bandeau aubergine + solde de congés en évidence */}
      <section
        className="relative overflow-hidden rounded-2xl p-6 text-white shadow-[0_18px_40px_-22px_rgba(238,127,3,0.7)] sm:p-7"
        style={{ background: "linear-gradient(135deg, #ee7f03 0%, #d67002 55%, #b35c00 100%)" }}
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/4 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60 capitalize">
              {format(new Date(), "EEEE d MMMM", { locale: fr })}
            </p>
            <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Bonjour, {emp?.full_name?.split(" ")[0] ?? "Salarié"} 👋
            </h1>
            <p className="mt-1.5 text-sm text-white/70">
              {emp?.poste ?? "—"}
              {emp?.departement ? ` · ${emp.departement}` : ""}
              {emp?.type_contrat ? ` · ${emp.type_contrat}` : ""}
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-center backdrop-blur-sm">
            <p className="font-display text-3xl font-bold leading-none tabular-nums">{soldeConges.toFixed(1)}</p>
            <p className="mt-1 text-[11px] font-medium text-white/70">jours de congés</p>
          </div>
        </div>
      </section>

      {/* Pointage */}
      <PointageWidget
        active={activeEntry ? { id: activeEntry.id, clock_in: activeEntry.clock_in } : null}
        todayMinutes={todayMinutes}
      />

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
      <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Mes informations</h2>
          <Link href="/portail/profil" className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 inline-flex items-center gap-1">
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
        <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <div className="px-4 sm:px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Demandes en cours de validation</h2>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingLeaves.map((l) => (
              <li key={l.id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">{l.type}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    Du {format(new Date(l.date_debut), "d MMM", { locale: fr })}{" "}
                    au {format(new Date(l.date_fin), "d MMM yyyy", { locale: fr })} · {l.nb_jours} j
                  </p>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
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
      className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#ee7f03]/40 hover:shadow-[0_12px_28px_-16px_rgba(238,127,3,0.45)] dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ee7f03]/10 text-[#ee7f03] transition-colors group-hover:bg-[#ee7f03] group-hover:text-white">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div>
        <p className="font-display text-2xl font-bold leading-none tabular-nums text-slate-900 dark:text-white">{value}</p>
        <p className="mt-1.5 text-[12px] text-slate-500 dark:text-slate-400">{sub}</p>
      </div>
    </Link>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">{label}</dt>
      <dd className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5 truncate">{value}</dd>
    </div>
  );
}
