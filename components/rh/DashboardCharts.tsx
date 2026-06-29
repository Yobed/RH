"use client";

import { useState, useMemo } from "react";
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
  Legend,
  Sector,
} from "recharts";
import { BarChart2, PieChart as PieIcon, Layers, Filter, Sparkles, TrendingUp, Users } from "lucide-react";

interface ChartProps {
  deptData: { name: string; value: number }[];
  genderData: { name: string; value: number }[];
}

const DEPT_COLORS = ['#059669', '#0F172A', '#3B82F6', '#D97706', '#8B5CF6', '#EC4899', '#64748B'];
const GENDER_COLORS = ['#0F172A', '#059669'];

// Custom Tooltip Component removing default recharts borders and ugly outlines
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/80 backdrop-blur-md text-xs space-y-1 z-50 animate-in fade-in-50 zoom-in-95">
        <p className="font-bold flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ backgroundColor: data.color || data.fill }} />
          <span>{data.name}</span>
        </p>
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
          <span className="text-slate-400 font-medium">Effectif :</span>
          <span className="font-black text-emerald-400 text-sm">{data.value} collaborateur(s)</span>
        </div>
      </div>
    );
  }
  return null;
};

export function DashboardCharts({ deptData, genderData }: ChartProps) {
  const [deptChartType, setDeptChartType] = useState<"donut" | "bar">("donut");
  const [genderChartType, setGenderChartType] = useState<"donut" | "bar">("donut");
  
  const [activeDeptIndex, setActiveDeptIndex] = useState<number | null>(null);
  const [activeGenderIndex, setActiveGenderIndex] = useState<number | null>(null);

  const totalDeptHeadcount = useMemo(
    () => (deptData ?? []).reduce((acc, curr) => acc + curr.value, 0),
    [deptData]
  );

  const totalGenderHeadcount = useMemo(
    () => (genderData ?? []).reduce((acc, curr) => acc + curr.value, 0),
    [genderData]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* ────────────────────────────────────────────────────────────── */}
      {/* 1. RÉPARTITION PAR DÉPARTEMENT                                */}
      {/* ────────────────────────────────────────────────────────────── */}
      <div className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/40 dark:shadow-none hover:shadow-2xl transition-all duration-300 flex flex-col justify-between">
        
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Effectif par Département
              </h3>
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
              Répartition analytique des équipes
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setDeptChartType("donut")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                deptChartType === "donut"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <PieIcon className="h-3.5 w-3.5" />
              <span>Donut</span>
            </button>
            <button
              onClick={() => setDeptChartType("bar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                deptChartType === "bar"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Barres</span>
            </button>
          </div>
        </div>

        {/* Dynamic Chart Area */}
        <div className="h-[310px] w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            {deptChartType === "donut" ? (
              <PieChart>
                <Pie
                  data={deptData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={112}
                  paddingAngle={5}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveDeptIndex(index)}
                  onMouseLeave={() => setActiveDeptIndex(null)}
                >
                  {(deptData ?? []).map((entry, index) => (
                    <Cell
                      key={`cell-dept-${index}`}
                      fill={DEPT_COLORS[index % DEPT_COLORS.length]}
                      stroke="none"
                      style={{ outline: 'none' }}
                      className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '16px', fontSize: '11px', fontWeight: '700' }}
                />
              </PieChart>
            ) : (
              <BarChart data={deptData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} stroke="#94A3B8" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fontWeight: 700 }} stroke="#94A3B8" />
                <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} className="cursor-pointer">
                  {(deptData ?? []).map((entry, index) => (
                    <Cell key={`bar-dept-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} style={{ outline: 'none' }} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>

          {/* Interactive Center Stats for Donut */}
          {deptChartType === "donut" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {activeDeptIndex !== null && deptData[activeDeptIndex]
                  ? deptData[activeDeptIndex].name
                  : "Effectif Total"}
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeDeptIndex !== null && deptData[activeDeptIndex]
                  ? deptData[activeDeptIndex].value
                  : totalDeptHeadcount}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {activeDeptIndex !== null && deptData[activeDeptIndex]
                  ? `${Math.round((deptData[activeDeptIndex].value / (totalDeptHeadcount || 1)) * 100)}% des effectifs`
                  : "Collaborateurs"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────── */}
      {/* 2. PARITÉ & DÉMOGRAPHIE                                        */}
      {/* ────────────────────────────────────────────────────────────── */}
      <div className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-200/40 dark:shadow-none hover:shadow-2xl transition-all duration-300 flex flex-col justify-between">
        
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-900 dark:bg-white animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Parité & Démographie
              </h3>
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
              Ratio Homme / Femme
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setGenderChartType("donut")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                genderChartType === "donut"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <PieIcon className="h-3.5 w-3.5" />
              <span>Donut</span>
            </button>
            <button
              onClick={() => setGenderChartType("bar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                genderChartType === "bar"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Barres</span>
            </button>
          </div>
        </div>

        {/* Dynamic Chart Area */}
        <div className="h-[310px] w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            {genderChartType === "donut" ? (
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={112}
                  paddingAngle={5}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveGenderIndex(index)}
                  onMouseLeave={() => setActiveGenderIndex(null)}
                >
                  {(genderData ?? []).map((entry, index) => (
                    <Cell
                      key={`cell-gender-${index}`}
                      fill={GENDER_COLORS[index % GENDER_COLORS.length]}
                      stroke="none"
                      style={{ outline: 'none' }}
                      className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '16px', fontSize: '11px', fontWeight: '700' }}
                />
              </PieChart>
            ) : (
              <BarChart data={genderData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} stroke="#94A3B8" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fontWeight: 700 }} stroke="#94A3B8" />
                <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: 'none' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} className="cursor-pointer">
                  {(genderData ?? []).map((entry, index) => (
                    <Cell key={`bar-gender-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} style={{ outline: 'none' }} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>

          {/* Interactive Center Stats for Donut */}
          {genderChartType === "donut" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {activeGenderIndex !== null && genderData[activeGenderIndex]
                  ? genderData[activeGenderIndex].name
                  : "Ratio Parité"}
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeGenderIndex !== null && genderData[activeGenderIndex]
                  ? genderData[activeGenderIndex].value
                  : `${Math.round(((genderData.find(g => g.name.toLowerCase().includes("femme"))?.value || 0) / (totalGenderHeadcount || 1)) * 100)}%`}
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                {activeGenderIndex !== null && genderData[activeGenderIndex]
                  ? `${Math.round((genderData[activeGenderIndex].value / (totalGenderHeadcount || 1)) * 100)}% de la masse`
                  : "Taux de Féminisation"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
