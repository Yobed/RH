import { RagChat } from "@/components/rh/RagChat";
import { LegalDocUpload } from "@/components/rh/LegalDocUpload";

export const metadata = { title: "Agent Juridique — RH Manager CI" };

export default function AgentJuridiquePage() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-2xl font-bold">Agent Juridique</h1>
        <p className="text-sm text-muted-foreground">
          Assistant IA — Droit du Travail ivoirien (Loi 2015-532)
        </p>
      </div>
      <div className="flex-1 overflow-hidden bg-slate-50">
        <RagChat />
      </div>
      <LegalDocUpload />
    </div>
  );
}
