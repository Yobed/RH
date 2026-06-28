"use client";

import { useState, useEffect } from "react";
import { Clock, DownloadSimple, Eye } from "@phosphor-icons/react";

interface Version {
  id: string;
  version: number;
  file_url: string;
  file_name: string;
  file_size: number;
  uploaded_by: string;
  commentaire: string | null;
  created_at: string;
  uploader?: { full_name: string };
}

interface Props {
  documentId: string;
  currentVersion?: number;
}

export function DocumentVersionHistory({ documentId, currentVersion }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/documents/versions?documentId=${documentId}`)
      .then((r) => r.json())
      .then((d: Version[]) => { setVersions(d ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [documentId]);

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Aucune version antérieure disponible.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {versions.map((v) => {
        const isCurrent = v.version === currentVersion;
        return (
          <div
            key={v.id}
            className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors ${
              isCurrent ? "border-teal-500/40 bg-teal-500/5" : "border-border bg-card"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isCurrent ? "bg-teal-600 text-white" : "bg-muted text-muted-foreground"
              }`}>
                v{v.version}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {v.file_name}
                  {isCurrent && <span className="ml-2 text-[10px] bg-teal-500/20 text-teal-400 px-1.5 py-0.5 rounded-full">actuelle</span>}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {new Date(v.created_at).toLocaleDateString("fr-CI")}
                  {v.uploader?.full_name && <span>· {v.uploader.full_name}</span>}
                  <span>· {formatSize(v.file_size)}</span>
                </p>
                {v.commentaire && (
                  <p className="text-xs text-muted-foreground mt-0.5 italic">{v.commentaire}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <a
                href={v.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded"
                title="Prévisualiser"
              >
                <Eye className="h-4 w-4" />
              </a>
              <a
                href={v.file_url}
                download={v.file_name}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded"
                title="Télécharger"
              >
                <DownloadSimple className="h-4 w-4" />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
