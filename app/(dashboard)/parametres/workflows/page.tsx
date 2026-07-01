import { createServerClient } from "@/lib/supabase/server";
import { WorkflowConfig } from "@/components/rh/WorkflowConfig";
import { GitFork } from "@phosphor-icons/react/dist/ssr";
import { PageShell, PageHeader } from "@/components/ui/page-shell";

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
    <PageShell>
      <PageHeader
        title="Workflows d'approbation"
        description="Configurez les niveaux d'approbation pour chaque module"
      />

      {/* Description */}
      <div className="max-w-2xl rounded-xl border border-[#ee7f03]/20 dark:border-[#b35c00]/40 bg-[#ee7f03]/10 dark:bg-[#b35c00]/20 px-4 py-3">
        <p className="text-[12.5px] text-[#ee7f03] dark:text-[#f8d3a3] leading-relaxed">
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
    </PageShell>
  );
}
