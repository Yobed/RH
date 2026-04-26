'use client';

import React, { useState, useEffect } from 'react';
import { 
  Target, 
  TrendUp, 
  Star, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock, 
  Warning, 
  Plus, 
  ArrowsLeftRight, 
  FileText,
  CaretRight,
  DotsThreeVertical,
  Trophy,
  SealCheck,
  ClockCounterClockwise
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Eye, Robot } from '@phosphor-icons/react';
import { TalentMatrix } from "./TalentMatrix";


interface Evaluation {
  id: string;
  employee_id: string;
  type: string;
  periode: string;
  date_prevue: string;
  date_realisation: string | null;
  statut: string;
  score_global: number | null;
  potential_score: number | null;
  titre: string;
  evaluateur_id: string | null;
  synthese_ia: string | null;
  employee_name?: string;
  employee_role?: string;
}

interface PerformanceReviewManagerProps {
  initialEvaluations?: Evaluation[];
  employees?: any[];
}

export default function PerformanceReviewManager({ initialEvaluations = [], employees = [] }: PerformanceReviewManagerProps) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>(initialEvaluations);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [isSynthesisModalOpen, setIsSynthesisModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

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
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 gap-1"><SealCheck weight="fill" className="h-3 w-3" /> Terminé</Badge>;
      case 'PLANIFIEE':
      case 'EN_COURS':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 gap-1"><Clock weight="bold" className="h-3 w-3" /> À venir</Badge>;
      case 'ANNULEE': 
        return <Badge variant="secondary">Annulé</Badge>;
      default: return <Badge variant="outline">{statut}</Badge>;
    }
  };

  // KPI Calculations
  const activeEvaluations = evaluations.filter(e => ['PLANIFIEE', 'EN_COURS'].includes(e.statut.toUpperCase()));
  const pendingCount = activeEvaluations.length;
  const completedCount = evaluations.filter(e => ['TERMINEE', 'REALISEE'].includes(e.statut.toUpperCase())).length;
  const highPerformers = evaluations.filter(e => (e.score_global || 0) >= 80).length;
  const trialAlerts = evaluations.filter(e => e.type === 'PERIODE_ESSAI' && !['REALISEE', 'TERMINEE'].includes(e.statut.toUpperCase())).length;

  const handlePotentialUpdate = async (id: string, potential_score: number) => {
    try {
      const res = await fetch('/api/evaluations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, potential_score })
      });

      if (!res.ok) throw new Error('Erreur lors de la mise à jour');

      setEvaluations(prev => prev.map(ev => 
        ev.id === id ? { ...ev, potential_score } : ev
      ));

      toast.success("Potentiel mis à jour avec succès");
    } catch (error) {
      console.error(error);
      toast.error("Impossible de mettre à jour le potentiel");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      {/* Header with quick action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-black uppercase px-2 py-0.5">Capital Humain</Badge>
             <div className="h-1 w-1 rounded-full bg-slate-300" />
             <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tight">Gestion de la Performance</span>
          </div>
          <h2 className="text-4xl font-black tracking-tightest flex items-center gap-4 text-slate-900">
            Performance & Insights
          </h2>
          <p className="text-muted-foreground text-sm font-medium max-w-2xl mt-2 leading-relaxed">
            Optimisez le capital humain de votre organisation par un suivi analytique des compétences et une gestion proactive des talents de demain.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
           <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-primary transition-colors">
                 <Eye size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Chercher un collaborateur..." 
                className="h-12 pl-12 pr-6 rounded-2xl bg-slate-100 border-none font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all w-full md:w-64 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           <EvaluationDialog employees={employees} />
        </div>
      </div>

      {/* KPI Cards with Premium Glassmorphism - Refined */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-slate-950 text-white border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative overflow-hidden group h-full rounded-[2.5rem]">
            <div className="absolute -right-8 -top-8 opacity-10 group-hover:scale-125 transition-all duration-1000 rotate-12">
               <Target weight="duotone" size={160} />
            </div>
            <CardHeader className="pb-2 p-8">
               <div className="flex items-center gap-3 mb-4">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <CardDescription className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Campaign Focus</CardDescription>
               </div>
               <CardTitle className="text-6xl font-black tracking-tightest leading-none">{pendingCount}</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
               <p className="text-[11px] font-black text-white/50 flex items-center gap-2 uppercase tracking-wide">
                  Active Reviews In-Flight
               </p>
            </CardContent>
            <div className="h-1.5 w-full bg-gradient-to-r from-primary/50 to-primary absolute bottom-0 left-0" />
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] relative overflow-hidden group bg-white h-full rounded-[2.5rem] ring-1 ring-slate-100">
             <div className="absolute -right-8 -top-8 opacity-5 group-hover:scale-125 transition-all duration-1000 text-emerald-500 -rotate-12">
               <TrendUp weight="duotone" size={160} />
            </div>
            <CardHeader className="pb-2 p-8">
               <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Completion Velocity</CardDescription>
               <CardTitle className="text-6xl font-black tracking-tightest text-slate-900 leading-none">
                 {evaluations.length > 0 ? Math.round((completedCount / evaluations.length) * 100) : 0}<span className="text-2xl text-emerald-500">%</span>
               </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
               <div className="space-y-4">
                  <Progress value={evaluations.length > 0 ? (completedCount / evaluations.length) * 100 : 0} className="h-2 bg-slate-50" />
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-tight">Milestones Achieved</p>
               </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] relative overflow-hidden group bg-white h-full rounded-[2.5rem] ring-1 ring-slate-100">
            <div className="absolute -right-8 -top-8 opacity-5 group-hover:scale-125 transition-all duration-1000 text-amber-500 rotate-45">
               <Trophy weight="duotone" size={160} />
            </div>
            <CardHeader className="pb-2 p-8">
               <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Top Talent Pool</CardDescription>
               <CardTitle className="text-6xl font-black tracking-tightest text-slate-900 leading-none">{highPerformers}</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
               <p className="text-[10px] text-slate-500 font-black uppercase flex items-center gap-2 tracking-wide">
                  <Star weight="fill" className="h-4 w-4 text-amber-400" />
                  Performance Leaders
               </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className={`border-none relative overflow-hidden group transition-all duration-500 h-full rounded-[2.5rem] ring-1 ${trialAlerts > 0 ? 'ring-red-100 bg-red-50/10 shadow-[0_24px_48px_-12px_rgba(239,68,68,0.1)]' : 'ring-slate-100 bg-white shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)]'}`}>
            <div className="absolute -right-8 -top-8 opacity-5 group-hover:scale-125 transition-all duration-1000 text-red-500">
               <Warning weight="duotone" size={160} />
            </div>
            <CardHeader className="pb-2 p-8">
               <CardDescription className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 ${trialAlerts > 0 ? 'text-red-500' : 'text-slate-400'}`}>Critical Alerts</CardDescription>
               <CardTitle className={`text-6xl font-black tracking-tightest leading-none ${trialAlerts > 0 ? 'text-red-600' : 'text-slate-900'}`}>{trialAlerts}</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
               <p className={`text-[10px] font-black uppercase flex items-center gap-2 tracking-wide ${trialAlerts > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                  {trialAlerts > 0 ? 'Trial Period Decisions' : 'Compliance Verified'}
               </p>
            </CardContent>
            {trialAlerts > 0 && <div className="h-1.5 w-full bg-red-500 absolute bottom-0 left-0 animate-pulse" />}
          </Card>
        </motion.div>
      </div>


      <Tabs defaultValue="upcoming" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="flex w-fit mb-12 bg-white/50 p-2 h-16 rounded-[2rem] backdrop-blur-xl border border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-2xl font-black text-[11px] uppercase tracking-wider px-10 rounded-[1.5rem] gap-3 transition-all">
            <Clock weight="bold" className="h-4 w-4" />
            Workflow Actif
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-2xl font-black text-[11px] uppercase tracking-wider px-10 rounded-[1.5rem] gap-3 transition-all">
            <ClockCounterClockwise weight="bold" className="h-4 w-4" />
            Historique Audit
          </TabsTrigger>
          <TabsTrigger value="mobility" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-2xl font-black text-[11px] uppercase tracking-wider px-10 rounded-[1.5rem] gap-3 transition-all">
            <ArrowsLeftRight weight="bold" className="h-4 w-4" />
            Talent Strategy
          </TabsTrigger>
        </TabsList>


        <AnimatePresence mode="wait">
          <TabsContent value="upcoming" key="upcoming">
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
               className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <div className="col-span-full flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-hide">
                {['ALL', 'ANNUELLE', 'MENSUELLE', 'PERIODE_ESSAI'].map((type) => (
                  <Button 
                    key={type}
                    variant={filterType === type ? "default" : "outline"}
                    className={`rounded-xl font-black text-[9px] uppercase h-8 px-4 transition-all ${filterType === type ? 'shadow-lg shadow-primary/20' : 'bg-white'}`}
                    onClick={() => setFilterType(type)}
                  >
                    {type === 'ALL' ? 'Tous les cycles' : getTypeLabel(type)}
                  </Button>
                ))}
              </div>
              {activeEvaluations
                .filter(ev => 
                  (filterType === 'ALL' || ev.type === filterType) &&
                  (ev.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   ev.employee_role?.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map((ev, index) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 cursor-pointer border-2 border-slate-100 rounded-3xl overflow-hidden bg-white hover:border-primary/20">
                    <div className="h-1.5 w-full bg-slate-100 group-hover:bg-primary transition-all duration-500" />
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Badge className="font-black text-[9px] uppercase border-none bg-primary/10 text-primary tracking-widest px-3 py-1">
                              {getTypeLabel(ev.type)}
                            </Badge>
                            {ev.statut.toUpperCase() === 'EN_COURS' && (
                              <div className="flex items-center gap-1 bg-blue-500 rounded-full px-2 py-0.5">
                                 <span className="h-1.5 w-1.5 bg-white rounded-full animate-ping" />
                                 <span className="text-[8px] font-black uppercase text-white">Actif</span>
                              </div>
                            )}
                          </div>
                          <CardTitle className="text-2xl font-black text-slate-800 tracking-tight group-hover:translate-x-1 transition-transform">{ev.employee_name}</CardTitle>
                          <div className="flex items-center gap-2">
                             <Badge variant="outline" className="text-[10px] font-black uppercase text-slate-600 border-slate-200">
                                {ev.employee_role}
                             </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-slate-100">
                              <DotsThreeVertical weight="bold" className="h-6 w-6" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="font-black text-[10px] uppercase p-2 border-2 rounded-xl">
                            <DropdownMenuItem className="gap-3 py-3 hover:bg-primary/5 rounded-lg"><FileText weight="fill" /> Modifier</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500 gap-3 py-3 hover:bg-red-50 rounded-lg"><Warning weight="fill" /> Annuler</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-6">
                      <div className="flex items-center justify-between text-[11px] font-black bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3 text-slate-600">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                             <Calendar weight="duotone" className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[9px] uppercase opacity-50">Échéance Finale</span>
                             <span>{new Date(ev.date_prevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          </div>
                        </div>
                        <div className="h-10 w-px bg-slate-200 mx-2" />
                        <div className="text-right">
                           <span className="text-[9px] uppercase opacity-50 block">ID Dossier</span>
                           <span className="font-mono text-xs opacity-60">#{ev.id.split('-')[0].toUpperCase()}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-between items-center bg-slate-50/30 py-4 px-6 border-t border-slate-50">
                       <div className="flex gap-1.5">
                          <div className="h-1.5 w-6 rounded-full bg-primary" />
                          <div className="h-1.5 w-6 rounded-full bg-slate-200" />
                          <div className="h-1.5 w-6 rounded-full bg-slate-200" />
                       </div>
                      <Button className="rounded-2xl font-black text-[11px] uppercase group/btn px-6 relative overflow-hidden">
                        <span className="relative z-10 flex items-center gap-2">
                           Lancer l'audit
                           <CaretRight weight="bold" className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </span>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}

              {activeEvaluations.length === 0 && (
                <div className="col-span-full text-center py-24 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                       <Target weight="thin" size={80} className="text-slate-300 mx-auto mb-6" />
                    </motion.div>
                    <h4 className="text-2xl font-black text-slate-600">Aucune campagne en attente.</h4>
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] mb-8 mt-2">Votre flux d'évaluation est parfaitement synchronisé.</p>
                    <Button variant="outline" className="font-black border-2 rounded-2xl px-10 h-14 uppercase text-[11px] hover:bg-slate-900 hover:text-white transition-all shadow-xl">
                       Démarrer un nouveau cycle
                    </Button>
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="completed" key="completed">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-none shadow-2xl shadow-slate-200/50 overflow-hidden rounded-[2rem] bg-white ring-1 ring-slate-100">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th className="p-6 font-black uppercase text-[10px] tracking-[0.2em] border-b">Collaborateur</th>
                        <th className="p-6 font-black uppercase text-[10px] tracking-[0.2em] border-b text-center">Cycle</th>
                        <th className="p-6 font-black uppercase text-[10px] tracking-[0.2em] border-b">KPI Performance</th>
                        <th className="p-6 font-black uppercase text-[10px] tracking-[0.2em] border-b">Verdict</th>
                        <th className="p-6 font-black uppercase text-[10px] tracking-[0.2em] border-b text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-slate-50">
                      {evaluations.filter(e => ['TERMINEE', 'REALISEE'].includes(e.statut.toUpperCase())).map((ev) => (
                        <tr key={ev.id} className="hover:bg-slate-50/80 transition-all duration-300 group">
                          <td className="p-6">
                            <div className="flex items-center gap-4">
                               <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-600 shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                  {ev.employee_name?.split(' ').map(n => n[0]).join('')}
                               </div>
                               <div>
                                 <p className="font-black text-sm text-slate-800">{ev.employee_name}</p>
                                 <p className="text-[10px] font-black uppercase text-slate-600 group-hover:text-primary transition-colors">{ev.employee_role}</p>
                               </div>
                            </div>
                          </td>
                          <td className="p-6 text-center">
                            <Badge variant="outline" className="font-black text-[9px] uppercase border-slate-200 bg-white">
                              {getTypeLabel(ev.type)}
                            </Badge>
                          </td>
                          <td className="p-6">
                             <div className="space-y-2 w-40">
                                <div className="flex justify-between items-end">
                                   <span className="text-[9px] font-black uppercase text-slate-600">Score Moyen</span>
                                   <span className="text-sm font-black text-slate-700">{ev.score_global}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                   <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${ev.score_global}%` }}
                                      className={`h-full ${ev.score_global && ev.score_global >= 75 ? 'bg-emerald-500' : 'bg-primary'}`}
                                   />
                                </div>
                             </div>
                          </td>
                          <td className="p-6">
                             <Badge 
                               variant={scoreVariant(ev.score_global)} 
                               className="font-black text-[9px] uppercase tracking-widest px-4 py-1.5 shadow-sm rounded-lg"
                             >
                                {scoreLabel(ev.score_global)}
                             </Badge>
                          </td>
                          <td className="p-6 text-right">
                            <div className="flex justify-end gap-2">
                              {ev.synthese_ia && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-10 w-10 rounded-2xl hover:bg-indigo-50 text-indigo-600 hover:scale-110 transition-all border border-transparent hover:border-indigo-100"
                                  onClick={() => {
                                    setSelectedEvaluation(ev);
                                    setIsSynthesisModalOpen(true);
                                  }}
                                  title="Voir la synthèse IA"
                                >
                                   <Robot weight="fill" className="h-5 w-5" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 rounded-2xl hover:bg-primary/10 text-primary hover:scale-110 transition-all shadow-sm"
                                onClick={() => {
                                  const doc = generateEvaluationPDF({
                                    evaluation: ev,
                                    employee: { full_name: ev.employee_name, poste: ev.employee_role },
                                    company: null 
                                  });
                                  exportPDF(doc, `Evaluation_${ev.employee_name?.replace(/ /g, '_')}`);
                                }}
                                title="Télécharger le rapport PDF"
                              >
                                 <FileText weight="fill" className="h-5 w-5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="mobility" key="mobility" className="space-y-8">
             <motion.div
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               className="grid grid-cols-1 gap-8"
             >
                <Card className="shadow-2xl border-none ring-1 ring-slate-100 overflow-hidden bg-white rounded-[2.5rem]">
                   <CardHeader className="bg-slate-50/50 border-b p-8">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="p-4 bg-slate-900 rounded-[1.5rem] text-white shadow-2xl">
                               <Trophy weight="fill" size={32} />
                            </div>
                            <div>
                               <Badge variant="secondary" className="text-[10px] font-black uppercase text-primary bg-primary/10 border-primary/20 mb-1">Talent Intelligence</Badge>
                               <CardTitle className="text-3xl font-black text-slate-900 tracking-tightest">Matrice de Potentiel vs Performance</CardTitle>
                            </div>
                         </div>
                         <Button 
                            variant="outline" 
                            className="rounded-2xl font-black text-[11px] uppercase px-8 h-12 border-2 hover:bg-slate-900 hover:text-white transition-all shadow-lg"
                            onClick={() => {
                               toast.info("Génération du rapport prédictif en cours...");
                               // Mock export for now
                            }}
                         >
                            Exporter Analyse Predictive
                         </Button>
                      </div>
                   </CardHeader>
                   <CardContent className="p-10">
                      <TalentMatrix 
                        data={evaluations
                          .filter(e => e.statut === 'REALISEE' || e.statut === 'TERMINEE')
                          .map(e => ({
                            id: e.id,
                            employee_id: e.employee_id,
                            name: e.employee_name || 'Inconnu',
                            performance: e.score_global || 0,
                            potential: e.potential_score || (e.score_global ? e.score_global + 10 : 50),
                            role: e.employee_role || 'N/A'
                          }))
                        } 
                        onPotentialUpdate={handlePotentialUpdate}
                      />
                   </CardContent>
                </Card>
             </motion.div>

             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="grid grid-cols-1 lg:grid-cols-3 gap-8"
             >
                <Card className="lg:col-span-2 shadow-2xl border-none ring-1 ring-slate-100 overflow-hidden bg-white rounded-[2.5rem]">
                  <CardHeader className="bg-slate-50/50 border-b p-8">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                           <Trophy weight="duotone" size={40} className="text-amber-500" />
                           <div>
                              <Badge variant="secondary" className="text-[9px] font-black uppercase text-amber-700 bg-amber-50 border-amber-100 mb-1">Elite Pool</Badge>
                              <CardTitle className="text-3xl font-black text-slate-800">Vivier de Talents</CardTitle>
                           </div>
                        </div>
                        <div className="text-right">
                           <span className="text-4xl font-black text-amber-500">{highPerformers}</span>
                           <span className="text-[10px] font-black block uppercase text-slate-600">Collaborateurs Clés</span>
                        </div>
                     </div>
                     <CardDescription className="font-bold text-xs leading-relaxed max-w-xl text-slate-600 uppercase tracking-tight">
                        Cette section liste les employés ayant démontré une performance exceptionnelle (&gt;80%). Ils constituent votre réserve stratégique pour la succession et la mobilité interne.
                     </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                     <div className="divide-y">
                        {evaluations.filter(e => (e.score_global || 0) >= 80).map((ev) => (
                           <motion.div 
                              whileHover={{ x: 10, backgroundColor: 'rgba(248, 250, 252, 0.8)' }}
                              key={ev.id} 
                              className="flex items-center justify-between p-8 transition-all"
                           >
                              <div className="flex items-center gap-6">
                                 <div className="relative">
                                    <div className="h-16 w-16 rounded-[1.5rem] bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-white text-xl shadow-[0_10px_30px_rgba(245,158,11,0.3)]">
                                       {ev.employee_name?.charAt(0)}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-lg">
                                       <div className="bg-emerald-500 h-5 w-5 rounded-full flex items-center justify-center">
                                          <SealCheck weight="bold" className="h-3 w-3 text-white" />
                                       </div>
                                    </div>
                                 </div>
                                 <div>
                                    <h4 className="text-xl font-black text-slate-800">{ev.employee_name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                       <Badge variant="secondary" className="text-[9px] font-black uppercase bg-slate-100 text-slate-600">{ev.employee_role}</Badge>
                                       <span className="text-[10px] font-black text-emerald-600 uppercase">Haut Potentiel</span>
                                    </div>
                                 </div>
                              </div>
                              <div className="flex items-center gap-8">
                                 <div className="text-right">
                                    <p className="text-3xl font-black text-amber-600">{ev.score_global}</p>
                                    <p className="text-[10px] font-black uppercase text-slate-600">Score Global</p>
                                 </div>
                                 <Button className="font-black text-[11px] uppercase h-12 px-8 rounded-2xl shadow-lg hover:shadow-primary/20 transition-all">
                                    Dossier Complet
                                 </Button>
                              </div>
                           </motion.div>
                        ))}
                        {evaluations.filter(e => (e.score_global || 0) >= 80).length === 0 && (
                           <div className="p-24 text-center">
                              <Star weight="thin" size={60} className="text-slate-200 mx-auto mb-4" />
                              <p className="text-slate-600 font-black uppercase tracking-widest text-xs italic">
                                 En attente de futures évaluations de haut niveau.
                              </p>
                           </div>
                        )}
                     </div>
                  </CardContent>
                </Card>

                <div className="space-y-8">
                   <Card className="shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none rounded-[2rem] overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                         <ArrowsLeftRight weight="bold" size={100} />
                      </div>
                      <CardHeader className="p-8">
                         <CardTitle className="text-2xl font-black flex items-center gap-3">
                            Stratégie Mobilité
                         </CardTitle>
                      </CardHeader>
                      <CardContent className="px-8 pb-8 space-y-6">
                         <p className="text-xs font-medium text-white/70 leading-relaxed">
                            Réduisez vos coûts de recrutement externe en favorisant l'évolution de vos talents internes grâce aux données de performance prédictives.
                         </p>
                         <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-5">
                            <div className="flex justify-between items-center">
                               <span className="text-[11px] font-black uppercase text-white/60">Opportunités de Gestion</span>
                               <Badge className="bg-primary text-white rounded-lg">PROMOTION</Badge>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-white/40">
                                   <span>Index de Mobilité</span>
                                   <span>82%</span>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                   <div className="h-full w-[82%] bg-primary" />
                                </div>
                            </div>
                         </div>
                         <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black uppercase text-[11px] h-14 rounded-2xl shadow-xl">
                            Visualiser la Matrice 9-Box
                         </Button>
                      </CardContent>
                   </Card>

                   <Card className="shadow-2xl border-none ring-1 ring-slate-100 rounded-[2rem] overflow-hidden bg-white">
                      <CardHeader className="pb-4 p-8">
                         <CardTitle className="text-sm font-black flex items-center gap-3 text-red-600">
                            <Warning weight="fill" className="h-5 w-5" />
                            Vigilance Juridique
                         </CardTitle>
                      </CardHeader>
                      <CardContent className="px-8 pb-8 space-y-6">
                         <div className="p-5 bg-red-50/50 rounded-2xl border border-red-100/50 flex gap-4">
                            <Warning weight="duotone" className="h-8 w-8 text-red-500 shrink-0" />
                            <div>
                               <p className="text-sm font-black text-red-900 leading-tight mb-2">Conformité Période d'Essai</p>
                               <p className="text-[11px] font-bold text-red-700/70 leading-relaxed">
                                  En Côte d'Ivoire (Art. 14.1), le renouvellement de la période d'essai est unique et doit être notifié par écrit avant son terme.
                               </p>
                            </div>
                         </div>
                         <Button variant="outline" className="w-full border-2 rounded-2xl font-black uppercase text-[10px] h-12 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all">
                            Générer Courriers de Rappel
                         </Button>
                      </CardContent>
                   </Card>
                </div>
             </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      {/* Premium Analysis Modal */}
      <Dialog open={isSynthesisModalOpen} onOpenChange={setIsSynthesisModalOpen}>
        <DialogContent className="max-w-[600px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.3)] bg-white">
          <div className="bg-slate-900 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <Robot weight="fill" size={100} />
            </div>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                 <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-black uppercase px-2 py-0.5">Intelligence Artificielle</Badge>
              </div>
              <DialogTitle className="text-3xl font-black tracking-tightest">Analyse de Performance</DialogTitle>
              <DialogDescription className="text-slate-600 font-bold text-xs uppercase tracking-tightest mt-1">
                Synthèse générée par Gemini Flash pour {selectedEvaluation?.employee_name}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-10 space-y-8 bg-white">
            <div className="flex gap-6 items-start">
               <div className="p-4 bg-primary/5 rounded-[2rem] border border-primary/10">
                  <Star weight="fill" size={32} className="text-primary" />
               </div>
               <div className="space-y-4 flex-1">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Synthèse Décisionnelle</h4>
                  <p className="text-lg font-black text-slate-800 leading-snug italic">
                    "{selectedEvaluation?.synthese_ia || "Aucune synthèse disponible pour cette évaluation."}"
                  </p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-600 uppercase block mb-1">Score Global</span>
                  <span className="text-4xl font-black text-slate-900">{selectedEvaluation?.score_global}%</span>
               </div>
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-600 uppercase block mb-1">Verdict RH</span>
                  <Badge variant={scoreVariant(selectedEvaluation?.score_global || 0)} className="font-black text-[10px] uppercase px-3 py-1">
                    {scoreLabel(selectedEvaluation?.score_global || 0)}
                  </Badge>
               </div>
            </div>
          </div>

          <DialogFooter className="bg-slate-50/50 p-6 border-t border-slate-100">
            <Button 
               onClick={() => setIsSynthesisModalOpen(false)}
               className="bg-slate-900 text-white hover:bg-slate-800 font-black uppercase text-[11px] h-14 w-full rounded-2xl shadow-xl transition-all"
            >
              Fermer l'Analyse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
