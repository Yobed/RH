import { AlertTriangle, Clock, FileText, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface AlertItem {
  id: string;
  type: "CONTRACT" | "TRIAL" | "MEDICAL" | "DOCUMENT";
  label: string;
  employeeName: string;
  date?: string;
  urgency: "high" | "medium" | "low";
}

interface ComplianceAlertListProps {
  alerts: AlertItem[];
}

export function ComplianceAlertList({ alerts }: ComplianceAlertListProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Points de vigilance prioritaires</h2>
        </div>
        <Badge variant="outline" className="bg-white">{alerts.length} alertes</Badge>
      </div>
      <div className="divide-y">
        {alerts.map((alert, i) => (
          <div key={i} className="px-5 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                alert.type === "CONTRACT" ? "bg-amber-100 text-amber-600" :
                alert.type === "TRIAL" ? "bg-orange-100 text-orange-600" :
                alert.type === "MEDICAL" ? "bg-sky-100 text-sky-600" :
                "bg-red-100 text-red-600"
              }`}>
                {alert.type === "CONTRACT" && <FileText className="h-4 w-4" />}
                {alert.type === "TRIAL" && <Clock className="h-4 w-4" />}
                {alert.type === "MEDICAL" && <Activity className="h-4 w-4" />}
                {alert.type === "DOCUMENT" && <AlertTriangle className="h-4 w-4" />}
              </div>
              <div>
                <Link href={`/rh/employes/${alert.id}`} className="text-sm font-bold hover:underline decoration-slate-300 underline-offset-2">
                  {alert.employeeName}
                </Link>
                <p className="text-xs text-muted-foreground">{alert.label} {alert.date && `• Expire le ${new Date(alert.date).toLocaleDateString('fr-FR')}`}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-right">
               {alert.urgency === "high" && <Badge className="bg-red-500 hover:bg-red-600 text-[10px]">Urgent</Badge>}
               {alert.urgency === "medium" && <Badge className="bg-amber-500 hover:bg-amber-600 text-[10px]">Action requise</Badge>}
               <Link 
                href={`/rh/employes/${alert.id}`} 
                className="text-[11px] font-bold text-primary hover:bg-primary/5 px-2 py-1 rounded border border-primary/20 transition-all font-mono uppercase"
               >
                Gérer
               </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
