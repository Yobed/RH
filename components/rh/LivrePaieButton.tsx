"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePayrollReportPDF, exportPDF } from "@/lib/pdf-templates";

interface LivrePaieButtonProps {
  bulletins: any[];
  company: any;
  periode: string;
}

export function LivrePaieButton({ bulletins, company, periode }: LivrePaieButtonProps) {
  const handleExport = () => {
    if (!bulletins || bulletins.length === 0) return;
    
    const doc = generatePayrollReportPDF({
        bulletins,
        company,
        period: periode
    });
    
    exportPDF(doc, `Livre_Paie_${periode.replace('-', '_')}`);
  };

  return (
    <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExport}
        className="gap-2 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        disabled={!bulletins || bulletins.length === 0}
    >
      <FileText className="h-4 w-4" />
      Livre de Paie (PDF)
    </Button>
  );
}
