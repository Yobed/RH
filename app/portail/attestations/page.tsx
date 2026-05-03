import { AttestationSelfService } from "@/components/rh/AttestationSelfService";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes attestations — Portail salarié" };

export default function AttestationsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Mes attestations
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Générez vos attestations de salaire ou de travail en un clic. Le document est prêt à imprimer pour votre banque ou vos démarches.
        </p>
      </header>

      <AttestationSelfService />
    </div>
  );
}
