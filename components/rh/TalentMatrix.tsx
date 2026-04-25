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
  '0-2': { label: 'Spécialiste', color: 'bg-blue-500', description: 'Haute expertise, potentiel de management limité.' },
  '1-1': { label: 'Core Talent', color: 'bg-blue-400', description: 'Professionnels en développement.' },
  '2-0': { label: 'Enigme', color: 'bg-indigo-400', description: 'Haut potentiel mais performance instable.' },
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
               <h3 className="text-2xl font-black text-slate-800 tracking-tight">Matrice des Talents</h3>
               <p className="text-xs font-bold text-slate-600 uppercase tracking-tight">Analyse 9-Box : Potentiel vs Performance</p>
            </div>
         </div>
         <div className="flex gap-2">
            <Badge variant="outline" className="text-[10px] uppercase font-black px-3 py-1 bg-white shadow-sm">Audit Manuel Activé</Badge>
         </div>
      </div>

      <div className="relative grid grid-cols-3 grid-rows-3 gap-2 bg-slate-100 p-2 rounded-[2.5rem] aspect-square w-full max-w-[700px] mx-auto border-8 border-slate-50 shadow-2xl">
        {/* Axis Labels unchanged */}
        <div className="absolute -left-16 top-1/2 -rotate-90 origin-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 flex items-center gap-4">
           Potentiel <div className="h-px w-20 bg-slate-200" />
        </div>

        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 flex items-center gap-4">
           Performance <div className="h-px w-20 bg-slate-200" />
        </div>

        {/* 9 boxes */}
        {[2, 1, 0].map((y) => (
          [0, 1, 2].map((x) => {
            const boxKey = `${y}-${x}`;
            const boxInfo = BOX_DESCRIPTIONS[boxKey];
            const employeesInBox = data.filter(e => getBoxIndex(e.potential) === y && getBoxIndex(e.performance) === x);

            return (
              <div 
                key={boxKey} 
                className={`relative group rounded-2xl bg-white/60 p-4 border border-white/40 transition-all duration-500 overflow-hidden flex flex-col items-center justify-center`}
              >
                {/* Background Label */}
                <div className="absolute top-3 left-3 opacity-20 pointer-events-none">
                   <div className={`h-1.5 w-1.5 rounded-full ${boxInfo.color} mb-1`} />
                   <span className="text-[8px] font-black uppercase text-slate-600 leading-none">{boxInfo.label}</span>
                </div>

                {/* Employees Bubble Container */}
                <div className="flex flex-wrap gap-2 justify-center content-center z-10 w-full h-full">
                  {employeesInBox.map((emp) => (
                    <Popover key={emp.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <PopoverTrigger asChild>
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              whileHover={{ scale: 1.2, zIndex: 50 }}
                              className={`h-10 w-10 rounded-xl ${boxInfo.color} text-white flex items-center justify-center font-black text-xs shadow-lg cursor-pointer ring-4 ring-white transition-all`}
                            >
                              {emp.name.split(' ').map(n => n[0]).join('')}
                            </motion.div>
                          </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent className="bg-slate-900 text-white border-none p-4 rounded-2xl shadow-2xl">
                           <div className="space-y-1">
                              <p className="font-black text-sm">{emp.name}</p>
                              <p className="text-[10px] font-bold text-white/50 uppercase">{emp.role}</p>
                              <div className="flex gap-4 mt-3 border-t border-white/10 pt-3">
                                 <div>
                                    <span className="text-[8px] font-black uppercase opacity-50 block">Performance</span>
                                    <span className="text-sm font-black">{emp.performance}%</span>
                                 </div>
                                 <div className="h-8 w-px bg-white/10" />
                                 <div>
                                    <span className="text-[8px] font-black uppercase opacity-50 block">Potentiel</span>
                                    <span className="text-sm font-black">{emp.potential}%</span>
                                 </div>
                              </div>
                              <p className="text-[8px] font-bold text-primary mt-2 uppercase animate-pulse">Cliquer pour modifier le potentiel</p>
                           </div>
                        </TooltipContent>
                      </Tooltip>
                      <PopoverContent className="w-80 p-6 rounded-[2rem] shadow-3xl bg-white border-none ring-1 ring-slate-100">
                         <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                               <div className={`h-10 w-10 rounded-xl ${boxInfo.color} flex items-center justify-center text-white font-black`}>
                                 {emp.name.charAt(0)}
                               </div>
                               <div>
                                  <h4 className="text-sm font-black text-slate-800">{emp.name}</h4>
                                  <p className="text-[10px] font-bold text-slate-600 uppercase">Ajustement du Potentiel</p>
                               </div>
                            </div>
                            <div className="space-y-3">
                               <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-600">
                                  <span>Potentiel (%)</span>
                                  <span className="text-primary font-black text-lg">{emp.potential}%</span>
                               </div>
                               <input 
                                 type="range" 
                                 min="0" 
                                 max="100" 
                                 defaultValue={emp.potential}
                                 className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                                 onChange={(e) => {
                                   const val = parseInt(e.target.value);
                                   // Visual feedback usually goes here, but we'll stick to direct update or a "Save" button
                                 }}
                                 id={`potential-range-${emp.id}`}
                               />
                               <div className="grid grid-cols-3 gap-2">
                                  {[25, 50, 85].map(v => (
                                    <Button 
                                      key={v}
                                      variant="outline" 
                                      size="sm" 
                                      className="text-[9px] font-black uppercase h-8 rounded-lg"
                                      onClick={() => {
                                        const input = document.getElementById(`potential-range-${emp.id}`) as HTMLInputElement;
                                        if (input) input.value = String(v);
                                      }}
                                    >
                                      {v === 25 ? 'Modéré' : v === 50 ? 'Solide' : 'Élevé'}
                                    </Button>
                                  ))}
                               </div>
                            </div>
                            <Button 
                              className="w-full bg-slate-900 text-white font-black uppercase text-[10px] h-11 rounded-xl mt-2"
                              onClick={() => {
                                const input = document.getElementById(`potential-range-${emp.id}`) as HTMLInputElement;
                                if (input && onPotentialUpdate) {
                                  onPotentialUpdate(emp.id, parseInt(input.value));
                                }
                              }}
                            >
                               Confirmer l'Ajustement
                            </Button>
                         </div>
                      </PopoverContent>
                    </Popover>
                  ))}
                  {employeesInBox.length === 0 && (
                     <div className="opacity-5 scale-90 group-hover:scale-110 transition-transform duration-700">
                        <Users weight="thin" size={48} className="text-slate-200" />
                     </div>
                  )}
                </div>

                <div className="absolute inset-0 bg-slate-900/90 text-white p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500 flex flex-col justify-center">
                   <h4 className={`text-xs font-black uppercase ${boxInfo.color.replace('bg-', 'text-')} mb-2`}>{boxInfo.label}</h4>
                   <p className="text-[10px] leading-relaxed font-bold text-white/70">{boxInfo.description}</p>
                   <p className="mt-4 text-[9px] font-black uppercase tracking-widest text-primary">{employeesInBox.length} COLLABORATEUR(S)</p>
                </div>
              </div>
            );
          })
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
         {/* Footer items unchanged */}
         <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
               <Info weight="bold" />
               Guide d'Interprétation
            </h4>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <div className="flex items-center gap-2">
                     <div className="h-2 w-2 rounded-full bg-amber-500" />
                     <span className="text-[10px] font-black text-slate-600 uppercase">Axe Stratégique</span>
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium leading-tight">Focus sur la succession et le leadership global.</p>
               </div>
               <div className="space-y-2">
                  <div className="flex items-center gap-2">
                     <div className="h-2 w-2 rounded-full bg-emerald-500" />
                     <span className="text-[10px] font-black text-slate-600 uppercase">Force Vive</span>
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
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Index de Rétention (IA)</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tighter">84.2%</p>
               </div>
            </div>
         </div>
      </div>
      </TooltipProvider>
    </div>
  );
}
