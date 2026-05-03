import { CalculateurRH } from "@/components/rh/CalculateurRH";
import { CalcEnversForm } from "@/components/rh/CalcEnversForm";
import { SimulatorCockpit } from "@/components/rh/SimulatorCockpit";
import { SoldeToutCompteForm } from "@/components/rh/SoldeToutCompteForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Espace Simulation & Calcul — RH Manager CI" };

export default async function CalculateurPage() {
  const supabase = createServerClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, matricule, salaire_brut, type_contrat, date_embauche, sursalaire, prime_transport, prime_anciennete, prime_exceptionnelle, prime_salissure, prime_depassement, prime_fonction, departement")
    .eq("statut", "actif")
    .order("full_name");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Espace Simulation & Calcul</h1>
          <p className="text-sm text-slate-600 mt-0.5 font-medium">Décisions RH éclairées — Conformité Code du Travail CI 2025</p>
        </div>
        <span className="shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest border border-slate-200 text-slate-600 bg-white">
          Conforme CI 2025
        </span>
      </div>

      <Tabs defaultValue="cockpit" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 mb-6 rounded-xl h-auto gap-1">
          <TabsTrigger
            value="cockpit"
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors data-[state=active]:bg-[oklch(0.175_0.04_248)] data-[state=active]:text-[oklch(0.78_0.13_73)] data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-700"
          >
            Cockpit Simulation
          </TabsTrigger>
          <TabsTrigger
            value="stc"
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors data-[state=active]:bg-[oklch(0.175_0.04_248)] data-[state=active]:text-[oklch(0.78_0.13_73)] data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-700"
          >
            Solde de Tout Compte
          </TabsTrigger>
          <TabsTrigger
            value="tools"
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors data-[state=active]:bg-[oklch(0.175_0.04_248)] data-[state=active]:text-[oklch(0.78_0.13_73)] data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-700"
          >
            Outils Rapides
          </TabsTrigger>
          <TabsTrigger
            value="envers"
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors data-[state=active]:bg-[oklch(0.175_0.04_248)] data-[state=active]:text-[oklch(0.78_0.13_73)] data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-700"
          >
            Calcul Net → Brut
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cockpit" className="mt-0 outline-none">
          <SimulatorCockpit employees={employees ?? []} />
        </TabsContent>

        <TabsContent value="stc" className="mt-0 outline-none max-w-4xl">
          <SoldeToutCompteForm employees={employees || []} />
        </TabsContent>

        <TabsContent value="tools" className="mt-0 outline-none max-w-3xl">
          <CalculateurRH />
        </TabsContent>

        <TabsContent value="envers" className="mt-0 outline-none">
          <CalcEnversForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
