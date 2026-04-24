import { createServerClient } from "@/lib/supabase/server";
import { CompanySocialAnalysis } from "@/components/rh/CompanySocialAnalysis";
import { BarChart3, TrendingUp, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Analyses Sociales — RH Manager CI" };

export default async function AnalysesSocPage() {
  const supabase = createServerClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, departement, salaire_brut, sursalaire, prime_transport, prime_fonction")
    .eq("statut", "actif");

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-black tracking-tight">Analyses Sociales & Finance RH</h1>
          </div>
          <p className="text-muted-foreground font-medium">
            Visualisez et maîtrisez votre masse salariale en temps réel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="font-bold">Conformité Légale CI 2025</span>
          </Badge>
          <Badge variant="outline" className="px-3 py-1 flex items-center gap-1.5 bg-blue-50 text-blue-700 border-blue-200">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="font-bold">Mise à jour Live</span>
          </Badge>
        </div>
      </div>

      {!employees || employees.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-12 text-center animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold">Aucune donnée disponible</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Vous devez ajouter des employés avec leurs salaires pour générer des analyses sociales et financières.
          </p>
        </div>
      ) : (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <CompanySocialAnalysis employees={employees} />
        </div>
      )}

      {/* Glossary / Legend */}
      <div className="rounded-xl bg-slate-50 border p-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">Lexique des Indicateurs</h3>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">Masse Salariale (Brut)</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Somme des salaires de base, sursalaires et primes soumises (ancienneté, fonction) avant toute retenue sociale.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">Charges Patronales</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cotisations payées par l&apos;entreprise à la CNPS (Prestations familiales, Retraite, AT/MP), au FDFP et pour la CMU.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">Coût Total (TCO)</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Le coût réel "sorti de caisse" pour l&apos;entreprise. C&apos;est la somme du Salaire Brut et des Charges Patronales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
