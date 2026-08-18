export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BusinessStatus =
  | "draft"
  | "pending"
  | "published"
  | "rejected"
  | "sold";

export type ProfileRole = "buyer" | "seller" | "broker" | "admin";

export type EnquiryStatus = "new" | "read" | "responded" | "closed";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: ProfileRole;
          full_name: string | null;
          phone: string | null;
          company_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: ProfileRole;
          full_name?: string | null;
          phone?: string | null;
          company_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: ProfileRole;
          full_name?: string | null;
          phone?: string | null;
          company_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
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
          rejection_reason: string | null;
          submitted_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
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
          rejection_reason?: string | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
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
          rejection_reason?: string | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_seller_id_fkey";
            columns: ["seller_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "businesses_reviewed_by_fkey";
            columns: ["reviewed_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
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
          storage_path: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          image_url: string;
          storage_path?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          image_url?: string;
          storage_path?: string | null;
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
      enquiries: {
        Row: {
          id: string;
          business_id: string;
          buyer_id: string;
          seller_id: string;
          message: string;
          status: EnquiryStatus;
          seller_response: string | null;
          created_at: string;
          updated_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          business_id: string;
          buyer_id: string;
          seller_id?: string;
          message: string;
          status?: EnquiryStatus;
          seller_response?: string | null;
          created_at?: string;
          updated_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          business_id?: string;
          buyer_id?: string;
          seller_id?: string;
          message?: string;
          status?: EnquiryStatus;
          seller_response?: string | null;
          created_at?: string;
          updated_at?: string;
          responded_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "enquiries_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enquiries_buyer_id_fkey";
            columns: ["buyer_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enquiries_seller_id_fkey";
            columns: ["seller_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_business_owner: {
        Args: { p_business_id: string };
        Returns: boolean;
      };
      promote_to_seller: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      set_primary_business_image: {
        Args: { p_image_id: string };
        Returns: boolean;
      };
      owner_can_edit_business_images: {
        Args: { p_business_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type BusinessRow = Database["public"]["Tables"]["businesses"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type EnquiryRow = Database["public"]["Tables"]["enquiries"]["Row"];
