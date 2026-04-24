"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  FileDown, 
  Loader2, 
  ChevronDown, 
  FileText, 
  Award, 
  Briefcase,
  UserCheck,
  CalendarCheck
} from "lucide-react";
import { toast } from "sonner";
import { 
  generateAttestationPDF, 
  generateCertificatPDF, 
  generateFichePostePDF,
  generateContratPDF,
  exportPDF, 
  type CompanyInfo 
} from "@/lib/pdf-templates";

interface DocumentDropdownProps {
  employee: any;
  company: CompanyInfo | null;
}

export function DocumentDropdown({ employee, company }: DocumentDropdownProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  const generate = async (type: string, label: string) => {
    setLoading(type);
    try {
      let doc;
      let labelType = "";
      let famille = "Autre";

      switch (type) {
        case "attestation_travail":
          doc = generateAttestationPDF({ employee, company, type: "travail" });
          labelType = "Attestation de Travail";
          famille = "Autre";
          break;
        case "attestation_salaire":
          doc = generateAttestationPDF({ employee, company, type: "salaire" });
          labelType = "Attestation de Salaire";
          famille = "Paie";
          break;
        case "certificat":
          doc = generateCertificatPDF({ employee, company });
          labelType = "Certificat de Travail";
          famille = "Contrat";
          break;
        case "fiche_poste":
          doc = generateFichePostePDF({ employee, company });
          labelType = "Fiche de Poste";
          famille = "Autre";
          break;
        case "contrat":
          doc = generateContratPDF({ employee, company, type_contrat: employee.type_contrat });
          labelType = "Contrat de Travail";
          famille = "Contrat";
          break;
        default:
          throw new Error("Type de document inconnu");
      }

      const fileName = `${type}_${employee.full_name?.replace(/\s+/g, '_')}`;
      exportPDF(doc, fileName);
      toast.success(`${label} généré(e) avec succès`);

      // ARCHIVAGE AUTOMATIQUE
      setArchiving(true);
      try {
        const pdfBase64 = doc.output('datauristring');
        
        const response = await fetch("/api/documents/archiver", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employee_id: employee.id,
            company_id: company?.id,
            name: `${labelType} - ${employee.full_name}`,
            famille,
            pdf_base64: pdfBase64
          })
        });

        if (response.ok) {
          toast.success("Document archivé dans le dossier du personnel", {
            description: "Vous pouvez le retrouver dans l'onglet Documents."
          });
        }
      } catch (archError) {
        console.error("Archival failed:", archError);
        toast.error("Échec de l'archivage automatique");
      } finally {
        setArchiving(false);
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Échec de la génération");
    } finally {
      setLoading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" className="gap-2" disabled={!!loading || archiving}>
          {loading || archiving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {archiving ? "Archivage..." : loading ? "Génération..." : "Générer Document"}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Documents Administratifs</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => generate("attestation_travail", "Attestation de Travail")}>
          <FileText className="mr-2 h-4 w-4" />
          Attestation de Travail
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => generate("attestation_salaire", "Attestation de Salaire")}>
          <Briefcase className="mr-2 h-4 w-4" />
          Attestation de Salaire
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => generate("fiche_poste", "Fiche de Poste")}>
          <UserCheck className="mr-2 h-4 w-4" />
          Fiche de Poste
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Contrats & Clôture</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => generate("contrat", "Contrat de Travail")}>
          <FileText className="mr-2 h-4 w-4" />
          Contrat de Travail (Modèle)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => generate("certificat", "Certificat de Travail")}>
          <Award className="mr-2 h-4 w-4" />
          Certificat de Travail
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-emerald-600 font-medium cursor-pointer"
          onClick={() => window.location.href = `/paie/fin-de-contrat?employeeId=${employee.id}`}
        >
          <CalendarCheck className="mr-2 h-4 w-4" />
          Solde de Tout Compte
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
