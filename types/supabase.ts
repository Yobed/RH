export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          company_id: string
          created_at: string | null
          id: string
          resource: string | null
          user_id: string
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string | null
          id?: string
          resource?: string | null
          user_id: string
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string | null
          id?: string
          resource?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bulletins_paie: {
        Row: {
          autres_retenues: number
          avances: number
          cnps_salarie: number
          company_id: string
          created_at: string | null
          employee_id: string
          id: string
          its: number
          periode: string
          prime_anciennete: number | null
          prime_depassement: number | null
          prime_exceptionnelle: number | null
          prime_fonction: number | null
          prime_salissure: number | null
          prime_transport: number | null
          salaire_brut: number
          salaire_net: number
          sursalaire: number | null
          details: Json | null
          // Colonnes Sage 22
          days_worked: number | null
          vacation_allowance: number | null
          overtime_pay: number | null
          gross_salary: number | null
          exempt_indemnity: number | null
          fiscal_gross: number | null
          social_gross: number | null
          tax_is: number | null
          tax_cn: number | null
          tax_igr: number | null
          withholding_cnps: number | null
          total_contributions: number | null
          net_before_withholding: number | null
          adjustment_m_minus_1: number | null
          negative_pay_adjustment: number | null
          negative_advance: number | null
          rounding_adjustment: number | null
          net_to_pay: number | null
          // Nouveaux champs
          heures_normales: number | null
          prime_logement: number | null
          prime_responsabilite: number | null
          remboursement_frais: number | null
        }
        Insert: {
          autres_retenues?: number
          avances?: number
          cnps_salarie?: number
          company_id: string
          created_at?: string | null
          employee_id: string
          id?: string
          its?: number
          periode: string
          prime_anciennete?: number | null
          prime_depassement?: number | null
          prime_exceptionnelle?: number | null
          prime_fonction?: number | null
          prime_salissure?: number | null
          prime_transport?: number | null
          salaire_brut: number
          salaire_net: number
          sursalaire?: number | null
          details?: Json | null
          // Colonnes Sage 22
          days_worked?: number | null
          vacation_allowance?: number | null
          overtime_pay?: number | null
          gross_salary?: number | null
          exempt_indemnity?: number | null
          fiscal_gross?: number | null
          social_gross?: number | null
          tax_is?: number | null
          tax_cn?: number | null
          tax_igr?: number | null
          withholding_cnps?: number | null
          total_contributions?: number | null
          net_before_withholding?: number | null
          adjustment_m_minus_1?: number | null
          negative_pay_adjustment?: number | null
          negative_advance?: number | null
          rounding_adjustment?: number | null
          net_to_pay?: number | null
          heures_normales?: number | null
          prime_logement?: number | null
          prime_responsabilite?: number | null
          remboursement_frais?: number | null
        }
        Update: {
          autres_retenues?: number
          avances?: number
          cnps_salarie?: number
          company_id?: string
          created_at?: string | null
          employee_id?: string
          id?: string
          its?: number
          periode?: string
          prime_anciennete?: number | null
          prime_depassement?: number | null
          prime_exceptionnelle?: number | null
          prime_fonction?: number | null
          prime_salissure?: number | null
          prime_transport?: number | null
          salaire_brut?: number
          salaire_net?: number
          sursalaire?: number | null
          details?: Json | null
          // Colonnes Sage 22
          days_worked?: number | null
          vacation_allowance?: number | null
          overtime_pay?: number | null
          gross_salary?: number | null
          exempt_indemnity?: number | null
          fiscal_gross?: number | null
          social_gross?: number | null
          tax_is?: number | null
          tax_cn?: number | null
          tax_igr?: number | null
          withholding_cnps?: number | null
          total_contributions?: number | null
          net_before_withholding?: number | null
          adjustment_m_minus_1?: number | null
          negative_pay_adjustment?: number | null
          negative_advance?: number | null
          rounding_adjustment?: number | null
          net_to_pay?: number | null
          heures_normales?: number | null
          prime_logement?: number | null
          prime_responsabilite?: number | null
          remboursement_frais?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bulletins_paie_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulletins_paie_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          company_id: string
          created_at: string | null
          cv_url: string | null
          email: string
          full_name: string
          id: string
          job_id: string | null
          notes_rh: string | null
          phone: string | null
          score_detail: Json | null
          score_ia: number | null
          statut: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          cv_url?: string | null
          email: string
          full_name: string
          id?: string
          job_id?: string | null
          notes_rh?: string | null
          phone?: string | null
          score_detail?: Json | null
          score_ia?: number | null
          statut?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          cv_url?: string | null
          email?: string
          full_name?: string
          id?: string
          job_id?: string | null
          notes_rh?: string | null
          phone?: string | null
          score_detail?: Json | null
          score_ia?: number | null
          statut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          adresse: string | null
          cnps_matricule: string | null
          convention_collective: string | null
          created_at: string | null
          id: string
          name: string
          ncc: string | null
          nccm: string | null
          nif: string | null
          raison_sociale: string | null
        }
        Insert: {
          adresse?: string | null
          cnps_matricule?: string | null
          convention_collective?: string | null
          created_at?: string | null
          id?: string
          name: string
          ncc?: string | null
          nccm?: string | null
          nif?: string | null
          raison_sociale?: string | null
        }
        Update: {
          adresse?: string | null
          cnps_matricule?: string | null
          convention_collective?: string | null
          created_at?: string | null
          id?: string
          name?: string
          ncc?: string | null
          nccm?: string | null
          nif?: string | null
          raison_sociale?: string | null
        }
        Relationships: []
      }
      conges: {
        Row: {
          commentaire: string | null
          company_id: string
          created_at: string | null
          date_debut: string
          date_fin: string
          employee_id: string
          id: string
          nb_jours: number
          refus_motif: string | null
          statut: string | null
          type: string
          validated_by_manager_at: string | null
          validated_by_manager_id: string | null
          validated_by_rh_at: string | null
          validated_by_rh_id: string | null
          // Nouveaux champs
          conge_fractionne: boolean | null
          date_reprise: string | null
          remplacant_id: string | null
          justificatif_url: string | null
        }
        Insert: {
          commentaire?: string | null
          company_id: string
          created_at?: string | null
          date_debut: string
          date_fin: string
          employee_id: string
          id?: string
          nb_jours: number
          refus_motif?: string | null
          statut?: string | null
          type: string
          validated_by_manager_at?: string | null
          validated_by_manager_id?: string | null
          validated_by_rh_at?: string | null
          validated_by_rh_id?: string | null
          conge_fractionne?: boolean | null
          date_reprise?: string | null
          remplacant_id?: string | null
          justificatif_url?: string | null
        }
        Update: {
          commentaire?: string | null
          company_id?: string
          created_at?: string | null
          date_debut?: string
          date_fin?: string
          employee_id?: string
          id?: string
          nb_jours?: number
          refus_motif?: string | null
          statut?: string | null
          type?: string
          validated_by_manager_at?: string | null
          validated_by_manager_id?: string | null
          validated_by_rh_at?: string | null
          validated_by_rh_id?: string | null
          conge_fractionne?: boolean | null
          date_reprise?: string | null
          remplacant_id?: string | null
          justificatif_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conges_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conges_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          id: string
          company_id: string
          employee_id: string
          annee: number
          jours_acquis: number
          jours_pris: number
          solde: number
          updated_at: string | null
        }
        Insert: {
          company_id: string
          employee_id: string
          annee: number
          jours_acquis: number
          jours_pris: number
          id?: string
          updated_at?: string | null
        }
        Update: {
          jours_acquis?: number
          jours_pris?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          company_id: string
          created_at: string | null
          date_debut: string
          date_fin: string | null
          date_fin_essai: string | null
          document_url: string | null
          employee_id: string
          id: string
          renouvellement_count: number | null
          salaire_brut: number
          statut: string | null
          type_contrat: string
          // Nouveaux champs
          lieu_travail: string | null
          duree_hebdo: number | null
          description_poste: string | null
          convention_collective: string | null
          clause_non_concurrence: boolean | null
          clause_confidentialite: boolean | null
          avantages_nature: string | null
          motif_cdd: string | null
          signataire_nom: string | null
          date_signature: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          date_debut: string
          date_fin?: string | null
          date_fin_essai?: string | null
          document_url?: string | null
          employee_id: string
          id?: string
          renouvellement_count?: number | null
          salaire_brut: number
          statut?: string | null
          type_contrat: string
          lieu_travail?: string | null
          duree_hebdo?: number | null
          description_poste?: string | null
          convention_collective?: string | null
          clause_non_concurrence?: boolean | null
          clause_confidentialite?: boolean | null
          avantages_nature?: string | null
          motif_cdd?: string | null
          signataire_nom?: string | null
          date_signature?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          date_debut?: string
          date_fin?: string | null
          date_fin_essai?: string | null
          document_url?: string | null
          employee_id?: string
          id?: string
          renouvellement_count?: number | null
          salaire_brut?: number
          statut?: string | null
          type_contrat?: string
          lieu_travail?: string | null
          duree_hebdo?: number | null
          description_poste?: string | null
          convention_collective?: string | null
          clause_non_concurrence?: boolean | null
          clause_confidentialite?: boolean | null
          avantages_nature?: string | null
          motif_cdd?: string | null
          signataire_nom?: string | null
          date_signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          company_id: string
          created_at: string | null
          employee_id: string | null
          famille: string | null
          file_size_kb: number | null
          file_type: string | null
          file_url: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          employee_id?: string | null
          famille?: string | null
          file_size_kb?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          employee_id?: string | null
          famille?: string | null
          file_size_kb?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_salary_history: {
        Row: {
          company_id: string
          created_at: string | null
          date_effet: string
          employee_id: string
          id: string
          motif: string | null
          prime_depassement: number | null
          prime_exceptionnelle: number | null
          prime_fonction: number | null
          prime_salissure: number | null
          prime_transport: number | null
          salaire_brut: number | null
          sursalaire: number | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          date_effet?: string
          employee_id: string
          id?: string
          motif?: string | null
          prime_depassement?: number | null
          prime_exceptionnelle?: number | null
          prime_fonction?: number | null
          prime_salissure?: number | null
          prime_transport?: number | null
          salaire_brut?: number | null
          sursalaire?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          date_effet?: string
          employee_id?: string
          id?: string
          motif?: string | null
          prime_depassement?: number | null
          prime_exceptionnelle?: number | null
          prime_fonction?: number | null
          prime_salissure?: number | null
          prime_transport?: number | null
          salaire_brut?: number | null
          sursalaire?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_salary_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          categorie: string | null
          civilite: string | null
          company_id: string
          created_at: string | null
          date_embauche: string
          date_naissance: string | null
          departement: string | null
          email: string | null
          etat_civil: string | null
          full_name: string
          genre: string | null
          id: string
          manager_id: string | null
          matricule: string
          nationalite: string | null
          nb_enfants: number | null
          niveau_etude: string | null
          num_cnps: string | null
          phone: string | null
          poste: string
          prime_depassement: number | null
          prime_exceptionnelle: number | null
          prime_fonction: number | null
          prime_salissure: number | null
          prime_transport: number | null
          salaire_brut: number | null
          statut: string | null
          sursalaire: number | null
          type_contrat: string | null
          // Nouveaux champs
          lieu_naissance: string | null
          num_cni: string | null
          date_expiration_cni: string | null
          adresse: string | null
          situation_logement: string | null
          rib: string | null
          mobile_money: string | null
          contact_urgence_nom: string | null
          contact_urgence_tel: string | null
          anciennete_anterieure: number | null
          groupe_sanguin: string | null
          convention_collective: string | null
          site_travail: string | null
          nb_personnes_charge: number | null
        }
        Insert: {
          categorie?: string | null
          civilite?: string | null
          company_id: string
          created_at?: string | null
          date_embauche: string
          date_naissance?: string | null
          departement?: string | null
          email?: string | null
          etat_civil?: string | null
          full_name: string
          genre?: string | null
          id?: string
          manager_id?: string | null
          matricule: string
          nationalite?: string | null
          nb_enfants?: number | null
          niveau_etude?: string | null
          num_cnps?: string | null
          phone?: string | null
          poste: string
          prime_depassement?: number | null
          prime_exceptionnelle?: number | null
          prime_fonction?: number | null
          prime_salissure?: number | null
          prime_transport?: number | null
          salaire_brut?: number | null
          statut?: string | null
          sursalaire?: number | null
          type_contrat?: string | null
          lieu_naissance?: string | null
          num_cni?: string | null
          date_expiration_cni?: string | null
          adresse?: string | null
          situation_logement?: string | null
          rib?: string | null
          mobile_money?: string | null
          contact_urgence_nom?: string | null
          contact_urgence_tel?: string | null
          anciennete_anterieure?: number | null
          groupe_sanguin?: string | null
          convention_collective?: string | null
          site_travail?: string | null
          nb_personnes_charge?: number | null
        }
        Update: {
          categorie?: string | null
          civilite?: string | null
          company_id?: string
          created_at?: string | null
          date_embauche?: string
          date_naissance?: string | null
          departement?: string | null
          email?: string | null
          etat_civil?: string | null
          full_name?: string
          genre?: string | null
          id?: string
          manager_id?: string | null
          matricule?: string
          nationalite?: string | null
          nb_enfants?: number | null
          niveau_etude?: string | null
          num_cnps?: string | null
          phone?: string | null
          poste?: string
          prime_depassement?: number | null
          prime_exceptionnelle?: number | null
          prime_fonction?: number | null
          prime_salissure?: number | null
          prime_transport?: number | null
          salaire_brut?: number | null
          statut?: string | null
          sursalaire?: number | null
          type_contrat?: string | null
          lieu_naissance?: string | null
          num_cni?: string | null
          date_expiration_cni?: string | null
          adresse?: string | null
          situation_logement?: string | null
          rib?: string | null
          mobile_money?: string | null
          contact_urgence_nom?: string | null
          contact_urgence_tel?: string | null
          anciennete_anterieure?: number | null
          groupe_sanguin?: string | null
          convention_collective?: string | null
          site_travail?: string | null
          nb_personnes_charge?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinary_procedures: {
        Row: {
          id: string
          company_id: string
          employee_id: string
          type: string
          motif: string
          statut: string
          date_incident: string | null
          date_notification: string | null
          reponse_employe: string | null
          sanction_appliquee: string | null
          documents_urls: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          employee_id: string
          type: string
          motif: string
          statut: string
          date_incident?: string | null
          date_notification?: string | null
          reponse_employe?: string | null
          sanction_appliquee?: string | null
          documents_urls?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          employee_id?: string
          type?: string
          motif?: string
          statut?: string
          date_incident?: string | null
          date_notification?: string | null
          reponse_employe?: string | null
          sanction_appliquee?: string | null
          documents_urls?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_procedures_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_procedures_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          id: string
          company_id: string
          employee_id: string
          evaluateur_id: string | null
          titre: string
          type: string
          statut: string
          date_prevue: string
          date_realisation: string | null
          score_global: number | null
          commentaires_evaluateur: string | null
          commentaires_employe: string | null
          objectifs_futurs: string | null
          criteres_evaluation: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          employee_id: string
          evaluateur_id?: string | null
          titre: string
          type: string
          statut: string
          date_prevue: string
          date_realisation?: string | null
          score_global?: number | null
          commentaires_evaluateur?: string | null
          commentaires_employe?: string | null
          objectifs_futurs?: string | null
          criteres_evaluation?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          employee_id?: string
          evaluateur_id?: string | null
          titre?: string
          type?: string
          statut?: string
          date_prevue?: string
          date_realisation?: string | null
          score_global?: number | null
          commentaires_evaluateur?: string | null
          commentaires_employe?: string | null
          objectifs_futurs?: string | null
          criteres_evaluation?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_evaluateur_id_fkey"
            columns: ["evaluateur_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_params: {
        Row: {
          company_id: string
          convention: string
          created_at: string | null
          id: string
          updated_at: string | null
          valeur_point: number
        }
        Insert: {
          company_id: string
          convention?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          valeur_point?: number
        }
        Update: {
          company_id?: string
          convention?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          valeur_point?: number
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_params_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          company_id: string
          competences: string[] | null
          created_at: string | null
          date_limite: string | null
          description: string
          experience_min: number | null
          id: string
          salaire_max: number | null
          salaire_min: number | null
          statut: string | null
          titre: string
          type_contrat: string | null
        }
        Insert: {
          company_id: string
          competences?: string[] | null
          created_at?: string | null
          date_limite?: string | null
          description: string
          experience_min?: number | null
          id?: string
          salaire_max?: number | null
          salaire_min?: number | null
          statut?: string | null
          titre: string
          type_contrat?: string | null
        }
        Update: {
          company_id?: string
          competences?: string[] | null
          created_at?: string | null
          date_limite?: string | null
          description?: string
          experience_min?: number | null
          id?: string
          salaire_max?: number | null
          salaire_min?: number | null
          statut?: string | null
          titre?: string
          type_contrat?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_cases: {
        Row: {
          company_id: string
          created_at: string | null
          date_ouverture: string
          description: string | null
          employee_id: string | null
          id: string
          priorite: string | null
          reference: string
          statut: string | null
          titre: string
          type_cas: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          date_ouverture?: string
          description?: string | null
          employee_id?: string | null
          id?: string
          priorite?: string | null
          reference: string
          statut?: string | null
          titre: string
          type_cas?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          date_ouverture?: string
          description?: string | null
          employee_id?: string | null
          id?: string
          priorite?: string | null
          reference?: string
          statut?: string | null
          titre?: string
          type_cas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_cases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_cases_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          company_id: string | null
          contenu: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          source: string
          titre: string
        }
        Insert: {
          company_id?: string | null
          contenu: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source: string
          titre: string
        }
        Update: {
          company_id?: string | null
          contenu?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source?: string
          titre?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          lu: boolean | null
          message: string | null
          titre: string
          type: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          lu?: boolean | null
          message?: string | null
          titre: string
          type: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          lu?: boolean | null
          message?: string | null
          titre?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_logs: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string;
          employee_name: string | null;
          days_worked: number | null;
          base_salary: number | null;
          bonus_salary: number | null;
          seniority_premium: number | null;
          transport_allowance: number | null;
          vacation_allowance: number | null;
          overtime_pay: number | null;
          gross_salary: number | null;
          exempt_indemnity: number | null;
          fiscal_gross: number | null;
          social_gross: number | null;
          tax_is: number | null;
          tax_cn: number | null;
          tax_igr: number | null;
          withholding_cnps: number | null;
          total_contributions: number | null;
          net_before_withholding: number | null;
          adjustment_m_minus_1: number | null;
          negative_pay_adjustment: number | null;
          negative_advance: number | null;
          rounding_adjustment: number | null;
          net_to_pay: number | null;
          periode: string | null;
          import_source: string;
          imported_at: string;
          imported_by: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          employee_id: string;
          employee_name?: string | null;
          days_worked?: number | null;
          base_salary?: number | null;
          bonus_salary?: number | null;
          seniority_premium?: number | null;
          transport_allowance?: number | null;
          vacation_allowance?: number | null;
          overtime_pay?: number | null;
          gross_salary?: number | null;
          exempt_indemnity?: number | null;
          fiscal_gross?: number | null;
          social_gross?: number | null;
          tax_is?: number | null;
          tax_cn?: number | null;
          tax_igr?: number | null;
          withholding_cnps?: number | null;
          total_contributions?: number | null;
          net_before_withholding?: number | null;
          adjustment_m_minus_1?: number | null;
          negative_pay_adjustment?: number | null;
          negative_advance?: number | null;
          rounding_adjustment?: number | null;
          net_to_pay?: number | null;
          periode?: string | null;
          import_source?: string;
          imported_at?: string;
          imported_by?: string | null;
        };
        Update: Partial<{
          id: string;
          company_id: string;
          employee_id: string;
          employee_name: string | null;
          days_worked: number | null;
          base_salary: number | null;
          bonus_salary: number | null;
          seniority_premium: number | null;
          transport_allowance: number | null;
          vacation_allowance: number | null;
          overtime_pay: number | null;
          gross_salary: number | null;
          exempt_indemnity: number | null;
          fiscal_gross: number | null;
          social_gross: number | null;
          tax_is: number | null;
          tax_cn: number | null;
          tax_igr: number | null;
          withholding_cnps: number | null;
          total_contributions: number | null;
          net_before_withholding: number | null;
          adjustment_m_minus_1: number | null;
          negative_pay_adjustment: number | null;
          negative_advance: number | null;
          rounding_adjustment: number | null;
          net_to_pay: number | null;
          periode: string | null;
          import_source: string;
          imported_at: string;
          imported_by: string | null;
        }>;
        Relationships: [];
      }
      profiles: {
        Row: {
          company_id: string
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          email: string
          full_name: string
          id: string
          role: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      work_accidents: {
        Row: {
          id: string
          company_id: string
          employee_id: string
          date_accident: string
          heure_accident: string | null
          lieu: string | null
          description: string
          gravite: "bénin" | "grave" | "mortel"
          jours_arret: number | null
          statut_cnps: "non_declare" | "declare" | "indemnise" | "clos"
          numero_cnps: string | null
          pieces_jointes: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          employee_id: string
          date_accident: string
          heure_accident?: string | null
          lieu?: string | null
          description: string
          gravite?: "bénin" | "grave" | "mortel"
          jours_arret?: number | null
          statut_cnps?: "non_declare" | "declare" | "indemnise" | "clos"
          numero_cnps?: string | null
          pieces_jointes?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          employee_id?: string
          date_accident?: string
          heure_accident?: string | null
          lieu?: string | null
          description?: string
          gravite?: "bénin" | "grave" | "mortel"
          jours_arret?: number | null
          statut_cnps?: "non_declare" | "declare" | "indemnise" | "clos"
          numero_cnps?: string | null
          pieces_jointes?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_accidents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_accidents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_visits: {
        Row: {
          id: string
          company_id: string
          employee_id: string
          type_visite: "embauche" | "periodique" | "reprise" | "spontanee"
          date_visite: string
          date_prochaine: string | null
          resultat: "apte" | "apte_amenagement" | "inapte" | null
          medecin: string | null
          observations: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          employee_id: string
          type_visite?: "embauche" | "periodique" | "reprise" | "spontanee"
          date_visite: string
          date_prochaine?: string | null
          resultat?: "apte" | "apte_amenagement" | "inapte" | null
          medecin?: string | null
          observations?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          employee_id?: string
          type_visite?: "embauche" | "periodique" | "reprise" | "spontanee"
          date_visite?: string
          date_prochaine?: string | null
          resultat?: "apte" | "apte_amenagement" | "inapte" | null
          medecin?: string | null
          observations?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_visits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_visits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_id: { Args: never; Returns: string }
      match_legal_documents: {
        Args: {
          filter_company_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          contenu: string
          id: string
          similarity: number
          source: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
