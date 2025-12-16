// Server Actions para operações do AUTONOC
'use server';

import { supabase } from '@/lib/supabase';
import { ixcService } from '@/lib/services/ixc-service';
import { aiDiagnosticService } from '@/lib/services/ai-diagnostic-service';
import { dispatchService } from '@/lib/services/dispatch-service';
import { revalidatePath } from 'next/cache';

// Buscar todas as O.S. com filtros
export async function buscarOrdens(filtros?: {
  status?: string;
  prioridade?: string;
  data_inicio?: string;
  data_fim?: string;
}) {
  try {
    let query = supabase
      .from('ordens_servico')
      .select(`
        *,
        clientes(*),
        tecnicos(*),
        diagnosticos(*)
      `)
      .order('data_abertura', { ascending: false });

    if (filtros?.status) {
      query = query.eq('status', filtros.status);
    }

    if (filtros?.prioridade) {
      query = query.eq('prioridade', filtros.prioridade);
    }

    if (filtros?.data_inicio) {
      query = query.gte('data_abertura', filtros.data_inicio);
    }

    if (filtros?.data_fim) {
      query = query.lte('data_abertura', filtros.data_fim);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { sucesso: true, dados: data };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
}

// Buscar métricas do dashboard
export async function buscarMetricas() {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Total de O.S. hoje
    const { count: totalOS } = await supabase
      .from('ordens_servico')
      .select('*', { count: 'exact', head: true })
      .gte('data_abertura', hoje.toISOString());

    // Resolvidas remotamente hoje
    const { count: resolvidasRemoto } = await supabase
      .from('ordens_servico')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved_remote')
      .gte('data_abertura', hoje.toISOString());

    // Concluídas hoje
    const { count: concluidasHoje } = await supabase
      .from('ordens_servico')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('data_conclusao', hoje.toISOString());

    // Tempo médio de solução (últimos 7 dias)
    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { data: osConcluidas } = await supabase
      .from('ordens_servico')
      .select('data_abertura, data_conclusao')
      .eq('status', 'completed')
      .gte('data_conclusao', seteDiasAtras.toISOString())
      .not('data_conclusao', 'is', null);

    let tempoMedio = 0;
    if (osConcluidas && osConcluidas.length > 0) {
      const tempos = osConcluidas.map(os => {
        const abertura = new Date(os.data_abertura).getTime();
        const conclusao = new Date(os.data_conclusao!).getTime();
        return (conclusao - abertura) / (1000 * 60); // minutos
      });
      tempoMedio = Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length);
    }

    // SLA cumprido (últimos 7 dias)
    const { data: osComSLA } = await supabase
      .from('ordens_servico')
      .select('data_conclusao, sla_expira_em')
      .eq('status', 'completed')
      .gte('data_conclusao', seteDiasAtras.toISOString())
      .not('data_conclusao', 'is', null)
      .not('sla_expira_em', 'is', null);

    let slaCumprido = 100;
    if (osComSLA && osComSLA.length > 0) {
      const cumpridas = osComSLA.filter(os => {
        return new Date(os.data_conclusao!) <= new Date(os.sla_expira_em!);
      });
      slaCumprido = Math.round((cumpridas.length / osComSLA.length) * 100);
    }

    return {
      sucesso: true,
      dados: {
        total_os: totalOS || 0,
        resolvidas_remoto: resolvidasRemoto || 0,
        concluidas_hoje: concluidasHoje || 0,
        tempo_medio_solucao: tempoMedio,
        sla_cumprido: slaCumprido,
      },
    };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
}

// Processar diagnóstico manual
export async function processarDiagnostico(osId: string) {
  try {
    const diagnostico = await aiDiagnosticService.diagnosticar(osId);
    
    revalidatePath('/');
    
    return { sucesso: true, diagnostico };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
}

// Processar todas as O.S. pendentes
export async function processarTodasPendentes() {
  try {
    const { data: osPendentes } = await supabase
      .from('ordens_servico')
      .select('id')
      .eq('status', 'pending')
      .order('prioridade', { ascending: false })
      .limit(10);

    if (!osPendentes || osPendentes.length === 0) {
      return { sucesso: true, processadas: 0 };
    }

    let processadas = 0;
    for (const os of osPendentes) {
      const diagnostico = await aiDiagnosticService.diagnosticar(os.id);
      if (diagnostico) processadas++;
    }

    revalidatePath('/');

    return { sucesso: true, processadas };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
}

// Despachar O.S. manualmente
export async function despacharOS(osId: string, tecnicoId?: string) {
  try {
    let tecnicoSelecionado = tecnicoId;

    if (!tecnicoSelecionado) {
      // Encontrar melhor técnico automaticamente
      const melhorTecnico = await dispatchService.encontrarMelhorTecnico(osId);
      if (!melhorTecnico) {
        return { sucesso: false, erro: 'Nenhum técnico disponível' };
      }
      tecnicoSelecionado = melhorTecnico.tecnico.id;
    }

    const sucesso = await dispatchService.atribuirOS(osId, tecnicoSelecionado);

    revalidatePath('/');

    return { sucesso };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
}

// Sincronizar com IXC manualmente
export async function sincronizarIXC() {
  try {
    const sincronizadas = await ixcService.sincronizarOrdens();
    
    revalidatePath('/');
    
    return { sucesso: true, sincronizadas };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
}

// Salvar configuração IXC
export async function salvarConfigIXC(config: {
  url_api: string;
  token: string;
  intervalo_sync: number;
}) {
  try {
    // Desativar configurações antigas
    await supabase
      .from('config_ixc')
      .update({ ativo: false })
      .eq('ativo', true);

    // Inserir nova configuração
    const { data, error } = await supabase
      .from('config_ixc')
      .insert({
        url_api: config.url_api,
        token: config.token,
        intervalo_sync: config.intervalo_sync,
        ativo: true,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/');

    return { sucesso: true, config: data };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
}

// Buscar técnicos disponíveis
export async function buscarTecnicos() {
  try {
    const { data, error } = await supabase
      .from('tecnicos')
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;

    return { sucesso: true, dados: data };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
}

// Adicionar observação manual
export async function adicionarObservacao(osId: string, texto: string, autor: string) {
  try {
    const { error } = await supabase
      .from('observacoes')
      .insert({
        os_id: osId,
        texto,
        autor,
        tipo: 'manual',
      });

    if (error) throw error;

    revalidatePath('/');

    return { sucesso: true };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
}

// Atualizar status da O.S.
export async function atualizarStatusOS(osId: string, novoStatus: string) {
  try {
    const { data: os } = await supabase
      .from('ordens_servico')
      .select('ixc_id')
      .eq('id', osId)
      .single();

    // Atualizar no banco local
    const { error } = await supabase
      .from('ordens_servico')
      .update({ 
        status: novoStatus,
        ...(novoStatus === 'completed' && { data_conclusao: new Date().toISOString() })
      })
      .eq('id', osId);

    if (error) throw error;

    // Atualizar no IXC
    if (os?.ixc_id) {
      const statusMap: Record<string, string> = {
        'pending': 'A',
        'diagnosing': 'A',
        'dispatched': 'E',
        'in_progress': 'E',
        'completed': 'F',
        'cancelled': 'C',
      };
      await ixcService.atualizarStatusOS(os.ixc_id, statusMap[novoStatus] || 'A');
    }

    revalidatePath('/');

    return { sucesso: true };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
}
