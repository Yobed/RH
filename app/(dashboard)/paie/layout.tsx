import { ProcessStepper, type ProcessStep } from "@/components/rh/ProcessStepper";

// Parcours « Paie du mois » — affiché en haut des pages du flux.
// Le stepper ne se montre que sur ces pages (match exact de la route) ;
// sur les autres pages /paie/* (masse salariale, STC, Sage…) il rend null.
const PAIE_STEPS: ProcessStep[] = [
  { label: "Bulletins", href: "/paie" },
  { label: "Génération en lot", href: "/paie/generer-lot" },
  { label: "Anomalies", href: "/paie/anomalies" },
  { label: "Bordereau", href: "/paie/bordereau" },
  { label: "Déclarations", href: "/declarations" },
];

export default function PaieLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProcessStepper title="Paie du mois" steps={PAIE_STEPS} />
      {children}
    </>
  );
}
