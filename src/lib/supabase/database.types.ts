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
      ai_agent_definitions: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          is_demo: boolean
          name: string
          slug: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          is_demo?: boolean
          name: string
          slug: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          is_demo?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      ai_agent_runs: {
        Row: {
          agent_id: string
          completed_at: string | null
          error_code: string | null
          estimated_cost_usd: number | null
          id: string
          input_tokens: number | null
          is_demo: boolean
          model_name: string | null
          model_provider: string | null
          organization_id: string | null
          output_tokens: number | null
          related_resource_id: string | null
          related_resource_type: string | null
          requested_by: string | null
          started_at: string
          status: string
        }
        Insert: {
          agent_id: string
          completed_at?: string | null
          error_code?: string | null
          estimated_cost_usd?: number | null
          id?: string
          input_tokens?: number | null
          is_demo?: boolean
          model_name?: string | null
          model_provider?: string | null
          organization_id?: string | null
          output_tokens?: number | null
          related_resource_id?: string | null
          related_resource_type?: string | null
          requested_by?: string | null
          started_at?: string
          status?: string
        }
        Update: {
          agent_id?: string
          completed_at?: string | null
          error_code?: string | null
          estimated_cost_usd?: number | null
          id?: string
          input_tokens?: number | null
          is_demo?: boolean
          model_name?: string | null
          model_provider?: string | null
          organization_id?: string | null
          output_tokens?: number | null
          related_resource_id?: string | null
          related_resource_type?: string | null
          requested_by?: string | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_budgets: {
        Row: {
          budget_usd: number
          enabled: boolean
          id: string
          is_demo: boolean
          organization_id: string
          period: string
          request_limit: number
          user_id: string | null
        }
        Insert: {
          budget_usd?: number
          enabled?: boolean
          id?: string
          is_demo?: boolean
          organization_id: string
          period: string
          request_limit?: number
          user_id?: string | null
        }
        Update: {
          budget_usd?: number
          enabled?: boolean
          id?: string
          is_demo?: boolean
          organization_id?: string
          period?: string
          request_limit?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_budgets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_events: {
        Row: {
          agent_run_id: string | null
          created_at: string
          estimated_cost_usd: number | null
          id: string
          input_tokens: number | null
          is_demo: boolean
          model_name: string | null
          organization_id: string | null
          output_tokens: number | null
          user_id: string | null
        }
        Insert: {
          agent_run_id?: string | null
          created_at?: string
          estimated_cost_usd?: number | null
          id?: string
          input_tokens?: number | null
          is_demo?: boolean
          model_name?: string | null
          organization_id?: string | null
          output_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          agent_run_id?: string | null
          created_at?: string
          estimated_cost_usd?: number | null
          id?: string
          input_tokens?: number | null
          is_demo?: boolean
          model_name?: string | null
          organization_id?: string | null
          output_tokens?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_events_agent_run_id_fkey"
            columns: ["agent_run_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["user_role"] | null
          created_at: string
          entity_id: string
          entity_type: string
          from_status: Database["public"]["Enums"]["inquiry_status"] | null
          id: string
          metadata: Json | null
          to_status: Database["public"]["Enums"]["inquiry_status"] | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string
          entity_id: string
          entity_type: string
          from_status?: Database["public"]["Enums"]["inquiry_status"] | null
          id?: string
          metadata?: Json | null
          to_status?: Database["public"]["Enums"]["inquiry_status"] | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          from_status?: Database["public"]["Enums"]["inquiry_status"] | null
          id?: string
          metadata?: Json | null
          to_status?: Database["public"]["Enums"]["inquiry_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_protocols: {
        Row: {
          created_at: string
          dataset_source: string
          id: string
          is_demo: boolean
          organization_id: string | null
          protocol_code: string
          status: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dataset_source?: string
          id?: string
          is_demo?: boolean
          organization_id?: string | null
          protocol_code: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dataset_source?: string
          id?: string
          is_demo?: boolean
          organization_id?: string | null
          protocol_code?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_protocols_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_plans: {
        Row: {
          coach_user_id: string
          created_at: string
          focus_areas: string[]
          id: string
          msl_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          coach_user_id: string
          created_at?: string
          focus_areas?: string[]
          id?: string
          msl_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          coach_user_id?: string
          created_at?: string
          focus_areas?: string[]
          id?: string
          msl_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_plans_coach_user_id_fkey"
            columns: ["coach_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coaching_plans_msl_user_id_fkey"
            columns: ["msl_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competencies: {
        Row: {
          created_at: string
          description: string
          domain: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description: string
          domain: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string
          domain?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      evidence_citations: {
        Row: {
          created_at: string
          created_by_id: string
          evidence_document_id: string
          id: string
          inquiry_id: string
          relevance_note: string | null
        }
        Insert: {
          created_at?: string
          created_by_id: string
          evidence_document_id: string
          id?: string
          inquiry_id: string
          relevance_note?: string | null
        }
        Update: {
          created_at?: string
          created_by_id?: string
          evidence_document_id?: string
          id?: string
          inquiry_id?: string
          relevance_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_citations_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_citations_evidence_document_id_fkey"
            columns: ["evidence_document_id"]
            isOneToOne: false
            referencedRelation: "evidence_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_citations_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "medical_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_documents: {
        Row: {
          abstract_summary: string | null
          authors: string | null
          created_at: string
          data_classification: Database["public"]["Enums"]["data_classification"]
          id: string
          publication_year: number | null
          source_name: string
          source_url: string | null
          title: string
          trust_label: Database["public"]["Enums"]["evidence_trust_label"]
          updated_at: string
        }
        Insert: {
          abstract_summary?: string | null
          authors?: string | null
          created_at?: string
          data_classification?: Database["public"]["Enums"]["data_classification"]
          id?: string
          publication_year?: number | null
          source_name: string
          source_url?: string | null
          title: string
          trust_label?: Database["public"]["Enums"]["evidence_trust_label"]
          updated_at?: string
        }
        Update: {
          abstract_summary?: string | null
          authors?: string | null
          created_at?: string
          data_classification?: Database["public"]["Enums"]["data_classification"]
          id?: string
          publication_year?: number | null
          source_name?: string
          source_url?: string | null
          title?: string
          trust_label?: Database["public"]["Enums"]["evidence_trust_label"]
          updated_at?: string
        }
        Relationships: []
      }
      fm_assessments: {
        Row: {
          assessed_at: string
          competency_id: string
          created_at: string
          evidence_reference: string | null
          id: string
          msl_id: string
          notes: string | null
          passed: boolean
          requirement_id: string | null
          reviewer_id: string | null
          rubric_version: string
          score: number
          updated_at: string
          valid_until: string | null
          validation_status: Database["public"]["Enums"]["fm_assessment_validation"]
        }
        Insert: {
          assessed_at: string
          competency_id: string
          created_at?: string
          evidence_reference?: string | null
          id?: string
          msl_id: string
          notes?: string | null
          passed: boolean
          requirement_id?: string | null
          reviewer_id?: string | null
          rubric_version: string
          score: number
          updated_at?: string
          valid_until?: string | null
          validation_status?: Database["public"]["Enums"]["fm_assessment_validation"]
        }
        Update: {
          assessed_at?: string
          competency_id?: string
          created_at?: string
          evidence_reference?: string | null
          id?: string
          msl_id?: string
          notes?: string | null
          passed?: boolean
          requirement_id?: string | null
          reviewer_id?: string | null
          rubric_version?: string
          score?: number
          updated_at?: string
          valid_until?: string | null
          validation_status?: Database["public"]["Enums"]["fm_assessment_validation"]
        }
        Relationships: [
          {
            foreignKeyName: "fm_assessments_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "fm_competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fm_assessments_msl_id_fkey"
            columns: ["msl_id"]
            isOneToOne: false
            referencedRelation: "fm_msl_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fm_assessments_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "fm_competency_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fm_assessments_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "fm_field_directors"
            referencedColumns: ["id"]
          },
        ]
      }
      fm_audit_events: {
        Row: {
          action: string
          actor_name: string | null
          actor_role: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_name?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_name?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      fm_coaching_activities: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_at: string
          id: string
          outcome_notes: string | null
          plan_id: string
          reassessment_scheduled_at: string | null
          status: Database["public"]["Enums"]["fm_coaching_activity_status"]
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at: string
          id?: string
          outcome_notes?: string | null
          plan_id: string
          reassessment_scheduled_at?: string | null
          status?: Database["public"]["Enums"]["fm_coaching_activity_status"]
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string
          id?: string
          outcome_notes?: string | null
          plan_id?: string
          reassessment_scheduled_at?: string | null
          status?: Database["public"]["Enums"]["fm_coaching_activity_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fm_coaching_activities_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "fm_coaching_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      fm_coaching_plans: {
        Row: {
          created_at: string
          director_id: string
          focus_competency_id: string | null
          id: string
          msl_id: string
          objective: string
          status: Database["public"]["Enums"]["fm_coaching_plan_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          director_id: string
          focus_competency_id?: string | null
          id?: string
          msl_id: string
          objective: string
          status?: Database["public"]["Enums"]["fm_coaching_plan_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          director_id?: string
          focus_competency_id?: string | null
          id?: string
          msl_id?: string
          objective?: string
          status?: Database["public"]["Enums"]["fm_coaching_plan_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fm_coaching_plans_director_id_fkey"
            columns: ["director_id"]
            isOneToOne: false
            referencedRelation: "fm_field_directors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fm_coaching_plans_focus_competency_id_fkey"
            columns: ["focus_competency_id"]
            isOneToOne: false
            referencedRelation: "fm_competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fm_coaching_plans_msl_id_fkey"
            columns: ["msl_id"]
            isOneToOne: false
            referencedRelation: "fm_msl_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fm_competencies: {
        Row: {
          code: string
          created_at: string
          description: string
          domain: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          domain: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          domain?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      fm_competency_requirements: {
        Row: {
          competency_id: string
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          is_required: boolean
          passing_score: number
          rubric_version: string
          therapeutic_area: Database["public"]["Enums"]["fm_therapeutic_area"]
        }
        Insert: {
          competency_id: string
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          is_required?: boolean
          passing_score: number
          rubric_version: string
          therapeutic_area: Database["public"]["Enums"]["fm_therapeutic_area"]
        }
        Update: {
          competency_id?: string
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_required?: boolean
          passing_score?: number
          rubric_version?: string
          therapeutic_area?: Database["public"]["Enums"]["fm_therapeutic_area"]
        }
        Relationships: [
          {
            foreignKeyName: "fm_competency_requirements_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "fm_competencies"
            referencedColumns: ["id"]
          },
        ]
      }
      fm_field_directors: {
        Row: {
          created_at: string
          email: string
          employee_code: string
          full_name: string
          id: string
          primary_therapeutic_area: Database["public"]["Enums"]["fm_therapeutic_area"]
          profile_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          employee_code: string
          full_name: string
          id?: string
          primary_therapeutic_area: Database["public"]["Enums"]["fm_therapeutic_area"]
          profile_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          employee_code?: string
          full_name?: string
          id?: string
          primary_therapeutic_area?: Database["public"]["Enums"]["fm_therapeutic_area"]
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fm_field_directors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fm_msl_profiles: {
        Row: {
          created_at: string
          email: string
          employee_code: string
          field_director_id: string
          full_name: string
          id: string
          is_active: boolean
          onboarding_start_date: string
          profile_id: string | null
          region: string
          therapeutic_area: Database["public"]["Enums"]["fm_therapeutic_area"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          employee_code: string
          field_director_id: string
          full_name: string
          id?: string
          is_active?: boolean
          onboarding_start_date: string
          profile_id?: string | null
          region: string
          therapeutic_area: Database["public"]["Enums"]["fm_therapeutic_area"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          employee_code?: string
          field_director_id?: string
          full_name?: string
          id?: string
          is_active?: boolean
          onboarding_start_date?: string
          profile_id?: string | null
          region?: string
          therapeutic_area?: Database["public"]["Enums"]["fm_therapeutic_area"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fm_msl_profiles_field_director_id_fkey"
            columns: ["field_director_id"]
            isOneToOne: false
            referencedRelation: "fm_field_directors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fm_msl_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fm_readiness_decisions: {
        Row: {
          created_at: string
          decided_at: string
          decided_by_director_id: string
          evidence_summary: string | null
          id: string
          is_active: boolean
          msl_id: string
          outcome: Database["public"]["Enums"]["fm_readiness_decision_outcome"]
          rationale: string
        }
        Insert: {
          created_at?: string
          decided_at: string
          decided_by_director_id: string
          evidence_summary?: string | null
          id?: string
          is_active?: boolean
          msl_id: string
          outcome: Database["public"]["Enums"]["fm_readiness_decision_outcome"]
          rationale: string
        }
        Update: {
          created_at?: string
          decided_at?: string
          decided_by_director_id?: string
          evidence_summary?: string | null
          id?: string
          is_active?: boolean
          msl_id?: string
          outcome?: Database["public"]["Enums"]["fm_readiness_decision_outcome"]
          rationale?: string
        }
        Relationships: [
          {
            foreignKeyName: "fm_readiness_decisions_decided_by_director_id_fkey"
            columns: ["decided_by_director_id"]
            isOneToOne: false
            referencedRelation: "fm_field_directors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fm_readiness_decisions_msl_id_fkey"
            columns: ["msl_id"]
            isOneToOne: false
            referencedRelation: "fm_msl_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fm_simulation_attempts: {
        Row: {
          attempted_at: string
          created_at: string
          facilitator_notes: string | null
          id: string
          msl_id: string
          passed: boolean
          score: number
          simulation_id: string
        }
        Insert: {
          attempted_at: string
          created_at?: string
          facilitator_notes?: string | null
          id?: string
          msl_id: string
          passed: boolean
          score: number
          simulation_id: string
        }
        Update: {
          attempted_at?: string
          created_at?: string
          facilitator_notes?: string | null
          id?: string
          msl_id?: string
          passed?: boolean
          score?: number
          simulation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fm_simulation_attempts_msl_id_fkey"
            columns: ["msl_id"]
            isOneToOne: false
            referencedRelation: "fm_msl_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fm_simulation_attempts_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "fm_simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      fm_simulations: {
        Row: {
          competency_id: string
          created_at: string
          difficulty: string
          id: string
          scenario_summary: string
          title: string
        }
        Insert: {
          competency_id: string
          created_at?: string
          difficulty: string
          id?: string
          scenario_summary: string
          title: string
        }
        Update: {
          competency_id?: string
          created_at?: string
          difficulty?: string
          id?: string
          scenario_summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fm_simulations_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "fm_competencies"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_evidence_links: {
        Row: {
          citation_note: string | null
          created_at: string
          evidence_document_id: string | null
          id: string
          knowledge_item_id: string
          si_document_id: string | null
          si_passage_id: string | null
          version_number: number
        }
        Insert: {
          citation_note?: string | null
          created_at?: string
          evidence_document_id?: string | null
          id?: string
          knowledge_item_id: string
          si_document_id?: string | null
          si_passage_id?: string | null
          version_number: number
        }
        Update: {
          citation_note?: string | null
          created_at?: string
          evidence_document_id?: string | null
          id?: string
          knowledge_item_id?: string
          si_document_id?: string | null
          si_passage_id?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_evidence_links_evidence_document_id_fkey"
            columns: ["evidence_document_id"]
            isOneToOne: false
            referencedRelation: "evidence_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_evidence_links_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_evidence_links_si_document_id_fkey"
            columns: ["si_document_id"]
            isOneToOne: false
            referencedRelation: "si_evidence_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_evidence_links_si_passage_id_fkey"
            columns: ["si_passage_id"]
            isOneToOne: false
            referencedRelation: "si_evidence_passages"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_item_versions: {
        Row: {
          answer_text: string
          created_at: string
          created_by_id: string | null
          deidentification_notes: string
          id: string
          knowledge_item_id: string
          limitations_notes: string | null
          uncertainty_notes: string | null
          version_number: number
        }
        Insert: {
          answer_text: string
          created_at?: string
          created_by_id?: string | null
          deidentification_notes?: string
          id?: string
          knowledge_item_id: string
          limitations_notes?: string | null
          uncertainty_notes?: string | null
          version_number: number
        }
        Update: {
          answer_text?: string
          created_at?: string
          created_by_id?: string | null
          deidentification_notes?: string
          id?: string
          knowledge_item_id?: string
          limitations_notes?: string | null
          uncertainty_notes?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_item_versions_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_item_versions_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_items: {
        Row: {
          applicability_scope: string
          approved_at: string | null
          approved_by_id: string | null
          created_at: string
          currency_status: Database["public"]["Enums"]["kn_currency_status"]
          current_version: number
          data_classification: Database["public"]["Enums"]["data_classification"]
          disease_state: string | null
          id: string
          indication: string | null
          jurisdiction: string
          organization_id: string | null
          owner_profile_id: string | null
          product_name: string | null
          published_at: string | null
          question_summary: string
          search_tsv: unknown
          slug: string
          source_inquiry_id: string | null
          status: Database["public"]["Enums"]["kn_item_status"]
          therapeutic_area: string
          title: string
          updated_at: string
        }
        Insert: {
          applicability_scope?: string
          approved_at?: string | null
          approved_by_id?: string | null
          created_at?: string
          currency_status?: Database["public"]["Enums"]["kn_currency_status"]
          current_version?: number
          data_classification?: Database["public"]["Enums"]["data_classification"]
          disease_state?: string | null
          id?: string
          indication?: string | null
          jurisdiction?: string
          organization_id?: string | null
          owner_profile_id?: string | null
          product_name?: string | null
          published_at?: string | null
          question_summary: string
          search_tsv?: unknown
          slug: string
          source_inquiry_id?: string | null
          status?: Database["public"]["Enums"]["kn_item_status"]
          therapeutic_area: string
          title: string
          updated_at?: string
        }
        Update: {
          applicability_scope?: string
          approved_at?: string | null
          approved_by_id?: string | null
          created_at?: string
          currency_status?: Database["public"]["Enums"]["kn_currency_status"]
          current_version?: number
          data_classification?: Database["public"]["Enums"]["data_classification"]
          disease_state?: string | null
          id?: string
          indication?: string | null
          jurisdiction?: string
          organization_id?: string | null
          owner_profile_id?: string | null
          product_name?: string | null
          published_at?: string | null
          question_summary?: string
          search_tsv?: unknown
          slug?: string
          source_inquiry_id?: string | null
          status?: Database["public"]["Enums"]["kn_item_status"]
          therapeutic_area?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_items_approved_by_id_fkey"
            columns: ["approved_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_items_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_items_source_inquiry_id_fkey"
            columns: ["source_inquiry_id"]
            isOneToOne: false
            referencedRelation: "medical_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_matches: {
        Row: {
          applicability: Database["public"]["Enums"]["kn_applicability"]
          applicability_warnings: string[]
          created_at: string
          created_by_id: string | null
          currency_status: Database["public"]["Enums"]["kn_currency_status"]
          id: string
          inquiry_id: string | null
          knowledge_item_id: string
          matched_concepts: string[]
          query_text: string
          recommended_next_action: string
          relevance_rationale: string
          relevance_score: number
        }
        Insert: {
          applicability: Database["public"]["Enums"]["kn_applicability"]
          applicability_warnings?: string[]
          created_at?: string
          created_by_id?: string | null
          currency_status: Database["public"]["Enums"]["kn_currency_status"]
          id?: string
          inquiry_id?: string | null
          knowledge_item_id: string
          matched_concepts?: string[]
          query_text: string
          recommended_next_action: string
          relevance_rationale: string
          relevance_score: number
        }
        Update: {
          applicability?: Database["public"]["Enums"]["kn_applicability"]
          applicability_warnings?: string[]
          created_at?: string
          created_by_id?: string | null
          currency_status?: Database["public"]["Enums"]["kn_currency_status"]
          id?: string
          inquiry_id?: string | null
          knowledge_item_id?: string
          matched_concepts?: string[]
          query_text?: string
          recommended_next_action?: string
          relevance_rationale?: string
          relevance_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_matches_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_matches_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "medical_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_matches_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_reuse_events: {
        Row: {
          actor_profile_id: string | null
          adaptation_notes: string | null
          created_at: string
          decision: Database["public"]["Enums"]["kn_match_decision"]
          id: string
          inquiry_id: string | null
          knowledge_item_id: string
          match_id: string | null
          search_duration_ms: number | null
          verification_duration_ms: number | null
          verification_notes: string | null
        }
        Insert: {
          actor_profile_id?: string | null
          adaptation_notes?: string | null
          created_at?: string
          decision: Database["public"]["Enums"]["kn_match_decision"]
          id?: string
          inquiry_id?: string | null
          knowledge_item_id: string
          match_id?: string | null
          search_duration_ms?: number | null
          verification_duration_ms?: number | null
          verification_notes?: string | null
        }
        Update: {
          actor_profile_id?: string | null
          adaptation_notes?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["kn_match_decision"]
          id?: string
          inquiry_id?: string | null
          knowledge_item_id?: string
          match_id?: string | null
          search_duration_ms?: number | null
          verification_duration_ms?: number | null
          verification_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_reuse_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_reuse_events_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "medical_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_reuse_events_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_reuse_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "knowledge_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_review_events: {
        Row: {
          created_at: string
          decision: Database["public"]["Enums"]["kn_review_decision"]
          id: string
          knowledge_item_id: string
          notes: string | null
          reviewer_profile_id: string | null
          version_number: number
        }
        Insert: {
          created_at?: string
          decision: Database["public"]["Enums"]["kn_review_decision"]
          id?: string
          knowledge_item_id: string
          notes?: string | null
          reviewer_profile_id?: string | null
          version_number: number
        }
        Update: {
          created_at?: string
          decision?: Database["public"]["Enums"]["kn_review_decision"]
          id?: string
          knowledge_item_id?: string
          notes?: string | null
          reviewer_profile_id?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_review_events_knowledge_item_id_fkey"
            columns: ["knowledge_item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_review_events_reviewer_profile_id_fkey"
            columns: ["reviewer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_search_events: {
        Row: {
          actor_profile_id: string | null
          created_at: string
          duration_ms: number | null
          id: string
          inquiry_id: string | null
          product_name: string | null
          query_text: string
          result_count: number
          therapeutic_area: string | null
        }
        Insert: {
          actor_profile_id?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          inquiry_id?: string | null
          product_name?: string | null
          query_text: string
          result_count?: number
          therapeutic_area?: string | null
        }
        Update: {
          actor_profile_id?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          inquiry_id?: string | null
          product_name?: string | null
          query_text?: string
          result_count?: number
          therapeutic_area?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_search_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_search_events_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "medical_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_value_assumptions: {
        Row: {
          created_at: string
          eligible_reuse_percentage: number
          id: string
          label: string
          loaded_hourly_labor_cost: number
          monthly_research_inquiries_per_msl: number
          msl_workforce_size: number
          net_minutes_saved_per_reuse: number
          notes: string
          updated_at: string
          updated_by_id: string | null
        }
        Insert: {
          created_at?: string
          eligible_reuse_percentage?: number
          id?: string
          label: string
          loaded_hourly_labor_cost?: number
          monthly_research_inquiries_per_msl?: number
          msl_workforce_size?: number
          net_minutes_saved_per_reuse?: number
          notes?: string
          updated_at?: string
          updated_by_id?: string | null
        }
        Update: {
          created_at?: string
          eligible_reuse_percentage?: number
          id?: string
          label?: string
          loaded_hourly_labor_cost?: number
          monthly_research_inquiries_per_msl?: number
          msl_workforce_size?: number
          net_minutes_saved_per_reuse?: number
          notes?: string
          updated_at?: string
          updated_by_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_value_assumptions_updated_by_id_fkey"
            columns: ["updated_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_inquiries: {
        Row: {
          assigned_to_id: string | null
          channel: Database["public"]["Enums"]["inquiry_channel"]
          closed_at: string | null
          created_at: string
          created_by_id: string
          data_classification: Database["public"]["Enums"]["data_classification"]
          id: string
          organization_id: string | null
          priority: Database["public"]["Enums"]["inquiry_priority"]
          product_name: string
          question_text: string
          reference_code: string
          rejection_reason: string | null
          requester_name: string
          requester_organization: string | null
          requester_type: Database["public"]["Enums"]["requester_type"]
          response_draft: string | null
          revision_notes: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          submitted_at: string | null
          therapeutic_area: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to_id?: string | null
          channel: Database["public"]["Enums"]["inquiry_channel"]
          closed_at?: string | null
          created_at?: string
          created_by_id: string
          data_classification?: Database["public"]["Enums"]["data_classification"]
          id?: string
          organization_id?: string | null
          priority?: Database["public"]["Enums"]["inquiry_priority"]
          product_name: string
          question_text: string
          reference_code: string
          rejection_reason?: string | null
          requester_name: string
          requester_organization?: string | null
          requester_type: Database["public"]["Enums"]["requester_type"]
          response_draft?: string | null
          revision_notes?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          submitted_at?: string | null
          therapeutic_area: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to_id?: string | null
          channel?: Database["public"]["Enums"]["inquiry_channel"]
          closed_at?: string | null
          created_at?: string
          created_by_id?: string
          data_classification?: Database["public"]["Enums"]["data_classification"]
          id?: string
          organization_id?: string | null
          priority?: Database["public"]["Enums"]["inquiry_priority"]
          product_name?: string
          question_text?: string
          reference_code?: string
          rejection_reason?: string | null
          requester_name?: string
          requester_organization?: string | null
          requester_type?: Database["public"]["Enums"]["requester_type"]
          response_draft?: string | null
          revision_notes?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          submitted_at?: string | null
          therapeutic_area?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_inquiries_assigned_to_id_fkey"
            columns: ["assigned_to_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_inquiries_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_inquiries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string
          id: string
          membership_role: string
          organization_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          membership_role?: string
          organization_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          membership_role?: string
          organization_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          ai_mode: Database["public"]["Enums"]["ai_operating_mode"]
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          ai_mode?: Database["public"]["Enums"]["ai_operating_mode"]
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          ai_mode?: Database["public"]["Enums"]["ai_operating_mode"]
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_demo_user: boolean
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_demo_user?: boolean
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_demo_user?: boolean
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_eligibility_rules: {
        Row: {
          created_at: string
          id: string
          is_demo: boolean
          protocol_id: string
          rule_text: string
          rule_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_demo?: boolean
          protocol_id: string
          rule_text: string
          rule_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_demo?: boolean
          protocol_id?: string
          rule_text?: string
          rule_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_eligibility_rules_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "clinical_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_exception_demonstrations: {
        Row: {
          created_at: string
          exception_summary: string
          id: string
          is_demo: boolean
          protocol_id: string
          status: string
        }
        Insert: {
          created_at?: string
          exception_summary: string
          id?: string
          is_demo?: boolean
          protocol_id: string
          status?: string
        }
        Update: {
          created_at?: string
          exception_summary?: string
          id?: string
          is_demo?: boolean
          protocol_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocol_exception_demonstrations_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "clinical_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_review_events: {
        Row: {
          action: string
          created_at: string
          id: string
          is_demo: boolean
          notes: string | null
          protocol_id: string
          reviewer_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          protocol_id: string
          reviewer_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          protocol_id?: string
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "protocol_review_events_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "clinical_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      review_decisions: {
        Row: {
          comments: string | null
          decided_at: string
          id: string
          inquiry_id: string
          outcome: Database["public"]["Enums"]["review_outcome"]
          reviewer_id: string
        }
        Insert: {
          comments?: string | null
          decided_at?: string
          id?: string
          inquiry_id: string
          outcome: Database["public"]["Enums"]["review_outcome"]
          reviewer_id: string
        }
        Update: {
          comments?: string | null
          decided_at?: string
          id?: string
          inquiry_id?: string
          outcome?: Database["public"]["Enums"]["review_outcome"]
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_decisions_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "medical_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_decisions_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_case_completeness_checks: {
        Row: {
          case_id: string
          check_name: string
          created_at: string
          id: string
          is_demo: boolean
          notes: string | null
          passed: boolean
        }
        Insert: {
          case_id: string
          check_name: string
          created_at?: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          passed: boolean
        }
        Update: {
          case_id?: string
          check_name?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          passed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "safety_case_completeness_checks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "safety_case_demonstrations"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_case_demonstrations: {
        Row: {
          case_reference: string
          completeness_score: number | null
          created_at: string
          dataset_source: string
          id: string
          is_demo: boolean
          narrative_summary: string
          organization_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          case_reference: string
          completeness_score?: number | null
          created_at?: string
          dataset_source?: string
          id?: string
          is_demo?: boolean
          narrative_summary: string
          organization_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          case_reference?: string
          completeness_score?: number | null
          created_at?: string
          dataset_source?: string
          id?: string
          is_demo?: boolean
          narrative_summary?: string
          organization_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_case_demonstrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_case_review_events: {
        Row: {
          action: string
          case_id: string
          created_at: string
          id: string
          is_demo: boolean
          notes: string | null
          reviewer_id: string | null
        }
        Insert: {
          action: string
          case_id: string
          created_at?: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          reviewer_id?: string | null
        }
        Update: {
          action?: string
          case_id?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          notes?: string | null
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_case_review_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "safety_case_demonstrations"
            referencedColumns: ["id"]
          },
        ]
      }
      scientific_specialties: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          is_demo: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      security_audit_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
          organization_id: string | null
          outcome: string
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          outcome: string
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          organization_id?: string | null
          outcome?: string
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      si_evidence_documents: {
        Row: {
          created_at: string
          data_classification: Database["public"]["Enums"]["data_classification"]
          doi: string | null
          id: string
          ingested_at: string
          license_note: string | null
          pmid: string | null
          publication_date: string | null
          source_name: string
          source_url: string | null
          title: string
          updated_at: string
          verification_status: Database["public"]["Enums"]["si_verification_status"]
          version: string
        }
        Insert: {
          created_at?: string
          data_classification?: Database["public"]["Enums"]["data_classification"]
          doi?: string | null
          id?: string
          ingested_at?: string
          license_note?: string | null
          pmid?: string | null
          publication_date?: string | null
          source_name: string
          source_url?: string | null
          title: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["si_verification_status"]
          version?: string
        }
        Update: {
          created_at?: string
          data_classification?: Database["public"]["Enums"]["data_classification"]
          doi?: string | null
          id?: string
          ingested_at?: string
          license_note?: string | null
          pmid?: string | null
          publication_date?: string | null
          source_name?: string
          source_url?: string | null
          title?: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["si_verification_status"]
          version?: string
        }
        Relationships: []
      }
      si_evidence_passages: {
        Row: {
          content: string
          content_tsv: unknown
          created_at: string
          document_id: string
          id: string
          passage_key: string
          section_label: string | null
        }
        Insert: {
          content: string
          content_tsv?: unknown
          created_at?: string
          document_id: string
          id?: string
          passage_key: string
          section_label?: string | null
        }
        Update: {
          content?: string
          content_tsv?: unknown
          created_at?: string
          document_id?: string
          id?: string
          passage_key?: string
          section_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "si_evidence_passages_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "si_evidence_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      si_response_claims: {
        Row: {
          citation_passage_ids: string[]
          claim_key: string
          claim_text: string
          created_at: string
          draft_id: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["si_claim_status"]
        }
        Insert: {
          citation_passage_ids?: string[]
          claim_key: string
          claim_text: string
          created_at?: string
          draft_id: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["si_claim_status"]
        }
        Update: {
          citation_passage_ids?: string[]
          claim_key?: string
          claim_text?: string
          created_at?: string
          draft_id?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["si_claim_status"]
        }
        Relationships: [
          {
            foreignKeyName: "si_response_claims_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "si_response_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      si_response_drafts: {
        Row: {
          created_at: string
          created_by_role: string | null
          data_classification: Database["public"]["Enums"]["data_classification"]
          draft_text: string
          draft_version: number
          evidence_document_versions: Json
          id: string
          inquiry_id: string
          limitations_notes: string | null
          missing_evidence_notes: string | null
          safety_event_flag: boolean
          uncertainty_notes: string | null
        }
        Insert: {
          created_at?: string
          created_by_role?: string | null
          data_classification?: Database["public"]["Enums"]["data_classification"]
          draft_text: string
          draft_version: number
          evidence_document_versions?: Json
          id?: string
          inquiry_id: string
          limitations_notes?: string | null
          missing_evidence_notes?: string | null
          safety_event_flag?: boolean
          uncertainty_notes?: string | null
        }
        Update: {
          created_at?: string
          created_by_role?: string | null
          data_classification?: Database["public"]["Enums"]["data_classification"]
          draft_text?: string
          draft_version?: number
          evidence_document_versions?: Json
          id?: string
          inquiry_id?: string
          limitations_notes?: string | null
          missing_evidence_notes?: string | null
          safety_event_flag?: boolean
          uncertainty_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "si_response_drafts_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "medical_inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      si_retrieval_hits: {
        Row: {
          created_at: string
          document_id: string
          id: string
          passage_id: string
          rank_score: number
          run_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          passage_id: string
          rank_score: number
          run_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          passage_id?: string
          rank_score?: number
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "si_retrieval_hits_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "si_evidence_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "si_retrieval_hits_passage_id_fkey"
            columns: ["passage_id"]
            isOneToOne: false
            referencedRelation: "si_evidence_passages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "si_retrieval_hits_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "si_retrieval_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      si_retrieval_runs: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          module: string
          no_evidence: boolean
          query_text: string
          result_count: number
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          module: string
          no_evidence?: boolean
          query_text: string
          result_count?: number
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          module?: string
          no_evidence?: boolean
          query_text?: string
          result_count?: number
        }
        Relationships: []
      }
      si_simulation_evaluations: {
        Row: {
          communication: number | null
          compliance: number | null
          created_at: string
          critical_inaccuracy_flags: string[]
          evidence_interpretation: number | null
          id: string
          provisional: boolean
          raw_structured: Json | null
          reviewer_name: string | null
          reviewer_validated: boolean
          rubric_version: string
          scientific_accuracy: number | null
          session_id: string
          uncertainty_handling: number | null
          validated_at: string | null
        }
        Insert: {
          communication?: number | null
          compliance?: number | null
          created_at?: string
          critical_inaccuracy_flags?: string[]
          evidence_interpretation?: number | null
          id?: string
          provisional?: boolean
          raw_structured?: Json | null
          reviewer_name?: string | null
          reviewer_validated?: boolean
          rubric_version: string
          scientific_accuracy?: number | null
          session_id: string
          uncertainty_handling?: number | null
          validated_at?: string | null
        }
        Update: {
          communication?: number | null
          compliance?: number | null
          created_at?: string
          critical_inaccuracy_flags?: string[]
          evidence_interpretation?: number | null
          id?: string
          provisional?: boolean
          raw_structured?: Json | null
          reviewer_name?: string | null
          reviewer_validated?: boolean
          rubric_version?: string
          scientific_accuracy?: number | null
          session_id?: string
          uncertainty_handling?: number | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "si_simulation_evaluations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "si_simulation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      si_simulation_scenarios: {
        Row: {
          allowed_evidence_document_ids: string[]
          category: Database["public"]["Enums"]["si_simulation_category"]
          clinical_context: string
          code: string
          created_at: string
          hcp_persona: string
          id: string
          learning_objectives: string[]
          rubric_version: string
          scenario_version: string
          therapeutic_area: Database["public"]["Enums"]["fm_therapeutic_area"]
          title: string
        }
        Insert: {
          allowed_evidence_document_ids?: string[]
          category: Database["public"]["Enums"]["si_simulation_category"]
          clinical_context: string
          code: string
          created_at?: string
          hcp_persona: string
          id?: string
          learning_objectives?: string[]
          rubric_version: string
          scenario_version?: string
          therapeutic_area: Database["public"]["Enums"]["fm_therapeutic_area"]
          title: string
        }
        Update: {
          allowed_evidence_document_ids?: string[]
          category?: Database["public"]["Enums"]["si_simulation_category"]
          clinical_context?: string
          code?: string
          created_at?: string
          hcp_persona?: string
          id?: string
          learning_objectives?: string[]
          rubric_version?: string
          scenario_version?: string
          therapeutic_area?: Database["public"]["Enums"]["fm_therapeutic_area"]
          title?: string
        }
        Relationships: []
      }
      si_simulation_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          msl_id: string | null
          scenario_id: string
          scenario_version: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          msl_id?: string | null
          scenario_id: string
          scenario_version: string
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          msl_id?: string | null
          scenario_id?: string
          scenario_version?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "si_simulation_sessions_msl_id_fkey"
            columns: ["msl_id"]
            isOneToOne: false
            referencedRelation: "fm_msl_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "si_simulation_sessions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "si_simulation_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      si_simulation_turns: {
        Row: {
          cited_passage_ids: string[]
          content: string
          created_at: string
          id: string
          session_id: string
          speaker: string
          turn_index: number
        }
        Insert: {
          cited_passage_ids?: string[]
          content: string
          created_at?: string
          id?: string
          session_id: string
          speaker: string
          turn_index: number
        }
        Update: {
          cited_passage_ids?: string[]
          content?: string
          created_at?: string
          id?: string
          session_id?: string
          speaker?: string
          turn_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "si_simulation_turns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "si_simulation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      simulations: {
        Row: {
          competency_id: string
          created_at: string
          difficulty: string
          id: string
          scenario_summary: string
          title: string
        }
        Insert: {
          competency_id: string
          created_at?: string
          difficulty: string
          id?: string
          scenario_summary: string
          title: string
        }
        Update: {
          competency_id?: string
          created_at?: string
          difficulty?: string
          id?: string
          scenario_summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulations_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
        ]
      }
      therapeutic_areas: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          is_demo: boolean
          name: string
          slug: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name: string
          slug: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      fm_director_id_for_user: { Args: never; Returns: string }
      fm_is_leader: { Args: never; Returns: boolean }
      is_org_member: { Args: { target_org: string }; Returns: boolean }
      user_organization_id: { Args: never; Returns: string }
    }
    Enums: {
      ai_operating_mode: "demo" | "byok" | "enterprise"
      data_classification:
        | "public_scientific"
        | "internal_approved"
        | "restricted"
      evidence_trust_label:
        | "illustrative_unverified"
        | "internally_validated"
        | "planned"
      fm_assessment_validation:
        | "pending_review"
        | "validated"
        | "rejected"
        | "expired"
        | "superseded"
      fm_coaching_activity_status:
        | "planned"
        | "in_progress"
        | "completed"
        | "cancelled"
      fm_coaching_plan_status: "draft" | "active" | "completed" | "cancelled"
      fm_readiness_decision_outcome: "approved" | "deferred" | "denied"
      fm_readiness_status:
        | "not_started"
        | "in_progress"
        | "eligible"
        | "approved"
        | "deferred"
        | "denied"
      fm_therapeutic_area:
        | "oncology"
        | "inflammation"
        | "rare_disease"
        | "general_medicine"
      inquiry_channel:
        | "email"
        | "phone"
        | "portal"
        | "congress"
        | "msl_field"
        | "other"
      inquiry_priority: "low" | "medium" | "high" | "urgent"
      inquiry_status:
        | "draft"
        | "submitted"
        | "evidence_review"
        | "response_drafted"
        | "medical_review"
        | "approved"
        | "closed"
        | "rejected"
        | "needs_revision"
      kn_applicability:
        | "approved_for_reuse"
        | "similar_not_applicable"
        | "requires_adaptation"
        | "insufficient_context"
      kn_currency_status: "current" | "aging" | "outdated" | "unknown"
      kn_item_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "rejected"
        | "retired"
        | "needs_rereview"
      kn_match_decision:
        | "accepted"
        | "rejected"
        | "adapted"
        | "escalated"
        | "viewed"
      kn_review_decision:
        | "submitted"
        | "approved"
        | "rejected"
        | "returned"
        | "retired"
        | "flagged_rereview"
      requester_type: "hcp" | "patient" | "caregiver" | "internal" | "other"
      review_outcome: "approved" | "rejected" | "needs_revision"
      si_claim_status:
        | "pending"
        | "supported"
        | "needs_revision"
        | "unsupported"
      si_simulation_category:
        | "trial_interpretation"
        | "safety"
        | "conflicting_evidence"
        | "off_label_inquiry"
        | "difficult_kol_engagement"
      si_verification_status:
        | "unverified"
        | "illustrative_synthetic"
        | "source_verified"
        | "rejected"
      user_role:
        | "admin"
        | "medical_reviewer"
        | "medical_information_specialist"
        | "msl"
        | "field_director"
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
      ai_operating_mode: ["demo", "byok", "enterprise"],
      data_classification: [
        "public_scientific",
        "internal_approved",
        "restricted",
      ],
      evidence_trust_label: [
        "illustrative_unverified",
        "internally_validated",
        "planned",
      ],
      fm_assessment_validation: [
        "pending_review",
        "validated",
        "rejected",
        "expired",
        "superseded",
      ],
      fm_coaching_activity_status: [
        "planned",
        "in_progress",
        "completed",
        "cancelled",
      ],
      fm_coaching_plan_status: ["draft", "active", "completed", "cancelled"],
      fm_readiness_decision_outcome: ["approved", "deferred", "denied"],
      fm_readiness_status: [
        "not_started",
        "in_progress",
        "eligible",
        "approved",
        "deferred",
        "denied",
      ],
      fm_therapeutic_area: [
        "oncology",
        "inflammation",
        "rare_disease",
        "general_medicine",
      ],
      inquiry_channel: [
        "email",
        "phone",
        "portal",
        "congress",
        "msl_field",
        "other",
      ],
      inquiry_priority: ["low", "medium", "high", "urgent"],
      inquiry_status: [
        "draft",
        "submitted",
        "evidence_review",
        "response_drafted",
        "medical_review",
        "approved",
        "closed",
        "rejected",
        "needs_revision",
      ],
      kn_applicability: [
        "approved_for_reuse",
        "similar_not_applicable",
        "requires_adaptation",
        "insufficient_context",
      ],
      kn_currency_status: ["current", "aging", "outdated", "unknown"],
      kn_item_status: [
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "retired",
        "needs_rereview",
      ],
      kn_match_decision: [
        "accepted",
        "rejected",
        "adapted",
        "escalated",
        "viewed",
      ],
      kn_review_decision: [
        "submitted",
        "approved",
        "rejected",
        "returned",
        "retired",
        "flagged_rereview",
      ],
      requester_type: ["hcp", "patient", "caregiver", "internal", "other"],
      review_outcome: ["approved", "rejected", "needs_revision"],
      si_claim_status: [
        "pending",
        "supported",
        "needs_revision",
        "unsupported",
      ],
      si_simulation_category: [
        "trial_interpretation",
        "safety",
        "conflicting_evidence",
        "off_label_inquiry",
        "difficult_kol_engagement",
      ],
      si_verification_status: [
        "unverified",
        "illustrative_synthetic",
        "source_verified",
        "rejected",
      ],
      user_role: [
        "admin",
        "medical_reviewer",
        "medical_information_specialist",
        "msl",
        "field_director",
      ],
    },
  },
} as const

