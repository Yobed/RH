"use client";

import { useState } from "react";
import { RagChat } from "./RagChat";
import { DocumentDrafter } from "./DocumentDrafter";
import { LegalDocUpload } from "./LegalDocUpload";
import { cn } from "@/lib/utils";

type Tab = "juridique" | "redaction";

export function AgentJuridiqueShell() {
  const [tab, setTab] = useState<Tab>("juridique");

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agent IA</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Droit du Travail ivoirien (Loi 2015-532) · Rédaction de documents RH
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 shrink-0">
          {([
            { value: "juridique", label: "Q&A Juridique" },
            { value: "redaction", label: "Rédiger un document" },
          ] as { value: Tab; label: string }[]).map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
                tab === t.value
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "juridique" ? (
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-hidden bg-slate-50">
              <RagChat />
            </div>
            <LegalDocUpload />
          </div>
        ) : (
          <DocumentDrafter />
        )}
      </div>
    </div>
  );
}
