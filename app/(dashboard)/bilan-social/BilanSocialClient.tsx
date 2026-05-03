"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Download, BookOpen, Users, Wallet, TrendingUp, Calendar, Activity, GraduationCap, ShieldAlert, Briefcase } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { EffectifKpi, TurnoverKpi, AbsenteeismKpi, SafetyKpi, PerformanceKpi } from "@/lib/analytics-rh";

interface AgePyramid {
  pyramid: { range: string; Hommes: number; Femmes: number }[];
  averageAge: number;
}

interface PayrollSummary {
  brut_annuel: number;
  cout_total_annuel: number;
  brut_moyen_mensuel: number;
}

interface FormationSummary {
  nb_actions: number;
  nb_employees_formes: number;
  total_heures: number;
  total_cout: number;
  fdfp_credit: number;
  fdfp_rembourse: number;
  taux_effort: number;
}

interface DuerpStats {
  total: number;
  critiques: number;
  elevees: number;
  maitrises: number;
}

interface RecrutementStats {
  jobs_ouverts: number;
  candidats: number;
  recrutes: number;
}

interface Props {
  annee: number;
  yearsOptions: number[];
  companyName: string;
  effectif: EffectifKpi;
  age: AgePyramid;
  payroll: PayrollSummary;
  turnover: TurnoverKpi;
  absenteeism: AbsenteeismKpi;
  safety: SafetyKpi;
  performance: PerformanceKpi;
  formation: FormationSummary;
  duerp: DuerpStats;
  recrutement: RecrutementStats;
}

const fcfa = (n: number): string =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n);

export function BilanSocialClient({
  annee, yearsOptions, companyName, effectif, age, payroll, turnover,
  absenteeism, safety, performance, formation, duerp, recrutement,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function changeYear(y: number): void {
    const sp = new URLSearchParams(params.toString());
    sp.set("annee", String(y));
    router.push(`/bilan-social?${sp.toString()}`);
  }

  function exportPdf(): void {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`Bilan social ${annee}`, 14, 18);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(companyName, 14, 25);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Édité le ${new Date().toLocaleDateString("fr-CI")}`, 14, 30);
      doc.setTextColor(0);

      autoTable(doc, {
        startY: 36,
        head: [["1. Effectif", "Valeur"]],
        body: [
          ["Effectif total", String(effectif.total)],
          ["Actifs", String(effectif.actifs)],
          ["Hommes / Femmes", `${effectif.hommes} / ${effectif.femmes}`],
          ["Parité femmes", `${effectif.parityRate} %`],
          ["Âge moyen", `${age.averageAge} ans`],
          ["Entrées dans l'année", String(effectif.entriesYear)],
          ["Départs dans l'année", String(effectif.departuresYear)],
          ["Turnover", `${turnover.rateYear} %`],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 23, 42] },
      });

      autoTable(doc, {
        startY: (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 100 + 8,
        head: [["2. Rémunération", "Valeur"]],
        body: [
          ["Masse salariale brute annuelle", fcfa(payroll.brut_annuel)],
          ["Coût total employeur (TCO)", fcfa(payroll.cout_total_annuel)],
          ["Brut moyen mensuel", fcfa(payroll.brut_moyen_mensuel)],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 23, 42] },
      });

      autoTable(doc, {
        startY: (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 130 + 8,
        head: [["3. Conditions de travail", "Valeur"]],
        body: [
          ["Absentéisme (mois courant)", `${absenteeism.rateMonth} %`],
          ["Jours non travaillés (mois)", String(absenteeism.totalDaysMonth)],
          ["Accidents recensés", String(safety.count)],
          ["Jours d'arrêt cumulés", String(safety.joursPerdus)],
          ["Taux fréquence (/M h)", String(safety.freqRate)],
          ["Taux gravité (/k h)", String(safety.severityRate)],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 23, 42] },
      });

      autoTable(doc, {
        startY: (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 170 + 8,
        head: [["4. Formation", "Valeur"]],
        body: [
          ["Actions de formation", String(formation.nb_actions)],
          ["Salariés formés", String(formation.nb_employees_formes)],
          ["Heures de formation", String(formation.total_heures)],
          ["Budget engagé", fcfa(formation.total_cout)],
          ["Crédit FDFP cotisé", fcfa(formation.fdfp_credit)],
          ["Remboursé FDFP", fcfa(formation.fdfp_rembourse)],
          ["Taux d'effort formation", `${formation.taux_effort} %`],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 23, 42] },
      });

      autoTable(doc, {
        startY: (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 220 + 8,
        head: [["5. Performance", "Valeur"]],
        body: [
          ["Évaluations validées", String(performance.validated)],
          ["Score moyen / 5", String(performance.avgScore)],
          ["Potentiel moyen / 5", String(performance.avgPotential)],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 23, 42] },
      });

      autoTable(doc, {
        startY: (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 240 + 8,
        head: [["6. Recrutement", "Valeur"]],
        body: [
          ["Postes ouverts", String(recrutement.jobs_ouverts)],
          ["Candidatures reçues", String(recrutement.candidats)],
          ["Recrutements effectifs", String(recrutement.recrutes)],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 23, 42] },
      });

      autoTable(doc, {
        startY: (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 260 + 8,
        head: [["7. DUERP", "Valeur"]],
        body: [
          ["Risques recensés", String(duerp.total)],
          ["Risques critiques", String(duerp.critiques)],
          ["Risques élevés", String(duerp.elevees)],
          ["Risques maîtrisés", String(duerp.maitrises)],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 23, 42] },
      });

      doc.save(`bilan-social-${annee}.pdf`);
      toast.success("PDF généré.");
    } catch {
      toast.error("Erreur de génération PDF.");
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-slate-700" />
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
              Conformité · Reporting annuel
            </p>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mt-1">
            Bilan social {annee}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl leading-snug">
            Synthèse consolidée des indicateurs RH de l'année — obligation légale
            pour les entreprises de 50 salariés et plus.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={annee}
            onChange={(e) => changeYear(Number(e.target.value))}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
          >
            {yearsOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={exportPdf}
            className="h-9 inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            Exporter PDF
          </button>
        </div>
      </header>

      <Section title="1. Effectif & démographie" icon={Users}>
        <Grid>
          <Stat label="Effectif total" value={effectif.total.toString()} />
          <Stat label="Actifs" value={effectif.actifs.toString()} />
          <Stat label="Hommes / Femmes" value={`${effectif.hommes} / ${effectif.femmes}`} />
          <Stat label="Parité femmes" value={`${effectif.parityRate} %`} />
          <Stat label="Âge moyen" value={`${age.averageAge} ans`} />
          <Stat label="Entrées année" value={effectif.entriesYear.toString()} />
          <Stat label="Départs année" value={effectif.departuresYear.toString()} />
          <Stat label="Turnover" value={`${turnover.rateYear} %`} accent={turnover.rateYear > 15 ? "danger" : turnover.rateYear > 8 ? "warn" : "ok"} />
        </Grid>
      </Section>

      <Section title="2. Rémunération" icon={Wallet}>
        <Grid>
          <Stat label="Masse salariale brute" value={fcfa(payroll.brut_annuel)} />
          <Stat label="Coût total employeur" value={fcfa(payroll.cout_total_annuel)} accent="primary" />
          <Stat label="Brut moyen mensuel" value={fcfa(payroll.brut_moyen_mensuel)} />
        </Grid>
      </Section>

      <Section title="3. Conditions de travail & sécurité" icon={Activity}>
        <Grid>
          <Stat label="Absentéisme mois" value={`${absenteeism.rateMonth} %`} accent={absenteeism.rateMonth > 8 ? "danger" : "ok"} />
          <Stat label="Jours d'arrêt cumulés" value={safety.joursPerdus.toString()} />
          <Stat label="Accidents recensés" value={safety.count.toString()} accent={safety.count > 0 ? "warn" : "ok"} />
          <Stat label="Taux fréquence" value={safety.freqRate.toString()} sub="/M h" />
          <Stat label="Taux gravité" value={safety.severityRate.toString()} sub="/k h" />
        </Grid>
      </Section>

      <Section title="4. Formation professionnelle" icon={GraduationCap}>
        <Grid>
          <Stat label="Actions" value={formation.nb_actions.toString()} />
          <Stat label="Salariés formés" value={formation.nb_employees_formes.toString()} />
          <Stat label="Heures cumulées" value={formation.total_heures.toString()} />
          <Stat label="Budget engagé" value={fcfa(formation.total_cout)} />
          <Stat label="Crédit FDFP cotisé" value={fcfa(formation.fdfp_credit)} />
          <Stat label="Remboursé FDFP" value={fcfa(formation.fdfp_rembourse)} accent="positive" />
          <Stat label="Taux d'effort" value={`${formation.taux_effort} %`} accent={formation.taux_effort >= 1 ? "positive" : "warn"} />
        </Grid>
      </Section>

      <Section title="5. Performance" icon={TrendingUp}>
        <Grid>
          <Stat label="Évaluations validées" value={performance.validated.toString()} />
          <Stat label="Score moyen" value={`${performance.avgScore} / 5`} />
          <Stat label="Potentiel moyen" value={`${performance.avgPotential} / 5`} />
        </Grid>
      </Section>

      <Section title="6. Recrutement" icon={Briefcase}>
        <Grid>
          <Stat label="Postes ouverts" value={recrutement.jobs_ouverts.toString()} />
          <Stat label="Candidatures" value={recrutement.candidats.toString()} />
          <Stat label="Recrutements" value={recrutement.recrutes.toString()} accent="positive" />
        </Grid>
      </Section>

      <Section title="7. Risques professionnels (DUERP)" icon={ShieldAlert}>
        <Grid>
          <Stat label="Risques recensés" value={duerp.total.toString()} />
          <Stat label="Critiques" value={duerp.critiques.toString()} accent={duerp.critiques > 0 ? "danger" : "ok"} />
          <Stat label="Élevés" value={duerp.elevees.toString()} accent={duerp.elevees > 0 ? "warn" : "ok"} />
          <Stat label="Maîtrisés" value={duerp.maitrises.toString()} accent="positive" />
        </Grid>
      </Section>

      <Section title="8. Pyramide des âges" icon={Calendar}>
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          <div className="space-y-2">
            {age.pyramid.map((bin) => {
              const total = bin.Hommes + bin.Femmes;
              const max = Math.max(...age.pyramid.map((b) => b.Hommes + b.Femmes), 1);
              const pct = (total / max) * 100;
              return (
                <div key={bin.range} className="flex items-center gap-3">
                  <span className="w-12 text-xs text-slate-600 tabular-nums">{bin.range}</span>
                  <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden flex">
                    <div className="h-full bg-slate-700 flex items-center justify-end pr-2" style={{ width: `${(bin.Hommes / max) * 100}%` }}>
                      {bin.Hommes > 0 && <span className="text-[10px] text-white font-medium">H{bin.Hommes}</span>}
                    </div>
                    <div className="h-full bg-amber-500 flex items-center pl-2" style={{ width: `${(bin.Femmes / max) * 100}%` }}>
                      {bin.Femmes > 0 && <span className="text-[10px] text-white font-medium">F{bin.Femmes}</span>}
                    </div>
                  </div>
                  <span className="w-12 text-xs text-slate-600 tabular-nums text-right">{total}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-slate-500" />
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">{children}</div>;
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: "neutral" | "ok" | "warn" | "danger" | "primary" | "positive" }) {
  const bar = {
    neutral: "bg-slate-200",
    ok: "bg-emerald-500",
    warn: "bg-amber-500",
    danger: "bg-rose-500",
    primary: "bg-slate-900",
    positive: "bg-emerald-500",
  }[accent ?? "neutral"];
  return (
    <div className="relative rounded-lg border border-slate-200 bg-white p-3.5 sm:p-4">
      <div className={`absolute left-0 top-3.5 bottom-3.5 sm:top-4 sm:bottom-4 w-0.5 rounded-r ${bar}`} />
      <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">{label}</p>
      <p className="mt-1 text-sm sm:text-lg font-semibold text-slate-900 tabular-nums break-words">{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}
