export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string
          first_name: string | null
          last_name: string | null
          avatar: string | null
          role: 'user' | 'admin' | 'moderator'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          first_name?: string | null
          last_name?: string | null
          avatar?: string | null
          role?: 'user' | 'admin' | 'moderator'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          first_name?: string | null
          last_name?: string | null
          avatar?: string | null
          role?: 'user' | 'admin' | 'moderator'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      polls: {
        Row: {
          id: string
          title: string
          description: string | null
          creator_id: string
          is_active: boolean
          allow_multiple_votes: boolean
          require_auth: boolean
          expires_at: string | null
          category: 'general' | 'politics' | 'sports' | 'entertainment' | 'technology' | 'business' | 'education' | 'health' | 'lifestyle' | 'other'
          tags: string[] | null
          total_votes: number
          total_views: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          creator_id: string
          is_active?: boolean
          allow_multiple_votes?: boolean
          require_auth?: boolean
          expires_at?: string | null
          category?: 'general' | 'politics' | 'sports' | 'entertainment' | 'technology' | 'business' | 'education' | 'health' | 'lifestyle' | 'other'
          tags?: string[] | null
          total_votes?: number
          total_views?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          creator_id?: string
          is_active?: boolean
          allow_multiple_votes?: boolean
          require_auth?: boolean
          expires_at?: string | null
          category?: 'general' | 'politics' | 'sports' | 'entertainment' | 'technology' | 'business' | 'education' | 'health' | 'lifestyle' | 'other'
          tags?: string[] | null
          total_votes?: number
          total_views?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "polls_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      poll_options: {
        Row: {
          id: string
          poll_id: string
          text: string
          votes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          text: string
          votes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          text?: string
          votes?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          }
        ]
      }
      votes: {
        Row: {
          id: string
          poll_id: string
          option_id: string
          user_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          option_id: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          option_id?: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      poll_views: {
        Row: {
          id: string
          poll_id: string
          user_id: string | null
          ip_address: string | null
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_views_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      poll_status: 'active' | 'expired' | 'draft' | 'archived'
      user_role: 'user' | 'admin' | 'moderator'
      vote_type: 'single' | 'multiple'
      poll_category: 'general' | 'politics' | 'sports' | 'entertainment' | 'technology' | 'business' | 'education' | 'health' | 'lifestyle' | 'other'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific table types
export type Profile = Tables<'profiles'>
export type Poll = Tables<'polls'>
export type PollOption = Tables<'poll_options'>
export type Vote = Tables<'votes'>
export type PollView = Tables<'poll_views'>

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type PollInsert = Database['public']['Tables']['polls']['Insert']
export type PollOptionInsert = Database['public']['Tables']['poll_options']['Insert']
export type VoteInsert = Database['public']['Tables']['votes']['Insert']
export type PollViewInsert = Database['public']['Tables']['poll_views']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type PollUpdate = Database['public']['Tables']['polls']['Update']
export type PollOptionUpdate = Database['public']['Tables']['poll_options']['Update']
export type VoteUpdate = Database['public']['Tables']['votes']['Update']
export type PollViewUpdate = Database['public']['Tables']['poll_views']['Update']
