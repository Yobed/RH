"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PaieExportButtonProps {
  /** Période au format YYYY-MM */
  periode: string;
}

/**
 * Bouton de téléchargement du journal de paie en CSV.
 * Déclenche un téléchargement direct du fichier Journal_Paie_YYYY_MM.csv.
 */
export function PaieExportButton({ periode }: PaieExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/paie/export?periode=${encodeURIComponent(periode)}`);

      if (res.status === 404) {
        toast.warning(`Aucun bulletin trouvé pour la période ${periode}`);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        toast.error(body.error ?? "Erreur lors de l'export");
        return;
      }

      // Déclencher le téléchargement via un Blob
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const filename = `Journal_Paie_${periode.replace("-", "_")}.csv`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Export téléchargé : ${filename}`);
    } catch {
      toast.error("Erreur réseau lors de l'export");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {loading ? "Export en cours…" : "Exporter CSV (Journal de Paie)"}
    </Button>
  );
}
