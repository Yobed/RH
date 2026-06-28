"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileText, Upload, Download, Trash2, Loader2,
  FileSpreadsheet, Image, File, ChevronRight, Sparkles, Eye,
} from "lucide-react";
import { DocumentAnalyzerDialog } from "@/components/rh/ged/DocumentAnalyzerDialog";
import { DocumentVersionsDialog } from "@/components/rh/ged/DocumentVersionsDialog";
import { createClientSupabase } from "@/lib/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const FAMILLES = [
  "Contrat",
  "Avenant",
  "Certificat de travail",
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

const FAMILLES_OBLIGATOIRES: ReadonlyArray<Famille> = [
  "Contrat",
  "CNI / Passeport",
  "CV",
  "Casier judiciaire",
  "Certificat de travail",
];

const FAMILLE_COLORS: Record<Famille, { bg: string; text: string; activeBg: string; activeText: string }> = {
  Contrat:               { bg: "bg-teal-50",   text: "text-teal-600",   activeBg: "bg-teal-600",   activeText: "text-white" },
  Avenant:               { bg: "bg-teal-50", text: "text-teal-600", activeBg: "bg-teal-600", activeText: "text-white" },
  "Certificat de travail":{ bg: "bg-emerald-50",text: "text-emerald-600",activeBg: "bg-emerald-600",activeText: "text-white" },
  Diplômes:              { bg: "bg-slate-50", text: "text-slate-600", activeBg: "bg-slate-600", activeText: "text-white" },
  "CNI / Passeport":     { bg: "bg-pink-50",   text: "text-pink-600",   activeBg: "bg-pink-600",   activeText: "text-white" },
  "Extrait de naissance":{ bg: "bg-rose-50",   text: "text-rose-600",   activeBg: "bg-rose-600",   activeText: "text-white" },
  "Casier judiciaire":   { bg: "bg-slate-100", text: "text-slate-600",  activeBg: "bg-slate-700",  activeText: "text-white" },
  CV:                    { bg: "bg-cyan-50",   text: "text-cyan-600",   activeBg: "bg-cyan-600",   activeText: "text-white" },
  Paie:                  { bg: "bg-green-50",  text: "text-green-600",  activeBg: "bg-green-600",  activeText: "text-white" },
  Médical:               { bg: "bg-red-50",    text: "text-red-600",    activeBg: "bg-red-600",    activeText: "text-white" },
  Congés:                { bg: "bg-amber-50",  text: "text-amber-600",  activeBg: "bg-amber-600",  activeText: "text-white" },
  Disciplinaire:         { bg: "bg-orange-50", text: "text-orange-600", activeBg: "bg-orange-600", activeText: "text-white" },
  "Demande d'explication":{ bg: "bg-yellow-50",text: "text-yellow-600", activeBg: "bg-yellow-500", activeText: "text-white" },
  Formation:             { bg: "bg-teal-50",   text: "text-teal-600",   activeBg: "bg-teal-600",   activeText: "text-white" },
  Autre:                 { bg: "bg-gray-50",   text: "text-gray-600",   activeBg: "bg-gray-600",   activeText: "text-white" },
};

function isImage(fileType: string | null, fileUrl: string): boolean {
  if (fileType && fileType.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?.*)?$/i.test(fileUrl);
}

interface Document {
  id: string;
  name: string;
  famille: string | null;
  file_url: string;
  file_type: string | null;
  file_size_kb: number | null;
  created_at: string | null;
  ai_extracted_data?: Record<string, unknown> | null;
  ai_summary?: string | null;
  ai_analyzed_at?: string | null;
}

interface Employee {
  id: string;
  full_name: string;
  matricule: string;
}

interface Props {
  employee: Employee;
  documents: Document[];
  companyId: string;
}

function fileIcon(fileType: string | null) {
  if (!fileType) return <File className="h-5 w-5 text-slate-400" />;
  if (fileType.includes("pdf")) return <FileText className="h-5 w-5 text-rose-500" />;
  if (fileType.includes("word") || fileType.includes("doc")) return <FileText className="h-5 w-5 text-teal-500" />;
  if (fileType.includes("sheet") || fileType.includes("xls") || fileType.includes("csv"))
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  if (fileType.includes("image") || fileType.includes("png") || fileType.includes("jpg"))
    return <Image className="h-5 w-5 text-slate-500" />;
  return <File className="h-5 w-5 text-slate-400" />;
}

function formatSize(kb: number | null): string {
  if (!kb) return "—";
  if (kb < 1024) return `${kb} Ko`;
  return `${(kb / 1024).toFixed(1)} Mo`;
}

function UploadButton({
  famille,
  employeeId,
  companyId,
}: {
  famille: Famille;
  employeeId: string;
  companyId: string;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    if (f) { setFile(f); if (!name) setName(f.name.replace(/\.[^.]+$/, "")); }
  }

  async function handleUpload() {
    if (!file || !name.trim()) { toast.error("Fichier et nom requis."); return; }
    setUploading(true);
    try {
      const supabase = createClientSupabase();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `documents/${companyId}/${employeeId}/${famille}/${Date.now()}_${safeName}`;
      const { data: up, error: upErr } = await supabase.storage.from("rh-documents").upload(path, file);
      if (upErr) { toast.error(`Upload échoué : ${upErr.message}`); return; }
      const { data: { publicUrl } } = supabase.storage.from("rh-documents").getPublicUrl(up.path);
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), file_url: publicUrl,
          file_type: file.type || null,
          file_size_kb: Math.round(file.size / 1024),
          famille, employee_id: employeeId,
        }),
      });
      if (!res.ok) { const err = await res.json() as { error?: string }; toast.error(err.error ?? "Erreur"); return; }
      toast.success("Document archivé dans le dossier.");
      setOpen(false); setFile(null); setName("");
      router.refresh();
    } finally { setUploading(false); }
  }

  const colors = FAMILLE_COLORS[famille];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2 shrink-0">
          <Upload className="h-3.5 w-3.5" />
          Ajouter un document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full ${colors.activeBg} ${colors.activeText} px-2.5 py-0.5 text-xs font-semibold`}>
              {famille}
            </span>
            — Ajouter un document
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center hover:border-teal-400 hover:bg-slate-50 transition-all group"
          >
            {file ? (
              <div className="flex items-center justify-center gap-2 text-sm">
                {fileIcon(file.type)}
                <span className="font-semibold text-slate-800">{file.name}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ""; }} className="text-slate-400 hover:text-rose-500 transition-colors ml-1">✕</button>
              </div>
            ) : (
              <div>
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-slate-800">Cliquez ou glissez un fichier</p>
                <p className="mt-1 text-xs text-slate-500">PDF, Word, Excel, images — max 10 Mo</p>
              </div>
            )}
            <input ref={fileRef} type="file" className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={(e) => { const f = e.target.files?.[0] ?? null; if (f) { setFile(f); if (!name) setName(f.name.replace(/\.[^.]+$/, "")); } }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Nom du document *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Ex: Contrat CDI 2024`} className="bg-slate-50/50 border-slate-100" />
          </div>
        </div>
        <DialogFooter className="sm:justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={uploading}>Annuler</Button>
          <Button onClick={handleUpload} disabled={uploading || !file || !name.trim()} className="bg-teal-600 hover:bg-teal-700 text-white min-w-[120px]">
            {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Transfert...</> : "Archiver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDocButton({ doc }: { doc: Document }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents?id=${doc.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(`"${doc.name}" supprimé.`);
      router.refresh();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
          <AlertDialogDescription>
            Le document <strong>{doc.name}</strong> sera retiré du dossier.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handleDelete(); }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DossierEmployeView({ employee, documents, companyId }: Props) {
  const [activeFamille, setActiveFamille] = useState<Famille>("Contrat");
  const [analyzerDoc, setAnalyzerDoc] = useState<Document | null>(null);

  const byFamille: Record<string, Document[]> = {};
  documents.forEach((doc) => {
    const f = doc.famille ?? "Autre";
    if (!byFamille[f]) byFamille[f] = [];
    byFamille[f].push(doc);
  });

  const activeDocs = byFamille[activeFamille] ?? [];
  const colors = FAMILLE_COLORS[activeFamille];

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col lg:flex-row min-h-[480px]">

        {/* Sidebar — familles */}
        <aside className="lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50/60">
          <div className="p-3 border-b border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2">Familles</p>
          </div>
          <nav className="p-2 space-y-0.5">
            {FAMILLES.map((f) => {
              const count = byFamille[f]?.length ?? 0;
              const isActive = activeFamille === f;
              const fc = FAMILLE_COLORS[f];
              const isObligatoire = FAMILLES_OBLIGATOIRES.includes(f);
              const isMissing = isObligatoire && count === 0;
              return (
                <button
                  key={f}
                  onClick={() => setActiveFamille(f)}
                  className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[12px] font-medium transition-all ${
                    isActive
                      ? `${fc.activeBg} ${fc.activeText} shadow-sm`
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="truncate">{f}</span>
                    {isObligatoire && (
                      <span
                        className={`text-[10px] font-bold leading-none ${
                          isActive
                            ? "text-white/80"
                            : isMissing
                            ? "text-rose-500"
                            : "text-emerald-500"
                        }`}
                        title={isMissing ? "Document obligatoire manquant" : "Document obligatoire"}
                      >
                        *
                      </span>
                    )}
                  </span>
                  {count > 0 ? (
                    <span className={`inline-flex items-center justify-center h-4.5 min-w-[18px] px-1 rounded-full text-[10px] font-bold shrink-0 ${
                      isActive ? "bg-white/25 text-white" : `${fc.bg} ${fc.text}`
                    }`}>
                      {count}
                    </span>
                  ) : isMissing && !isActive ? (
                    <span className="inline-flex items-center justify-center h-4.5 min-w-[18px] px-1 rounded-full text-[9px] font-bold shrink-0 bg-rose-50 text-rose-600 uppercase tracking-wide">
                      !
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Barre supérieure */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`inline-flex items-center rounded-full ${colors.activeBg} ${colors.activeText} px-3 py-1 text-xs font-semibold shrink-0`}>
                {activeFamille}
              </span>
              <span className="text-xs text-slate-400 shrink-0">
                {activeDocs.length} document{activeDocs.length !== 1 ? "s" : ""}
              </span>
            </div>
            <UploadButton famille={activeFamille} employeeId={employee.id} companyId={companyId} />
          </div>

          {/* Liste des documents */}
          <div className="flex-1 p-4">
            {activeDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center py-16">
                <div className={`h-14 w-14 rounded-2xl ${colors.bg} flex items-center justify-center mb-4`}>
                  <FileText className={`h-7 w-7 ${colors.text}`} />
                </div>
                <p className="text-sm font-semibold text-slate-600">Aucun document</p>
                <p className="mt-1 text-xs text-slate-400 max-w-[200px]">
                  Aucun document de type <span className="font-semibold">{activeFamille}</span> dans ce dossier.
                </p>
                <div className="mt-4">
                  <UploadButton famille={activeFamille} employeeId={employee.id} companyId={companyId} />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {activeDocs.map((doc) => {
                  const image = isImage(doc.file_type, doc.file_url);
                  return (
                    <div
                      key={doc.id}
                      className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 hover:border-slate-200 hover:shadow-sm transition-all"
                    >
                      {/* Vignette image ou icône fichier */}
                      <div className="shrink-0">
                        {image ? (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block h-14 w-14 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 hover:ring-2 hover:ring-teal-300 transition-all"
                            title="Ouvrir en grand"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={doc.file_url}
                              alt={doc.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </a>
                        ) : (
                          <div className="h-14 w-14 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center">
                            {fileIcon(doc.file_type)}
                          </div>
                        )}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatSize(doc.file_size_kb)}
                          </span>
                          <span className="text-[10px] text-slate-300">·</span>
                          <span className="text-[10px] text-slate-400">
                            {doc.created_at
                              ? new Date(doc.created_at).toLocaleDateString("fr-CI", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </span>
                          {doc.file_type && (
                            <>
                              <span className="text-[10px] text-slate-300">·</span>
                              <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                {doc.file_type.split("/")[1]?.slice(0, 4)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Badge IA analysé */}
                      {doc.ai_analyzed_at && (
                        <span
                          title={`Analysé par IA le ${new Date(doc.ai_analyzed_at).toLocaleDateString("fr-CI")}`}
                          className="hidden sm:inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-slate-50 to-teal-50 border border-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shrink-0"
                        >
                          <Sparkles className="h-3 w-3" /> IA
                        </span>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setAnalyzerDoc(doc)}
                          className="inline-flex items-center gap-1 rounded-md bg-gradient-to-br from-slate-600 to-teal-600 hover:from-slate-700 hover:to-teal-700 px-2 py-1 text-[11px] font-semibold text-white shadow-sm transition-colors"
                          title="Ouvrir l'aperçu et l'analyse IA"
                        >
                          <Eye className="h-3 w-3" /> Aperçu
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                            title="Télécharger"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                          <DocumentVersionsDialog
                            documentId={doc.id}
                            documentName={doc.name}
                            documentUrl={doc.file_url}
                            documentCreatedAt={doc.created_at}
                            companyId={companyId}
                            employeeId={employee.id}
                            famille={(doc.famille ?? "Autre")}
                          />
                          <DeleteDocButton doc={doc} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Pied — récap rapide */}
      <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 flex items-center gap-6 flex-wrap">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Récap dossier</p>
        {FAMILLES.filter((f) => (byFamille[f]?.length ?? 0) > 0).map((f) => {
          const fc = FAMILLE_COLORS[f];
          return (
            <button
              key={f}
              onClick={() => setActiveFamille(f)}
              className={`inline-flex items-center gap-1 rounded-full ${fc.bg} ${fc.text} px-2.5 py-0.5 text-[10px] font-semibold hover:opacity-80 transition-opacity`}
            >
              {f}
              <span className="font-bold">{byFamille[f].length}</span>
            </button>
          );
        })}
        {documents.length === 0 && (
          <p className="text-xs text-slate-400">Dossier vide — commencez par ajouter le contrat de travail.</p>
        )}
      </div>

      {analyzerDoc && (
        <DocumentAnalyzerDialog
          doc={{
            id: analyzerDoc.id,
            name: analyzerDoc.name,
            famille: analyzerDoc.famille,
            file_url: analyzerDoc.file_url,
            file_type: analyzerDoc.file_type,
            created_at: analyzerDoc.created_at,
            ai_extracted_data: analyzerDoc.ai_extracted_data as never,
            ai_summary: analyzerDoc.ai_summary ?? null,
            ai_analyzed_at: analyzerDoc.ai_analyzed_at ?? null,
          }}
          onClose={() => setAnalyzerDoc(null)}
        />
      )}
    </div>
  );
}
