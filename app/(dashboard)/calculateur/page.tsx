import { CalculateurRH } from "@/components/rh/CalculateurRH";
import { Calculator } from "lucide-react";

export const metadata = { title: "Calculateur RH — RH Manager CI" };

export default function CalculateurPage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Calculator className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">Calculateur RH</h1>
          <p className="text-sm text-muted-foreground">
            Calculs légaux — Code du Travail ivoirien (Loi 2015-532)
          </p>
        </div>
      </div>
      <CalculateurRH />
    </div>
  );
}
