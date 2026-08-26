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
  | "sold"
  | "leased"
  | "withdrawn";

export type ListingType = "business" | "commercial_space";

export type SpaceType =
  | "retail_shop"
  | "restaurant_cafe"
  | "office"
  | "warehouse"
  | "industrial"
  | "commercial_land"
  | "other";

export type ListingPurpose = "rent" | "lease";

export type FurnishedOption =
  | "furnished"
  | "semi_furnished"
  | "unfurnished"
  | "not_applicable";

export type ProfileRole = "buyer" | "seller" | "broker" | "admin";

export type EnquiryStatus = "new" | "read" | "responded" | "closed";

export type NotificationType =
  | "listing_submitted"
  | "listing_approved"
  | "listing_rejected"
  | "new_enquiry"
  | "enquiry_response"
  | "listing_sold"
  | "listing_leased"
  | "listing_resubmitted";

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
          display_name: string | null;
          bio: string | null;
          avatar_storage_path: string | null;
          website: string | null;
          city: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: ProfileRole;
          full_name?: string | null;
          phone?: string | null;
          company_name?: string | null;
          display_name?: string | null;
          bio?: string | null;
          avatar_storage_path?: string | null;
          website?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: ProfileRole;
          full_name?: string | null;
          phone?: string | null;
          company_name?: string | null;
          display_name?: string | null;
          bio?: string | null;
          avatar_storage_path?: string | null;
          website?: string | null;
          city?: string | null;
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
          locality_name: string | null;
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
          listing_type: ListingType;
          space_type: SpaceType | null;
          listing_purpose: ListingPurpose | null;
          monthly_rent: number | null;
          security_deposit: number | null;
          area_sqft: number | null;
          floor: string | null;
          parking_spaces: number | null;
          furnished: FurnishedOption | null;
          lease_term_months: number | null;
          available_from: string | null;
          business_usage: string | null;
          closed_at: string | null;
          published_at: string | null;
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
          locality_name?: string | null;
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
          listing_type?: ListingType;
          space_type?: SpaceType | null;
          listing_purpose?: ListingPurpose | null;
          monthly_rent?: number | null;
          security_deposit?: number | null;
          area_sqft?: number | null;
          floor?: string | null;
          parking_spaces?: number | null;
          furnished?: FurnishedOption | null;
          lease_term_months?: number | null;
          available_from?: string | null;
          business_usage?: string | null;
          closed_at?: string | null;
          published_at?: string | null;
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
          locality_name?: string | null;
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
          listing_type?: ListingType;
          space_type?: SpaceType | null;
          listing_purpose?: ListingPurpose | null;
          monthly_rent?: number | null;
          security_deposit?: number | null;
          area_sqft?: number | null;
          floor?: string | null;
          parking_spaces?: number | null;
          furnished?: FurnishedOption | null;
          lease_term_months?: number | null;
          available_from?: string | null;
          business_usage?: string | null;
          closed_at?: string | null;
          published_at?: string | null;
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
      favorites: {
        Row: {
          id: string;
          user_id: string;
          business_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          business_id: string | null;
          enquiry_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          business_id?: string | null;
          enquiry_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          title?: string;
          message?: string;
          business_id?: string | null;
          enquiry_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_enquiry_id_fkey";
            columns: ["enquiry_id"];
            referencedRelation: "enquiries";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      public_seller_profiles: {
        Row: {
          id: string;
          display_name: string;
          company_name: string | null;
          bio: string | null;
          avatar_storage_path: string | null;
          website: string | null;
          city: string | null;
          member_since: string;
        };
        Relationships: [];
      };
    };
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
      transition_listing_status: {
        Args: { p_listing_id: string; p_new_status: string };
        Returns: Database["public"]["Tables"]["businesses"]["Row"];
      };
      get_public_closed_listing: {
        Args: { p_listing_id: string };
        Returns: {
          id: string;
          title: string;
          status: string;
          listing_type: string;
          category_name: string | null;
          location_label: string | null;
          primary_image_url: string | null;
          closed_at: string | null;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type BusinessRow = Database["public"]["Tables"]["businesses"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type EnquiryRow = Database["public"]["Tables"]["enquiries"]["Row"];
export type FavoriteRow = Database["public"]["Tables"]["favorites"]["Row"];
export type NotificationRow =
  Database["public"]["Tables"]["notifications"]["Row"];
