import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Create a client that works during build time
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Database types (will be auto-generated later)
export interface Database {
  public: {
    Tables: {
      glaze_recipes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          finish: string;
          composition: any; // JSON array
          date: string;
          batch_number: string;
          photos: string[] | null;
          clay_body_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color: string;
          finish: string;
          composition: any;
          date: string;
          batch_number: string;
          photos?: string[] | null;
          clay_body_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          finish?: string;
          composition?: any;
          date?: string;
          batch_number?: string;
          photos?: string[] | null;
          clay_body_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      clay_bodies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          shrinkage: number;
          color: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          shrinkage: number;
          color: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          shrinkage?: number;
          color?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      raw_materials: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          base_material_type: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          base_material_type: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          base_material_type?: string;
          description?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
