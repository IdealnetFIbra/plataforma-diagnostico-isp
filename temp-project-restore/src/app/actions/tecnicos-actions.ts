'use server';

import type {
  Tecnico,
  OrdemServico,
  SugestaoAlocacao,
  ResultadoAlocacao,
  FiltrosTecnicos,
  Localizacao,
} from '@/lib/types-tecnicos';

// Função auxiliar para calcular distância entre dois pontos (Haversine)
function calcularDistancia(loc1: Localizacao, loc2: Localizacao): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
  const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.latitude * Math.PI) / 180) *
      Math.cos((loc2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Buscar todos os técnicos do IXC
export async function buscarTecnicos(
  filtros?: FiltrosTecnicos
): Promise<Tecnico[]> {
  try {
    // Simulação de delay de API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Dados simulados - substituir por integração real IXC
    const tecnicosSimulados: Tecnico[] = [
      {
        id: 'TEC-001',
        nome: 'Carlos Eduardo Silva',
        telefone: '(11) 98765-4321',
        email: 'carlos.silva@provedor.com',
        status: 'disponivel',
        localizacao_atual: {
          latitude: -23.5505,
          longitude: -46.6333,
          endereco: 'Rua das Palmeiras, 100',
          bairro: 'Centro',
          cidade: 'São Paulo',
        },
        especialidades: ['Fibra Óptica', 'Instalação', 'Manutenção'],
        ordens_servico_ativas: [],
        ordens_servico_hoje: 3,
        avaliacao_media: 4.8,
        total_avaliacoes: 156,
        ultima_atualizacao: new Date().toISOString(),
      },
      {
        id: 'TEC-002',
        nome: 'Ana Paula Santos',
        telefone: '(11) 98765-1234',
        email: 'ana.santos@provedor.com',
        status: 'ocupado',
        localizacao_atual: {
          latitude: -23.5489,
          longitude: -46.6388,
          endereco: 'Av. Paulista, 1500',
          bairro: 'Parque Alvorada',
          cidade: 'São Paulo',
        },
        especialidades: ['Fibra Óptica', 'Suporte Técnico', 'Configuração'],
        ordens_servico_ativas: [
          {
            id: 'OS-1001',
            cliente_id: 'CLI-5001',
            cliente_nome: 'João Silva',
            endereco: 'Rua das Flores, 250',
            bairro: 'Parque Alvorada',
            localizacao: {
              latitude: -23.5490,
              longitude: -46.6390,
              endereco: 'Rua das Flores, 250',
              bairro: 'Parque Alvorada',
              cidade: 'São Paulo',
            },
            tipo: 'reparo',
            prioridade: 'alta',
            status: 'em_andamento',
            descricao: 'Cliente sem sinal - verificar fibra',
            data_abertura: new Date().toISOString(),
            tempo_estimado_minutos: 45,
          },
        ],
        ordens_servico_hoje: 5,
        avaliacao_media: 4.9,
        total_avaliacoes: 203,
        ultima_atualizacao: new Date().toISOString(),
      },
      {
        id: 'TEC-003',
        nome: 'Roberto Oliveira',
        telefone: '(11) 98765-5678',
        email: 'roberto.oliveira@provedor.com',
        status: 'disponivel',
        localizacao_atual: {
          latitude: -23.5615,
          longitude: -46.6560,
          endereco: 'Rua Augusta, 800',
          bairro: 'Jardim Europa',
          cidade: 'São Paulo',
        },
        especialidades: ['Instalação', 'Cabeamento', 'Fibra Óptica'],
        ordens_servico_ativas: [],
        ordens_servico_hoje: 2,
        avaliacao_media: 4.7,
        total_avaliacoes: 98,
        ultima_atualizacao: new Date().toISOString(),
      },
      {
        id: 'TEC-004',
        nome: 'Mariana Costa',
        telefone: '(11) 98765-9012',
        email: 'mariana.costa@provedor.com',
        status: 'ocupado',
        localizacao_atual: {
          latitude: -23.5500,
          longitude: -46.6400,
          endereco: 'Rua Vergueiro, 1200',
          bairro: 'Parque Alvorada',
          cidade: 'São Paulo',
        },
        especialidades: ['Suporte Técnico', 'Configuração', 'Wi-Fi'],
        ordens_servico_ativas: [
          {
            id: 'OS-1002',
            cliente_id: 'CLI-5002',
            cliente_nome: 'Maria Santos',
            endereco: 'Av. Liberdade, 500',
            bairro: 'Parque Alvorada',
            localizacao: {
              latitude: -23.5505,
              longitude: -46.6405,
              endereco: 'Av. Liberdade, 500',
              bairro: 'Parque Alvorada',
              cidade: 'São Paulo',
            },
            tipo: 'suporte',
            prioridade: 'media',
            status: 'em_andamento',
            descricao: 'Configuração de roteador',
            data_abertura: new Date().toISOString(),
            tempo_estimado_minutos: 30,
          },
        ],
        ordens_servico_hoje: 4,
        avaliacao_media: 4.6,
        total_avaliacoes: 87,
        ultima_atualizacao: new Date().toISOString(),
      },
      {
        id: 'TEC-005',
        nome: 'Fernando Almeida',
        telefone: '(11) 98765-3456',
        email: 'fernando.almeida@provedor.com',
        status: 'offline',
        especialidades: ['Fibra Óptica', 'Manutenção', 'Instalação'],
        ordens_servico_ativas: [],
        ordens_servico_hoje: 0,
        avaliacao_media: 4.5,
        total_avaliacoes: 45,
        ultima_atualizacao: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    // Aplicar filtros
    let tecnicosFiltrados = tecnicosSimulados;

    if (filtros?.status) {
      tecnicosFiltrados = tecnicosFiltrados.filter(
        (t) => t.status === filtros.status
      );
    }

    if (filtros?.especialidade) {
      tecnicosFiltrados = tecnicosFiltrados.filter((t) =>
        t.especialidades.some((e) =>
          e.toLowerCase().includes(filtros.especialidade!.toLowerCase())
        )
      );
    }

    if (filtros?.busca) {
      const busca = filtros.busca.toLowerCase();
      tecnicosFiltrados = tecnicosFiltrados.filter(
        (t) =>
          t.nome.toLowerCase().includes(busca) ||
          t.email.toLowerCase().includes(busca) ||
          t.telefone.includes(busca)
      );
    }

    return tecnicosFiltrados;
  } catch (error) {
    console.error('Erro ao buscar técnicos:', error);
    return [];
  }
}

// Buscar sugestões de técnicos para uma O.S. baseado em localização
export async function sugerirTecnicosParaOS(
  ordemServico: OrdemServico
): Promise<SugestaoAlocacao[]> {
  try {
    const tecnicos = await buscarTecnicos({ status: 'disponivel' });
    const todosTecnicos = await buscarTecnicos(); // Incluir ocupados também

    const sugestoes: SugestaoAlocacao[] = [];

    for (const tecnico of todosTecnicos) {
      if (!tecnico.localizacao_atual) continue;

      // Calcular distância
      const distancia = calcularDistancia(
        tecnico.localizacao_atual,
        ordemServico.localizacao
      );

      // Verificar se tem O.S. próximas no mesmo bairro
      const ordensProximas = tecnico.ordens_servico_ativas.filter(
        (os) =>
          os.bairro.toLowerCase() === ordemServico.bairro.toLowerCase() ||
          calcularDistancia(os.localizacao, ordemServico.localizacao) < 2 // Menos de 2km
      ).length;

      // Calcular score (0-100)
      let score = 100;

      // Penalizar por distância (máx -40 pontos)
      score -= Math.min(distancia * 5, 40);

      // Bonificar por O.S. próximas (+20 pontos por O.S.)
      score += ordensProximas * 20;

      // Bonificar se está no mesmo bairro (+30 pontos)
      if (
        tecnico.localizacao_atual.bairro.toLowerCase() ===
        ordemServico.bairro.toLowerCase()
      ) {
        score += 30;
      }

      // Penalizar se está ocupado (-20 pontos)
      if (tecnico.status === 'ocupado') {
        score -= 20;
      }

      // Penalizar se está offline (-100 pontos)
      if (tecnico.status === 'offline') {
        score -= 100;
      }

      // Bonificar por avaliação (+10 pontos se > 4.5)
      if (tecnico.avaliacao_media > 4.5) {
        score += 10;
      }

      // Garantir que score está entre 0-100
      score = Math.max(0, Math.min(100, score));

      // Determinar disponibilidade
      let disponibilidade: 'imediata' | 'em_breve' | 'ocupado' = 'ocupado';
      if (tecnico.status === 'disponivel') {
        disponibilidade = 'imediata';
      } else if (tecnico.status === 'ocupado' && ordensProximas > 0) {
        disponibilidade = 'em_breve';
      }

      // Gerar motivo
      let motivo = '';
      if (ordensProximas > 0) {
        motivo = `Já está atendendo ${ordensProximas} O.S. no bairro ${ordemServico.bairro}`;
      } else if (
        tecnico.localizacao_atual.bairro.toLowerCase() ===
        ordemServico.bairro.toLowerCase()
      ) {
        motivo = `Está atualmente no bairro ${ordemServico.bairro}`;
      } else if (distancia < 5) {
        motivo = `Está próximo (${distancia.toFixed(1)}km de distância)`;
      } else {
        motivo = `Disponível na região (${distancia.toFixed(1)}km de distância)`;
      }

      sugestoes.push({
        tecnico_id: tecnico.id,
        tecnico_nome: tecnico.nome,
        score,
        motivo,
        distancia_km: parseFloat(distancia.toFixed(1)),
        tempo_estimado_minutos: Math.ceil(distancia * 3), // ~3 min por km
        ordens_proximas: ordensProximas,
        disponibilidade,
      });
    }

    // Ordenar por score (maior primeiro)
    return sugestoes.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Erro ao sugerir técnicos:', error);
    return [];
  }
}

// Alocar O.S. para técnico (com IA de otimização de rota)
export async function alocarOSParaTecnico(
  ordemServicoId: string,
  tecnicoId: string,
  automatico: boolean = false
): Promise<ResultadoAlocacao> {
  try {
    // Simulação de delay de API
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Aqui você faria a alocação real no IXC
    // Por enquanto, retornando resultado simulado

    const tecnicos = await buscarTecnicos();
    const tecnico = tecnicos.find((t) => t.id === tecnicoId);

    if (!tecnico) {
      return {
        sucesso: false,
        mensagem: 'Técnico não encontrado',
      };
    }

    // Simular O.S. sendo alocada
    const novaOS: OrdemServico = {
      id: ordemServicoId,
      cliente_id: 'CLI-NEW',
      cliente_nome: 'Cliente Novo',
      endereco: 'Rua Nova, 100',
      bairro: 'Parque Alvorada',
      localizacao: {
        latitude: -23.5495,
        longitude: -46.6395,
        endereco: 'Rua Nova, 100',
        bairro: 'Parque Alvorada',
        cidade: 'São Paulo',
      },
      tipo: 'reparo',
      prioridade: 'alta',
      status: 'em_andamento',
      descricao: 'Problema de conexão',
      data_abertura: new Date().toISOString(),
      tempo_estimado_minutos: 60,
    };

    // Calcular rota otimizada
    const ordensAtualizadas = [...tecnico.ordens_servico_ativas, novaOS];
    const distanciaTotal = ordensAtualizadas.reduce((acc, os, idx) => {
      if (idx === 0 && tecnico.localizacao_atual) {
        return acc + calcularDistancia(tecnico.localizacao_atual, os.localizacao);
      } else if (idx > 0) {
        return (
          acc +
          calcularDistancia(
            ordensAtualizadas[idx - 1].localizacao,
            os.localizacao
          )
        );
      }
      return acc;
    }, 0);

    const tempoTotal = ordensAtualizadas.reduce(
      (acc, os) => acc + os.tempo_estimado_minutos,
      Math.ceil(distanciaTotal * 3)
    );

    return {
      sucesso: true,
      mensagem: automatico
        ? `O.S. alocada automaticamente pela IA para ${tecnico.nome}`
        : `O.S. alocada com sucesso para ${tecnico.nome}`,
      tecnico_alocado: tecnico,
      ordem_servico: novaOS,
      rota_otimizada: {
        ordens: ordensAtualizadas,
        distancia_total_km: parseFloat(distanciaTotal.toFixed(1)),
        tempo_total_minutos: tempoTotal,
      },
    };
  } catch (error) {
    console.error('Erro ao alocar O.S.:', error);
    return {
      sucesso: false,
      mensagem: 'Erro ao alocar O.S. Tente novamente.',
    };
  }
}

// Alocar O.S. automaticamente (IA escolhe o melhor técnico)
export async function alocarOSAutomaticamente(
  ordemServico: OrdemServico
): Promise<ResultadoAlocacao> {
  try {
    // Buscar sugestões
    const sugestoes = await sugerirTecnicosParaOS(ordemServico);

    if (sugestoes.length === 0) {
      return {
        sucesso: false,
        mensagem: 'Nenhum técnico disponível no momento',
      };
    }

    // IA escolhe o técnico com maior score
    const melhorSugestao = sugestoes[0];

    // Alocar para o melhor técnico
    return await alocarOSParaTecnico(
      ordemServico.id,
      melhorSugestao.tecnico_id,
      true
    );
  } catch (error) {
    console.error('Erro ao alocar O.S. automaticamente:', error);
    return {
      sucesso: false,
      mensagem: 'Erro ao alocar O.S. automaticamente',
    };
  }
}

// Buscar coordenadas de um endereço (integração com API de mapas)
export async function buscarCoordenadas(
  endereco: string
): Promise<Localizacao | null> {
  try {
    // Aqui você integraria com Google Maps API, OpenStreetMap, etc.
    // Por enquanto, retornando coordenadas simuladas

    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simulação - substituir por API real
    return {
      latitude: -23.5505 + (Math.random() - 0.5) * 0.1,
      longitude: -46.6333 + (Math.random() - 0.5) * 0.1,
      endereco: endereco,
      bairro: 'Parque Alvorada', // Extrair do endereço ou API
      cidade: 'São Paulo',
    };
  } catch (error) {
    console.error('Erro ao buscar coordenadas:', error);
    return null;
  }
}
