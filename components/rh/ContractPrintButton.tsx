"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateContratPDF, exportPDF, type CompanyInfo } from "@/lib/pdf-templates";

interface ContractPrintButtonProps {
  employee: any;
  contract: any;
  company: CompanyInfo | null;
}

export function ContractPrintButton({ employee, contract, company }: ContractPrintButtonProps) {
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      // On combine les infos de l'employé avec celles du contrat spécifique
      const contractData = {
        ...employee,
        ...contract,
        type_contrat: contract.type_contrat,
        salaire_brut: contract.salaire_brut,
        date_embauche: contract.date_debut, // Pour le contrat, c'est la date de début du contrat
      };

      const doc = generateContratPDF({ employee: contractData, company, type_contrat: contract.type_contrat });
      exportPDF(doc, `contrat_${contract.type_contrat}_${employee.full_name?.replace(/\s+/g, '_')}`);
      
      toast.success("Contrat généré avec succès");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Échec de la génération");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={generate} disabled={loading} title="Imprimer le contrat">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Printer className="h-4 w-4" />
      )}
    </Button>
  );
}
