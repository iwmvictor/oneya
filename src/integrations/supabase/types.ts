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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      transcript_segments: {
        Row: {
          confidence: number | null
          end_time: number
          id: string
          language: string | null
          position: number
          speaker: string | null
          start_time: number
          text: string
          transcript_id: string
        }
        Insert: {
          confidence?: number | null
          end_time: number
          id?: string
          language?: string | null
          position: number
          speaker?: string | null
          start_time: number
          text: string
          transcript_id: string
        }
        Update: {
          confidence?: number | null
          end_time?: number
          id?: string
          language?: string | null
          position?: number
          speaker?: string | null
          start_time?: number
          text?: string
          transcript_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcript_segments_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      transcription_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          presenter: string | null
          program: string | null
          started_at: string
          station_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          presenter?: string | null
          program?: string | null
          started_at?: string
          station_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          presenter?: string | null
          program?: string | null
          started_at?: string
          station_id?: string
        }
        Relationships: []
      }
      transcripts: {
        Row: {
          audio_bytes: number | null
          audio_format: string | null
          created_at: string
          duration_seconds: number | null
          error: string | null
          full_text: string | null
          id: string
          language: string | null
          languages: string[]
          model: string | null
          presenter: string | null
          program: string | null
          provider: string | null
          quality: string | null
          requested_by: string | null
          sequence: number
          session_id: string | null
          station_id: string
          status: Database["public"]["Enums"]["transcript_status"]
          updated_at: string
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          audio_bytes?: number | null
          audio_format?: string | null
          created_at?: string
          duration_seconds?: number | null
          error?: string | null
          full_text?: string | null
          id?: string
          language?: string | null
          languages?: string[]
          model?: string | null
          presenter?: string | null
          program?: string | null
          provider?: string | null
          quality?: string | null
          requested_by?: string | null
          sequence?: number
          session_id?: string | null
          station_id: string
          status?: Database["public"]["Enums"]["transcript_status"]
          updated_at?: string
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          audio_bytes?: number | null
          audio_format?: string | null
          created_at?: string
          duration_seconds?: number | null
          error?: string | null
          full_text?: string | null
          id?: string
          language?: string | null
          languages?: string[]
          model?: string | null
          presenter?: string | null
          program?: string | null
          provider?: string | null
          quality?: string | null
          requested_by?: string | null
          sequence?: number
          session_id?: string | null
          station_id?: string
          status?: Database["public"]["Enums"]["transcript_status"]
          updated_at?: string
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "transcription_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
    }
    Enums: {
      app_role: "admin" | "user"
      transcript_status:
        | "queued"
        | "capturing"
        | "processing"
        | "available"
        | "failed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
      transcript_status: [
        "queued",
        "capturing",
        "processing",
        "available",
        "failed",
      ],
    },
  },
} as const
