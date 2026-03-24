"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, FileText, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClientSupabase } from "@/lib/supabase/client";

const FAMILLES = [
  "Contrat",
  "Avenant",
  "Diplômes",
  "CNI / Passeport",
  "Extrait de naissance",
  "Casier judiciaire",
  "CV",
  "Paie",
  "Médical",
  "Congés",
  "Disciplinaire",
  "Demande d'explication",
  "Formation",
  "Autre",
] as const;

type Famille = (typeof FAMILLES)[number];

interface Props {
  employeeId?: string;
  companyId: string;
}

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function DocumentUploadDialog({ employeeId, companyId }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [famille, setFamille] = useState<Famille>("Autre");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f) {
      setFile(f);
      if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    if (f) {
      setFile(f);
      if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
    }
  }

  async function handleUpload() {
    if (!file || !name.trim()) {
      toast.error("Sélectionnez un fichier et saisissez un nom.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClientSupabase();

      // Chemin de stockage : documents/{company_id}/{employee_id}/{famille}/
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = employeeId
        ? `documents/${companyId}/${employeeId}/${famille}/${Date.now()}_${safeName}`
        : `documents/${companyId}/general/${famille}/${Date.now()}_${safeName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("rh-documents")
        .upload(path, file);

      if (uploadError) {
        toast.error(`Upload échoué : ${uploadError.message}`);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("rh-documents").getPublicUrl(uploadData.path);

      // Enregistrer les métadonnées
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          file_url: publicUrl,
          file_type: file.type || null,
          file_size_kb: Math.round(file.size / 1024),
          famille,
          employee_id: employeeId ?? null,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Erreur lors de l'enregistrement");
        return;
      }

      toast.success("Document archivé");
      setOpen(false);
      setFile(null);
      setName("");
      setFamille("Autre");
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" />}>
        <Upload className="mr-2 h-4 w-4" />
        Archiver un document
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Archiver un document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Zone de dépôt */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center hover:border-primary/40 hover:bg-muted/20 transition-colors"
          >
            {file ? (
              <div className="flex items-center justify-center gap-2 text-sm">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Glissez un fichier ici ou{" "}
                  <span className="text-primary underline">parcourez</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF, Word, Excel, images — max 10 Mo
                </p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={handleFileChange}
            />
          </div>

          {/* Nom du document */}
          <div>
            <label className="text-sm font-medium">Nom du document *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contrat CDI - Kouassi Jean"
              className="mt-1"
            />
          </div>

          {/* Famille */}
          <div>
            <label className="text-sm font-medium">Famille *</label>
            <select
              value={famille}
              onChange={(e) => setFamille(e.target.value as Famille)}
              className={`mt-1 ${selectClass}`}
            >
              {FAMILLES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleUpload}
            disabled={uploading || !file || !name.trim()}
            className="w-full sm:w-auto"
          >
            {uploading ? "Upload en cours..." : "Archiver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
