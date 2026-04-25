"use client";

interface Step {
  number: number;
  label: string;
  description: string;
  legal: string;
  delai?: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    label: "Rédaction & envoi de la demande",
    description: "Le DRH rédige et remet en main propre ou par LRAR la lettre de demande d'explication écrite à l'employé.",
    legal: "Code du Travail CI art. 15.3 — obligation de demande préalable",
    delai: "Jour J",
  },
  {
    number: 2,
    label: "Délai de réponse de l'employé",
    description: "L'employé dispose d'un délai pour fournir ses explications écrites. En l'absence de réponse, l'absence de justification est consignée au dossier.",
    legal: "Délai raisonnable — pratique : 5 jours ouvrables",
    delai: "J + 5 jours ouvrables",
  },
  {
    number: 3,
    label: "Réception & analyse de la réponse",
    description: "Le DRH reçoit et analyse la réponse de l'employé. Si aucune réponse dans les délais, l'absence de justification est retenue.",
    legal: "Art. 15.3 CT CI — droit à la défense garanti",
    delai: "J + 5 à 10 jours",
  },
  {
    number: 4,
    label: "Décision disciplinaire",
    description: "Après analyse, la DRH prend l'une des décisions suivantes : classement sans suite, avertissement, blâme, mise à pied, ou ouverture d'une procédure de licenciement (convocation entretien préalable).",
    legal: "Art. 15 & 16 CT CI — principe de proportionnalité des sanctions",
    delai: "J + 10 à 15 jours",
  },
  {
    number: 5,
    label: "Notification & clôture du dossier",
    description: "La décision est notifiée par écrit à l'employé. Le dossier est archivé. En cas de licenciement, la procédure d'entretien préalable est déclenchée.",
    legal: "Art. 15.4 CT CI — délai de prescription 2 ans (faute non grave)",
    delai: "J + 15 à 20 jours",
  },
];

function getActiveStep(statut: string): number {
  switch (statut) {
    case "OUVERT":      return 1;
    case "EN_ATTENTE":  return 2;
    case "EN_COURS":    return 3;
    case "CLOTURE":     return 5;
    default:            return 1;
  }
}

interface Props {
  statut: string;
  dateIncident?: string | null;
  dateNotification?: string | null;
}

export function DemandeExplicationProcess({ statut, dateIncident, dateNotification }: Props) {
  const activeStep = getActiveStep(statut);

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-[oklch(0.18_0.03_248)] overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="border-b border-slate-100 dark:border-slate-700 px-5 py-4 bg-[oklch(0.175_0.04_248)]">
        <h3 className="text-sm font-bold text-[oklch(0.78_0.13_73)]">
          Processus — Demande d&apos;explication
        </h3>
        <p className="text-[11px] text-[oklch(0.65_0.05_252)] mt-0.5">
          Code du Travail CI art. 15.3 · {STEPS.length} étapes obligatoires
        </p>
      </div>

      {/* Context */}
      {(dateIncident || dateNotification) && (
        <div className="flex flex-wrap gap-4 px-5 py-3 bg-slate-50 dark:bg-[oklch(0.15_0.025_248)] border-b border-slate-100 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-600">
          {dateIncident && (
            <span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Date incident :</span>{" "}
              {new Date(dateIncident).toLocaleDateString("fr-CI", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
          )}
          {dateNotification && (
            <span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Notification :</span>{" "}
              {new Date(dateNotification).toLocaleDateString("fr-CI", { day: "2-digit", month: "2-digit", year: "numeric" })}
            </span>
          )}
        </div>
      )}

      {/* Steps */}
      <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
        {STEPS.map((step) => {
          const isDone = activeStep > step.number;
          const isActive = activeStep === step.number;
          const isPending = activeStep < step.number;

          return (
            <div
              key={step.number}
              className={`flex gap-4 px-5 py-4 transition-colors ${
                isActive
                  ? "bg-amber-50/50 dark:bg-amber-900/10"
                  : isDone
                  ? "bg-white dark:bg-transparent opacity-70"
                  : "bg-white dark:bg-transparent opacity-40"
              }`}
            >
              {/* Step indicator */}
              <div className="shrink-0 flex flex-col items-center gap-1">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    isDone
                      ? "border-emerald-400 bg-emerald-400 text-white"
                      : isActive
                      ? "border-[oklch(0.78_0.13_73)] bg-[oklch(0.78_0.13_73)] text-[oklch(0.14_0.03_60)]"
                      : "border-slate-200 dark:border-slate-600 bg-white dark:bg-[oklch(0.22_0.03_248)] text-slate-600"
                  }`}
                >
                  {isDone ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                {step.number < STEPS.length && (
                  <div
                    className={`w-0.5 flex-1 min-h-[24px] rounded-full ${
                      isDone ? "bg-emerald-300" : "bg-slate-100 dark:bg-slate-700"
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="pb-4 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p
                    className={`text-sm font-semibold ${
                      isActive
                        ? "text-amber-800 dark:text-amber-300"
                        : isDone
                        ? "text-slate-600 dark:text-slate-600"
                        : "text-slate-600 dark:text-slate-600"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.delai && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                        isActive
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-600"
                      }`}
                    >
                      {step.delai}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-600 leading-relaxed">
                  {step.description}
                </p>
                <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-600 italic">
                  {step.legal}
                </p>

                {/* Active step actions */}
                {isActive && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Étape en cours
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Warning note */}
      <div className="px-5 py-3 bg-slate-50 dark:bg-[oklch(0.15_0.025_248)] border-t border-slate-100 dark:border-slate-700">
        <p className="text-[10px] text-slate-400 dark:text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-500 dark:text-slate-600">Point de vigilance :</span>{" "}
          Le non-respect de cette procédure expose l&apos;employeur à une annulation de la sanction par les tribunaux du travail CI.
          Toute sanction doit être proportionnée aux faits reprochés (principe de proportionnalité, CT CI art. 15.2).
        </p>
      </div>
    </div>
  );
}
