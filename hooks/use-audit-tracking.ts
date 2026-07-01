"use client";

import { useState, useEffect } from "react";

export interface AuditRecord {
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  action: string;
  details: any;
}

export interface EntityAuditInfo {
  create?: AuditRecord;
  update?: AuditRecord;
  approve?: AuditRecord;
  reject?: AuditRecord;
  archive?: AuditRecord;
  delete?: AuditRecord;
}

export function useAuditTracking(entityType: string, enabled: boolean) {
  const [loading, setLoading] = useState(false);
  const [auditMap, setAuditMap] = useState<Record<string, EntityAuditInfo>>({});

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;
    async function fetchLogs() {
      setLoading(true);
      try {
        // Query the audit API for the entity type
        const res = await fetch(`/api/audit?limit=200&entity_type=${entityType}`);
        if (!res.ok) throw new Error("Failed to fetch audit logs");
        const data = await res.json();
        
        if (data.data && isMounted) {
          const map: Record<string, EntityAuditInfo> = {};
          
          // Audit logs are ordered by created_at descending (newest first)
          // We loop backwards to process oldest first, so newest updates override older ones
          const logs = [...data.data].reverse();
          
          logs.forEach((log: any) => {
            if (!log.entity_id) return;
            const id = log.entity_id;
            if (!map[id]) map[id] = {};
            
            const record: AuditRecord = {
              created_at: log.created_at,
              user_name: log.user_name,
              user_email: log.user_email,
              action: log.action,
              details: log.details
            };

            if (log.action === "create") {
              map[id].create = record;
            } else if (log.action === "update") {
              map[id].update = record;
            } else if (log.action === "approve") {
              map[id].approve = record;
            } else if (log.action === "reject") {
              map[id].reject = record;
            } else if (log.action === "archive") {
              map[id].archive = record;
            } else if (log.action === "delete") {
              map[id].delete = record;
            }
          });
          
          setAuditMap(map);
        }
      } catch (err) {
        console.error("[useAuditTracking] error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLogs();

    return () => {
      isMounted = false;
    };
  }, [entityType, enabled]);

  return { loading, auditMap };
}
