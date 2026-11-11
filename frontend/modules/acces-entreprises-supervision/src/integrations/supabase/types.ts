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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      accounting_firm_clients: {
        Row: {
          client_organization_id: string
          created_at: string
          created_by: string
          firm_organization_id: string
          id: string
        }
        Insert: {
          client_organization_id: string
          created_at?: string
          created_by: string
          firm_organization_id: string
          id?: string
        }
        Update: {
          client_organization_id?: string
          created_at?: string
          created_by?: string
          firm_organization_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_firm_clients_client_organization_id_fkey"
            columns: ["client_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_firm_clients_firm_organization_id_fkey"
            columns: ["firm_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_events: {
        Row: {
          action: string
          created_at: string
          details: Json
          id: string
          invoice_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          id?: string
          invoice_id: string
          user_id?: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          id?: string
          invoice_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          tax_rate: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          invoice_id: string
          quantity?: number
          tax_rate?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          tax_rate?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          id: string
          invoice_id: string
          method: string
          paid_at: string
          reference: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string
          id?: string
          invoice_id: string
          method?: string
          paid_at?: string
          reference?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          id?: string
          invoice_id?: string
          method?: string
          paid_at?: string
          reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          counterparty_name: string
          created_at: string
          created_by: string
          currency: string
          document_name: string | null
          document_path: string | null
          due_date: string | null
          extracted_fields: Json
          extraction_mode: string
          id: string
          invoice_date: string | null
          invoice_number: string
          kind: Database["public"]["Enums"]["invoice_kind"]
          notes: string
          organization_id: string
          paid_amount: number
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          counterparty_name?: string
          created_at?: string
          created_by?: string
          currency?: string
          document_name?: string | null
          document_path?: string | null
          due_date?: string | null
          extracted_fields?: Json
          extraction_mode?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string
          kind: Database["public"]["Enums"]["invoice_kind"]
          notes?: string
          organization_id: string
          paid_amount?: number
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          counterparty_name?: string
          created_at?: string
          created_by?: string
          currency?: string
          document_name?: string | null
          document_path?: string | null
          due_date?: string | null
          extracted_fields?: Json
          extraction_mode?: string
          id?: string
          invoice_date?: string | null
          invoice_number?: string
          kind?: Database["public"]["Enums"]["invoice_kind"]
          notes?: string
          organization_id?: string
          paid_amount?: number
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          expires_at: string
          firm_organization_id: string | null
          id: string
          invited_by: string
          invited_role: Database["public"]["Enums"]["member_role"]
          organization_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          expires_at?: string
          firm_organization_id?: string | null
          id?: string
          invited_by?: string
          invited_role?: Database["public"]["Enums"]["member_role"]
          organization_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          expires_at?: string
          firm_organization_id?: string | null
          id?: string
          invited_by?: string
          invited_role?: Database["public"]["Enums"]["member_role"]
          organization_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_firm_organization_id_fkey"
            columns: ["firm_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          currency: string
          id: string
          kind: Database["public"]["Enums"]["organization_kind"]
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          kind: Database["public"]["Enums"]["organization_kind"]
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          kind?: Database["public"]["Enums"]["organization_kind"]
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_organization_invitation: {
        Args: { _token: string }
        Returns: string
      }
      can_manage_organization: {
        Args: { _organization_id: string }
        Returns: boolean
      }
      can_process_organization_documents: {
        Args: { _organization_id: string }
        Returns: boolean
      }
      create_organization_invitation: {
        Args: { _firm_organization_id?: string; _organization_id: string }
        Returns: string
      }
      is_organization_member: {
        Args: { _organization_id: string }
        Returns: boolean
      }
    }
    Enums: {
      invoice_kind: "purchase" | "sale"
      invoice_status:
        | "imported"
        | "needs_review"
        | "needs_correction"
        | "validated"
        | "draft"
        | "issued"
        | "partially_paid"
        | "paid"
      member_role:
        | "company_owner"
        | "company_user"
        | "accountant"
        | "firm_manager"
      organization_kind: "company" | "accounting_firm"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      invoice_kind: ["purchase", "sale"],
      invoice_status: [
        "imported",
        "needs_review",
        "needs_correction",
        "validated",
        "draft",
        "issued",
        "partially_paid",
        "paid",
      ],
      member_role: [
        "company_owner",
        "company_user",
        "accountant",
        "firm_manager",
      ],
      organization_kind: ["company", "accounting_firm"],
    },
  },
} as const
