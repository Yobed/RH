import type { DocumentTemplate, TemplateData } from "./types";

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-CI", { maximumFractionDigits: 0 }).format(Math.round(n)) + " FCFA";

const civile = (genre: string) => (genre === "F" ? "Madame" : "Monsieur");
const salutations = (genre: string) =>
  genre === "F"
    ? "Veuillez agréer, Madame, l'expression de nos salutations distinguées."
    : "Veuillez agréer, Monsieur, l'expression de nos salutations distinguées.";

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  // ─── CONTRATS ────────────────────────────────────────────────────────────────
  {
    id: "contrat_cdi",
    label: "Contrat de travail CDI",
    group: "Contrats",
    description: "Contrat à durée indéterminée conforme Code du Travail CI",
    variables_custom: [
      { key: "date_prise_effet", label: "Date de prise d'effet", placeholder: "01/05/2026", required: true },
      { key: "lieu_travail", label: "Lieu de travail", placeholder: "Abidjan, Plateau" },
      { key: "duree_essai", label: "Période d'essai", placeholder: "3 mois" },
    ],
    generate: (d: TemplateData) => {
      const v = d.variables_custom;
      return `CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE

Entre les soussignés :

${d.entreprise.nom.toUpperCase()}
Siège social : ${d.entreprise.adresse}, ${d.entreprise.ville}
N° CNPS employeur : ${d.entreprise.cnps}
Ci-après dénommé « l'Employeur »,

ET

${d.employe.nom_complet.toUpperCase()}
Matricule : ${d.employe.matricule}
Ci-après dénommé « le Salarié »,

IL A ÉTÉ CONVENU CE QUI SUIT :

ARTICLE 1 — ENGAGEMENT
L'Employeur engage ${civile(d.employe.genre)} ${d.employe.nom_complet} en qualité de ${d.employe.poste}, au sein du département ${d.employe.departement}, à compter du ${v.date_prise_effet || d.employe.date_embauche}.

ARTICLE 2 — DURÉE
Le présent contrat est conclu pour une durée indéterminée conformément aux articles 14 et suivants du Code du Travail ivoirien (Loi n°2015-532).

ARTICLE 3 — PÉRIODE D'ESSAI
Le Salarié est soumis à une période d'essai de ${v.duree_essai || "3 mois"}, renouvelable une fois, conformément à l'article 16 du Code du Travail CI.

ARTICLE 4 — FONCTIONS
${civile(d.employe.genre)} ${d.employe.nom_complet} exercera les fonctions de ${d.employe.poste}, catégorie ${d.employe.categorie}. Ces fonctions pourront évoluer selon les nécessités du service.

ARTICLE 5 — LIEU DE TRAVAIL
Le lieu habituel de travail est fixé à ${v.lieu_travail || d.entreprise.ville}. L'Employeur se réserve le droit de modifier ce lieu de travail en cas de nécessité.

ARTICLE 6 — RÉMUNÉRATION
Le Salarié percevra un salaire brut mensuel de ${fmt(d.employe.salaire_brut)}, conformément à la grille de classification de la Convention Collective Interprofessionnelle ASSIM-UGTCI.

ARTICLE 7 — DURÉE DU TRAVAIL
La durée du travail est fixée à 40 heures par semaine, soit 173,33 heures par mois, conformément à l'article 21.1 du Code du Travail CI.

ARTICLE 8 — CONGÉS PAYÉS
${civile(d.employe.genre)} ${d.employe.nom_complet} bénéficie de 2,2 jours ouvrables de congé par mois de service, soit 26,4 jours par an.

ARTICLE 9 — OBLIGATIONS DES PARTIES
Le Salarié s'engage à respecter le règlement intérieur de l'entreprise, la convention collective applicable et toutes les instructions données par sa hiérarchie. L'Employeur s'engage à respecter les dispositions du Code du Travail CI.

ARTICLE 10 — DROIT APPLICABLE
Le présent contrat est régi par le Code du Travail ivoirien (Loi n°2015-532 du 20 juillet 2015) et la Convention Collective Interprofessionnelle ASSIM-UGTCI.

Fait à ${d.entreprise.ville}, le ${d.date_document}

L'Employeur                                    Le Salarié
${d.entreprise.nom}                            ${d.employe.nom_complet}

Signature et cachet :                          Signature :

_______________________                        _______________________

Lu et approuvé — Bon pour accord
`;
    },
  },

  {
    id: "contrat_cdd",
    label: "Contrat de travail CDD",
    group: "Contrats",
    description: "Contrat à durée déterminée conforme Code du Travail CI",
    variables_custom: [
      { key: "date_debut", label: "Date de début", placeholder: "01/05/2026", required: true },
      { key: "date_fin", label: "Date de fin", placeholder: "31/10/2026", required: true },
      { key: "motif_recours", label: "Motif du recours au CDD", placeholder: "Accroissement temporaire d'activité", required: true },
    ],
    generate: (d: TemplateData) => {
      const v = d.variables_custom;
      return `CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE

Entre les soussignés :

${d.entreprise.nom.toUpperCase()}
Siège social : ${d.entreprise.adresse}, ${d.entreprise.ville}
N° CNPS employeur : ${d.entreprise.cnps}
Ci-après dénommé « l'Employeur »,

ET

${d.employe.nom_complet.toUpperCase()}
Matricule : ${d.employe.matricule}
Ci-après dénommé « le Salarié »,

IL A ÉTÉ CONVENU CE QUI SUIT :

ARTICLE 1 — OBJET ET MOTIF DU CONTRAT
Le présent contrat est conclu pour une durée déterminée en raison de : ${v.motif_recours || "accroissement temporaire d'activité"}, conformément à l'article 13 du Code du Travail ivoirien (Loi n°2015-532).

ARTICLE 2 — DURÉE ET TERME
Le présent contrat est conclu du ${v.date_debut || d.employe.date_embauche} au ${v.date_fin || "—"}.

ARTICLE 3 — EMPLOI ET CLASSIFICATION
${civile(d.employe.genre)} ${d.employe.nom_complet} est engagé(e) en qualité de ${d.employe.poste}, catégorie ${d.employe.categorie}, au sein du département ${d.employe.departement}.

ARTICLE 4 — RÉMUNÉRATION
Le Salarié percevra un salaire brut mensuel de ${fmt(d.employe.salaire_brut)}.

ARTICLE 5 — DURÉE DU TRAVAIL
40 heures par semaine, soit 173,33 heures par mois (art. 21.1 CT CI).

ARTICLE 6 — INDEMNITÉ DE FIN DE CONTRAT
À l'échéance du terme, le Salarié percevra une indemnité de fin de contrat égale à 3% du total des salaires bruts perçus, conformément à l'article 13.4 du Code du Travail CI.

ARTICLE 7 — RUPTURE ANTICIPÉE
La rupture anticipée n'est possible que pour faute lourde ou accord des parties (art. 13.6 CT CI).

Fait à ${d.entreprise.ville}, le ${d.date_document}

L'Employeur                                    Le Salarié
${d.entreprise.nom}                            ${d.employe.nom_complet}

Signature et cachet :                          Signature :

_______________________                        _______________________
`;
    },
  },

  // ─── ATTESTATIONS ────────────────────────────────────────────────────────────
  {
    id: "attestation_travail",
    label: "Attestation de travail",
    group: "Attestations",
    description: "Attestation certifiant l'emploi actuel du salarié",
    variables_custom: [
      { key: "destinataire", label: "Destinataire", placeholder: "Banque, Ambassade, etc." },
    ],
    generate: (d: TemplateData) => {
      const v = d.variables_custom;
      return `ATTESTATION DE TRAVAIL

${d.entreprise.nom.toUpperCase()}
${d.entreprise.adresse} — ${d.entreprise.ville}
N° CNPS : ${d.entreprise.cnps}

Fait le ${d.date_document}
${v.destinataire ? `À l'attention de : ${v.destinataire}` : ""}

ATTESTATION

Je soussigné(e), représentant légal de la société ${d.entreprise.nom}, atteste par la présente que :

${civile(d.employe.genre)} ${d.employe.nom_complet}
Matricule : ${d.employe.matricule}
Département : ${d.employe.departement}

est bien employé(e) au sein de notre société en qualité de ${d.employe.poste}, catégorie ${d.employe.categorie}, dans le cadre d'un contrat de travail à ${d.employe.type_contrat === "CDI" ? "durée indéterminée (CDI)" : "durée déterminée (CDD)"}, depuis le ${d.employe.date_embauche}.

La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.

${d.entreprise.ville}, le ${d.date_document}

Le Directeur des Ressources Humaines
${d.entreprise.nom}

Signature et cachet :

_______________________
`;
    },
  },

  {
    id: "attestation_salaire",
    label: "Attestation de salaire",
    group: "Attestations",
    description: "Attestation précisant le salaire brut et net mensuel",
    variables_custom: [
      { key: "salaire_net", label: "Salaire net mensuel (FCFA)", placeholder: "250000", required: true },
      { key: "destinataire", label: "Destinataire", placeholder: "Banque, SGBCI, etc." },
    ],
    generate: (d: TemplateData) => {
      const v = d.variables_custom;
      const net = v.salaire_net
        ? new Intl.NumberFormat("fr-CI", { maximumFractionDigits: 0 }).format(parseInt(v.salaire_net)) + " FCFA"
        : "— FCFA";
      return `ATTESTATION DE SALAIRE

${d.entreprise.nom.toUpperCase()}
${d.entreprise.adresse} — ${d.entreprise.ville}
N° CNPS : ${d.entreprise.cnps}

Fait le ${d.date_document}
${v.destinataire ? `À l'attention de : ${v.destinataire}` : ""}

ATTESTATION DE SALAIRE

Je soussigné(e), représentant légal de la société ${d.entreprise.nom}, atteste que :

${civile(d.employe.genre)} ${d.employe.nom_complet}
Matricule : ${d.employe.matricule}
Poste : ${d.employe.poste}
Département : ${d.employe.departement}
Date d'embauche : ${d.employe.date_embauche}

perçoit mensuellement :
- Salaire brut mensuel : ${fmt(d.employe.salaire_brut)}
- Salaire net mensuel  : ${net}

La présente attestation est délivrée à ${civile(d.employe.genre)} ${d.employe.nom_complet} pour servir et valoir ce que de droit, notamment auprès des établissements financiers.

${d.entreprise.ville}, le ${d.date_document}

Le Directeur des Ressources Humaines
${d.entreprise.nom}

Signature et cachet :

_______________________
`;
    },
  },

  // ─── DISCIPLINAIRE ───────────────────────────────────────────────────────────
  {
    id: "avertissement",
    label: "Avertissement",
    group: "Disciplinaire",
    description: "Lettre d'avertissement — 1ère sanction disciplinaire",
    variables_custom: [
      { key: "faits", label: "Faits reprochés", placeholder: "Retard répété les 10, 15 et 20 avril 2026", required: true },
      { key: "date_faits", label: "Date des faits", placeholder: "10/04/2026", required: true },
    ],
    generate: (d: TemplateData) => {
      const v = d.variables_custom;
      return `${d.entreprise.nom.toUpperCase()}
${d.entreprise.adresse} — ${d.entreprise.ville}

${d.entreprise.ville}, le ${d.date_document}

${civile(d.employe.genre)} ${d.employe.nom_complet}
Matricule : ${d.employe.matricule}
Poste : ${d.employe.poste}
Département : ${d.employe.departement}

Objet : Avertissement

${civile(d.employe.genre)},

Par la présente, nous vous notifions un avertissement pour les faits suivants constatés le ${v.date_faits || "—"} :

${v.faits || "Faits à préciser."}

Ces faits constituent un manquement à vos obligations professionnelles, en violation du règlement intérieur de notre entreprise et des dispositions du Code du Travail ivoirien.

Nous vous demandons instamment de ne pas réitérer ces comportements. Tout nouveau manquement de même nature donnera lieu à une sanction plus grave pouvant aller jusqu'au licenciement.

${salutations(d.employe.genre)}

Le Directeur des Ressources Humaines
${d.entreprise.nom}

Signature :

_______________________

Je soussigné(e) ${d.employe.nom_complet} reconnais avoir reçu et pris connaissance du présent avertissement.

Date : ________________        Signature : ________________
`;
    },
  },

  {
    id: "convocation_entretien_prealable",
    label: "Convocation entretien préalable",
    group: "Disciplinaire",
    description: "Convocation obligatoire avant tout licenciement (CT CI art. 16.4)",
    variables_custom: [
      { key: "date_entretien", label: "Date de l'entretien", placeholder: "05/05/2026", required: true },
      { key: "heure_entretien", label: "Heure de l'entretien", placeholder: "10h00", required: true },
      { key: "lieu_entretien", label: "Lieu de l'entretien", placeholder: "Bureau DRH, siège social", required: true },
    ],
    generate: (d: TemplateData) => {
      const v = d.variables_custom;
      return `${d.entreprise.nom.toUpperCase()}
${d.entreprise.adresse} — ${d.entreprise.ville}

${d.entreprise.ville}, le ${d.date_document}

LETTRE RECOMMANDÉE AVEC ACCUSÉ DE RÉCEPTION

${civile(d.employe.genre)} ${d.employe.nom_complet}
Matricule : ${d.employe.matricule}

Objet : Convocation à un entretien préalable à une éventuelle mesure disciplinaire

${civile(d.employe.genre)},

Nous vous informons que nous envisageons de prendre à votre égard une mesure disciplinaire pouvant aller jusqu'au licenciement.

Avant toute décision, et conformément aux dispositions de l'article 16.4 du Code du Travail ivoirien (Loi n°2015-532 du 20 juillet 2015), nous vous convoquons à un entretien préalable qui se tiendra :

  Date    : ${v.date_entretien || "—"}
  Heure   : ${v.heure_entretien || "—"}
  Lieu    : ${v.lieu_entretien || "—"}

Au cours de cet entretien, vous pourrez vous expliquer sur les faits qui vous sont reprochés. Vous pouvez vous faire assister par une personne de votre choix appartenant au personnel de l'entreprise.

Nous vous demandons de confirmer votre présence par écrit ou oralement dans les 48 heures.

${salutations(d.employe.genre)}

Le Directeur des Ressources Humaines
${d.entreprise.nom}

Signature :

_______________________

Accusé de réception : J'ai bien reçu la présente convocation.
${civile(d.employe.genre)} ${d.employe.nom_complet}

Date : ________________        Signature : ________________
`;
    },
  },

  {
    id: "demande_explication",
    label: "Demande d'explication écrite",
    group: "Disciplinaire",
    description: "Demande d'explication préalable à une sanction (CT CI art. 15.3)",
    variables_custom: [
      { key: "faits", label: "Faits reprochés", placeholder: "Absence injustifiée le 15/04/2026", required: true },
      { key: "date_faits", label: "Date des faits", placeholder: "15/04/2026", required: true },
      { key: "delai_reponse", label: "Délai de réponse", placeholder: "5 jours ouvrables" },
    ],
    generate: (d: TemplateData) => {
      const v = d.variables_custom;
      return `${d.entreprise.nom.toUpperCase()}
${d.entreprise.adresse} — ${d.entreprise.ville}

${d.entreprise.ville}, le ${d.date_document}

${civile(d.employe.genre)} ${d.employe.nom_complet}
Matricule : ${d.employe.matricule}
Poste : ${d.employe.poste}

Objet : Demande d'explication écrite

${civile(d.employe.genre)},

Nous avons constaté le ${v.date_faits || "—"} le fait suivant :

${v.faits || "Faits à préciser."}

Avant de prendre toute décision disciplinaire, et conformément à l'article 15.3 du Code du Travail ivoirien, nous vous demandons de bien vouloir nous fournir vos explications écrites sur ces faits dans un délai de ${v.delai_reponse || "5 jours ouvrables"} à compter de la réception de la présente lettre.

Vos explications nous permettront d'apprécier la situation dans sa globalité avant toute éventuelle prise de décision.

${salutations(d.employe.genre)}

Le Directeur des Ressources Humaines
${d.entreprise.nom}

Signature :

_______________________

Accusé de réception : J'ai bien reçu la présente demande d'explication.
Nom : ${d.employe.nom_complet}

Date : ________________        Signature : ________________
`;
    },
  },

  {
    id: "lettre_licenciement_personnel",
    label: "Licenciement — motif personnel",
    group: "Disciplinaire",
    description: "Lettre de licenciement pour motif personnel (CT CI art. 16)",
    variables_custom: [
      { key: "date_entretien_prealable", label: "Date entretien préalable", placeholder: "05/05/2026", required: true },
      { key: "motifs", label: "Motifs du licenciement", placeholder: "Absences répétées non justifiées...", required: true },
      { key: "date_prise_effet", label: "Date de prise d'effet", placeholder: "15/05/2026", required: true },
    ],
    generate: (d: TemplateData) => {
      const v = d.variables_custom;
      return `${d.entreprise.nom.toUpperCase()}
${d.entreprise.adresse} — ${d.entreprise.ville}

${d.entreprise.ville}, le ${d.date_document}

LETTRE RECOMMANDÉE AVEC ACCUSÉ DE RÉCEPTION

${civile(d.employe.genre)} ${d.employe.nom_complet}
Matricule : ${d.employe.matricule}
Poste : ${d.employe.poste}

Objet : Notification de licenciement

${civile(d.employe.genre)},

À la suite de l'entretien préalable qui s'est tenu le ${v.date_entretien_prealable || "—"}, au cours duquel vous avez pu vous exprimer sur les faits qui vous étaient reprochés, nous avons pris la décision de vous licencier pour les motifs suivants :

${v.motifs || "Motifs à préciser."}

Ces faits constituent une faute justifiant la rupture de votre contrat de travail, conformément aux articles 15 et 16 du Code du Travail ivoirien (Loi n°2015-532).

La rupture de votre contrat de travail prend effet le ${v.date_prise_effet || "—"}.

Vous effectuerez votre préavis conformément aux dispositions légales et conventionnelles applicables à votre catégorie, sauf si nous décidons de vous en dispenser.

Les documents de fin de contrat (certificat de travail, solde de tout compte, attestation CNPS) vous seront remis à l'expiration de votre préavis.

${salutations(d.employe.genre)}

Le Directeur des Ressources Humaines
${d.entreprise.nom}

Signature :

_______________________

Accusé de réception :
${civile(d.employe.genre)} ${d.employe.nom_complet}

Date : ________________        Signature : ________________
`;
    },
  },

  {
    id: "lettre_licenciement_economique",
    label: "Licenciement économique",
    group: "Disciplinaire",
    description: "Licenciement pour motif économique avec consultation (CT CI art. 18)",
    variables_custom: [
      { key: "motif_economique", label: "Motif économique", placeholder: "Difficultés économiques liées à...", required: true },
      { key: "date_prise_effet", label: "Date de prise d'effet", placeholder: "01/06/2026", required: true },
      { key: "indemnite", label: "Montant indemnité (FCFA)", placeholder: "500000" },
    ],
    generate: (d: TemplateData) => {
      const v = d.variables_custom;
      return `${d.entreprise.nom.toUpperCase()}
${d.entreprise.adresse} — ${d.entreprise.ville}

${d.entreprise.ville}, le ${d.date_document}

LETTRE RECOMMANDÉE AVEC ACCUSÉ DE RÉCEPTION

${civile(d.employe.genre)} ${d.employe.nom_complet}
Matricule : ${d.employe.matricule}
Poste : ${d.employe.poste}

Objet : Notification de licenciement pour motif économique

${civile(d.employe.genre)},

Nous nous voyons dans l'obligation de vous notifier la rupture de votre contrat de travail pour motif économique, conformément aux articles 18 et suivants du Code du Travail ivoirien (Loi n°2015-532).

Motif économique :
${v.motif_economique || "Motif économique à préciser."}

Malgré tous les efforts déployés, il nous est impossible de maintenir votre poste de ${d.employe.poste}.

La rupture de votre contrat prend effet le ${v.date_prise_effet || "—"}, après exécution de votre préavis conformément à la réglementation en vigueur.

${v.indemnite ? `Une indemnité de licenciement d'un montant de ${new Intl.NumberFormat("fr-CI").format(parseInt(v.indemnite))} FCFA vous sera versée conformément à l'article 18.4 CT CI.` : "Votre indemnité de licenciement sera calculée conformément à l'article 18.4 du Code du Travail CI."}

Votre priorité de réembauchage est maintenue pendant 12 mois à compter de la rupture effective du contrat (art. 18.5 CT CI).

${salutations(d.employe.genre)}

Le Directeur des Ressources Humaines
${d.entreprise.nom}

Signature :

_______________________
`;
    },
  },

  {
    id: "lettre_fin_cdd",
    label: "Lettre de fin de CDD",
    group: "Contractuel",
    description: "Notification de non-renouvellement à l'échéance du CDD",
    variables_custom: [
      { key: "date_echeance", label: "Date d'échéance du contrat", placeholder: "31/05/2026", required: true },
    ],
    generate: (d: TemplateData) => {
      const v = d.variables_custom;
      return `${d.entreprise.nom.toUpperCase()}
${d.entreprise.adresse} — ${d.entreprise.ville}

${d.entreprise.ville}, le ${d.date_document}

${civile(d.employe.genre)} ${d.employe.nom_complet}
Matricule : ${d.employe.matricule}
Poste : ${d.employe.poste}

Objet : Fin de contrat à durée déterminée

${civile(d.employe.genre)},

Nous vous informons par la présente que votre contrat de travail à durée déterminée arrivera à son terme le ${v.date_echeance || "—"}, sans renouvellement.

Nous souhaitons vous remercier pour votre contribution durant cette période et vous souhaitons pleine réussite dans la suite de votre parcours professionnel.

Conformément à l'article 13.4 du Code du Travail ivoirien, une indemnité de fin de contrat égale à 3% du total des salaires bruts perçus vous sera versée à la date d'échéance.

Les documents de fin de contrat (certificat de travail, solde de tout compte, attestation CNPS) vous seront remis à la date d'échéance.

${salutations(d.employe.genre)}

Le Directeur des Ressources Humaines
${d.entreprise.nom}

Signature :

_______________________
`;
    },
  },

  {
    id: "mise_en_demeure_abandon_poste",
    label: "Mise en demeure abandon de poste",
    group: "Disciplinaire",
    description: "Mise en demeure de reprendre le travail ou de justifier l'absence",
    variables_custom: [
      { key: "date_absence", label: "Date de début d'absence", placeholder: "15/04/2026", required: true },
      { key: "delai_reponse", label: "Délai pour répondre", placeholder: "48 heures", required: true },
    ],
    generate: (d: TemplateData) => {
      const v = d.variables_custom;
      return `${d.entreprise.nom.toUpperCase()}
${d.entreprise.adresse} — ${d.entreprise.ville}

${d.entreprise.ville}, le ${d.date_document}

LETTRE RECOMMANDÉE AVEC ACCUSÉ DE RÉCEPTION

${civile(d.employe.genre)} ${d.employe.nom_complet}
Matricule : ${d.employe.matricule}
Poste : ${d.employe.poste}

Objet : Mise en demeure de reprendre votre poste

${civile(d.employe.genre)},

Nous constatons votre absence non autorisée et non justifiée depuis le ${v.date_absence || "—"}.

Nous vous mettons en demeure, par la présente, soit de reprendre votre poste, soit de justifier votre absence dans un délai de ${v.delai_reponse || "48 heures"} à compter de la réception de la présente lettre.

À défaut de réponse dans ce délai, nous serons contraints d'engager une procédure disciplinaire à votre encontre pouvant aller jusqu'au licenciement pour abandon de poste, conformément aux dispositions du Code du Travail ivoirien.

${salutations(d.employe.genre)}

Le Directeur des Ressources Humaines
${d.entreprise.nom}

Signature :

_______________________
`;
    },
  },
];

export function getTemplate(id: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find((t) => t.id === id);
}
