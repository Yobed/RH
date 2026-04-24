"use client";

import React, { useState, useMemo } from "react";
import { exportSimulationPDF } from "@/lib/pdf-export";
import { 
  Calculator, 
  TrendingUp, 
  Users, 
  Wallet, 
  Info, 
  Briefcase, 
  ArrowRightLeft,
  ChevronDown,
  PieChart as PieChartIcon,
  Download,
  Share2,
  Settings2
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend
} from "recharts";
import { 
  calculerBulletinComplet, 
  calculerChargesPatronales,
  CHARGES_PATRONALES_TAUX,
  SMIG_MENSUEL 
} from "@/lib/paie-ci";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fcfa = (n: number) =>
  new Intl.NumberFormat("fr-CI", { 
    style: "currency", 
    currency: "XOF", 
    minimumFractionDigits: 0 
  }).format(Math.round(n));

export function SimulatorCockpit() {
  const [brut, setBrut] = useState(250000);
  const [primes, setPrimes] = useState(0);
  const [transport, setTransport] = useState(30000);
  const [tauxAtMp, setTauxAtMp] = useState<number>(CHARGES_PATRONALES_TAUX.at_mp);

  // Calculations
  const calculations = useMemo(() => {
    const res = calculerBulletinComplet({
      salaire_brut: brut,
      prime_transport: transport,
      sursalaire: 0,
      prime_anciennete: 0,
    });

    const chargesPatronales = calculerChargesPatronales(res.total_imposable, tauxAtMp);
    const coutTotal = res.total_brut + chargesPatronales.total;

    return {
      ...res,
      chargesPatronales,
      coutTotal,
      taxRatio: (res.its / res.total_brut) * 100,
      netRatio: (res.salaire_net / coutTotal) * 100,
    };
  }, [brut, transport, tauxAtMp]);

  const handleExport = () => {
    exportSimulationPDF({
      salaireBrut: brut,
      sursalaire: 0,
      primeTransport: transport,
      tauxAtMp: tauxAtMp,
      resultat: calculations,
      companyName: "RH Manager CI - Simulation"
    });
  };

  const chartData = [
    { name: "Net à payer", value: calculations.salaire_net, color: "#10b981" },
    { name: "Charges Salariales", value: calculations.cnps_retraite + calculations.cmu, color: "#3b82f6" },
    { name: "Impôts (ITS)", value: calculations.its, color: "#f59e0b" },
    { name: "Charges Patronales", value: calculations.chargesPatronales.total, color: "#6366f1" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Cockpit de Simulation RH</h2>
          <p className="text-muted-foreground">Outil professionnel d&apos;analyse de masse salariale et TCO.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9">
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button size="sm" className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Settings2 className="mr-2 h-4 w-4" /> Paramètres
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Configuration Panel */}
        <Card className="lg:col-span-4 border-slate-200/60 shadow-sm overflow-hidden h-fit">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-lg">Configuration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700">Salaire Brut Mensuel</label>
                  <span className="text-lg font-bold text-indigo-600">{fcfa(brut)}</span>
                </div>
                <input 
                  type="range"
                  min={SMIG_MENSUEL} 
                  max={2500000} 
                  step={5000}
                  value={brut}
                  onChange={(e) => setBrut(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="relative">
                   <Input 
                    type="number" 
                    value={brut} 
                    onChange={(e) => setBrut(Number(e.target.value))}
                    className="pl-9 h-11 border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500"
                   />
                   <Wallet className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                   <span className="absolute right-3 top-3 text-xs font-medium text-slate-400">FCFA</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Transport</label>
                  <Input 
                    type="number" 
                    value={transport} 
                    onChange={(e) => setTransport(Number(e.target.value))}
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Primes / Ind.</label>
                  <Input 
                    type="number" 
                    value={primes} 
                    onChange={(e) => setPrimes(Number(e.target.value))}
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-slate-700">Taux AT/MP (Secteur)</label>
                  <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                    {(tauxAtMp * 100).toFixed(1)}%
                  </span>
                </div>
                <select 
                  className="w-full h-10 px-3 text-sm rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  onChange={(e) => setTauxAtMp(Number(e.target.value))}
                  value={tauxAtMp}
                >
                  <option value={0.02}>Administration (2%)</option>
                  <option value={0.03}>Services / Commerce (3%)</option>
                  <option value={0.05}>Industrie / BTP (5%)</option>
                </select>
              </div>
            </div>

            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
               <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-indigo-900">Efficacité Salariale</p>
                    <p className="text-2xl font-bold text-indigo-700">{calculations.netRatio.toFixed(1)}%</p>
                    <p className="text-[10px] text-indigo-600/70 mt-1 uppercase tracking-wider font-medium">Net perçu / Coût patronal total</p>
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-emerald-100 bg-emerald-50/30 overflow-hidden group hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded-full uppercase">Net à Payer</div>
                </div>
                <h3 className="text-2xl font-bold text-emerald-950 tracking-tight">{fcfa(calculations.salaire_net)}</h3>
                <p className="text-xs text-emerald-700/70 mt-1 font-medium">Revenu net de l&apos;employé</p>
              </CardContent>
            </Card>

            <Card className="border-indigo-100 bg-indigo-50/30 overflow-hidden group hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="text-[10px] font-bold text-indigo-600 bg-indigo-100/50 px-2 py-1 rounded-full uppercase">Coût Total</div>
                </div>
                <h3 className="text-2xl font-bold text-indigo-950 tracking-tight">{fcfa(calculations.coutTotal)}</h3>
                <p className="text-xs text-indigo-700/70 mt-1 font-medium">Total déboursé par l&apos;entreprise</p>
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-amber-50/30 overflow-hidden group hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <ArrowRightLeft className="h-5 w-5" />
                  </div>
                  <div className="text-[10px] font-bold text-amber-600 bg-amber-100/50 px-2 py-1 rounded-full uppercase">Écart Fiscal</div>
                </div>
                <h3 className="text-2xl font-bold text-amber-950 tracking-tight">{fcfa(calculations.coutTotal - calculations.salaire_net)}</h3>
                <p className="text-xs text-amber-700/70 mt-1 font-medium">Charges + Taxes + Prélèves.</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="visual" className="w-full">
            <TabsList className="bg-slate-100 p-1 mb-4">
              <TabsTrigger value="visual">Vue Graphique</TabsTrigger>
              <TabsTrigger value="details">Tableau Détaillé</TabsTrigger>
            </TabsList>

            <TabsContent value="visual" className="mt-0 outline-none">
               <Card className="border-slate-200/60 shadow-sm">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => fcfa(Number(value))} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-4">
                         <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-slate-900 border-b pb-2">Répartition du Coût Total</h4>
                            {chartData.map((item, i) => (
                              <div key={i} className="flex items-center justify-between font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                  <span className="text-sm text-slate-600">{item.name}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-slate-800">{fcfa(item.value)}</div>
                                  <div className="text-[10px] text-slate-400">
                                    {((item.value / calculations.coutTotal) * 100).toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            ))}
                         </div>
                         <div className="pt-4 border-t">
                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                               <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Coût Employeur</span>
                               <span className="text-lg font-black text-slate-900">{fcfa(calculations.coutTotal)}</span>
                            </div>
                         </div>
                      </div>
                    </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="details" className="mt-0 outline-none">
              <Card className="border-slate-200/60 shadow-sm overflow-hidden font-medium">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left py-4 px-6 font-semibold text-slate-700">Composante</th>
                          <th className="text-right py-4 px-6 font-semibold text-slate-700">Salariale</th>
                          <th className="text-right py-4 px-6 font-semibold text-slate-700">Patronale</th>
                          <th className="text-right py-4 px-6 font-semibold text-slate-700">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-4 px-6 text-slate-900">Retraite CNPS (6,3% / 7,7%)</td>
                          <td className="text-right py-4 px-6 text-slate-600">{fcfa(calculations.cnps_retraite)}</td>
                          <td className="text-right py-4 px-6 text-slate-600">{fcfa(calculations.chargesPatronales.retraite)}</td>
                          <td className="text-right py-4 px-6 text-slate-800">{fcfa(calculations.cnps_retraite + calculations.chargesPatronales.retraite)}</td>
                        </tr>
                        <tr>
                          <td className="py-4 px-6 text-slate-900">Santé CMU (Forfait 1600)</td>
                          <td className="text-right py-4 px-6 text-slate-600">{fcfa(calculations.cmu)}</td>
                          <td className="text-right py-4 px-6 text-slate-600">{fcfa(calculations.chargesPatronales.cmu)}</td>
                          <td className="text-right py-4 px-6 text-slate-800">{fcfa(calculations.cmu * 2)}</td>
                        </tr>
                        <tr>
                          <td className="py-4 px-6 text-slate-900">Impôts (ITS)</td>
                          <td className="text-right py-4 px-6 text-slate-600">{fcfa(calculations.its)}</td>
                          <td className="text-right py-4 px-6 text-slate-600">—</td>
                          <td className="text-right py-4 px-6 text-slate-800">{fcfa(calculations.its)}</td>
                        </tr>
                        <tr>
                          <td className="py-4 px-6 text-slate-900">Prestations Sociales Patronales</td>
                          <td className="text-right py-4 px-6 text-slate-600">—</td>
                          <td className="text-right py-4 px-6 text-slate-600">{fcfa(calculations.chargesPatronales.familiales + calculations.chargesPatronales.maternite)}</td>
                          <td className="text-right py-4 px-6 text-slate-800">{fcfa(calculations.chargesPatronales.familiales + calculations.chargesPatronales.maternite)}</td>
                        </tr>
                        <tr>
                          <td className="py-4 px-6 text-slate-900">Formation (FDFP) / Risques (AT)</td>
                          <td className="text-right py-4 px-6 text-slate-600">—</td>
                          <td className="text-right py-4 px-6 text-slate-600">{fcfa(calculations.chargesPatronales.fdfp + calculations.chargesPatronales.at_mp)}</td>
                          <td className="text-right py-4 px-6 text-slate-800">{fcfa(calculations.chargesPatronales.fdfp + calculations.chargesPatronales.at_mp)}</td>
                        </tr>
                        <tr className="bg-slate-50/50">
                          <td className="py-5 px-6 font-bold text-slate-900 uppercase">Total Charges</td>
                          <td className="text-right py-5 px-6 font-bold text-slate-900">{fcfa(calculations.cnps_retraite + calculations.cmu + calculations.its)}</td>
                          <td className="text-right py-5 px-6 font-bold text-slate-900">{fcfa(calculations.chargesPatronales.total)}</td>
                          <td className="text-right py-5 px-6 font-black text-indigo-600">
                             {fcfa(calculations.cnps_retraite + calculations.cmu + calculations.its + calculations.chargesPatronales.total)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
