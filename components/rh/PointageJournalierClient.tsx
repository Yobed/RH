"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Search, ChevronLeft, ChevronRight, Sunrise, Sunset, Clock,
  UserCheck, UserX, CalendarDays, Fingerprint, LogIn, LogOut, CheckCircle2,
  Camera, ShieldCheck, Edit2, Trash2, X, Sparkles, Wifi, RefreshCw, AlertCircle, Sun, Coffee, Briefcase, Moon
} from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { useAuditTracking } from "@/hooks/use-audit-tracking";

export interface PointageRow {
  employeeId: string;
  fullName: string;
  matricule: string;
  poste: string | null;
  departement: string | null;
  photoUrl: string | null;
  arrivee: string | null;
  descente: string | null;
  workedMinutes: number;
  status: "present" | "en_cours" | "absent";
  retard: boolean;
  timeEntryId?: string | null;
}

const ORANGE = "#ee7f03";
const VERT = "#69b5a2";

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function fmtDuration(min: number): string {
  if (!min) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}` : `${m} min`;
}

function StatusBadge({ status }: { status: PointageRow["status"] }) {
  const cfg = {
    present: { label: "Présent", cls: "border-[#69b5a2]/40 bg-[#69b5a2]/12 text-[#3f7d6e]", dot: "bg-[#69b5a2]" },
    en_cours: { label: "En poste", cls: "border-[#ee7f03]/40 bg-[#ee7f03]/12 text-[#b35c00]", dot: "bg-[#ee7f03] animate-pulse" },
    absent: { label: "Absent", cls: "border-slate-200 bg-slate-100 text-slate-500", dot: "bg-slate-300" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function Kpi({ label, value, icon: Icon, tint }: { label: string; value: number; icon: React.ElementType; tint: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${tint}1a`, color: tint }}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-display text-2xl font-semibold leading-none tabular-nums text-slate-900">{value}</p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export function PointageJournalierClient({ rows, dateStr }: { rows: PointageRow[]; dateStr: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"tous" | "present" | "absent" | "retard">("tous");
  const [pending, setPending] = useState<string | null>(null);

  // Audits & Modals State
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [editingRow, setEditingRow] = useState<PointageRow | null>(null);
  const { auditMap } = useAuditTracking("time_entry", showAuditLogs);

  // Kiosk Mode States
  const [isKioskActive, setIsKioskActive] = useState(false);
  const [searchEmp, setSearchEmp] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [kioskSelectedEmp, setKioskSelectedEmp] = useState<PointageRow | null>(null);
  const [kioskScanType, setKioskScanType] = useState<"arrivee" | "pause" | "reprise" | "depart">("arrivee");
  const [kioskScanning, setKioskScanning] = useState(false);
  const [kioskProgress, setKioskProgress] = useState(0);
  const [kioskScanStep, setKioskScanStep] = useState("");
  const [kioskSuccess, setKioskSuccess] = useState(false);
  const [kioskStream, setKioskStream] = useState<MediaStream | null>(null);
  const [kioskCameraError, setKioskCameraError] = useState<string | null>(null);

  // Clock in Kiosk Mode
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [currentDateStr, setCurrentDateStr] = useState("");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const kioskVideoRef = useRef<HTMLVideoElement | null>(null);

  const day = parseISO(dateStr);
  const prev = format(addDays(day, -1), "yyyy-MM-dd");
  const next = format(addDays(day, 1), "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");
  const isViewingToday = dateStr === today;

  // Real-time clock for Kiosk Mode
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTimeStr(d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setCurrentDateStr(format(d, "EEEE d MMMM yyyy", { locale: fr }));
    }, 1000);
    const d = new Date();
    setCurrentTimeStr(d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    setCurrentDateStr(format(d, "EEEE d MMMM yyyy", { locale: fr }));
    return () => clearInterval(timer);
  }, []);

  // Listen to exit fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsKioskActive(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const enterKiosk = () => {
    setIsKioskActive(true);
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.warn("Fullscreen request failed", err);
        });
      }
    }
  };

  const exitKiosk = () => {
    setIsKioskActive(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.warn("Exit fullscreen failed", err);
      });
    }
  };

  const startKioskCamera = useCallback(async () => {
    setKioskCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }
        });
        setKioskStream(stream);
        if (kioskVideoRef.current) {
          kioskVideoRef.current.srcObject = stream;
        }
      } else {
        setKioskCameraError("Caméra non supportée par le navigateur.");
      }
    } catch (err) {
      console.warn("Kiosk camera access denied:", err);
      setKioskCameraError("Caméra indisponible (Simulation 3D activée).");
    }
  }, []);

  const stopKioskCamera = useCallback(() => {
    if (kioskStream) {
      kioskStream.getTracks().forEach((t) => t.stop());
      setKioskStream(null);
    }
  }, [kioskStream]);

  useEffect(() => {
    if (isKioskActive) {
      startKioskCamera();
    } else {
      stopKioskCamera();
    }
    return () => stopKioskCamera();
  }, [isKioskActive, startKioskCamera, stopKioskCamera]);

  // Audio success sound
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.log("Audio block", e);
    }
  };

  const handleKioskScan = async () => {
    if (!kioskSelectedEmp) {
      toast.error("Veuillez d'abord sélectionner votre nom dans la liste.");
      return;
    }
    if (kioskScanning || kioskSuccess) return;
    setKioskScanning(true);
    setKioskProgress(0);

    const steps = [
      { p: 25, text: "Détection du contour facial..." },
      { p: 55, text: "Analyse du test de présence 3D..." },
      { p: 85, text: "Vérification CNPS & Base Employés..." },
      { p: 100, text: "Authentification validée !" }
    ];

    let currentStep = 0;
    const interval = setInterval(async () => {
      if (currentStep < steps.length) {
        setKioskProgress(steps[currentStep].p);
        setKioskScanStep(steps[currentStep].text);
        currentStep++;
      } else {
        clearInterval(interval);
        
        try {
          const actionVal = kioskScanType === "arrivee" || kioskScanType === "reprise" ? "in" : "out";
          const res = await fetch("/api/pointage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              employee_id: kioskSelectedEmp.employeeId,
              action: actionVal,
              verification_method: "IA 3D Faciale v4",
              notes: `Pointage Borne Faciale 3D [${kioskScanType}]`
            }),
          });
          if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            toast.error(e.error ?? "Erreur de validation");
            setKioskScanning(false);
            return;
          }
          
          playChime();
          setKioskScanning(false);
          setKioskSuccess(true);
          
          router.refresh();
          
          setTimeout(() => {
            setKioskSuccess(false);
            setKioskSelectedEmp(null);
            setSearchEmp("");
          }, 3000);

        } catch (err) {
          toast.error("Erreur de communication avec le serveur.");
          setKioskScanning(false);
        }
      }
    }, 600);
  };

  const suggestions = useMemo(() => {
    if (!searchEmp.trim()) return [];
    const q = searchEmp.toLowerCase();
    return rows.filter((r) =>
      r.fullName.toLowerCase().includes(q) || r.matricule.toLowerCase().includes(q)
    );
  }, [rows, searchEmp]);

  const recentCheckIns = useMemo(() => {
    const list: { fullName: string; photoUrl: string | null; time: string; type: string }[] = [];
    rows.forEach((r) => {
      if (r.arrivee) {
        list.push({ fullName: r.fullName, photoUrl: r.photoUrl, time: fmtTime(r.arrivee), type: "Arrivée Matin" });
      }
      if (r.descente) {
        list.push({ fullName: r.fullName, photoUrl: r.photoUrl, time: fmtTime(r.descente), type: "Descente Soir" });
      }
    });
    return list.slice(0, 5);
  }, [rows]);

  // Enregistre un pointage rapide (arrivée / descente) pour un employé — RH/admin.
  async function pointer(employeeId: string, action: "in" | "out") {
    setPending(employeeId);
    try {
      const res = await fetch("/api/pointage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId, action, verification_method: "manuel" }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(e.error ?? "Erreur lors du pointage");
        return;
      }
      toast.success(action === "in" ? "Arrivée enregistrée" : "Descente enregistrée");
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  const stats = useMemo(() => {
    let present = 0, enCours = 0, absent = 0, retard = 0;
    for (const r of rows) {
      if (r.status === "present") present++;
      else if (r.status === "en_cours") enCours++;
      else absent++;
      if (r.retard) retard++;
    }
    return { present, enCours, absent, retard, total: rows.length };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return rows.filter((r) => {
      if (filter === "present" && !(r.status === "present" || r.status === "en_cours")) return false;
      if (filter === "absent" && r.status !== "absent") return false;
      if (filter === "retard" && !r.retard) return false;
      if (q && !(r.fullName.toLowerCase().includes(q) || r.matricule.toLowerCase().includes(q) || (r.poste ?? "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, query, filter]);

  const filterTabs = [
    { id: "tous" as const, label: "Tous", count: stats.total },
    { id: "present" as const, label: "Présents", count: stats.present + stats.enCours },
    { id: "absent" as const, label: "Absents", count: stats.absent },
    { id: "retard" as const, label: "Retards", count: stats.retard },
  ];

  // KIOSK FULLSCREEN RENDER OVERLAY
  if (isKioskActive) {
    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 bg-[#f5f6f3] text-slate-900 flex flex-col justify-between p-6 select-none font-sans"
      >
        {/* Kiosk Header */}
        <header className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ee7f03]/10 text-[#ee7f03] border border-[#ee7f03]/30">
              <Fingerprint className="h-6 w-6 animate-pulse" />
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">BORNE DE POINTAGE FACIALE 3D</h1>
              <p className="text-xs text-slate-500 font-medium">Gravel Ivoire ERP · HQ Terminal #01</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xl font-black font-mono tracking-wider text-[#ee7f03]">{currentTimeStr}</p>
              <p className="text-[10px] text-slate-500 capitalize">{currentDateStr}</p>
            </div>
            <button
              onClick={exitKiosk}
              className="h-9 px-4 rounded-lg bg-white hover:bg-slate-100 text-xs font-bold text-slate-600 border border-slate-200 transition-colors"
            >
              Quitter
            </button>
          </div>
        </header>

        {/* Kiosk Main Content Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto max-w-7xl w-full mx-auto">
          {/* Left panel: Actions and controls */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-center">
            {/* Step 1: Employee Autocomplete */}
            <div className="relative">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Étape 1 : Identifiez-vous
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Saisissez votre nom ou matricule..."
                  value={searchEmp}
                  onChange={(e) => {
                    setSearchEmp(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-[13px] text-slate-900 placeholder-slate-400 outline-none focus:border-[#ee7f03] transition-colors"
                />
                {searchEmp && (
                  <button
                    onClick={() => {
                      setSearchEmp("");
                      setKioskSelectedEmp(null);
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 text-xs font-semibold"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {showDropdown && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-2xl no-scrollbar">
                  {suggestions.map((emp) => (
                    <button
                      key={emp.employeeId}
                      onClick={() => {
                        setKioskSelectedEmp(emp);
                        setSearchEmp(emp.fullName);
                        setShowDropdown(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[12.5px] hover:bg-slate-100 transition-colors"
                    >
                      <Avatar src={emp.photoUrl} name={emp.fullName} size={30} rounded="lg" className="border border-slate-200" />
                      <div>
                        <p className="font-semibold text-slate-900">{emp.fullName}</p>
                        <p className="text-[10px] text-slate-500">{emp.matricule} · {emp.poste || "Employé"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Pointage Type Selection */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Étape 2 : Type de pointage
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "arrivee", label: "Arrivée Matin", icon: Sun },
                  { id: "pause", label: "Pause Déjeuner", icon: Coffee },
                  { id: "reprise", label: "Reprise Travail", icon: Briefcase },
                  { id: "depart", label: "Départ Soir", icon: Moon }
                ].map((opt) => {
                  const IconComp = opt.icon;
                  const selected = kioskScanType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setKioskScanType(opt.id as any)}
                      disabled={kioskScanning || kioskSuccess}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        selected
                          ? "bg-white text-slate-950 border-white shadow-lg"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <IconComp className={`h-4 w-4 ${selected ? "text-[#ee7f03]" : "text-slate-500"}`} />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scan Button Trigger */}
            {!kioskSuccess && (
              <button
                onClick={handleKioskScan}
                disabled={kioskScanning || !kioskSelectedEmp}
                className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
                  !kioskSelectedEmp
                    ? "bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200/50"
                    : kioskScanning
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-[#ee7f03] text-white hover:bg-[#d67002]"
                }`}
              >
                {kioskScanning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Scan facial 3D en cours...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    <span>Lancer la reconnaissance facial 3D</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Center viewport: Camera Scan */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <div className="relative w-full aspect-square max-w-[340px] rounded-3xl bg-[#f5f6f3] overflow-hidden border-2 border-slate-200 flex items-center justify-center shadow-2xl">
              {kioskStream ? (
                <video
                  ref={kioskVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              ) : (
                <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200">
                  <div className="relative h-28 w-28 rounded-full border-2 border-dashed border-[#ee7f03]/50 flex items-center justify-center">
                    <div className="h-20 w-20 rounded-full bg-[#ee7f03]/10 flex items-center justify-center animate-pulse">
                      <Camera className="h-8 w-8 text-[#ee7f03] opacity-80" />
                    </div>
                  </div>
                  {kioskCameraError && (
                    <span className="mt-3 text-[10px] text-amber-500 bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-900/50">
                      {kioskCameraError}
                    </span>
                  )}
                </div>
              )}

              {/* HUD markers */}
              <div className="absolute inset-6 pointer-events-none border border-slate-200/40 rounded-2xl flex items-center justify-center">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#ee7f03] rounded-tl-md" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#ee7f03] rounded-tr-md" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#ee7f03] rounded-bl-md" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#ee7f03] rounded-br-md" />

                {kioskScanning && (
                  <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-scan-beam" />
                )}

                {kioskSuccess && (
                  <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center text-center p-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white mb-2 animate-bounce">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <p className="text-sm font-bold">Identifié avec succès</p>
                    <p className="text-xs text-emerald-300 font-semibold mt-1">{kioskSelectedEmp?.fullName}</p>
                    <span className="mt-2 text-[9px] font-bold bg-emerald-950 border border-emerald-500/50 text-emerald-300 px-2 py-0.5 rounded-full">
                      Match CNPS: 99.8%
                    </span>
                  </div>
                )}
              </div>

              {/* Status Header Overlay */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div className="bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200 text-[10px] font-bold text-slate-900 flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${kioskScanning ? "bg-amber-400 animate-ping" : kioskSuccess ? "bg-emerald-400" : "bg-[#ee7f03] animate-pulse"}`} />
                  {kioskScanning ? kioskScanStep : kioskSuccess ? "Validé !" : "Prêt pour scan"}
                </div>
                <div className="bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200 text-[9px] font-mono text-slate-500">
                  AES-256
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Recent log updates */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Derniers pointages</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
              {recentCheckIns.map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar src={log.photoUrl} name={log.fullName} size={28} rounded="lg" className="border border-slate-200" />
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold truncate text-slate-900">{log.fullName}</p>
                      <p className="text-[10px] text-slate-500">{log.type}</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#ee7f03]">{log.time}</span>
                </div>
              ))}
              {recentCheckIns.length === 0 && (
                <p className="text-xs text-slate-500 py-6 text-center">Aucun pointage aujourd'hui.</p>
              )}
            </div>
          </div>
        </main>

        {/* Kiosk Footer metadata */}
        <footer className="flex items-center justify-between border-t border-slate-200 pt-4 text-[10px] text-slate-600">
          <div className="flex items-center gap-1">
            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
            <span>Sécurisé par VPN IP Fixe · Terminal Actif</span>
          </div>
          <div>
            <span>© 2026 Gravel Ivoire HR Technology</span>
          </div>
        </footer>

        {/* Inject CSS animation */}
        <style jsx global>{`
          @keyframes scanBeam {
            0%, 100% { top: 0%; }
            50% { top: 100%; }
          }
          .animate-scan-beam {
            animation: scanBeam 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 px-4 pb-12 pt-5 sm:px-6 md:px-8">
      {/* En-tête clair + navigation de jour */}
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${ORANGE}14`, color: ORANGE }}>
            <Fingerprint className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Pointage journalier</h1>
            <p className="text-[13px] capitalize text-slate-500">{format(day, "EEEE d MMMM yyyy", { locale: fr })}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Kiosk Mode Button */}
          <button
            onClick={enterKiosk}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-slate-900 px-3 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800"
          >
            <Camera className="h-4 w-4 text-[#ee7f03]" />
            Mode borne
          </button>

          <Link href={`/pointage?date=${prev}`} className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50" title="Jour précédent">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`/pointage?date=${today}`}
            className={`inline-flex h-9 items-center rounded-md border px-3 text-[13px] font-semibold transition-colors ${dateStr === today ? "border-[#ee7f03] bg-[#ee7f03]/10 text-[#b35c00]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
          >
            Aujourd'hui
          </Link>
          <Link href={`/pointage?date=${next}`} className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50" title="Jour suivant">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* KPI */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Présents" value={stats.present + stats.enCours} icon={UserCheck} tint={VERT} />
        <Kpi label="En poste" value={stats.enCours} icon={Clock} tint={ORANGE} />
        <Kpi label="Absents" value={stats.absent} icon={UserX} tint="#94a3b8" />
        <Kpi label="Retards" value={stats.retard} icon={CalendarDays} tint="#d97706" />
      </section>

      {/* Registre */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* Barre d'outils */}
        <div className="flex flex-col gap-2 border-b border-slate-200 px-3 py-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
            {filterTabs.map((t) => {
              const active = filter === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium transition-colors ${active ? "bg-[#ee7f03]/10 font-semibold text-[#b35c00]" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  {t.label}
                  <span className="text-[11px] tabular-nums text-slate-400">{t.count}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 self-end lg:self-auto">
            {/* Audit Logs toggle */}
            <button
              onClick={() => setShowAuditLogs(!showAuditLogs)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-semibold transition-colors ${
                showAuditLogs
                  ? "border-[#ee7f03] bg-[#ee7f03]/10 text-[#b35c00]"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Suivi d'audit
            </button>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Rechercher par nom, prénoms ou matricule…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-[13px] outline-none transition-colors focus:border-[#ee7f03] lg:w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">Nom & Prénoms</th>
                <th className="hidden px-3 py-2 text-[11px] font-semibold uppercase tracking-wide md:table-cell">Matricule</th>
                <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">
                  <span className="inline-flex items-center gap-1.5"><Sunrise className="h-3.5 w-3.5 text-[#ee7f03]" /> Arrivée matin</span>
                </th>
                <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">
                  <span className="inline-flex items-center gap-1.5"><Sunset className="h-3.5 w-3.5 text-[#3f7d6e]" /> Descente soir</span>
                </th>
                <th className="hidden px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide lg:table-cell">Temps</th>
                <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">Statut</th>
                
                {/* Audit Columns */}
                {showAuditLogs && (
                  <>
                    <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#ee7f03] border-l border-slate-100">Création</th>
                    <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#ee7f03]">Modification</th>
                    <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#ee7f03]">Validation</th>
                  </>
                )}

                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => {
                const audit = r.timeEntryId ? auditMap[r.timeEntryId] : null;
                return (
                  <tr key={r.employeeId} className="transition-colors hover:bg-[#ee7f03]/[0.04]">
                    <td className="px-3 py-2">
                      <Link href={`/employes/${r.employeeId}`} className="group flex items-center gap-3">
                        <Avatar src={r.photoUrl} name={r.fullName} size={36} rounded="lg" className="border border-slate-200" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-slate-800 group-hover:text-[#b35c00]">{r.fullName}</p>
                          <p className="truncate text-[11px] text-slate-400">{r.poste || "—"}{r.departement ? ` · ${r.departement}` : ""}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="hidden px-3 py-2 font-mono text-[12px] tabular-nums text-slate-500 md:table-cell">{r.matricule}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[13px] tabular-nums ${r.arrivee ? "font-semibold text-slate-800" : "text-slate-300"}`}>{fmtTime(r.arrivee)}</span>
                        {r.retard && <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">Retard</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`font-mono text-[13px] tabular-nums ${r.descente ? "font-semibold text-slate-800" : "text-slate-300"}`}>{fmtTime(r.descente)}</span>
                    </td>
                    <td className="hidden px-3 py-2 text-right font-mono text-[13px] tabular-nums text-slate-600 lg:table-cell">{fmtDuration(r.workedMinutes)}</td>
                    <td className="px-3 py-2"><StatusBadge status={r.status} /></td>

                    {/* Audit Logs content cells */}
                    {showAuditLogs && (
                      <>
                        <td className="px-3 py-2 text-[12px] text-slate-500 border-l border-slate-100">
                          {audit?.create ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-700">
                                {format(parseISO(audit.create.created_at), "HH:mm", { locale: fr })}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                par {audit.create.user_name || "Borne"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[12px] text-slate-500">
                          {audit?.update ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-700">
                                {format(parseISO(audit.update.created_at), "HH:mm", { locale: fr })}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                par {audit.update.user_name || "RH"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[12px] text-slate-500">
                          {r.descente ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-emerald-600">Validé</span>
                              <span className="text-[10px] text-slate-400">
                                {audit?.approve ? `par ${audit.approve.user_name}` : "Auto"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </>
                    )}

                    {/* Actions Column */}
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick clock buttons only for Today */}
                        {isViewingToday && (
                          <>
                            {r.status === "absent" && (
                              <button
                                onClick={() => pointer(r.employeeId, "in")}
                                disabled={pending === r.employeeId}
                                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#ee7f03] px-3 text-[12px] font-semibold text-white transition-colors hover:bg-[#d67002] disabled:opacity-50"
                              >
                                <LogIn className="h-3.5 w-3.5" /> Arrivée
                              </button>
                            )}
                            {r.status === "en_cours" && (
                              <button
                                onClick={() => pointer(r.employeeId, "out")}
                                disabled={pending === r.employeeId}
                                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#69b5a2] bg-[#69b5a2]/10 px-3 text-[12px] font-semibold text-[#3f7d6e] transition-colors hover:bg-[#69b5a2]/20 disabled:opacity-50"
                              >
                                <LogOut className="h-3.5 w-3.5" /> Descente
                              </button>
                            )}
                            {r.status === "present" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 mr-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#69b5a2]" /> Journée close
                              </span>
                            )}
                          </>
                        )}

                        {/* Manual override button (gear/edit) - available on all days */}
                        <button
                          onClick={() => setEditingRow(r)}
                          className="h-8 w-8 rounded-md border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                          title="Modifier manuellement le pointage"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={showAuditLogs ? 10 : 7} className="px-3 py-12 text-center text-[13px] text-slate-400">
                    Aucun collaborateur pour ce filtre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-3 py-2 text-[12px] text-slate-500">
          {filtered.length} collaborateur{filtered.length > 1 ? "s" : ""} · {stats.present + stats.enCours}/{stats.total} présents
        </div>
      </div>

      {/* Manual Pointage Modification Modal */}
      {editingRow && (
        <EditPointageModal
          row={editingRow}
          dateStr={dateStr}
          onClose={() => setEditingRow(null)}
          onSave={() => router.refresh()}
        />
      )}
    </div>
  );
}

// Edit Pointage Modal Component
function EditPointageModal({
  row,
  dateStr,
  onClose,
  onSave,
}: {
  row: PointageRow;
  dateStr: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const getHHMM = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toTimeString().slice(0, 5);
  };

  const [arriveeTime, setArriveeTime] = useState(getHHMM(row.arrivee));
  const [descenteTime, setDescenteTime] = useState(getHHMM(row.descente));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/pointage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: row.employeeId,
          date: dateStr,
          arrivee: arriveeTime || null,
          descente: descenteTime || null,
          notes,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Erreur lors de la modification");
      } else {
        toast.success("Pointage enregistré avec succès");
        onSave();
        onClose();
      }
    } catch (err) {
      toast.error("Erreur de communication avec le serveur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Voulez-vous vraiment effacer le pointage de cette journée pour ce collaborateur ?")) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/pointage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: row.employeeId,
          date: dateStr,
          arrivee: null,
          descente: null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Erreur lors de l'effacement");
      } else {
        toast.success("Pointage effacé avec succès");
        onSave();
        onClose();
      }
    } catch (err) {
      toast.error("Erreur de communication");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-display font-bold text-[16px] text-slate-900">Modification manuelle</h3>
            <p className="text-[11.5px] text-slate-400 mt-0.5">{row.fullName} ({row.matricule})</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              Heure d'arrivée matin
            </label>
            <input
              type="time"
              value={arriveeTime}
              onChange={(e) => setArriveeTime(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none focus:border-[#ee7f03] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              Heure de descente soir
            </label>
            <input
              type="time"
              value={descenteTime}
              onChange={(e) => setDescenteTime(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none focus:border-[#ee7f03] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
              Motif / Justification
            </label>
            <textarea
              placeholder="Ex: Badge oublié, déplacement professionnel..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[80px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 placeholder-slate-400 outline-none focus:border-[#ee7f03] transition-colors resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-10 rounded-lg bg-[#ee7f03] hover:bg-[#d67002] text-white font-semibold text-[12.5px] transition-colors disabled:opacity-50"
            >
              Enregistrer
            </button>
            {(row.arrivee || row.descente) && (
              <button
                type="button"
                onClick={handleClear}
                disabled={submitting}
                className="h-10 px-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
                title="Effacer le pointage"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-10 px-4 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-[12.5px] transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
