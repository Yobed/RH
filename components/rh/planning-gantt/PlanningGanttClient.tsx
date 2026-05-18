"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  addDays, format, parseISO, isToday, startOfWeek, differenceInMinutes,
  isSameDay, differenceInCalendarDays, startOfDay, endOfDay, max as maxDate, min as minDate,
} from "date-fns";
import { fr } from "date-fns/locale";
import {
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  Plus,
  PaperPlaneTilt as Send,
  Gear as Settings,
  X,
  MagnifyingGlass as Search,
  Trash as Trash2,
  CalendarBlank,
  ListBullets,
  ChartBar,
  ArrowsOutSimple,
  CaretDown,
  Tag,
} from "@phosphor-icons/react";

export interface Employee {
  id: string;
  full_name: string;
  matricule: string | null;
  poste: string | null;
  departement?: string | null;
}

export interface Role {
  id: string;
  name: string;
  color: string;
  description: string | null;
}

export interface Slot {
  id: string;
  role_id: string | null;
  employee_id: string | null;
  start_at: string;
  end_at: string;
  status: "brouillon" | "publie";
  project: string | null;
  notes: string | null;
  published_at: string | null;
}

interface Props {
  employees: Employee[];
  roles: Role[];
  initialSlots: Slot[];
  rangeStart: string;       // ISO date "yyyy-MM-dd"
  rangeDays: number;        // 7 / 14 / 28
  rangeKind: "week" | "twoweeks" | "month";
}

export function PlanningGanttClient({
  employees, roles, initialSlots, rangeStart, rangeDays, rangeKind,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [editing, setEditing] = useState<{ employeeId: string | null; date: string; slot?: Slot } | null>(null);
  const [rolesDialog, setRolesDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRoleId, setFilterRoleId] = useState<string | "">("");
  const [publishing, setPublishing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [copying, setCopying] = useState(false);

  const start = useMemo(() => parseISO(rangeStart), [rangeStart]);
  const days = useMemo(
    () => Array.from({ length: rangeDays }, (_, i) => addDays(start, i)),
    [start, rangeDays]
  );
  const periodEnd = useMemo(() => addDays(start, rangeDays), [start, rangeDays]);

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.full_name.toLowerCase().includes(q) ||
        e.poste?.toLowerCase().includes(q) ||
        e.matricule?.toLowerCase().includes(q)
    );
  }, [employees, search]);

  const roleMap = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles]);

  const visibleSlots = useMemo(
    () => (filterRoleId ? slots.filter((s) => s.role_id === filterRoleId) : slots),
    [slots, filterRoleId]
  );

  // Slots indexés par (employeeId|"open", dateISO) — un slot multi-jours apparaît dans CHAQUE jour qu'il touche
  const slotsByCell = useMemo(() => {
    const m = new Map<string, Array<{ slot: Slot; isStart: boolean; isEnd: boolean; daySpan: number; dayIndex: number }>>();
    for (const s of visibleSlots) {
      const sd = parseISO(s.start_at);
      const ed = parseISO(s.end_at);
      const startDay = startOfDay(sd);
      const endDay = startOfDay(ed);
      const daySpan = Math.max(1, differenceInCalendarDays(endDay, startDay) + 1);
      for (let i = 0; i < daySpan; i++) {
        const day = addDays(startDay, i);
        const key = `${s.employee_id ?? "open"}|${format(day, "yyyy-MM-dd")}`;
        const entry = { slot: s, isStart: i === 0, isEnd: i === daySpan - 1, daySpan, dayIndex: i };
        const list = m.get(key);
        if (list) list.push(entry);
        else m.set(key, [entry]);
      }
    }
    return m;
  }, [slots]);

  // Postes ouverts (non assignés)
  const openSlots = visibleSlots.filter((s) => !s.employee_id);
  const hasOpenSlots = openSlots.length > 0;

  // KPIs — minutes décomptées par jour (multi-jours répartis)
  const totalHoursPerDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of visibleSlots) {
      const sd = parseISO(s.start_at);
      const ed = parseISO(s.end_at);
      let cursor = startOfDay(sd);
      const last = startOfDay(ed);
      while (cursor.getTime() <= last.getTime()) {
        const dayStart = maxDate([sd, cursor]);
        const dayEnd = minDate([ed, endOfDay(cursor)]);
        const mins = Math.max(0, differenceInMinutes(dayEnd, dayStart));
        const dayKey = format(cursor, "yyyy-MM-dd");
        m.set(dayKey, (m.get(dayKey) ?? 0) + mins);
        cursor = addDays(cursor, 1);
      }
    }
    return m;
  }, [slots]);

  const totalSlots = visibleSlots.length;
  const draftCount = visibleSlots.filter((s) => s.status === "brouillon").length;

  function navigate(deltaDays: number) {
    const newStart = addDays(start, deltaDays);
    startTransition(() => {
      router.push(
        `/planning-gantt?from=${format(newStart, "yyyy-MM-dd")}&range=${rangeKind}`,
        { scroll: false }
      );
    });
  }

  function goToday() {
    const today = startOfWeek(new Date(), { weekStartsOn: 1 });
    startTransition(() => {
      router.push(`/planning-gantt?from=${format(today, "yyyy-MM-dd")}&range=${rangeKind}`, { scroll: false });
    });
  }

  function changeRange(newRange: "week" | "twoweeks" | "month") {
    startTransition(() => {
      router.push(`/planning-gantt?from=${format(start, "yyyy-MM-dd")}&range=${newRange}`, { scroll: false });
    });
  }

  async function copyToNextPeriod() {
    if (!confirm(`Copier les ${slots.length} créneau(x) de cette période vers la suivante (en brouillon) ?`)) return;
    setCopying(true);
    setActionsOpen(false);
    try {
      const target = addDays(start, rangeDays);
      const res = await fetch("/api/planning-gantt/copy-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_from: start.toISOString(),
          source_to: periodEnd.toISOString(),
          target_from: target.toISOString(),
        }),
      });
      const json = (await res.json()) as { copied_count?: number; conflict_count?: number; error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Erreur");
        return;
      }
      const copied = json.copied_count ?? 0;
      const conflict = json.conflict_count ?? 0;
      toast.success(
        conflict > 0
          ? `${copied} créneau(x) copié(s) — ${conflict} ignoré(s) pour conflit.`
          : `${copied} créneau(x) copié(s) en brouillon dans la période suivante.`
      );
      // Naviguer vers la période copiée
      startTransition(() => {
        router.push(`/planning-gantt?from=${format(target, "yyyy-MM-dd")}&range=${rangeKind}`, { scroll: false });
      });
    } finally {
      setCopying(false);
    }
  }

  async function seedDefaultRoles() {
    setSeeding(true);
    try {
      const defaults = [
        { name: "Chef de chantier",   color: "#ef4444" },
        { name: "Manutentionnaire",    color: "#f59e0b" },
        { name: "Cariste",             color: "#10b981" },
        { name: "Caissier",            color: "#3b82f6" },
        { name: "Agent de sécurité",   color: "#6366f1" },
        { name: "Hôtesse d'accueil",   color: "#ec4899" },
      ];
      let created = 0;
      for (const r of defaults) {
        const res = await fetch("/api/planning-gantt/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(r),
        });
        if (res.ok) created++;
      }
      toast.success(`${created} rôles créés. Vous pouvez maintenant planifier.`);
      router.refresh();
    } finally {
      setSeeding(false);
    }
  }

  async function moveSlot(slotId: string, targetEmployeeId: string | null, targetDateISO: string) {
    const s = slots.find((x) => x.id === slotId);
    if (!s) return;
    const oldStart = parseISO(s.start_at);
    const oldEnd = parseISO(s.end_at);
    const durationMin = differenceInMinutes(oldEnd, oldStart);
    const [y, mo, da] = targetDateISO.split("-").map(Number);
    const newStart = new Date(y, mo - 1, da, oldStart.getHours(), oldStart.getMinutes(), 0, 0);
    const newEnd = new Date(newStart.getTime() + durationMin * 60_000);

    // Si le déplacement ne change rien, on ignore
    if (
      (s.employee_id ?? null) === (targetEmployeeId ?? null) &&
      format(oldStart, "yyyy-MM-dd") === targetDateISO
    ) {
      return;
    }

    // Optimistic update
    setSlots((prev) => prev.map((x) => x.id === slotId ? { ...x, employee_id: targetEmployeeId, start_at: newStart.toISOString(), end_at: newEnd.toISOString() } : x));

    const res = await fetch(`/api/planning-gantt/slots/${slotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id: targetEmployeeId,
        start_at: newStart.toISOString(),
        end_at: newEnd.toISOString(),
      }),
    });
    if (!res.ok) {
      toast.error("Déplacement échoué — rétablissement.");
      setSlots((prev) => prev.map((x) => x.id === slotId ? s : x));
    } else {
      toast.success("Créneau déplacé.");
    }
  }

  async function refresh() {
    const res = await fetch(
      `/api/planning-gantt/slots?from=${start.toISOString()}&to=${periodEnd.toISOString()}`,
      { cache: "no-store" }
    );
    if (!res.ok) return;
    const json = (await res.json()) as { slots?: Slot[] };
    setSlots(json.slots ?? []);
  }

  async function publishAll() {
    if (draftCount === 0) {
      toast.info("Aucun créneau en brouillon sur cette période.");
      return;
    }
    if (!confirm(`Publier ${draftCount} créneau(x) en brouillon ?`)) return;
    setPublishing(true);
    try {
      const res = await fetch("/api/planning-gantt/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: start.toISOString(), to: periodEnd.toISOString() }),
      });
      const json = (await res.json()) as { published_count?: number; notified_count?: number; error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Erreur");
        return;
      }
      const pub = json.published_count ?? 0;
      const notif = json.notified_count ?? 0;
      toast.success(
        notif > 0
          ? `${pub} créneau(x) publié(s) — ${notif} collaborateur(s) notifié(s).`
          : `${pub} créneau(x) publié(s).`
      );
      await refresh();
    } finally {
      setPublishing(false);
    }
  }

  const rangeLabel = useMemo(() => {
    const last = addDays(start, rangeDays - 1);
    if (rangeKind === "week") {
      return `Semaine ${format(start, "II")}, ${format(start, "d MMM", { locale: fr })} – ${format(last, "d MMM", { locale: fr })}`;
    }
    return `${format(start, "d MMM", { locale: fr })} – ${format(last, "d MMM yyyy", { locale: fr })}`;
  }, [start, rangeKind, rangeDays]);

  const cellMinWidth = rangeDays > 14 ? 90 : rangeDays > 7 ? 110 : 140;

  return (
    <div className="flex flex-col bg-white min-h-[calc(100vh-3rem)]">
      {/* ─── Barre supérieure style Odoo ─── */}
      <header className="border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3 px-5 py-2.5">
          <button
            onClick={() => setEditing({ employeeId: null, date: format(start, "yyyy-MM-dd") })}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#7c3a5b] hover:bg-[#6a3050] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" weight="bold" />
            Nouveau
          </button>
          <button
            onClick={publishAll}
            disabled={publishing || draftCount === 0}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-[12px] font-semibold text-white transition-colors"
          >
            <Send className="h-3.5 w-3.5" weight="fill" />
            {publishing ? "Publication…" : `Publier${draftCount > 0 ? ` (${draftCount})` : ""}`}
          </button>
          <div className="relative">
            <button
              onClick={() => setActionsOpen((v) => !v)}
              onBlur={() => setTimeout(() => setActionsOpen(false), 150)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 hover:bg-slate-50 px-2.5 py-1.5 text-[12px] font-semibold text-slate-700"
            >
              Actions
              <CaretDown className="h-3 w-3" />
            </button>
            {actionsOpen && (
              <div className="absolute left-0 top-full mt-1 z-30 w-64 rounded-md border border-slate-200 bg-white shadow-lg overflow-hidden">
                <button
                  onClick={copyToNextPeriod}
                  disabled={copying || slots.length === 0}
                  className="w-full text-left px-3 py-2 text-[12px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-start gap-2"
                >
                  <span className="text-indigo-500 mt-0.5">→</span>
                  <span>
                    Copier vers la période suivante
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                      Duplique les créneaux en brouillon, décalés de {rangeDays} jours.
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => { setActionsOpen(false); setRolesDialog(true); }}
                  className="w-full text-left px-3 py-2 text-[12px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-start gap-2 border-t border-slate-100"
                >
                  <Settings className="h-3 w-3 mt-1 text-slate-400" />
                  <span>
                    Gérer les rôles
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                      Ajouter, supprimer, recolorer.
                    </span>
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-1 text-[13px] text-slate-500">
            <span className="font-semibold text-slate-700">Planning par ressource</span>
            <button
              onClick={() => setRolesDialog(true)}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              title="Gérer les rôles"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Recherche + filtres */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 w-full max-w-2xl rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="inline-flex items-center gap-1 rounded bg-indigo-100 text-indigo-700 px-1.5 py-0.5 text-[10px] font-semibold shrink-0">
                <Tag className="h-2.5 w-2.5" weight="fill" />
                Ressource
              </span>
              {filterRoleId && (
                <span
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold shrink-0 text-white"
                  style={{ background: roleMap.get(filterRoleId)?.color ?? "#6366f1" }}
                >
                  <Tag className="h-2.5 w-2.5" weight="fill" />
                  {roleMap.get(filterRoleId)?.name}
                  <button onClick={() => setFilterRoleId("")} className="hover:opacity-80">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un collaborateur…"
                className="flex-1 bg-transparent text-[12px] text-slate-700 placeholder:text-slate-400 outline-none"
              />
              {!filterRoleId && roles.length > 0 && (
                <select
                  value={filterRoleId}
                  onChange={(e) => setFilterRoleId(e.target.value)}
                  className="text-[11px] font-semibold text-slate-500 bg-transparent outline-none cursor-pointer hover:text-slate-700"
                  title="Filtrer par rôle"
                >
                  <option value="">+ Filtrer par rôle</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* View switcher */}
          <div className="flex items-center gap-0.5 rounded-md border border-slate-200 p-0.5 bg-white">
            <ViewIcon icon={ChartBar} active title="Gantt" />
            <ViewIcon icon={CalendarBlank} title="Calendrier" />
            <ViewIcon icon={ListBullets} title="Liste" />
          </div>
        </div>

        {/* Sous-toolbar : navigation période */}
        <div className="flex items-center gap-2 px-5 py-2 border-t border-slate-100 bg-slate-50/40">
          <button
            onClick={() => navigate(-rangeDays)}
            disabled={isPending}
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600"
            title="Période précédente"
          >
            <ChevronLeft className="h-4 w-4" weight="bold" />
          </button>
          <button
            onClick={() => navigate(rangeDays)}
            disabled={isPending}
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600"
            title="Période suivante"
          >
            <ChevronRight className="h-4 w-4" weight="bold" />
          </button>

          <RangeSelect value={rangeKind} onChange={changeRange} />

          <button
            onClick={goToday}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 hover:bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
          >
            Aujourd&apos;hui
          </button>

          <span className="text-[12px] text-slate-500 ml-3">{rangeLabel}</span>

          <div className="flex-1" />
          <span className="text-[11px] text-slate-500">
            <span className="font-bold text-slate-700">{totalSlots}</span> créneau{totalSlots > 1 ? "x" : ""}
            {draftCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 text-[10px] font-bold">
                {draftCount} en brouillon
              </span>
            )}
          </span>

          <button
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500"
            title="Plein écran"
          >
            <ArrowsOutSimple className="h-3.5 w-3.5" weight="bold" />
          </button>
        </div>
      </header>

      {/* ─── État vide : aucun rôle configuré ─── */}
      {roles.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="text-center max-w-md">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ChartBar className="h-7 w-7 text-white" weight="fill" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Aucun rôle configuré</h2>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              Avant de planifier, créez les <strong>rôles</strong> que vos collaborateurs peuvent occuper
              (Chef de chantier, Caissier, Manutention…). Vous pouvez démarrer rapidement avec un jeu de rôles types.
            </p>
            <div className="flex items-center gap-2 justify-center mt-5">
              <button
                onClick={seedDefaultRoles}
                disabled={seeding}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#7c3a5b] hover:bg-[#6a3050] disabled:opacity-50 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" weight="bold" />
                {seeding ? "Création…" : "Démarrer avec 6 rôles types"}
              </button>
              <button
                onClick={() => setRolesDialog(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 hover:bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-700"
              >
                <Settings className="h-3.5 w-3.5" />
                Configurer manuellement
              </button>
            </div>
          </div>
        </div>
      ) : (
      /* ─── Grille gantt ─── */
      <div className="flex-1 overflow-auto">
        <div className="min-w-fit">
          <table className="text-[12px] border-collapse">
            <thead className="sticky top-0 z-20 bg-white">
              <tr>
                <th className="sticky left-0 z-30 bg-white border-b border-r border-slate-200 px-4 py-2 text-left text-[10px] font-bold text-slate-600 uppercase tracking-widest min-w-[220px]">
                  Planning
                </th>
                {days.map((d) => (
                  <th
                    key={d.toISOString()}
                    className={`border-b border-r border-slate-200 px-2 py-2 text-center font-semibold uppercase ${
                      isToday(d) ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-600"
                    }`}
                    style={{ minWidth: cellMinWidth }}
                  >
                    <div className="text-[10px] tracking-widest">{format(d, "EEEE", { locale: fr })}</div>
                    <div className="text-[11px] mt-0.5 font-bold normal-case">{format(d, "d", { locale: fr })}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Ligne Postes ouverts */}
              <ResourceRow
                resourceId={null}
                title="Postes ouverts"
                subtitle={hasOpenSlots ? `${openSlots.length} à pourvoir` : "Aucun"}
                days={days}
                slotsByCell={slotsByCell}
                roleMap={roleMap}
                cellMinWidth={cellMinWidth}
                onCellClick={(date) => setEditing({ employeeId: null, date })}
                onSlotClick={(slot) => setEditing({ employeeId: null, date: format(parseISO(slot.start_at), "yyyy-MM-dd"), slot })}
                onMoveSlot={moveSlot}
                isOpenRow
              />

              {/* Lignes employés */}
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={days.length + 1} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <CalendarBlank className="h-10 w-10 opacity-30" />
                      <p className="text-sm font-medium">
                        {search ? "Aucun collaborateur ne correspond à votre recherche." : "Aucun collaborateur actif."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <ResourceRow
                    key={emp.id}
                    resourceId={emp.id}
                    title={emp.full_name}
                    subtitle={emp.poste ?? undefined}
                    matricule={emp.matricule}
                    days={days}
                    slotsByCell={slotsByCell}
                    roleMap={roleMap}
                    cellMinWidth={cellMinWidth}
                    onCellClick={(date) => setEditing({ employeeId: emp.id, date })}
                    onSlotClick={(slot) => setEditing({ employeeId: emp.id, date: format(parseISO(slot.start_at), "yyyy-MM-dd"), slot })}
                    onMoveSlot={moveSlot}
                  />
                ))
              )}

              {/* Ligne Total */}
              <tr className="bg-slate-50 sticky bottom-0">
                <td className="sticky left-0 z-10 bg-slate-50 border-t border-r border-slate-200 px-4 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total / jour</p>
                </td>
                {days.map((d) => {
                  const key = format(d, "yyyy-MM-dd");
                  const minutes = totalHoursPerDay.get(key) ?? 0;
                  const hours = Math.round((minutes / 60) * 10) / 10;
                  return (
                    <td
                      key={key}
                      className={`border-t border-r border-slate-200 px-2 py-2 text-center text-[11px] font-bold tabular-nums ${
                        minutes > 0 ? "text-slate-800" : "text-slate-300"
                      }`}
                    >
                      {minutes > 0 ? `${hours}h` : "—"}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>

          {employees.length === 0 && (
            <div className="px-5 py-16 text-center">
              <p className="text-sm font-medium text-slate-500">
                Aucun collaborateur actif. Ajoutez d&apos;abord vos employés.
              </p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* ─── Dialogs ─── */}
      {editing && (
        <SlotDialog
          employeeId={editing.employeeId}
          employees={employees}
          roles={roles}
          date={editing.date}
          slot={editing.slot}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh();
            router.refresh();
          }}
        />
      )}

      {rolesDialog && (
        <RolesDialog
          roles={roles}
          onClose={() => {
            setRolesDialog(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
function ViewIcon({
  icon: Icon, active, title,
}: { icon: React.ComponentType<{ className?: string; weight?: "fill" }>; active?: boolean; title: string }) {
  return (
    <button
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        active ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      <Icon className="h-3.5 w-3.5" weight={active ? "fill" : undefined} />
    </button>
  );
}

function RangeSelect({
  value, onChange,
}: { value: "week" | "twoweeks" | "month"; onChange: (v: "week" | "twoweeks" | "month") => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as "week" | "twoweeks" | "month")}
        className="appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-7 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-300"
      >
        <option value="week">Semaine</option>
        <option value="twoweeks">2 semaines</option>
        <option value="month">Mois (4 sem.)</option>
      </select>
      <CaretDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
    </div>
  );
}

interface SlotEntry {
  slot: Slot;
  isStart: boolean;
  isEnd: boolean;
  daySpan: number;
  dayIndex: number;
}

interface ResourceRowProps {
  resourceId: string | null;
  title: string;
  subtitle?: string;
  matricule?: string | null;
  days: Date[];
  slotsByCell: Map<string, SlotEntry[]>;
  roleMap: Map<string, Role>;
  cellMinWidth: number;
  onCellClick: (date: string) => void;
  onSlotClick: (slot: Slot) => void;
  onMoveSlot: (slotId: string, targetEmployeeId: string | null, targetDateISO: string) => void;
  isOpenRow?: boolean;
}

function ResourceRow({
  resourceId, title, subtitle, matricule, days, slotsByCell, roleMap, cellMinWidth,
  onCellClick, onSlotClick, onMoveSlot, isOpenRow,
}: ResourceRowProps) {
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const initials = title.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  function handleDragStart(e: React.DragEvent, slotId: string) {
    e.dataTransfer.setData("text/plain", slotId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, dateKey: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverDate !== dateKey) setDragOverDate(dateKey);
  }

  function handleDrop(e: React.DragEvent, dateKey: string) {
    e.preventDefault();
    setDragOverDate(null);
    const slotId = e.dataTransfer.getData("text/plain");
    if (!slotId) return;
    onMoveSlot(slotId, resourceId, dateKey);
  }

  return (
    <tr className={`group ${isOpenRow ? "bg-amber-50/30" : "hover:bg-slate-50/40"}`}>
      <td
        className={`sticky left-0 z-10 border-b border-r border-slate-200 px-4 py-2 ${
          isOpenRow ? "bg-amber-50/50" : "bg-white group-hover:bg-slate-50/40"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
              isOpenRow
                ? "bg-amber-200 text-amber-800"
                : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
            }`}
          >
            {isOpenRow ? "⚠" : initials}
          </div>
          <div className="min-w-0">
            <p className={`text-[12px] font-bold leading-tight truncate ${isOpenRow ? "text-amber-800" : "text-slate-800"}`}>
              {title}
            </p>
            {subtitle && (
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {subtitle}
                {matricule && <span className="text-slate-300 ml-1.5">· {matricule}</span>}
              </p>
            )}
          </div>
        </div>
      </td>
      {days.map((d) => {
        const dateKey = format(d, "yyyy-MM-dd");
        const cellEntries = slotsByCell.get(`${resourceId ?? "open"}|${dateKey}`) ?? [];
        const isDragOver = dragOverDate === dateKey;
        return (
          <td
            key={dateKey}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("[data-slot]")) return;
              onCellClick(dateKey);
            }}
            onDragOver={(e) => handleDragOver(e, dateKey)}
            onDragLeave={() => setDragOverDate((cur) => (cur === dateKey ? null : cur))}
            onDrop={(e) => handleDrop(e, dateKey)}
            className={`border-b border-r border-slate-100 px-1 py-1 align-top cursor-pointer transition-colors ${
              isToday(d) ? "bg-amber-50/30" : ""
            } ${isDragOver ? "bg-indigo-100/60 ring-2 ring-indigo-400 ring-inset" : "hover:bg-indigo-50/30"}`}
            style={{ minWidth: cellMinWidth }}
          >
            <div className="flex flex-col gap-1 min-h-[48px]">
              {cellEntries.map((entry) => {
                const s = entry.slot;
                const role = s.role_id ? roleMap.get(s.role_id) : null;
                const bg = role?.color ?? "#94a3b8";
                const startH = format(parseISO(s.start_at), "HH:mm");
                const endH = format(parseISO(s.end_at), "HH:mm");
                const sameDay = entry.daySpan === 1;
                const isMiddle = !entry.isStart && !entry.isEnd;
                const draggable = entry.isStart; // seul le segment de départ est draggable

                return (
                  <button
                    key={`${s.id}-${entry.dayIndex}`}
                    data-slot
                    draggable={draggable}
                    onDragStart={draggable ? (e) => handleDragStart(e, s.id) : undefined}
                    onClick={(e) => { e.stopPropagation(); onSlotClick(s); }}
                    className={`text-left px-2 py-1 text-[10px] font-semibold text-white transition-all hover:shadow-md ${
                      draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                    } ${s.status === "brouillon" ? "border border-dashed border-white/40" : ""} ${
                      sameDay ? "rounded-md"
                      : entry.isStart ? "rounded-l-md rounded-r-none -mr-1 pr-3"
                      : entry.isEnd ? "rounded-r-md rounded-l-none -ml-1 pl-3"
                      : "rounded-none -mx-1 px-3"
                    }`}
                    style={{
                      background: s.status === "brouillon"
                        ? `repeating-linear-gradient(45deg, ${bg}, ${bg} 4px, ${bg}cc 4px, ${bg}cc 8px)`
                        : bg,
                    }}
                    title={`${role?.name ?? "Sans rôle"} · ${startH}–${endH}${
                      entry.daySpan > 1 ? ` · ${entry.daySpan} jours` : ""
                    }${s.project ? ` · ${s.project}` : ""}`}
                  >
                    {entry.isStart ? (
                      <>
                        <div className="truncate flex items-center gap-1">
                          {role?.name ?? "Sans rôle"}
                          {!entry.isEnd && <span className="opacity-70">→</span>}
                        </div>
                        <div className="text-[9px] opacity-90">
                          {sameDay ? `${startH}–${endH}` : `${startH} → ${entry.daySpan}j`}
                        </div>
                      </>
                    ) : isMiddle ? (
                      <div className="truncate opacity-80 text-center">⋯</div>
                    ) : (
                      <>
                        <div className="truncate flex items-center gap-1 justify-end">
                          <span className="opacity-70">→</span>
                          {role?.name ?? "Sans rôle"}
                        </div>
                        <div className="text-[9px] opacity-90 text-right">jusqu&apos;à {endH}</div>
                      </>
                    )}
                  </button>
                );
              })}
              {cellEntries.length === 0 && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-10 text-slate-300 text-xs">
                  <Plus className="h-3 w-3" />
                </div>
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

// ────────────────────────────────────────────────────────────────────────────
function SlotDialog({
  employeeId, employees, roles, date, slot, onClose, onSaved,
}: {
  employeeId: string | null;
  employees: Employee[];
  roles: Role[];
  date: string;
  slot?: Slot;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [empId, setEmpId] = useState<string | "">(slot?.employee_id ?? employeeId ?? "");
  const [roleId, setRoleId] = useState<string | "">(slot?.role_id ?? roles[0]?.id ?? "");
  const [startTime, setStartTime] = useState(slot ? format(parseISO(slot.start_at), "HH:mm") : "09:00");
  const [endTime, setEndTime] = useState(slot ? format(parseISO(slot.end_at), "HH:mm") : "17:00");
  const [dateValue, setDateValue] = useState(slot ? format(parseISO(slot.start_at), "yyyy-MM-dd") : date);
  const [project, setProject] = useState(slot?.project ?? "");
  const [notes, setNotes] = useState(slot?.notes ?? "");
  const [status, setStatus] = useState<"brouillon" | "publie">(slot?.status ?? "brouillon");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    if (!roleId) {
      toast.error("Sélectionnez un rôle.");
      return;
    }
    setSaving(true);
    try {
      const startAt = new Date(`${dateValue}T${startTime}:00`).toISOString();
      const endAt = new Date(`${dateValue}T${endTime}:00`).toISOString();
      const payload = {
        role_id: roleId || null,
        employee_id: empId || null,
        start_at: startAt,
        end_at: endAt,
        project: project.trim() || null,
        notes: notes.trim() || null,
        status,
      };
      const res = slot
        ? await fetch(`/api/planning-gantt/slots/${slot.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/planning-gantt/slots", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Erreur");
        return;
      }
      toast.success(slot ? "Créneau mis à jour." : "Créneau créé.");
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!slot) return;
    if (!confirm("Supprimer ce créneau ?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/planning-gantt/slots/${slot.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Suppression échouée.");
        return;
      }
      toast.success("Créneau supprimé.");
      onSaved();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">
            {slot ? "Modifier le créneau" : "Nouveau créneau"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ressource">
              <select
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                className="w-full h-9 px-2 text-sm border border-slate-200 rounded-md bg-white"
              >
                <option value="">⚠ Poste ouvert</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name}</option>
                ))}
              </select>
            </Field>
            <Field label="Rôle *">
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full h-9 px-2 text-sm border border-slate-200 rounded-md bg-white"
              >
                <option value="">— Sélectionner —</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Date">
            <input type="date" value={dateValue} onChange={(e) => setDateValue(e.target.value)} className="w-full h-9 px-2 text-sm border border-slate-200 rounded-md" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Heure début">
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full h-9 px-2 text-sm border border-slate-200 rounded-md" />
            </Field>
            <Field label="Heure fin">
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full h-9 px-2 text-sm border border-slate-200 rounded-md" />
            </Field>
          </div>

          <Field label="Projet / Chantier (optionnel)">
            <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="ex: Chantier Cocody" className="w-full h-9 px-2 text-sm border border-slate-200 rounded-md" />
          </Field>

          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-md resize-none" />
          </Field>

          <div className="flex items-center gap-2 pt-1">
            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
              <input type="radio" checked={status === "brouillon"} onChange={() => setStatus("brouillon")} />
              <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">Brouillon</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
              <input type="radio" checked={status === "publie"} onChange={() => setStatus("publie")} />
              <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">Publié</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/60">
          {slot ? (
            <button
              onClick={remove}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-md disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Suppression…" : "Supprimer"}
            </button>
          ) : <span />}

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-[12px] font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5">
              Annuler
            </button>
            <button
              onClick={save}
              disabled={saving || !roleId}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#7c3a5b] hover:bg-[#6a3050] disabled:opacity-50 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm"
            >
              {saving ? "Enregistrement…" : slot ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
function RolesDialog({ roles, onClose }: { roles: Role[]; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [creating, setCreating] = useState(false);

  async function create() {
    if (!name.trim()) {
      toast.error("Nom requis.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/planning-gantt/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        toast.error(j.error ?? "Erreur");
        return;
      }
      setName("");
      toast.success("Rôle créé.");
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  async function archive(id: string) {
    if (!confirm("Archiver ce rôle ? Les créneaux existants seront conservés.")) return;
    const res = await fetch(`/api/planning-gantt/roles/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Rôle archivé.");
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Rôles du planning</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {roles.length > 0 && (
            <ul className="space-y-1.5">
              {roles.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-4 w-4 rounded shrink-0" style={{ background: r.color }} />
                    <p className="text-xs font-semibold text-slate-800 truncate">{r.name}</p>
                  </div>
                  <button onClick={() => archive(r.id)} className="text-slate-400 hover:text-rose-600 p-1">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2 border-t border-slate-100 pt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Nouveau rôle</p>
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Chef de cuisine"
                className="flex-1 h-9 px-3 text-sm border border-slate-200 rounded-md"
              />
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 rounded border border-slate-200" />
              <button
                onClick={create}
                disabled={creating || !name.trim()}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-3 h-9 text-[12px] font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
