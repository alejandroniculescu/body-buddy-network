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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      check_ins: {
        Row: {
          created_at: string
          dose: string | null
          felt_after: string | null
          group_id: string | null
          id: string
          notes: string | null
          technique: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dose?: string | null
          felt_after?: string | null
          group_id?: string | null
          id?: string
          notes?: string | null
          technique: string
          user_id: string
        }
        Update: {
          created_at?: string
          dose?: string | null
          felt_after?: string | null
          group_id?: string | null
          id?: string
          notes?: string | null
          technique?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_applications: {
        Row: {
          created_at: string
          group_id: string
          id: string
          intake_id: string | null
          note: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          intake_id?: string | null
          note?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          intake_id?: string | null
          note?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_applications_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_applications_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "intakes"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role_in_group: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role_in_group?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role_in_group?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          cadence: string
          capacity: number
          cohort: number
          created_at: string
          duration_band: string
          focus_statement: string
          id: string
          leader_id: string | null
          leader_name: string
          location: string
          member_count: number
          mode: Database["public"]["Enums"]["meeting_mode"]
          name: string
          onboarder_id: string | null
          onboarder_name: string
          region: string
          status: Database["public"]["Enums"]["group_status"]
          tolerance_band: string
          updated_at: string
        }
        Insert: {
          cadence: string
          capacity?: number
          cohort?: number
          created_at?: string
          duration_band: string
          focus_statement?: string
          id?: string
          leader_id?: string | null
          leader_name: string
          location: string
          member_count?: number
          mode: Database["public"]["Enums"]["meeting_mode"]
          name: string
          onboarder_id?: string | null
          onboarder_name: string
          region: string
          status?: Database["public"]["Enums"]["group_status"]
          tolerance_band: string
          updated_at?: string
        }
        Update: {
          cadence?: string
          capacity?: number
          cohort?: number
          created_at?: string
          duration_band?: string
          focus_statement?: string
          id?: string
          leader_id?: string | null
          leader_name?: string
          location?: string
          member_count?: number
          mode?: Database["public"]["Enums"]["meeting_mode"]
          name?: string
          onboarder_id?: string | null
          onboarder_name?: string
          region?: string
          status?: Database["public"]["Enums"]["group_status"]
          tolerance_band?: string
          updated_at?: string
        }
        Relationships: []
      }
      intakes: {
        Row: {
          anticoagulants: boolean
          bleeding_disorder: boolean
          cleared_for_exercise: boolean
          completed: boolean
          created_at: string
          duration_band: string | null
          goal_tags: string[]
          goals: string | null
          id: string
          injury_details: string | null
          movement_tolerance: string | null
          neuro_symptoms: string[]
          recent_injury: boolean
          red_flag_stop: boolean
          red_flags: string[]
          regions: string[]
          seen_clinician: boolean
          skin_condition: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          anticoagulants?: boolean
          bleeding_disorder?: boolean
          cleared_for_exercise?: boolean
          completed?: boolean
          created_at?: string
          duration_band?: string | null
          goal_tags?: string[]
          goals?: string | null
          id?: string
          injury_details?: string | null
          movement_tolerance?: string | null
          neuro_symptoms?: string[]
          recent_injury?: boolean
          red_flag_stop?: boolean
          red_flags?: string[]
          regions?: string[]
          seen_clinician?: boolean
          skin_condition?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          anticoagulants?: boolean
          bleeding_disorder?: boolean
          cleared_for_exercise?: boolean
          completed?: boolean
          created_at?: string
          duration_band?: string | null
          goal_tags?: string[]
          goals?: string | null
          id?: string
          injury_details?: string | null
          movement_tolerance?: string | null
          neuro_symptoms?: string[]
          recent_injury?: boolean
          red_flag_stop?: boolean
          red_flags?: string[]
          regions?: string[]
          seen_clinician?: boolean
          skin_condition?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      technique_optins: {
        Row: {
          contraindications_confirmed: boolean
          created_at: string
          id: string
          stop_rules_acknowledged: boolean
          technique: string
          user_id: string
        }
        Insert: {
          contraindications_confirmed?: boolean
          created_at?: string
          id?: string
          stop_rules_acknowledged?: boolean
          technique: string
          user_id: string
        }
        Update: {
          contraindications_confirmed?: boolean
          created_at?: string
          id?: string
          stop_rules_acknowledged?: boolean
          technique?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      runs_group: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "member" | "onboarder" | "leader" | "admin"
      application_status: "pending" | "accepted" | "declined" | "withdrawn"
      group_status: "open" | "full" | "closed"
      meeting_mode: "online" | "in_person"
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
      app_role: ["member", "onboarder", "leader", "admin"],
      application_status: ["pending", "accepted", "declined", "withdrawn"],
      group_status: ["open", "full", "closed"],
      meeting_mode: ["online", "in_person"],
    },
  },
} as const
