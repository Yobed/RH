"use client";

import { useState } from "react";
import { RagChat } from "./RagChat";
import { DocumentDrafter } from "./DocumentDrafter";
import { DocumentTemplateSelector } from "./DocumentTemplateSelector";
import { LegalDocUpload } from "./LegalDocUpload";
import { cn } from "@/lib/utils";

type Tab = "juridique" | "redaction" | "modeles";

const TABS: { value: Tab; label: string; shortLabel: string }[] = [
  { value: "juridique", label: "Q&A Juridique", shortLabel: "Q&A" },
  { value: "redaction", label: "Rédiger avec IA", shortLabel: "IA" },
  { value: "modeles", label: "Modèles de documents", shortLabel: "Modèles" },
];

export function AgentJuridiqueShell() {
  const [tab, setTab] = useState<Tab>("juridique");

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-white dark:bg-[oklch(0.18_0.03_248)] px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Agent IA Juridique</h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-600 mt-0.5">
            Droit du Travail CI (Loi 2015-532) · Powered by Gemini
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-xl bg-slate-100 dark:bg-[oklch(0.22_0.03_248)] p-1 self-start sm:self-auto shrink-0">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "rounded-lg px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all",
                tab === t.value
                  ? "bg-[oklch(0.175_0.04_248)] text-[oklch(0.78_0.13_73)] shadow-sm"
                  : "text-slate-600 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <span className="sm:hidden">{t.shortLabel}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "juridique" && (
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-[oklch(0.16_0.025_248)]">
              <RagChat />
            </div>
            <LegalDocUpload />
          </div>
        )}
        {tab === "redaction" && <DocumentDrafter />}
        {tab === "modeles" && <DocumentTemplateSelector />}
      </div>
    </div>
  );
}
