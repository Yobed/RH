"use client";

import { useRef, useState } from "react";
import { Camera, X, Spinner } from "@phosphor-icons/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClientSupabase } from "@/lib/supabase/client";

interface Props {
  value?: string | null;
  fullName?: string;
  onChange: (url: string | null) => void;
}

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BUCKET = "rh-documents";

function getInitials(name?: string): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "??";
}

export function EmployeePhotoUpload({ value, fullName, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Format invalide. JPG, PNG ou WebP uniquement.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("Photo trop lourde (max 2 Mo).");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClientSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Session expirée — reconnectez-vous.");
        return;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `photos/${user.id}/${Date.now()}_avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        toast.error(`Upload échoué : ${uploadError.message}`);
        return;
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(urlData.publicUrl);
      toast.success("Photo enregistrée");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(`Upload échoué : ${message}`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100">
        {value ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={value}
            alt={fullName ?? "Photo employé"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-500">
            {getInitials(fullName)}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Spinner className="h-6 w-6 animate-spin text-white" weight="bold" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Camera className="mr-1.5 h-3.5 w-3.5" weight="bold" />
            {value ? "Changer" : "Ajouter une photo"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              disabled={uploading}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-3.5 w-3.5" weight="bold" />
            </Button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">JPG / PNG / WebP — max 2 Mo</p>
      </div>
    </div>
  );
}
