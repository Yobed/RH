"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PageShell, PageHeader } from "@/components/ui/page-shell";

const MODULES = ["employes", "paie", "conges", "recrutement", "formations", "documents", "analytique", "parametres"] as const;
const PERMISSIONS = ["lire", "ecrire", "supprimer", "approuver"] as const;
const ROLES = ["manager", "responsable_rh", "comptable", "superviseur"] as const;

type Module = typeof MODULES[number];
type Permission = typeof PERMISSIONS[number];
type Role = typeof ROLES[number];
type Matrix = Record<Role, Record<Module, Record<Permission, boolean>>>;

function emptyMatrix(): Matrix {
  const m = {} as Matrix;
  for (const role of ROLES) {
    m[role] = {} as Record<Module, Record<Permission, boolean>>;
    for (const mod of MODULES) {
      m[role][mod] = {} as Record<Permission, boolean>;
      for (const perm of PERMISSIONS) {
        m[role][mod][perm] = false;
      }
    }
  }
  return m;
}

export default function PermissionsPage() {
  const [matrix, setMatrix] = useState<Matrix>(emptyMatrix());
  const [activeRole, setActiveRole] = useState<Role>("manager");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/parametres/permissions")
      .then((r) => r.json())
      .then((data: { role: Role; module: Module; permission: Permission }[]) => {
        const m = emptyMatrix();
        for (const row of data) {
          if (m[row.role]?.[row.module]) {
            m[row.role][row.module][row.permission] = true;
          }
        }
        setMatrix(m);
      });
  }, []);

  function toggle(mod: Module, perm: Permission) {
    setMatrix((prev) => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        [mod]: {
          ...prev[activeRole][mod],
          [perm]: !prev[activeRole][mod][perm],
        },
      },
    }));
  }

  async function save() {
    setSaving(true);
    try {
      const permissions: { role: Role; module: Module; permission: Permission; granted: boolean }[] = [];
      for (const mod of MODULES) {
        for (const perm of PERMISSIONS) {
          permissions.push({ role: activeRole, module: mod, permission: perm, granted: matrix[activeRole][mod][perm] });
        }
      }
      const res = await fetch("/api/parametres/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: activeRole, permissions }),
      });
      if (!res.ok) throw new Error("Échec sauvegarde");
      toast.success("Permissions sauvegardées");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  const ROLE_LABELS: Record<Role, string> = {
    manager: "Manager",
    responsable_rh: "Responsable RH",
    comptable: "Comptable",
    superviseur: "Superviseur",
  };

  const PERM_LABELS: Record<Permission, string> = {
    lire: "Lire",
    ecrire: "Écrire",
    supprimer: "Supprimer",
    approuver: "Approuver",
  };

  const MODULE_LABELS: Record<Module, string> = {
    employes: "Collaborateurs",
    paie: "Paie",
    conges: "Congés",
    recrutement: "Recrutement",
    formations: "Formations",
    documents: "Documents",
    analytique: "Analytique",
    parametres: "Paramètres",
  };

  return (
    <PageShell>
      <PageHeader
        title="Permissions RBAC"
        description="Configurez les droits d'accès par rôle et module. Les rôles admin et responsable_rh ont accès total par défaut."
      />

      {/* Sélecteur de rôle */}
      <div className="flex gap-2 flex-wrap">
        {ROLES.map((role) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeRole === role
                ? "bg-indigo-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {ROLE_LABELS[role]}
          </button>
        ))}
      </div>

      {/* Matrice */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Module</th>
              {PERMISSIONS.map((p) => (
                <th key={p} className="px-4 py-3 text-center text-muted-foreground font-medium">
                  {PERM_LABELS[p]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((mod) => (
              <tr key={mod} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{MODULE_LABELS[mod]}</td>
                {PERMISSIONS.map((perm) => (
                  <td key={perm} className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={matrix[activeRole][mod][perm]}
                      onChange={() => toggle(mod, perm)}
                      className="h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {saving ? "Sauvegarde…" : "Sauvegarder les permissions"}
        </button>
      </div>
    </PageShell>
  );
}
