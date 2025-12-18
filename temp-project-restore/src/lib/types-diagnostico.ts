// Tipos específicos para o módulo de diagnóstico

export interface DadosFibra {
  olt: string;
  porta_pon: string;
  onu: string;
  status_onu: 'online' | 'offline';
  potencia_rx: string;
  potencia_tx: string;
  historico_quedas: number;
  alarmes: string[];
  ultimo_reboot?: string;
}

export interface DadosWifi {
  canal: string;
  intensidade_sinal: string;
  interferencia: string;
  dispositivos_conectados: number;
  ultimo_reboot?: string;
}

export interface ClienteDiagnostico {
  id: string;
  nome: string;
  contrato: string;
  endereco: string;
  bairro: string;
  cidade: string;
  telefone: string;
  plano: string;
  pop: string;
  dados_fibra: DadosFibra;
  dados_wifi?: DadosWifi;
}

export interface TesteAutomatico {
  nome: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  resultado: string;
  timestamp: Date;
}

export interface TecnicoAtribuido {
  id: string;
  nome: string;
  regiao: string;
  previsao_chegada: string;
}

export interface ResultadoDiagnostico {
  status_final: 'resolvido' | 'despachado';
  causa_provavel: string;
  analise_ia: string;
  testes_executados: TesteAutomatico[];
  acoes_executadas: string[];
  mensagem: string;
  proximo_passo?: string;
  tecnico_atribuido?: TecnicoAtribuido;
  laudo_completo: string;
  timestamp: Date;
}

export interface ConfiguracaoIA {
  id: string;
  nome: string;
  provider: 'openai' | 'anthropic' | 'custom';
  api_url: string;
  api_key: string;
  modelo: string;
  ativo: boolean;
  temperatura: number;
  max_tokens: number;
}
