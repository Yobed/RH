"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, House } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  employes: "Employés",
  conges: "Congés",
  paie: "Bulletins de Paie",
  contrats: "Contrats",
  disciplinaire: "Disciplinaire",
  contentieux: "Contentieux",
  evaluations: "Évaluations",
  formation: "Formation",
  medical: "Médical",
  recrutement: "Recrutement",
  analytique: "Analytique",
  parametres: "Paramètres",
  notifications: "Notifications",
  archives: "Archives",
  "bilan-social": "Bilan Social",
  calculateur: "Calculateur",
  declarations: "Déclarations",
  "documents-rh": "Documents RH",
  duerp: "DUERP",
  "heures-sup": "Heures Sup.",
  messages: "Messages",
  qhse: "QHSE",
  rappels: "Rappels",
  reporting: "Reporting",
  rh: "Tableau de Bord",
  "agent-juridique": "Agent Juridique",
  analyses: "Analyses",
  audit: "Audit Sécurité",
  portail: "Portail Salarié",
  bulletins: "Mes Bulletins",
  profil: "Mon Profil",
  signatures: "Signatures",
  onboarding: "Onboarding",
  print: "Impression",
  attestations: "Mes Attestations",
};

function isUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const router = useRouter();

  if (!pathname || pathname === "/" || pathname === "/rh") return null;

  // Split & filter empty segments
  const segments = pathname.split("/").filter(Boolean);

  // Build crumbs
  const crumbs: { label: string; href: string }[] = [];

  // Determine root
  const isPortail = segments[0] === "portail";
  crumbs.push({
    label: isPortail ? "Portail" : "Tableau de bord",
    href: isPortail ? "/portail" : "/rh",
  });

  let path = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    path += `/${seg}`;

    // Skip root (already added) and layout groups
    if (i === 0 && (seg === "rh" || seg === "portail")) continue;

    // UUID → show "Détail" or skip
    if (isUUID(seg)) {
      crumbs.push({ label: "Détail", href: path });
      continue;
    }

    const label = ROUTE_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
    crumbs.push({ label, href: path });
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Fil d'Ariane"
      className="flex flex-col gap-2 mb-6"
    >
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 overflow-x-auto no-scrollbar py-1">
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <span key={crumb.href} className="inline-flex items-center gap-1.5 shrink-0">
              {idx === 0 && (
                <House className="h-3 w-3 shrink-0" />
              )}
              {idx > 0 && (
                <ChevronRight className="h-2.5 w-2.5 shrink-0 opacity-40" />
              )}
              {isLast ? (
                <span className="font-bold text-slate-900 dark:text-slate-200">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </div>
      
      {/* Mobile Back Button (UX Quick Win) */}
      <button 
        onClick={() => router.back()}
        className="lg:hidden flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 py-1"
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
        Retour
      </button>
    </nav>
  );
}
