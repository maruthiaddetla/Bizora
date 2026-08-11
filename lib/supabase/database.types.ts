export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          title: string;
          location: string;
          price: string | null;
          description: string;
          image_url: string;
          category: string;
          premium: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          location: string;
          price?: string | null;
          description: string;
          image_url: string;
          category: string;
          premium?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          location?: string;
          price?: string | null;
          description?: string;
          image_url?: string;
          category?: string;
          premium?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type BusinessRow = Database["public"]["Tables"]["businesses"]["Row"];
