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
import { Loader2 } from "lucide-react";
import { createClientSupabase } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Archiver un document
        </Button>
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
            className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center hover:border-[#f6c68a] hover:bg-slate-50 transition-all group"
          >
            {file ? (
              <div className="flex items-center justify-center gap-2 text-sm">
                <FileText className="h-5 w-5 text-[#ee7f03]" />
                <span className="font-semibold text-slate-800">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div>
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-[#ee7f03]/10 group-hover:text-[#ee7f03] transition-colors">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-slate-800">
                  Cliquez ou glissez un fichier
                </p>
                <p className="mt-1 text-xs text-slate-500">
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
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Nom du document *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Contrat CDI - Kouassi Jean"
              className="bg-slate-50/50 border-slate-100"
            />
          </div>

          {/* Famille */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Famille *</label>
            <Select value={famille} onValueChange={(v) => setFamille(v as Famille)}>
              <SelectTrigger className="bg-slate-50/50 border-slate-100">
                <SelectValue placeholder="Choisir une famille" />
              </SelectTrigger>
              <SelectContent>
                {FAMILLES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="sm:justify-end gap-2 pt-2">
           <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={uploading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploading || !file || !name.trim()}
            className="bg-[#ee7f03] hover:bg-[#ee7f03] text-white min-w-[120px]"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Transfert...
              </>
            ) : "Archiver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

  );
}
