"use client";

import { Info, Gavel, Clock, AlertCircle } from "lucide-react";

interface LegalCounselSidebarProps {
  type: string;
  statut: string;
}

export function LegalCounselSidebar({ type, statut }: LegalCounselSidebarProps) {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
          <Gavel className="h-4 w-4" />
          Rappel Légal (CIV)
        </div>
        <div className="space-y-3">
          {type === "DEMANDE_EXPLICATION" && (
            <div className="text-xs text-amber-900 leading-relaxed space-y-2">
              <p>
                <strong>Délai de réponse :</strong> Bien qu'aucun délai ne soit fixé par le Code du Travail, l'usage prévoit <strong>48 heures</strong>.
              </p>
              <p>
                <strong>Validité :</strong> La demande d'explications est un préalable obligatoire à toute sanction disciplinaire (Art. 18.2 de la Convention Collective).
              </p>
            </div>
          )}
          
          {type === "AVERTISSEMENT" && (
            <div className="text-xs text-amber-900 leading-relaxed space-y-2">
              <p>
                <strong>Limites :</strong> L'avertissement ne doit pas entraîner de retenue de salaire.
              </p>
              <p>
                <strong>Prescription :</strong> Un fait connu depuis plus de <strong>2 mois</strong> ne peut plus être sanctionné, sauf si des poursuites pénales ont été engagées.
              </p>
            </div>
          )}

          {type === "MISE_A_PIED" && (
            <div className="text-xs text-amber-900 leading-relaxed space-y-2">
              <p>
                <strong>Durée :</strong> Pour une faute grave, la mise à pied conservatoire peut être prescrite jusqu'à la décision finale.
              </p>
              <p>
                <strong>Conséquence :</strong> Suspension du contrat et du salaire pendant la durée de la mise à pied disciplinaire.
              </p>
            </div>
          )}

          <div className="flex items-start gap-2 bg-white/50 p-2 rounded border border-amber-200/50">
            <Clock className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-700 italic">
              Assurez-vous que le courrier est remis en main propre contre décharge ou par lettre recommandée.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-2">
          <Info className="h-4 w-4" />
          Bonnes Pratiques
        </div>
        <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
          <li>Évitez les termes émotionnels dans les motifs.</li>
          <li>Restez factuel : dates, lieux, témoins si possible.</li>
          <li>Précisez les conséquences sur le service.</li>
          <li>Archivez systématiquement les preuves.</li>
        </ul>
      </div>

      {statut === "OUVERT" && (
        <div className="bg-[#ee7f03]/10 border border-[#ee7f03]/30 rounded-xl p-4 animate-pulse">
          <div className="flex items-center gap-2 text-[#d67002] font-bold text-sm mb-1">
            <AlertCircle className="h-4 w-4" />
            Étape recommandée
          </div>
          <p className="text-xs text-[#ee7f03]">
            Veuillez notifier l'employé et enregistrer la date de notification pour le suivi des délais.
          </p>
        </div>
      )}
    </div>
  );
}
