'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  UserPlus, 
  Calendar, 
  Star, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  MoreVertical,
  Plus,
  ArrowRightLeft,
  Trophy,
  History,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClientSupabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { scoreLabel, scoreVariant } from "@/lib/utils-rh";
import { EvaluationDialog } from "./EvaluationDialog";
import { generateEvaluationPDF, exportPDF } from "@/lib/pdf-templates";

interface Evaluation {
  id: string;
  employee_id: string;
  type: string;
  periode: string;
  date_prevue: string;
  date_realisation: string | null;
  statut: string;
  score_global: number | null;
  titre: string;
  evaluateur_id: string | null;
  employee_name?: string;
  employee_role?: string;
}

interface PerformanceReviewManagerProps {
  initialEvaluations?: Evaluation[];
  employees?: any[];
}

export default function PerformanceReviewManager({ initialEvaluations = [], employees = [] }: PerformanceReviewManagerProps) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>(initialEvaluations);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const supabase = createClientSupabase();

  const getTypeLabel = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PERIODE_ESSAI': return "Période d'essai";
      case 'ANNUELLE': return 'Entretien Annuel';
      case 'TRIMESTRIELLE': return 'Suivi Trimestriel';
      case 'SEMESTRIELLE': return 'Suivi Semestriel';
      case 'MENSUELLE': return 'Point Mensuel';
      default: return type;
    }
  };

  const getStatutBadge = (statut: string) => {
    const s = statut.toUpperCase();
    switch (s) {
      case 'TERMINEE': 
      case 'REALISEE':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Terminé</Badge>;
      case 'PLANIFIEE':
      case 'EN_COURS':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">À venir</Badge>;
      case 'ANNULEE': 
        return <Badge variant="secondary">Annulé</Badge>;
      default: return <Badge variant="outline">{statut}</Badge>;
    }
  };

  // KPI Calculations
  const pendingCount = evaluations.filter(e => ['PLANIFIEE', 'EN_COURS'].includes(e.statut.toUpperCase())).length;
  const completedCount = evaluations.filter(e => ['TERMINEE', 'REALISEE'].includes(e.statut.toUpperCase())).length;
  const highPerformers = evaluations.filter(e => (e.score_global || 0) >= 80).length;

  return (
    <div className="space-y-6">
      {/* Header with quick action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase">Capital Humain</Badge>
             <span className="text-[10px] text-muted-foreground font-bold">• Gestion de la Performance</span>
          </div>
          <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            Performance & Évaluations
          </h2>
          <p className="text-muted-foreground text-sm font-medium max-w-xl">
            Pilotez le développement des compétences et identifiez vos futurs leaders grâce à un suivi rigoureux conformé au droit du travail ivoirien.
          </p>
        </div>
        <div className="flex gap-2">
           <EvaluationDialog employees={employees} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary text-primary-foreground border-none shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
             <Calendar className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-primary-foreground/70 text-[10px] font-black uppercase tracking-widest">Entretiens Planifiés</CardDescription>
            <CardTitle className="text-4xl font-black">{pendingCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] font-bold opacity-80 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Campagne active ce mois
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-100 shadow-sm relative overflow-hidden group">
           <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
             <CheckCircle2 className="h-24 w-24 text-emerald-500" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest">Taux de Complétion</CardDescription>
            <CardTitle className="text-4xl font-black text-emerald-600">
              {evaluations.length > 0 ? Math.round((completedCount / evaluations.length) * 100) : 0}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              +5% par rapport au trimestre dernier
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
             <Star className="h-24 w-24 text-amber-500" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest">Hauts Potentiels</CardDescription>
            <CardTitle className="text-4xl font-black text-amber-600">{highPerformers}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
              <Plus className="h-3 w-3 text-amber-500" />
              Éligibles à la mobilité interne
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-100 shadow-sm relative overflow-hidden group bg-red-50/30">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
             <AlertCircle className="h-24 w-24 text-red-500" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black text-red-600 uppercase tracking-widest">Alertes Essai</CardDescription>
            <CardTitle className="text-4xl font-black text-red-600">3</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-red-700 font-bold flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Décisions requises sous 7 jours
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 md:w-[600px] mb-8 bg-muted/50 p-1.5 h-12 rounded-xl">
          <TabsTrigger value="upcoming" className="font-black text-[11px] uppercase tracking-wider gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Campagne Active
          </TabsTrigger>
          <TabsTrigger value="completed" className="font-black text-[11px] uppercase tracking-wider gap-2">
            <History className="h-3.5 w-3.5" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="mobility" className="font-black text-[11px] uppercase tracking-wider gap-2">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Talents & Mobilité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {evaluations.filter(e => ['PLANIFIEE', 'EN_COURS'].includes(e.statut.toUpperCase())).map((ev) => (
              <Card key={ev.id} className="hover:border-primary/40 transition-all duration-300 cursor-pointer group shadow-md border-2 overflow-hidden bg-white">
                <div className="h-1.5 w-full bg-primary/20 group-hover:bg-primary transition-colors" />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-black text-[9px] uppercase border-primary/20 text-primary bg-primary/5">
                          {getTypeLabel(ev.type)}
                        </Badge>
                        {ev.statut.toUpperCase() === 'EN_COURS' && (
                          <Badge className="bg-blue-500 text-white border-none text-[8px] animate-pulse">En Cours</Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl font-black group-hover:text-primary transition-colors">{ev.employee_name}</CardTitle>
                      <CardDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{ev.employee_role}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="font-bold text-xs uppercase">
                        <DropdownMenuItem className="gap-2"><FileText className="h-3.5 w-3.5" /> Modifier</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive gap-2"><AlertCircle className="h-3.5 w-3.5" /> Annuler</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center justify-between text-xs font-bold bg-slate-50 p-3 rounded-xl border">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="h-4 w-4 text-primary/60" />
                      Échéance : {new Date(ev.date_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="text-[10px] font-black uppercase opacity-60">ID: {ev.id.split('-')[0]}</div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 flex justify-between items-center bg-primary/5 group-hover:bg-primary/10 transition-colors py-3">
                   <div className="flex gap-1">
                      <div className="h-2 w-8 rounded-full bg-primary/20" />
                      <div className="h-2 w-8 rounded-full bg-slate-200" />
                      <div className="h-2 w-8 rounded-full bg-slate-200" />
                   </div>
                  <Button size="sm" variant="ghost" className="text-[10px] font-black uppercase group/btn">
                    Démarrer l'entretien
                    <ChevronRight className="h-3.5 w-3.5 ml-1.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {evaluations.filter(e => ['PLANIFIEE', 'EN_COURS'].includes(e.statut.toUpperCase())).length === 0 && (
             <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-muted/10">
                <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h4 className="text-lg font-black italic text-muted-foreground">Aucune campagne en cours.</h4>
                <p className="text-xs font-bold text-muted-foreground/60 mb-6 uppercase tracking-widest">Lancez votre prochaine vague d'entretiens mensuels ou annuels.</p>
                <Button className="font-black px-8">Planifier Maintenant</Button>
             </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
           {/* Detailed Table for History */}
           <Card className="border-2 shadow-2xl overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="p-5 font-black uppercase text-[10px] tracking-widest">Employé & Poste</th>
                      <th className="p-5 font-black uppercase text-[10px] tracking-widest">Catégorie</th>
                      <th className="p-5 font-black uppercase text-[10px] tracking-widest">Performance</th>
                      <th className="p-5 font-black uppercase text-[10px] tracking-widest">Appréciation</th>
                      <th className="p-5 font-black uppercase text-[10px] tracking-widest text-right">Rapport</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 border-t-0">
                    {evaluations.filter(e => ['TERMINEE', 'REALISEE'].includes(e.statut.toUpperCase())).map((ev) => (
                      <tr key={ev.id} className="hover:bg-primary/5 transition-all duration-200">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                             <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600 shadow-inner">
                                {ev.employee_name?.split(' ').map(n => n[0]).join('')}
                             </div>
                             <div>
                               <p className="font-black text-sm">{ev.employee_name}</p>
                               <p className="text-[10px] font-black uppercase text-muted-foreground">{ev.employee_role}</p>
                             </div>
                          </div>
                        </td>
                        <td className="p-5">
                          <Badge variant="outline" className="font-black text-[9px] uppercase border-slate-200">
                            {getTypeLabel(ev.type)}
                          </Badge>
                        </td>
                        <td className="p-5">
                           <div className="space-y-1.5 w-32">
                              <div className="flex justify-between items-end">
                                 <span className="text-[10px] font-black uppercase text-muted-foreground">Global</span>
                                 <span className="text-xs font-black">{ev.score_global}/100</span>
                              </div>
                              <Progress value={ev.score_global || 0} className={`h-1.5 ${ev.score_global && ev.score_global >= 75 ? 'bg-emerald-100' : 'bg-slate-100'}`} />
                           </div>
                        </td>
                        <td className="p-5">
                           <Badge variant={scoreVariant(ev.score_global)} className="font-black text-[9px] uppercase tracking-widest px-3 py-1">
                              {scoreLabel(ev.score_global)}
                           </Badge>
                        </td>
                        <td className="p-5 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-full hover:bg-primary/10 text-primary"
                            onClick={() => {
                              const doc = generateEvaluationPDF({
                                evaluation: ev,
                                employee: { full_name: ev.employee_name, poste: ev.employee_role },
                                company: null 
                              });
                              exportPDF(doc, `Evaluation_${ev.employee_name?.replace(/ /g, '_')}`);
                            }}
                          >
                             <FileText className="h-5 w-5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </Card>
        </TabsContent>

        <TabsContent value="mobility" className="space-y-6">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 shadow-2xl border-2 overflow-hidden bg-white">
                <CardHeader className="bg-slate-50 border-b">
                   <div className="flex items-center gap-2 mb-2">
                       <Trophy className="h-5 w-5 text-amber-500" />
                       <Badge variant="secondary" className="text-[9px] font-black uppercase">Top Performers</Badge>
                   </div>
                   <CardTitle className="text-2xl font-black">Vivier de Talents</CardTitle>
                   <CardDescription className="font-bold text-xs">Collaborateurs ayant un score supérieur à 80/100 lors des derniers entretiens.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="divide-y-2">
                      {evaluations.filter(e => (e.score_global || 0) >= 80).map((ev) => (
                         <div key={ev.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-4">
                               <div className="relative">
                                  <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center font-black text-amber-600 shadow-xl">
                                     {ev.employee_name?.charAt(0)}
                                  </div>
                                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center">
                                     <CheckCircle2 className="h-2 w-2 text-white" />
                                  </div>
                               </div>
                               <div>
                                  <h4 className="text-md font-black">{ev.employee_name}</h4>
                                  <p className="text-[11px] text-muted-foreground font-black uppercase tracking-wider">{ev.employee_role}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-6">
                               <div className="text-center">
                                  <p className="text-2xl font-black text-amber-600">{ev.score_global}</p>
                                  <p className="text-[9px] font-black uppercase opacity-50">Score</p>
                               </div>
                               <Button className="font-black text-[10px] uppercase h-9 px-6 shadow-md">Fiche Carrière</Button>
                            </div>
                         </div>
                      ))}
                      {evaluations.filter(e => (e.score_global || 0) >= 80).length === 0 && (
                         <div className="p-20 text-center text-muted-foreground font-bold italic">
                            Aucun profil détecté pour le moment.
                         </div>
                      )}
                   </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                 <Card className="shadow-xl bg-primary text-primary-foreground border-none">
                    <CardHeader>
                       <CardTitle className="text-lg font-black flex items-center gap-2">
                          <ArrowRightLeft className="h-5 w-5" />
                          Mobilité Interne
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <p className="text-xs font-medium opacity-80 decoration-slate-400">
                          Identifiez les opportunités de promotion interne pour réduire vos coûts de recrutement externe.
                       </p>
                       <div className="bg-white/10 p-4 rounded-xl space-y-3">
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-black uppercase">Postes Vacants</span>
                             <Badge variant="secondary" className="bg-white text-primary">04</Badge>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-black uppercase opacity-80">
                             <span>Compétences Match</span>
                             <span>70%</span>
                          </div>
                          <Progress value={70} className="h-1.5 bg-white/20" />
                       </div>
                    </CardContent>
                    <CardFooter>
                       <Button variant="outline" className="w-full bg-transparent text-white border-white/30 hover:bg-white/10 font-black uppercase text-[10px]">
                          Lancer un appel à candidatures
                       </Button>
                    </CardFooter>
                 </Card>

                 <Card className="shadow-xl border-2 border-slate-100">
                    <CardHeader className="pb-3">
                       <CardTitle className="text-sm font-black flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          Legal compliance
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex gap-3">
                          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                          <div>
                             <p className="text-[11px] font-black text-red-900 leading-tight">Attention période d'essai</p>
                             <p className="text-[10px] font-bold text-red-700/80 mt-1">Conformément au Code du Travail (Art. 14.1), le renouvellement doit être notifié par écrit.</p>
                          </div>
                       </div>
                       <Button variant="link" className="w-full text-center text-primary font-black uppercase text-[10px] p-0 h-auto">
                          Générer le courrier type
                       </Button>
                    </CardContent>
                 </Card>
              </div>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
