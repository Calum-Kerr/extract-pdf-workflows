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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_tier: 'free' | 'pro' | 'enterprise'
          storage_used: number
          storage_limit: number
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          storage_used?: number
          storage_limit?: number
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          storage_used?: number
          storage_limit?: number
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          page_count: number | null
          thumbnail_url: string | null
          status: 'processing' | 'ready' | 'error'
          version_number: number
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          file_name: string
          file_path: string
          file_size: number
          mime_type?: string
          page_count?: number | null
          thumbnail_url?: string | null
          status?: 'processing' | 'ready' | 'error'
          version_number?: number
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          page_count?: number | null
          thumbnail_url?: string | null
          status?: 'processing' | 'ready' | 'error'
          version_number?: number
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      document_shares: {
        Row: {
          id: string
          document_id: string
          shared_by: string
          shared_with: string
          permission_level: 'view' | 'comment' | 'edit'
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          shared_by: string
          shared_with: string
          permission_level?: 'view' | 'comment' | 'edit'
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          shared_by?: string
          shared_with?: string
          permission_level?: 'view' | 'comment' | 'edit'
          expires_at?: string | null
          created_at?: string
        }
      }
      annotations: {
        Row: {
          id: string
          document_id: string
          user_id: string
          page_number: number
          annotation_type: string
          content: Json
          style: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id: string
          page_number: number
          annotation_type: string
          content: Json
          style?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          page_number?: number
          annotation_type?: string
          content?: Json
          style?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string | null
          status: 'active' | 'canceled' | 'past_due' | 'unpaid'
          price_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id?: string | null
          status?: 'active' | 'canceled' | 'past_due' | 'unpaid'
          price_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string | null
          status?: 'active' | 'canceled' | 'past_due' | 'unpaid'
          price_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      usage_analytics: {
        Row: {
          id: string
          user_id: string
          action_type: string
          resource_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action_type: string
          resource_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: string
          resource_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_tier: 'free' | 'pro' | 'enterprise'
      subscription_status: 'active' | 'canceled' | 'past_due' | 'unpaid'
      permission_level: 'view' | 'comment' | 'edit'
      document_status: 'processing' | 'ready' | 'error'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
