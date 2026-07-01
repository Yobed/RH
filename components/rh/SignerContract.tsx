"use client";

import { useRef, useState, useEffect } from "react";
import { Eraser, CheckCircle2, Loader2 } from "lucide-react";

// Capture de signature manuscrite (canvas natif) + envoi. Aucune dépendance externe :
// la signature EST l'acte électronique, stockée comme preuve côté serveur.
export function SignerContract({ candidateId }: { candidateId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Résolution nette : dimensionne le buffer selon le devicePixelRatio.
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e293b";
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasDrawn) setHasDrawn(true);
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  async function submit() {
    if (!canvasRef.current || !hasDrawn) return;
    setError(null);
    setSubmitting(true);
    try {
      const signature = canvasRef.current.toDataURL("image/png");
      const res = await fetch("/api/recrutement/signer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateId, signature }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Signature impossible");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signature impossible");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-[#69b5a2]/40 bg-[#69b5a2]/10 px-6 py-10 text-center">
        <CheckCircle2 className="h-12 w-12 text-[#69b5a2]" />
        <h3 className="font-display text-lg font-semibold text-slate-900">Contrat signé</h3>
        <p className="max-w-sm text-[13px] text-slate-600">
          Votre signature a été enregistrée. Bienvenue ! L'équipe RH finalisera votre intégration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-[13px] font-medium text-slate-700">Signez dans le cadre ci-dessous</label>
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-500 hover:text-slate-800"
          >
            <Eraser className="h-3.5 w-3.5" /> Effacer
          </button>
        </div>
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="h-44 w-full touch-none rounded-lg border-2 border-dashed border-slate-300 bg-white"
        />
      </div>

      <label className="flex items-start gap-2.5 text-[13px] text-slate-700">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#ee7f03]"
        />
        <span>Je reconnais avoir lu le contrat ci-dessus et l'accepte. Ma signature manuscrite vaut engagement.</span>
      </label>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-[13px] font-medium text-rose-700">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!hasDrawn || !accepted || submitting}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#ee7f03] text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#d67002] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…
          </>
        ) : (
          "Signer le contrat"
        )}
      </button>
    </div>
  );
}
