"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateAttestationPDF, exportPDF, type CompanyInfo } from "@/lib/pdf-templates";

interface AttestationButtonProps {
  employee: any;
  company: CompanyInfo | null;
  type: "travail" | "salaire";
  label: string;
}

export function AttestationButton({ employee, company, type, label }: AttestationButtonProps) {
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      // Génération locale immédiate
      const doc = generateAttestationPDF({ employee, company, type });
      exportPDF(doc, `attestation_${type}_${employee.full_name?.replace(/\s+/g, '_')}`);
      
      toast.success(`${label} générée avec succès`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Échec de la génération");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={generate} disabled={loading} className="w-full sm:w-auto h-9">
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      {label}
    </Button>
  );
}
