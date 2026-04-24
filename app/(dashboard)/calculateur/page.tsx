import { CalculateurRH } from "@/components/rh/CalculateurRH";
import { SimulatorCockpit } from "@/components/rh/SimulatorCockpit";
import { SoldeToutCompteForm } from "@/components/rh/SoldeToutCompteForm";
import { Calculator, BarChart3, Receipt, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Espace Simulation & Calcul — RH Manager CI" };

export default async function CalculateurPage() {
  const supabase = createServerClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, matricule, salaire_brut, type_contrat, date_embauche")
    .eq("actif", true)
    .order("full_name");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Espace Simulation & Calcul</h1>
            <p className="text-sm text-muted-foreground">
              Décisions RH éclairées — Conformité Code du Travail CI 2025
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="cockpit" className="w-full">
        <TabsList className="bg-slate-100/80 p-1 mb-6 border border-slate-200/50">
          <TabsTrigger value="cockpit" className="flex items-center gap-2 px-4 py-2">
            <BarChart3 className="h-4 w-4" />
            Cockpit Simulation
          </TabsTrigger>
          <TabsTrigger value="stc" className="flex items-center gap-2 px-4 py-2">
            <FileText className="h-4 w-4" />
            Solde de Tout Compte
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2 px-4 py-2">
            <Receipt className="h-4 w-4" />
            Outils Rapides
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cockpit" className="mt-0 outline-none">
          <SimulatorCockpit />
        </TabsContent>

        <TabsContent value="stc" className="mt-0 outline-none max-w-4xl">
          <SoldeToutCompteForm employees={employees || []} />
        </TabsContent>

        <TabsContent value="tools" className="mt-0 outline-none max-w-3xl">
          <CalculateurRH />
        </TabsContent>
      </Tabs>
    </div>
  );
}
