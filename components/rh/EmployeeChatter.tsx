"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  ChatCircleText, Note as NoteIcon, Pulse as Activity, PaperPlaneTilt, CircleNotch as Loader2,
  FileText, CalendarBlank, Warning, GraduationCap, Stethoscope,
} from "@phosphor-icons/react";

type Tab = "message" | "note" | "activite";

interface NoteEntry {
  id: string;
  kind: "note" | "message";
  body: string;
  created_at: string;
  author_id: string | null;
  author_name: string;
}

interface ActivityEntry {
  id: string;
  type: "document" | "conge" | "sanction" | "formation" | "medical";
  title: string;
  detail?: string;
  date: string;
}

interface Props {
  employeeId: string;
  employeeName: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d} j`;
  return new Date(iso).toLocaleDateString("fr-CI", { day: "numeric", month: "short", year: "numeric" });
}

const ACTIVITY_ICONS: Record<ActivityEntry["type"], React.ComponentType<{ className?: string; weight?: "fill" }>> = {
  document: FileText,
  conge: CalendarBlank,
  sanction: Warning,
  formation: GraduationCap,
  medical: Stethoscope,
};

const ACTIVITY_COLORS: Record<ActivityEntry["type"], string> = {
  document: "bg-indigo-50 text-indigo-600",
  conge: "bg-amber-50 text-amber-600",
  sanction: "bg-rose-50 text-rose-600",
  formation: "bg-teal-50 text-teal-600",
  medical: "bg-red-50 text-red-600",
};

export function EmployeeChatter({ employeeId, employeeName }: Props) {
  const [tab, setTab] = useState<Tab>("message");
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [composer, setComposer] = useState("");
  const [posting, setPosting] = useState(false);

  const fetchNotes = useCallback(async () => {
    setLoadingNotes(true);
    try {
      const res = await fetch(`/api/employee-notes?employee_id=${employeeId}`, { cache: "no-store" });
      const json = (await res.json()) as { notes?: NoteEntry[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setNotes(json.notes ?? []);
    } catch {
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  }, [employeeId]);

  const fetchActivity = useCallback(async () => {
    setLoadingActivity(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}/activity`, { cache: "no-store" });
      const json = (await res.json()) as { activities?: ActivityEntry[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setActivities(json.activities ?? []);
    } catch {
      setActivities([]);
    } finally {
      setLoadingActivity(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchNotes();
    fetchActivity();
  }, [fetchNotes, fetchActivity]);

  async function postNote(kind: "note" | "message") {
    if (!composer.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/employee-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId, kind, body: composer.trim() }),
      });
      const json = (await res.json()) as { note?: NoteEntry; error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Erreur");
        return;
      }
      setComposer("");
      toast.success(kind === "note" ? "Note interne ajoutée" : "Message envoyé");
      await fetchNotes();
    } finally {
      setPosting(false);
    }
  }

  const filteredNotes = notes.filter((n) => (tab === "message" ? n.kind === "message" : tab === "note" ? n.kind === "note" : false));

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Onglets style Odoo */}
      <div className="border-b border-slate-100 px-4 pt-3">
        <div className="flex items-center gap-1">
          <TabButton active={tab === "message"} onClick={() => setTab("message")} icon={ChatCircleText} label="Envoyer message" />
          <TabButton active={tab === "note"} onClick={() => setTab("note")} icon={NoteIcon} label="Note interne" />
          <TabButton active={tab === "activite"} onClick={() => setTab("activite")} icon={Activity} label="Activité" />
        </div>
      </div>

      {/* Composer (message/note uniquement) */}
      {tab !== "activite" && (
        <div className={`px-4 py-3 border-b ${tab === "note" ? "bg-amber-50/40 border-amber-100" : "border-slate-100"}`}>
          <textarea
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            placeholder={
              tab === "message"
                ? `Envoyer un message à propos de ${employeeName}…`
                : "Note interne RH (non visible par le salarié)…"
            }
            rows={3}
            className={`w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
              tab === "note" ? "border-amber-200" : "border-slate-200"
            }`}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] text-slate-400">
              {tab === "note" ? "🔒 Visible uniquement par les RH" : "💬 Tracé dans le dossier"}
            </p>
            <button
              onClick={() => postNote(tab)}
              disabled={posting || !composer.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-all"
            >
              {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PaperPlaneTilt className="h-3.5 w-3.5" weight="fill" />}
              {tab === "note" ? "Ajouter la note" : "Envoyer"}
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === "activite" ? (
          <ActivityList loading={loadingActivity} items={activities} />
        ) : (
          <NotesList loading={loadingNotes} items={filteredNotes} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active, onClick, icon: Icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string; weight?: "fill" }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold transition-colors ${
        active ? "text-indigo-700" : "text-slate-500 hover:text-slate-800"
      }`}
    >
      <Icon className="h-3.5 w-3.5" weight={active ? "fill" : undefined} />
      {label}
      {active && (
        <span className="absolute -bottom-px left-2 right-2 h-0.5 rounded-full bg-indigo-600" />
      )}
    </button>
  );
}

function NotesList({ loading, items }: { loading: boolean; items: NoteEntry[] }) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="text-center py-10">
        <ChatCircleText className="h-8 w-8 text-slate-200 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-500">Aucun message</p>
        <p className="text-[11px] text-slate-400 mt-1">Soyez le premier à laisser une trace.</p>
      </div>
    );
  }
  return (
    <ul className="space-y-4">
      {items.map((n) => (
        <li key={n.id} className="flex gap-3">
          <div
            className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              n.kind === "note"
                ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
            }`}
          >
            {initials(n.author_name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-[13px] font-bold text-slate-800 leading-tight">{n.author_name}</p>
              <p className="text-[10px] text-slate-400">{timeAgo(n.created_at)}</p>
              {n.kind === "note" && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                  Interne
                </span>
              )}
            </div>
            <p className={`text-[13px] mt-1 leading-relaxed whitespace-pre-wrap ${
              n.kind === "note" ? "text-slate-700 bg-amber-50/50 border border-amber-100 rounded-lg px-3 py-2" : "text-slate-700"
            }`}>
              {n.body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ActivityList({ loading, items }: { loading: boolean; items: ActivityEntry[] }) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="text-center py-10">
        <Activity className="h-8 w-8 text-slate-200 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-500">Aucune activité récente</p>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((a) => {
        const Icon = ACTIVITY_ICONS[a.type];
        const colors = ACTIVITY_COLORS[a.type];
        return (
          <li key={a.id} className="flex gap-3 items-start">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${colors}`}>
              <Icon className="h-4 w-4" weight="fill" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-800 leading-tight">{a.title}</p>
              {a.detail && <p className="text-[11px] text-slate-500 mt-0.5">{a.detail}</p>}
              <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(a.date)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
