import { CalculateurRH } from "@/components/rh/CalculateurRH";
import { CalcEnversForm } from "@/components/rh/CalcEnversForm";
import { SimulatorCockpit } from "@/components/rh/SimulatorCockpit";
import { SoldeToutCompteForm } from "@/components/rh/SoldeToutCompteForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Simulation & Calcul — RH Manager CI" };

const TAB_CLS =
  "rounded-lg px-4 py-2.5 text-sm font-medium transition-colors data-[state=active]:bg-[oklch(0.175_0.04_248)] data-[state=active]:text-[oklch(0.78_0.13_73)] data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-700";

export default async function CalculateurPage() {
  const supabase = createServerClient();
  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, full_name, matricule, salaire_brut, type_contrat, date_embauche, sursalaire, prime_transport, prime_anciennete, prime_exceptionnelle, prime_salissure, prime_depassement, prime_fonction, departement")
    .eq("statut", "actif")
    .order("full_name")
    .limit(500);

  const employeeList = error ? [] : (employees ?? []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Simulation & Calcul</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Simulez des bulletins, calculez des indemnités et vérifiez des barèmes — Conformité Code du Travail CI 2025
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest border border-slate-200 text-slate-600 bg-white">
          CT-CI 2025
        </span>
      </div>

      <Tabs defaultValue="simulateur" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 mb-2 rounded-xl h-auto gap-1 flex-wrap">
          <TabsTrigger value="simulateur" className={TAB_CLS}>
            Simulateur de bulletin
          </TabsTrigger>
          <TabsTrigger value="stc" className={TAB_CLS}>
            Solde de Tout Compte
          </TabsTrigger>
          <TabsTrigger value="envers" className={TAB_CLS}>
            Calcul Net → Brut
          </TabsTrigger>
          <TabsTrigger value="baremes" className={TAB_CLS}>
            Barèmes légaux CI
          </TabsTrigger>
        </TabsList>

        {/* Sous-titre contextuel selon l'onglet actif */}
        <TabsContent value="simulateur" className="mt-0 outline-none">
          <p className="text-xs text-slate-400 mb-5">
            Ajustez librement le salaire et les primes — le bulletin se recalcule en temps réel. Comparez deux scénarios côte à côte.
            {employeeList.length > 0 && ` Chargez un de vos ${employeeList.length} salarié(s) actif(s) comme point de départ.`}
          </p>
          <SimulatorCockpit employees={employeeList} />
        </TabsContent>

        <TabsContent value="stc" className="mt-0 outline-none max-w-4xl">
          <p className="text-xs text-slate-400 mb-5">
            Calculez le Solde de Tout Compte d'un salarié : indemnité de licenciement, indemnité de précarité (CDD),
            congés non pris (ICCP) et préavis non effectué. Export PDF inclus.
          </p>
          <SoldeToutCompteForm employees={employeeList} />
        </TabsContent>

        <TabsContent value="envers" className="mt-0 outline-none">
          <p className="text-xs text-slate-400 mb-5">
            Partez d'un net souhaité pour trouver le brut exact à fixer, les cotisations précises et le coût total employeur.
            Utile pour les négociations salariales et les recrutements.
          </p>
          <CalcEnversForm />
        </TabsContent>

        <TabsContent value="baremes" className="mt-0 outline-none max-w-3xl">
          <p className="text-xs text-slate-400 mb-5">
            Référentiels légaux ivoiriens : calcul d'indemnités, durée de préavis, congés payés acquis,
            majorations heures supplémentaires et congés pour événements familiaux.
          </p>
          <CalculateurRH />
        </TabsContent>
      </Tabs>
    </div>
  );
}
