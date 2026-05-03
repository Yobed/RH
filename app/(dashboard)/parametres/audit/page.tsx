import { AuditLogTable } from "@/components/rh/AuditLogTable";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata = { title: "Journal d'audit — RH Manager CI" };

export default function AuditPage() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="space-y-1">
        <Breadcrumbs />
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[oklch(0.175_0.04_248)] shadow-sm">
            <svg className="h-5 w-5 text-[oklch(0.78_0.13_73)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Journal d'audit</h1>
            <p className="text-sm text-slate-600">Historique complet des actions effectuées sur la plateforme</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl">
        <AuditLogTable />
      </div>
    </div>
  );
}
