import { CalcEnversForm } from "@/components/rh/CalcEnversForm";
import { SoldeToutCompteForm } from "@/components/rh/SoldeToutCompteForm";
import { CalculateurRH } from "@/components/rh/CalculateurRH";
import { CalculateurConventions } from "@/components/rh/CalculateurConventions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const metadata = { title: "Calcul & Simulation paie — RH Manager CI" };

const TAB_CLS =
  "rounded-lg px-4 py-2.5 text-sm font-medium transition-colors data-[state=active]:bg-[oklch(0.175_0.04_248)] data-[state=active]:text-[oklch(0.78_0.13_73)] data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700";

interface TabMeta {
  value: string;
  label: string;
  description: string;
}

const TABS: TabMeta[] = [
  {
    value: "net-vers-brut",
    label: "Je veux offrir X net — quel brut ?",
    description:
      "Partez du salaire net que vous souhaitez garantir : l'outil calcule le brut exact à inscrire sur le contrat, les retenues légales (CNPS, ITS) et le coût total pour l'entreprise.",
  },
  {
    value: "depart",
    label: "Calculer un départ",
    description:
      "Un salarié quitte l'entreprise : calculez son Solde de Tout Compte — indemnité de licenciement, indemnité de précarité (CDD), congés non pris et préavis non effectué. Export PDF inclus.",
  },
  {
    value: "conventions",
    label: "Conventions collectives CI",
    description:
      "Calculez le salaire minimum et les primes obligatoires selon la convention collective applicable (Commerce, BTP, Industrie, Banque & Assurance). Grilles à jour SMIG 75 000 FCFA.",
  },
  {
    value: "baremes",
    label: "Règles légales CI",
    description:
      "Consultez rapidement les barèmes du Code du Travail ivoirien : durées de préavis, majorations heures supplémentaires, congés payés acquis, jours pour événements familiaux.",
  },
];

export default async function CalculateurPage() {
  const supabase = createServerClient();

  // Requête minimaliste pour SoldeToutCompteForm — uniquement les champs nécessaires
  const { data: stcEmployees } = await supabase
    .from("employees")
    .select("id, full_name, matricule, salaire_brut, type_contrat, date_embauche, poste, categorie, departement, etat_civil, nb_enfants")
    .eq("statut", "actif")
    .order("full_name")
    .limit(500);

  const employeeList = stcEmployees ?? [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Calcul & Simulation paie</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Simulez, vérifiez et calculez — tous les outils conformes au Code du Travail ivoirien 2025
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest border border-slate-200 text-slate-600 bg-white">
          CT-CI 2025
        </span>
      </div>

      <Tabs defaultValue="net-vers-brut" className="w-full">
        {/* Barre d'onglets */}
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl h-auto gap-1 flex-wrap mb-0">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className={TAB_CLS}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Description contextuelle */}
        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-0 outline-none">
            <p className="mt-3 mb-5 text-sm text-slate-500 leading-relaxed border-l-2 border-slate-200 pl-3">
              {t.description}
            </p>

            {t.value === "net-vers-brut" && (
              <CalcEnversForm employees={employeeList} />
            )}

            {t.value === "depart" && (
              <div className="max-w-4xl">
                <SoldeToutCompteForm employees={employeeList} />
              </div>
            )}

            {t.value === "conventions" && (
              <CalculateurConventions />
            )}

            {t.value === "baremes" && (
              <div className="max-w-3xl">
                <CalculateurRH />
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
