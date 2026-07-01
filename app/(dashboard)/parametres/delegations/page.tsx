"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash } from "@phosphor-icons/react";
import { PageShell, PageHeader } from "@/components/ui/page-shell";

interface Delegation {
  id: string;
  delegant_id: string;
  delegataire_id: string;
  date_debut: string;
  date_fin: string;
  modules: string[];
  actif: boolean;
  delegant?: { full_name: string };
  delegataire?: { full_name: string };
}

interface Profile {
  id: string;
  full_name: string;
}

export default function DelegationsPage() {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    delegataire_id: "",
    date_debut: "",
    date_fin: "",
    modules: ["conges", "evaluations"],
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/parametres/delegations").then((r) => r.json()),
      fetch("/api/employees/profiles").then((r) => r.json()).catch(() => []),
    ]).then(([dels, profs]) => {
      setDelegations(dels ?? []);
      setProfiles(profs ?? []);
      setLoading(false);
    });
  }, []);

  async function create() {
    if (!form.delegataire_id || !form.date_debut || !form.date_fin) {
      toast.error("Remplissez tous les champs");
      return;
    }
    const res = await fetch("/api/parametres/delegations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json() as { delegation?: Delegation; error?: string };
    if (data.delegation) {
      setDelegations((prev) => [...prev, data.delegation!]);
      toast.success("Délégation créée");
      setForm({ delegataire_id: "", date_debut: "", date_fin: "", modules: ["conges", "evaluations"] });
    } else {
      toast.error(data.error ?? "Erreur");
    }
  }

  async function remove(id: string) {
    await fetch(`/api/parametres/delegations?id=${id}`, { method: "DELETE" });
    setDelegations((prev) => prev.filter((d) => d.id !== id));
    toast.success("Délégation supprimée");
  }

  if (loading) return <div className="px-8 py-6 text-muted-foreground text-sm">Chargement…</div>;

  return (
    <PageShell width="narrow">
      <PageHeader
        title="Délégations temporaires"
        description="Déléguez temporairement vos droits de validation à un remplaçant pendant votre absence."
      />

      {/* Formulaire création */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Nouvelle délégation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Délégué à</label>
            <select
              value={form.delegataire_id}
              onChange={(e) => setForm((f) => ({ ...f, delegataire_id: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">— Sélectionner —</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Modules délégués</label>
            <div className="flex gap-2 flex-wrap pt-1">
              {["conges", "evaluations", "recrutement"].map((mod) => (
                <label key={mod} className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.modules.includes(mod)}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        modules: e.target.checked
                          ? [...f.modules, mod]
                          : f.modules.filter((m) => m !== mod),
                      }))
                    }
                    className="accent-[#ee7f03]"
                  />
                  {mod}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date début</label>
            <input
              type="date"
              value={form.date_debut}
              onChange={(e) => setForm((f) => ({ ...f, date_debut: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date fin</label>
            <input
              type="date"
              value={form.date_fin}
              onChange={(e) => setForm((f) => ({ ...f, date_fin: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          onClick={create}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#ee7f03] text-white rounded-lg text-sm font-medium hover:bg-[#ee7f03] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Créer la délégation
        </button>
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {delegations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune délégation active.</p>
        ) : (
          delegations.map((d) => (
            <div key={d.id} className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Délégué à : <span className="text-[#f6c68a]">{d.delegataire?.full_name ?? "—"}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Du {d.date_debut} au {d.date_fin} · Modules : {d.modules.join(", ")}
                </p>
              </div>
              <button
                onClick={() => remove(d.id)}
                className="text-rose-400 hover:text-rose-600 p-1 transition-colors"
                title="Supprimer"
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </PageShell>
  );
}
