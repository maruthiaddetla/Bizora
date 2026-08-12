export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BusinessStatus = "draft" | "pending" | "published" | "sold";

export type Database = {
  public: {
    Tables: {
      states: {
        Row: {
          id: string;
          name: string;
          code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      districts: {
        Row: {
          id: string;
          state_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          state_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          state_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "districts_state_id_fkey";
            columns: ["state_id"];
            referencedRelation: "states";
            referencedColumns: ["id"];
          },
        ];
      };
      cities: {
        Row: {
          id: string;
          district_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          district_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          district_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cities_district_id_fkey";
            columns: ["district_id"];
            referencedRelation: "districts";
            referencedColumns: ["id"];
          },
        ];
      };
      localities: {
        Row: {
          id: string;
          city_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          city_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          city_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "localities_city_id_fkey";
            columns: ["city_id"];
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          parent_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          parent_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          parent_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      businesses: {
        Row: {
          id: string;
          seller_id: string | null;
          title: string;
          slug: string;
          description: string | null;
          asking_price: number | null;
          annual_revenue: number | null;
          annual_profit: number | null;
          ebitda: number | null;
          established_year: number | null;
          employees: number | null;
          category_id: string | null;
          state_id: string | null;
          district_id: string | null;
          city_id: string | null;
          locality_id: string | null;
          reason_for_sale: string | null;
          status: BusinessStatus;
          is_premium: boolean;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id?: string | null;
          title: string;
          slug: string;
          description?: string | null;
          asking_price?: number | null;
          annual_revenue?: number | null;
          annual_profit?: number | null;
          ebitda?: number | null;
          established_year?: number | null;
          employees?: number | null;
          category_id?: string | null;
          state_id?: string | null;
          district_id?: string | null;
          city_id?: string | null;
          locality_id?: string | null;
          reason_for_sale?: string | null;
          status?: BusinessStatus;
          is_premium?: boolean;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string | null;
          title?: string;
          slug?: string;
          description?: string | null;
          asking_price?: number | null;
          annual_revenue?: number | null;
          annual_profit?: number | null;
          ebitda?: number | null;
          established_year?: number | null;
          employees?: number | null;
          category_id?: string | null;
          state_id?: string | null;
          district_id?: string | null;
          city_id?: string | null;
          locality_id?: string | null;
          reason_for_sale?: string | null;
          status?: BusinessStatus;
          is_premium?: boolean;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "businesses_state_id_fkey";
            columns: ["state_id"];
            referencedRelation: "states";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "businesses_district_id_fkey";
            columns: ["district_id"];
            referencedRelation: "districts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "businesses_city_id_fkey";
            columns: ["city_id"];
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "businesses_locality_id_fkey";
            columns: ["locality_id"];
            referencedRelation: "localities";
            referencedColumns: ["id"];
          },
        ];
      };
      business_images: {
        Row: {
          id: string;
          business_id: string;
          image_url: string;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          image_url: string;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          image_url?: string;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_images_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type BusinessRow = Database["public"]["Tables"]["businesses"]["Row"];
