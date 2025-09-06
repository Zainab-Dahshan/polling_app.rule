/**
 * Type definitions for the Supabase database schema.
 * These types provide type safety when interacting with the database through the Supabase client.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Database interface representing the Supabase schema.
 * Contains type definitions for all tables and their relationships.
 */
export interface Database {
  public: {
    Tables: {
      polls: {
        Row: {
          id: string
          created_at: string
          question: string
          options: Json
          created_by: string
          expires_at: string | null
          is_public: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          question: string
          options: Json
          created_by: string
          expires_at?: string | null
          is_public?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          question?: string
          options?: Json
          created_by?: string
          expires_at?: string | null
          is_public?: boolean
        }
      }
      votes: {
        Row: {
          id: string
          created_at: string
          poll_id: string
          user_id: string
          option_index: number
        }
        Insert: {
          id?: string
          created_at?: string
          poll_id: string
          user_id: string
          option_index: number
        }
        Update: {
          id?: string
          created_at?: string
          poll_id?: string
          user_id?: string
          option_index?: number
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          username: string
          avatar_url: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          username: string
          avatar_url?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          username?: string
          avatar_url?: string | null
          user_id?: string
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
      [_ in never]: never
    }
  }
}