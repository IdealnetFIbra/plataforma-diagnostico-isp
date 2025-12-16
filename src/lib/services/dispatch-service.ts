// Serviço de despacho automático de técnicos
import { supabase } from '@/lib/supabase';
import { ixcService } from './ixc-service';

interface Tecnico {
  id: string;
  nome: string;
  latitude: number | null;
  longitude: number | null;
  fila_atual: number;
  habilidades: string[] | null;
  territorio: string | null;
  status: string;
}

interface Cliente {
  id: string;
  latitude: number | null;
  longitude: number | null;
  bairro: string;
}

interface ScoreTecnico {
  tecnico: Tecnico;
  score: number;
  distancia: number;
  detalhes: {
    score_distancia: number;
    score_fila: number;
    score_habilidade: number;
    score_sla: number;
  };
}

interface DespachoResult {
  tecnico_id: string;
  tecnico_nome: string;
  previsao_chegada: string;
}

export class DispatchService {
  // Calcular distância entre dois pontos (Haversine)
  private calcularDistancia(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  // Calcular score de um técnico para uma O.S.
  private async calcularScore(
    tecnico: Tecnico,
    cliente: Cliente,
    prioridade: string,
    slaExpiraEm: string
  ): Promise<ScoreTecnico> {
    // Buscar regras de despacho
    const { data: regra } = await supabase
      .from('regras_despacho')
      .select('*')
      .eq('ativo', true)
      .single();

    const pesos = regra || {
      peso_distancia: 0.4,
      peso_fila: 0.3,
      peso_habilidade: 0.2,
      peso_sla: 0.1,
    };

    // 1. Score de distância (0-100, quanto menor a distância, maior o score)
    let scoreDistancia = 0;
    let distancia = 999;

    if (tecnico.latitude && tecnico.longitude && cliente.latitude && cliente.longitude) {
      distancia = this.calcularDistancia(
        tecnico.latitude,
        tecnico.longitude,
        cliente.latitude,
        cliente.longitude
      );
      
      // Normalizar: 0km = 100, 50km = 0
      scoreDistancia = Math.max(0, 100 - (distancia / 50) * 100);
    } else {
      // Se não tem coordenadas, usar território/bairro
      const { data: territorio } = await supabase
        .from('territorios')
        .select('bairros')
        .eq('id', tecnico.territorio || '')
        .single();

      if (territorio?.bairros?.includes(cliente.bairro)) {
        scoreDistancia = 80; // Mesmo território
      } else {
        scoreDistancia = 30; // Território diferente
      }
    }

    // 2. Score de fila (0-100, quanto menor a fila, maior o score)
    const scoreFila = Math.max(0, 100 - (tecnico.fila_atual * 20));

    // 3. Score de habilidade (0-100)
    let scoreHabilidade = 50; // Score padrão
    // Placeholder: aqui entraria lógica de match de habilidades necessárias
    // Por exemplo: se O.S. requer fibra óptica e técnico tem essa habilidade

    // 4. Score de SLA (0-100, quanto mais urgente, mais peso)
    const horasRestantes = (new Date(slaExpiraEm).getTime() - Date.now()) / (1000 * 60 * 60);
    const scoreSLA = horasRestantes < 2 ? 100 : horasRestantes < 4 ? 80 : 50;

    // Calcular score final ponderado
    const scoreFinal =
      scoreDistancia * pesos.peso_distancia +
      scoreFila * pesos.peso_fila +
      scoreHabilidade * pesos.peso_habilidade +
      scoreSLA * pesos.peso_sla;

    return {
      tecnico,
      score: scoreFinal,
      distancia,
      detalhes: {
        score_distancia: scoreDistancia,
        score_fila: scoreFila,
        score_habilidade: scoreHabilidade,
        score_sla: scoreSLA,
      },
    };
  }

  // Encontrar melhor técnico para uma O.S.
  async encontrarMelhorTecnico(osId: string): Promise<ScoreTecnico | null> {
    try {
      // Buscar dados da O.S.
      const { data: os, error: osError } = await supabase
        .from('ordens_servico')
        .select('*, clientes(*)')
        .eq('id', osId)
        .single();

      if (osError || !os) {
        console.error('O.S. não encontrada:', osError);
        return null;
      }

      // Buscar técnicos disponíveis
      const { data: tecnicos, error: tecnicosError } = await supabase
        .from('tecnicos')
        .select('*')
        .in('status', ['available', 'busy']);

      if (tecnicosError || !tecnicos || tecnicos.length === 0) {
        console.error('Nenhum técnico disponível:', tecnicosError);
        return null;
      }

      // Buscar regra de despacho para verificar limite de fila
      const { data: regra } = await supabase
        .from('regras_despacho')
        .select('limite_fila_tecnico')
        .eq('ativo', true)
        .single();

      const limiteFila = regra?.limite_fila_tecnico || 5;

      // Filtrar técnicos que não ultrapassaram o limite de fila
      const tecnicosElegiveis = tecnicos.filter(t => t.fila_atual < limiteFila);

      if (tecnicosElegiveis.length === 0) {
        console.log('Todos os técnicos estão com fila cheia');
        return null;
      }

      // Calcular score para cada técnico
      const scores: ScoreTecnico[] = [];
      for (const tecnico of tecnicosElegiveis) {
        const score = await this.calcularScore(
          tecnico,
          os.clientes,
          os.prioridade,
          os.sla_expira_em
        );
        scores.push(score);
      }

      // Ordenar por score (maior primeiro)
      scores.sort((a, b) => b.score - a.score);

      return scores[0] || null;
    } catch (error) {
      console.error('Erro ao encontrar melhor técnico:', error);
      return null;
    }
  }

  // Atribuir O.S. a um técnico
  async atribuirOS(osId: string, tecnicoId: string): Promise<boolean> {
    try {
      // Buscar dados da O.S. e técnico
      const { data: os } = await supabase
        .from('ordens_servico')
        .select('*, diagnosticos(*)')
        .eq('id', osId)
        .single();

      const { data: tecnico } = await supabase
        .from('tecnicos')
        .select('*')
        .eq('id', tecnicoId)
        .single();

      if (!os || !tecnico) {
        console.error('O.S. ou técnico não encontrado');
        return false;
      }

      // Atualizar O.S.
      await supabase
        .from('ordens_servico')
        .update({
          tecnico_id: tecnicoId,
          status: 'dispatched',
        })
        .eq('id', osId);

      // Incrementar fila do técnico
      await supabase
        .from('tecnicos')
        .update({
          fila_atual: tecnico.fila_atual + 1,
          status: 'busy',
        })
        .eq('id', tecnicoId);

      // Adicionar observação
      const diagnostico = os.diagnosticos?.[0];
      const observacao = diagnostico
        ? `[DESPACHO AUTOMÁTICO] Técnico ${tecnico.nome} atribuído.\n\nDIAGNÓSTICO PRÉVIO:\n${diagnostico.laudo}`
        : `[DESPACHO AUTOMÁTICO] Técnico ${tecnico.nome} atribuído.`;

      await supabase.from('observacoes').insert({
        os_id: osId,
        texto: observacao,
        autor: 'Sistema Despacho',
        tipo: 'automatico',
      });

      // Atualizar no IXC
      if (os.ixc_id) {
        await ixcService.atribuirTecnico(os.ixc_id, tecnicoId, tecnico.nome);
        await ixcService.adicionarObservacao(os.ixc_id, observacao);
      }

      // Log de auditoria
      await supabase.from('logs_auditoria').insert({
        usuario: 'sistema_despacho',
        acao: 'atribuir_tecnico',
        entidade: 'ordem_servico',
        entidade_id: osId,
        detalhes: {
          tecnico_id: tecnicoId,
          tecnico_nome: tecnico.nome,
        },
      });

      return true;
    } catch (error) {
      console.error('Erro ao atribuir O.S.:', error);
      return false;
    }
  }

  // Despachar automaticamente uma O.S. específica
  async despacharAutomatico(osId: string): Promise<DespachoResult | null> {
    try {
      const melhorTecnico = await this.encontrarMelhorTecnico(osId);

      if (!melhorTecnico) {
        console.log('Nenhum técnico disponível para despacho');
        return null;
      }

      const sucesso = await this.atribuirOS(osId, melhorTecnico.tecnico.id);

      if (!sucesso) {
        return null;
      }

      // Calcular previsão de chegada (baseado na distância e fila)
      const tempoDeslocamento = melhorTecnico.distancia * 3; // 3 minutos por km (estimativa)
      const tempoFila = melhorTecnico.tecnico.fila_atual * 30; // 30 minutos por O.S. na fila
      const previsaoMinutos = tempoDeslocamento + tempoFila;
      
      const previsaoChegada = new Date(Date.now() + previsaoMinutos * 60 * 1000);

      return {
        tecnico_id: melhorTecnico.tecnico.id,
        tecnico_nome: melhorTecnico.tecnico.nome,
        previsao_chegada: previsaoChegada.toISOString(),
      };
    } catch (error) {
      console.error('Erro ao despachar automaticamente:', error);
      return null;
    }
  }

  // Processar despacho automático para O.S. pendentes
  async processarDespachoAutomatico(): Promise<number> {
    try {
      // Buscar O.S. que precisam de técnico
      const { data: ordensParaDespachar } = await supabase
        .from('ordens_servico')
        .select('id')
        .eq('status', 'dispatched')
        .is('tecnico_id', null)
        .order('prioridade', { ascending: false })
        .order('data_abertura', { ascending: true })
        .limit(10);

      if (!ordensParaDespachar || ordensParaDespachar.length === 0) {
        return 0;
      }

      let despachadas = 0;

      for (const os of ordensParaDespachar) {
        const resultado = await this.despacharAutomatico(os.id);
        if (resultado) {
          despachadas++;
          console.log(
            `O.S. ${os.id} despachada para ${resultado.tecnico_nome}`
          );
        }
      }

      return despachadas;
    } catch (error) {
      console.error('Erro ao processar despacho automático:', error);
      return 0;
    }
  }

  // Roteirização em lote (para modo "lote")
  async roteirizarLote(tecnicoId: string): Promise<string[]> {
    try {
      // Buscar O.S. atribuídas ao técnico
      const { data: ordensAtribuidas } = await supabase
        .from('ordens_servico')
        .select('id, clientes(latitude, longitude, endereco)')
        .eq('tecnico_id', tecnicoId)
        .eq('status', 'dispatched')
        .order('prioridade', { ascending: false });

      if (!ordensAtribuidas || ordensAtribuidas.length === 0) {
        return [];
      }

      // Buscar localização do técnico
      const { data: tecnico } = await supabase
        .from('tecnicos')
        .select('latitude, longitude')
        .eq('id', tecnicoId)
        .single();

      if (!tecnico || !tecnico.latitude || !tecnico.longitude) {
        return ordensAtribuidas.map(o => o.id);
      }

      // Algoritmo simples de vizinho mais próximo
      const rota: string[] = [];
      let posicaoAtual = { lat: tecnico.latitude, lng: tecnico.longitude };
      const ordensRestantes = [...ordensAtribuidas];

      while (ordensRestantes.length > 0) {
        let maisProximo = 0;
        let menorDistancia = Infinity;

        for (let i = 0; i < ordensRestantes.length; i++) {
          const ordem = ordensRestantes[i];
          if (ordem.clientes?.latitude && ordem.clientes?.longitude) {
            const distancia = this.calcularDistancia(
              posicaoAtual.lat,
              posicaoAtual.lng,
              ordem.clientes.latitude,
              ordem.clientes.longitude
            );

            if (distancia < menorDistancia) {
              menorDistancia = distancia;
              maisProximo = i;
            }
          }
        }

        const proximaOrdem = ordensRestantes.splice(maisProximo, 1)[0];
        rota.push(proximaOrdem.id);

        if (proximaOrdem.clientes?.latitude && proximaOrdem.clientes?.longitude) {
          posicaoAtual = {
            lat: proximaOrdem.clientes.latitude,
            lng: proximaOrdem.clientes.longitude,
          };
        }
      }

      return rota;
    } catch (error) {
      console.error('Erro ao roteirizar lote:', error);
      return [];
    }
  }
}

export const dispatchService = new DispatchService();
