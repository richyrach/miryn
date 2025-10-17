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
      announcements: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          id: string
          message: string
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by: string
          id?: string
          message: string
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          id?: string
          message?: string
          title?: string
        }
        Relationships: []
      }
      banned_users: {
        Row: {
          banned_at: string
          banned_by: string
          expires_at: string | null
          id: string
          reason: string | null
          unbanned_at: string | null
          unbanned_by: string | null
          user_id: string
        }
        Insert: {
          banned_at?: string
          banned_by: string
          expires_at?: string | null
          id?: string
          reason?: string | null
          unbanned_at?: string | null
          unbanned_by?: string | null
          user_id: string
        }
        Update: {
          banned_at?: string
          banned_by?: string
          expires_at?: string | null
          id?: string
          reason?: string | null
          unbanned_at?: string | null
          unbanned_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          description: string
          id: string
          screenshot_url: string | null
          status: Database["public"]["Enums"]["feedback_status"]
          title: string
          type: Database["public"]["Enums"]["feedback_type"]
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          title: string
          type: Database["public"]["Enums"]["feedback_type"]
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["feedback_status"]
          title?: string
          type?: Database["public"]["Enums"]["feedback_type"]
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          custom_links: Json | null
          display_name: string
          handle: string
          hireable: boolean
          id: string
          intro_url: string | null
          location: string | null
          preferences: Json | null
          primary_cta: string | null
          primary_cta_url: string | null
          profile_layout: string | null
          skills: string[] | null
          social_links: Json | null
          theme_color: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          custom_links?: Json | null
          display_name: string
          handle: string
          hireable?: boolean
          id?: string
          intro_url?: string | null
          location?: string | null
          preferences?: Json | null
          primary_cta?: string | null
          primary_cta_url?: string | null
          profile_layout?: string | null
          skills?: string[] | null
          social_links?: Json | null
          theme_color?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          custom_links?: Json | null
          display_name?: string
          handle?: string
          hireable?: boolean
          id?: string
          intro_url?: string | null
          location?: string | null
          preferences?: Json | null
          primary_cta?: string | null
          primary_cta_url?: string | null
          profile_layout?: string | null
          skills?: string[] | null
          social_links?: Json | null
          theme_color?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_comments: {
        Row: {
          content: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          project_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          project_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          project_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_reactions: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_reactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          cover_url: string | null
          created_at: string
          ctas: Json | null
          id: string
          outcomes: Json | null
          owner_id: string
          published: boolean
          slug: string
          stack: string[] | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          ctas?: Json | null
          id?: string
          outcomes?: Json | null
          owner_id: string
          published?: boolean
          slug: string
          stack?: string[] | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          ctas?: Json | null
          id?: string
          outcomes?: Json | null
          owner_id?: string
          published?: boolean
          slug?: string
          stack?: string[] | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target"]
          updated_at?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          budget: number | null
          contact_info: string | null
          created_at: string | null
          deadline: string | null
          description: string
          id: string
          payment_method: string | null
          payment_status: string | null
          payment_tx_id: string | null
          requester_id: string
          requirements: Json | null
          selected_contact_method: string | null
          selected_payment_method: string | null
          seller_profile_id: string
          service_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          contact_info?: string | null
          created_at?: string | null
          deadline?: string | null
          description: string
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          payment_tx_id?: string | null
          requester_id: string
          requirements?: Json | null
          selected_contact_method?: string | null
          selected_payment_method?: string | null
          seller_profile_id: string
          service_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          contact_info?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          payment_tx_id?: string | null
          requester_id?: string
          requirements?: Json | null
          selected_contact_method?: string | null
          selected_payment_method?: string | null
          seller_profile_id?: string
          service_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          reviewer_id: string
          seller_profile_id: string
          service_id: string
          service_request_id: string
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          reviewer_id: string
          seller_profile_id: string
          service_id: string
          service_request_id: string
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          reviewer_id?: string
          seller_profile_id?: string
          service_id?: string
          service_request_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_reviews_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reviews_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reviews_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: true
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          accepted_payment_methods: Json | null
          active: boolean | null
          category: string
          contact_methods: Json | null
          created_at: string | null
          currency: string | null
          delivery_time: number | null
          description: string
          features: Json | null
          id: string
          images: Json | null
          price_amount: number | null
          pricing_type: string
          profile_id: string
          requirements: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          accepted_payment_methods?: Json | null
          active?: boolean | null
          category: string
          contact_methods?: Json | null
          created_at?: string | null
          currency?: string | null
          delivery_time?: number | null
          description: string
          features?: Json | null
          id?: string
          images?: Json | null
          price_amount?: number | null
          pricing_type: string
          profile_id: string
          requirements?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          accepted_payment_methods?: Json | null
          active?: boolean | null
          category?: string
          contact_methods?: Json | null
          created_at?: string | null
          currency?: string | null
          delivery_time?: number | null
          description?: string
          features?: Json | null
          id?: string
          images?: Json | null
          price_amount?: number | null
          pricing_type?: string
          profile_id?: string
          requirements?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          payment_method: string | null
          started_at: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payment_method?: string | null
          started_at?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payment_method?: string | null
          started_at?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_warnings: {
        Row: {
          acknowledged_at: string | null
          created_at: string | null
          id: string
          reason: string
          severity: string | null
          user_id: string
          warned_by: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string | null
          id?: string
          reason: string
          severity?: string | null
          user_id: string
          warned_by?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string | null
          id?: string
          reason?: string
          severity?: string | null
          user_id?: string
          warned_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          handle: string | null
          hireable: boolean | null
          id: string | null
          intro_url: string | null
          location: string | null
          primary_cta: string | null
          primary_cta_url: string | null
          role: string | null
          skills: string[] | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_moderate_user: {
        Args: { moderator_id: string; target_id: string }
        Returns: boolean
      }
      delete_user_account: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      get_follower_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_following_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_project_reaction_count: {
        Args: { target_project_id: string }
        Returns: number
      }
      get_warning_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      has_premium: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_ban_active: {
        Args: {
          ban_record: Database["public"]["Tables"]["banned_users"]["Row"]
        }
        Returns: boolean
      }
      is_banned: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_following: {
        Args: { follower: string; following: string }
        Returns: boolean
      }
      user_in_conversation: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "owner"
        | "admin"
        | "moderator"
        | "user"
        | "support"
        | "content_mod"
        | "junior_mod"
        | "partner"
        | "verified"
        | "developer"
        | "early_supporter"
        | "vip"
      feedback_status: "open" | "in_progress" | "resolved" | "dismissed"
      feedback_type: "bug" | "suggestion"
      report_status: "open" | "reviewing" | "resolved" | "dismissed"
      report_target: "user" | "project" | "service" | "message"
      subscription_tier: "free" | "premium_user" | "premium_seller"
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
        "owner",
        "admin",
        "moderator",
        "user",
        "support",
        "content_mod",
        "junior_mod",
        "partner",
        "verified",
        "developer",
        "early_supporter",
        "vip",
      ],
      feedback_status: ["open", "in_progress", "resolved", "dismissed"],
      feedback_type: ["bug", "suggestion"],
      report_status: ["open", "reviewing", "resolved", "dismissed"],
      report_target: ["user", "project", "service", "message"],
      subscription_tier: ["free", "premium_user", "premium_seller"],
    },
  },
} as const
