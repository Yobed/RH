"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Accident = {
  id: string;
  date_accident: string;
  lieu: string | null;
  description: string;
  gravite: "bénin" | "grave" | "mortel";
  jours_arret: number | null;
  statut_cnps: "non_declare" | "declare" | "indemnise" | "clos";
  numero_cnps: string | null;
  deadline_declaration_cnps?: string | null;
  date_declaration_cnps?: string | null;
  employees: { full_name: string; poste: string; matricule: string } | null;
};

type Visite = {
  id: string;
  type_visite: "embauche" | "periodique" | "reprise" | "spontanee";
  date_visite: string;
  date_prochaine: string | null;
  resultat: "apte" | "apte_amenagement" | "inapte" | null;
  medecin: string | null;
  en_retard: boolean;
  employees: { full_name: string; poste: string; matricule: string } | null;
};

type Indicateurs = {
  annee: number;
  effectif: number;
  nb_accidents: number;
  taux_frequence: number;
  taux_gravite: number;
  total_jours_arret: number;
  visites_en_retard: number;
  accidents_non_declares: number;
  repartition_gravite: { benin: number; grave: number; mortel: number };
};

const graviteConfig = {
  "bénin": { label: "Bénin", color: "bg-amber-100 text-amber-700" },
  "grave": { label: "Grave", color: "bg-orange-100 text-orange-700" },
  "mortel": { label: "Mortel", color: "bg-red-100 text-red-700" },
};

const statutCnpsConfig = {
  non_declare: { label: "Non déclaré", color: "bg-red-50 text-red-600" },
  declare: { label: "Déclaré", color: "bg-teal-50 text-teal-600" },
  indemnise: { label: "Indemnisé", color: "bg-emerald-50 text-emerald-600" },
  clos: { label: "Clos", color: "bg-slate-100 text-slate-600" },
};

const typeVisiteLabel = {
  embauche: "Embauche",
  periodique: "Périodique",
  reprise: "Reprise",
  spontanee: "Spontanée",
};

function StatCard({
  label, value, sub, danger = false, index = 0
}: { label: string; value: string | number; sub?: string; danger?: boolean; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: index * 0.06 }}
      className={cn(
        "rounded-2xl border bg-white p-5 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.05)]",
        danger ? "border-red-100" : "border-slate-100/80"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 mb-3">{label}</p>
      <p className={cn("text-3xl font-bold font-mono tabular-nums", danger ? "text-red-600" : "text-slate-900")}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
    </motion.div>
  );
}

export function QhseClient({
  accidents: initialAccidents,
  visites: initialVisites,
  indicateurs,
}: {
  accidents: Accident[];
  visites: Visite[];
  indicateurs: Indicateurs;
}) {
  const [accidents, setAccidents] = useState(initialAccidents);
  const visites = initialVisites;
  const [tab, setTab] = useState<"accidents" | "visites">("accidents");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function declareCnps(id: string) {
    setUpdatingId(id);
    try {
      const numeroCnps = window.prompt(
        "Numéro de récépissé CNPS (optionnel — peut être saisi plus tard)",
        ""
      );
      const res = await fetch(`/api/qhse/accidents/${id}/declarer-cnps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero_cnps: numeroCnps?.trim() || null }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json() as Accident;
      setAccidents((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
      toast.success("Déclaration CNPS enregistrée — Art. 47 CT-CI");
    } catch {
      toast.error("Erreur lors de la déclaration");
    } finally {
      setUpdatingId(null);
    }
  }

  function deadlineState(acc: Accident): { label: string; tone: string } | null {
    if (acc.statut_cnps !== "non_declare") return null;
    if (!acc.deadline_declaration_cnps) return null;
    const deadline = new Date(acc.deadline_declaration_cnps);
    const now = new Date();
    const ms = deadline.getTime() - now.getTime();
    const hoursLeft = Math.round(ms / 3_600_000);
    if (hoursLeft < 0) {
      return {
        label: `Délai dépassé de ${Math.abs(hoursLeft)} h — Art. 47 CT-CI`,
        tone: "bg-red-100 text-red-700 border border-red-200",
      };
    }
    if (hoursLeft <= 12) {
      return {
        label: `Reste ${hoursLeft} h pour déclarer`,
        tone: "bg-amber-100 text-amber-800 border border-amber-200",
      };
    }
    return {
      label: `À déclarer avant ${deadline.toLocaleString("fr-CI")} (${hoursLeft} h)`,
      tone: "bg-slate-100 text-slate-700 border border-slate-200",
    };
  }

  async function exportCSV() {
    const res = await fetch("/api/qhse/export");
    if (!res.ok) { toast.error("Erreur export"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registre-qhse-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const visitesEnRetard = visites.filter((v) => v.en_retard);

  return (
    <div className="space-y-8">
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Accidents AT" value={indicateurs.nb_accidents} sub={`Année ${indicateurs.annee}`} index={0} />
        <StatCard label="Taux de fréquence" value={indicateurs.taux_frequence} sub="× 1 000 000 h" index={1} />
        <StatCard label="Taux de gravité" value={indicateurs.taux_gravite} sub="× 1 000 h" index={2} />
        <StatCard label="Visites en retard" value={indicateurs.visites_en_retard} danger={indicateurs.visites_en_retard > 0} index={3} />
      </div>

      {/* Alerts */}
      {indicateurs.accidents_non_declares > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
          <strong>{indicateurs.accidents_non_declares} accident{indicateurs.accidents_non_declares > 1 ? "s" : ""}</strong>
          &nbsp;non déclaré{indicateurs.accidents_non_declares > 1 ? "s" : ""} à la CNPS — action requise
        </div>
      )}

      {/* Tab bar + export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {(["accidents", "visites"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
                tab === t
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-600 hover:text-slate-700"
              )}
            >
              {t === "accidents" ? "Accidents AT" : `Visites médicales${visitesEnRetard.length > 0 ? ` (${visitesEnRetard.length} en retard)` : ""}`}
            </button>
          ))}
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          Exporter CSV
        </button>
      </div>

      {/* Accidents table */}
      {tab === "accidents" && (
        <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {["Date", "Employé", "Description", "Gravité", "Jours arrêt", "Statut CNPS", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {accidents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-600 text-sm">Aucun accident enregistré</td>
                </tr>
              )}
              {accidents.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                    {new Date(a.date_accident).toLocaleDateString("fr-CI")}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 text-xs">{a.employees?.full_name ?? "—"}</p>
                    <p className="text-[10px] text-slate-600">{a.employees?.poste}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px] truncate">{a.description}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold", graviteConfig[a.gravite].color)}>
                      {graviteConfig[a.gravite].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 text-center">{a.jours_arret ?? 0}</td>
                  <td className="px-4 py-3 space-y-1">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold", statutCnpsConfig[a.statut_cnps].color)}>
                      {statutCnpsConfig[a.statut_cnps].label}
                    </span>
                    {(() => {
                      const d = deadlineState(a);
                      return d ? (
                        <p className={cn("text-[10px] px-2 py-0.5 rounded-md inline-block", d.tone)}>{d.label}</p>
                      ) : null;
                    })()}
                    {a.date_declaration_cnps && (
                      <p className="text-[10px] text-slate-500">
                        Déclaré le {new Date(a.date_declaration_cnps).toLocaleDateString("fr-CI")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {a.statut_cnps === "non_declare" && (
                      <button
                        onClick={() => declareCnps(a.id)}
                        disabled={updatingId === a.id}
                        className="rounded-lg bg-[oklch(0.175_0.04_248)] px-3 py-1.5 text-[10px] font-semibold text-[oklch(0.78_0.13_73)] hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {updatingId === a.id ? "…" : "Déclarer CNPS"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Visites table */}
      {tab === "visites" && (
        <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {["Employé", "Type", "Dernière visite", "Prochaine visite", "Résultat", "Médecin"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visites.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-600 text-sm">Aucune visite médicale enregistrée</td>
                </tr>
              )}
              {visites.map((v) => (
                <tr key={v.id} className={cn("transition-colors", v.en_retard ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-slate-50/60")}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 text-xs">{v.employees?.full_name ?? "—"}</p>
                    <p className="text-[10px] text-slate-600">{v.employees?.poste}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                      {typeVisiteLabel[v.type_visite]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {new Date(v.date_visite).toLocaleDateString("fr-CI")}
                  </td>
                  <td className="px-4 py-3">
                    {v.date_prochaine ? (
                      <span className={cn("font-mono text-xs", v.en_retard ? "font-semibold text-red-600" : "text-slate-600")}>
                        {v.en_retard && "⚠ "}{new Date(v.date_prochaine).toLocaleDateString("fr-CI")}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {v.resultat && (
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                        v.resultat === "apte" ? "bg-emerald-50 text-emerald-600" :
                        v.resultat === "apte_amenagement" ? "bg-amber-50 text-amber-600" :
                        "bg-red-50 text-red-600"
                      )}>
                        {v.resultat === "apte" ? "Apte" : v.resultat === "apte_amenagement" ? "Apte (aménagement)" : "Inapte"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{v.medecin ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
