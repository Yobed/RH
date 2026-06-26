"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar, Plus, X, Settings, Trash2, Coffee } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, startOfWeek, parseISO, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { PageHelp } from "./PageHelp";

export type Employee = {
  id: string;
  full_name: string;
  matricule: string | null;
  poste: string | null;
};

export type Shift = {
  id: string;
  name: string;
  code: string | null;
  color: string;
  start_time: string | null;
  end_time: string | null;
  break_minutes: number | null;
  is_rest: boolean | null;
  notes: string | null;
};

export type Assignment = {
  id: string;
  employee_id: string;
  shift_id: string;
  date: string;
  notes: string | null;
};

interface Props {
  employees: Employee[];
  shifts: Shift[];
  assignments: Assignment[];
  weekStart: string;
}

export function PlanningClient({ employees, shifts, assignments, weekStart }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [shiftMgr, setShiftMgr] = useState(false);
  const [picker, setPicker] = useState<{ empId: string; date: string } | null>(null);

  const monday = useMemo(() => parseISO(weekStart), [weekStart]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday]);

  const shiftMap = useMemo(() => new Map(shifts.map(s => [s.id, s])), [shifts]);
  const assignmentMap = useMemo(() => {
    const m = new Map<string, Assignment>();
    for (const a of assignments) m.set(`${a.employee_id}_${a.date}`, a);
    return m;
  }, [assignments]);

  const navigateWeek = (delta: number) => {
    const newMonday = addDays(monday, delta * 7);
    startTransition(() => {
      router.push(`/planning?week=${format(newMonday, "yyyy-MM-dd")}`, { scroll: false });
    });
  };

  const goToday = () => {
    const today = startOfWeek(new Date(), { weekStartsOn: 1 });
    startTransition(() => {
      router.push(`/planning?week=${format(today, "yyyy-MM-dd")}`, { scroll: false });
    });
  };

  const assign = async (empId: string, date: string, shiftId: string) => {
    const res = await fetch("/api/planning/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee_id: empId, shift_id: shiftId, date }),
    });
    if (res.ok) {
      toast.success("Affectation enregistrée");
      setPicker(null);
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({})) as { error?: string };
      toast.error(err.error ?? "Erreur");
    }
  };

  const removeAssignment = async (empId: string, date: string) => {
    const res = await fetch(
      `/api/planning/assignments?employee_id=${empId}&date=${date}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      toast.success("Affectation supprimée");
      setPicker(null);
      router.refresh();
    } else {
      toast.error("Erreur");
    }
  };

  const weekLabel = `Semaine du ${format(monday, "d MMM", { locale: fr })} au ${format(addDays(monday, 6), "d MMM yyyy", { locale: fr })}`;
  const totalAssignments = assignments.length;
  const couvertureRate = employees.length > 0
    ? Math.round((totalAssignments / (employees.length * 7)) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* En-tête + navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold font-heading">Planning hebdomadaire</h1>
            <PageHelp text="Le planning des équipes (shifts), semaine par semaine : assignez des créneaux à chaque salarié et organisez les rotations." />
          </div>
          <p className="text-sm text-slate-500">{weekLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => navigateWeek(-1)}
              disabled={isPending}
              className="p-1.5 rounded-md hover:bg-white transition-colors"
              title="Semaine précédente"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={goToday}
              disabled={isPending}
              className="px-3 py-1 text-xs font-medium text-slate-700 hover:bg-white rounded-md transition-colors"
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => navigateWeek(1)}
              disabled={isPending}
              className="p-1.5 rounded-md hover:bg-white transition-colors"
              title="Semaine suivante"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          <button
            onClick={() => setShiftMgr(true)}
            className="h-9 inline-flex items-center gap-2 px-3 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Settings className="w-3.5 h-3.5" />
            Plages horaires
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-100 bg-white p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Collaborateurs</p>
          <p className="text-xl font-bold text-slate-800 mt-1 tabular-nums">{employees.length}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Affectations</p>
          <p className="text-xl font-bold text-slate-800 mt-1 tabular-nums">{totalAssignments}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Couverture</p>
          <p className={`text-xl font-bold mt-1 tabular-nums ${couvertureRate >= 80 ? "text-emerald-600" : couvertureRate >= 50 ? "text-amber-600" : "text-rose-600"}`}>
            {couvertureRate}%
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Plages dispo.</p>
          <p className="text-xl font-bold text-slate-800 mt-1 tabular-nums">{shifts.length}</p>
        </div>
      </div>

      {/* Légende des shifts */}
      {shifts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Légende :</span>
          {shifts.map(s => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1.5 text-xs text-slate-700"
            >
              <span className="w-3 h-3 rounded" style={{ background: s.color }} />
              {s.name}
              {s.start_time && s.end_time && (
                <span className="text-slate-400">{s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Grille planning */}
      {employees.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center text-slate-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun collaborateur actif</p>
        </div>
      ) : shifts.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
          <Coffee className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">Aucune plage horaire configurée</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">Créez vos premiers modèles (Matin, Après-midi, Nuit, Repos…)</p>
          <button
            onClick={() => setShiftMgr(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
          >
            <Plus className="w-3.5 h-3.5" />
            Créer une plage
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-50 border-b border-r border-slate-200 px-4 py-3 text-left text-[10px] font-semibold text-slate-600 uppercase tracking-widest min-w-[180px]">
                    Collaborateur
                  </th>
                  {days.map(d => (
                    <th
                      key={d.toISOString()}
                      className={`border-b border-slate-200 px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-widest min-w-[110px] ${isToday(d) ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-600"}`}
                    >
                      <div>{format(d, "EEE", { locale: fr })}</div>
                      <div className="text-base font-bold normal-case tracking-normal">{format(d, "d", { locale: fr })}</div>
                      <div className="text-[9px] text-slate-400 normal-case tracking-normal">{format(d, "MMM", { locale: fr })}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/40">
                    <td className="sticky left-0 z-10 bg-white border-r border-slate-200 px-4 py-2">
                      <p className="font-semibold text-xs text-slate-800 truncate">{emp.full_name}</p>
                      {emp.poste && <p className="text-[10px] text-slate-500 truncate">{emp.poste}</p>}
                    </td>
                    {days.map(d => {
                      const dateStr = format(d, "yyyy-MM-dd");
                      const a = assignmentMap.get(`${emp.id}_${dateStr}`);
                      const shift = a ? shiftMap.get(a.shift_id) : null;
                      return (
                        <td key={dateStr} className={`px-2 py-1.5 text-center border-r border-slate-50 ${isToday(d) ? "bg-blue-50/30" : ""}`}>
                          {shift ? (
                            <button
                              onClick={() => setPicker({ empId: emp.id, date: dateStr })}
                              className="w-full px-2 py-1.5 rounded-md text-[10px] font-semibold text-white transition-all hover:opacity-80 hover:scale-95"
                              style={{ background: shift.color }}
                              title={shift.notes ?? shift.name}
                            >
                              {shift.is_rest ? <Coffee className="w-3 h-3 inline mr-1" /> : null}
                              {shift.code ?? shift.name}
                            </button>
                          ) : (
                            <button
                              onClick={() => setPicker({ empId: emp.id, date: dateStr })}
                              className="w-full px-2 py-1.5 rounded-md border border-dashed border-slate-200 text-slate-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-500 transition-all"
                            >
                              <Plus className="w-3 h-3 mx-auto" />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {picker && (
        <ShiftPicker
          shifts={shifts}
          currentShiftId={assignmentMap.get(`${picker.empId}_${picker.date}`)?.shift_id ?? null}
          onPick={(shiftId) => assign(picker.empId, picker.date, shiftId)}
          onRemove={() => removeAssignment(picker.empId, picker.date)}
          onClose={() => setPicker(null)}
        />
      )}

      {shiftMgr && (
        <ShiftManagerDialog
          shifts={shifts}
          onClose={() => {
            setShiftMgr(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function ShiftPicker({
  shifts, currentShiftId, onPick, onRemove, onClose,
}: {
  shifts: Shift[];
  currentShiftId: string | null;
  onPick: (id: string) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border border-slate-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Choisir une plage horaire</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="p-3 space-y-1 max-h-80 overflow-y-auto">
          {shifts.map(s => (
            <button
              key={s.id}
              onClick={() => onPick(s.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left ${currentShiftId === s.id ? "bg-slate-50 ring-1 ring-slate-200" : ""}`}
            >
              <span className="w-3 h-3 rounded shrink-0" style={{ background: s.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800">{s.name}</p>
                {s.start_time && s.end_time && (
                  <p className="text-[10px] text-slate-500">{s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}</p>
                )}
              </div>
              {s.is_rest && <Coffee className="w-3 h-3 text-slate-400" />}
            </button>
          ))}
          {currentShiftId && (
            <button
              onClick={onRemove}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg hover:bg-rose-50 text-rose-600 text-xs font-medium border-t border-slate-100 mt-2"
            >
              <Trash2 className="w-3 h-3" />
              Retirer l'affectation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ShiftManagerDialog({ shifts, onClose }: { shifts: Shift[]; onClose: () => void }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("17:00");
  const [breakMin, setBreakMin] = useState(60);
  const [isRest, setIsRest] = useState(false);
  const router = useRouter();

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Nom obligatoire");
      return;
    }
    setCreating(true);
    const res = await fetch("/api/planning/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        code: code.trim() || undefined,
        color,
        start_time: isRest ? null : start,
        end_time: isRest ? null : end,
        break_minutes: isRest ? 0 : breakMin,
        is_rest: isRest,
      }),
    });
    setCreating(false);
    if (res.ok) {
      toast.success("Plage créée");
      setName(""); setCode(""); setIsRest(false);
      router.refresh();
    } else {
      const err = await res.json().catch(() => ({})) as { error?: string };
      toast.error(err.error ?? "Erreur");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette plage horaire ? Les affectations existantes seront aussi supprimées.")) return;
    const res = await fetch(`/api/planning/shifts/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Supprimée");
      router.refresh();
    } else {
      toast.error("Erreur");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Plages horaires</h3>
            <p className="text-xs text-slate-500 mt-0.5">Créez et gérez vos modèles de shifts</p>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Liste existantes */}
          {shifts.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Plages existantes</p>
              {shifts.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="w-4 h-4 rounded shrink-0" style={{ background: s.color }} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {s.name}
                        {s.code && <span className="ml-2 text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">{s.code}</span>}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {s.is_rest ? "Repos / off" : `${s.start_time?.slice(0, 5) ?? "—"} – ${s.end_time?.slice(0, 5) ?? "—"}`}
                        {!s.is_rest && s.break_minutes ? ` · pause ${s.break_minutes} min` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(s.id)}
                    className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Formulaire création */}
          <div className="space-y-3 border-t border-slate-100 pt-5">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Nouvelle plage</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-600 font-medium block mb-1">Nom *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="ex: Matin"
                  className="w-full h-9 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">Code</label>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="M"
                  maxLength={10}
                  className="w-full h-9 px-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700">
              <input type="checkbox" checked={isRest} onChange={e => setIsRest(e.target.checked)} />
              <Coffee className="w-3 h-3" />
              Plage de repos (pas d'horaires)
            </label>

            {!isRest && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">Début</label>
                  <input type="time" value={start} onChange={e => setStart(e.target.value)} className="w-full h-9 px-2 text-sm border border-slate-200 rounded-md" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">Fin</label>
                  <input type="time" value={end} onChange={e => setEnd(e.target.value)} className="w-full h-9 px-2 text-sm border border-slate-200 rounded-md" />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">Pause (min)</label>
                  <input type="number" min={0} max={480} value={breakMin} onChange={e => setBreakMin(Number(e.target.value))} className="w-full h-9 px-2 text-sm border border-slate-200 rounded-md" />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">Couleur</label>
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-9 w-16 rounded border border-slate-200 cursor-pointer" />
                <input value={color} onChange={e => setColor(e.target.value)} className="flex-1 h-9 px-3 text-xs border border-slate-200 rounded-md font-mono" />
              </div>
            </div>

            <button
              onClick={submit}
              disabled={creating || !name.trim()}
              className="w-full h-9 inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              {creating ? "Création…" : "Créer la plage"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
