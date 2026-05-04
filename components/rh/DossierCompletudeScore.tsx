"use client";

interface Document {
  type: string;
  name: string;
}

interface Props {
  employeeId: string;
  documents: Document[];
  hasContract: boolean;
  hasMedicalExam: boolean;
  hasEvaluation: boolean;
  size?: "sm" | "md" | "lg";
}

interface ScoreItem {
  label: string;
  points: number;
  met: boolean;
}

function computeScore(
  documents: Document[],
  hasContract: boolean,
  hasMedicalExam: boolean,
  hasEvaluation: boolean
): ScoreItem[] {
  const familles = documents.map((d) => (d.type ?? "").toLowerCase());

  const hasIdentity = familles.some(
    (f) => f.includes("cni") || f.includes("passeport") || f.includes("identit")
  );
  const hasCV = familles.some((f) => f.includes("cv"));
  const hasPhoto = familles.some(
    (f) => f.includes("photo") || f.includes("portrait")
  );
  const hasDiploma = familles.some(
    (f) =>
      f.includes("diplôme") ||
      f.includes("diplome") ||
      f.includes("formation") ||
      f.includes("certificat")
  );

  return [
    { label: "Pièce d'identité (CNI / Passeport)", points: 20, met: hasIdentity },
    { label: "Contrat de travail signé",            points: 20, met: hasContract },
    { label: "CV",                                  points: 10, met: hasCV },
    { label: "Photo",                               points: 10, met: hasPhoto },
    { label: "Visite médicale à jour",              points: 15, met: hasMedicalExam },
    { label: "Évaluation réalisée",                 points: 15, met: hasEvaluation },
    { label: "Diplômes / Formations",               points: 10, met: hasDiploma },
  ];
}

function scoreColor(score: number): {
  bar: string;
  badge: string;
  text: string;
} {
  if (score >= 76)
    return {
      bar: "bg-emerald-500 dark:bg-emerald-400",
      badge: "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700",
      text: "text-emerald-700 dark:text-emerald-300",
    };
  if (score >= 50)
    return {
      bar: "bg-amber-400 dark:bg-amber-400",
      badge: "bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700",
      text: "text-amber-700 dark:text-amber-300",
    };
  return {
    bar: "bg-rose-500 dark:bg-rose-400",
    badge: "bg-rose-50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700",
    text: "text-rose-700 dark:text-rose-300",
  };
}

export function DossierCompletudeScore({
  documents,
  hasContract,
  hasMedicalExam,
  hasEvaluation,
  size = "md",
}: Props) {
  const items = computeScore(documents, hasContract, hasMedicalExam, hasEvaluation);
  const total = items.reduce((acc, i) => acc + (i.met ? i.points : 0), 0);
  const colors = scoreColor(total);
  const missing = items.filter((i) => !i.met);

  if (size === "sm") {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
            style={{ width: `${total}%` }}
          />
        </div>
        <span
          className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${colors.badge}`}
        >
          {total}%
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Complétude du dossier
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Score sur 100 pts — {missing.length} élément{missing.length !== 1 ? "s" : ""} manquant
            {missing.length !== 1 ? "s" : ""}
          </p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center rounded-full border px-3 py-1 text-base font-bold ${colors.badge}`}
        >
          {total}%
        </span>
      </div>

      {/* Barre de progression */}
      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
          style={{ width: `${total}%` }}
        />
      </div>

      {/* Liste des éléments manquants */}
      {missing.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Manquants
          </p>
          {(size === "md" ? missing.slice(0, 3) : missing).map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
              {item.label}
              <span className="ml-auto font-semibold text-rose-400">−{item.points} pts</span>
            </div>
          ))}
          {size === "md" && missing.length > 3 && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              + {missing.length - 3} autre{missing.length - 3 > 1 ? "s" : ""}…
            </p>
          )}
        </div>
      )}

      {total === 100 && (
        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          Dossier complet
        </p>
      )}
    </div>
  );
}
