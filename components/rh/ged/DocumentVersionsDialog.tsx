"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { History, Upload, Loader2, Download, Clock } from "lucide-react";
import { createClientSupabase } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DocVersion {
  id: string;
  version: number;
  file_url: string;
  file_name: string;
  file_size: number;
  commentaire: string | null;
  created_at: string;
  uploader?: { full_name: string } | null;
}

interface Props {
  documentId: string;
  documentName: string;
  documentUrl: string;
  documentCreatedAt: string | null;
  companyId: string;
  employeeId: string;
  famille: string;
}

function formatSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function DocumentVersionsDialog({
  documentId,
  documentName,
  documentUrl,
  documentCreatedAt,
  companyId,
  employeeId,
  famille,
}: Props) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<DocVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    fetch(`/api/documents/versions?documentId=${documentId}`)
      .then((r) => r.json())
      .then((data) => {
        if (mounted) setVersions(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (mounted) setVersions([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [open, documentId]);

  async function handleUploadVersion() {
    if (!file) {
      toast.error("Sélectionnez un fichier.");
      return;
    }
    setUploading(true);
    try {
      const supabase = createClientSupabase();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `documents/${companyId}/${employeeId}/${famille}/versions/${Date.now()}_${safeName}`;
      const { data: up, error: upErr } = await supabase.storage
        .from("rh-documents")
        .upload(path, file);
      if (upErr) {
        toast.error(`Upload échoué : ${upErr.message}`);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("rh-documents").getPublicUrl(up.path);

      const res = await fetch("/api/documents/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: documentId,
          employee_id: employeeId,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          commentaire: comment.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Erreur lors de l'ajout de version");
        return;
      }
      const { version } = (await res.json()) as { version: DocVersion };
      setVersions((prev) => [version, ...prev]);
      setFile(null);
      setComment("");
      if (fileRef.current) fileRef.current.value = "";
      toast.success(`Version ${version.version} ajoutée.`);
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  const currentVersion = versions.length > 0 ? Math.max(...versions.map((v) => v.version)) + 1 : 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
          title="Historique des versions"
        >
          <History className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-teal-600" />
            Historique des versions
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-1">{documentName}</p>
        </DialogHeader>

        {/* Zone d'upload nouvelle version */}
        <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
              Ajouter la version {currentVersion}
            </p>
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer rounded-xl border-2 border-dashed border-teal-200 bg-white p-4 text-center hover:border-teal-400 transition-colors"
          >
            {file ? (
              <p className="text-sm font-semibold text-slate-700">{file.name}</p>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <Upload className="h-4 w-4" />
                Cliquez pour choisir le nouveau fichier
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Commentaire (ex: corrigé, signé, mis à jour conformité)"
            className="bg-white border-teal-100 text-sm"
          />

          <Button
            onClick={handleUploadVersion}
            disabled={uploading || !file}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white h-9 text-sm font-semibold"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ajout en cours...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-3.5 w-3.5" />
                Enregistrer la version
              </>
            )}
          </Button>
        </div>

        {/* Historique */}
        <div className="space-y-2 mt-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
            Versions enregistrées
          </p>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">
              <Loader2 className="mx-auto h-5 w-5 animate-spin mb-2" />
              Chargement...
            </div>
          ) : (
            <div className="space-y-2">
              {/* Version actuelle (le document principal) */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  ACT
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">Version actuelle</span>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      En vigueur
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {documentCreatedAt
                      ? new Date(documentCreatedAt).toLocaleDateString("fr-CI", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-white transition-colors"
                  title="Télécharger"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>

              {/* Versions antérieures */}
              {versions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-6 text-center">
                  <p className="text-xs text-slate-500">Aucune version antérieure archivée.</p>
                </div>
              ) : (
                versions.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-xl border border-slate-100 bg-white p-3 flex items-center gap-3 hover:border-slate-200 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                      V{v.version}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{v.file_name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                        <span className="font-mono">{formatSize(v.file_size)}</span>
                        <span className="text-slate-300">·</span>
                        <Clock className="h-3 w-3" />
                        {new Date(v.created_at).toLocaleDateString("fr-CI", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {v.uploader?.full_name && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span>par {v.uploader.full_name}</span>
                          </>
                        )}
                      </div>
                      {v.commentaire && (
                        <p className="text-[11px] text-slate-600 mt-1 italic">"{v.commentaire}"</p>
                      )}
                    </div>
                    <a
                      href={v.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors shrink-0"
                      title="Télécharger cette version"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
