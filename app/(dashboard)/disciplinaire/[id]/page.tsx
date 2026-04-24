export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DisciplinaryManager } from "@/components/rh/DisciplinaryManager";
import { LegalCounselSidebar } from "@/components/rh/LegalCounselSidebar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: `Détail Procédure — RH Manager CI` };
}

export default async function DisciplinaryDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();

  const { data: procedure, error } = await supabase
    .from("disciplinary_procedures")
    .select(`
      *,
      employees:employee_id (
        id,
        full_name,
        poste,
        matricule,
        companies (*)
      )
    `)
    .eq("id", params.id)
    .single() as { data: any, error: any }; // Using any here to bypass complex Supabase join type inference temporarily

  if (error || !procedure) {
    notFound();
  }

  const employee = procedure.employees;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/disciplinaire">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Procédure Disciplinaire</h1>
          <p className="text-sm text-muted-foreground">{employee?.full_name} — {employee?.poste}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
           <Badge variant="secondary">
            Ref: {procedure.id.slice(0, 8).toUpperCase()}
          </Badge>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
            {procedure.type.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="p-6 space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                Détails de l'incident
              </h3>
              
              <div className="grid grid-cols-2 gap-8 py-4 border-y border-slate-50">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Date d'incident</p>
                  <p className="text-sm font-semibold">{procedure.date_incident ? new Date(procedure.date_incident).toLocaleDateString('fr-FR') : 'Non renseignée'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Ouvert le</p>
                  <p className="text-sm font-semibold">{new Date(procedure.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Faits Reprochés</p>
                <div className="p-6 bg-slate-50 rounded-xl text-sm leading-relaxed text-slate-700 whitespace-pre-wrap border border-slate-100">
                  {procedure.motif}
                </div>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border bg-white shadow-sm p-6">
             <h3 className="text-lg font-bold mb-4">Chronologie</h3>
             <div className="space-y-4">
                <div className="flex gap-3">
                   <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                   </div>
                   <div className="text-sm">
                      <p className="font-bold">Ouverture du dossier</p>
                      <p className="text-muted-foreground text-xs">{new Date(procedure.created_at).toLocaleString('fr-FR')}</p>
                   </div>
                </div>
                {procedure.date_notification && (
                   <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                         <div className="h-2 w-2 rounded-full bg-blue-500" />
                      </div>
                      <div className="text-sm">
                         <p className="font-bold">Notification du courrier</p>
                         <p className="text-muted-foreground text-xs">{new Date(procedure.date_notification).toLocaleDateString('fr-FR')}</p>
                      </div>
                   </div>
                )}
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <DisciplinaryManager procedure={procedure} />
          <LegalCounselSidebar type={procedure.type} statut={procedure.statut} />
        </div>
      </div>
    </div>
  );
}
