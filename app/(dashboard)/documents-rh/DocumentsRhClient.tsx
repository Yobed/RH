"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FileText, Download, Search, Stamp, FileBadge, FileCheck2 } from "lucide-react";
import { toast } from "sonner";

interface Employee {
  id: string;
  full_name: string;
  matricule: string;
  poste: string | null;
  statut: string | null;
}

interface HistoryEntry {
  id: string;
  employee_id: string | null;
  doc_type: string;
  reference: string | null;
  created_at: string | null;
  employees?: { full_name?: string | null; matricule?: string | null } | null;
}

type DocType = "certificat_travail" | "attestation_travail" | "attestation_salaire" | "dpae";

const DOC_TYPES: Array<{
  value: DocType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  legalRef: string;
}> = [
  {
    value: "dpae",
    title: "DPAE — Déclaration préalable",
    description: "À transmettre à la CNPS dans les 8 jours suivant l'embauche.",
    icon: Stamp,
    legalRef: "Art. 33 CT-CI",
  },
  {
    value: "certificat_travail",
    title: "Certificat de travail",
    description: "Document obligatoire à remettre au salarié à la fin du contrat.",
    icon: FileBadge,
    legalRef: "Art. 16.3 CT-CI",
  },
  {
    value: "attestation_travail",
    title: "Attestation de travail",
    description: "Atteste de l'emploi en cours pour visa, banque, locataire.",
    icon: FileCheck2,
    legalRef: "Sur demande du salarié",
  },
  {
    value: "attestation_salaire",
    title: "Attestation de salaire",
    description: "Confirme le salaire pour démarches bancaires ou administratives.",
    icon: FileText,
    legalRef: "Sur demande du salarié",
  },
];

const DOC_LABELS: Record<DocType, string> = {
  certificat_travail: "Certificat de travail",
  attestation_travail: "Attestation de travail",
  attestation_salaire: "Attestation de salaire",
  dpae: "DPAE",
};

interface Props {
  employees: Employee[];
  history: HistoryEntry[];
}

export function DocumentsRhClient({ employees, history }: Props) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [search, setSearch] = useState("");
  const [docType, setDocType] = useState<DocType>("certificat_travail");
  const [generating, setGenerating] = useState(false);

  const filteredEmployees = useMemo<Employee[]>(() => {
    const q = search.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.full_name.toLowerCase().includes(q) ||
        e.matricule.toLowerCase().includes(q)
    );
  }, [employees, search]);

  const selectedEmployee = useMemo<Employee | undefined>(
    () => employees.find((e) => e.id === employeeId),
    [employees, employeeId]
  );

  async function handleGenerate(): Promise<void> {
    if (!employeeId) {
      toast.error("Sélectionnez un salarié.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/documents/generer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId, doc_type: docType }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Erreur");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${docType}_${selectedEmployee?.matricule ?? "doc"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${DOC_LABELS[docType]} généré.`);
      router.refresh();
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-700" />
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
            Centre des documents
          </p>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">Documents RH</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl leading-snug">
          Génération automatique des documents légaux et administratifs : DPAE,
          certificat de travail, attestations. Tout est pré-rempli à partir du
          dossier du salarié.
        </p>
      </header>

      {/* Sélection du salarié */}
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">1. Sélectionner un salarié</h2>
        </div>
        <div className="p-4 sm:p-5 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou matricule…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
            />
          </div>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
          >
            <option value="">— Sélectionner —</option>
            {filteredEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name} ({e.matricule}) {e.statut !== "actif" ? `· ${e.statut}` : ""}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Choix du document */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">2. Choisir le document à générer</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DOC_TYPES.map(({ value, title, description, icon: Icon, legalRef }) => {
            const active = docType === value;
            return (
              <button
                key={value}
                onClick={() => setDocType(value)}
                className={[
                  "text-left rounded-lg border p-4 transition-colors flex gap-3",
                  active
                    ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                    : "border-slate-200 bg-white hover:border-slate-300",
                ].join(" ")}
              >
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-md shrink-0 ${active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-snug">{description}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{legalRef}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Action */}
      <section>
        <button
          onClick={handleGenerate}
          disabled={generating || !employeeId}
          className="w-full sm:w-auto h-10 inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-6 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {generating
            ? "Génération…"
            : `Générer ${DOC_LABELS[docType]}${selectedEmployee ? ` pour ${selectedEmployee.full_name}` : ""}`}
        </button>
      </section>

      {/* Historique */}
      <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Historique des documents générés</h2>
          <p className="text-xs text-slate-500 mt-0.5">{history.length} document(s) archivés</p>
        </div>
        {history.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-7 w-7 text-slate-300 mx-auto mb-2.5" />
            <p className="text-sm font-medium text-slate-700">Aucun document généré</p>
            <p className="text-xs text-slate-500 mt-1">L'historique apparaîtra ici dès la première génération.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {history.map((h) => (
              <li key={h.id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-500 shrink-0">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {DOC_LABELS[h.doc_type as DocType] ?? h.doc_type} — {h.employees?.full_name ?? "—"}
                    </p>
                    <p className="text-[11px] text-slate-500 tabular-nums">
                      {h.employees?.matricule ?? ""} · {h.created_at ? new Date(h.created_at).toLocaleString("fr-CI") : "—"}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
