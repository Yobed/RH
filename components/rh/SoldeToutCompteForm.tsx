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
import { User, Calculator, FileText, CheckCircle2, ArrowRight, ArrowLeft, Download, Save } from "lucide-react";
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
      toast.success("STC archivé avec succès dans le dossier du personnel");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erreur lors de la génération du document");
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Wizard Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
          
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center group">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-colors duration-300
                  ${isCompleted 
                    ? "bg-emerald-500 border-emerald-100 text-white" 
                    : isActive 
                      ? "bg-white border-emerald-500 text-emerald-600 shadow-sm" 
                      : "bg-white border-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`mt-3 text-sm font-medium transition-colors duration-300
                  ${isActive ? "text-slate-900" : isCompleted ? "text-slate-700" : "text-slate-400"}
                `}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-xl">
            {currentStep === 1 && "Sélection de l'employé"}
            {currentStep === 2 && "Paramètres de calcul du STC"}
            {currentStep === 3 && "Validation du Solde de Tout Compte"}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Choisissez l'employé pour lequel vous souhaitez calculer le solde de tout compte."}
            {currentStep === 2 && "Renseignez les données salariales et les congés pour calculer les indemnités."}
            {currentStep === 3 && "Vérifiez les montants calculés avant de générer le document officiel."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Employé sortant <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <select 
                    {...register("employee_id")} 
                    className={`${selectClass} pl-10 h-11 border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20`}
                  >
                    <option value="">— Veuillez sélectionner un employé —</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.full_name} ({e.matricule}) • {e.type_contrat}</option>
                    ))}
                  </select>
                </div>
                {errors.employee_id && <p className="text-sm text-rose-500 mt-1 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-rose-500"></span>{errors.employee_id.message}</p>}
              </div>

              {selectedEmp && (
                <div className="bg-sky-50/50 border border-sky-100 rounded-lg p-4 mt-6">
                  <h4 className="font-medium text-sky-900 mb-3 text-sm">Informations contractuelles (Automatique)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="block text-xs text-sky-600/70 mb-1">Matricule</span>
                      <span className="font-medium text-sky-900">{selectedEmp.matricule}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-sky-600/70 mb-1">Type de contrat</span>
                      <span className="font-medium text-sky-900">{selectedEmp.type_contrat || 'CDI'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-sky-600/70 mb-1">Salaire Actuel</span>
                      <span className="font-medium text-sky-900">{fmt(selectedEmp.salaire_brut || 0)}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-sky-600/70 mb-1">Date d'embauche</span>
                      <span className="font-medium text-sky-900">
                        {selectedEmp.date_embauche ? new Date(selectedEmp.date_embauche).toLocaleDateString('fr-CI') : 'Non définie'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && selectedEmp && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Salaire moyen (12 derniers mois) <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Input type="number" step="1000" {...register("salaire_moyen_12_mois")} className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 pr-12" />
                      <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-medium">FCFA</span>
                    </div>
                    <p className="text-xs text-slate-500">Base du calcul de l'indemnité de licenciement/précarité.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Ancienneté (Années ou fraction) <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <Input type="number" step="0.01" {...register("anciennete_annees")} className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 pr-12" />
                      <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-medium">ANS</span>
                    </div>
                  </div>

                  {isCDD && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Somme des salaires bruts du CDD <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <Input type="number" step="1000" {...register("somme_salaires_bruts_cdd")} className="border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 pr-12" />
                        <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-medium">FCFA</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Sert de base à l'indemnité de précarité de 3%.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-5 border border-slate-100 space-y-4">
                    <h4 className="font-medium text-slate-900 border-b border-slate-200 pb-2 mb-4">Congés et Préavis</h4>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Jours de congés restants</label>
                      <div className="relative">
                        <Input type="number" step="0.5" {...register("jours_conges_restants")} className="bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 pr-16" />
                        <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-medium">JOURS</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Jours de préavis non effectués</label>
                      <div className="relative">
                        <Input type="number" step="1" {...register("jours_preavis_non_effectues")} className="bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 pr-16" />
                        <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-medium">JOURS</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && resultat && selectedEmp && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-900">Solde de Tout Compte Calculé</h3>
                    <p className="text-sm text-emerald-700">Pour {selectedEmp.full_name}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {isCDD ? (
                    <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                      <span className="text-emerald-800 font-medium">Indemnité de précarité (3%)</span>
                      <span className="font-semibold text-slate-900 text-lg">{fmt(resultat.indemnite_precarite)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                      <span className="text-emerald-800 font-medium">Indemnité de licenciement</span>
                      <span className="font-semibold text-slate-900 text-lg">{fmt(resultat.indemnite_licenciement)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                    <span className="text-emerald-800 font-medium">Indemnité comp. de congés payés</span>
                    <span className="font-semibold text-slate-900 text-lg">{fmt(resultat.indemnite_compensatrice_conges)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                    <span className="text-emerald-800 font-medium">Indemnité comp. de préavis</span>
                    <span className="font-semibold text-slate-900 text-lg">{fmt(resultat.indemnite_preavis)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 mt-2">
                    <span className="text-emerald-900 font-bold text-xl uppercase tracking-wide">Total Brut (STC)</span>
                    <span className="font-bold text-emerald-700 text-3xl">{fmt(resultat.total_brut_stc)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-sm text-amber-800 flex gap-2">
                  <span className="font-bold">Important:</span> Ce montant représente le brut des indemnités. Les retenues légales et sociales (ITS, IGR, RN) devront être calculées sur ces montants selon le régime d'imposition applicable lors de l'établissement du bulletin de solde final.
                </p>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-6 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="w-32 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
          </Button>
          
          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={currentStep === 1 && !empId}
              className="w-32 bg-slate-900 hover:bg-slate-800 text-white"
            >
              Suivant <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (selectedEmp && resultat) {
                    const doc = generateSTCPDF({
                      employee: selectedEmp,
                      stcResult: resultat,
                      company: company || { name: "ENTREPRISE" },
                      params: formValues
                    });
                    exportPDF(doc, `STC_${selectedEmp.full_name.replace(/ /g, "_")}`);
                  } else {
                    window.print();
                  }
                }}
                className="border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter PDF
              </Button>
              
              <Button
                type="button"
                onClick={handleArchive}
                disabled={isArchiving || archived}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20"
              >
                {isArchiving ? (
                  <>Archivage en cours...</>
                ) : archived ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Archivé</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Générer & Archiver</>
                )}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
