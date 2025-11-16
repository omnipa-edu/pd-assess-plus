export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      coaching_corner: {
        Row: {
          id: string
          created_by: string
          role_scope: "admin" | "supervisor"
          audience: "all" | "supervisors" | "learners"
          title: string
          content_type: "text" | "youtube" | "instagram"
          body: string | null
          video_url: string | null
          start_at: string | null
          end_at: string | null
          pinned: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by: string
          role_scope: "admin" | "supervisor"
          audience?: "all" | "supervisors" | "learners"
          title: string
          content_type: "text" | "youtube" | "instagram"
          body?: string | null
          video_url?: string | null
          start_at?: string | null
          end_at?: string | null
          pinned?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          role_scope?: "admin" | "supervisor"
          audience?: "all" | "supervisors" | "learners"
          title?: string
          content_type?: "text" | "youtube" | "instagram"
          body?: string | null
          video_url?: string | null
          start_at?: string | null
          end_at?: string | null
          pinned?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_corner_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      coaching_corner_scope: {
        Row: {
          id: string
          coaching_id: string
          supervisor_id: string
          created_at: string
        }
        Insert: {
          id?: string
          coaching_id: string
          supervisor_id: string
          created_at?: string
        }
        Update: {
          id?: string
          coaching_id?: string
          supervisor_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_corner_scope_coaching_id_fkey"
            columns: ["coaching_id"]
            referencedRelation: "coaching_corner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_corner_scope_supervisor_id_fkey"
            columns: ["supervisor_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      coaching_corner_dismissals: {
        Row: {
          id: string
          user_id: string
          coaching_id: string
          dismissed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          coaching_id: string
          dismissed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          coaching_id?: string
          dismissed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_corner_dismissals_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_corner_dismissals_coaching_id_fkey"
            columns: ["coaching_id"]
            referencedRelation: "coaching_corner"
            referencedColumns: ["id"]
          }
        ]
      }
      profile_progress: {
        Row: {
          id: string
          user_id: string
          onboarding_dismissed: boolean
          completed_tasks: Json
          first_login_at: string | null
          onboarding_completed_at: string | null
          dismissed_empty_states: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          onboarding_dismissed?: boolean
          completed_tasks?: Json
          first_login_at?: string | null
          onboarding_completed_at?: string | null
          dismissed_empty_states?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          onboarding_dismissed?: boolean
          completed_tasks?: Json
          first_login_at?: string | null
          onboarding_completed_at?: string | null
          dismissed_empty_states?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_progress_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          student_id: string | null
          program: string | null
          year_of_training: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          student_id?: string | null
          program?: string | null
          year_of_training?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          student_id?: string | null
          program?: string | null
          year_of_training?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: "student" | "supervisor" | "admin"
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: "student" | "supervisor" | "admin"
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: "student" | "supervisor" | "admin"
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      epa_assessments: {
        Row: {
          id: string
          student_id: string
          supervisor_id: string | null
          epa_number: string
          patient_demographics: string | null
          clinical_setting: string | null
          complexity: string | null
          observations: string | null
          feedback: string | null
          rating: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          supervisor_id?: string | null
          epa_number: string
          patient_demographics?: string | null
          clinical_setting?: string | null
          complexity?: string | null
          observations?: string | null
          feedback?: string | null
          rating?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          supervisor_id?: string | null
          epa_number?: string
          patient_demographics?: string | null
          clinical_setting?: string | null
          complexity?: string | null
          observations?: string | null
          feedback?: string | null
          rating?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "epa_assessments_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epa_assessments_supervisor_id_fkey"
            columns: ["supervisor_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      direct_observation_assessments: {
        Row: {
          id: string
          student_id: string
          supervisor_id: string | null
          procedure_type: string
          clinical_context: string | null
          performance_rating: string | null
          technical_skills: string | null
          professionalism: string | null
          feedback: string | null
          areas_for_improvement: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          supervisor_id?: string | null
          procedure_type: string
          clinical_context?: string | null
          performance_rating?: string | null
          technical_skills?: string | null
          professionalism?: string | null
          feedback?: string | null
          areas_for_improvement?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          supervisor_id?: string | null
          procedure_type?: string
          clinical_context?: string | null
          performance_rating?: string | null
          technical_skills?: string | null
          professionalism?: string | null
          feedback?: string | null
          areas_for_improvement?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_observation_assessments_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_observation_assessments_supervisor_id_fkey"
            columns: ["supervisor_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      narrative_assessments: {
        Row: {
          id: string
          student_id: string
          supervisor_id: string | null
          assessment_period: string | null
          clinical_context: string | null
          strengths: string | null
          areas_for_growth: string | null
          overall_progression: string | null
          recommendations: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          supervisor_id?: string | null
          assessment_period?: string | null
          clinical_context?: string | null
          strengths?: string | null
          areas_for_growth?: string | null
          overall_progression?: string | null
          recommendations?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          supervisor_id?: string | null
          assessment_period?: string | null
          clinical_context?: string | null
          strengths?: string | null
          areas_for_growth?: string | null
          overall_progression?: string | null
          recommendations?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "narrative_assessments_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "narrative_assessments_supervisor_id_fkey"
            columns: ["supervisor_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          table_name?: string
          record_id?: string
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: "student" | "supervisor" | "admin"
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "supervisor" | "admin"
    }
    CompositeTypes: {}
  }
}



