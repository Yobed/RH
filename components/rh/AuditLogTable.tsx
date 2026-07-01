"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Columns,
  CaretDown,
  Check,
  MagnifyingGlass,
  ArrowClockwise,
  Info,
  Calendar,
  User,
  Shield,
  Tag,
  Link as LinkIcon,
  ShieldWarning
} from "@phosphor-icons/react";

interface AuditLog {
  id: string;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  old_values: any;
  new_values: any;
  ip_address: string | null;
}

const PAGE_NAMES: Record<string, string> = {
  "/rh": "Tableau de bord",
  "/employes": "Collaborateurs",
  "/employes/photos": "Trombinoscope",
  "/employes/organigramme": "Organigramme",
  "/contrats": "Contrats",
  "/conges": "Absences & Congés",
  "/pointage": "Pointage & Temps",
  "/heures-sup": "Heures sup.",
  "/medical": "Santé / Visite Médicale",
  "/onboarding": "Intégration (Onboarding)",
  "/offboarding": "Départs (Offboarding)",
  "/planning": "Planning & Équipes",
  "/planning-gantt": "Planning Gantt",
  "/conges/heatmap": "Heatmap Absences",
  "/paie": "Bulletins de paie",
  "/paie/generer-lot": "Génération de paie",
  "/paie/bordereau": "Bordereau virement",
  "/paie/anomalies": "Anomalies de paie",
  "/paie/fin-de-contrat": "Solde tout compte",
  "/declarations": "Déclarations sociales",
  "/analyses": "Masse Salariale",
  "/paie/import-sage": "Import Sage",
  "/analytique": "Analytique RH",
  "/analytique/focus": "Focus stratégique",
  "/analytique/risque-depart": "Risque de départ",
  "/analytique/prevision": "Prévision effectifs",
  "/analytique/cohortes": "Cohortes d'embauche",
  "/analytique/retraite": "Départs retraite",
  "/documents-rh": "Documents RH",
  "/ged": "GED (Numérisation)",
  "/archives": "Archives",
  "/recrutement": "Recrutement",
  "/evaluations": "Évaluations",
  "/formation": "Formation (FDFP)",
  "/disciplinaire": "Disciplinaire",
  "/contentieux": "Contentieux",
  "/qhse": "QHSE / Accidents",
  "/duerp": "DUERP",
  "/bilan-social": "Bilan social",
  "/reporting": "Reporting",
  "/messages": "Messagerie",
  "/notifications": "Notifications",
  "/agent-juridique": "Assistant IA",
  "/calculateur": "Simulateur de paie",
  "/parametres": "Paramètres",
  "/parametres/workflows": "Workflows",
  "/parametres/permissions": "Permissions",
  "/parametres/audit": "Journal d'audit",
  "/parametres/whatsapp": "WhatsApp",
  "/parametres/webhooks": "Webhooks",
  "/parametres/api": "API & Clés",
};

const getPageDisplayName = (log: AuditLog) => {
  const path = log.details?.page_path;
  if (path) {
    if (PAGE_NAMES[path]) return PAGE_NAMES[path];
    const foundKey = Object.keys(PAGE_NAMES).find(k => path.startsWith(k));
    if (foundKey) return PAGE_NAMES[foundKey];
    return path;
  }

  // Fallback map based on entity_type
  const entityMapping: Record<string, string> = {
    employee: "Collaborateurs",
    contract: "Contrats",
    conge: "Absences & Congés",
    rtt: "Absences & Congés",
    bulletin: "Bulletins de paie",
    paie: "Bulletins de paie",
    disciplinary: "Disciplinaire",
    accident: "QHSE & Accidents",
    qhse: "QHSE & Accidents",
    evaluation: "Évaluations",
    formation: "Formation",
    duerp: "DUERP",
    legal_case: "Contentieux",
    user: "Paramètres",
    profile: "Paramètres",
    auth: "Connexion",
    workflow: "Workflows",
    document: "GED"
  };

  const entityLower = log.entity_type.toLowerCase();
  return entityMapping[entityLower] || log.entity_type;
};

export function AuditLogTable() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState("all");

  // Columns visibility state
  const [columns, setColumns] = useState({
    date: { label: "Date & Heure", visible: true },
    user: { label: "Utilisateur", visible: true },
    role: { label: "Rôle", visible: false },
    action: { label: "Action", visible: true },
    page: { label: "Page / Source", visible: true },
    entity: { label: "Entité", visible: true },
    ip: { label: "Adresse IP", visible: false },
    details: { label: "Détails", visible: true },
  });

  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setOffset(0); // Reset to first page on search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/audit?limit=${limit}&offset=${offset}`;
      if (actionFilter && actionFilter !== "all") {
        url += `&action=${actionFilter}`;
      }
      if (entityTypeFilter && entityTypeFilter !== "all") {
        url += `&entity_type=${entityTypeFilter}`;
      }
      if (debouncedSearch) {
        url += `&search=${encodeURIComponent(debouncedSearch)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.data) {
        setLogs(data.data);
        setCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
    }
  }, [offset, limit, actionFilter, entityTypeFilter, debouncedSearch]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleColumn = (key: keyof typeof columns) => {
    setColumns(prev => ({
      ...prev,
      [key]: { ...prev[key], visible: !prev[key].visible }
    }));
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      create: "bg-emerald-50 text-emerald-700 border-emerald-250/50",
      update: "bg-[#ee7f03]/10 text-[#ee7f03] border-[#ee7f03]/20",
      delete: "bg-rose-50 text-rose-700 border-rose-250/50",
      archive: "bg-amber-50 text-amber-700 border-amber-250/50",
      approve: "bg-emerald-50 text-emerald-700 border-emerald-250/50",
      reject: "bg-orange-50 text-orange-700 border-orange-250/50",
      login: "bg-blue-50 text-blue-700 border-blue-250/50",
      upload: "bg-indigo-50 text-indigo-700 border-indigo-250/50",
      download: "bg-purple-50 text-purple-700 border-purple-250/50",
    };
    const labels: Record<string, string> = {
      create: "Création",
      update: "Modification",
      delete: "Suppression",
      archive: "Archivage",
      approve: "Validation",
      reject: "Rejet",
      login: "Connexion",
      upload: "Téléversement",
      download: "Téléchargement",
    };
    const color = colors[action] || "bg-slate-50 text-slate-700 border-slate-205/50";
    const label = labels[action] || action;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${color}`}>
        {label}
      </span>
    );
  };

  const renderDiff = (oldVal: any, newVal: any) => {
    if (!oldVal && !newVal) return null;

    const allKeys = Array.from(new Set([...Object.keys(oldVal || {}), ...Object.keys(newVal || {})]));
    const changes = allKeys.filter(k => JSON.stringify(oldVal?.[k]) !== JSON.stringify(newVal?.[k]));

    if (changes.length === 0) return <p className="text-xs text-slate-500 italic">Aucun changement détecté dans les valeurs suivies.</p>;

    return (
      <div className="mt-2 space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2">
        {changes.map(k => (
          <div key={k} className="grid grid-cols-3 gap-2 text-[11px]">
            <span className="font-medium text-slate-500 uppercase truncate">{k}</span>
            <span className="text-rose-600 line-through truncate bg-rose-50/50 px-1.5 py-0.5 rounded">{String(oldVal?.[k] ?? "-")}</span>
            <span className="text-emerald-600 font-medium truncate bg-emerald-50/50 px-1.5 py-0.5 rounded">{String(newVal?.[k] ?? "-")}</span>
          </div>
        ))}
      </div>
    );
  };

  const visibleColumnsCount = Object.values(columns).filter(col => col.visible).length;

  return (
    <div className="space-y-4">
      {/* ── Control panel Odoo-inspired ── */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3">
        {/* Left: Filters and Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-48 rounded-md border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-850 outline-none focus:border-[#ee7f03] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setOffset(0); }}
            className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-[13px] font-medium text-slate-700 outline-none focus:border-[#ee7f03] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Toutes les actions</option>
            <option value="create">Créations</option>
            <option value="update">Modifications</option>
            <option value="delete">Suppressions</option>
            <option value="approve">Approbations</option>
            <option value="reject">Rejets</option>
            <option value="login">Connexions</option>
            <option value="archive">Archivages</option>
          </select>

          <select
            value={entityTypeFilter}
            onChange={(e) => { setEntityTypeFilter(e.target.value); setOffset(0); }}
            className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-[13px] font-medium text-slate-700 outline-none focus:border-[#ee7f03] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="all">Tous les modules</option>
            <option value="employee">Collaborateurs</option>
            <option value="contract">Contrats</option>
            <option value="conge">Absences & Congés</option>
            <option value="bulletin">Bulletins de paie</option>
            <option value="disciplinary">Disciplinaire</option>
            <option value="accident">Accidents & QHSE</option>
            <option value="evaluation">Évaluations</option>
            <option value="formation">Formations</option>
            <option value="duerp">DUERP</option>
          </select>
        </div>

        {/* Right: Columns Selector & Refresh */}
        <div className="flex items-center gap-2 justify-end">
          <div className="relative">
            <button
              onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50 outline-none focus:border-[#ee7f03] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
            >
              <Columns size={15} />
              <span>Colonnes</span>
              <CaretDown size={12} className={`transition-transform duration-200 ${isColumnMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isColumnMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsColumnMenuOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-48 rounded-md border border-slate-200 bg-white p-2 shadow-lg z-20 dark:border-slate-700 dark:bg-slate-800">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Colonnes du journal
                  </div>
                  <div className="h-px my-1 bg-slate-100 dark:bg-slate-700" />
                  <div className="space-y-0.5">
                    {Object.entries(columns).map(([key, col]) => (
                      <button
                        key={key}
                        onClick={() => toggleColumn(key as keyof typeof columns)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${col.visible ? 'bg-[#ee7f03] border-[#ee7f03] text-white' : 'bg-transparent border-slate-350 dark:border-slate-650'}`}>
                          {col.visible && <Check size={10} weight="bold" />}
                        </span>
                        <span>{col.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={fetchLogs}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 transition-colors animate-hover"
            title="Actualiser"
          >
            <ArrowClockwise size={15} />
          </button>
        </div>
      </div>

      {/* ── Table container ── */}
      <div className="pro-card overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-850">
              <tr>
                {columns.date.visible && <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>}
                {columns.user.visible && <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Utilisateur</th>}
                {columns.role.visible && <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Rôle</th>}
                {columns.action.visible && <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>}
                {columns.page.visible && <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Page / Source</th>}
                {columns.entity.visible && <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Entité</th>}
                {columns.ip.visible && <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Adresse IP</th>}
                {columns.details.visible && <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 w-12">Détails</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={visibleColumnsCount} className="px-4 py-4">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnsCount} className="px-4 py-8 text-center text-slate-500">
                    Aucun log d'audit trouvé.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <Fragment key={log.id}>
                    <tr
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors cursor-pointer ${expandedId === log.id ? 'bg-slate-50 dark:bg-slate-800/30' : ''}`}
                      onClick={() => toggleExpand(log.id)}
                    >
                      {columns.date.visible && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-xs">
                          {format(new Date(log.created_at), "dd MMM HH:mm", { locale: fr })}
                        </td>
                      )}
                      {columns.user.visible && (
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px] text-xs">{log.user_name || "Système"}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{log.user_email || log.user_role}</div>
                        </td>
                      )}
                      {columns.role.visible && (
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-350 whitespace-nowrap">
                          {log.user_role || "Système"}
                        </td>
                      )}
                      {columns.action.visible && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getActionBadge(log.action)}
                        </td>
                      )}
                      {columns.page.visible && (
                        <td className="px-4 py-3">
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#ee7f03]" />
                            {getPageDisplayName(log)}
                          </div>
                          {log.details?.page_path && (
                            <div className="text-[9px] text-slate-400 font-mono truncate max-w-[160px] mt-0.5">{log.details.page_path}</div>
                          )}
                        </td>
                      )}
                      {columns.entity.visible && (
                        <td className="px-4 py-3">
                          <div className="text-slate-700 dark:text-slate-300 font-semibold uppercase text-[10px] tracking-wider">{log.entity_type}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px] mt-0.5">{log.entity_id || "N/A"}</div>
                        </td>
                      )}
                      {columns.ip.visible && (
                        <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">
                          {log.ip_address || "N/A"}
                        </td>
                      )}
                      {columns.details.visible && (
                        <td className="px-4 py-3 text-right">
                          <CaretDown size={14} className={`text-slate-400 inline transition-transform duration-200 ${expandedId === log.id ? 'rotate-180' : ''}`} />
                        </td>
                      )}
                    </tr>
                    {expandedId === log.id && (
                      <tr className="bg-slate-50/30 dark:bg-slate-900/10">
                        <td colSpan={visibleColumnsCount} className="px-4 py-4 border-t border-slate-100 dark:border-slate-800">
                          <div className="bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-2.5 flex items-center gap-2">
                              <Info size={14} className="text-[#ee7f03]" />
                              Détails de l'événement d'audit
                            </h4>

                            {log.details && (
                              <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-md text-[11px] text-slate-600 dark:text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-60">
                                {JSON.stringify(log.details, null, 2)}
                              </div>
                            )}

                            {renderDiff(log.old_values, log.new_values)}

                            {!log.details && !log.old_values && !log.new_values && (
                              <p className="text-xs text-slate-500 italic">Aucune donnée supplémentaire disponible.</p>
                            )}

                            <div className="mt-3.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5 font-mono">
                              <span>ID Log: {log.id}</span>
                              <span>IP de l'utilisateur: {log.ip_address || "N/A"}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination Simple ── */}
      <div className="flex items-center justify-between px-2 py-1">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Affichage de {logs.length} sur {count} événements
        </p>
        <div className="flex gap-2">
          <button
            disabled={offset === 0 || loading}
            onClick={() => setOffset(Math.max(0, offset - limit))}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors rounded-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-250 dark:hover:bg-slate-700"
          >
            Précédent
          </button>
          <button
            disabled={offset + limit >= count || loading}
            onClick={() => setOffset(offset + limit)}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors rounded-md dark:border-slate-700 dark:bg-slate-800 dark:text-slate-250 dark:hover:bg-slate-700"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}

