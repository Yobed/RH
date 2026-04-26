"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Plus, 
  Calendar, 
  Clock, 
  Calculator, 
  Trash, 
  DotsThreeVertical,
  Info,
  Pulse,
  MagnifyingGlass,
  CheckCircle,
  CaretRight,
  IdentificationCard,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  Users
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { createClientSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  full_name: string;
  matricule: string;
  salaire_brut: number;
}

interface OvertimeRecord {
  id: string;
  employee_id: string;
  date: string;
  hours_count: number;
  category: string;
  reason: string;
  statut: string;
  employee?: {
    full_name: string;
    matricule: string;
  };
}

interface Props {
  employees: Employee[];
  initialRecords: OvertimeRecord[];
  companyId: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", minimumFractionDigits: 0 }).format(n);

export function OvertimeManager({ employees, initialRecords, companyId }: Props) {
  const [records, setRecords] = useState<OvertimeRecord[]>(initialRecords);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [hoursCount, setHoursCount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [category, setCategory] = useState("15%");
  const [reason, setReason] = useState("");
  const [empSearch, setEmpSearch] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const supabase = createClientSupabase();

  const filteredEmployeesForSelect = employees.filter(e => 
    e.full_name.toLowerCase().includes(empSearch.toLowerCase()) || 
    e.matricule.toLowerCase().includes(empSearch.toLowerCase())
  );

  const filteredRecords = records.filter(r => 
    r.employee?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.employee?.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats pour les KPI avec le design premium
  const totalHours = filteredRecords.reduce((sum, r) => sum + r.hours_count, 0);
  const totalCost = filteredRecords.reduce((sum, r) => {
    const emp = employees.find(e => e.id === r.employee_id);
    const th = emp ? Math.round(emp.salaire_brut / 173.33) : 0;
    const maj = r.category === "15%" ? 1.15 : r.category === "50%" ? 1.50 : r.category === "75%" ? 1.75 : 2;
    return sum + Math.round(th * maj * r.hours_count);
  }, 0);
  const employeeCount = new Set(filteredRecords.map(r => r.employee_id)).size;

  const selectedEmp = employees.find(e => e.id === selectedEmpId);
  const tauxHoraire = selectedEmp ? Math.round(selectedEmp.salaire_brut / 173.33) : 0;
  
  const majorationFactor = category === "15%" ? 1.15 : category === "50%" ? 1.50 : 1.75;
  const hourlyPay = category === "100%" ? tauxHoraire * 2 : tauxHoraire * majorationFactor;
  const totalImpact = selectedEmp ? Math.round(hourlyPay * Number(hoursCount)) : 0;

  async function handleAddRecord() {
    if (!selectedEmpId || !hoursCount || !date) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("overtime_records")
        .insert({
          company_id: companyId,
          employee_id: selectedEmpId,
          date,
          hours_count: Number(hoursCount),
          category,
          reason,
          statut: 'approuve'
        })
        .select("*, employee:employees(full_name, matricule)")
        .single();

      if (error) throw error;

      setRecords([data, ...records]);
      setIsDialogOpen(false);
      resetForm();
      toast.success("Heures supplémentaires enregistrées");
    } catch (error: any) {
      console.error(error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSelectedEmpId("");
    setHoursCount("");
    setCategory("15%");
    setReason("");
    setEmpSearch("");
    setDate(format(new Date(), "yyyy-MM-dd"));
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from("overtime_records")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setRecords(records.filter(r => r.id !== id));
      toast.success("Enregistrement supprimé");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <Badge className="bg-slate-900 text-white border-none text-[9px] font-black uppercase px-3 py-1 tracking-widest">Payroll Management</Badge>
             <div className="h-1 w-1 rounded-full bg-slate-200" />
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Heures Supplémentaires</span>
          </div>
          <h2 className="text-5xl font-black tracking-tightest leading-none text-slate-900 animate-in slide-in-from-left duration-700">
            Journal des <br/>
            <span className="text-amber-500 italic font-serif">Surcharges</span>
          </h2>
          <p className="text-slate-500 text-sm font-medium max-w-xl leading-relaxed">
            Interface de contrôle granulaire des majorations salariales (15-100%). Assurance de conformité Art. 24 du Code du Travail.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
           <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                 <MagnifyingGlass size={18} weight="bold" />
              </div>
              <input 
                type="text" 
                placeholder="Filtrer par nom, matricule..." 
                className="h-14 pl-12 pr-6 rounded-2xl bg-white border-2 border-slate-100 font-bold text-sm focus:border-slate-900 transition-all w-full md:w-80 outline-none shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 px-8 rounded-2xl bg-slate-900 text-white font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex gap-3 border-none">
                <Plus weight="bold" className="w-4 h-4" /> Nouvelle Imputation
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-xl rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-white flex flex-col max-h-[90vh]">
              <div className="p-10 pb-5">
                <DialogHeader className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100/50">
                      <Clock weight="duotone" className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                      <DialogTitle className="text-3xl font-black text-slate-900 tracking-tightest leading-none">Archiver Heures Sup.</DialogTitle>
                      <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 px-1">
                        Formulaire d'imputation légale
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <ScrollArea className="flex-1 w-full">
                <div className="px-10 pb-10 space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Sélection Collaborateur</Label>
                      <div className="relative group">
                        <Input 
                          placeholder="Matricule ou Nom..." 
                          value={empSearch}
                          onChange={(e) => setEmpSearch(e.target.value)}
                          className="h-12 border-slate-100 rounded-xl bg-slate-50 font-bold text-sm focus:bg-white transition-all pl-10"
                        />
                        <IdentificationCard weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-slate-900" />
                      </div>
                      <Select value={selectedEmpId} onValueChange={(val) => setSelectedEmpId(val || "")}>
                        <SelectTrigger className="h-14 border-slate-200 rounded-xl bg-white font-black text-xs transition-all ring-offset-0 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 mt-2">
                          <SelectValue placeholder="Choisir dans la liste" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-200 shadow-2xl p-2 bg-white max-h-[300px]">
                          {filteredEmployeesForSelect.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-xl">
                               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aucun profil trouvé</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {filteredEmployeesForSelect.map(emp => (
                                <SelectItem key={emp.id} value={emp.id} className="rounded-xl py-3 px-4 focus:bg-slate-900 focus:text-white transition-colors cursor-pointer">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-black text-sm tracking-tight">{emp.full_name}</span>
                                    <span className="text-[9px] font-black uppercase opacity-60">{emp.matricule}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Date</Label>
                        <Input 
                          type="date" 
                          value={date} 
                          onChange={(e) => setDate(e.target.value)} 
                          className="h-12 border-slate-100 rounded-xl bg-slate-50 font-black text-sm"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Quota Heures</Label>
                        <div className="relative group">
                           <Input 
                            type="number" 
                            step="0.5" 
                            placeholder="00.00" 
                            value={hoursCount} 
                            onChange={(e) => setHoursCount(e.target.value)} 
                            className="h-12 border-slate-100 rounded-xl bg-slate-50 font-black text-sm pl-10"
                          />
                          <Clock weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-slate-900" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Barème de majoration</Label>
                      <Select value={category} onValueChange={(val) => setCategory(val || "15%")}>
                        <SelectTrigger className="h-12 border-slate-100 rounded-xl bg-slate-50 font-black text-xs transition-all ring-offset-0 focus:ring-0 focus:border-slate-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2 bg-white">
                          <div className="space-y-1">
                            <SelectItem value="15%" className="rounded-xl py-3 px-4 focus:bg-blue-50 transition-colors">15% — Semaine (41h-48h)</SelectItem>
                            <SelectItem value="50%" className="rounded-xl py-3 px-4 focus:bg-orange-50 transition-colors">50% — Semaine ({">"}48h)</SelectItem>
                            <SelectItem value="75%" className="rounded-xl py-3 px-4 focus:bg-purple-50 transition-colors">75% — Dimanche / Nuit</SelectItem>
                            <SelectItem value="100%" className="rounded-xl py-3 px-4 focus:bg-rose-50 transition-colors">100% — Jour Férié</SelectItem>
                          </div>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Justificatif Opérationnel</Label>
                      <Input 
                        placeholder="Ex: Pic de charge logistique..." 
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)} 
                        className="h-12 border-slate-100 rounded-xl bg-slate-50 font-bold text-sm"
                      />
                    </div>

                    <AnimatePresence>
                      {selectedEmp && hoursCount && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-slate-900 rounded-3xl p-8 space-y-6 relative overflow-hidden group shadow-2xl shadow-slate-900/20"
                        >
                          <div className="absolute -top-10 -right-10 opacity-10 blur-2xl group-hover:scale-125 transition-transform duration-1000">
                            <div className="w-40 h-40 bg-amber-400 rounded-full" />
                          </div>
                          <div className="flex justify-between items-center relative z-10">
                             <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Simulation Impact</span>
                             <div className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          </div>
                          <div className="flex justify-between items-end relative z-10">
                            <div>
                              <p className="text-3xl font-black text-white tracking-tightest">{fmt(tauxHoraire)}<span className="text-xs text-slate-500">/h</span></p>
                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Salaire horaire base</p>
                            </div>
                            <div className="text-right">
                              <p className="text-4xl font-black text-amber-400 tracking-tightest">+{fmt(totalImpact)}</p>
                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Allocation Brute estimée</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </ScrollArea>
              
              <div className="p-8 bg-slate-50 flex gap-4 border-t border-slate-100 mt-auto">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-900"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleAddRecord} 
                  disabled={loading} 
                  className="flex-[2] bg-slate-900 text-white rounded-2xl h-14 font-black uppercase text-[11px] tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800"
                >
                  {loading ? "Calcul en cours..." : "Imputer au dossier"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards Design Performance-style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden group rounded-[2rem]">
          <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-125 transition-all duration-700">
             <Clock weight="duotone" size={120} />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-white/50 text-[10px] font-black uppercase tracking-widest">Total Heures Sup.</CardDescription>
            <CardTitle className="text-4xl font-black tracking-tighter">{totalHours}h <span className="text-xs text-slate-500 font-medium tracking-normal">consolidées</span></CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] font-black text-emerald-400 flex items-center gap-2 uppercase">
              <Pulse weight="fill" className="h-3 w-3 animate-pulse" />
              Mise à jour en temps réel
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-100 shadow-xl relative overflow-hidden group bg-white rounded-[2rem]">
          <div className="absolute -right-6 -top-6 opacity-5 group-hover:scale-125 transition-all duration-700 text-amber-500">
             <Calculator weight="duotone" size={120} />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Impact Masse Salariale</CardDescription>
            <CardTitle className="text-4xl font-black tracking-tighter text-slate-900">+{fmt(totalCost)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Total des majorations brutes
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-100 shadow-xl relative overflow-hidden group bg-white rounded-[2rem]">
          <div className="absolute -right-6 -top-6 opacity-5 group-hover:scale-125 transition-all duration-700 text-blue-500">
             <Users weight="duotone" size={120} />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Équipes Concernées</CardDescription>
            <CardTitle className="text-4xl font-black tracking-tighter text-slate-900">{employeeCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Collaborateurs imputés
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-100 shadow-xl relative overflow-hidden group bg-white rounded-[2rem]">
          <div className="absolute -right-6 -top-6 opacity-5 group-hover:scale-125 transition-all duration-700 text-rose-500">
             <Pulse weight="duotone" size={120} />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Ratio de Surcharge</CardDescription>
            <CardTitle className="text-4xl font-black tracking-tighter text-slate-900">{((totalHours / (employeeCount * 173.33 || 1)) * 100).toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Pression opérationnelle
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-[3rem] border border-slate-100 bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.03)] overflow-hidden ring-1 ring-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-12">Date Intervention</th>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Collaborateur</th>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Volume</th>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Taux</th>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Justificatif</th>
                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-12">Imputation Brute</th>
                <th className="p-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence mode="popLayout">
                {filteredRecords.length === 0 ? (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td colSpan={7} className="p-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                          <Info weight="duotone" className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Aucun enregistrement consolidé</p>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  filteredRecords.map((record, index) => {
                    const emp = employees.find(e => e.id === record.employee_id);
                    const th = emp ? Math.round(emp.salaire_brut / 173.33) : 0;
                    const maj = record.category === "15%" ? 1.15 : record.category === "50%" ? 1.50 : record.category === "75%" ? 1.75 : 2;
                    const recordAmount = Math.round(th * maj * record.hours_count);

                    return (
                      <React.Fragment key={record.id}>
                        <motion.tr 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "hover:bg-slate-50 transition-all group cursor-pointer",
                            expandedRowId === record.id ? "bg-slate-50" : ""
                          )}
                          onClick={() => setExpandedRowId(expandedRowId === record.id ? null : record.id)}
                        >
                          <td className="p-8 pl-12">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all duration-500",
                                expandedRowId === record.id ? "bg-slate-900 text-white scale-110" : "bg-white border border-slate-100 text-slate-400"
                              )}>
                                <Calendar weight="duotone" className="w-5 h-5" />
                              </div>
                              <span className="text-sm font-black text-slate-900 tracking-tight">{format(new Date(record.date), 'dd MMM yyyy', { locale: fr })}</span>
                            </div>
                          </td>
                          <td className="p-8">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-black text-slate-900 leading-none tracking-tight">{record.employee?.full_name}</span>
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">{record.employee?.matricule}</span>
                            </div>
                          </td>
                          <td className="p-8 text-center text-sm font-black text-slate-900">
                             <div className="flex flex-col items-center">
                               <span>{record.hours_count}h</span>
                               {expandedRowId === record.id ? (
                                  <motion.div animate={{ rotate: 180 }}><CaretRight weight="bold" size={10} className="text-slate-300" /></motion.div>
                               ) : (
                                  <motion.div animate={{ rotate: 90 }}><CaretRight weight="bold" size={10} className="text-slate-300" /></motion.div>
                               )}
                             </div>
                          </td>
                          <td className="p-8 text-center">
                            <span className={cn(
                              "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                              record.category === '15%' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                              record.category === '50%' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                              record.category === '75%' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                              'bg-rose-50 text-rose-600 border-rose-100'
                            )}>
                              {record.category}
                            </span>
                          </td>
                          <td className="p-8 min-w-[200px]">
                            <p className="text-xs font-bold text-slate-500 leading-relaxed italic truncate max-w-[200px]">{record.reason || 'Surcharge standard'}</p>
                          </td>
                          <td className="p-8 text-right text-base font-black text-slate-900 tracking-tightest pr-12">
                            +{fmt(recordAmount)}
                          </td>
                          <td className="p-8 text-right relative">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-slate-200 transition-colors">
                                  <DotsThreeVertical weight="bold" className="h-6 w-6 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuContent align="end" className="rounded-2xl border-2 border-slate-50 shadow-2xl p-2 w-56 bg-white z-[100]">
                                  <DropdownMenuItem 
                                    className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 rounded-xl font-black text-[10px] uppercase tracking-widest px-4 py-3 cursor-pointer flex gap-3 items-center" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(record.id);
                                    }}
                                  >
                                    <Trash weight="duotone" className="w-5 h-5" /> Supprimer définitivement
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenuPortal>
                            </DropdownMenu>
                          </td>
                        </motion.tr>
                        
                        <AnimatePresence>
                          {expandedRowId === record.id && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-slate-50/50"
                            >
                              <td colSpan={7} className="p-0 border-none overflow-hidden">
                                <motion.div className="p-12 space-y-8 flex items-start gap-12">
                                   <div className="flex-1 space-y-6">
                                      <div className="flex items-center gap-4">
                                         <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center border-2 border-slate-100 text-slate-900 shadow-sm">
                                            <Info weight="duotone" size={24} />
                                         </div>
                                         <div>
                                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Détails de l'imputation</h4>
                                            <p className="text-lg font-black text-slate-900 tracking-tight">Justification Opérationnelle</p>
                                         </div>
                                      </div>
                                      <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm relative">
                                         <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                                            "{record.reason || 'Aucune raison spécifiée pour cette surcharge.'}"
                                         </p>
                                      </div>
                                   </div>

                                   <div className="w-[350px] space-y-4">
                                      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group/card">
                                         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/card:scale-110 transition-transform duration-700">
                                            <Calculator weight="duotone" size={60} />
                                         </div>
                                         <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-6">Simulation Légale</h5>
                                         <div className="space-y-4">
                                            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                               <span className="text-xs font-bold text-slate-400">Taux horaire base</span>
                                               <span className="font-black">{fmt(th)}</span>
                                            </div>
                                            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                               <span className="text-xs font-bold text-slate-400">Majoration ({record.category})</span>
                                               <span className="font-black text-amber-500">+{fmt(Math.round(th * (maj - 1)))}</span>
                                            </div>
                                            <div className="flex justify-between items-end pt-2">
                                               <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Net à imputer</span>
                                               <span className="text-2xl font-black">{fmt(recordAmount)}</span>
                                            </div>
                                         </div>
                                      </div>
                                      <div className="flex gap-2">
                                         <Button variant="outline" className="flex-1 rounded-2xl h-12 font-black text-[9px] uppercase tracking-widest border-2">Exporter Preuve</Button>
                                         <Button variant="outline" className="h-12 w-12 p-0 rounded-2xl border-2 flex items-center justify-center"><DotsThreeVertical weight="bold" /></Button>
                                      </div>
                                   </div>
                                </motion.div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row items-center gap-8 bg-slate-900 p-10 rounded-[3rem] shadow-2xl shadow-slate-900/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-10 opacity-10">
           <ShieldCheck weight="duotone" className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10 space-y-6 lg:max-w-md">
           <h3 className="text-2xl font-black text-white tracking-tightest">Conformité Légale</h3>
           <p className="text-xs text-slate-400 font-medium leading-relaxed">
             Nos algorithmes de calcul intègrent les dispositions de l'Art. 24 du Code du Travail de Côte d'Ivoire relatif aux durées de travail et majorations légales obligatoires.
           </p>
           <Link href="/analyses" className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white group">
             Voir les analytics paie <ArrowRight weight="bold" className="group-hover:translate-x-2 transition-transform" />
           </Link>
        </div>
        <div className="flex-1 h-px bg-white/10 hidden lg:block" />
        <div className="flex gap-4 relative z-10">
           <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
              <p className="text-[9px] font-black uppercase text-amber-500 tracking-widest mb-1">Standard</p>
              <p className="text-xl font-black text-white tracking-tighter">15%</p>
           </div>
           <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
              <p className="text-[9px] font-black uppercase text-orange-500 tracking-widest mb-1">Majoré</p>
              <p className="text-xl font-black text-white tracking-tighter">50%</p>
           </div>
           <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
              <p className="text-[9px] font-black uppercase text-purple-500 tracking-widest mb-1">Exceptionnel</p>
              <p className="text-xl font-black text-white tracking-tighter">75%</p>
           </div>
           <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
              <p className="text-[9px] font-black uppercase text-rose-500 tracking-widest mb-1">Férié</p>
              <p className="text-xl font-black text-white tracking-tighter">100%</p>
           </div>
        </div>
      </div>
    </div>
  );
}



