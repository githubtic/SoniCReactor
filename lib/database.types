export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: "user" | "admin"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: "user" | "admin"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: "user" | "admin"
          created_at?: string
          updated_at?: string
        }
      }
      investors: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          amount: number
          status: "pending" | "approved" | "rejected"
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          amount: number
          status?: "pending" | "approved" | "rejected"
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          amount?: number
          status?: "pending" | "approved" | "rejected"
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sound_patterns: {
        Row: {
          id: string
          label: string
          description: string | null
          process_code: string | null
          audio_url: string | null
          waveform_image_url: string | null
          duration: number | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          label: string
          description?: string | null
          process_code?: string | null
          audio_url?: string | null
          waveform_image_url?: string | null
          duration?: number | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          label?: string
          description?: string | null
          process_code?: string | null
          audio_url?: string | null
          waveform_image_url?: string | null
          duration?: number | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      devices: {
        Row: {
          id: string
          name: string
          type: "computer" | "phone" | "server"
          ip_address: string | null
          status: "online" | "offline" | "maintenance"
          last_active: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: "computer" | "phone" | "server"
          ip_address?: string | null
          status?: "online" | "offline" | "maintenance"
          last_active?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: "computer" | "phone" | "server"
          ip_address?: string | null
          status?: "online" | "offline" | "maintenance"
          last_active?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      device_activity_log: {
        Row: {
          id: string
          device_id: string
          action: string
          details: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          device_id: string
          action: string
          details?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          device_id?: string
          action?: string
          details?: string | null
          timestamp?: string
        }
      }
      events: {
        Row: {
          id: string
          pattern_id: string
          device_id: string
          action_description: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pattern_id: string
          device_id: string
          action_description: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pattern_id?: string
          device_id?: string
          action_description?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      action_scripts: {
        Row: {
          id: string
          event_id: string
          script_content: string
          script_type: "python" | "bash" | "javascript"
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          script_content: string
          script_type?: "python" | "bash" | "javascript"
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          script_content?: string
          script_type?: "python" | "bash" | "javascript"
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      detection_history: {
        Row: {
          id: string
          pattern_id: string | null
          device_id: string | null
          event_id: string | null
          confidence: number | null
          action_executed: boolean
          execution_result: string | null
          detected_at: string
        }
        Insert: {
          id?: string
          pattern_id?: string | null
          device_id?: string | null
          event_id?: string | null
          confidence?: number | null
          action_executed?: boolean
          execution_result?: string | null
          detected_at?: string
        }
        Update: {
          id?: string
          pattern_id?: string | null
          device_id?: string | null
          event_id?: string | null
          confidence?: number | null
          action_executed?: boolean
          execution_result?: string | null
          detected_at?: string
        }
      }
    }
  }
}
