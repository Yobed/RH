"use client";

import { useEffect, useState } from "react";
import { Plus, Trash, PencilSimple, FloppyDisk, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PrimeContrat = {
  id: string;
  libelle: string;
  montant: number;
  imposable: boolean;
  actif: boolean;
  date_debut: string | null;
  date_fin: string | null;
  notes: string | null;
};

type Draft = {
  libelle: string;
  montant: string;
  imposable: boolean;
  actif: boolean;
  date_debut: string;
  date_fin: string;
};

const EMPTY_DRAFT: Draft = {
  libelle: "",
  montant: "",
  imposable: true,
  actif: true,
  date_debut: "",
  date_fin: "",
};

const fmtXOF = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);

interface Props {
  employeeId: string;
}

export function ContractPrimesManager({ employeeId }: Props) {
  const [primes, setPrimes] = useState<PrimeContrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}/primes`, { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Chargement impossible");
      setPrimes(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [employeeId]);

  function resetDraft() {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.libelle.trim()) {
      setError("Libellé requis");
      return;
    }
    const montant = Number(draft.montant);
    if (!Number.isFinite(montant) || montant < 0) {
      setError("Montant invalide");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        libelle: draft.libelle.trim(),
        montant,
        imposable: draft.imposable,
        actif: draft.actif,
        date_debut: draft.date_debut || null,
        date_fin: draft.date_fin || null,
      };

      const url = editingId
        ? `/api/employees/${employeeId}/primes/${editingId}`
        : `/api/employees/${employeeId}/primes`;
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Échec de l'enregistrement");
      resetDraft();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'enregistrement");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(primeId: string) {
    if (!confirm("Supprimer cette prime ?")) return;
    try {
      const res = await fetch(`/api/employees/${employeeId}/primes/${primeId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Suppression impossible");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de suppression");
    }
  }

  function startEdit(p: PrimeContrat) {
    setEditingId(p.id);
    setDraft({
      libelle: p.libelle,
      montant: String(p.montant),
      imposable: p.imposable,
      actif: p.actif,
      date_debut: p.date_debut ?? "",
      date_fin: p.date_fin ?? "",
    });
  }

  const totalImposable = primes
    .filter((p) => p.actif && p.imposable)
    .reduce((s, p) => s + Number(p.montant || 0), 0);
  const totalNonImposable = primes
    .filter((p) => p.actif && !p.imposable)
    .reduce((s, p) => s + Number(p.montant || 0), 0);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-600">
          Primes paramétrables du contrat
        </h3>
        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
          Imposables : <strong>{fmtXOF(totalImposable)}</strong> · Non imposables :{" "}
          <strong>{fmtXOF(totalNonImposable)}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 p-4 sm:grid-cols-12 border-b border-slate-100 bg-slate-50/40">
        <div className="sm:col-span-4">
          <label className="text-[10px] uppercase tracking-widest text-slate-500">Libellé</label>
          <Input
            value={draft.libelle}
            onChange={(e) => setDraft({ ...draft, libelle: e.target.value })}
            placeholder="Prime de rendement, Indemnité de logement…"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] uppercase tracking-widest text-slate-500">Montant (FCFA)</label>
          <Input
            type="number"
            min={0}
            step={100}
            value={draft.montant}
            onChange={(e) => setDraft({ ...draft, montant: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] uppercase tracking-widest text-slate-500">Nature</label>
          <select
            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
            value={draft.imposable ? "imposable" : "non_imposable"}
            onChange={(e) => setDraft({ ...draft, imposable: e.target.value === "imposable" })}
          >
            <option value="imposable">Imposable (entre dans le brut)</option>
            <option value="non_imposable">Non imposable (impacte le net)</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] uppercase tracking-widest text-slate-500">Début</label>
          <Input
            type="date"
            value={draft.date_debut}
            onChange={(e) => setDraft({ ...draft, date_debut: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] uppercase tracking-widest text-slate-500">Fin</label>
          <Input
            type="date"
            value={draft.date_fin}
            onChange={(e) => setDraft({ ...draft, date_fin: e.target.value })}
          />
        </div>
        <div className="sm:col-span-12 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={draft.actif}
              onChange={(e) => setDraft({ ...draft, actif: e.target.checked })}
            />
            Actif
          </label>
          <div className="flex items-center gap-2">
            {editingId && (
              <Button type="button" variant="outline" size="sm" onClick={resetDraft}>
                <X className="h-3.5 w-3.5" /> Annuler
              </Button>
            )}
            <Button type="submit" size="sm" disabled={submitting}>
              {editingId ? <FloppyDisk className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {editingId ? "Mettre à jour" : "Ajouter"}
            </Button>
          </div>
        </div>
      </form>

      {error && (
        <div className="px-5 py-2 bg-red-50 text-red-700 text-xs border-b border-red-100">{error}</div>
      )}

      {loading ? (
        <div className="px-5 py-8 text-center text-sm text-slate-500">Chargement…</div>
      ) : primes.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-500">
          Aucune prime paramétrée. Ajoutez une prime ci-dessus pour qu'elle soit intégrée à chaque bulletin.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-slate-50/60 border-b border-slate-100">
            <tr>
              <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600">Libellé</th>
              <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600">Montant</th>
              <th className="px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-600">Nature</th>
              <th className="px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-600">Période</th>
              <th className="px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-600">Statut</th>
              <th className="px-4 py-2 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {primes.map((p) => (
              <tr key={p.id} className={p.actif ? "" : "opacity-50"}>
                <td className="px-4 py-2 font-medium text-slate-800">{p.libelle}</td>
                <td className="px-4 py-2 text-right font-mono tabular-nums">{fmtXOF(Number(p.montant) || 0)}</td>
                <td className="px-4 py-2 text-center">
                  {p.imposable ? (
                    <span className="rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold px-2 py-0.5">
                      Imposable
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5">
                      Non imposable
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-center text-[11px] text-slate-500 font-mono tabular-nums">
                  {p.date_debut ?? "—"} → {p.date_fin ?? "∞"}
                </td>
                <td className="px-4 py-2 text-center text-[11px]">
                  {p.actif ? (
                    <span className="text-emerald-700">Actif</span>
                  ) : (
                    <span className="text-slate-400">Inactif</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="inline-flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(p)}>
                      <PencilSimple className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}>
                      <Trash className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
