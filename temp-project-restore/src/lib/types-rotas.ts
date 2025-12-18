// Tipos específicos para o módulo de Rotas e O.S.

export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface EnderecoCompleto {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  coordenadas: Coordenadas;
}

export interface OrdemServico {
  id: string;
  numero_os: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_telefone: string;
  endereco: EnderecoCompleto;
  tipo_servico: 'instalacao' | 'reparo' | 'manutencao' | 'upgrade';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'aberta' | 'em_andamento' | 'finalizada' | 'cancelada';
  descricao: string;
  tecnico_id?: string;
  tecnico_nome?: string;
  data_abertura: Date;
  data_agendamento?: Date;
  data_finalizacao?: Date;
  observacoes?: string;
  diagnostico_previo?: string;
  created_at: Date;
  updated_at: Date;
}

export interface EstatisticaBairro {
  bairro: string;
  total_os: number;
  os_abertas: number;
  os_em_andamento: number;
  os_finalizadas: number;
  prioridade_media: number;
  coordenadas_centro: Coordenadas;
}

export interface FiltrosRotas {
  status?: OrdemServico['status'][];
  prioridade?: OrdemServico['prioridade'][];
  tipo_servico?: OrdemServico['tipo_servico'][];
  bairro?: string[];
  tecnico_id?: string;
  data_inicio?: Date;
  data_fim?: Date;
}

export interface TecnicoRota {
  id: string;
  nome: string;
  posicao_atual?: Coordenadas;
  os_atribuidas: string[];
  status: 'disponivel' | 'em_rota' | 'ocupado' | 'offline';
}
