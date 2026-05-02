/**
 * Modèle de checklist d'onboarding pour un nouveau salarié.
 * Conforme aux obligations CT-CI : DPAE 8j, visite médicale d'embauche,
 * remise du règlement intérieur (Art. 24), consentement RGPD-CI.
 */

export interface OnboardingItem {
  id: string;
  category: "legal" | "admin" | "technique" | "humain";
  title: string;
  description: string;
  legal_ref?: string;
  done: boolean;
  done_at?: string | null;
  done_by?: string | null;
  due_offset_days?: number; // jours après date d'embauche
  resource?: { type: string; id?: string };  // lien vers ressource (doc, visite, contrat)
}

export const DEFAULT_ONBOARDING_ITEMS: ReadonlyArray<Omit<OnboardingItem, "done" | "done_at" | "done_by">> = [
  {
    id: "contrat-pdf",
    category: "legal",
    title: "Contrat de travail signé",
    description: "Imprimer le contrat, le faire signer par le salarié et l'employeur.",
    legal_ref: "Art. 14 CT-CI",
    due_offset_days: 0,
  },
  {
    id: "dpae",
    category: "legal",
    title: "DPAE — Déclaration Préalable à l'Embauche",
    description: "À transmettre à la CNPS sous 8 jours suivant l'embauche.",
    legal_ref: "Art. 33 CT-CI",
    due_offset_days: 8,
    resource: { type: "document", id: "dpae" },
  },
  {
    id: "visite-medicale",
    category: "legal",
    title: "Visite médicale d'embauche",
    description: "Obligatoire avant ou dans le mois suivant la prise de poste.",
    legal_ref: "Art. 41 CT-CI",
    due_offset_days: 30,
    resource: { type: "medical_visit" },
  },
  {
    id: "consentement-rgpd",
    category: "legal",
    title: "Consentement données personnelles",
    description: "Recueil du consentement explicite (Loi 2013-450 ARTCI).",
    legal_ref: "Art. 35 Loi 2013-450",
    due_offset_days: 0,
  },
  {
    id: "reglement-interieur",
    category: "legal",
    title: "Règlement intérieur remis",
    description: "Remise contre décharge du règlement intérieur.",
    legal_ref: "Art. 24 CT-CI",
    due_offset_days: 0,
  },
  {
    id: "rib",
    category: "admin",
    title: "RIB ou Mobile Money fourni",
    description: "Pour le virement du salaire mensuel.",
    due_offset_days: 7,
  },
  {
    id: "compte-email",
    category: "technique",
    title: "Compte email entreprise",
    description: "Création du compte mail professionnel.",
    due_offset_days: 1,
  },
  {
    id: "badge-acces",
    category: "technique",
    title: "Badge d'accès aux locaux",
    description: "Provisionnement du badge pour les zones de travail.",
    due_offset_days: 1,
  },
  {
    id: "equipement",
    category: "technique",
    title: "Équipement (PC, téléphone)",
    description: "Remise de l'équipement informatique nécessaire.",
    due_offset_days: 1,
  },
  {
    id: "formation-securite",
    category: "humain",
    title: "Formation sécurité au poste",
    description: "Briefing sécurité, EPI, procédures d'urgence (Art. 41).",
    legal_ref: "Décret 96-204",
    due_offset_days: 7,
  },
  {
    id: "presentation-equipe",
    category: "humain",
    title: "Présentation de l'équipe",
    description: "Tour des locaux et présentation des collègues.",
    due_offset_days: 0,
  },
  {
    id: "objectifs-30j",
    category: "humain",
    title: "Objectifs 30 jours fixés",
    description: "Premier brief avec le manager pour cadrer les attentes.",
    due_offset_days: 14,
  },
];

export function buildDefaultChecklist(): OnboardingItem[] {
  return DEFAULT_ONBOARDING_ITEMS.map((i) => ({
    ...i,
    done: false,
    done_at: null,
    done_by: null,
  }));
}

export function progressOf(items: OnboardingItem[]): { done: number; total: number; pct: number } {
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, pct };
}

export function overdueItems(items: OnboardingItem[], dateEmbauche: string | null): OnboardingItem[] {
  if (!dateEmbauche) return [];
  const embauche = new Date(dateEmbauche);
  const today = new Date();
  return items.filter((i) => {
    if (i.done) return false;
    if (i.due_offset_days === undefined) return false;
    const due = new Date(embauche);
    due.setDate(due.getDate() + i.due_offset_days);
    return due < today;
  });
}
