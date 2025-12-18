// Tipos específicos para o módulo de técnicos

export interface Localizacao {
  latitude: number;
  longitude: number;
  endereco: string;
  bairro: string;
  cidade: string;
}

export interface OrdemServico {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  endereco: string;
  bairro: string;
  localizacao: Localizacao;
  tipo: 'instalacao' | 'manutencao' | 'reparo' | 'suporte';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  descricao: string;
  data_abertura: string;
  previsao_conclusao?: string;
  tempo_estimado_minutos: number;
}

export interface Tecnico {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  status: 'disponivel' | 'ocupado' | 'offline';
  localizacao_atual?: Localizacao;
  especialidades: string[];
  ordens_servico_ativas: OrdemServico[];
  ordens_servico_hoje: number;
  avaliacao_media: number;
  total_avaliacoes: number;
  ultima_atualizacao: string;
}

export interface SugestaoAlocacao {
  tecnico_id: string;
  tecnico_nome: string;
  score: number; // 0-100
  motivo: string;
  distancia_km: number;
  tempo_estimado_minutos: number;
  ordens_proximas: number;
  disponibilidade: 'imediata' | 'em_breve' | 'ocupado';
}

export interface ResultadoAlocacao {
  sucesso: boolean;
  mensagem: string;
  tecnico_alocado?: Tecnico;
  ordem_servico?: OrdemServico;
  rota_otimizada?: {
    ordens: OrdemServico[];
    distancia_total_km: number;
    tempo_total_minutos: number;
  };
}

export interface FiltrosTecnicos {
  status?: 'disponivel' | 'ocupado' | 'offline';
  especialidade?: string;
  regiao?: string;
  busca?: string;
}
