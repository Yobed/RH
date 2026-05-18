import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { CareerTimeline, type CareerEvent } from "@/components/rh/CareerTimeline";
import { Briefcase, Trophy, GraduationCap, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon parcours — Portail salarié" };

export default async function PortailParcoursPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("employee_id, role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "salarie" || !profile.employee_id) {
    redirect("/login");
  }

  const [{ data: employee }, { data: events }] = await Promise.all([
    supabase
      .from("employees")
      .select("full_name, matricule, poste, departement, date_embauche, manager_id")
      .eq("id", profile.employee_id)
      .single(),
    supabase
      .from("career_events")
      .select("id, event_type, date_event, description, old_value, new_value")
      .eq("employee_id", profile.employee_id)
      .order("date_event", { ascending: false }),
  ]);

  const allEvents = (events ?? []) as CareerEvent[];

  // Métriques rapides
  const anciennete = employee?.date_embauche
    ? Math.floor((Date.now() - new Date(employee.date_embauche).getTime()) / (365.25 * 24 * 3600 * 1000) * 10) / 10
    : null;

  const counts = allEvents.reduce<Record<string, number>>((acc, e) => {
    const t = e.event_type.toLowerCase();
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
          Mon parcours
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Historique complet de votre carrière au sein de l'entreprise.
        </p>
      </div>

      {/* Bandeau profil */}
      {employee && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                Poste actuel
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-50 mt-0.5">
                {employee.poste}
                {employee.departement && (
                  <span className="text-slate-500 font-normal"> · {employee.departement}</span>
                )}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                {employee.matricule}
              </p>
            </div>
            {anciennete !== null && (
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                  Ancienneté
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                  {anciennete}
                  <span className="text-base text-slate-500 font-normal"> ans</span>
                </p>
                {employee.date_embauche && (
                  <p className="text-xs text-slate-500">
                    Depuis le{" "}
                    {new Date(employee.date_embauche).toLocaleDateString("fr-CI", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPIs événements */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Promotions" value={counts.promotion ?? 0} icon={<Trophy className="h-4 w-4 text-emerald-600" />} />
        <Stat label="Formations" value={counts.formation ?? 0} icon={<GraduationCap className="h-4 w-4 text-purple-600" />} />
        <Stat label="Mutations" value={counts.mutation ?? 0} icon={<MapPin className="h-4 w-4 text-blue-600" />} />
        <Stat label="Total événements" value={allEvents.length} icon={<Briefcase className="h-4 w-4 text-slate-600" />} />
      </div>

      {/* Timeline */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3 uppercase tracking-wider">
          Chronologie
        </h2>
        <CareerTimeline events={allEvents} />
      </section>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">
      <div className="flex items-center gap-1.5 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
        {icon}
        {value}
      </div>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-0.5">
        {label}
      </p>
    </div>
  );
}
