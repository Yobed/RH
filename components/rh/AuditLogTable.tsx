"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

export function AuditLogTable() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/audit?limit=${limit}&offset=${offset}`);
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
    };

    fetchLogs();
  }, [offset, limit]);

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      create: "bg-emerald-100 text-emerald-700 border-emerald-200",
      update: "bg-teal-100 text-teal-700 border-teal-200",
      delete: "bg-rose-100 text-rose-700 border-rose-200",
      archive: "bg-amber-100 text-amber-700 border-amber-200",
      approve: "bg-teal-100 text-teal-700 border-teal-200",
      reject: "bg-orange-100 text-orange-700 border-orange-200",
      login: "bg-slate-100 text-slate-700 border-slate-200",
    };
    const color = colors[action] || "bg-slate-100 text-slate-700 border-slate-200";
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${color}`}>
        {action}
      </span>
    );
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderDiff = (oldVal: any, newVal: any) => {
    if (!oldVal && !newVal) return null;
    
    // Simple key-value comparison
    const allKeys = Array.from(new Set([...Object.keys(oldVal || {}), ...Object.keys(newVal || {})]));
    const changes = allKeys.filter(k => JSON.stringify(oldVal?.[k]) !== JSON.stringify(newVal?.[k]));

    if (changes.length === 0) return <p className="text-xs text-slate-500 italic">Aucun changement détecté dans les valeurs suivies.</p>;

    return (
      <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
        {changes.map(k => (
          <div key={k} className="grid grid-cols-3 gap-2 text-[11px]">
            <span className="font-medium text-slate-500 uppercase truncate">{k}</span>
            <span className="text-rose-600 line-through truncate bg-rose-50 px-1 rounded">{String(oldVal?.[k] ?? "-")}</span>
            <span className="text-emerald-600 font-medium truncate bg-emerald-50 px-1 rounded">{String(newVal?.[k] ?? "-")}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="pro-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entité</th>
              <th className="px-4 py-3 text-right">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-4 py-4">
                    <div className="h-4 bg-slate-100 rounded w-full"></div>
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Aucun log d'audit trouvé.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <>
                  <tr 
                    key={log.id} 
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${expandedId === log.id ? 'bg-slate-50' : ''}`}
                    onClick={() => toggleExpand(log.id)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {format(new Date(log.created_at), "dd MMM HH:mm", { locale: fr })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 truncate max-w-[150px]">{log.user_name || "Système"}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{log.user_email || log.user_role}</div>
                    </td>
                    <td className="px-4 py-3">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700 font-medium uppercase text-[10px] tracking-wider">{log.entity_type}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[100px]">{log.entity_id}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <svg className={`h-4 w-4 text-slate-400 inline transition-transform ${expandedId === log.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={5} className="px-4 py-4 border-t border-slate-100">
                        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-inner">
                          <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Détails de l'événement
                          </h4>
                          
                          {log.details && (
                            <div className="mb-3 p-2 bg-slate-50 rounded text-[11px] text-slate-600 font-mono">
                              {JSON.stringify(log.details, null, 2)}
                            </div>
                          )}

                          {renderDiff(log.old_values, log.new_values)}

                          {!log.details && !log.old_values && !log.new_values && (
                            <p className="text-xs text-slate-500 italic">Aucune donnée supplémentaire disponible.</p>
                          )}
                          
                          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                            <span>ID Log: {log.id}</span>
                            <span>IP: {log.ip_address || "N/A"}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Simple */}
      <div className="flex items-center justify-between px-2">
        <p className="text-xs text-slate-500">
          Affichage de {logs.length} sur {count} événements
        </p>
        <div className="flex gap-2">
          <button
            disabled={offset === 0 || loading}
            onClick={() => setOffset(Math.max(0, offset - limit))}
            className="px-3 py-1 text-xs border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Précédent
          </button>
          <button
            disabled={offset + limit >= count || loading}
            onClick={() => setOffset(offset + limit)}
            className="px-3 py-1 text-xs border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
