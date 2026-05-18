import { createServerClient } from "@/lib/supabase/server";
import { requirePortailContext } from "@/lib/portail";
import {
  ShieldCheck, FileText, Lock, Download, Calendar,
  CheckCircle, Archive,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Coffre-fort numérique — Portail salarié" };

interface DocItem {
  id: string;
  name: string;
  category: string;
  url: string;
  date: string;
  size?: number | null;
  source: "ged" | "bulletin" | "attestation";
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-CI", { day: "numeric", month: "short", year: "numeric" });
}

export default async function CoffreFortPage() {
  const ctx = await requirePortailContext();
  const supabase = createServerClient();

  const [bulletinsRes, documentsRes, generatedRes] = await Promise.all([
    supabase
      .from("bulletins_paie")
      .select("id, periode, salaire_net, net_to_pay, created_at")
      .eq("employee_id", ctx.employeeId)
      .order("periode", { ascending: false }),
    supabase
      .from("documents")
      .select("id, name, famille, file_url, file_size_kb, created_at")
      .eq("employee_id", ctx.employeeId)
      .order("created_at", { ascending: false }),
    supabase
      .from("generated_documents")
      .select("id, doc_type, reference, fichier_url, created_at")
      .eq("employee_id", ctx.employeeId)
      .order("created_at", { ascending: false }),
  ]);

  const items: DocItem[] = [];

  (bulletinsRes.data ?? []).forEach((b) => {
    items.push({
      id: `bul-${b.id}`,
      name: `Bulletin de paie — ${b.periode}`,
      category: "Bulletins de paie",
      url: `/api/paie/${b.id}/print`,
      date: b.created_at ?? b.periode,
      source: "bulletin",
    });
  });

  (documentsRes.data ?? []).forEach((d) => {
    items.push({
      id: `doc-${d.id}`,
      name: d.name,
      category: d.famille ?? "Documents personnels",
      url: d.file_url,
      date: d.created_at ?? "",
      size: d.file_size_kb,
      source: "ged",
    });
  });

  (generatedRes.data ?? []).forEach((g) => {
    items.push({
      id: `gen-${g.id}`,
      name: `${g.doc_type} ${g.reference ? `— ${g.reference}` : ""}`.trim(),
      category: "Attestations & certificats",
      url: g.fichier_url ?? "#",
      date: g.created_at ?? "",
      source: "attestation",
    });
  });

  // Grouper par catégorie
  const byCategory: Record<string, DocItem[]> = {};
  items.forEach((i) => {
    if (!byCategory[i.category]) byCategory[i.category] = [];
    byCategory[i.category].push(i);
  });

  const totalDocs = items.length;
  const years = new Set(items.map((i) => i.date ? new Date(i.date).getFullYear() : null).filter(Boolean));

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <header className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Coffre-fort numérique
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              Tous vos documents personnels en un endroit sécurisé — bulletins, contrats, attestations.
              Conservés à long terme.
            </p>
          </div>
        </div>
      </header>

      {/* Bandeau confiance */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-violet-50/40 p-5">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-indigo-600 shrink-0" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-700">Espace personnel et sécurisé</p>
            <p className="mt-0.5">
              Vos documents sont archivés conformément à la législation ivoirienne et restent accessibles
              même après votre départ de la société.
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
            <Archive className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Documents</p>
            <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">{totalDocs}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Années</p>
            <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">{years.size}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
            <CheckCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Catégories</p>
            <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">{Object.keys(byCategory).length}</p>
          </div>
        </div>
      </div>

      {/* Listes par catégorie */}
      {totalDocs === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-16 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Votre coffre-fort est vide</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Vos documents apparaîtront ici au fur et à mesure de leur édition par votre service RH.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(byCategory).map(([category, docs]) => (
            <section key={category}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                  {category}
                </h2>
                <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  {docs.length}
                </span>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden">
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {docs.map((doc) => (
                    <li key={doc.id}>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        <div className="shrink-0 h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                          <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                            {doc.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">{formatDate(doc.date)}</span>
                            {doc.size && (
                              <>
                                <span className="text-[10px] text-slate-300 dark:text-slate-600">·</span>
                                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                  {doc.size} Ko
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <Download className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
