export interface TemplateData {
  entreprise: {
    nom: string;
    adresse: string;
    cnps: string;
    ville: string;
  };
  employe: {
    nom_complet: string;
    matricule: string;
    poste: string;
    departement: string;
    date_embauche: string;
    type_contrat: string;
    salaire_brut: number;
    categorie: string;
    genre: string; // "M" | "F"
  };
  date_document: string; // "DD/MM/YYYY"
  variables_custom: Record<string, string>; // motifs, dates spécifiques, etc.
}

export interface DocumentTemplate {
  id: string;
  label: string;
  group: string;
  description: string;
  variables_custom: {
    key: string;
    label: string;
    placeholder: string;
    required?: boolean;
  }[];
  generate: (data: TemplateData) => string;
}
