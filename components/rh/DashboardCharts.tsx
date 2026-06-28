"use client";

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Legend
} from "recharts";

interface ChartProps {
  deptData: { name: string; value: number }[];
  genderData: { name: string; value: number }[];
}

const COLORS = ['#059669', '#0F172A', '#475569', '#047857', '#CBD5E1', '#E2E8F0'];
const GENDER_COLORS = ['#0F172A', '#059669'];

export function DashboardCharts({ deptData, genderData }: ChartProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Répartition par Département */}
      <div className="group relative overflow-hidden bg-white/90 backdrop-blur-md dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-7 shadow-lg shadow-slate-200/40 dark:shadow-none hover:shadow-2xl hover:shadow-[#059669]/5 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400">Effectif par Département</h3>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Répartition analytique des équipes</p>
          </div>
          <span className="h-2 w-2 rounded-full bg-[#059669]" />
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={deptData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={108}
                paddingAngle={4}
                dataKey="value"
              >
                {deptData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" className="transition-all duration-300 hover:opacity-80 cursor-pointer" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '20px', border: '1px solid rgba(226, 232, 240, 0.8)', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '12px', fontSize: '12px', fontWeight: '600' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Répartition par Genre */}
      <div className="group relative overflow-hidden bg-white/90 backdrop-blur-md dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-7 shadow-lg shadow-slate-200/40 dark:shadow-none hover:shadow-2xl hover:shadow-[#059669]/5 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400">Parité & Démographie</h3>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Ratio Homme / Femme</p>
          </div>
          <span className="h-2 w-2 rounded-full bg-slate-900 dark:bg-white" />
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={108}
                paddingAngle={4}
                dataKey="value"
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} stroke="none" className="transition-all duration-300 hover:opacity-80 cursor-pointer" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '20px', border: '1px solid rgba(226, 232, 240, 0.8)', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '12px', fontSize: '12px', fontWeight: '600' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
