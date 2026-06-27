"use client";

import { useState, useEffect } from "react";
import { Clock, Play, Pause, Square, Camera, CheckCircle2, MapPin } from "lucide-react";
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Chronomètre</h3>
            <p className="text-[11px] text-slate-500 font-medium">Suivi du temps et pointage</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {status === "bureau" ? "Au bureau" : status === "teletravail" ? "Télétravail" : "En pause"}
        </span>
      </div>

      {/* Main Digital Clock Display */}
      <div className="my-5 text-center bg-slate-50 dark:bg-slate-800/40 py-4 rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="text-3xl font-black font-mono tracking-wider text-slate-900 dark:text-white">
          {formatTime(seconds)}
        </div>
        <div className="flex items-center justify-center gap-1 text-xs text-slate-500 font-medium mt-1">
          <MapPin className="h-3 w-3 text-slate-400" />
          <span>Poste : Abidjan Plateau (Réseau HQ)</span>
        </div>
        {lastPointage && (
          <div className="mt-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Dernier pointage : {lastPointage}</span>
          </div>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-xs ${
            isRunning
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="h-3.5 w-3.5 fill-current" />
              <span>Pause journée</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Début de la journée</span>
            </>
          )}
        </button>

        <button
          onClick={() => setShowFacialModal(true)}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 dark:text-indigo-300 text-xs font-bold border border-indigo-200/60 dark:border-indigo-800/60 transition-all cursor-pointer shadow-xs"
        >
          <Camera className="h-3.5 w-3.5" />
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

