import type { ThemeColors } from '@/lib/theme'

export interface Database {
  public: {
    Tables: {
      parishes: {
        Row: {
          id: string
          name: string
          diocese: string | null
          join_code: string
          logo_url: string | null
          theme: ThemeColors | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          diocese?: string | null
          join_code?: string
          logo_url?: string | null
          theme?: ThemeColors | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          diocese?: string | null
          join_code?: string
          logo_url?: string | null
          theme?: ThemeColors | null
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          parish_id: string
          name: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          parish_id: string
          name: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          parish_id?: string
          name?: string
          email?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_parish_id_fkey'
            columns: ['parish_id']
            isOneToOne: false
            referencedRelation: 'parishes'
            referencedColumns: ['id']
          },
        ]
      }
      roles: {
        Row: {
          id: string
          parish_id: string
          name: string
          description: string
          icon_name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          parish_id: string
          name: string
          description?: string
          icon_name?: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          parish_id?: string
          name?: string
          description?: string
          icon_name?: string
          color?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'roles_parish_id_fkey'
            columns: ['parish_id']
            isOneToOne: false
            referencedRelation: 'parishes'
            referencedColumns: ['id']
          },
        ]
      }
      members: {
        Row: {
          id: string
          parish_id: string
          name: string
          phone: string
          email: string | null
          user_id: string | null
          avatar_url: string
          availability: 'Semanal' | 'Quinzenal' | 'Mensal'
          status: 'Ativo' | 'Inativo'
          notes: string | null
          approval_status: 'Pendente' | 'Aprovado' | 'Rejeitado'
          created_at: string
        }
        Insert: {
          id?: string
          parish_id: string
          name: string
          phone?: string
          email?: string | null
          user_id?: string | null
          avatar_url?: string
          availability?: 'Semanal' | 'Quinzenal' | 'Mensal'
          status?: 'Ativo' | 'Inativo'
          notes?: string | null
          approval_status?: 'Pendente' | 'Aprovado' | 'Rejeitado'
          created_at?: string
        }
        Update: {
          id?: string
          parish_id?: string
          name?: string
          phone?: string
          email?: string | null
          user_id?: string | null
          avatar_url?: string
          availability?: 'Semanal' | 'Quinzenal' | 'Mensal'
          status?: 'Ativo' | 'Inativo'
          notes?: string | null
          approval_status?: 'Pendente' | 'Aprovado' | 'Rejeitado'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'members_parish_id_fkey'
            columns: ['parish_id']
            isOneToOne: false
            referencedRelation: 'parishes'
            referencedColumns: ['id']
          },
        ]
      }
      member_roles: {
        Row: {
          member_id: string
          role_id: string
        }
        Insert: {
          member_id: string
          role_id: string
        }
        Update: {
          member_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'member_roles_member_id_fkey'
            columns: ['member_id']
            isOneToOne: false
            referencedRelation: 'members'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'member_roles_role_id_fkey'
            columns: ['role_id']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['id']
          },
        ]
      }
      member_availability: {
        Row: {
          member_id: string
          day_of_week: number
          period: 'Manha' | 'Noite'
        }
        Insert: {
          member_id: string
          day_of_week: number
          period: 'Manha' | 'Noite'
        }
        Update: {
          member_id?: string
          day_of_week?: number
          period?: 'Manha' | 'Noite'
        }
        Relationships: [
          {
            foreignKeyName: 'member_availability_member_id_fkey'
            columns: ['member_id']
            isOneToOne: false
            referencedRelation: 'members'
            referencedColumns: ['id']
          },
        ]
      }
      schedules: {
        Row: {
          id: string
          parish_id: string
          title: string
          date: string
          time: string
          theme: string | null
          status: 'Confirmada' | 'Pendente' | 'Rascunho'
          leitor1: string | null
          leitor1_status: 'Pendente' | 'Confirmado' | 'Recusado'
          leitor2: string | null
          leitor2_status: 'Pendente' | 'Confirmado' | 'Recusado'
          created_at: string
        }
        Insert: {
          id?: string
          parish_id: string
          title: string
          date: string
          time: string
          theme?: string | null
          status?: 'Confirmada' | 'Pendente' | 'Rascunho'
          leitor1?: string | null
          leitor1_status?: 'Pendente' | 'Confirmado' | 'Recusado'
          leitor2?: string | null
          leitor2_status?: 'Pendente' | 'Confirmado' | 'Recusado'
          created_at?: string
        }
        Update: {
          id?: string
          parish_id?: string
          title?: string
          date?: string
          time?: string
          theme?: string | null
          status?: 'Confirmada' | 'Pendente' | 'Rascunho'
          leitor1?: string | null
          leitor1_status?: 'Pendente' | 'Confirmado' | 'Recusado'
          leitor2?: string | null
          leitor2_status?: 'Pendente' | 'Confirmado' | 'Recusado'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'schedules_parish_id_fkey'
            columns: ['parish_id']
            isOneToOne: false
            referencedRelation: 'parishes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'schedules_leitor1_fkey'
            columns: ['leitor1']
            isOneToOne: false
            referencedRelation: 'members'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'schedules_leitor2_fkey'
            columns: ['leitor2']
            isOneToOne: false
            referencedRelation: 'members'
            referencedColumns: ['id']
          },
        ]
      }
      schedule_assignments: {
        Row: {
          id: string
          schedule_id: string
          role_id: string
          member_id: string | null
          confirmation_status: 'Pendente' | 'Confirmado' | 'Recusado'
        }
        Insert: {
          id?: string
          schedule_id: string
          role_id: string
          member_id?: string | null
          confirmation_status?: 'Pendente' | 'Confirmado' | 'Recusado'
        }
        Update: {
          id?: string
          schedule_id?: string
          role_id?: string
          member_id?: string | null
          confirmation_status?: 'Pendente' | 'Confirmado' | 'Recusado'
        }
        Relationships: [
          {
            foreignKeyName: 'schedule_assignments_schedule_id_fkey'
            columns: ['schedule_id']
            isOneToOne: false
            referencedRelation: 'schedules'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'schedule_assignments_role_id_fkey'
            columns: ['role_id']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'schedule_assignments_member_id_fkey'
            columns: ['member_id']
            isOneToOne: false
            referencedRelation: 'members'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      confirm_assignment: {
        Args: { p_assignment_id: string; p_status: string }
        Returns: void
      }
      confirm_leitor: {
        Args: { p_schedule_id: string; p_slot: string; p_status: string }
        Returns: void
      }
      roles_for_join_code: {
        Args: { p_join_code: string }
        Returns: {
          id: string
          name: string
          description: string
          icon_name: string
          color: string
        }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
