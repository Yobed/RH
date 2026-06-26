export const dynamic = "force-dynamic";
import { createServerClient } from "@/lib/supabase/server";
import { OrgChart } from "@/components/rh/OrgChart";
import { PageHelp } from "@/components/rh/PageHelp";
import { GitFork, Users } from "lucide-react";

export const metadata = { title: "Organigramme — RH Manager CI" };

export default async function OrganigrammePage() {
  const supabase = createServerClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, poste, departement, manager_id, statut")
    .neq("statut", "inactif")
    .order("full_name");

  const total = employees?.length ?? 0;
  const avecManager = employees?.filter(e => e.manager_id).length ?? 0;
  const sansManager = total - avecManager;

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitFork className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold font-heading">Organigramme</h1>
            <PageHelp text="La structure hiérarchique de l'entreprise, construite à partir du lien manager (N+1) renseigné sur chaque fiche salarié." />
          </div>
          <p className="text-sm text-slate-500">
            Structure hiérarchique de l'entreprise — cliquez sur{" "}
            <span className="inline-flex items-center gap-1 font-medium text-slate-600">
              <Users size={12} /> pour assigner un supérieur
            </span>
          </p>
        </div>

        {/* KPIs */}
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-2xl font-bold text-slate-800">{total}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Collaborateurs</p>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div>
            <p className="text-2xl font-bold text-emerald-600">{avecManager}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Avec supérieur</p>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div>
            <p className="text-2xl font-bold text-amber-500">{sansManager}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Racines</p>
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-3 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" /> Collaborateur
        </span>
        <span className="text-slate-300">·</span>
        <span>Survolez une carte pour modifier son supérieur hiérarchique</span>
        <span className="text-slate-300">·</span>
        <span>Cliquez sur "N rapports" pour replier/déplier</span>
      </div>

      {/* Arbre */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm min-h-64 p-6 overflow-auto">
        <OrgChart employees={employees ?? []} />
      </div>
    </div>
  );
}
