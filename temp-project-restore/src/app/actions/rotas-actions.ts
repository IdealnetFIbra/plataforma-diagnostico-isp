'use server';

import { OrdemServico, EstatisticaBairro, FiltrosRotas } from '@/lib/types-rotas';

// Simulação de dados - substituir por integração real com IXC e Supabase
const ordensServicoMock: OrdemServico[] = [
  {
    id: '1',
    numero_os: 'OS-2024-001',
    cliente_id: 'CLI-001',
    cliente_nome: 'João Silva',
    cliente_telefone: '(51) 99999-0001',
    endereco: {
      logradouro: 'Rua das Flores',
      numero: '123',
      bairro: 'Parque Alvorada',
      cidade: 'Porto Alegre',
      estado: 'RS',
      cep: '91000-000',
      coordenadas: { lat: -30.0346, lng: -51.2177 }
    },
    tipo_servico: 'reparo',
    prioridade: 'alta',
    status: 'aberta',
    descricao: 'Cliente sem internet - fibra',
    data_abertura: new Date('2024-01-15T08:30:00'),
    created_at: new Date('2024-01-15T08:30:00'),
    updated_at: new Date('2024-01-15T08:30:00')
  },
  {
    id: '2',
    numero_os: 'OS-2024-002',
    cliente_id: 'CLI-002',
    cliente_nome: 'Maria Santos',
    cliente_telefone: '(51) 99999-0002',
    endereco: {
      logradouro: 'Av. Principal',
      numero: '456',
      bairro: 'Parque Alvorada',
      cidade: 'Porto Alegre',
      estado: 'RS',
      cep: '91000-100',
      coordenadas: { lat: -30.0356, lng: -51.2187 }
    },
    tipo_servico: 'instalacao',
    prioridade: 'media',
    status: 'aberta',
    descricao: 'Nova instalação fibra óptica',
    tecnico_id: 'TEC-001',
    tecnico_nome: 'Carlos Técnico',
    data_abertura: new Date('2024-01-15T09:00:00'),
    created_at: new Date('2024-01-15T09:00:00'),
    updated_at: new Date('2024-01-15T09:00:00')
  },
  {
    id: '3',
    numero_os: 'OS-2024-003',
    cliente_id: 'CLI-003',
    cliente_nome: 'Pedro Costa',
    cliente_telefone: '(51) 99999-0003',
    endereco: {
      logradouro: 'Rua Central',
      numero: '789',
      bairro: 'Centro',
      cidade: 'Porto Alegre',
      estado: 'RS',
      cep: '90000-000',
      coordenadas: { lat: -30.0277, lng: -51.2287 }
    },
    tipo_servico: 'manutencao',
    prioridade: 'baixa',
    status: 'aberta',
    descricao: 'Manutenção preventiva',
    data_abertura: new Date('2024-01-15T10:00:00'),
    created_at: new Date('2024-01-15T10:00:00'),
    updated_at: new Date('2024-01-15T10:00:00')
  },
  {
    id: '4',
    numero_os: 'OS-2024-004',
    cliente_id: 'CLI-004',
    cliente_nome: 'Ana Oliveira',
    cliente_telefone: '(51) 99999-0004',
    endereco: {
      logradouro: 'Rua do Comércio',
      numero: '321',
      bairro: 'Restinga',
      cidade: 'Porto Alegre',
      estado: 'RS',
      cep: '91000-200',
      coordenadas: { lat: -30.1177, lng: -51.1577 }
    },
    tipo_servico: 'reparo',
    prioridade: 'urgente',
    status: 'em_andamento',
    descricao: 'Sem sinal - urgente',
    tecnico_id: 'TEC-002',
    tecnico_nome: 'Roberto Técnico',
    data_abertura: new Date('2024-01-15T07:00:00'),
    created_at: new Date('2024-01-15T07:00:00'),
    updated_at: new Date('2024-01-15T09:30:00')
  },
  {
    id: '5',
    numero_os: 'OS-2024-005',
    cliente_id: 'CLI-005',
    cliente_nome: 'Lucas Ferreira',
    cliente_telefone: '(51) 99999-0005',
    endereco: {
      logradouro: 'Av. dos Estados',
      numero: '555',
      bairro: 'Parque Alvorada',
      cidade: 'Porto Alegre',
      estado: 'RS',
      cep: '91000-150',
      coordenadas: { lat: -30.0366, lng: -51.2197 }
    },
    tipo_servico: 'upgrade',
    prioridade: 'media',
    status: 'aberta',
    descricao: 'Upgrade de plano - 500MB',
    data_abertura: new Date('2024-01-15T11:00:00'),
    created_at: new Date('2024-01-15T11:00:00'),
    updated_at: new Date('2024-01-15T11:00:00')
  }
];

export async function buscarOrdensServico(filtros?: FiltrosRotas): Promise<OrdemServico[]> {
  // TODO: Implementar busca real no Supabase
  // const { data, error } = await supabase
  //   .from('ordens_servico')
  //   .select('*')
  //   .eq('status', 'aberta')
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let resultado = [...ordensServicoMock];
  
  if (filtros?.status && filtros.status.length > 0) {
    resultado = resultado.filter(os => filtros.status!.includes(os.status));
  }
  
  if (filtros?.prioridade && filtros.prioridade.length > 0) {
    resultado = resultado.filter(os => filtros.prioridade!.includes(os.prioridade));
  }
  
  if (filtros?.bairro && filtros.bairro.length > 0) {
    resultado = resultado.filter(os => filtros.bairro!.includes(os.endereco.bairro));
  }
  
  if (filtros?.tecnico_id) {
    resultado = resultado.filter(os => os.tecnico_id === filtros.tecnico_id);
  }
  
  return resultado;
}

export async function buscarEstatisticasPorBairro(): Promise<EstatisticaBairro[]> {
  // TODO: Implementar consulta real no Supabase com agregação
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const bairros = new Map<string, EstatisticaBairro>();
  
  ordensServicoMock.forEach(os => {
    const bairro = os.endereco.bairro;
    
    if (!bairros.has(bairro)) {
      bairros.set(bairro, {
        bairro,
        total_os: 0,
        os_abertas: 0,
        os_em_andamento: 0,
        os_finalizadas: 0,
        prioridade_media: 0,
        coordenadas_centro: os.endereco.coordenadas
      });
    }
    
    const stats = bairros.get(bairro)!;
    stats.total_os++;
    
    if (os.status === 'aberta') stats.os_abertas++;
    if (os.status === 'em_andamento') stats.os_em_andamento++;
    if (os.status === 'finalizada') stats.os_finalizadas++;
  });
  
  return Array.from(bairros.values()).sort((a, b) => b.total_os - a.total_os);
}

export async function finalizarOrdemServico(osId: string, observacoes?: string): Promise<{ success: boolean; message: string }> {
  // TODO: Implementar atualização real no Supabase
  // const { error } = await supabase
  //   .from('ordens_servico')
  //   .update({ 
  //     status: 'finalizada',
  //     data_finalizacao: new Date(),
  //     observacoes 
  //   })
  //   .eq('id', osId)
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const os = ordensServicoMock.find(o => o.id === osId);
  
  if (!os) {
    return { success: false, message: 'O.S. não encontrada' };
  }
  
  os.status = 'finalizada';
  os.data_finalizacao = new Date();
  if (observacoes) os.observacoes = observacoes;
  
  return { success: true, message: 'O.S. finalizada com sucesso' };
}

export async function atribuirTecnico(osId: string, tecnicoId: string, tecnicoNome: string): Promise<{ success: boolean; message: string }> {
  // TODO: Implementar atualização real no Supabase
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const os = ordensServicoMock.find(o => o.id === osId);
  
  if (!os) {
    return { success: false, message: 'O.S. não encontrada' };
  }
  
  os.tecnico_id = tecnicoId;
  os.tecnico_nome = tecnicoNome;
  os.status = 'em_andamento';
  
  return { success: true, message: 'Técnico atribuído com sucesso' };
}
