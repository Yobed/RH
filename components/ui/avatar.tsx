"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  /** Taille en px (carré). Défaut 36. */
  size?: number;
  rounded?: "lg" | "xl" | "full";
  className?: string;
}

// Avatar employé : affiche la vraie photo (photo_url) avec repli automatique
// sur les initiales si pas de photo ou si l'image est cassée.
export function Avatar({ src, name, size = 36, rounded = "lg", className }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImage = !!src && !errored;
  const radius = rounded === "full" ? "rounded-full" : rounded === "xl" ? "rounded-xl" : "rounded-lg";

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-slate-800 font-semibold leading-none text-white",
        radius,
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) }}
      aria-label={name ?? undefined}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt={name ?? "Photo"}
          loading="lazy"
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
