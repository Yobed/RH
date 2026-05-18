/**
 * Modèle de checklist d'offboarding (sortie) pour un salarié quittant l'entreprise.
 * Couvre la restitution des biens, les formalités administratives CT-CI,
 * et les obligations post-rupture (certificat de travail Art. 16-11, attestations CNPS).
 */

export type OffboardingCategory = "biens" | "acces" | "administratif" | "paie" | "humain";

export interface OffboardingItem {
  id: string;
  category: OffboardingCategory;
  title: string;
  description: string;
  legal_ref?: string;
  done: boolean;
  done_at?: string | null;
  done_by?: string | null;
  comment?: string | null;       // ex : « PC en bon état » / « clé manquante »
  due_offset_days?: number;      // jours avant date sortie (négatif) ou après (positif)
}

const DEFAULT_TEMPLATE: ReadonlyArray<Omit<OffboardingItem, "done" | "done_at" | "done_by" | "comment">> = [
  // ── Biens matériels à restituer ──────────────────────────────────────
  {
    id: "badge-acces",
    category: "biens",
    title: "Badge d'accès / clé physique",
    description: "Restitution du badge d'accès locaux et/ou des clés.",
    due_offset_days: 0,
  },
  {
    id: "ordinateur",
    category: "biens",
    title: "Ordinateur portable / fixe",
    description: "Restitution avec accessoires (chargeur, souris, sacoche).",
    due_offset_days: 0,
  },
  {
    id: "telephone-pro",
    category: "biens",
    title: "Téléphone professionnel + SIM",
    description: "Restitution du téléphone, chargeur et carte SIM. Désactiver la ligne le cas échéant.",
    due_offset_days: 0,
  },
  {
    id: "vehicule-fonction",
    category: "biens",
    title: "Véhicule de fonction / carte essence",
    description: "Restitution avec carte grise, clés, carte essence. État des lieux contradictoire.",
    due_offset_days: 0,
  },
  {
    id: "uniforme-epi",
    category: "biens",
    title: "Tenue / Uniforme / EPI",
    description: "Restitution des équipements de travail et EPI.",
    due_offset_days: 0,
  },
  {
    id: "documents-confidentiels",
    category: "biens",
    title: "Documents confidentiels / dossiers clients",
    description: "Restitution ou destruction certifiée des supports papiers et numériques.",
    due_offset_days: 0,
  },

  // ── Accès numériques à révoquer ──────────────────────────────────────
  {
    id: "comptes-it",
    category: "acces",
    title: "Désactiver comptes IT (email, intranet, VPN)",
    description: "Désactivation effective le dernier jour à 23h59 — pas avant.",
    due_offset_days: 0,
  },
  {
    id: "apps-saas",
    category: "acces",
    title: "Révoquer accès SaaS (CRM, comptabilité, Slack…)",
    description: "Lister puis désactiver tous les outils où l'employé avait un compte nominatif.",
    due_offset_days: 0,
  },
  {
    id: "transfert-emails",
    category: "acces",
    title: "Mettre en place transfert email vers le manager",
    description: "Auto-répondeur 90 jours + transfert vers le responsable hiérarchique.",
    due_offset_days: 1,
  },

  // ── Administratif & légal ────────────────────────────────────────────
  {
    id: "certificat-travail",
    category: "administratif",
    title: "Certificat de travail remis (obligatoire)",
    description: "Document obligatoire à remettre au salarié à la sortie.",
    legal_ref: "Art. 16-11 CT-CI",
    due_offset_days: 0,
  },
  {
    id: "attestation-cnps",
    category: "administratif",
    title: "Attestation CNPS pour chômage",
    description: "Établir l'attestation CNPS — base de l'allocation chômage le cas échéant.",
    due_offset_days: 0,
  },
  {
    id: "recu-stc",
    category: "administratif",
    title: "Reçu pour Solde de Tout Compte signé",
    description: "Reçu STC daté et signé par le salarié (à conserver 5 ans).",
    legal_ref: "Art. 16-11 CT-CI",
    due_offset_days: 0,
  },
  {
    id: "dossier-archive",
    category: "administratif",
    title: "Archiver le dossier RH (5 ans minimum)",
    description: "Conservation obligatoire du dossier complet pendant 5 ans après la sortie.",
    legal_ref: "Code du Travail CI",
    due_offset_days: 30,
  },

  // ── Paie & finances ──────────────────────────────────────────────────
  {
    id: "bulletin-final",
    category: "paie",
    title: "Bulletin de paie final édité",
    description: "Bulletin du dernier mois travaillé + STC, virement effectué.",
    due_offset_days: 0,
  },
  {
    id: "indemnites-versees",
    category: "paie",
    title: "Indemnités versées (préavis, licenciement, congés)",
    description: "Versement de toutes les indemnités dues selon motif de rupture.",
    due_offset_days: 0,
  },

  // ── Humain ───────────────────────────────────────────────────────────
  {
    id: "entretien-sortie",
    category: "humain",
    title: "Entretien de sortie (exit interview)",
    description: "Recueil du feedback du salarié sur son expérience et raisons du départ.",
    due_offset_days: -7,
  },
  {
    id: "passation",
    category: "humain",
    title: "Passation effectuée",
    description: "Documents de passation rédigés, formation du remplaçant/équipe.",
    due_offset_days: -3,
  },
];

export function buildDefaultOffboardingChecklist(): OffboardingItem[] {
  return DEFAULT_TEMPLATE.map((item) => ({
    ...item,
    done: false,
    done_at: null,
    done_by: null,
    comment: null,
  }));
}

export const OFFBOARDING_CATEGORY_LABELS: Record<OffboardingCategory, string> = {
  biens: "Biens à restituer",
  acces: "Accès à révoquer",
  administratif: "Administratif & légal",
  paie: "Paie & indemnités",
  humain: "Humain",
};

export interface OffboardingProgress {
  done: number;
  total: number;
  pct: number;
}

export function offboardingProgress(items: readonly OffboardingItem[]): OffboardingProgress {
  const total = items.length;
  const done = items.filter((it) => it.done).length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export function offboardingOverdueItems(
  items: readonly OffboardingItem[],
  dateSortiePrevue: string | null | undefined
): OffboardingItem[] {
  if (!dateSortiePrevue) return [];
  const sortie = new Date(dateSortiePrevue);
  if (Number.isNaN(sortie.getTime())) return [];
  const today = new Date();
  return items.filter((it) => {
    if (it.done) return false;
    const dueOffset = it.due_offset_days ?? 0;
    const due = new Date(sortie);
    due.setDate(due.getDate() + dueOffset);
    return due < today;
  });
}
