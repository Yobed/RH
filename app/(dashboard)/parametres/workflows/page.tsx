import { createServerClient } from "@/lib/supabase/server";
import { WorkflowConfig } from "@/components/rh/WorkflowConfig";
import { GitFork } from "@phosphor-icons/react/dist/ssr";

export const metadata = { title: "Workflows d'approbation — RH Manager CI" };

type ModuleKey = "conges" | "documents" | "recrutement";

const MODULE_LABELS: Record<ModuleKey, string> = {
  conges: "Absences & Congés",
  documents: "Documents RH",
  recrutement: "Recrutement",
};

const MODULES: ModuleKey[] = ["conges", "documents", "recrutement"];

type NiveauDB = {
  ordre: number;
  role: string;
  delai_heures: number;
};

type WorkflowDB = {
  module: string;
  niveaux: NiveauDB[];
  escalade_auto: boolean;
};

export default async function WorkflowsPage() {
  const supabase = createServerClient();

  const { data: companyId } = await supabase.rpc("get_user_company_id");

  const workflows: WorkflowDB[] = companyId
    ? await supabase
        .from("approval_workflows")
        .select("module, niveaux, escalade_auto")
        .eq("company_id", companyId as string)
        .then(({ data }) => (data as WorkflowDB[]) ?? [])
    : [];

  const workflowByModule = Object.fromEntries(
    workflows.map((w) => [w.module, w])
  ) as Record<string, WorkflowDB>;

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[oklch(0.175_0.04_248)] shadow-sm">
          <GitFork weight="duotone" className="h-5 w-5 text-[oklch(0.78_0.13_73)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Workflows d&apos;approbation
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Configurez les niveaux d&apos;approbation pour chaque module
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="max-w-2xl rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3">
        <p className="text-[12.5px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
          Définissez jusqu&apos;à <strong>3 niveaux</strong> d&apos;approbation par module. L&apos;escalade automatique
          transfère la demande au niveau suivant si le délai expire sans action.
        </p>
      </div>

      {/* Grille des modules */}
      <div className="grid gap-4 max-w-2xl">
        {MODULES.map((mod) => {
          const existing = workflowByModule[mod];
          const niveauxWithIds = (existing?.niveaux ?? []).map((n, i) => ({
            ...n,
            id: `existing-${mod}-${i}`,
            role: n.role as "manager" | "responsable_rh" | "admin" | "directeur",
            delai_heures: n.delai_heures as 24 | 48 | 72,
          }));

          return (
            <WorkflowConfig
              key={mod}
              module={mod}
              moduleLabel={MODULE_LABELS[mod]}
              initialNiveaux={niveauxWithIds}
              initialEscaladeAuto={existing?.escalade_auto ?? true}
            />
          );
        })}
      </div>
    </div>
  );
}
