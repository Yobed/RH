'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Trophy, 
  TrendUp, 
  Star, 
  Warning,
  Info
} from '@phosphor-icons/react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TalentData {
  id: string; // This should be the evaluation ID for update purposes
  employee_id: string;
  name: string;
  performance: number; // 0-100
  potential: number;   // 0-100
  role: string;
}

interface TalentMatrixProps {
  data: TalentData[];
  onPotentialUpdate?: (id: string, potential: number) => void;
}

const GRID_LABELS = {
  y: ['Haut Potentiel', 'Potentiel Moyen', 'Potentiel Limité'],
  x: ['Basse Performance', 'Performance Moyenne', 'Haute Performance']
};

const BOX_DESCRIPTIONS: Record<string, { label: string, color: string, description: string }> = {
  '2-2': { label: 'Star', color: 'bg-amber-500', description: 'Futurs leaders. À promouvoir et challenger.' },
  '2-1': { label: 'Talent Clé', color: 'bg-amber-400', description: 'Performance solide, haut potentiel.' },
  '1-2': { label: 'Core Player', color: 'bg-emerald-500', description: 'Performeurs constants, fidéliser.' },
  '0-2': { label: 'Spécialiste', color: 'bg-teal-500', description: 'Haute expertise, potentiel de management limité.' },
  '1-1': { label: 'Core Talent', color: 'bg-teal-400', description: 'Professionnels en développement.' },
  '2-0': { label: 'Enigme', color: 'bg-teal-400', description: 'Haut potentiel mais performance instable.' },
  '0-1': { label: 'Effectif Fiable', color: 'bg-slate-500', description: 'Contributeurs stables.' },
  '1-0': { label: 'Inconstant', color: 'bg-orange-400', description: 'Performance à améliorer, potentiel modéré.' },
  '0-0': { label: 'À Risque', color: 'bg-red-500', description: 'Action immédiate requise.' },
};

import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TalentMatrix({ data, onPotentialUpdate }: TalentMatrixProps) {
  const getBoxIndex = (val: number) => {
    if (val < 40) return 0;
    if (val < 75) return 1;
    return 2;
  };

  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <TooltipProvider>
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 rounded-2xl text-white">
               <Trophy weight="fill" size={24} />
            </div>
            <div>
               <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Matrice des Talents</h3>
               <p className="text-xs font-bold text-slate-600 uppercase tracking-tight">Analyse 9-Box : Potentiel vs Performance</p>
            </div>
         </div>
         <div className="flex gap-2">
            <Badge variant="outline" className="text-[10px] uppercase font-bold px-3 py-1 bg-white shadow-sm">Audit Manuel Activé</Badge>
         </div>
      </div>

      <div className="relative bg-slate-900/5 p-4 rounded-[3.5rem] border border-white aspect-square w-full max-w-[800px] mx-auto shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]">
        {/* Axis Labels - Vertical */}
        <div className="absolute -left-20 top-1/2 -rotate-90 origin-center flex flex-col items-center gap-4">
           <div className="h-40 w-[1px] bg-gradient-to-t from-transparent via-slate-300 to-transparent" />
           <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-slate-400">Potentiel</span>
           <div className="h-40 w-[1px] bg-gradient-to-b from-transparent via-slate-300 to-transparent" />
        </div>

        {/* Axis Labels - Horizontal */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-8 w-full justify-center">
           <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
           <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-slate-400">Performance</span>
           <div className="h-[1px] w-48 bg-gradient-to-l from-transparent via-slate-300 to-transparent" />
        </div>

        {/* 9-Box Grid Structure */}
        <div className="grid grid-cols-3 grid-rows-3 gap-3 h-full w-full">
          {[2, 1, 0].map((y) => (
            [0, 1, 2].map((x) => {
              const boxKey = `${y}-${x}`;
              const boxInfo = BOX_DESCRIPTIONS[boxKey];
              const employeesInBox = data.filter(e => getBoxIndex(e.potential) === y && getBoxIndex(e.performance) === x);

              return (
                <div 
                  key={boxKey} 
                  className="relative group rounded-[2.5rem] bg-white/40 backdrop-blur-sm border border-white/60 p-6 transition-all duration-700 overflow-hidden flex flex-col items-center justify-center hover:bg-white/80 hover:shadow-2xl shadow-slate-200/20"
                >
                  {/* Strategic Label Background */}
                  <div className="absolute top-6 left-6 flex flex-col items-start opacity-30 group-hover:opacity-100 transition-opacity duration-500">
                     <span className={`text-[9px] font-bold uppercase tracking-tighter ${boxInfo.color.replace('bg-', 'text-')}`}>
                        {boxInfo.label}
                     </span>
                     <div className={`h-1.5 w-6 rounded-full ${boxInfo.color} mt-1`} />
                  </div>

                  {/* Bubbles - Enhanced Physics feel */}
                  <div className="flex flex-wrap gap-3 justify-center items-center z-10 w-full h-full p-4">
                    {employeesInBox.map((emp, idx) => (
                      <Popover key={emp.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20, delay: idx * 0.1 }}
                                whileHover={{ 
                                  scale: 1.15, 
                                  zIndex: 50,
                                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                                }}
                                className={`h-14 w-14 rounded-2xl ${boxInfo.color} text-white flex items-center justify-center font-bold text-sm cursor-pointer border-4 border-white shadow-xl relative group/bubble`}
                              >
                                {emp.name.split(' ').map(n => n[0]).join('')}
                                {/* Subtle Glow */}
                                <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover/bubble:opacity-100 transition-opacity" />
                              </motion.div>
                            </PopoverTrigger>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 text-white border-none p-6 rounded-[2rem] shadow-3xl min-w-[200px]">
                             <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                   <div className={`h-12 w-12 rounded-xl ${boxInfo.color} flex items-center justify-center font-bold text-lg`}>
                                      {emp.name.charAt(0)}
                                   </div>
                                   <div>
                                      <p className="font-bold text-base tracking-tight">{emp.name}</p>
                                      <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{emp.role}</p>
                                   </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                                   <div className="text-center">
                                      <span className="text-[9px] font-bold uppercase opacity-40 block mb-1">Performance</span>
                                      <span className="text-xl font-bold text-emerald-400">{emp.performance}%</span>
                                   </div>
                                   <div className="text-center border-l border-white/10">
                                      <span className="text-[9px] font-bold uppercase opacity-40 block mb-1">Potentiel</span>
                                      <span className="text-xl font-bold text-primary">{emp.potential}%</span>
                                   </div>
                                </div>
                                <p className="text-[9px] font-bold text-primary animate-pulse text-center uppercase tracking-widest bg-primary/10 py-2 rounded-xl">Analyse prédictive disponible</p>
                             </div>
                          </TooltipContent>
                        </Tooltip>
                        <PopoverContent className="w-96 p-8 rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] bg-white border border-slate-100/50">
                           <div className="space-y-8">
                              <div className="flex items-center gap-4">
                                 <div className={`h-14 w-14 rounded-2xl ${boxInfo.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                                   {emp.name.charAt(0)}
                                 </div>
                                 <div className="space-y-1">
                                    <h4 className="text-xl font-bold text-slate-900 tracking-tight">{emp.name}</h4>
                                    <Badge variant="secondary" className="text-[10px] font-bold uppercase bg-slate-100/50 text-slate-600">Ajustement Stratégique</Badge>
                                 </div>
                              </div>

                              <div className="space-y-6">
                                 <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                       <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-[0.2em]">Cote de Potentiel</span>
                                       <span className="text-sm font-bold text-slate-600 italic">Basé sur les derniers KPIs</span>
                                    </div>
                                    <span className="text-5xl font-bold text-primary tracking-tighter">{emp.potential}<span className="text-xl">%</span></span>
                                 </div>

                                 <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden border-4 border-slate-50">
                                    <motion.div 
                                       className={`h-full ${boxInfo.color}`}
                                       initial={{ width: 0 }}
                                       animate={{ width: `${emp.potential}%` }}
                                    />
                                    <input 
                                       type="range" 
                                       min="0" 
                                       max="100" 
                                       defaultValue={emp.potential}
                                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                       onChange={(e) => {
                                          const val = e.target.value;
                                          const parent = e.target.parentElement;
                                          const display = parent?.previousElementSibling?.lastElementChild;
                                          if (display) display.innerHTML = `${val}<span class="text-xl">%</span>`;
                                       }}
                                       id={`potential-range-${emp.id}`}
                                    />
                                 </div>

                                 <div className="grid grid-cols-3 gap-3">
                                    {[30, 60, 90].map(v => (
                                      <Button 
                                        key={v}
                                        variant="outline" 
                                        size="sm" 
                                        className={`rounded-2xl font-bold text-[10px] uppercase h-12 transition-all hover:scale-105 ${v === 90 ? 'bg-primary/5 border-primary/20 text-primary' : ''}`}
                                        onClick={() => {
                                          const input = document.getElementById(`potential-range-${emp.id}`) as HTMLInputElement;
                                          if (input) {
                                             input.value = String(v);
                                             input.dispatchEvent(new Event('change', { bubbles: true }));
                                          }
                                        }}
                                      >
                                        {v === 30 ? 'Stable' : v === 60 ? 'Croissant' : 'Lead'}
                                      </Button>
                                    ))}
                                 </div>
                              </div>

                              <div className="flex gap-3">
                                 <Button 
                                   variant="ghost"
                                   className="flex-1 rounded-2xl font-bold uppercase text-[10px] h-14 bg-slate-50 hover:bg-slate-100"
                                   onClick={() => setUpdatingId(null)}
                                 >
                                    Sortir
                                 </Button>
                                 <Button 
                                   className="flex-[2] bg-slate-900 text-white hover:bg-black font-bold uppercase text-[10px] h-14 rounded-2xl shadow-2xl transition-all hover:-translate-y-1"
                                   onClick={() => {
                                     const input = document.getElementById(`potential-range-${emp.id}`) as HTMLInputElement;
                                     if (input && onPotentialUpdate) {
                                       onPotentialUpdate(emp.id, parseInt(input.value));
                                     }
                                   }}
                                 >
                                    Appliquer les Changements
                                 </Button>
                              </div>
                           </div>
                        </PopoverContent>
                      </Popover>
                    ))}
                  </div>

                  {/* Strategic Hover Info */}
                  <div className="absolute inset-0 bg-slate-900/95 text-white p-8 translate-y-full group-hover:translate-y-0 transition-transform duration-700 flex flex-col justify-center gap-4">
                     <div className="space-y-1">
                        <h4 className={`text-base font-bold uppercase tracking-widest ${boxInfo.color.replace('bg-', 'text-')}`}>{boxInfo.label}</h4>
                        <div className="h-[2px] w-12 bg-white/20" />
                     </div>
                     <p className="text-[11px] leading-relaxed font-bold text-white/50 border-white/10">{boxInfo.description}</p>
                     <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-3 py-1 rounded-full">{employeesInBox.length} Profil(s)</span>
                        <div className="flex -space-x-3">
                           {employeesInBox.slice(0, 3).map((e, index) => (
                              <div key={index} className={`h-8 w-8 rounded-full border-2 border-slate-900 ${boxInfo.color} flex items-center justify-center text-[10px] font-bold`}>
                                 {e.name[0]}
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
                </div>
              );
            })
          ))}
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
         {/* Footer items unchanged */}
         <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
               <Info weight="bold" />
               Guide d'Interprétation
            </h4>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <div className="flex items-center gap-2">
                     <div className="h-2 w-2 rounded-full bg-amber-500" />
                     <span className="text-[10px] font-bold text-slate-600 uppercase">Axe Stratégique</span>
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium leading-tight">Focus sur la succession et le leadership global.</p>
               </div>
               <div className="space-y-2">
                  <div className="flex items-center gap-2">
                     <div className="h-2 w-2 rounded-full bg-emerald-500" />
                     <span className="text-[10px] font-bold text-slate-600 uppercase">Force Vive</span>
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium leading-tight">Maintien de l’expertise et stabilité opérationnelle.</p>
               </div>
            </div>
         </div>
         <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200/50 flex flex-col justify-center">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <TrendUp weight="fill" size={24} />
               </div>
               <div>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-none mb-1">Index de Rétention (IA)</p>
                  <p className="text-2xl font-bold text-slate-900 tracking-tighter">84.2%</p>
               </div>
            </div>
         </div>
      </div>
      </TooltipProvider>
    </div>
  );
}
