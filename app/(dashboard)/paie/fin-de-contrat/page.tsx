export const dynamic = 'force-dynamic';
import { createServerClient } from "@/lib/supabase/server";
import { SoldeToutCompteForm } from "@/components/rh/SoldeToutCompteForm";
import { safeFormatDate } from "@/lib/paie-ci";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FilePdf, ClockCounterClockwise, Calculator } from "@phosphor-icons/react/dist/ssr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";

// Separate components used to have hooks but they must be in "use client" files or separated.
// Since SoldeToutCompteForm is already "use client", it will handle hydration on its own.

export const metadata = { title: "Solde de Tout Compte — RH Manager CI" };

export default async function FinDeContratPage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string }>;
}) {
  const supabase = createServerClient();
  const params = await searchParams;
  const defaultEmployeeId = params?.employeeId;

  // We wrap the queries to be more resilient
  const [
    { data: employees, error: empErr }, 
    { data: company, error: compErr }, 
    { data: archivedSTCs, error: stcErr }
  ] = await Promise.all([
    supabase
      .from("employees")
      .select("id, full_name, matricule, salaire_brut, type_contrat, date_embauche")
      .eq("statut", "actif")
      .order("full_name"),
    supabase
      .from("companies")
      .select("*")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("documents")
      .select("*, employees(full_name, matricule)")
      .eq("famille", "Paie") // Adjusted to use 'Paie' as STC is not in enum, or we can use another filter
      .order("created_at", { ascending: false })
      .limit(10)
  ]);

  if (stcErr) console.error("Error fetching archives:", stcErr);

  // Filter archivedSTCs to only those with 'Solde de Tout Compte' in the name if needed, 
  // or keep as is if 'Paie' is the standard for STCs.
  const displayArchives = archivedSTCs?.filter(doc => doc.name?.includes("Solde de Tout Compte")) || [];

  return (
    <div className="container mx-auto py-10 px-6 space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
           <div className="flex items-center gap-3">
              <Link 
                href="/paie" 
                className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
              >
                <ArrowLeft size={20} />
              </Link>
              <Badge className="bg-slate-900 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-md">
                Module de Paie
              </Badge>
           </div>
           <h1 className="text-5xl font-black text-slate-900 tracking-tightest leading-none">
             Fin de <span className="text-primary italic">Contrat</span>
           </h1>
           <p className="text-slate-500 font-medium max-w-xl border-l-2 border-primary/20 pl-4">
             Générez, simulez et archivez les soldes de tout compte conformément à la législation ivoirienne (Article 25.1).
           </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="h-20 w-px bg-slate-100" />
           <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Statut Réglementaire</p>
             <div className="flex items-center gap-2 text-emerald-500 font-bold justify-end">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               À Jour • Mars 2026
             </div>
           </div>
        </div>
      </div>

      <Tabs defaultValue="calculateur" className="space-y-10">
        <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100 gap-1">
          <TabsTrigger value="calculateur" className="rounded-xl px-10 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 text-slate-400 gap-2">
             <Calculator size={16} weight="bold" /> Calculateur
          </TabsTrigger>
          <TabsTrigger value="archives" className="rounded-xl px-10 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 text-slate-400 gap-2">
             <ClockCounterClockwise size={16} weight="bold" /> Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculateur" className="m-0 focus-visible:outline-none">
          <SoldeToutCompteForm 
            employees={employees || []} 
            defaultEmployeeId={defaultEmployeeId}
            company={company}
          />
        </TabsContent>

        <TabsContent value="archives" className="m-0 focus-visible:outline-none">
           <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                 <h3 className="text-xl font-black text-slate-900 tracking-tightest">Récemment Archivés</h3>
              </div>
              
              {displayArchives.length > 0 ? (
                <div className="divide-y divide-slate-50">
                   {displayArchives.map((doc: any) => (
                     <div key={doc.id} className="p-8 hover:bg-slate-50/50 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                           <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-100 group-hover:scale-110 transition-transform">
                              <FilePdf weight="duotone" size={28} />
                           </div>
                           <div>
                              <h4 className="font-black text-slate-900 tracking-tight leading-tight mb-1">
                                {doc.employees?.full_name || "Employé Inconnu"}
                              </h4>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400" suppressHydrationWarning>
                                 Archivé le {safeFormatDate(doc.created_at, "PPP")}
                              </p>
                           </div>
                        </div>

                        <div className="flex items-center gap-3">
                           <a 
                             href={doc.file_url}
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
