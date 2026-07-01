"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Check, ChevronDown } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  full_name: string;
  matricule: string | null;
  photo_url?: string | null;
}

interface SearchableEmployeeSelectProps {
  employees: Employee[];
  value?: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchableEmployeeSelect({
  employees,
  value,
  onChange,
  placeholder = "Sélectionner un employé",
  disabled = false,
}: SearchableEmployeeSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus trigger when search opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearch("");
    }
  }, [open]);

  // Selected employee object
  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.id === value);
  }, [employees, value]);

  // Filtered employees based on search query
  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees;
    const query = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return employees.filter((e) => {
      const name = (e.full_name ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const mat = (e.matricule ?? "").toLowerCase();
      return name.includes(query) || mat.includes(query);
    });
  }, [employees, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#ee7f03] focus:border-[#ee7f03] disabled:opacity-50 disabled:pointer-events-none text-left shadow-xs",
            !selectedEmployee && "text-slate-400"
          )}
        >
          {selectedEmployee ? (
            <div className="flex items-center gap-3">
              <Avatar
                src={selectedEmployee.photo_url}
                name={selectedEmployee.full_name}
                size={32}
                className="border border-slate-100 shadow-xs"
              />
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-slate-800 text-[13px]">
                  {selectedEmployee.full_name}
                </span>
                {selectedEmployee.matricule && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Matricule: {selectedEmployee.matricule}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0 bg-white border border-slate-200 shadow-xl rounded-xl z-[9999]">
        {/* Barre de recherche */}
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Rechercher par nom, prénom ou matricule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full bg-transparent py-1 text-sm outline-none placeholder:text-slate-400 text-slate-800 border-none focus:ring-0 focus:outline-none"
          />
        </div>

        {/* Liste des employés */}
        <div className="max-h-[260px] overflow-y-auto p-1.5 space-y-0.5">
          {filteredEmployees.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              Aucun collaborateur trouvé.
            </p>
          ) : (
            filteredEmployees.map((e) => {
              const isSelected = e.id === value;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    onChange(isSelected ? null : e.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors hover:bg-slate-50 focus:bg-slate-50",
                    isSelected && "bg-[#ee7f03]/5 text-[#ee7f03] font-semibold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={e.photo_url}
                      name={e.full_name}
                      size={40} // Photo agrandie dans la liste de sélection !
                      className="border border-slate-100 shadow-xs"
                    />
                    <div className="flex flex-col leading-tight">
                      <span className={cn("text-[13px] text-slate-800", isSelected && "text-[#ee7f03] font-semibold")}>
                        {e.full_name}
                      </span>
                      {e.matricule && (
                        <span className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                          Matricule: {e.matricule}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-[#ee7f03]" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
