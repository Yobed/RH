"use client";

import { useState, useEffect } from "react";
import { Clock, Play, Pause, Camera, CheckCircle2, MapPin, Info } from "lucide-react";
import { FacialPointageModal } from "@/components/rh/FacialPointageModal";

export function ChronometreWidget() {
  const [seconds, setSeconds] = useState(12012); // 03:20:12 initial
  const [isRunning, setIsRunning] = useState(true);
  const [status, setStatus] = useState<"bureau" | "teletravail" | "pause">("bureau");
  const [showFacialModal, setShowFacialModal] = useState(false);
  const [lastPointage, setLastPointage] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePointageSuccess = (type: string, time: string) => {
    setLastPointage(`${type.toUpperCase()} à ${time}`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none transition-all flex flex-col justify-between h-full">
      <div>
        {/* Widget Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#ee7f03] text-white flex items-center justify-center shadow-md shadow-[#ee7f03]/20 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                Badgeuse & Pointage
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                Simulateur de présence et validation faciale
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {status === "bureau" ? "Au bureau" : status === "teletravail" ? "Télétravail" : "En pause"}
          </span>
        </div>

        {/* Info banner explaining purpose */}
        <div className="mb-4 p-3 rounded-2xl bg-[#ee7f03]/10 dark:bg-[#b35c00]/30 border border-[#ee7f03]/30 dark:border-[#b35c00]/50 flex items-start gap-2.5 text-xs text-[#b35c00] dark:text-[#ee7f03]">
          <Info className="h-4 w-4 text-[#ee7f03] shrink-0 mt-0.5" />
          <p className="font-bold leading-relaxed">
            Module de test permettant aux managers de valider la géolocalisation et le pointage par caméra.
          </p>
        </div>

        {/* Digital Clock Display */}
        <div className="my-4 text-center bg-slate-50 dark:bg-slate-800/50 py-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-slate-900 dark:text-white">
            {formatTime(seconds)}
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 mt-2">
            <MapPin className="h-3.5 w-3.5 text-[#ee7f03]" />
            <span>Poste : Abidjan Plateau (Réseau HQ)</span>
          </div>
          {lastPointage && (
            <div className="mt-2.5 text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 py-1.5 px-3 rounded-xl mx-4 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              <span>Dernier pointage : {lastPointage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-extrabold transition-all shadow-md ${
            isRunning
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-[#ee7f03] dark:hover:bg-[#ee7f03]"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="h-4 w-4 fill-current" />
              <span>Pause journée</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" />
              <span>Démarrer</span>
            </>
          )}
        </button>

        <button
          onClick={() => setShowFacialModal(true)}
          className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-[#ee7f03] hover:bg-[#ee7f03] text-white text-xs font-extrabold shadow-md transition-all cursor-pointer"
        >
          <Camera className="h-4 w-4" />
          <span>Pointage Facial</span>
        </button>
      </div>

      {/* High-Tech Biometric Facial Pointage Modal */}
      <FacialPointageModal
        isOpen={showFacialModal}
        onClose={() => setShowFacialModal(false)}
        onSuccess={handlePointageSuccess}
      />
    </div>
  );
}
