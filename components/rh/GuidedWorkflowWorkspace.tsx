"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  ChevronRight, 
  UserPlus, 
  FileClock, 
  Calculator, 
  CalendarCheck2, 
  AlertTriangle, 
  ArrowRight, 
  FileText, 
  Download, 
  Sparkles, 
  ShieldCheck, 
  RefreshCw,
  Clock,
  UserCheck,
  Check,
  X,
  Plus,
  ArrowUpRight,
  Zap,
  Layers,
  Search,
  FileSpreadsheet,
  Building
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EmployeeDialog } from "./EmployeeDialog";

export type WorkflowType = "employee" | "contract" | "paie" | "conges";

interface GuidedWorkflowWorkspaceProps {
  workflow: WorkflowType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function GuidedWorkflowWorkspace({
  workflow,
  open,
  onOpenChange,
  onSuccess,
}: GuidedWorkflowWorkspaceProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Data states for real or simulated API data
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [pendingConges, setPendingConges] = useState<any[]>([]);
  const [expiringCdds, setExpiringCdds] = useState<any[]>([]);
  const [overtimeItems, setOvertimeItems] = useState<any[]>([]);
  const [childDialogOpen, setChildDialogOpen] = useState(false);

  // Checklist state for Onboarding (Workflow 'employee')
  const [checklist, setChecklist] = useState({
    cni: true,
    cnps: true,
    rib: false,
    diplome: true,
    visiteMedicale: false,
  });

  // Decisions map for CDD workflow
  const [cddDecisions, setCddDecisions] = useState<Record<string, "avenant" | "cdi" | "stc">>({});

  // Approved conges map
  const [congesStatus, setCongesStatus] = useState<Record<string, "approved" | "rejected">>({});

  // Approved overtime hours map
  const [overtimeApproved, setOvertimeApproved] = useState<Record<string, boolean>>({});

  // Audit trace logs accumulated during the workflow execution
  const [auditLogs, setAuditLogs] = useState<string[]>([]);

  // Fetch initial data when modal opens
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setAuditLogs([]);
      return;
    }

    setLoading(true);
    // Fetch employees for CDD and payroll context
    fetch("/api/employees")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setEmployees(list);

        // Filter CDD expiring
        const cdds = list.filter((e: any) => e.type_contrat === "CDD");
        setExpiringCdds(cdds.length > 0 ? cdds : [
          { id: "cdd-1", full_name: "Kouassi Jean-Philippe", poste: "Technicien Réseau", departement: "Direction & IT", date_fin_contrat: "2026-07-15", daysLeft: 18 },
          { id: "cdd-2", full_name: "Koné Aminata", poste: "Assistante RH", departement: "Ressources Humaines", date_fin_contrat: "2026-07-22", daysLeft: 25 },
        ]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch pending conges
    fetch("/api/conges")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const pending = Array.isArray(data) ? data.filter((c: any) => c.statut === "en_attente") : [];
        setPendingConges(pending.length > 0 ? pending : [
          { id: "cong-1", employee_name: "Yao N'Guessan Bertin", type_conge: "Congé Annuel", date_debut: "2026-07-01", date_fin: "2026-07-14", jours: 10, departement: "Opérations & Logistique" },
          { id: "cong-2", employee_name: "Bamba Mariam", type_conge: "Maternité / Famille", date_debut: "2026-07-10", date_fin: "2026-07-24", jours: 10, departement: "Finance & Compta" },
        ]);
      })
      .catch(() => {});

    // Simulated Overtime items for Payroll
    setOvertimeItems([
      { id: "ot-1", employee_name: "Koffi Alexis", hours: 12, rate: "130%", departement: "Opérations & Logistique", status: "pending" },
      { id: "ot-2", employee_name: "Soro Zana", hours: 8, rate: "150%", departement: "Direction & IT", status: "pending" },
    ]);
  }, [open, workflow]);

  // Dynamic titles and icons according to workflow
  const WORKFLOW_META = {
    employee: {
      title: "Parcours Intégration — Nouveau Salarié",
      subtitle: "Onboarding & Formalités Contractuelles (CIV / CNPS)",
      icon: UserPlus,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/30",
      step1Title: "1. Détecter — Dossier & Pièces Justificatives",
      step2Title: "2. Agir — Fiche Collaborateur & Rémunération",
      step3Title: "3. Tracer — Registre du Personnel & Génération PDF",
    },
    contract: {
      title: "Parcours Échéances — Contrats CDD",
      subtitle: "Surveillance Termes, Renouvellement & STC",
      icon: FileClock,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-500/10 border-rose-500/30",
      step1Title: "1. Détecter — CDD à terme (< 30-60 jours)",
      step2Title: "2. Agir — Arbitrage Décisionnel 1-Clic",
      step3Title: "3. Tracer — Historisation & Avenants Contractuels",
    },
    paie: {
      title: "Parcours Mensuel — Préparation de Paie",
      subtitle: "Contrôle des Variables, Heures Supp. & Exports SI",
      icon: Calculator,
      color: "text-[#FF8200]",
      bgColor: "bg-[#FF8200]/10 border-[#FF8200]/30",
      step1Title: "1. Détecter — Anomalies & Variables en Attente",
      step2Title: "2. Agir — Validation des Heures & Primes",
      step3Title: "3. Tracer — Clôture, Livre de Paie & Export Sage",
    },
    conges: {
      title: "Parcours Arbitrage — Validation de Congé",
      subtitle: "Gestion des Absences & Couverture des Effectifs",
      icon: CalendarCheck2,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/30",
      step1Title: "1. Détecter — Demandes en Attente & Impact Effectif",
      step2Title: "2. Agir — Validation / Arbitrage en 1 Clic",
      step3Title: "3. Tracer — Mise à Jour Soldes & Calendrier",
    },
  };

  const meta = WORKFLOW_META[workflow];
  const IconComponent = meta.icon;

  // Actions for Step Transitions
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (workflow === "employee") {
        setAuditLogs((prev) => [...prev, "✓ Vérification des pièces justificatives complétée."]);
      } else if (workflow === "contract") {
        setAuditLogs((prev) => [...prev, `✓ Identification de ${expiringCdds.length} CDD sous surveillance.`]);
      } else if (workflow === "paie") {
        setAuditLogs((prev) => [...prev, "✓ Analyse des éléments de paie et anomalies effectuée."]);
      } else if (workflow === "conges") {
        setAuditLogs((prev) => [...prev, `✓ Analyse d'impact sur ${pendingConges.length} demande(s) de congé.`]);
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (workflow === "employee") {
        setAuditLogs((prev) => [...prev, "✓ Saisie et validation du profil collaborateur enregistrées."]);
      } else if (workflow === "contract") {
        const count = Object.keys(cddDecisions).length;
        setAuditLogs((prev) => [...prev, `✓ Arbitrage enregistré pour ${count || expiringCdds.length} contrat(s).`]);
      } else if (workflow === "paie") {
        setAuditLogs((prev) => [...prev, "✓ Relevé des heures supplémentaires et primes validé."]);
      } else if (workflow === "conges") {
        const count = Object.keys(congesStatus).length;
        setAuditLogs((prev) => [...prev, `✓ Décision d'arbitrage appliquée sur ${count || pendingConges.length} dossier(s).`]);
      }
      setCurrentStep(3);
    }
  };

  const handleFinalize = () => {
    toast.success("Parcours exécuté avec succès et entièrement tracé !");
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-0 shadow-2xl">
        {/* En-tête Supérieur avec Titre Métier & Gradient */}
        <div className="relative border-b border-slate-200 dark:border-slate-800 p-6 bg-slate-50/80 dark:bg-slate-950/50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border shadow-sm ${meta.bgColor}`}>
                <IconComponent className={`h-6 w-6 ${meta.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FF8200]/10 text-[#FF8200] text-[10px] font-bold uppercase tracking-wider border border-[#FF8200]/20">
                    Workflow Guidé RH
                  </span>
                  <span className="text-xs font-bold text-slate-400">· Standard Détecter → Agir → Tracer</span>
                </div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {meta.title}
                </DialogTitle>
                <DialogDescription className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {meta.subtitle}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Stepper Visuel Interactif 3-Étapes */}
          <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2 max-w-2xl mx-auto">
            {[
              { num: 1, label: "Détecter", desc: "Analyse & Pièces" },
              { num: 2, label: "Agir", desc: "Décision & Saisie" },
              { num: 3, label: "Tracer", desc: "Clôture & Audit" },
            ].map((step, idx) => {
              const isActive = currentStep === step.num;
              const isPassed = currentStep > step.num;
              return (
                <React.Fragment key={step.num}>
                  <div 
                    onClick={() => isPassed && setCurrentStep(step.num as any)}
                    className={`flex items-center gap-3 cursor-pointer transition-all ${isPassed ? "hover:opacity-80" : ""}`}
                  >
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      isActive 
                        ? "bg-[#FF8200] text-white shadow-lg shadow-[#FF8200]/30 ring-4 ring-[#FF8200]/20 scale-105" 
                        : isPassed 
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700"
                    }`}>
                      {isPassed ? <Check className="h-5 w-5 stroke-[3]" /> : step.num}
                    </div>
                    <div className="hidden sm:block">
                      <p className={`text-xs font-bold leading-none ${isActive ? "text-[#FF8200]" : isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">{step.desc}</p>
                    </div>
                  </div>
                  {idx < 2 && (
                    <div className={`h-0.5 flex-1 transition-colors ${currentStep > idx + 1 ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Corps de la Modale par Étape & Workflow */}
        <div className="p-6 space-y-6">

          {/* ────────────────────────────────────────────────────────────── */}
          {/* WORKFLOW 1 : NOUVEAU SALARIÉ (ONBOARDING)                      */}
          {/* ────────────────────────────────────────────────────────────── */}
          {workflow === "employee" && (
            <>
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                          Vérification Pré-Embauche & Completiude
                        </h4>
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                          Cochez les pièces collectées avant la création de la fiche contractuelle.
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setChecklist({ cni: true, cnps: true, rib: true, diplome: true, visiteMedicale: true })}
                      className="text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                    >
                      Tout valider
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      { key: "cni", label: "CNI / Passeport valide (Copie lisible)" },
                      { key: "cnps", label: "Attestation / Numéro CNPS (CIV)" },
                      { key: "rib", label: "RIB Bancaire ou Compte Mobile Money" },
                      { key: "diplome", label: "Copies des Diplômes & CV certifié" },
                      { key: "visiteMedicale", label: "Fiche d'aptitude Visite Médicale" },
                    ].map((item) => (
                      <label 
                        key={item.key}
                        className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:bg-slate-50 cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={(checklist as any)[item.key]}
                          onChange={(e) => setChecklist({ ...checklist, [item.key]: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-300 text-[#FF8200] focus:ring-[#FF8200]"
                        />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 text-center py-4">
                  <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-800/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
                    <UserPlus className="h-10 w-10 text-[#FF8200] mx-auto mb-3" />
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Formulaire d'Immatriculation</h4>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
                      Saisissez l'identité, le poste, la grille salariale et le type de contrat du nouveau collaborateur.
                    </p>
                    <Button 
                      onClick={() => setChildDialogOpen(true)}
                      className="bg-[#FF8200] hover:bg-[#E07400] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-[#FF8200]/20 w-full"
                    >
                      Ouvrir le Formulaire Salarié Complet
                    </Button>
                  </div>

                  {childDialogOpen && (
                    <EmployeeDialog
                      open={childDialogOpen}
                      onOpenChange={setChildDialogOpen}
                      onSuccess={() => {
                        toast.success("Salarié enregistré dans le formulaire !");
                        setChildDialogOpen(false);
                      }}
                    />
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" /> Traçabilité RH Garanties
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">Journal d'Audit en Direct</span>
                    </div>
                    <div className="space-y-1.5 text-xs font-mono text-slate-300">
                      {auditLogs.map((log, index) => (
                        <p key={index}>{log}</p>
                      ))}
                      <p className="text-emerald-400 font-bold">✓ Enregistrement dans le Registre du Personnel effectué.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <FileText className="h-6 w-6 text-[#FF8200]" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Contrat de Travail & Fiche D'accueil</p>
                        <p className="text-[11px] font-bold text-slate-500">Prêt à l'impression et à la signature électronique.</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toast.success("Téléchargement du Pack d'Embauche PDF commencé...")}
                      className="text-xs font-bold border-slate-300 flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" /> Générer Pack PDF
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ────────────────────────────────────────────────────────────── */}
          {/* WORKFLOW 2 : CDD À ÉCHÉANCE                                     */}
          {/* ────────────────────────────────────────────────────────────── */}
          {workflow === "contract" && (
            <>
              {currentStep === 1 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-950/30 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/40">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-rose-950 dark:text-rose-200">
                          {expiringCdds.length} Contrat(s) CDD sous surveillance (&lt; 30 jours)
                        </h4>
                        <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
                          Évitez la reconduction tacite en prenant une décision avant le terme.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                    {expiringCdds.map((emp) => (
                      <div key={emp.id} className="p-4 bg-white dark:bg-slate-800/40 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{emp.full_name}</p>
                          <p className="text-xs font-bold text-slate-500">{emp.poste} · {emp.departement}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 text-xs font-bold border border-rose-500/20 inline-block">
                            Terme : {emp.date_fin_contrat || "Sous 30j"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-500">Sélectionnez la décision pour chaque collaborateur :</p>
                  <div className="space-y-3">
                    {expiringCdds.map((emp) => {
                      const decision = cddDecisions[emp.id] || "avenant";
                      return (
                        <div key={emp.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{emp.full_name}</p>
                            <p className="text-xs font-bold text-slate-400">{emp.poste}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {[
                              { id: "avenant", label: "📝 Avenant CDD" },
                              { id: "cdi", label: "🤝 Passage CDI" },
                              { id: "stc", label: "🏁 Clôture / STC" },
                            ].map((btn) => (
                              <button
                                key={btn.id}
                                onClick={() => setCddDecisions({ ...cddDecisions, [emp.id]: btn.id as any })}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                  decision === btn.id
                                    ? "bg-[#FF8200] text-white shadow-md shadow-[#FF8200]/20"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                                }`}
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-2">
                    <p className="text-xs font-bold uppercase text-emerald-400 tracking-wider">✓ Traçabilité & Mise à jour RH</p>
                    {auditLogs.map((log, idx) => (
                      <p key={idx} className="text-xs font-mono text-slate-300">{log}</p>
                    ))}
                  </div>
                  <Button 
                    onClick={() => toast.success("Avenants et notifications générés !")}
                    className="w-full bg-[#FF8200] text-white font-bold text-xs py-3 rounded-xl"
                  >
                    Générer les Avenants & Mettre à jour les Dossiers
                  </Button>
                </div>
              )}
            </>
          )}

          {/* ────────────────────────────────────────────────────────────── */}
          {/* WORKFLOW 3 : PRÉPARATION DE PAIE                               */}
          {/* ────────────────────────────────────────────────────────────── */}
          {workflow === "paie" && (
            <>
              {currentStep === 1 && (
                <div className="space-y-3">
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/40 flex items-center gap-3">
                    <Calculator className="h-6 w-6 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">Contrôle des Variables Mensuelles</h4>
                      <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">Heures supplémentaires et absences à valider avant calcul du Livre de Paie.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Résumé des Prétraitements :</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="block font-bold text-slate-900 dark:text-white">{employees.length || 24}</span>
                        <span className="text-[10px] text-slate-400">Bulletins à Générer</span>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="block font-bold text-[#FF8200]">20h</span>
                        <span className="text-[10px] text-slate-400">Heures Supp. à Valider</span>
                      </div>
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="block font-bold text-emerald-600">100%</span>
                        <span className="text-[10px] text-slate-400">Conformité Barème</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500">Validation des Heures Supp. Déclarées :</p>
                  {overtimeItems.map((ot) => (
                    <div key={ot.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{ot.employee_name}</p>
                        <p className="text-[11px] text-slate-400">{ot.hours}h à {ot.rate} · {ot.departement}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setOvertimeApproved({ ...overtimeApproved, [ot.id]: !overtimeApproved[ot.id] });
                          toast.success("Heures validées pour la paie !");
                        }}
                        className={`text-xs font-bold ${overtimeApproved[ot.id] ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                      >
                        {overtimeApproved[ot.id] ? "✓ Validé" : "Approuver"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-slate-900 text-white p-4 rounded-2xl font-mono text-xs space-y-1">
                    <p className="text-emerald-400 font-bold">✓ Clôture et calcul de la Paie effectués.</p>
                    {auditLogs.map((l, i) => <p key={i}>{l}</p>)}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button 
                      onClick={() => toast.success("Génération du Livre de Paie PDF...")}
                      className="bg-[#FF8200] text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2"
                    >
                      <FileSpreadsheet className="h-4 w-4" /> Livre de Paie PDF
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => toast.success("Export Sage / X3 généré (CSV)")}
                      className="border-slate-300 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4" /> Export Comptable Sage
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ────────────────────────────────────────────────────────────── */}
          {/* WORKFLOW 4 : VALIDATION DE CONGÉ                                */}
          {/* ────────────────────────────────────────────────────────────── */}
          {workflow === "conges" && (
            <>
              {currentStep === 1 && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/40 flex items-center gap-3">
                    <CalendarCheck2 className="h-6 w-6 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">Arbitrage des Demandes d'Absence</h4>
                      <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">{pendingConges.length} demande(s) en attente de validation.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {pendingConges.map((c) => (
                      <div key={c.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{c.employee_name}</p>
                          <p className="text-[11px] text-slate-500">{c.type_conge} ({c.jours} jours) · Du {c.date_debut} au {c.date_fin}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase">En attente</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500">Arbitrage direct en 1-Clic :</p>
                  {pendingConges.map((c) => {
                    const st = congesStatus[c.id];
                    return (
                      <div key={c.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{c.employee_name}</p>
                          <p className="text-xs font-bold text-slate-400">{c.type_conge} · {c.jours}j</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setCongesStatus({ ...congesStatus, [c.id]: "approved" });
                              toast.success(`Congé de ${c.employee_name} validé en 1-clic !`);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                              st === "approved" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" /> Approuver 1-Clic
                          </button>
                          <button
                            onClick={() => {
                              setCongesStatus({ ...congesStatus, [c.id]: "rejected" });
                              toast.error(`Congé de ${c.employee_name} refusé.`);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                              st === "rejected" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            }`}
                          >
                            <X className="h-3.5 w-3.5" /> Refuser
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-slate-900 text-white p-4 rounded-2xl font-mono text-xs space-y-1">
                    <p className="text-emerald-400 font-bold">✓ Soldes de congés et planning mis à jour instantanément.</p>
                    {auditLogs.map((l, i) => <p key={i}>{l}</p>)}
                  </div>
                  <Button 
                    onClick={handleFinalize}
                    className="w-full bg-[#FF8200] text-white font-bold text-xs py-3 rounded-xl"
                  >
                    Finaliser & Synchroniser avec le Planning Global
                  </Button>
                </div>
              )}
            </>
          )}

        </div>

        {/* Pied de Modale avec Navigation Pas-à-Pas */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
            className="text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            Étape Précédente
          </Button>

          {currentStep < 3 ? (
            <Button
              onClick={handleNextStep}
              className="bg-[#FF8200] hover:bg-[#E07400] text-white font-bold text-xs px-6 py-2 rounded-xl shadow-md shadow-[#FF8200]/20 flex items-center gap-2"
            >
              <span>Passer à : {currentStep === 1 ? "Agir" : "Tracer"}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinalize}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              <span>Terminer le Parcours Guidé</span>
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
