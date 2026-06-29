"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlass,
  IdentificationBadge,
  CheckCircle,
  WarningCircle,
  Camera,
  UploadSimple,
  SquaresFour,
  ListBullets,
  Funnel,
  Download,
  Eye,
  Trash,
  Sparkle,
  X,
  User,
  Building,
  Briefcase,
  Check,
  ArrowRight,
  ShieldCheck,
  ChartPieSlice
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { EmployeePhotoUpload } from "./EmployeePhotoUpload";
import { cn } from "@/lib/utils";

export interface RegistryEmployee {
  id: string;
  full_name: string;
  matricule: string;
  poste: string | null;
  departement: string | null;
  photo_url: string | null;
  statut: string | null;
  email: string | null;
  phone: string | null;
  type_contrat: string | null;
}

interface Props {
  initialEmployees: RegistryEmployee[];
}

export function EmployeePhotoRegistryClient({ initialEmployees }: Props) {
  const [employees, setEmployees] = useState<RegistryEmployee[]>(initialEmployees);
  const [search, setSearch] = useState("");
  const [filterPhoto, setFilterPhoto] = useState<"tous" | "avec" | "sans">("tous");
  const [filterDept, setFilterDept] = useState<string>("tous");
  const [viewMode, setViewMode] = useState<"table" | "trombinoscope" | "stats">("table");
  const [activeUploadEmp, setActiveUploadEmp] = useState<RegistryEmployee | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<{ url: string; name: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Extract departments
  const departements = useMemo(() => {
    const depts = Array.from(new Set(employees.map((e) => e.departement).filter(Boolean))) as string[];
    return depts.sort();
  }, [employees]);

  // Statistics
  const stats = useMemo(() => {
    const total = employees.length;
    const avecPhoto = employees.filter((e) => Boolean(e.photo_url)).length;
    const sansPhoto = total - avecPhoto;
    const pct = total > 0 ? Math.round((avecPhoto / total) * 100) : 0;
    return { total, avecPhoto, sansPhoto, pct };
  }, [employees]);

  // Filtered list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
        emp.matricule.toLowerCase().includes(search.toLowerCase()) ||
        (emp.poste && emp.poste.toLowerCase().includes(search.toLowerCase())) ||
        (emp.departement && emp.departement.toLowerCase().includes(search.toLowerCase()));

      const matchesPhoto =
        filterPhoto === "tous"
          ? true
          : filterPhoto === "avec"
          ? Boolean(emp.photo_url)
          : !Boolean(emp.photo_url);

      const matchesDept = filterDept === "tous" ? true : emp.departement === filterDept;

      return matchesSearch && matchesPhoto && matchesDept;
    });
  }, [employees, search, filterPhoto, filterDept]);

  // Handle photo update
  const handlePhotoUpdate = async (employeeId: string, newUrl: string | null) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_url: newUrl }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erreur lors de la mise à jour de la photo");
      }

      setEmployees((prev) =>
        prev.map((emp) => (emp.id === employeeId ? { ...emp, photo_url: newUrl } : emp))
      );

      toast.success(
        newUrl
          ? "Photo numérisée et associée au profil avec succès !"
          : "Photo supprimée du registre."
      );
      setActiveUploadEmp(null);
    } catch (err: any) {
      toast.error(err.message || "Impossible d'enregistrer la photo");
    } finally {
      setIsSaving(false);
    }
  };

  // Export report
  const handleExportCSV = () => {
    const headers = ["Matricule", "Nom Complet", "Département", "Poste", "Statut Photo", "URL Photo"];
    const rows = filteredEmployees.map((e) => [
      `"${e.matricule}"`,
      `"${e.full_name}"`,
      `"${e.departement || "Non renseigné"}"`,
      `"${e.poste || "Non renseigné"}"`,
      `"${e.photo_url ? "Numérisée" : "Manquante"}"`,
      `"${e.photo_url || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Registre_Photos_RH_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Rapport d'audit télécharge en CSV");
  };

  return (
    <div className="space-y-8">
      {/* Banner Exécutif Trombinoscope Haute Éclat */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950 p-8 shadow-xl text-white dark:border-slate-800">
        <div className="absolute top-0 right-0 h-48 w-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <Sparkle weight="fill" className="w-3.5 h-3.5 text-teal-400" /> REGISTRE BIOMÉTRIQUE & TROMBINOSCOPE
            </div>
            <h1 className="font-black text-2xl sm:text-3xl tracking-tight text-white flex items-center gap-3">
              Identités Visuelles & Conformité 3D
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Gestion centralisée des photos de profil numérisées pour l'habilitation au pointage biométrique facial et le trombinoscope d'entreprise.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <div className="text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Taux de Conformité</span>
              <span className="font-black text-2xl text-teal-400">{stats.pct}% <span className="text-xs font-semibold text-slate-400">numérisé</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Titre en Gros Plan avec Fond en Surbrillance - Dashboard KPI */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-black text-lg shadow-xs flex items-center gap-2">
            <IdentificationBadge weight="bold" className="w-5 h-5 text-teal-600" />
            01. Indicateurs de Couverture Visuelle
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-800" />
        </div>

        {/* 1. Dashboard KPI Cards with Radiant Accents */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-5 relative overflow-hidden group hover:border-slate-300 transition-all shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-200">Total Effectif</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">{stats.total}</h3>
              <p className="text-xs text-slate-800 mt-1 font-bold dark:text-slate-300">Salariés enregistrés</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-slate-100 group-hover:scale-110 transition-transform shadow-inner">
              <User size={24} weight="bold" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-white to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 dark:border-emerald-500/30 p-5 relative overflow-hidden group transition-all shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Photos Numérisées</p>
              <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 tabular-nums">{stats.avecPhoto}</h3>
              <p className="text-xs text-emerald-600/90 dark:text-emerald-400/90 mt-1 font-bold">{stats.pct}% de conformité</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shadow-inner ring-1 ring-emerald-500/30">
              <CheckCircle size={26} weight="bold" />
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-xs" style={{ width: `${stats.pct}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-white to-white dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 dark:border-amber-500/30 p-5 relative overflow-hidden group transition-all shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">Photos Manquantes</p>
              <h3 className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1 tabular-nums">{stats.sansPhoto}</h3>
              <p className="text-xs text-amber-600/90 dark:text-amber-400/90 mt-1 font-bold">À régulariser</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform shadow-inner ring-1 ring-amber-500/30">
              <WarningCircle size={26} weight="bold" />
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700">
            <div className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full transition-all duration-500 shadow-xs" style={{ width: `${stats.total > 0 ? ((stats.sansPhoto / stats.total) * 100) : 0}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 via-white to-white dark:from-teal-950/30 dark:via-slate-900 dark:to-slate-900 dark:border-teal-500/30 p-5 relative overflow-hidden group transition-all shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-teal-700 dark:text-teal-400">Biométrie Prête</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 tabular-nums">{stats.avecPhoto} / {stats.total}</h3>
              <p className="text-xs text-slate-800 dark:text-slate-200 mt-1 font-bold">Éligibles au pointage faciale</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-700 dark:text-teal-400 group-hover:scale-110 transition-transform shadow-inner ring-1 ring-teal-500/30">
              <ShieldCheck size={26} weight="bold" />
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Titre en Gros Plan avec Fond en Surbrillance - Section 02 Registre */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-black text-lg shadow-xs flex items-center gap-2">
            <SquaresFour weight="bold" className="w-5 h-5 text-emerald-600" />
            02. Filtres & Registre des Salariés
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-800" />
        </div>

        {/* 2. Control Bar (Filters & Search & View Modes) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} weight="bold" />
          <input
            type="text"
            placeholder="Rechercher par nom, matricule, département..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} weight="bold" />
            </button>
          )}
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Photo Status Filter Pill */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setFilterPhoto("tous")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                filterPhoto === "tous" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Tous ({stats.total})
            </button>
            <button
              onClick={() => setFilterPhoto("avec")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                filterPhoto === "avec" ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-600 hover:text-emerald-700"
              )}
            >
              <CheckCircle size={14} weight="bold" />
              Numérisées ({stats.avecPhoto})
            </button>
            <button
              onClick={() => setFilterPhoto("sans")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                filterPhoto === "sans" ? "bg-amber-500 text-white shadow-2xs" : "text-slate-600 hover:text-amber-700"
              )}
            >
              <WarningCircle size={14} weight="bold" />
              Manquantes ({stats.sansPhoto})
            </button>
          </div>

          {/* Department Selector */}
          {departements.length > 0 && (
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:border-[#059669]"
            >
              <option value="tous">Tous départements</option>
              {departements.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          {/* Export button */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-2xs"
          >
            <Download size={15} weight="bold" className="text-slate-500" />
            <span>Exporter CSV</span>
          </button>

          {/* View switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode("table")}
              title="Tableau Registre Numérique"
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === "table" ? "bg-white text-[#059669] shadow-2xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <ListBullets size={18} weight="bold" />
            </button>
            <button
              onClick={() => setViewMode("trombinoscope")}
              title="Vue Trombinoscope Galerie"
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === "trombinoscope" ? "bg-white text-[#059669] shadow-2xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <SquaresFour size={18} weight="bold" />
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* 3. Main Data Content Area */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-4">
            <IdentificationBadge size={36} weight="duotone" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Aucun collaborateur trouvé</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Aucun résultat ne correspond aux filtres appliqués dans le registre photo.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setFilterPhoto("tous");
              setFilterDept("tous");
            }}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW: DEDICATED DIGITAL PHOTO REGISTRY TABLE */
        <div className="pro-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/90 text-[11px] font-black text-slate-900 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Photo d'identité</th>
                  <th className="py-3.5 px-4">Matricule</th>
                  <th className="py-3.5 px-4">Collaborateur</th>
                  <th className="py-3.5 px-4">Département & Poste</th>
                  <th className="py-3.5 px-4 text-center">Statut Numérisation</th>
                  <th className="py-3.5 px-4 text-right">Actions Numériques</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Photo Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => emp.photo_url && setLightboxUrl({ url: emp.photo_url, name: emp.full_name })}
                          className={cn(
                            "relative h-11 w-11 rounded-xl overflow-hidden border shrink-0 flex items-center justify-center transition-all",
                            emp.photo_url
                              ? "border-emerald-300 bg-emerald-50 cursor-pointer hover:ring-2 hover:ring-emerald-500/30"
                              : "border-dashed border-amber-300 bg-amber-50/50"
                          )}
                        >
                          {emp.photo_url ? (
                            <img src={emp.photo_url} alt={emp.full_name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-amber-700">
                              {emp.full_name
                                .split(" ")
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Matricule */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{emp.matricule}</td>

                    {/* Collaborateur */}
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900">{emp.full_name}</div>
                      <div className="text-[11px] font-bold text-slate-700">{emp.email || emp.phone || "Aucun contact"}</div>
                    </td>

                    {/* Department & Poste */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                        <Building size={13} className="text-slate-700" />
                        {emp.departement || "Non affecté"}
                      </div>
                      <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mt-0.5">
                        <Briefcase size={12} className="text-slate-700" />
                        {emp.poste || "—"}
                      </div>
                    </td>

                    {/* Statut Numérisation */}
                    <td className="py-3 px-4 text-center">
                      {emp.photo_url ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <CheckCircle size={14} weight="bold" className="text-emerald-500" />
                          Numérisée
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                          <WarningCircle size={14} weight="bold" className="text-amber-500" />
                          Manquante
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {emp.photo_url && (
                          <button
                            onClick={() => setLightboxUrl({ url: emp.photo_url!, name: emp.full_name })}
                            title="Visualiser la photo HD"
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
                          >
                            <Eye size={16} weight="bold" />
                          </button>
                        )}
                        <button
                          onClick={() => setActiveUploadEmp(emp)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95",
                            emp.photo_url
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              : "bg-[#059669] hover:bg-[#e07200] text-white"
                          )}
                        >
                          <Camera size={14} weight="bold" />
                          <span>{emp.photo_url ? "Mettre à jour" : "Ajouter photo"}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>Affichage de <strong>{filteredEmployees.length}</strong> collaborateurs sur <strong>{employees.length}</strong></span>
            <span className="font-medium text-emerald-600">{stats.avecPhoto} photos enregistrées dans la base de données</span>
          </div>
        </div>
      ) : (
        /* TROMBINOSCOPE GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="pro-card p-5 hover:border-slate-300 transition-all flex flex-col items-center text-center relative group"
            >
              {/* Photo Card Container */}
              <div
                onClick={() => emp.photo_url && setLightboxUrl({ url: emp.photo_url, name: emp.full_name })}
                className={cn(
                  "relative h-28 w-28 rounded-2xl overflow-hidden border-2 mb-3 shadow-2xs flex items-center justify-center transition-all group-hover:scale-105",
                  emp.photo_url
                    ? "border-emerald-400 bg-emerald-50 cursor-pointer"
                    : "border-dashed border-amber-300 bg-amber-50/60"
                )}
              >
                {emp.photo_url ? (
                  <img src={emp.photo_url} alt={emp.full_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-amber-600">
                    <Camera size={28} weight="duotone" />
                    <span className="text-[10px] font-bold mt-1 uppercase">Pas de photo</span>
                  </div>
                )}
                {emp.photo_url && (
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Eye size={22} weight="bold" />
                  </div>
                )}
              </div>

              {/* Info */}
              <span className="font-mono text-[10px] font-black text-slate-900 uppercase tracking-wider">{emp.matricule}</span>
              <h4 className="text-sm font-extrabold text-slate-900 mt-0.5 line-clamp-1">{emp.full_name}</h4>
              <p className="text-xs font-black text-[#059669] mt-0.5">{emp.poste || "Poste non renseigné"}</p>
              <p className="text-[11px] font-bold text-slate-800 mt-0.5">{emp.departement || "Département N/A"}</p>

              {/* Status pill */}
              <div className="mt-3">
                {emp.photo_url ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Check size={12} weight="bold" /> Enregistrée
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    À numériser
                  </span>
                )}
              </div>

              {/* Direct upload action button */}
              <button
                onClick={() => setActiveUploadEmp(emp)}
                className="mt-4 w-full py-2 bg-slate-50 hover:bg-[#059669] hover:text-white text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-[#059669] flex items-center justify-center gap-1.5"
              >
                <Camera size={14} weight="bold" />
                <span>{emp.photo_url ? "Modifier photo" : "Numériser photo"}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 4. MODAL DIALOG FOR QUICK PHOTO UPLOAD & CAPTURE */}
      <AnimatePresence>
        {activeUploadEmp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-6 relative"
            >
              <button
                onClick={() => setActiveUploadEmp(null)}
                className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} weight="bold" />
              </button>

              <div>
                <div className="flex items-center gap-2 text-[#059669] text-xs font-bold uppercase tracking-wider">
                  <Camera size={16} weight="bold" />
                  Numérisation d'Identité
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  Photo de {activeUploadEmp.full_name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  Matricule : {activeUploadEmp.matricule} — {activeUploadEmp.departement || "RH"}
                </p>
              </div>

              {/* Component for Upload */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 flex flex-col items-center">
                <EmployeePhotoUpload
                  value={activeUploadEmp.photo_url}
                  fullName={activeUploadEmp.full_name}
                  onChange={(newUrl) => handlePhotoUpdate(activeUploadEmp.id, newUrl)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveUploadEmp(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. LIGHTBOX MODAL FOR HIGH-RES PHOTO PREVIEW */}
      <AnimatePresence>
        {lightboxUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={() => setLightboxUrl(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-lg w-full bg-white rounded-3xl p-4 shadow-2xl flex flex-col items-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightboxUrl(null)}
                className="absolute right-4 top-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
              >
                <X size={18} weight="bold" />
              </button>
              <div className="w-full h-80 rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
                <img src={lightboxUrl.url} alt={lightboxUrl.name} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="mt-3 text-center">
                <h4 className="text-base font-bold text-slate-900">{lightboxUrl.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Fiche photo numérisée — Haute définition</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
