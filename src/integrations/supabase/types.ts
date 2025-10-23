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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      brokers: {
        Row: {
          address: string | null
          company_id: string
          company_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id: string
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string
          company_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brokers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_contacts: {
        Row: {
          carrier_id: string
          company_id: string
          contact_date: string
          contact_method: string | null
          contact_type: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
        }
        Insert: {
          carrier_id: string
          company_id: string
          contact_date?: string
          contact_method?: string | null
          contact_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          carrier_id?: string
          company_id?: string
          contact_date?: string
          contact_method?: string | null
          contact_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carrier_contacts_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrier_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      carriers: {
        Row: {
          address: string | null
          company_id: string
          contract_signed: boolean | null
          contract_signed_at: string | null
          created_at: string
          docusign_envelope_id: string | null
          docusign_status: string | null
          dot_number: string | null
          email: string | null
          id: string
          insurance_expiry: string | null
          mc_number: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id: string
          contract_signed?: boolean | null
          contract_signed_at?: string | null
          created_at?: string
          docusign_envelope_id?: string | null
          docusign_status?: string | null
          dot_number?: string | null
          email?: string | null
          id?: string
          insurance_expiry?: string | null
          mc_number?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string
          contract_signed?: boolean | null
          contract_signed_at?: string | null
          created_at?: string
          docusign_envelope_id?: string | null
          docusign_status?: string | null
          dot_number?: string | null
          email?: string | null
          id?: string
          insurance_expiry?: string | null
          mc_number?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carriers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          airwallex_account_id: string | null
          airwallex_api_key: string | null
          created_at: string
          docusign_api_key: string | null
          docusign_enabled: boolean | null
          email: string | null
          id: string
          name: string
          phone: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          airwallex_account_id?: string | null
          airwallex_api_key?: string | null
          created_at?: string
          docusign_api_key?: string | null
          docusign_enabled?: boolean | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          airwallex_account_id?: string | null
          airwallex_api_key?: string | null
          created_at?: string
          docusign_api_key?: string | null
          docusign_enabled?: boolean | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          carrier_id: string | null
          company_id: string
          created_at: string
          document_type: string
          driver_id: string | null
          file_name: string
          file_path: string | null
          file_size: number | null
          id: string
          load_id: string | null
          uploaded_by: string | null
          uploaded_for: string | null
          visibility: string | null
        }
        Insert: {
          carrier_id?: string | null
          company_id: string
          created_at?: string
          document_type: string
          driver_id?: string | null
          file_name: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          load_id?: string | null
          uploaded_by?: string | null
          uploaded_for?: string | null
          visibility?: string | null
        }
        Update: {
          carrier_id?: string | null
          company_id?: string
          created_at?: string
          document_type?: string
          driver_id?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          load_id?: string | null
          uploaded_by?: string | null
          uploaded_for?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          carrier_id: string | null
          company_id: string
          created_at: string
          current_location_lat: number | null
          current_location_lng: number | null
          email: string | null
          first_name: string
          id: string
          last_location_update: string | null
          last_name: string
          license_expiry: string | null
          license_number: string | null
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          carrier_id?: string | null
          company_id: string
          created_at?: string
          current_location_lat?: number | null
          current_location_lng?: number | null
          email?: string | null
          first_name: string
          id?: string
          last_location_update?: string | null
          last_name: string
          license_expiry?: string | null
          license_number?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          carrier_id?: string | null
          company_id?: string
          created_at?: string
          current_location_lat?: number | null
          current_location_lng?: number | null
          email?: string | null
          first_name?: string
          id?: string
          last_location_update?: string | null
          last_name?: string
          license_expiry?: string | null
          license_number?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          airwallex_payment_id: string | null
          airwallex_payment_link: string | null
          amount: number
          broker_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          link_created_at: string | null
          load_id: string | null
          notes: string | null
          payment_date: string | null
          payment_link_expires_at: string | null
          payment_link_id: string | null
          payment_status: string | null
          status: string
          updated_at: string
        }
        Insert: {
          airwallex_payment_id?: string | null
          airwallex_payment_link?: string | null
          amount: number
          broker_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          due_date: string
          id?: string
          invoice_date?: string
          invoice_number: string
          link_created_at?: string | null
          load_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_link_expires_at?: string | null
          payment_link_id?: string | null
          payment_status?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          airwallex_payment_id?: string | null
          airwallex_payment_link?: string | null
          amount?: number
          broker_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          link_created_at?: string | null
          load_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_link_expires_at?: string | null
          payment_link_id?: string | null
          payment_status?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      loads: {
        Row: {
          broker_id: string | null
          carrier_id: string | null
          commodity: string | null
          company_id: string
          contract_signed: boolean | null
          created_at: string
          created_by: string | null
          delivery_city: string | null
          delivery_date: string | null
          delivery_location: string
          delivery_notes: string | null
          delivery_state: string | null
          distance: number | null
          driver_id: string | null
          factoring: boolean | null
          id: string
          load_number: string
          notes: string | null
          pickup_city: string | null
          pickup_date: string | null
          pickup_location: string
          pickup_notes: string | null
          pickup_state: string | null
          rate: number | null
          reference_number: string | null
          sale_status: string | null
          sales_agent_id: string | null
          sales_percentage: number | null
          sales_user_id: string | null
          status: Database["public"]["Enums"]["load_status"] | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          broker_id?: string | null
          carrier_id?: string | null
          commodity?: string | null
          company_id: string
          contract_signed?: boolean | null
          created_at?: string
          created_by?: string | null
          delivery_city?: string | null
          delivery_date?: string | null
          delivery_location: string
          delivery_notes?: string | null
          delivery_state?: string | null
          distance?: number | null
          driver_id?: string | null
          factoring?: boolean | null
          id?: string
          load_number: string
          notes?: string | null
          pickup_city?: string | null
          pickup_date?: string | null
          pickup_location: string
          pickup_notes?: string | null
          pickup_state?: string | null
          rate?: number | null
          reference_number?: string | null
          sale_status?: string | null
          sales_agent_id?: string | null
          sales_percentage?: number | null
          sales_user_id?: string | null
          status?: Database["public"]["Enums"]["load_status"] | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          broker_id?: string | null
          carrier_id?: string | null
          commodity?: string | null
          company_id?: string
          contract_signed?: boolean | null
          created_at?: string
          created_by?: string | null
          delivery_city?: string | null
          delivery_date?: string | null
          delivery_location?: string
          delivery_notes?: string | null
          delivery_state?: string | null
          distance?: number | null
          driver_id?: string | null
          factoring?: boolean | null
          id?: string
          load_number?: string
          notes?: string | null
          pickup_city?: string | null
          pickup_date?: string | null
          pickup_location?: string
          pickup_notes?: string | null
          pickup_state?: string | null
          rate?: number | null
          reference_number?: string | null
          sale_status?: string | null
          sales_agent_id?: string | null
          sales_percentage?: number | null
          sales_user_id?: string | null
          status?: Database["public"]["Enums"]["load_status"] | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loads_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loads_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loads_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loads_sales_agent_id_fkey"
            columns: ["sales_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          accuracy: number | null
          company_id: string
          created_at: string
          driver_id: string
          heading: number | null
          id: string
          latitude: number
          load_id: string | null
          longitude: number
          speed: number | null
          timestamp: string
        }
        Insert: {
          accuracy?: number | null
          company_id: string
          created_at?: string
          driver_id: string
          heading?: number | null
          id?: string
          latitude: number
          load_id?: string | null
          longitude: number
          speed?: number | null
          timestamp?: string
        }
        Update: {
          accuracy?: number | null
          company_id?: string
          created_at?: string
          driver_id?: string
          heading?: number | null
          id?: string
          latitude?: number
          load_id?: string | null
          longitude?: number
          speed?: number | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          author_id: string
          company_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          is_read: boolean | null
          note_text: string
          priority: string | null
          recipient_id: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          company_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          is_read?: boolean | null
          note_text: string
          priority?: string | null
          recipient_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          company_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_read?: boolean | null
          note_text?: string
          priority?: string | null
          recipient_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email_notifications: boolean | null
          first_name: string | null
          id: string
          is_master_admin: boolean | null
          last_name: string | null
          notifications_enabled: boolean | null
          phone: string | null
          sms_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email_notifications?: boolean | null
          first_name?: string | null
          id?: string
          is_master_admin?: boolean | null
          last_name?: string | null
          notifications_enabled?: boolean | null
          phone?: string | null
          sms_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email_notifications?: boolean | null
          first_name?: string | null
          id?: string
          is_master_admin?: boolean | null
          last_name?: string | null
          notifications_enabled?: boolean | null
          phone?: string | null
          sms_notifications?: boolean | null
          updated_at?: string
          user_id?: string
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
      user_roles: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      wip_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          carrier_id: string | null
          company_id: string
          driver_id: string | null
          id: string
          load_id: string | null
          notes: string | null
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          carrier_id?: string | null
          company_id: string
          driver_id?: string | null
          id?: string
          load_id?: string | null
          notes?: string | null
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          carrier_id?: string | null
          company_id?: string
          driver_id?: string | null
          id?: string
          load_id?: string | null
          notes?: string | null
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wip_assignments_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wip_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wip_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wip_assignments_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_company_for_user: {
        Args: {
          _company_name: string
          _is_georgia_admin?: boolean
          _user_id: string
        }
        Returns: string
      }
      get_user_company: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "dispatcher"
        | "driver"
        | "carrier"
        | "broker"
        | "sales"
        | "treasury"
      load_status:
        | "pending"
        | "assigned"
        | "picked"
        | "in_transit"
        | "delivered"
        | "cancelled"
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
    Enums: {
      app_role: [
        "admin",
        "dispatcher",
        "driver",
        "carrier",
        "broker",
        "sales",
        "treasury",
      ],
      load_status: [
        "pending",
        "assigned",
        "picked",
        "in_transit",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
