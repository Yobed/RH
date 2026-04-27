export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { SoldeToutCompteForm } from "@/components/rh/SoldeToutCompteForm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FilePdf, ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const metadata = { title: "Solde de Tout Compte — RH Manager CI" };

export default async function FinDeContratPage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string }>;
}) {
  const supabase = createServerClient();
  const params = await searchParams;
  const defaultEmployeeId = params?.employeeId;

  const [{ data: employees }, { data: company }, { data: archivedSTCs }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, matricule, salaire_brut, type_contrat, date_embauche")
      .eq("statut", "actif")
      .order("full_name"),
    supabase.from("companies").select("*").single(),
    supabase
      .from("documents")
      .select("*, employees(full_name, matricule)")
      .eq("type", "Paie")
      .ilike("title", "%Solde de Tout Compte%")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] font-black uppercase px-3 py-1">Fin de Contrat</Badge>
             <div className="h-1 w-1 rounded-full bg-slate-300" />
             <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Solde de Tout Compte</span>
          </div>
          <h2 className="text-5xl font-black tracking-tightest leading-none text-slate-900 animate-in slide-in-from-left duration-700">
            Clôture du <br/>
            <span className="text-emerald-500 italic font-serif">Contrat</span> Travail
          </h2>
          <p className="text-muted-foreground text-sm font-medium max-w-xl leading-relaxed">
            Simulez et archivez précisément les indemnités de fin de contrat (précarité, licenciement, congés) selon les lois ivoiriennes.
          </p>
        </div>

        <Link
          href="/paie"
          className="h-14 px-8 rounded-[1.25rem] bg-white border border-slate-100 text-slate-900 font-black uppercase text-[11px] tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-3"
        >
          <ArrowLeft weight="bold" className="w-4 h-4" /> Retour à la paie
        </Link>
      </div>

      <Tabs defaultValue="simulator" className="space-y-8">
        <TabsList className="bg-slate-100/50 p-1.5 rounded-[1.25rem] border border-slate-100 flex items-center w-fit shadow-inner">
          <TabsTrigger 
            value="simulator" 
            className="rounded-xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-lg text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Simulateur STC
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="rounded-xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <ClockCounterClockwise weight="bold" size={14} /> Historique & Archive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simulator">
          <SoldeToutCompteForm
            employees={employees ?? []}
            company={company}
            defaultEmployeeId={defaultEmployeeId}
          />
        </TabsContent>

        <TabsContent value="history">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.04)] overflow-hidden">
             <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                <h3 className="text-xl font-black text-slate-900 tracking-tightest">Récemment Archivés</h3>
             </div>
             
             {archivedSTCs && archivedSTCs.length > 0 ? (
               <div className="divide-y divide-slate-50">
                  {archivedSTCs.map((doc: any) => (
                    <div key={doc.id} className="p-8 hover:bg-slate-50/50 transition-colors flex items-center justify-between group">
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-100 group-hover:scale-110 transition-transform">
                             <FilePdf weight="duotone" size={28} />
                          </div>
                          <div>
                             <h4 className="font-black text-slate-900 tracking-tight leading-none mb-1">
                               {doc.employees?.full_name || "Employé Inconnu"}
                             </h4>
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                               Archivé le {format(new Date(doc.created_at), "PPP", { locale: fr })}
                             </p>
                          </div>
                       </div>

                       <div className="flex items-center gap-3">
                          <a 
                            href={supabase.storage.from("rh-documents").getPublicUrl(doc.file_path).data.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 px-6 rounded-xl bg-slate-900 text-white font-black uppercase text-[9px] tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2"
                          >
                            <FilePdf weight="bold" size={14} /> Voir le document
                          </a>
                       </div>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                     <FilePdf className="h-10 w-10 text-slate-200" weight="duotone" />
                  </div>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Aucune archive disponible</p>
               </div>
             )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
