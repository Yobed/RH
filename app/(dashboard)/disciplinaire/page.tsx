export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { DisciplinaryDialog } from "@/components/rh/DisciplinaryDialog";
import { Scale } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Disciplinaire — RH Manager CI" };

export default async function DisciplinairePage() {
  const supabase = createServerClient();

  const [{ data: procedures }, { data: employees }] = await Promise.all([
    supabase
      .from("disciplinary_procedures")
      .select(
        `id, type, motif, statut, date_incident, created_at,
         employees!inner(full_name, poste)`
      )
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("employees")
      .select("id, full_name, poste")
      .eq("statut", "actif")
      .order("full_name"),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Procédures Disciplinaires</h1>
          <p className="text-sm text-muted-foreground">
            Suivi des demandes d'explication, avertissements, mises à pied et licenciements.
          </p>
        </div>
        <DisciplinaryDialog employees={employees ?? []} />
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        {!procedures || procedures.length === 0 ? (
          <div className="p-12 text-center">
            <Scale className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">Aucune procédure enregistrée</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Employé</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Incident</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {procedures.map((proc) => {
                const employee = Array.isArray(proc.employees) ? proc.employees[0] : proc.employees;
                if (!employee) return null;
                return (
                  <tr key={proc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{employee.full_name}</p>
                      <p className="text-xs text-muted-foreground">{employee.poste}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{proc.type.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {proc.date_incident ? new Date(proc.date_incident).toLocaleDateString('fr-FR') : 'Non renseigné'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={proc.statut === 'CLOTURE' ? 'secondary' : 'default'}>
                        {proc.statut.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/disciplinaire/${proc.id}`}>Détails</Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
