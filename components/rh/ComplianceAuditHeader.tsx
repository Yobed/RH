"use client";

import { ShieldCheck, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ComplianceAuditHeaderProps {
  score: number;
  risks: {
    contracts: number;
    trials: number;
    medical: number;
    documents: number;
  };
}

export function ComplianceAuditHeader({ score, risks }: ComplianceAuditHeaderProps) {
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/notifications/sync", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(data.created > 0 ? `${data.created} nouvelles alertes générées` : "Votre conformité est à jour");
      router.refresh();
    } catch (e) {
      toast.error("Échec de l'audit de conformité");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
      {/* Design dégradé subtil */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
      
      {/* Décoration icône */}
      <div className="absolute -right-6 -bottom-6 opacity-[0.03]">
        <ShieldCheck className="h-40 w-40" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Audit de Conformité Légale</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {score >= 90 ? (
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                    Excellente
                  </span>
                ) : score >= 70 ? (
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    Vigilance
                  </span>
                ) : (
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20">
                    Critique
                  </span>
                )}
                <span className="text-white/30 text-[10px] uppercase font-medium">Auto-scan activé</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-1">Index Global</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">{score}</span>
              <span className="text-slate-600 font-bold text-sm">%</span>
            </div>
          </div>
          
          <div className="h-10 w-px bg-slate-800 hidden sm:block" />

          <div className="grid grid-cols-4 gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-1">Contrats</span>
              <span className={`text-xl font-bold ${risks.contracts > 0 ? 'text-amber-400' : 'text-slate-600'}`}>
                {risks.contracts}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-1">Essais</span>
              <span className={`text-xl font-bold ${risks.trials > 0 ? 'text-orange-400' : 'text-slate-600'}`}>
                {risks.trials}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-1">Docs</span>
              <span className={`text-xl font-bold ${risks.documents > 0 ? 'text-red-400' : 'text-slate-600'}`}>
                {risks.documents}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-1">Santé</span>
              <span className={`text-xl font-bold ${risks.medical > 0 ? 'text-sky-400' : 'text-slate-600'}`}>
                {risks.medical}
              </span>
            </div>
          </div>

          <div className="ml-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="bg-white/5 hover:bg-white/10 active:scale-95 transition-all p-3 rounded-xl border border-white/10 group disabled:opacity-50"
              title="Lancer l'audit de conformité"
            >
              <RefreshCw className={`h-5 w-5 text-white ${syncing ? 'animate-spin text-primary' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
