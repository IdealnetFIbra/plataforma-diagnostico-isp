// Tipos da plataforma TAOS

export type OSStatus = 
  | 'pending' // Aguardando diagnóstico
  | 'diagnosing' // Em diagnóstico
  | 'resolved_remote' // Resolvido remotamente
  | 'dispatched' // Despachado para técnico
  | 'in_progress' // Técnico em atendimento
  | 'completed' // Concluído
  | 'cancelled'; // Cancelado

export type ProblemType = 
  | 'no_internet' // Sem internet
  | 'slow' // Lento
  | 'intermittent' // Quedas intermitentes
  | 'wifi' // Problema Wi-Fi
  | 'auth' // Autenticação
  | 'incident'; // Incidente regional

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Cliente {
  id: string;
  nome: string;
  contrato: string;
  endereco: string;
  bairro: string;
  cidade: string;
  telefone: string;
  plano: string;
  pop: string;
}

export interface DiagnosticoTeste {
  nome: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  resultado: string;
  timestamp: Date;
}

export interface Diagnostico {
  id: string;
  problema_classificado: ProblemType;
  testes: DiagnosticoTeste[];
  decisao: 'resolver_remoto' | 'despachar_tecnico' | 'orientar_cliente';
  laudo: string;
  timestamp: Date;
}

export interface Tecnico {
  id: string;
  nome: string;
  status: 'available' | 'busy' | 'offline';
  localizacao: {
    lat: number;
    lng: number;
  };
  habilidades: string[];
  fila_atual: number;
  territorio: string;
}

export interface OrdemServico {
  id: string;
  numero_os: string;
  cliente: Cliente;
  status: OSStatus;
  prioridade: Priority;
  problema_relatado: string;
  problema_tipo: ProblemType;
  diagnostico?: Diagnostico;
  tecnico_atribuido?: Tecnico;
  data_abertura: Date;
  data_agendamento?: Date;
  data_conclusao?: Date;
  sla_expira_em: Date;
  observacoes: string[];
  origem: 'ixc' | 'manual' | 'app';
}

export interface Metricas {
  total_os: number;
  resolvidas_remoto: number;
  despachadas: number;
  em_andamento: number;
  concluidas_hoje: number;
  tempo_medio_solucao: number; // minutos
  taxa_retorno: number; // percentual
  sla_cumprido: number; // percentual
}

export interface RegraDespacho {
  id: string;
  nome: string;
  ativo: boolean;
  peso_distancia: number;
  peso_fila: number;
  peso_habilidade: number;
  peso_sla: number;
  limite_fila_tecnico: number;
  modo: 'tempo_real' | 'lote';
}

export interface Territorio {
  id: string;
  nome: string;
  bairros: string[];
  tecnicos: string[];
  cor: string;
}

export interface LogAuditoria {
  id: string;
  timestamp: Date;
  usuario: string;
  acao: string;
  entidade: string;
  entidade_id: string;
  detalhes: Record<string, unknown>;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'noc' | 'supervisor' | 'tecnico' | 'atendimento' | 'admin';
  avatar?: string;
}
