import { BadgeCheck } from "lucide-react";
import { AttestationSelfService } from "@/components/rh/AttestationSelfService";
import { PortailHeader } from "../PortailHeader";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes attestations — Portail salarié" };

export default function AttestationsPage() {
  return (
    <div className="space-y-6">
      <PortailHeader
        title="Mes attestations"
        subtitle="Générez vos attestations de salaire ou de travail en un clic. Le document est prêt à imprimer pour votre banque ou vos démarches."
        icon={BadgeCheck}
      />

      <AttestationSelfService />
    </div>
  );
}
