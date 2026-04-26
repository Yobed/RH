"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { calculerSoldeDeCompte, ResultatSoldeDeCompte } from "@/lib/paie-ci";
import { exportPDF, generateSTCPDF, type CompanyInfo } from "@/lib/pdf-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  User, 
  Calculator, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Download, 
  Save,
  Search,
  Clock,
  Calendar,
  AlertTriangle,
  ArrowRightCircle,
  FileCheck,
  UserCheck,
  XCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { Tables } from "@/types/supabase";

export type EmployeeSTC = Pick<Tables<"employees">, "id" | "full_name" | "matricule" | "salaire_brut" | "type_contrat" | "date_embauche">;

const schema = z.object({
  employee_id: z.string().uuid("Sélectionnez un employé"),
  salaire_moyen_12_mois: z.string().min(1, "Le salaire moyen est requis"),
  somme_salaires_bruts_cdd: z.string().optional(),
  anciennete_annees: z.string().min(1, "L'ancienneté est requise"),
  jours_conges_restants: z.string().optional(),
  jours_preavis_non_effectues: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n);

interface Props {
  employees: EmployeeSTC[];
  company?: CompanyInfo | null;
  defaultEmployeeId?: string;
}

const steps = [
  { id: 1, title: "Employé", icon: User },
  { id: 2, title: "Paramètres", icon: Calculator },
  { id: 3, title: "Validation", icon: FileText },
];

export function SoldeToutCompteForm({ employees, company, defaultEmployeeId }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [resultat, setResultat] = useState<ResultatSoldeDeCompte | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);
  const [archived, setArchived] = useState(false);

  const { register, watch, setValue, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      employee_id: defaultEmployeeId || "",
      jours_conges_restants: "0",
      jours_preavis_non_effectues: "0",
      somme_salaires_bruts_cdd: "0"
    }
  });

  const empId = watch("employee_id");
  const filteredEmployees = employees.filter(e => {
    if (!searchTerm.trim()) return true;
    
    const search = searchTerm.toLowerCase().trim();
    const name = (e.full_name || "").toLowerCase();
    const mat = (e.matricule || "").toLowerCase();
    
    // Split search into individual terms for multi-word matching
    const terms = search.split(/\s+/);
    return terms.every(term => name.includes(term) || mat.includes(term));
  });
  const selectedEmp = employees.find(e => e.id === empId);
  const typeContrat = (selectedEmp?.type_contrat || 'CDI').toUpperCase();
  const isCDD = typeContrat === 'CDD';

  const formValues = watch();

  useEffect(() => {
    if (!selectedEmp) return;
    setValue("salaire_moyen_12_mois", String(selectedEmp.salaire_brut ?? 0));
    
    if (selectedEmp.date_embauche) {
      const debut = new Date(selectedEmp.date_embauche);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - debut.getTime());
      const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
      setValue("anciennete_annees", diffYears.toFixed(2));
    } else {
      setValue("anciennete_annees", "0");
    }
  }, [selectedEmp, setValue]);

  useEffect(() => {
    if (!selectedEmp) {
      setResultat(null);
      return;
    }

    const sm = Number(formValues.salaire_moyen_12_mois) || 0;
    const anc = Number(formValues.anciennete_annees) || 0;
    const ssbCdd = Number(formValues.somme_salaires_bruts_cdd) || 0;
    const conges = Number(formValues.jours_conges_restants) || 0;
    const preavis = Number(formValues.jours_preavis_non_effectues) || 0;
    const saa = Number(selectedEmp.salaire_brut) || sm;

    const res = calculerSoldeDeCompte({
      type_contrat: isCDD ? 'CDD' : 'CDI',
      salaire_moyen_12_mois: sm,
      somme_salaires_bruts_cdd: ssbCdd,
      anciennete_annees: anc,
      jours_conges_restants: conges,
      jours_preavis_non_effectues: preavis,
      salaire_mensuel_actuel: saa
    });

    setResultat(res);
  }, [formValues, selectedEmp, isCDD]);

  const handleNext = async () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = await trigger("employee_id");
    } else if (currentStep === 2) {
      isValid = await trigger();
    }
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const handleArchive = async () => {
    if (!selectedEmp || !resultat) return;
    
    const toastId = toast.loading("Génération du document et archivage en cours...");
    setIsArchiving(true);
    try {
      const response = await fetch("/api/stc/archiver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: selectedEmp.id,
          resultat: resultat,
          parametres: formValues
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erreur lors de l'archivage");

      setArchived(true);
      toast.success("STC archivé avec succès dans le dossier du personnel", { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erreur lors de la génération du document", { id: toastId });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Premium Wizard Progress */}
      <div className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-50" />
        <motion.div 
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-primary to-emerald-500"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          transition={{ type: "spring", stiffness: 40, damping: 15 }}
        />

        <div className="flex items-center justify-between relative px-2 sm:px-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="relative flex flex-col items-center gap-4">
                <motion.div 
                  initial={false}
                  animate={{ 
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isCompleted ? "#0f172a" : isActive ? "#ffffff" : "#ffffff",
                    borderColor: isCompleted ? "#0f172a" : isActive ? "#0f172a" : "#f1f5f9"
                  }}
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center border-[2.5px] transition-all duration-500 relative
                    ${isActive ? "shadow-2xl shadow-primary/20" : ""}
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  ) : (
                    <Icon className={`w-6 h-6 ${isActive ? "text-primary" : "text-slate-300"}`} />
                  )}
                  
                  {isActive && (
                    <motion.div 
                      layoutId="step-glow"
                      className="absolute -inset-2 bg-primary/5 rounded-[2rem] -z-10 blur-xl"
                    />
                  )}
                </motion.div>
                <div className="flex flex-col items-center">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500
                    ${isActive ? "text-slate-900" : "text-slate-400"}
                  `}>
                    {step.title}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="step-indicator"
                      className="w-1 h-1 rounded-full bg-primary mt-1"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={currentStep}
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
           transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="border-none shadow-[0_30px_70px_rgba(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl">
            <CardHeader className="p-10 pb-6 border-b border-slate-50">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
                    {currentStep === 1 && <User className="w-6 h-6 text-white" />}
                    {currentStep === 2 && <Calculator className="w-6 h-6 text-white" />}
                    {currentStep === 3 && <FileCheck className="w-6 h-6 text-white" />}
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black text-slate-900 tracking-tightest leading-none">
                      {currentStep === 1 && "Identification"}
                      {currentStep === 2 && "Calculateur"}
                      {currentStep === 3 && "Vérification"}
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-medium mt-1">
                      {currentStep === 1 && "Sélectionnez le collaborateur pour initier la procédure de solde."}
                      {currentStep === 2 && "Configurez les paramètres financiers et les reliquats de congés."}
                      {currentStep === 3 && "Validez les calculs avant l'archivage définitif du document."}
                    </CardDescription>
                 </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-10">
              {/* STEP 1: Searchable Employee List */}
              {currentStep === 1 && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Rechercher un collaborateur</Label>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input 
                          placeholder="Nom, matricule..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-12 h-16 border-slate-100 rounded-2xl bg-slate-50/50 shadow-inner focus:bg-white focus:ring-primary/20 text-lg font-bold transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                    <div className="lg:col-span-3 space-y-4">
                      <ScrollArea className="h-[460px] pr-4 -mr-4">
                        <div className="space-y-3 pb-4">
                          {filteredEmployees.length === 0 ? (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-16 text-center bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center gap-4"
                            >
                               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                  <XCircle className="w-8 h-8 text-slate-200" />
                               </div>
                               <div className="space-y-1">
                                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Aucun collaborateur trouvé</p>
                                 <p className="text-[10px] text-slate-400 font-bold">Essayez d'ajuster vos filtres de recherche</p>
                               </div>
                            </motion.div>
                          ) : (
                            filteredEmployees.map((e, idx) => (
                              <motion.button
                                key={e.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                type="button"
                                onClick={() => {
                                  setValue("employee_id", e.id);
                                  trigger("employee_id");
                                }}
                                className={`w-full p-6 rounded-3xl border-2 text-left transition-all duration-500 group relative overflow-hidden
                                  ${empId === e.id 
                                    ? "bg-slate-900 border-slate-900 shadow-[0_20px_40px_rgba(15,23,42,0.15)] scale-[1.02]" 
                                    : "bg-white border-slate-50 hover:border-slate-100 hover:bg-slate-50/80 hover:scale-[1.01]"
                                  }
                                `}
                              >
                                {empId === e.id && (
                                  <motion.div 
                                    layoutId="selected-indicator"
                                    className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 -z-10"
                                  />
                                )}
                                <div className="flex items-center justify-between relative z-10">
                                  <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs transition-colors duration-500
                                      ${empId === e.id ? "bg-white/10 text-white" : "bg-slate-100 text-slate-400"}
                                    `}>
                                      {e.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="space-y-1">
                                      <div className={`font-black text-lg tracking-tight leading-none ${empId === e.id ? "text-white" : "text-slate-900"}`}>
                                        {e.full_name}
                                      </div>
                                      <div className={`text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 ${empId === e.id ? "text-slate-400" : "text-slate-400"}`}>
                                        <span className={empId === e.id ? "text-emerald-400" : "text-slate-300"}>#{e.matricule}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        <span>{e.type_contrat}</span>
                                      </div>
                                    </div>
                                  </div>
                                  {empId === e.id && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-8 w-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                      <UserCheck className="w-4 h-4 text-white" />
                                    </motion.div>
                                  )}
                                </div>
                              </motion.button>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="lg:col-span-2 relative">
                      <AnimatePresence mode="wait">
                        {selectedEmp ? (
                          <motion.div 
                            key={selectedEmp.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-50 border border-slate-100 rounded-3xl p-8 sticky top-0"
                          >
                             <div className="flex flex-col items-center text-center space-y-4 mb-8">
                                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-slate-900/5 ring-1 ring-slate-100">
                                   <User className="w-12 h-12 text-slate-300" />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-xl font-black text-slate-900 tracking-tight">{selectedEmp.full_name}</h4>
                                  <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase px-4 py-1.5 rounded-full">{selectedEmp.type_contrat}</Badge>
                                </div>
                             </div>

                             <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Matricule</span>
                                   <span className="text-xs font-black text-slate-900">{selectedEmp.matricule}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date Embauche</span>
                                   <span className="text-xs font-black text-slate-900">{selectedEmp.date_embauche ? new Date(selectedEmp.date_embauche).toLocaleDateString('fr-CI') : '-'}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/10">
                                   <span className="text-[10px] font-black uppercase text-emerald-100 tracking-widest">Salaire Actuel</span>
                                   <span className="text-sm font-black text-white">{fmt(selectedEmp.salaire_brut || 0)}</span>
                                </div>
                             </div>
                          </motion.div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 p-8 text-center space-y-4">
                             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                <ArrowRightCircle className="w-8 h-8 text-slate-200" />
                             </div>
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Sélectionnez un employé pour <br/> voir ses détails contractuels</p>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Parameters */}
              {currentStep === 2 && selectedEmp && (
                <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Salaire moyen (12 derniers mois)</Label>
                        <div className="relative group">
                          <Input type="number" step="1000" {...register("salaire_moyen_12_mois")} className="h-14 border-slate-100 rounded-2xl bg-slate-50/50 focus:bg-white focus:ring-primary/20 text-lg font-black pr-16" />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">FCFA</span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest pl-1">Base légale des indemnités</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1">Ancienneté totale</Label>
                        <div className="relative group">
                          <Input type="number" step="0.01" {...register("anciennete_annees")} className="h-14 border-slate-100 rounded-2xl bg-slate-50/50 focus:bg-white focus:ring-primary/20 text-lg font-black pr-16" />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">ANS</span>
                        </div>
                      </div>

                      {isCDD && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-primary tracking-[0.2em] ml-1">Masse salariale du CDD</Label>
                          <div className="relative group">
                            <Input type="number" step="1000" {...register("somme_salaires_bruts_cdd")} className="h-14 border-primary/10 rounded-2xl bg-primary/5 focus:bg-white focus:ring-primary/20 text-lg font-black pr-16" />
                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary/60">FCFA</span>
                          </div>
                          <p className="text-[9px] text-primary/60 font-bold uppercase tracking-widest pl-1">Calcul de la prime de précarité (3%)</p>
                        </motion.div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="bg-slate-900 rounded-[2.5rem] p-8 space-y-8 shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-all duration-700">
                           <Clock className="w-20 h-20 text-white" />
                         </div>
                         <h4 className="text-white font-black uppercase tracking-[0.3em] text-xs pb-4 border-b border-white/10 flex items-center gap-3">
                           <Calendar className="w-4 h-4 text-primary" /> Droits Restants
                         </h4>
                        
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Jours de congés payés</Label>
                            <div className="relative group/input">
                              <Input type="number" step="0.5" {...register("jours_conges_restants")} className="h-14 border-white/10 rounded-2xl bg-white/5 focus:bg-white/10 focus:ring-white/20 text-lg font-black text-white pr-20" />
                              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500">JOURS</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Préavis non effectué</Label>
                            <div className="relative group/input">
                              <Input type="number" step="1" {...register("jours_preavis_non_effectues")} className="h-14 border-white/10 rounded-2xl bg-white/5 focus:bg-white/10 focus:ring-white/20 text-lg font-black text-white pr-20" />
                              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500">JOURS</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Summary Verification */}
              {currentStep === 3 && resultat && selectedEmp && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="relative p-1 bg-gradient-to-br from-primary to-emerald-500 rounded-[3rem] shadow-2xl shadow-primary/10 overflow-hidden group">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                     <div className="bg-white rounded-[2.9rem] p-10 relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
                           <div className="flex items-center gap-6">
                              <div className="h-20 w-20 rounded-[1.5rem] bg-slate-900 flex items-center justify-center shadow-xl shadow-slate-900/20">
                                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                              </div>
                              <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tightest">Solde de Tout Compte</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Simulation Finale • {selectedEmp.full_name}</p>
                              </div>
                           </div>
                           <div className="px-6 py-3 bg-emerald-500/10 rounded-2xl flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Document Prêt</span>
                           </div>
                        </div>

                        <div className="space-y-6">
                          {isCDD ? (
                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group/row">
                              <div className="space-y-1">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Indemnité de précarité</span>
                                <p className="text-[9px] text-slate-400 font-bold italic">Calculée à 3% du total des salaires bruts perçus</p>
                              </div>
                              <span className="font-black text-slate-900 text-2xl tracking-tightest">{fmt(resultat.indemnite_precarite)}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group/row">
                              <div className="space-y-1">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Indemnité de licenciement</span>
                                <p className="text-[9px] text-slate-400 font-bold italic">Basée sur l'ancienneté et le salaire moyen</p>
                              </div>
                              <span className="font-black text-slate-900 text-2xl tracking-tightest">{fmt(resultat.indemnite_licenciement)}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group/row">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Indemnité comp. de congés</span>
                            <span className="font-black text-slate-900 text-2xl tracking-tightest">{fmt(resultat.indemnite_compensatrice_conges)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group/row">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Indemnité comp. de préavis</span>
                            <span className="font-black text-slate-900 text-2xl tracking-tightest">{fmt(resultat.indemnite_preavis)}</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-10 bg-slate-900 rounded-[2rem] mt-10 shadow-2xl shadow-slate-900/20 group/total">
                            <div className="space-y-1">
                               <span className="text-xs font-black text-primary uppercase tracking-[0.4em]">Net à Payer</span>
                               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Montant brut des indemnités</p>
                            </div>
                            <span className="font-black text-white text-5xl tracking-tightest group-hover/total:scale-105 transition-transform duration-500">{fmt(resultat.total_brut_stc)}</span>
                          </div>
                        </div>
                     </div>
                  </div>
                  
                  <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex gap-4">
                    <div className="w-12 h-12 bg-amber-200/50 rounded-2xl flex items-center justify-center flex-shrink-0">
                       <AlertTriangle className="w-6 h-6 text-amber-600" />
                    </div>
                    <p className="text-xs text-amber-900 font-medium leading-relaxed">
                      <span className="font-black uppercase text-[10px] block mb-1">Attention</span>
                      Ce montant représente le brut des indemnités. Les retenues fiscales et sociales (ITS, IGR, RN) seront déduites sur le bulletin de solde final selon les barèmes en vigueur.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
            
            <CardFooter className="p-10 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="h-14 px-8 rounded-2xl font-black text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-30 transition-all uppercase text-[10px] tracking-widest"
              >
                <ArrowLeft className="w-4 h-4 mr-3" /> Retour
              </Button>
              
              <div className="flex gap-4">
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={currentStep === 1 && !empId}
                    className="h-14 px-10 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase text-[10px] tracking-widest"
                  >
                    Suivant <ArrowRight className="w-4 h-4 ml-3" />
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        try {
                          if (!selectedEmp || !resultat) {
                            toast.error("Veuillez sélectionner un employé et remplir les paramètres.");
                            return;
                          }
                          
                          const doc = generateSTCPDF({
                            employee: selectedEmp,
                            stcResult: resultat,
                            company: company || { name: "ENTREPRISE", id: "temp" },
                            params: formValues
                          });
                          
                          exportPDF(doc, `STC_${selectedEmp.full_name.replace(/ /g, "_")}_${new Date().getFullYear()}`);
                          toast.success("PDF généré avec succès");
                        } catch (err) {
                          console.error("Export PDF error:", err);
                          toast.error("Erreur lors de la génération du PDF local.");
                        }
                      }}
                      className="h-14 px-8 border-slate-200 bg-white hover:bg-slate-50 rounded-2xl font-black transition-all uppercase text-[10px] tracking-widest flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> <span>Exporter PDF</span>
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={handleArchive}
                      disabled={isArchiving || archived}
                      className="h-14 px-10 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase text-[10px] tracking-widest"
                    >
                      {isArchiving ? (
                        <div className="flex items-center gap-3">
                           <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                           Archivage...
                        </div>
                      ) : archived ? (
                        <div className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4" /> Archivé</div>
                      ) : (
                        <div className="flex items-center gap-3"><Save className="w-4 h-4" /> Générer & Archiver</div>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
