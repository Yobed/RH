"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const MONTHS = [
  { value: "01", label: "Janvier" },
  { value: "02", label: "Février" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Août" },
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

const YEARS = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i));

export function PaieFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();



  function updateSearch(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  }

  const currentMois = searchParams.get("mois") ?? "all";
  const currentAnnee = searchParams.get("annee") ?? "all";

  return (
    <div className="flex flex-wrap items-end gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
      <div className="space-y-1.5 min-w-[140px]">
        <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold ml-1">Mois</Label>
        <Select 
          value={currentMois} 
          onValueChange={(v) => updateSearch("mois", v)}
          disabled={isPending}
        >
          <SelectTrigger className="bg-white border-slate-200 focus:ring-slate-400">
            <SelectValue placeholder="Tous les mois" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les mois</SelectItem>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 min-w-[120px]">
        <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold ml-1">Année</Label>
        <Select 
          value={currentAnnee} 
          onValueChange={(v) => updateSearch("annee", v)}
          disabled={isPending}
        >
          <SelectTrigger className="bg-white border-slate-200 focus:ring-slate-400">
            <SelectValue placeholder="Toutes les années" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les années</SelectItem>
            {YEARS.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(currentMois !== "all" || currentAnnee !== "all") && (
        <button 
          onClick={() => {
            startTransition(() => {
              router.push("/paie");
            });
          }}
          className="pb-2 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium border-b border-transparent hover:border-slate-300"
        >
          Réinitialiser
        </button>
      )}
      
      {isPending && (
        <div className="pb-2">
          <span className="flex h-2 w-2 rounded-full bg-slate-400 animate-ping" />
        </div>
      )}
    </div>
  );
}
