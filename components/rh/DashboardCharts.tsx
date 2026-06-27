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

const COLORS = ['#FF8200', '#0F172A', '#475569', '#94A3B8', '#CBD5E1', '#E2E8F0'];
const GENDER_COLORS = ['#0F172A', '#FF8200'];

export function DashboardCharts({ deptData, genderData }: ChartProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Répartition par Département */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-6">Effectif par Département</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={deptData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={105}
                paddingAngle={4}
                dataKey="value"
              >
                {deptData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Répartition par Genre */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-6">Parité Homme/Femme</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={105}
                paddingAngle={4}
                dataKey="value"
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
