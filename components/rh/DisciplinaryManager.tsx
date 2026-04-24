"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { generateDemandeExplicationPDF, generateSanctionPDF, generateConvocationPDF, exportPDF } from "@/lib/pdf-templates";
import { FileText, Download } from "lucide-react";

export function DisciplinaryManager({ procedure }: { procedure: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [statut, setStatut] = useState(procedure.statut || "EN_COURS");
  const [reponse, setReponse] = useState(procedure.reponse_employe || "");
  const [sanction, setSanction] = useState(procedure.sanction_prise || "");

  const [generating, setGenerating] = useState(false);

  async function handleUpdate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/disciplinaire/${procedure.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statut,
          reponse_employe: reponse,
          sanction_prise: sanction
        }),
      });

      if (!res.ok) throw new Error("Erreur de mise à jour");
      
      toast.success("Procédure mise à jour avec succès");
      router.refresh();
    } catch (err) {
      toast.error("Échec de la mise à jour");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateDoc() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/disciplinaire/${procedure.id}/generer-document`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Erreur de génération");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Courrier_Disciplinaire_${procedure.employees.full_name.replace(/ /g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("Document PDF généré et téléchargé (archivé dans la GED)");
      router.refresh();
    } catch (err) {
      toast.error("Échec de la génération du document");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion de la Procédure</CardTitle>
          <CardDescription>Mettez à jour le statut et les réponses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Statut actuel</Label>
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EN_COURS">En cours</SelectItem>
                <SelectItem value="ATTENTE_REPONSE">En attente de réponse</SelectItem>
                <SelectItem value="SANCTION_APPLIQUEE">Sanction appliquée</SelectItem>
                <SelectItem value="CLOTURE">Clôturé</SelectItem>
                <SelectItem value="ANNULE">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Réponse de l'employé</Label>
            <Textarea 
              value={reponse} 
              onChange={(e) => setReponse(e.target.value)}
              placeholder="Explications fournies par l'employé..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Sanction finale appliquée (le cas échéant)</Label>
            <Textarea 
              value={sanction} 
              onChange={(e) => setSanction(e.target.value)}
              placeholder="Ex: Mise à pied de 3 jours du XX au XX..."
              rows={2}
            />
          </div>

          <Button onClick={handleUpdate} disabled={loading} className="w-full">
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Génération documentaire</CardTitle>
          <CardDescription>Documents conformes au Code du Travail (PDF)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             <Button 
                variant="outline" 
                size="sm"
                className="gap-2"
                onClick={() => {
                   const doc = generateDemandeExplicationPDF({
                      procedure,
                      employee: procedure.employees,
                      company: procedure.employees.companies
                  });
                  exportPDF(doc, `Demande_Explication_${procedure.employees.full_name.replace(/ /g, '_')}`);
                }}
             >
               <FileText className="h-4 w-4" />
               DE
             </Button>

             <Button 
                variant="outline" 
                size="sm"
                className="gap-2"
                onClick={() => {
                   const doc = generateConvocationPDF({
                      employee: procedure.employees,
                      company: procedure.employees.companies
                  });
                  exportPDF(doc, `Convocation_${procedure.employees.full_name.replace(/ /g, '_')}`);
                }}
             >
               <FileText className="h-4 w-4" />
               Convocation
             </Button>

             <Button 
                variant="outline" 
                size="sm"
                className="gap-2"
                onClick={() => {
                   const doc = generateSanctionPDF({
                      procedure,
                      employee: procedure.employees,
                      company: procedure.employees.companies
                  });
                  exportPDF(doc, `Sanction_${procedure.employees.full_name.replace(/ /g, '_')}`);
                }}
             >
               <Download className="h-4 w-4" />
               Sanction
             </Button>
          </div>
          
          <Button variant="ghost" className="w-full text-[10px] text-muted-foreground" onClick={handleGenerateDoc} disabled={generating}>
            {generating ? "Traitement..." : "Générer & Archiver sur le serveur (GED)"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
