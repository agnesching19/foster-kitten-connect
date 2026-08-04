export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.15'
  }
  public: {
    Tables: {
      daily_notes: {
        Row: {
          created_at: string
          date: string
          id: string
          litter_id: string
          note: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          litter_id: string
          note: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          litter_id?: string
          note?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'daily_notes_litter_id_fkey'
            columns: ['litter_id']
            isOneToOne: false
            referencedRelation: 'litters'
            referencedColumns: ['id']
          },
        ]
      }
      feedings: {
        Row: {
          created_at: string
          date: string
          food: string
          id: string
          litter_id: string
          meal_number: number | null
          notes: string | null
          time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          food: string
          id?: string
          litter_id: string
          meal_number?: number | null
          notes?: string | null
          time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          food?: string
          id?: string
          litter_id?: string
          meal_number?: number | null
          notes?: string | null
          time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'feedings_litter_id_fkey'
            columns: ['litter_id']
            isOneToOne: false
            referencedRelation: 'litters'
            referencedColumns: ['id']
          },
        ]
      }
      kittens: {
        Row: {
          avatar_path: string | null
          created_at: string
          id: string
          litter_id: string
          name: string
          sort_order: number
          tag_colour: Database['public']['Enums']['tag_colour'] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          id?: string
          litter_id: string
          name: string
          sort_order?: number
          tag_colour?: Database['public']['Enums']['tag_colour'] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          id?: string
          litter_id?: string
          name?: string
          sort_order?: number
          tag_colour?: Database['public']['Enums']['tag_colour'] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'kittens_litter_id_fkey'
            columns: ['litter_id']
            isOneToOne: false
            referencedRelation: 'litters'
            referencedColumns: ['id']
          },
        ]
      }
      litter_changes: {
        Row: {
          created_at: string
          date: string
          id: string
          litter_id: string
          notes: string | null
          time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          litter_id: string
          notes?: string | null
          time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          litter_id?: string
          notes?: string | null
          time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'litter_changes_litter_id_fkey'
            columns: ['litter_id']
            isOneToOne: false
            referencedRelation: 'litters'
            referencedColumns: ['id']
          },
        ]
      }
      litters: {
        Row: {
          album_url: string | null
          arrived: string
          created_at: string
          date_of_birth: string | null
          external_record: string | null
          id: string
          left_date: string | null
          litter_name: string | null
          mother_avatar_path: string | null
          mother_name: string
          status: Database['public']['Enums']['litter_status']
          updated_at: string
          user_id: string
        }
        Insert: {
          album_url?: string | null
          arrived: string
          created_at?: string
          date_of_birth?: string | null
          external_record?: string | null
          id?: string
          left_date?: string | null
          litter_name?: string | null
          mother_avatar_path?: string | null
          mother_name: string
          status?: Database['public']['Enums']['litter_status']
          updated_at?: string
          user_id: string
        }
        Update: {
          album_url?: string | null
          arrived?: string
          created_at?: string
          date_of_birth?: string | null
          external_record?: string | null
          id?: string
          left_date?: string | null
          litter_name?: string | null
          mother_avatar_path?: string | null
          mother_name?: string
          status?: Database['public']['Enums']['litter_status']
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      poop_entries: {
        Row: {
          created_at: string
          date: string
          id: string
          kitten_id: string | null
          litter_id: string
          note: string | null
          subject_type: Database['public']['Enums']['poop_subject_type']
          time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          kitten_id?: string | null
          litter_id: string
          note?: string | null
          subject_type?: Database['public']['Enums']['poop_subject_type']
          time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          kitten_id?: string | null
          litter_id?: string
          note?: string | null
          subject_type?: Database['public']['Enums']['poop_subject_type']
          time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'poop_entries_kitten_id_fkey'
            columns: ['kitten_id']
            isOneToOne: false
            referencedRelation: 'kittens'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'poop_entries_litter_id_fkey'
            columns: ['litter_id']
            isOneToOne: false
            referencedRelation: 'litters'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      weigh_ins: {
        Row: {
          created_at: string
          date: string
          id: string
          litter_id: string
          notes: string | null
          time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          litter_id: string
          notes?: string | null
          time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          litter_id?: string
          notes?: string | null
          time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'weigh_ins_litter_id_fkey'
            columns: ['litter_id']
            isOneToOne: false
            referencedRelation: 'litters'
            referencedColumns: ['id']
          },
        ]
      }
      weights: {
        Row: {
          created_at: string
          grams: number
          id: string
          kitten_id: string
          updated_at: string
          user_id: string
          weigh_in_id: string
        }
        Insert: {
          created_at?: string
          grams: number
          id?: string
          kitten_id: string
          updated_at?: string
          user_id: string
          weigh_in_id: string
        }
        Update: {
          created_at?: string
          grams?: number
          id?: string
          kitten_id?: string
          updated_at?: string
          user_id?: string
          weigh_in_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'weights_kitten_id_fkey'
            columns: ['kitten_id']
            isOneToOne: false
            referencedRelation: 'kittens'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'weights_weigh_in_id_fkey'
            columns: ['weigh_in_id']
            isOneToOne: false
            referencedRelation: 'weigh_ins'
            referencedColumns: ['id']
          },
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
      litter_status: 'active' | 'completed'
      poop_subject_type: 'mother' | 'kitten'
      tag_colour:
        | 'blue'
        | 'pink'
        | 'red'
        | 'orange'
        | 'yellow'
        | 'green'
        | 'purple'
        | 'white'
        | 'grey'
        | 'brown'
        | 'black'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      litter_status: ['active', 'completed'],
      poop_subject_type: ['mother', 'kitten'],
      tag_colour: [
        'blue',
        'pink',
        'red',
        'orange',
        'yellow',
        'green',
        'purple',
        'white',
        'grey',
        'brown',
        'black',
      ],
    },
  },
} as const
