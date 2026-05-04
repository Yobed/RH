"use client";

import { useState, useTransition } from "react";
import { Users, ChevronDown, ChevronRight, UserPlus, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type OrgEmployee = {
  id: string;
  full_name: string;
  poste: string | null;
  departement: string | null;
  manager_id: string | null;
  statut: string;
};

type OrgNode = OrgEmployee & { children: OrgNode[] };

const AVATAR_COLORS = [
  "bg-rose-500", "bg-violet-500", "bg-blue-500", "bg-emerald-500",
  "bg-amber-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
];

function avatarColor(id: string) {
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
      !search || e.full_name.toLowerCase().includes(search.toLowerCase())
    );

  const assign = (managerId: string | null) => {
    startTransition(async () => {
      const res = await fetch("/api/employees/manager", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: node.id, manager_id: managerId }),
      });
      if (res.ok) {
        toast.success("Supérieur mis à jour");
        onClose();
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({})) as { error?: string };
        toast.error(err.error ?? "Erreur");
      }
    });
  };

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-700">Supérieur hiérarchique</p>
        <button onClick={onClose} className="p-0.5 hover:bg-slate-100 rounded">
          <X size={12} className="text-slate-400" />
        </button>
      </div>
      <input
        autoFocus
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher..."
        className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 mb-2 focus:outline-none focus:ring-1 focus:ring-blue-300"
      />
      <div className="space-y-0.5 max-h-44 overflow-y-auto">
        <button
          onClick={() => assign(null)}
          disabled={isPending}
          className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-slate-100 text-slate-400 italic"
        >
          Aucun (racine)
        </button>
        {filtered.map(e => (
          <button
            key={e.id}
            onClick={() => assign(e.id)}
            disabled={isPending}
            className={`w-full text-left text-xs px-2 py-1.5 rounded hover:bg-blue-50 flex items-center justify-between ${node.manager_id === e.id ? "bg-blue-50 text-blue-700" : "text-slate-700"}`}
          >
            <span>
              {e.full_name}
              {e.poste && <span className="text-slate-400 ml-1">· {e.poste}</span>}
            </span>
            {node.manager_id === e.id && <Check size={10} className="text-blue-600" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function OrgNodeCard({
  node,
  all,
  collapsed,
  onToggle,
}: {
  node: OrgNode;
  all: OrgEmployee[];
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="relative inline-block group">
      <div className="w-44 bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left select-none">
        <div className="flex items-start justify-between mb-2">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColor(node.id)}`}>
            {initials(node.full_name)}
          </div>
          <button
            onClick={() => setEditing(v => !v)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 text-slate-400 transition-opacity"
            title="Modifier le supérieur"
          >
            <UserPlus size={12} />
          </button>
        </div>

        <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">{node.full_name}</p>
        {node.poste && (
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{node.poste}</p>
        )}
        {node.departement && (
          <span className="mt-1.5 inline-block text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full truncate max-w-full">
            {node.departement}
          </span>
        )}

        {node.children.length > 0 && (
          <button
            onClick={onToggle}
            className="mt-2 flex items-center gap-0.5 text-[10px] text-blue-600 hover:text-blue-800"
          >
            {collapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
            {node.children.length} rapport{node.children.length > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {editing && (
        <ManagerPopover node={node} all={all} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}

function TreeNode({ node, all }: { node: OrgNode; all: OrgEmployee[] }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <li className="org-tree-li">
      <OrgNodeCard
        node={node}
        all={all}
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => !v)}
      />
      {!collapsed && node.children.length > 0 && (
        <ul className="org-tree-children">
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} all={all} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function OrgChart({ employees }: { employees: OrgEmployee[] }) {
  const roots = buildTree(employees);
  const all = employees;

  if (!employees.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Users className="w-14 h-14 mb-3 opacity-30" />
        <p className="text-sm">Aucun collaborateur actif</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .org-tree-root {
          display: flex;
          flex-direction: row;
          justify-content: center;
          flex-wrap: wrap;
          gap: 3rem;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .org-tree-root > .org-tree-li {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .org-tree-children {
          display: flex;
          flex-direction: row;
          justify-content: center;
          list-style: none;
          padding: 0;
          margin: 0;
          position: relative;
          padding-top: 2rem;
        }
        /* Vertical line: parent → horizontal bar */
        .org-tree-children::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 1px;
          height: 2rem;
          background: #cbd5e1;
        }
        .org-tree-li {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          padding: 0 1rem;
        }
        /* Horizontal connector bar */
        .org-tree-children > .org-tree-li::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: #cbd5e1;
        }
        .org-tree-children > .org-tree-li:first-child::before { left: 50%; }
        .org-tree-children > .org-tree-li:last-child::before  { right: 50%; }
        .org-tree-children > .org-tree-li:only-child::before  { display: none; }
        /* Vertical line: horizontal bar → child card */
        .org-tree-children > .org-tree-li::after {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 1px;
          height: 2rem;
          background: #cbd5e1;
        }
      `}</style>

      <div className="overflow-auto pb-6 pt-4">
        <ul className="org-tree-root">
          {roots.map(root => (
            <TreeNode key={root.id} node={root} all={all} />
          ))}
        </ul>
      </div>
    </>
  );
}
