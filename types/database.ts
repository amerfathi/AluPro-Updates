export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "staff" | "client";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          role: UserRole;
          preferred_language: "ar" | "en";
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          role?: UserRole;
          preferred_language?: "ar" | "en";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      leads: {
        Row: {
          id: string;
          full_name: string;
          company_name: string | null;
          phone: string;
          email: string;
          lead_type: "quote" | "field_visit" | "contact" | "maintenance";
          service_type: string | null;
          project_type: string | null;
          city: string | null;
          address: string | null;
          notes: string | null;
          preferred_contact_method: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          company_name?: string | null;
          phone: string;
          email: string;
          lead_type: "quote" | "field_visit" | "contact" | "maintenance";
          service_type?: string | null;
          project_type?: string | null;
          city?: string | null;
          address?: string | null;
          notes?: string | null;
          preferred_contact_method?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
      };
      lead_attachments: {
        Row: {
          id: string;
          lead_id: string;
          file_path: string;
          file_name: string;
          file_type: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          file_path: string;
          file_name: string;
          file_type: string;
          uploaded_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lead_attachments"]["Insert"]>;
      };
      clients: {
        Row: {
          id: string;
          profile_id: string;
          company_name: string | null;
          billing_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          company_name?: string | null;
          billing_notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
      };
      projects: {
        Row: {
          id: string;
          client_id: string;
          project_name: string;
          slug: string;
          project_type: string;
          service_type: string;
          location_city: string | null;
          location_address: string | null;
          status: string;
          overall_progress: number;
          contract_value: number | null;
          start_date: string | null;
          expected_completion_date: string | null;
          actual_completion_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          project_name: string;
          slug: string;
          project_type: string;
          service_type: string;
          location_city?: string | null;
          location_address?: string | null;
          status?: string;
          overall_progress?: number;
          contract_value?: number | null;
          start_date?: string | null;
          expected_completion_date?: string | null;
          actual_completion_date?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      project_stages: {
        Row: {
          id: string;
          project_id: string;
          stage_key: string;
          stage_label_ar: string;
          stage_label_en: string;
          status: string;
          progress_percent: number;
          notes: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          stage_key: string;
          stage_label_ar: string;
          stage_label_en: string;
          status?: string;
          progress_percent?: number;
          notes?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_stages"]["Insert"]>;
      };
      project_updates: {
        Row: {
          id: string;
          project_id: string;
          stage_id: string | null;
          title: string;
          description: string;
          visible_to_client: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          stage_id?: string | null;
          title: string;
          description: string;
          visible_to_client?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_updates"]["Insert"]>;
      };
      project_documents: {
        Row: {
          id: string;
          project_id: string;
          document_type: string;
          title: string;
          file_path: string;
          uploaded_by: string | null;
          visible_to_client: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          document_type: string;
          title: string;
          file_path: string;
          uploaded_by?: string | null;
          visible_to_client?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_documents"]["Insert"]>;
      };
      quotes: {
        Row: {
          id: string;
          lead_id: string | null;
          client_id: string | null;
          quote_number: string;
          status: string;
          currency: string;
          subtotal: number;
          discount: number;
          tax: number;
          total: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          client_id?: string | null;
          quote_number: string;
          status?: string;
          currency?: string;
          subtotal?: number;
          discount?: number;
          tax?: number;
          total?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["quotes"]["Insert"]>;
      };
      quote_items: {
        Row: {
          id: string;
          quote_id: string;
          item_name: string;
          item_description: string | null;
          quantity: number;
          unit: string;
          unit_price: number;
          total_price: number;
        };
        Insert: {
          id?: string;
          quote_id: string;
          item_name: string;
          item_description?: string | null;
          quantity: number;
          unit: string;
          unit_price: number;
          total_price: number;
        };
        Update: Partial<Database["public"]["Tables"]["quote_items"]["Insert"]>;
      };
      maintenance_tickets: {
        Row: {
          id: string;
          client_id: string | null;
          project_id: string | null;
          subject: string;
          issue_type: string;
          priority: string;
          description: string;
          status: string;
          preferred_contact_method: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          project_id?: string | null;
          subject: string;
          issue_type: string;
          priority?: string;
          description: string;
          status?: string;
          preferred_contact_method?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["maintenance_tickets"]["Insert"]>;
      };
      maintenance_attachments: {
        Row: {
          id: string;
          ticket_id: string;
          file_path: string;
          file_name: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          file_path: string;
          file_name: string;
          uploaded_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["maintenance_attachments"]["Insert"]>;
      };
      portfolio_projects: {
        Row: {
          id: string;
          slug: string;
          title_ar: string;
          title_en: string;
          category: string;
          summary_ar: string;
          summary_en: string;
          location: string | null;
          completion_year: number | null;
          featured: boolean;
          published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title_ar: string;
          title_en: string;
          category: string;
          summary_ar: string;
          summary_en: string;
          location?: string | null;
          completion_year?: number | null;
          featured?: boolean;
          published?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["portfolio_projects"]["Insert"]>;
      };
      portfolio_images: {
        Row: {
          id: string;
          portfolio_project_id: string;
          file_path: string;
          alt_ar: string | null;
          alt_en: string | null;
          sort_order: number;
          is_before: boolean;
          is_after: boolean;
        };
        Insert: {
          id?: string;
          portfolio_project_id: string;
          file_path: string;
          alt_ar?: string | null;
          alt_en?: string | null;
          sort_order?: number;
          is_before?: boolean;
          is_after?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["portfolio_images"]["Insert"]>;
      };
      technical_library_entries: {
        Row: {
          id: string;
          entry_type: string;
          slug: string;
          title_ar: string;
          title_en: string;
          summary_ar: string;
          summary_en: string;
          specs_json: Json;
          download_file_path: string | null;
          published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          entry_type: string;
          slug: string;
          title_ar: string;
          title_en: string;
          summary_ar: string;
          summary_en: string;
          specs_json?: Json;
          download_file_path?: string | null;
          published?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["technical_library_entries"]["Insert"]>;
      };
      notifications_log: {
        Row: {
          id: string;
          project_id: string | null;
          client_id: string | null;
          channel: string;
          message_body: string;
          sent_status: string;
          sent_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          client_id?: string | null;
          channel: string;
          message_body: string;
          sent_status?: string;
          sent_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications_log"]["Insert"]>;
      };
      site_settings: {
        Row: {
          id: string;
          key: string;
          value_json: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value_json: Json;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
    };
    CompositeTypes: Record<string, never>;
  };
}

