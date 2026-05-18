export const dynamic = 'force-dynamic';
import Link from "next/link";
import { ArrowLeft, FileText, ExternalLink } from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";
import { SoldeToutCompteForm } from "@/components/rh/SoldeToutCompteForm";
import { safeFormatDate } from "@/lib/paie-ci";

export const metadata = { title: "Fin de contrat — RH Manager CI" };

interface ArchiveDocument {
  id: string;
  name: string;
  file_url: string;
  created_at: string | null;
  employees?: { full_name: string | null; matricule: string | null } | null;
}

export default async function FinDeContratPage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string }>;
}) {
  const supabase = createServerClient();
  const params = await searchParams;
  const defaultEmployeeId = params?.employeeId;

  const [
    { data: employees },
    { data: company },
    { data: archivedSTCs },
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, matricule, salaire_brut, type_contrat, date_embauche")
      .eq("statut", "actif")
      .order("full_name"),
    supabase.from("companies").select("*").limit(1).maybeSingle(),
    supabase
      .from("documents")
      .select("id, name, file_url, created_at, employees(full_name, matricule)")
      .eq("famille", "Paie")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const archives = ((archivedSTCs as ArchiveDocument[] | null) ?? [])
    .filter(d => d.name?.includes("Solde de Tout Compte"));

  return (
    <div className="p-3 sm:p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="pb-4 border-b border-slate-200">
        <Link href="/paie" className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5">
          <ArrowLeft className="h-3 w-3" /> Retour à la paie
        </Link>
        <div className="mt-1.5 sm:mt-2 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">Module Paie · Art. 25.1</p>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">Fin de contrat</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-1.5 leading-snug max-w-2xl">
              Calcul, simulation et archivage du solde de tout compte selon le Code du travail ivoirien.
            </p>
          </div>
          <Link
            href="/offboarding"
            className="self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 inline-flex items-center gap-1.5 transition-colors"
          >
            Checklist de restitution
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </header>

      {/* ── Calculateur ─────────────────────────────────────────────── */}
      <SoldeToutCompteForm
        employees={employees || []}
        defaultEmployeeId={defaultEmployeeId}
        company={company}
      />

      {/* ── Historique ──────────────────────────────────────────────── */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Historique des STC archivés</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {archives.length} document{archives.length > 1 ? "s" : ""} dans le dossier du personnel
              </p>
            </div>
          </div>
        </div>

        {archives.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <FileText className="h-7 w-7 text-slate-300 mx-auto mb-2.5" />
            <p className="text-sm font-medium text-slate-700">Aucun STC archivé</p>
            <p className="text-xs text-slate-500 mt-1">Les soldes de tout compte générés apparaîtront ici.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {archives.map(doc => (
              <li key={doc.id} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-500 shrink-0">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {doc.employees?.full_name || "Salarié inconnu"}
                    </p>
                    <p className="text-[11px] text-slate-500 tabular-nums">
                      {doc.employees?.matricule ? `${doc.employees.matricule} · ` : ""}
                      Archivé le <span suppressHydrationWarning>{safeFormatDate(doc.created_at, "dd MMM yyyy")}</span>
                    </p>
                  </div>
                </div>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 shrink-0"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span className="hidden sm:inline">Ouvrir</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
