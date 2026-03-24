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
          convention_collective: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          convention_collective?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          convention_collective?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
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
      employees: {
        Row: {
          company_id: string
          created_at: string | null
          date_embauche: string
          date_naissance: string | null
          departement: string | null
          email: string | null
          full_name: string
          genre: string | null
          id: string
          manager_id: string | null
          matricule: string
          phone: string | null
          poste: string
          salaire_brut: number | null
          statut: string | null
          type_contrat: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          date_embauche: string
          date_naissance?: string | null
          departement?: string | null
          email?: string | null
          full_name: string
          genre?: string | null
          id?: string
          manager_id?: string | null
          matricule: string
          phone?: string | null
          poste: string
          salaire_brut?: number | null
          statut?: string | null
          type_contrat?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          date_embauche?: string
          date_naissance?: string | null
          departement?: string | null
          email?: string | null
          full_name?: string
          genre?: string | null
          id?: string
          manager_id?: string | null
          matricule?: string
          phone?: string | null
          poste?: string
          salaire_brut?: number | null
          statut?: string | null
          type_contrat?: string | null
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
      evaluations: {
        Row: {
          company_id: string
          created_at: string | null
          date_evaluation: string
          employee_id: string
          evaluateur_id: string | null
          id: string
          periode: string
          periodicite: string | null
          score_global: number | null
          scores: Json
          statut: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          date_evaluation: string
          employee_id: string
          evaluateur_id?: string | null
          id?: string
          periode: string
          periodicite?: string | null
          score_global?: number | null
          scores?: Json
          statut?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          date_evaluation?: string
          employee_id?: string
          evaluateur_id?: string | null
          id?: string
          periode?: string
          periodicite?: string | null
          score_global?: number | null
          scores?: Json
          statut?: string | null
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
