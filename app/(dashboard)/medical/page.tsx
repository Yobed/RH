export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Calendar, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MedicalExamDialog } from "@/components/rh/MedicalExamDialog";

export const metadata = { title: "Santé & Sécurité — RH Manager CI" };

export default async function MedicalPage() {
  const supabase = createServerClient();

  // Récupérer les examens médicaux
  const { data: exams, error: examsError } = await supabase
    .from("medical_exams")
    .select(`
      *,
      employees!inner(full_name, poste)
    `)
    .order("date_examen", { ascending: false });

  // Récupérer la liste des employés pour le dialogue
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, poste")
    .eq("statut", "actif")
    .order("full_name");

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Santé & Sécurité au Travail</h1>
          <p className="text-sm text-muted-foreground">
            Suivi des visites médicales, aptitudes et recommandations de la médecine du travail.
          </p>
        </div>
        <MedicalExamDialog employees={employees ?? []} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-full">
            <Stethoscope className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Aptes</p>
            <p className="text-xl font-bold">{exams?.filter(e => e.resultat === 'APTE').length || 0}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 rounded-full">
            <Calendar className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">À programmer (30j)</p>
            <p className="text-xl font-bold">
              {exams?.filter(e => e.prochaine_visite && new Date(e.prochaine_visite) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length || 0}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-full">
            <FileText className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Inaptes / Réserves</p>
            <p className="text-xl font-bold">{exams?.filter(e => e.resultat !== 'APTE').length || 0}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
        {!exams || exams.length === 0 ? (
          <div className="p-12 text-center">
            <Stethoscope className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">Aucun examen médical enregistré</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employé</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type d'examen</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Résultat</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Prochaine visite</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {exams.map((exam) => (
                <tr key={exam.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{exam.employees?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{exam.employees?.poste}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{exam.type_examen.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(exam.date_examen).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant={exam.resultat === 'APTE' ? 'default' : exam.resultat === 'INAPTE' ? 'destructive' : 'secondary'}
                      className={exam.resultat === 'APTE' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}
                    >
                      {exam.resultat.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {exam.prochaine_visite ? (
                      <span className={new Date(exam.prochaine_visite) < new Date() ? "text-red-500 font-medium" : ""}>
                        {new Date(exam.prochaine_visite).toLocaleDateString('fr-FR')}
                      </span>
                    ) : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm">Détails</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
