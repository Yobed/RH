"use client";

import { 
  UserPlus, 
  FilePlus, 
  CalendarPlus, 
  Calculator, 
  ClipboardCheck,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const actions = [
  {
    title: "Nouvel Employé",
    description: "Recrutement et onboarding",
    icon: UserPlus,
    href: "/employes",
    color: "bg-blue-500",
  },
  {
    title: "Générer Contrat",
    description: "Modèles légaux CI",
    icon: FilePlus,
    href: "/contrats",
    color: "bg-emerald-500",
  },
  {
    title: "Calculer STC",
    description: "Solde de tout compte",
    icon: Calculator,
    href: "/calculateur",
    color: "bg-orange-500",
  },
  {
    title: "Demande Congés",
    description: "Gestion des absences",
    icon: CalendarPlus,
    href: "/conges",
    color: "bg-purple-500",
  },
  {
    title: "Évaluation",
    description: "Performance annuelle",
    icon: ClipboardCheck,
    href: "/evaluations",
    color: "bg-pink-500",
  },
  {
    title: "Sanction",
    description: "Procédure disciplinaire",
    icon: ShieldAlert,
    href: "/disciplinaire",
    color: "bg-red-500",
  }
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {actions.map((action) => (
        <Link key={action.title} href={action.href} className="group">
          <div className="h-full border bg-white rounded-2xl p-4 flex flex-col items-center text-center transition-all hover:shadow-md hover:border-slate-300 active:scale-95">
            <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center text-white mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
              <action.icon className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1">{action.title}</h3>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{action.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
