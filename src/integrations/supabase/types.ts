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
      achievement_definitions: {
        Row: {
          category: Database["public"]["Enums"]["achievement_category"]
          code: string
          color: string | null
          created_at: string | null
          criteria: Json
          description: string
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          rarity: Database["public"]["Enums"]["achievement_rarity"] | null
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["achievement_category"]
          code: string
          color?: string | null
          created_at?: string | null
          criteria: Json
          description: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rarity?: Database["public"]["Enums"]["achievement_rarity"] | null
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["achievement_category"]
          code?: string
          color?: string | null
          created_at?: string | null
          criteria?: Json
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rarity?: Database["public"]["Enums"]["achievement_rarity"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      achievement_progress: {
        Row: {
          achievement_code: string
          created_at: string | null
          current_value: number | null
          id: string
          last_updated_at: string | null
          target_value: number
          user_id: string
        }
        Insert: {
          achievement_code: string
          created_at?: string | null
          current_value?: number | null
          id?: string
          last_updated_at?: string | null
          target_value: number
          user_id: string
        }
        Update: {
          achievement_code?: string
          created_at?: string | null
          current_value?: number | null
          id?: string
          last_updated_at?: string | null
          target_value?: number
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_user_id: string | null
          created_at: string
          diff: Json | null
          entity: string
          entity_id: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_user_id?: string | null
          created_at?: string
          diff?: Json | null
          entity: string
          entity_id: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          actor_user_id?: string | null
          created_at?: string
          diff?: Json | null
          entity?: string
          entity_id?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      coaching_corner: {
        Row: {
          audience: string
          body: string | null
          content_type: string
          created_at: string | null
          created_by: string
          creator_handle: string | null
          creator_name: string | null
          creator_url: string | null
          end_at: string | null
          id: string
          is_active: boolean | null
          license_note: string | null
          pinned: boolean | null
          role_scope: string
          source_platform: string | null
          source_url: string | null
          start_at: string | null
          title: string
          updated_at: string | null
          url: string | null
          video_url: string | null
        }
        Insert: {
          audience?: string
          body?: string | null
          content_type: string
          created_at?: string | null
          created_by: string
          creator_handle?: string | null
          creator_name?: string | null
          creator_url?: string | null
          end_at?: string | null
          id?: string
          is_active?: boolean | null
          license_note?: string | null
          pinned?: boolean | null
          role_scope: string
          source_platform?: string | null
          source_url?: string | null
          start_at?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
          video_url?: string | null
        }
        Update: {
          audience?: string
          body?: string | null
          content_type?: string
          created_at?: string | null
          created_by?: string
          creator_handle?: string | null
          creator_name?: string | null
          creator_url?: string | null
          end_at?: string | null
          id?: string
          is_active?: boolean | null
          license_note?: string | null
          pinned?: boolean | null
          role_scope?: string
          source_platform?: string | null
          source_url?: string | null
          start_at?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      coaching_corner_dismissals: {
        Row: {
          coaching_id: string
          dismissed_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          coaching_id: string
          dismissed_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          coaching_id?: string
          dismissed_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_corner_dismissals_coaching_id_fkey"
            columns: ["coaching_id"]
            isOneToOne: false
            referencedRelation: "coaching_corner"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_corner_scope: {
        Row: {
          coaching_id: string
          created_at: string | null
          id: string
          supervisor_id: string
        }
        Insert: {
          coaching_id: string
          created_at?: string | null
          id?: string
          supervisor_id: string
        }
        Update: {
          coaching_id?: string
          created_at?: string | null
          id?: string
          supervisor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_corner_scope_coaching_id_fkey"
            columns: ["coaching_id"]
            isOneToOne: false
            referencedRelation: "coaching_corner"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_layouts: {
        Row: {
          created_at: string
          dashboard_type: string
          id: string
          layout_json: Json
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          dashboard_type: string
          id?: string
          layout_json?: Json
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          dashboard_type?: string
          id?: string
          layout_json?: Json
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string
          created_at: string
          id: string
          institution_id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          institution_id: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          institution_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_observation_assessments: {
        Row: {
          areas_for_improvement: string | null
          clinical_context: string | null
          created_at: string | null
          feedback: string | null
          feedback_time_minutes: number | null
          id: string
          observation_time_minutes: number | null
          performance_rating: string | null
          procedure_type: string
          professionalism: string | null
          smart_feedback_applied: boolean
          smart_feedback_version: string | null
          student_id: string
          supervisor_id: string | null
          technical_skills: string | null
          updated_at: string | null
          used_smart_feedback: boolean
        }
        Insert: {
          areas_for_improvement?: string | null
          clinical_context?: string | null
          created_at?: string | null
          feedback?: string | null
          feedback_time_minutes?: number | null
          id?: string
          observation_time_minutes?: number | null
          performance_rating?: string | null
          procedure_type: string
          professionalism?: string | null
          smart_feedback_applied?: boolean
          smart_feedback_version?: string | null
          student_id: string
          supervisor_id?: string | null
          technical_skills?: string | null
          updated_at?: string | null
          used_smart_feedback?: boolean
        }
        Update: {
          areas_for_improvement?: string | null
          clinical_context?: string | null
          created_at?: string | null
          feedback?: string | null
          feedback_time_minutes?: number | null
          id?: string
          observation_time_minutes?: number | null
          performance_rating?: string | null
          procedure_type?: string
          professionalism?: string | null
          smart_feedback_applied?: boolean
          smart_feedback_version?: string | null
          student_id?: string
          supervisor_id?: string | null
          technical_skills?: string | null
          updated_at?: string | null
          used_smart_feedback?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "direct_observation_assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_observation_assessments_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      epa_assessments: {
        Row: {
          clinical_setting: string | null
          complexity: string | null
          created_at: string | null
          epa_number: string | null
          feedback: string | null
          feedback_time_minutes: number | null
          id: string
          observation_time_minutes: number | null
          observations: string | null
          patient_demographics: string | null
          rating: string | null
          smart_feedback_applied: boolean
          smart_feedback_version: string | null
          student_id: string
          supervisor_id: string | null
          updated_at: string | null
          used_smart_feedback: boolean
        }
        Insert: {
          clinical_setting?: string | null
          complexity?: string | null
          created_at?: string | null
          epa_number?: string | null
          feedback?: string | null
          feedback_time_minutes?: number | null
          id?: string
          observation_time_minutes?: number | null
          observations?: string | null
          patient_demographics?: string | null
          rating?: string | null
          smart_feedback_applied?: boolean
          smart_feedback_version?: string | null
          student_id: string
          supervisor_id?: string | null
          updated_at?: string | null
          used_smart_feedback?: boolean
        }
        Update: {
          clinical_setting?: string | null
          complexity?: string | null
          created_at?: string | null
          epa_number?: string | null
          feedback?: string | null
          feedback_time_minutes?: number | null
          id?: string
          observation_time_minutes?: number | null
          observations?: string | null
          patient_demographics?: string | null
          rating?: string | null
          smart_feedback_applied?: boolean
          smart_feedback_version?: string | null
          student_id?: string
          supervisor_id?: string | null
          updated_at?: string | null
          used_smart_feedback?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "epa_assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epa_assessments_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      epa_benchmarks: {
        Row: {
          cohort_id: string | null
          department_id: string | null
          epa_code: string
          epa_id: string | null
          expected_level: number
          id: string
          institution_id: string | null
          learner_level: string | null
          n_assessments: number
          n_learners: number
          p25_level: number | null
          p75_level: number | null
          scope: Database["public"]["Enums"]["benchmark_scope"]
          specialty_id: string | null
          time_from_start_days: number
          updated_at: string
        }
        Insert: {
          cohort_id?: string | null
          department_id?: string | null
          epa_code: string
          epa_id?: string | null
          expected_level: number
          id?: string
          institution_id?: string | null
          learner_level?: string | null
          n_assessments?: number
          n_learners?: number
          p25_level?: number | null
          p75_level?: number | null
          scope: Database["public"]["Enums"]["benchmark_scope"]
          specialty_id?: string | null
          time_from_start_days: number
          updated_at?: string
        }
        Update: {
          cohort_id?: string | null
          department_id?: string | null
          epa_code?: string
          epa_id?: string | null
          expected_level?: number
          id?: string
          institution_id?: string | null
          learner_level?: string | null
          n_assessments?: number
          n_learners?: number
          p25_level?: number | null
          p75_level?: number | null
          scope?: Database["public"]["Enums"]["benchmark_scope"]
          specialty_id?: string | null
          time_from_start_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "epa_benchmarks_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "program_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epa_benchmarks_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epa_benchmarks_epa_id_fkey"
            columns: ["epa_id"]
            isOneToOne: false
            referencedRelation: "epas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epa_benchmarks_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epa_benchmarks_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      epas: {
        Row: {
          code: string
          created_at: string
          description: string
          id: string
          ksa: Json | null
          specialty_id: string
          status: Database["public"]["Enums"]["epa_status"]
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          id?: string
          ksa?: Json | null
          specialty_id: string
          status?: Database["public"]["Enums"]["epa_status"]
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          ksa?: Json | null
          specialty_id?: string
          status?: Database["public"]["Enums"]["epa_status"]
          title?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "epas_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_quality_scores: {
        Row: {
          actionability_score: number
          assessment_id: string
          assessment_type: string
          balance_score: number
          clarity_score: number
          created_at: string
          id: string
          learner_engagement_score: number
          org_id: string | null
          overall_score: number
          scored_at: string
          scoring_rationale: Json | null
          specificity_score: number
          supervisor_id: string
          tone_professionalism_score: number
          used_ai_assistant: boolean
        }
        Insert: {
          actionability_score: number
          assessment_id: string
          assessment_type: string
          balance_score: number
          clarity_score: number
          created_at?: string
          id?: string
          learner_engagement_score: number
          org_id?: string | null
          overall_score: number
          scored_at?: string
          scoring_rationale?: Json | null
          specificity_score: number
          supervisor_id: string
          tone_professionalism_score: number
          used_ai_assistant?: boolean
        }
        Update: {
          actionability_score?: number
          assessment_id?: string
          assessment_type?: string
          balance_score?: number
          clarity_score?: number
          created_at?: string
          id?: string
          learner_engagement_score?: number
          org_id?: string | null
          overall_score?: number
          scored_at?: string
          scoring_rationale?: Json | null
          specificity_score?: number
          supervisor_id?: string
          tone_professionalism_score?: number
          used_ai_assistant?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "feedback_quality_scores_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_quality_scores_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisor_feedback_requests: {
        Row: {
          id: string
          student_id: string
          supervisor_id: string
          message: string | null
          status: Database["public"]["Enums"]["supervisor_feedback_request_status"]
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          supervisor_id: string
          message?: string | null
          status?: Database["public"]["Enums"]["supervisor_feedback_request_status"]
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          supervisor_id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["supervisor_feedback_request_status"]
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervisor_feedback_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisor_feedback_requests_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_request_email_log: {
        Row: {
          feedback_request_id: string
          sent_at: string
          delivery_status: string
        }
        Insert: {
          feedback_request_id: string
          sent_at?: string
          delivery_status?: string
        }
        Update: {
          feedback_request_id?: string
          sent_at?: string
          delivery_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_request_email_log_feedback_request_id_fkey"
            columns: ["feedback_request_id"]
            isOneToOne: true
            referencedRelation: "supervisor_feedback_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_ai_runs: {
        Row: {
          id: string
          assessment_id: string | null
          supervisor_id: string
          student_id: string
          chain_id: string
          inputs: Json
          result: Json
          used_in_final_feedback: boolean
          created_at: string
        }
        Insert: {
          id?: string
          assessment_id?: string | null
          supervisor_id: string
          student_id: string
          chain_id?: string
          inputs: Json
          result: Json
          used_in_final_feedback?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string | null
          supervisor_id?: string
          student_id?: string
          chain_id?: string
          inputs?: Json
          result?: Json
          used_in_final_feedback?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_ai_runs_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_ai_runs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      goals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_value: number | null
          description: string | null
          end_date: string | null
          id: string
          metadata: Json | null
          period: Database["public"]["Enums"]["goal_period"] | null
          start_date: string
          status: Database["public"]["Enums"]["goal_status"] | null
          target_value: number
          title: string
          type: Database["public"]["Enums"]["goal_type"]
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          period?: Database["public"]["Enums"]["goal_period"] | null
          start_date?: string
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_value: number
          title: string
          type: Database["public"]["Enums"]["goal_type"]
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          period?: Database["public"]["Enums"]["goal_period"] | null
          start_date?: string
          status?: Database["public"]["Enums"]["goal_status"] | null
          target_value?: number
          title?: string
          type?: Database["public"]["Enums"]["goal_type"]
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      import_mapping_presets: {
        Row: {
          created_at: string
          created_by: string | null
          entity: string
          id: string
          mapping: Json
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity: string
          id?: string
          mapping: Json
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity?: string
          id?: string
          mapping?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      institutions: {
        Row: {
          address: string | null
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      learner_action_status: {
        Row: {
          action_id: string
          assigned_at: string
          epa_id: string | null
          id: string
          learner_id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          action_id: string
          assigned_at?: string
          epa_id?: string | null
          id?: string
          learner_id: string
          notes?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          action_id?: string
          assigned_at?: string
          epa_id?: string | null
          id?: string
          learner_id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_action_status_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "learning_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_action_status_epa_id_fkey"
            columns: ["epa_id"]
            isOneToOne: false
            referencedRelation: "epas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_action_status_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_personalization_summaries: {
        Row: {
          cohort_id: string | null
          generated_at: string
          id: string
          learner_id: string
          specialty_id: string | null
          summary: Json
          updated_at: string
        }
        Insert: {
          cohort_id?: string | null
          generated_at?: string
          id?: string
          learner_id: string
          specialty_id?: string | null
          summary: Json
          updated_at?: string
        }
        Update: {
          cohort_id?: string | null
          generated_at?: string
          id?: string
          learner_id?: string
          specialty_id?: string | null
          summary?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_personalization_summaries_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "program_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_personalization_summaries_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_personalization_summaries_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_actions: {
        Row: {
          action_type: string
          code: string
          created_at: string
          description: string
          dimension_tags: string[]
          discipline_id: string | null
          epa_id: string | null
          id: string
          intensity: number
          is_active: boolean
          label: string
          learning_mode_tags: string[]
          prerequisites: Json
          updated_at: string
        }
        Insert: {
          action_type: string
          code: string
          created_at?: string
          description: string
          dimension_tags?: string[]
          discipline_id?: string | null
          epa_id?: string | null
          id?: string
          intensity?: number
          is_active?: boolean
          label: string
          learning_mode_tags?: string[]
          prerequisites?: Json
          updated_at?: string
        }
        Update: {
          action_type?: string
          code?: string
          created_at?: string
          description?: string
          dimension_tags?: string[]
          discipline_id?: string | null
          epa_id?: string | null
          id?: string
          intensity?: number
          is_active?: boolean
          label?: string
          learning_mode_tags?: string[]
          prerequisites?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_actions_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_actions_epa_id_fkey"
            columns: ["epa_id"]
            isOneToOne: false
            referencedRelation: "epas"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_plan_recommendations: {
        Row: {
          accepted_at: string | null
          action_id: string
          completed_at: string | null
          created_at: string
          dismissed_at: string | null
          epa_id: string | null
          id: string
          learner_id: string
          outcome_metrics: Json | null
          outcome_window_days: number | null
          rank_position: number
          ranking_score: number | null
          recommendation_context: Json
          recommended_at: string
          source_model: string
          user_feedback: Json | null
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          action_id: string
          completed_at?: string | null
          created_at?: string
          dismissed_at?: string | null
          epa_id?: string | null
          id?: string
          learner_id: string
          outcome_metrics?: Json | null
          outcome_window_days?: number | null
          rank_position: number
          ranking_score?: number | null
          recommendation_context: Json
          recommended_at?: string
          source_model?: string
          user_feedback?: Json | null
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          action_id?: string
          completed_at?: string | null
          created_at?: string
          dismissed_at?: string | null
          epa_id?: string | null
          id?: string
          learner_id?: string
          outcome_metrics?: Json | null
          outcome_window_days?: number | null
          rank_position?: number
          ranking_score?: number | null
          recommendation_context?: Json
          recommended_at?: string
          source_model?: string
          user_feedback?: Json | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_plan_recommendations_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "learning_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_plan_recommendations_epa_id_fkey"
            columns: ["epa_id"]
            isOneToOne: false
            referencedRelation: "epas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_plan_recommendations_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_assessments: {
        Row: {
          areas_for_growth: string | null
          assessment_period: string | null
          clinical_context: string | null
          created_at: string | null
          feedback_time_minutes: number | null
          id: string
          observation_time_minutes: number | null
          overall_progression: string | null
          recommendations: string | null
          smart_feedback_applied: boolean
          smart_feedback_version: string | null
          strengths: string | null
          student_id: string
          supervisor_id: string | null
          updated_at: string | null
          used_smart_feedback: boolean
        }
        Insert: {
          areas_for_growth?: string | null
          assessment_period?: string | null
          clinical_context?: string | null
          created_at?: string | null
          feedback_time_minutes?: number | null
          id?: string
          observation_time_minutes?: number | null
          overall_progression?: string | null
          recommendations?: string | null
          smart_feedback_applied?: boolean
          smart_feedback_version?: string | null
          strengths?: string | null
          student_id: string
          supervisor_id?: string | null
          updated_at?: string | null
          used_smart_feedback?: boolean
        }
        Update: {
          areas_for_growth?: string | null
          assessment_period?: string | null
          clinical_context?: string | null
          created_at?: string | null
          feedback_time_minutes?: number | null
          id?: string
          observation_time_minutes?: number | null
          overall_progression?: string | null
          recommendations?: string | null
          smart_feedback_applied?: boolean
          smart_feedback_version?: string | null
          strengths?: string | null
          student_id?: string
          supervisor_id?: string | null
          updated_at?: string | null
          used_smart_feedback?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "narrative_assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "narrative_assessments_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_assessment_overdue: boolean | null
          email_assessment_received: boolean | null
          email_feedback_requested: boolean | null
          email_milestone_achieved: boolean | null
          email_new_student_assigned: boolean | null
          email_score_improvement: boolean | null
          email_system_announcement: boolean | null
          email_weekly_summary: boolean | null
          id: string
          in_app_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_assessment_overdue?: boolean | null
          email_assessment_received?: boolean | null
          email_feedback_requested?: boolean | null
          email_milestone_achieved?: boolean | null
          email_new_student_assigned?: boolean | null
          email_score_improvement?: boolean | null
          email_system_announcement?: boolean | null
          email_weekly_summary?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_assessment_overdue?: boolean | null
          email_assessment_received?: boolean | null
          email_feedback_requested?: boolean | null
          email_milestone_achieved?: boolean | null
          email_new_student_assigned?: boolean | null
          email_score_improvement?: boolean | null
          email_system_announcement?: boolean | null
          email_weekly_summary?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["notification_priority"] | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["notification_priority"] | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      password_reset_audit: {
        Row: {
          actor_admin_id: string
          error_message: string | null
          id: string
          metadata: Json
          reason: string | null
          status: string
          target_email: string
          target_user_id: string
          triggered_at: string
        }
        Insert: {
          actor_admin_id: string
          error_message?: string | null
          id?: string
          metadata?: Json
          reason?: string | null
          status?: string
          target_email: string
          target_user_id: string
          triggered_at?: string
        }
        Update: {
          actor_admin_id?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          reason?: string | null
          status?: string
          target_email?: string
          target_user_id?: string
          triggered_at?: string
        }
        Relationships: []
      }
      profile_progress: {
        Row: {
          completed_tasks: Json | null
          created_at: string | null
          dismissed_empty_states: Json | null
          first_login_at: string | null
          id: string
          onboarding_completed_at: string | null
          onboarding_dismissed: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_tasks?: Json | null
          created_at?: string | null
          dismissed_empty_states?: Json | null
          first_login_at?: string | null
          id?: string
          onboarding_completed_at?: string | null
          onboarding_dismissed?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_tasks?: Json | null
          created_at?: string | null
          dismissed_empty_states?: Json | null
          first_login_at?: string | null
          id?: string
          onboarding_completed_at?: string | null
          onboarding_dismissed?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cohort_id: string | null
          created_at: string | null
          department_id: string | null
          email: string
          full_name: string | null
          id: string
          institution_id: string | null
          program: string | null
          student_id: string | null
          updated_at: string | null
          year_of_training: string | null
        }
        Insert: {
          cohort_id?: string | null
          created_at?: string | null
          department_id?: string | null
          email: string
          full_name?: string | null
          id: string
          institution_id?: string | null
          program?: string | null
          student_id?: string | null
          updated_at?: string | null
          year_of_training?: string | null
        }
        Update: {
          cohort_id?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          institution_id?: string | null
          program?: string | null
          student_id?: string | null
          updated_at?: string | null
          year_of_training?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "program_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      program_cohorts: {
        Row: {
          created_at: string
          department_id: string | null
          end_date: string | null
          id: string
          institution_id: string
          is_active: boolean
          name: string
          specialty_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          end_date?: string | null
          id?: string
          institution_id: string
          is_active?: boolean
          name: string
          specialty_id: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          end_date?: string | null
          id?: string
          institution_id?: string
          is_active?: boolean
          name?: string
          specialty_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_cohorts_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_cohorts_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_cohorts_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_percent: number | null
          expires_at: string | null
          free_access: boolean | null
          free_duration_days: number | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          updated_at: string
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          free_access?: boolean | null
          free_duration_days?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_percent?: number | null
          expires_at?: string | null
          free_access?: boolean | null
          free_duration_days?: number | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string
          used_count?: number | null
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          id: string
          promo_code_id: string
          redeemed_at: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          promo_code_id: string
          redeemed_at?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          promo_code_id?: string
          redeemed_at?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_redemptions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      role_requests: {
        Row: {
          created_at: string | null
          id: string
          justification: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          justification?: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          justification?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      specialties: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_supervisor_assignments: {
        Row: {
          created_at: string
          created_by: string
          end_date: string | null
          id: string
          institution_id: string
          is_primary: boolean
          note: string | null
          program_id: string | null
          start_date: string | null
          student_id: string
          supervisor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          end_date?: string | null
          id?: string
          institution_id: string
          is_primary?: boolean
          note?: string | null
          program_id?: string | null
          start_date?: string | null
          student_id: string
          supervisor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          end_date?: string | null
          id?: string
          institution_id?: string
          is_primary?: boolean
          note?: string | null
          program_id?: string | null
          start_date?: string | null
          student_id?: string
          supervisor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_supervisor_assignments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_supervisor_assignments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_supervisor_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_supervisor_assignments_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supervisor_cme_sessions: {
        Row: {
          activity_type: Database["public"]["Enums"]["cme_activity_type"]
          created_at: string
          description: string | null
          id: string
          minutes: number
          org_id: string | null
          session_date: string
          source: Database["public"]["Enums"]["cme_source"]
          supervisor_id: string
          updated_at: string
          wba_id: string | null
          wba_type: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["cme_activity_type"]
          created_at?: string
          description?: string | null
          id?: string
          minutes: number
          org_id?: string | null
          session_date: string
          source: Database["public"]["Enums"]["cme_source"]
          supervisor_id: string
          updated_at?: string
          wba_id?: string | null
          wba_type?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["cme_activity_type"]
          created_at?: string
          description?: string | null
          id?: string
          minutes?: number
          org_id?: string | null
          session_date?: string
          source?: Database["public"]["Enums"]["cme_source"]
          supervisor_id?: string
          updated_at?: string
          wba_id?: string | null
          wba_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supervisor_cme_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisor_cme_sessions_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisor_personalization_summaries: {
        Row: {
          generated_at: string
          id: string
          institution_id: string | null
          specialty_id: string | null
          summary: Json
          supervisor_id: string
          updated_at: string
        }
        Insert: {
          generated_at?: string
          id?: string
          institution_id?: string | null
          specialty_id?: string | null
          summary: Json
          supervisor_id: string
          updated_at?: string
        }
        Update: {
          generated_at?: string
          id?: string
          institution_id?: string | null
          specialty_id?: string | null
          summary?: Json
          supervisor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervisor_personalization_summaries_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisor_personalization_summaries_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisor_personalization_summaries_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisor_student_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          student_id: string
          supervisor_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          student_id: string
          supervisor_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          student_id?: string
          supervisor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervisor_student_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisor_student_assignments_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string | null
          id: string
          metadata: Json | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          promo_code_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          promo_code_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          promo_code_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string | null
          id: string
          progress: Json | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string | null
          id?: string
          progress?: Json | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string | null
          id?: string
          progress?: Json | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievement_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          metadata: Json | null
          streak_start_date: string | null
          streak_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          metadata?: Json | null
          streak_start_date?: string | null
          streak_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          metadata?: Json | null
          streak_start_date?: string | null
          streak_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      student_feedback_digests: {
        Row: {
          id: string
          student_id: string
          assessment_id: string | null
          created_at: string
          learner_digest: Json | null
        }
      }
    }
    Functions: {
      admin_send_password_reset: {
        Args: { p_reason?: string; p_target_user_id: string }
        Returns: Json
      }
      anonymize_old_assessments: { Args: never; Returns: undefined }
      assign_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      compute_learner_epa_summary: {
        Args: { p_learner_id: string; p_lookback_days?: number }
        Returns: {
          assessment_count: number
          current_level: number
          epa_code: string
          latest_assessment_date: string
          plateau_flag: boolean
          risk_flag: boolean
          trend_slope: number
        }[]
      }
      compute_time_from_start: {
        Args: { p_snapshot_date?: string; p_start_date: string }
        Returns: number
      }
      create_notification: {
        Args: {
          p_action_label?: string
          p_action_url?: string
          p_message: string
          p_metadata?: Json
          p_priority?: Database["public"]["Enums"]["notification_priority"]
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user_id: string
        }
        Returns: string
      }
      create_supervisor_feedback_request: {
        Args: { p_message?: string | null; p_supervisor_id: string }
        Returns: Json
      }
      create_student_account: {
        Args: {
          p_email: string
          p_full_name?: string
          p_institution_id?: string
        }
        Returns: {
          message: string
          student_id: string
          success: boolean
        }[]
      }
      generate_student_id: { Args: never; Returns: string }
      get_goal_progress: { Args: { p_goal_id: string }; Returns: number }
      get_learner_benchmark_context: {
        Args: { p_learner_id: string }
        Returns: {
          cohort_id: string
          cohort_start_date: string
          department_id: string
          institution_id: string
          specialty_id: string
        }[]
      }
      get_recent_phi_access: {
        Args: never
        Returns: {
          action: string
          created_at: string
          table_name: string
          user_email: string
          user_name: string
          user_role: string
        }[]
      }
      get_specialty_epa_count: {
        Args: { p_specialty_id: string }
        Returns: number
      }
      get_subscription_status: {
        Args: { p_user_id: string }
        Returns: {
          expires_at: string
          has_access: boolean
          plan: string
          status: string
        }[]
      }
      get_supervisor_org_id: {
        Args: { p_supervisor_id: string }
        Returns: string
      }
      get_supervisor_students: {
        Args: {
          p_active_only?: boolean
          p_institution_id?: string
          p_program_id?: string
          p_supervisor_id: string
        }
        Returns: {
          assignment_id: string
          end_date: string
          institution_id: string
          institution_name: string
          is_primary: boolean
          note: string
          program_id: string
          program_name: string
          start_date: string
          student_email: string
          student_id: string
          student_name: string
        }[]
      }
      get_unread_notification_count: { Args: never; Returns: number }
      get_user_achievements: {
        Args: { p_user_id: string }
        Returns: {
          achievement_id: string
          category: Database["public"]["Enums"]["achievement_category"]
          code: string
          color: string
          description: string
          icon: string
          name: string
          rarity: Database["public"]["Enums"]["achievement_rarity"]
          unlocked_at: string
        }[]
      }
      get_user_streak: {
        Args: { p_streak_type?: string; p_user_id: string }
        Returns: number
      }
      get_users_with_roles: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          roles: string[]
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_user_activity: {
        Args: { p_activity_type: string; p_user_id: string }
        Returns: number
      }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      redeem_promo_code: {
        Args: { p_code: string; p_transaction_id?: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
      remove_user_role: {
        Args: {
          role_to_remove: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      try_cast_numeric: { Args: { text_val: string }; Returns: number }
      unlock_achievement: {
        Args: { p_achievement_code: string; p_user_id: string }
        Returns: string
      }
      update_achievement_progress: {
        Args: {
          p_achievement_code: string
          p_increment?: number
          p_user_id: string
        }
        Returns: boolean
      }
      update_goal_progress: {
        Args: { p_goal_id: string; p_increment?: number }
        Returns: boolean
      }
      upsert_cme_session_from_wba: {
        Args: {
          p_activity_type: Database["public"]["Enums"]["cme_activity_type"]
          p_description?: string
          p_minutes: number
          p_session_date?: string
          p_supervisor_id: string
          p_wba_id: string
          p_wba_type: string
        }
        Returns: string
      }
      upsert_feedback_quality_score: {
        Args: {
          p_actionability_score: number
          p_assessment_id: string
          p_assessment_type: string
          p_balance_score: number
          p_clarity_score: number
          p_learner_engagement_score: number
          p_overall_score: number
          p_scoring_rationale?: Json
          p_specificity_score: number
          p_supervisor_id: string
          p_tone_professionalism_score: number
          p_used_ai_assistant: boolean
        }
        Returns: string
      }
      validate_promo_code: {
        Args: { p_code: string }
        Returns: {
          discount_percent: number
          free_access: boolean
          free_duration_days: number
          message: string
          promo_id: string
          valid: boolean
        }[]
      }
      write_audit_log: {
        Args: {
          p_action: Database["public"]["Enums"]["audit_action"]
          p_diff?: Json
          p_entity: string
          p_entity_id: string
          p_metadata?: Json
        }
        Returns: string
      }
    }
    Enums: {
      achievement_category:
        | "first_steps"
        | "consistency"
        | "quality"
        | "milestone"
        | "engagement"
        | "excellence"
      achievement_rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
      app_role: "student" | "supervisor" | "admin"
      audit_action: "create" | "update" | "delete" | "import" | "bulk_update"
      benchmark_scope:
        | "current_cohort"
        | "previous_cohorts_program"
        | "all_cohorts_program"
        | "all_cohorts_department"
        | "all_cohorts_institution"
        | "all_cohorts_discipline"
      cme_activity_type:
        | "direct_observation"
        | "chart_review"
        | "end_of_rotation"
        | "narrative_feedback"
        | "group_teaching"
        | "other"
      cme_source: "auto_wba" | "manual"
      epa_status: "draft" | "active" | "retired"
      goal_period:
        | "daily"
        | "weekly"
        | "monthly"
        | "quarterly"
        | "yearly"
        | "custom"
      goal_status: "active" | "completed" | "paused" | "cancelled"
      goal_type:
        | "assessment_count"
        | "oscore_target"
        | "streak_days"
        | "epa_readiness"
        | "feedback_quality"
        | "weekly_active"
        | "custom"
      notification_priority: "low" | "medium" | "high" | "urgent"
      notification_type:
        | "assessment_received"
        | "assessment_overdue"
        | "milestone_achieved"
        | "score_improvement"
        | "new_student_assigned"
        | "feedback_requested"
        | "weekly_summary"
        | "system_announcement"
      subscription_plan: "free" | "standard" | "pro" | "enterprise"
      supervisor_feedback_request_status: "open" | "fulfilled" | "cancelled"
      subscription_status:
        | "inactive"
        | "active"
        | "past_due"
        | "canceled"
        | "trialing"
      transaction_status: "pending" | "completed" | "failed" | "refunded"
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
      achievement_category: [
        "first_steps",
        "consistency",
        "quality",
        "milestone",
        "engagement",
        "excellence",
      ],
      achievement_rarity: ["common", "uncommon", "rare", "epic", "legendary"],
      app_role: ["student", "supervisor", "admin"],
      audit_action: ["create", "update", "delete", "import", "bulk_update"],
      benchmark_scope: [
        "current_cohort",
        "previous_cohorts_program",
        "all_cohorts_program",
        "all_cohorts_department",
        "all_cohorts_institution",
        "all_cohorts_discipline",
      ],
      cme_activity_type: [
        "direct_observation",
        "chart_review",
        "end_of_rotation",
        "narrative_feedback",
        "group_teaching",
        "other",
      ],
      cme_source: ["auto_wba", "manual"],
      epa_status: ["draft", "active", "retired"],
      goal_period: [
        "daily",
        "weekly",
        "monthly",
        "quarterly",
        "yearly",
        "custom",
      ],
      goal_status: ["active", "completed", "paused", "cancelled"],
      goal_type: [
        "assessment_count",
        "oscore_target",
        "streak_days",
        "epa_readiness",
        "feedback_quality",
        "weekly_active",
        "custom",
      ],
      notification_priority: ["low", "medium", "high", "urgent"],
      notification_type: [
        "assessment_received",
        "assessment_overdue",
        "milestone_achieved",
        "score_improvement",
        "new_student_assigned",
        "feedback_requested",
        "weekly_summary",
        "system_announcement",
      ],
      supervisor_feedback_request_status: ["open", "fulfilled", "cancelled"],
      subscription_plan: ["free", "standard", "pro", "enterprise"],
      subscription_status: [
        "inactive",
        "active",
        "past_due",
        "canceled",
        "trialing",
      ],
      transaction_status: ["pending", "completed", "failed", "refunded"],
    },
  },
} as const
