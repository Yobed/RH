"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LegalDoc {
  id: string;
  titre: string;
  source: string;
  created_at: string;
}

export function LegalDocUpload() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [titre, setTitre] = useState("");
  const [source, setSource] = useState("");
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState<LegalDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch("/api/rag/upload");
      if (res.ok) {
        const data = (await res.json()) as LegalDoc[];
        setDocs(data);
      }
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchDocs();
  }, [open, fetchDocs]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f) {
      setFile(f);
      if (!titre) setTitre(f.name.replace(/\.[^.]+$/, "").replace(/_/g, " "));
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    if (f) {
      setFile(f);
      if (!titre) setTitre(f.name.replace(/\.[^.]+$/, "").replace(/_/g, " "));
    }
  }

  async function handleUpload() {
    if (!file || !titre.trim() || !source.trim()) {
      toast.error("Fichier, titre et source sont obligatoires.");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("titre", titre.trim());
      form.append("source", source.trim());

      const res = await fetch("/api/rag/upload", { method: "POST", body: form });
      const json = (await res.json()) as { message?: string; error?: string; chunks?: number };

      if (!res.ok) {
        toast.error(json.error ?? "Erreur lors de l'upload");
        return;
      }

      toast.success(json.message ?? `${json.chunks} chunk(s) indexé(s)`);
      setFile(null);
      setTitre("");
      setSource("");
      if (fileRef.current) fileRef.current.value = "";
      fetchDocs();
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string, titreDoc: string) {
    if (!confirm(`Supprimer "${titreDoc}" du RAG ?`)) return;
    const res = await fetch("/api/rag/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toast.success("Chunk supprimé");
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } else {
      toast.error("Erreur lors de la suppression");
    }
  }

  // Regrouper les chunks par source
  const bySource = docs.reduce<Record<string, LegalDoc[]>>((acc, doc) => {
    const key = doc.source;
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {});

  return (
    <div className="border-t bg-white">
      {/* Header toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Base documentaire RAG ({docs.length} chunks indexés)
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-5">
          {/* Zone d'upload */}
          <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-6 bg-muted/10">
            <div className="mb-4 text-sm font-semibold">Ajouter un document juridique au RAG</div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer rounded-lg border border-dashed border-muted-foreground/30 p-5 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors mb-4"
            >
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium truncate max-w-[280px]">{file.name}</span>
                  <span className="text-muted-foreground text-xs">
                    ({(file.size / 1024 / 1024).toFixed(1)} Mo)
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Glissez un PDF ou{" "}
                    <span className="text-primary underline">parcourez</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">PDF, Word — max 50 Mo</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Titre *
                </label>
                <Input
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Code du Travail CI — Art. 12-16"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Source (référence légale) *
                </label>
                <Input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Loi n°2015-532 du 20 juillet 2015"
                />
              </div>
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading || !file || !titre.trim() || !source.trim()}
              className="mt-4"
              size="sm"
            >
              {uploading ? "Indexation en cours..." : "Indexer dans le RAG"}
            </Button>
          </div>

          {/* Liste des documents indexés */}
          {loadingDocs ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : Object.keys(bySource).length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Aucun document indexé pour l'instant.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Documents indexés ({Object.keys(bySource).length} sources)
              </div>
              {Object.entries(bySource).map(([src, chunks]) => (
                <div key={src} className="rounded-lg border bg-white overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b">
                    <div>
                      <p className="text-sm font-medium truncate max-w-[400px]">{src}</p>
                      <p className="text-xs text-muted-foreground">{chunks.length} chunk(s)</p>
                    </div>
                  </div>
                  <div className="divide-y">
                    {chunks.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between px-4 py-2 text-sm hover:bg-muted/10"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate text-xs text-muted-foreground max-w-[350px]">
                            {doc.titre}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            {new Date(doc.created_at).toLocaleDateString("fr-CI")}
                          </span>
                          <button
                            onClick={() => handleDelete(doc.id, doc.titre)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Supprimer ce chunk"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
