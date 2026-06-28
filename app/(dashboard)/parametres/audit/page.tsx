import { AuditLogTable } from "@/components/rh/AuditLogTable";
import { PageShell, PageHeader } from "@/components/ui/page-shell";

export const metadata = { title: "Journal d'audit — RH Manager CI" };

export default function AuditPage() {
  return (
    <PageShell>
      <PageHeader
        title="Journal d'audit"
        description="Historique complet des actions effectuées sur la plateforme"
      />

      <div className="max-w-6xl">
        <AuditLogTable />
      </div>
    </PageShell>
  );
}
