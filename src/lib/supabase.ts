import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos do banco de dados
export type Database = {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string;
          ixc_id: string | null;
          nome: string;
          contrato: string;
          endereco: string;
          bairro: string;
          cidade: string;
          telefone: string | null;
          plano: string | null;
          pop: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clientes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['clientes']['Insert']>;
      };
      tecnicos: {
        Row: {
          id: string;
          nome: string;
          status: 'available' | 'busy' | 'offline';
          latitude: number | null;
          longitude: number | null;
          habilidades: string[] | null;
          fila_atual: number;
          territorio: string | null;
          telefone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tecnicos']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tecnicos']['Insert']>;
      };
      ordens_servico: {
        Row: {
          id: string;
          numero_os: string;
          ixc_id: string | null;
          cliente_id: string | null;
          status: 'pending' | 'diagnosing' | 'resolved_remote' | 'dispatched' | 'in_progress' | 'completed' | 'cancelled';
          prioridade: 'low' | 'medium' | 'high' | 'critical';
          problema_relatado: string;
          problema_tipo: 'no_internet' | 'slow' | 'intermittent' | 'wifi' | 'auth' | 'incident' | null;
          tecnico_id: string | null;
          data_abertura: string;
          data_agendamento: string | null;
          data_conclusao: string | null;
          sla_expira_em: string | null;
          origem: 'ixc' | 'manual' | 'app';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ordens_servico']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['ordens_servico']['Insert']>;
      };
      diagnosticos: {
        Row: {
          id: string;
          os_id: string;
          problema_classificado: string | null;
          decisao: 'resolver_remoto' | 'despachar_tecnico' | 'orientar_cliente' | null;
          laudo: string | null;
          testes: any;
          ia_confidence: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['diagnosticos']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['diagnosticos']['Insert']>;
      };
      observacoes: {
        Row: {
          id: string;
          os_id: string;
          texto: string;
          autor: string | null;
          tipo: 'manual' | 'automatico' | 'ia';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['observacoes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['observacoes']['Insert']>;
      };
      regras_despacho: {
        Row: {
          id: string;
          nome: string;
          ativo: boolean;
          peso_distancia: number;
          peso_fila: number;
          peso_habilidade: number;
          peso_sla: number;
          limite_fila_tecnico: number;
          modo: 'tempo_real' | 'lote';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['regras_despacho']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['regras_despacho']['Insert']>;
      };
      config_ixc: {
        Row: {
          id: string;
          url_api: string;
          token: string;
          ativo: boolean;
          intervalo_sync: number;
          ultima_sync: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['config_ixc']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['config_ixc']['Insert']>;
      };
    };
  };
};
