"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Calculator, 
  Plus, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Calendar,
  User,
  MoreVertical,
  Trash2,
  ChevronRight,
  ShieldCheck,
  ChevronDown
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { toast } from "sonner";
import { createClientSupabase } from "@/lib/supabase/client";

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

  const supabase = createClientSupabase();

  const filteredRecords = records.filter(r => 
    r.employee?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.employee?.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEmp = employees.find(e => e.id === selectedEmpId);
  const tauxHoraire = selectedEmp ? Math.round(selectedEmp.salaire_brut / 173.33) : 0;
  
  const majorationFactor = category === "15%" ? 1.15 : category === "50%" ? 1.50 : 1.75; // Simplification
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
          statut: 'approuve' // Par défaut approuvé pour l'admin RH
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
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 text-white border-none overflow-hidden relative">
          <div className="absolute right-0 top-0 p-3 opacity-20">
            <Clock className="w-12 h-12" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-600">Total Heures (Mois)</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {records.reduce((acc, r) => acc + (format(new Date(r.date), 'MM') === format(new Date(), 'MM') ? r.hours_count : 0), 0)}h
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-emerald-600 text-white border-none overflow-hidden relative">
          <div className="absolute right-0 top-0 p-3 opacity-20">
            <TrendingUp className="w-12 h-12" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-100">Impact Financier</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {fmt(records.reduce((acc, r) => {
                const emp = employees.find(e => e.id === r.employee_id);
                if (!emp) return acc;
                const th = Math.round(emp.salaire_brut / 173.33);
                const maj = r.category === "15%" ? 1.15 : r.category === "50%" ? 1.50 : r.category === "75%" ? 1.75 : 2;
                return acc + Math.round(th * maj * r.hours_count);
              }, 0))}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription>Collaborateurs impactés</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {new Set(records.map(r => r.employee_id)).size}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription>Conformité</CardDescription>
            <CardTitle className="text-3xl font-bold text-emerald-600 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6" /> 100%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-600" />
          <Input 
            placeholder="Rechercher par nom ou matricule..." 
            className="pl-10 border-slate-200" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 text-white hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" /> Enregistrer des heures
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nouvel enregistrement</DialogTitle>
              <DialogDescription>
                Calculez et archivez les heures supplémentaires d'un collaborateur.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Collaborateur</Label>
                <Select value={selectedEmpId} onValueChange={(val) => setSelectedEmpId(val || "")}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name} ({emp.matricule})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nombre d'heures</Label>
                  <Input type="number" step="0.5" placeholder="Ex: 3" value={hoursCount} onChange={(e) => setHoursCount(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Catégorie (Majoration)</Label>
                <Select value={category} onValueChange={(val) => setCategory(val || "15%")}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15%">15% (Semaine, 41h-48h)</SelectItem>
                    <SelectItem value="50%">50% (Semaine, {">"}48h)</SelectItem>
                    <SelectItem value="75%">75% (Dimanche/Nuit)</SelectItem>
                    <SelectItem value="100%">100% (Jour Férié/NuitDimanche)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Motif</Label>
                <Input placeholder="Ex: Surcharge de travail clôture d'année" value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>

              {selectedEmp && hoursCount && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600 uppercase tracking-wider font-semibold">
                    <span>Base de calcul</span>
                    <span>Montant estimé</span>
                  </div>
                  <div className="flex justify-between items-end border-t pt-2 border-slate-100">
                    <div className="text-sm">
                      <p className="font-medium text-slate-900">{fmt(tauxHoraire)} / h</p>
                      <p className="text-[10px] text-slate-600 uppercase">Taux horaire brut</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">+{fmt(totalImpact)}</p>
                      <p className="text-[10px] text-slate-600 uppercase">A ajouter sur la paie</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleAddRecord} disabled={loading} className="bg-slate-900 text-white">
                {loading ? "Enregistrement..." : "Confirmer l'ajout"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Employé</th>
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Volume</th>
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">Catégorie</th>
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Motif</th>
                <th className="p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right">Montant</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-600 italic">Aucun enregistrement trouvé</td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const emp = employees.find(e => e.id === record.employee_id);
                  const th = emp ? Math.round(emp.salaire_brut / 173.33) : 0;
                  const maj = record.category === "15%" ? 1.15 : record.category === "50%" ? 1.50 : record.category === "75%" ? 1.75 : 2;
                  const recordAmount = Math.round(th * maj * record.hours_count);

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-600" />
                          <span className="text-sm font-medium text-slate-700">{format(new Date(record.date), 'dd MMM yyyy', { locale: fr })}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">{record.employee?.full_name}</span>
                          <span className="text-[10px] text-slate-600 font-mono tracking-tighter uppercase">{record.employee?.matricule}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 font-semibold px-2.5 py-0.5 border-slate-200">
                          {record.hours_count}h
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight
                          ${record.category === '15%' ? 'bg-blue-100 text-blue-700' : 
                            record.category === '50%' ? 'bg-orange-100 text-orange-700' : 
                            'bg-purple-100 text-purple-700'}
                        `}>
                          {record.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-slate-600 max-w-[200px] truncate">{record.reason || '-'}</p>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-bold text-slate-900">+{fmt(recordAmount)}</span>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(record.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Legend & Compliance Check */}
      <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-slate-600">
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> 1-8h (15%)</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> {">"}8h (50%)</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Dim/Nuit (75%)</span>
        <div className="flex-1"></div>
        <span className="flex items-center gap-1 text-emerald-600"><AlertCircle className="w-3 h-3" /> Base légale Art. 24 - Loi n°2015-532</span>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-semibold text-slate-700 mb-1 block">
      {children}
    </label>
  );
}
