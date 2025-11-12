export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          plan: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          plan?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: string;
          org_id: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: string;
          org_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: string;
          org_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          description: string | null;
          address: string;
          city: string;
          postal_code: string | null;
          country: string;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
      };
      lots: {
        Row: {
          id: string;
          property_id: string;
          org_id: string;
          title: string;
          description: string | null;
          bedrooms: number;
          bathrooms: number;
          max_guests: number;
          base_price: number | null;
          cleaning_fee: number;
          tourist_tax: number;
          pets_allowed: boolean;
          status: string;
          created_at: string;
          updated_at: string;
        };
      };
      reservations: {
        Row: {
          id: string;
          lot_id: string;
          org_id: string;
          guest_name: string;
          guest_email: string;
          guest_phone: string | null;
          check_in: string;
          check_out: string;
          guests_count: number;
          total_price: number;
          status: string;
          channel: string;
          external_id: string | null;
          payment_status: string;
          created_at: string;
          updated_at: string;
        };
      };
      threads: {
        Row: {
          id: string;
          org_id: string;
          reservation_id: string | null;
          channel: string;
          status: string;
          opened_by: string | null;
          language: string;
          last_message_at: string | null;
          opened_at: string;
          closed_at: string | null;
          created_at: string;
        };
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          author_type: string;
          author_id: string | null;
          body: string;
          meta: Json;
          created_at: string;
        };
      };
    };
  };
}
