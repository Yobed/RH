import { ProcessStepper, type ProcessStep } from "@/components/rh/ProcessStepper";

// Dernière étape du parcours « Paie du mois » (la page /declarations est hors /paie).
const PAIE_STEPS: ProcessStep[] = [
  { label: "Bulletins", href: "/paie" },
  { label: "Génération en lot", href: "/paie/generer-lot" },
  { label: "Anomalies", href: "/paie/anomalies" },
  { label: "Bordereau", href: "/paie/bordereau" },
  { label: "Déclarations", href: "/declarations" },
];

export default function DeclarationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProcessStepper title="Paie du mois" steps={PAIE_STEPS} />
      {children}
    </>
  );
}
