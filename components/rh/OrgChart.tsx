"use client";

import React, { useState, useTransition, useMemo } from "react";
import { 
  Users, 
  ChevronDown, 
  ChevronRight, 
  UserPlus, 
  X, 
  Check, 
  TrendingUp, 
  Edit3, 
  Trash2, 
  Move, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Briefcase,
  UserCheck,
  ShieldAlert,
  Printer,
  Network,
  Layers,
  Maximize2,
  Minimize2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";

export type OrgEmployee = {
  id: string;
  full_name: string;
  poste: string | null;
  departement: string | null;
  manager_id: string | null;
  statut: string;
  photo_url?: string | null;
};

type OrgNode = OrgEmployee & { children: OrgNode[] };

// Palette d'avatars harmonisée & épurée (Tons exécutifs & Accents Marque)
const AVATAR_COLORS = [
  "bg-slate-900 text-white shadow-slate-900/10 dark:bg-slate-100 dark:text-slate-900",
  "bg-[#059669] text-white shadow-[#059669]/20",
  "bg-slate-800 text-slate-100 shadow-slate-800/10 dark:bg-slate-800 dark:text-slate-200",
  "bg-amber-600 text-white shadow-amber-600/15",
  "bg-slate-700 text-white shadow-slate-700/10",
];

// Badges départements harmonisés (Style Pill minimaliste et sobre)
const DEPT_BADGE_STYLES: Record<string, string> = {
  "Direction & IT": "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  "Direction": "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/40",
  "RH": "bg-orange-50 dark:bg-orange-950/40 text-[#059669] border-orange-200/60 dark:border-orange-900/40",
  "Ressources Humaines": "bg-orange-50 dark:bg-orange-950/40 text-[#059669] border-orange-200/60 dark:border-orange-900/40",
  "Finance": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40",
  "Comptabilité": "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40",
  "Commercial": "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200/60 dark:border-teal-900/40",
  "Ventes": "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200/60 dark:border-teal-900/40",
  "Exploitation": "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  "Logistique": "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200/60 dark:border-teal-900/40",
};

function avatarGradient(id: string) {
  const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

function buildTree(employees: OrgEmployee[]): OrgNode[] {
  const map = new Map<string, OrgNode>();
  for (const e of employees) map.set(e.id, { ...e, children: [] });

  const roots: OrgNode[] = [];
  for (const e of employees) {
    const node = map.get(e.id)!;
    const parent = e.manager_id ? map.get(e.manager_id) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

// ──────────────────────────────────────────────────────────────
// MODALE D'AJOUT D'UN SUBORDONNÉ DIRECT
// ──────────────────────────────────────────────────────────────
function AddSubordinateModal({
  manager,
  all,
  open,
  onClose,
}: {
  manager: OrgEmployee;
  all: OrgEmployee[];
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [search, setSearch] = useState("");
  const [fullName, setFullName] = useState("");
  const [poste, setPoste] = useState("");
  const [departement, setDepartement] = useState(manager.departement || "");
  const [typeContrat, setTypeContrat] = useState<"CDI" | "CDD" | "Stage" | "Apprentissage">("CDI");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Ascendants du manager (pour éviter les cycles : on ne rattache pas un chef au-dessus de lui sous lui)
  const ancestorIds = useMemo(() => {
    const set = new Set<string>();
    let cur = manager.manager_id;
    let guard = 0;
    while (cur && guard < 100) {
      set.add(cur);
      cur = all.find((e) => e.id === cur)?.manager_id ?? null;
      guard++;
    }
    return set;
  }, [manager, all]);

  // Employés disponibles : non encore rattachés (manager_id nul), hors soi-même, ascendants et inactifs
  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all
      .filter(
        (e) =>
          !e.manager_id &&
          e.id !== manager.id &&
          !ancestorIds.has(e.id) &&
          e.statut !== "inactif"
      )
      .filter((e) => !q || e.full_name.toLowerCase().includes(q) || (e.poste ?? "").toLowerCase().includes(q));
  }, [all, manager.id, ancestorIds, search]);

  // Rattacher un employé existant comme subordonné direct
  const attachExisting = (employeeId: string, name: string) => {
    startTransition(async () => {
      const res = await fetch("/api/employees/manager", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId, manager_id: manager.id }),
      });
      if (res.ok) {
        toast.success(`${name} rattaché(e) sous ${manager.full_name}`);
        onClose();
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({})) as { error?: string };
        toast.error(err.error ?? "Erreur lors du rattachement");
      }
    });
  };

  const handleCreate = () => {
    if (!fullName.trim() || !poste.trim()) return;
    startTransition(async () => {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          matricule: `EMP-${Date.now().toString().slice(-4)}`,
          poste,
          departement: departement || null,
          date_embauche: new Date().toISOString().split("T")[0],
          type_contrat: typeContrat,
          statut: "actif",
        }),
      });
      if (res.ok) {
        const created = await res.json();
        await fetch("/api/employees/manager", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employee_id: created.id, manager_id: manager.id }),
        });
        toast.success(`Collaborateur ${fullName} ajouté sous ${manager.full_name}`);
        onClose();
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Erreur lors de la création");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#059669]/10 text-[#059669]">
              <UserPlus className="h-4 w-4" />
            </div>
            Ajouter un subordonné direct
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Rattachement hiérarchique direct à <strong className="text-slate-800 dark:text-slate-200 font-semibold">{manager.full_name}</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Bascule : rattacher un existant (défaut) ou créer un nouveau */}
        <div className="my-3 inline-flex items-center gap-1 rounded-xl border border-slate-200/70 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-800/60">
          <button
            onClick={() => setMode("existing")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === "existing" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-500"}`}
          >
            Collaborateur existant
          </button>
          <button
            onClick={() => setMode("new")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mode === "new" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" : "text-slate-500"}`}
          >
            Nouveau
          </button>
        </div>

        {mode === "existing" ? (
          <div className="space-y-3 pb-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un collaborateur non rattaché…"
                className="w-full text-xs font-medium pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#059669]/40 transition-all"
              />
            </div>

            <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
              {candidates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-5 text-center">
                  <p className="text-xs font-medium text-slate-500">Aucun collaborateur disponible.</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Tous les collaborateurs sont déjà rattachés. Crée un nouveau profil via l'onglet « Nouveau ».
                  </p>
                </div>
              ) : (
                candidates.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => attachExisting(e.id, e.full_name)}
                    disabled={isPending}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-left transition-all hover:border-[#059669]/40 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                  >
                    <Avatar src={e.photo_url} name={e.full_name} size={32} rounded="full" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{e.full_name}</p>
                      <p className="truncate text-[11px] text-slate-400">
                        {e.poste || "Poste non défini"}
                        {e.departement ? ` · ${e.departement}` : ""}
                      </p>
                    </div>
                    <UserPlus className="h-4 w-4 shrink-0 text-slate-300" />
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 py-1">
            <div>
              <label htmlFor="add-sub-fullname" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nom complet *</label>
              <input
                id="add-sub-fullname"
                type="text"
                placeholder="Ex: Jean Dupont"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#059669]/40 transition-all"
              />
            </div>
            <div>
              <label htmlFor="add-sub-poste" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Poste / Intitulé *</label>
              <input
                id="add-sub-poste"
                type="text"
                placeholder="Ex: Analyste RH, Assistant Commercial..."
                value={poste}
                onChange={(e) => setPoste(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#059669]/40 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="add-sub-dept" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Département</label>
                <input
                  id="add-sub-dept"
                  type="text"
                  value={departement}
                  onChange={(e) => setDepartement(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#059669]/40 transition-all"
                />
              </div>
              <div>
                <label htmlFor="add-sub-contrat" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Contrat</label>
                <select
                  id="add-sub-contrat"
                  value={typeContrat}
                  onChange={(e) => setTypeContrat(e.target.value as any)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#059669]/40 transition-all"
                >
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="Stage">Stage</option>
                  <option value="Apprentissage">Apprentissage</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs font-semibold text-slate-500 rounded-xl">
            {mode === "existing" ? "Fermer" : "Annuler"}
          </Button>
          {mode === "new" && (
            <Button
              size="sm"
              disabled={isPending || !fullName.trim() || !poste.trim()}
              onClick={handleCreate}
              className="bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold px-4 rounded-xl shadow-xs transition-all"
            >
              {isPending ? "Création..." : "Créer & rattacher"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────
// MODALE DE MODIFICATION D'UN SALARIÉ
// ──────────────────────────────────────────────────────────────
function EditEmployeeModal({
  employee,
  open,
  onClose,
}: {
  employee: OrgEmployee;
  open: boolean;
  onClose: () => void;
}) {
  const [fullName, setFullName] = useState(employee.full_name);
  const [poste, setPoste] = useState(employee.poste || "");
  const [departement, setDepartement] = useState(employee.departement || "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSave = () => {
    startTransition(async () => {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          poste,
          departement: departement || null,
        }),
      });

      if (res.ok) {
        toast.success(`Profil mis à jour pour ${fullName}`);
        onClose();
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Erreur lors de la modification");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
              <Edit3 className="h-4 w-4" />
            </div>
            Modifier le Collaborateur
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Mise à jour des informations de poste et de département.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-3">
          <div>
            <label htmlFor="edit-emp-fullname" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nom complet</label>
            <input
              id="edit-emp-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#059669]/40 transition-all"
            />
          </div>

          <div>
            <label htmlFor="edit-emp-poste" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Poste / Fonction</label>
            <input
              id="edit-emp-poste"
              type="text"
              value={poste}
              onChange={(e) => setPoste(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#059669]/40 transition-all"
            />
          </div>

          <div>
            <label htmlFor="edit-emp-dept" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Département / Service</label>
            <input
              id="edit-emp-dept"
              type="text"
              value={departement}
              onChange={(e) => setDepartement(e.target.value)}
              placeholder="Ex: Direction & IT, RH, Finance..."
              className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#059669]/40 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs font-semibold text-slate-500 rounded-xl">
            Annuler
          </Button>
          <Button
            size="sm"
            disabled={isPending || !fullName.trim()}
            onClick={handleSave}
            className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold px-4 rounded-xl shadow-xs transition-all"
          >
            {isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────
// MODALE DE SUPPRESSION / ARCHIVAGE D'UN SALARIÉ
// ──────────────────────────────────────────────────────────────
function DeleteEmployeeModal({
  employee,
  open,
  onClose,
}: {
  employee: OrgEmployee;
  open: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`${employee.full_name} a été archivé avec succès.`);
        onClose();
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Erreur lors de l'archivage");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
            Archiver le Collaborateur
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-1">
            Êtes-vous sûr de vouloir archiver <strong className="text-slate-800 dark:text-slate-200 font-semibold">{employee.full_name}</strong> ?
          </DialogDescription>
        </DialogHeader>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 my-2">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
            ℹ️ Le statut passera en inactif. Les éventuels rattachés directs pourront être réassignés.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs font-semibold text-slate-500 rounded-xl">
            Annuler
          </Button>
          <Button
            size="sm"
            disabled={isPending}
            onClick={handleDelete}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 rounded-xl shadow-xs transition-all"
          >
            {isPending ? "Archivage..." : "Archiver"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────
// POPOVER DE RÉASSIGNATION HIÉRARCHIQUE (DEPLACER)
// ──────────────────────────────────────────────────────────────
function ManagerPopover({
  node,
  all,
  onClose,
}: {
  node: OrgNode;
  all: OrgEmployee[];
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = all
    .filter(e => e.id !== node.id)
    .filter(e =>
      !search || e.full_name.toLowerCase().includes(search.toLowerCase()) || (e.poste && e.poste.toLowerCase().includes(search.toLowerCase()))
    );

  const assign = (managerId: string | null) => {
    startTransition(async () => {
      const res = await fetch("/api/employees/manager", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: node.id, manager_id: managerId }),
      });
      if (res.ok) {
        toast.success(`Rattachement hiérarchique mis à jour !`);
        onClose();
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({})) as { error?: string };
        toast.error(err.error ?? "Erreur de réassignation");
      }
    });
  };

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl p-3 text-left animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Move className="h-3.5 w-3.5 text-[#059669]" /> Changer le Supérieur (N+1)
        </p>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600">
          <X size={12} />
        </button>
      </div>

      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un manager..."
          className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#059669]/40 transition-all"
        />
      </div>

      <div className="space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
        <button
          onClick={() => assign(null)}
          disabled={isPending}
          className={`w-full text-left text-xs px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${
            !node.manager_id ? "bg-orange-50 dark:bg-orange-950/40 text-[#059669] font-bold" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 italic"
          }`}
        >
          <span>Définir comme Racine (Sans N+1)</span>
          {!node.manager_id && <Check size={12} className="text-[#059669]" />}
        </button>

        {filtered.map(e => (
          <button
            key={e.id}
            onClick={() => assign(e.id)}
            disabled={isPending}
            className={`w-full text-left text-xs px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${
              node.manager_id === e.id 
                ? "bg-orange-50 dark:bg-orange-950/40 text-[#059669] font-bold border border-orange-200/50" 
                : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            <div className="truncate pr-2">
              <p className="font-semibold truncate">{e.full_name}</p>
              {e.poste && <p className="text-[10px] text-slate-400 truncate font-normal">{e.poste}</p>}
            </div>
            {node.manager_id === e.id && <Check size={12} className="text-[#059669] shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// CARTE D'UN SALARIÉ DANS L'ORGANIGRAMME (STYLE ÉPURÉ & MODERNE)
// ──────────────────────────────────────────────────────────────
const OrgNodeCard = React.memo(function OrgNodeCard({
  node,
  all,
  collapsed,
  onToggle,
  highlight,
}: {
  node: OrgNode;
  all: OrgEmployee[];
  collapsed: boolean;
  onToggle: () => void;
  highlight?: boolean;
}) {
  const [showManagerPopover, setShowManagerPopover] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddSubModal, setShowAddSubModal] = useState(false);

  const deptStyle = node.departement && DEPT_BADGE_STYLES[node.departement]
    ? DEPT_BADGE_STYLES[node.departement]
    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/80";

  return (
    <div className="relative inline-block group my-1">
      <div
        className={`w-60 overflow-hidden bg-white dark:bg-slate-900 border rounded-2xl p-4 pt-5 transition-all duration-200 text-left select-none relative ${
          highlight
            ? "border-[#059669] ring-2 ring-[#059669]/30 shadow-lg z-10 -translate-y-0.5"
            : "border-slate-200/70 dark:border-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-[#059669]/40 hover:shadow-[0_14px_30px_-14px_rgba(13,148,136,0.4)]"
        }`}
      >
        {/* Liseré d'accent en tête de carte */}
        <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#059669] to-[#2dd4bf]" />

        {/* En-tête Carte : Avatar + Actions Rapides Flottantes Épurées */}
        <div className="flex items-center justify-between mb-3">
          <Avatar src={node.photo_url} name={node.full_name} size={44} rounded="full" className={`ring-2 ring-white shadow-sm dark:ring-slate-900 ${node.photo_url ? "" : avatarGradient(node.id)}`} />

          {/* Actions rapides épurées au survol */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-900/90 dark:bg-slate-800/90 text-white p-1 rounded-xl shadow-sm backdrop-blur-xs">
            <button
              onClick={() => setShowAddSubModal(true)}
              className="p-1 rounded-lg hover:bg-[#059669] text-white transition-colors"
              title="Ajouter un collaborateur direct"
            >
              <UserPlus size={13} />
            </button>
            <button
              onClick={() => setShowManagerPopover(v => !v)}
              className="p-1 rounded-lg hover:bg-slate-700 text-amber-300 transition-colors"
              title="Changer de supérieur (N+1)"
            >
              <Move size={13} />
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="p-1 rounded-lg hover:bg-slate-700 text-teal-300 transition-colors"
              title="Modifier"
            >
              <Edit3 size={13} />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-1 rounded-lg hover:bg-rose-600 text-white transition-colors"
              title="Archiver"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Détails Salarié */}
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
            {node.full_name}
          </h4>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
            <Briefcase className="h-3 w-3 shrink-0 text-slate-400" />
            <span className="truncate">{node.poste || "Poste non défini"}</span>
          </p>

          {node.departement && (
            <div className="pt-1 flex items-center">
              <span className={`text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full border truncate max-w-full ${deptStyle}`}>
                {node.departement}
              </span>
            </div>
          )}
        </div>

        {/* Pied de carte : Subordonnés & Lien Fiche */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
          {node.children.length > 0 ? (
            <button
              onClick={onToggle}
              className="flex items-center gap-1 text-[10px] font-bold text-[#059669] hover:text-[#047857] bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1 rounded-lg transition-all"
            >
              {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              <span>{node.children.length} rapport{node.children.length > 1 ? "s" : ""}</span>
            </button>
          ) : (
            <span className="text-[10px] font-medium text-slate-400 italic">Opérationnel</span>
          )}

          <Link
            href={`/employes/${node.id}#parcours`}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Voir la fiche complète"
          >
            <TrendingUp size={11} />
            <span>Fiche</span>
          </Link>
        </div>
      </div>

      {/* Popover Réassignation */}
      {showManagerPopover && (
        <ManagerPopover node={node} all={all} onClose={() => setShowManagerPopover(false)} />
      )}

      {/* Modales */}
      {showAddSubModal && (
        <AddSubordinateModal manager={node} all={all} open={showAddSubModal} onClose={() => setShowAddSubModal(false)} />
      )}
      {showEditModal && (
        <EditEmployeeModal employee={node} open={showEditModal} onClose={() => setShowEditModal(false)} />
      )}
      {showDeleteModal && (
        <DeleteEmployeeModal employee={node} open={showDeleteModal} onClose={() => setShowDeleteModal(false)} />
      )}
    </div>
  );
});

// ──────────────────────────────────────────────────────────────
// RECURSIVE TREE NODE
// ──────────────────────────────────────────────────────────────
const TreeNode = React.memo(function TreeNode({ 
  node, 
  all, 
  searchQuery,
  forceCollapseState
}: { 
  node: OrgNode; 
  all: OrgEmployee[];
  searchQuery: string;
  forceCollapseState: boolean | null;
}) {
  const [collapsed, setCollapsed] = useState(false);

  React.useEffect(() => {
    if (forceCollapseState !== null) {
      setCollapsed(forceCollapseState);
    }
  }, [forceCollapseState]);

  const isMatch = useMemo(() => {
    if (!searchQuery) return false;
    const q = searchQuery.toLowerCase();
    return Boolean(
      node.full_name.toLowerCase().includes(q) ||
      (node.poste && node.poste.toLowerCase().includes(q)) ||
      (node.departement && node.departement.toLowerCase().includes(q))
    );
  }, [node, searchQuery]);

  return (
    <li className="org-tree-li">
      <OrgNodeCard
        node={node}
        all={all}
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => !v)}
        highlight={isMatch}
      />
      {!collapsed && node.children.length > 0 && (
        <ul className="org-tree-children">
          {node.children.map(child => (
            <TreeNode 
              key={child.id} 
              node={child} 
              all={child.children ? all : all} 
              searchQuery={searchQuery} 
              forceCollapseState={forceCollapseState}
            />
          ))}
        </ul>
      )}
    </li>
  );
});

// ──────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL ORGANIGRAMME (DESIGN ÉPURÉ & HARMONIEUX)
// ──────────────────────────────────────────────────────────────
export function OrgChart({ employees }: { employees: OrgEmployee[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [globalCollapse, setGlobalCollapse] = useState<boolean | null>(null);

  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => { if (e.departement) set.add(e.departement); });
    return Array.from(set);
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    if (!selectedDept) return employees;
    return employees.filter(e => e.departement === selectedDept || employees.some(child => child.manager_id === e.id && child.departement === selectedDept));
  }, [employees, selectedDept]);

  const roots = useMemo(() => buildTree(filteredEmployees), [filteredEmployees]);

  const structStats = useMemo(() => {
    const managers = new Set(employees.map(e => e.manager_id).filter(Boolean));
    const managersCount = managers.size;
    const total = employees.length;
    const ratioEncadrement = total > 0 ? Math.round((managersCount / total) * 100) : 0;
    
    function calculateDepth(nodes: OrgNode[]): number {
      if (!nodes.length) return 0;
      let max = 0;
      for (const n of nodes) {
        const d = 1 + calculateDepth(n.children);
        if (d > max) max = d;
      }
      return max;
    }
    const maxDepth = calculateDepth(roots);

    return { managersCount, ratioEncadrement, maxDepth };
  }, [employees, roots]);

  if (!employees.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <Users className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Aucun collaborateur actif</h3>
        <p className="text-xs text-slate-500 mt-1">Ajoutez des salariés dans le registre pour générer l'organigramme.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* BANDEAU D'ANALYSE EN CANVAS BLANC ÉPURÉ & HARMONIEUX */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 p-2">
          <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-[#059669] flex items-center justify-center shrink-0 border border-orange-200/50 dark:border-orange-900/50">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Effectif Total</p>
            <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">{employees.length} <span className="text-[10px] text-slate-400 font-normal">salariés</span></p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-200/50 dark:border-teal-900/50">
            <UserCheck size={18} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Encadrants (N+1)</p>
            <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">{structStats.managersCount} <span className="text-[10px] text-slate-400 font-normal">managers</span></p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-900/50">
            <Network size={18} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Ratio Encadrement</p>
            <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">{structStats.ratioEncadrement}% <span className="text-[10px] text-slate-400 font-normal">du personnel</span></p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-200/50 dark:border-teal-900/50">
            <Layers size={18} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Profondeur Max</p>
            <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">{structStats.maxDepth} <span className="text-[10px] text-slate-400 font-normal">niveaux</span></p>
          </div>
        </div>
      </div>

      {/* BARRE D'OUTILS ET FILTRES HARMONISÉS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs print:hidden">
        {/* Recherche interactive */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher nom, poste..."
            className="w-full text-xs font-medium pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#059669]/40 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filtres Départements Épurés */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedDept(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedDept === null
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700"
            }`}
          >
            Tous ({employees.length})
          </button>
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(selectedDept === dept ? null : dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedDept === dept
                  ? "bg-[#059669] text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        {/* Contrôles de Vue, Zoom et Impression */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          {/* Toggle Développer / Réduire */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setGlobalCollapse(false)}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
              title="Développer tout l'arbre"
            >
              <Maximize2 size={13} />
            </button>
            <button
              onClick={() => setGlobalCollapse(true)}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
              title="Réduire tout l'arbre"
            >
              <Minimize2 size={13} />
            </button>
          </div>

          {/* Zooms */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
              title="Zoom arrière"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 px-1.5 min-w-[36px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.1))}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
              title="Zoom avant"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              title="Réinitialiser zoom"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          {/* Impression HD */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition-all cursor-pointer"
            title="Exporter / Imprimer l'organigramme"
          >
            <Printer size={13} />
            <span className="hidden sm:inline">Imprimer</span>
          </button>
        </div>
      </div>

      {/* STYLES CSS CONNECTEURS HIÉRARCHIQUES ÉPURÉS & PROPRES */}
      <style>{`
        .org-tree-container {
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: top center;
        }
        .org-tree-root {
          display: flex;
          flex-direction: row;
          justify-content: center;
          flex-wrap: wrap;
          gap: 3.5rem;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .org-tree-root > .org-tree-li {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 0;
        }
        /* ── Connecteurs hiérarchiques à coins arrondis (elbows) ── */
        .org-tree-children {
          display: flex;
          flex-direction: row;
          justify-content: center;
          list-style: none;
          margin: 0;
          padding: 0;
          padding-top: 2.25rem;
          position: relative;
        }
        /* Drop vertical : carte parent -> bus horizontal */
        .org-tree-children::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 2.25rem;
          background: #94a3b8;
          border-radius: 999px;
        }
        .dark .org-tree-children::before { background: #475569; }

        .org-tree-li {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          padding: 2.25rem 1.25rem 0;
        }
        /* Demi-bus horizontal (gauche = ::before, droite = ::after) + drop vertical */
        .org-tree-children > .org-tree-li::before,
        .org-tree-children > .org-tree-li::after {
          content: '';
          position: absolute;
          top: 0;
          right: 50%;
          width: 50%;
          height: 2.25rem;
          border-top: 2px solid #94a3b8;
        }
        .org-tree-children > .org-tree-li::after {
          right: auto;
          left: 50%;
          border-left: 2px solid #94a3b8;
        }
        .dark .org-tree-children > .org-tree-li::before,
        .dark .org-tree-children > .org-tree-li::after {
          border-color: #475569;
        }
        /* Premier / dernier enfant : coins arrondis, segments superflus retirés */
        .org-tree-children > .org-tree-li:first-child::before,
        .org-tree-children > .org-tree-li:last-child::after { border: 0 none; }
        .org-tree-children > .org-tree-li:first-child::after { border-top-left-radius: 14px; }
        .org-tree-children > .org-tree-li:last-child::before {
          border-right: 2px solid #94a3b8;
          border-top-right-radius: 14px;
        }
        .dark .org-tree-children > .org-tree-li:last-child::before { border-right-color: #475569; }
        /* Enfant unique : pas de bus, juste le drop */
        .org-tree-children > .org-tree-li:only-child::before { display: none; }
        .org-tree-children > .org-tree-li:only-child::after {
          border-top: 0 none;
          border-radius: 0;
        }
      `}</style>

      {/* Surface de rendu de l'Arbre avec Fond Épuré */}
      <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 overflow-auto min-h-[550px] relative bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="org-tree-container" style={{ transform: `scale(${zoomLevel})` }}>
          <ul className="org-tree-root">
            {roots.map(root => (
              <TreeNode 
                key={root.id} 
                node={root} 
                all={employees} 
                searchQuery={searchQuery} 
                forceCollapseState={globalCollapse}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
