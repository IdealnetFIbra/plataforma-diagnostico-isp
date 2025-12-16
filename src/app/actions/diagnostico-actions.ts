'use server';

import { supabase } from '@/lib/supabase';
import { ixcService } from '@/lib/services/ixc-service';
import { aiDiagnosticService } from '@/lib/services/ai-diagnostic-service';
import { dispatchService } from '@/lib/services/dispatch-service';

interface BuscarClienteResult {
  success: boolean;
  message?: string;
  cliente?: {
    id: string;
    nome: string;
    cpf_cnpj: string;
    contrato: string;
    endereco: string;
    bairro: string;
    cidade: string;
    telefone: string;
    plano: string;
    tecnologia: string;
  };
  dadosFibra?: {
    olt: string;
    porta_pon: string;
    onu: string;
    status_onu: 'online' | 'offline';
    potencia_rx: string;
    potencia_tx: string;
    alarmes: string[];
  };
}

interface DiagnosticoResult {
  success: boolean;
  message?: string;
  diagnostico?: {
    status: 'success' | 'error';
    decisao: 'resolver_remoto' | 'despachar_tecnico' | 'orientar_cliente';
    laudo: string;
    testes: Array<{
      nome: string;
      status: 'success' | 'warning' | 'error' | 'pending';
      resultado: string;
    }>;
    tecnico_despachado?: {
      nome: string;
      telefone: string;
      previsao: string;
    };
  };
}

export async function buscarClientePorFiltro(
  tipo: 'nome' | 'cpf' | 'codigo' | 'os',
  valor: string
): Promise<BuscarClienteResult> {
  try {
    let query = supabase.from('clientes').select('*');

    switch (tipo) {
      case 'nome':
        query = query.ilike('nome', `%${valor}%`);
        break;
      case 'cpf':
        query = query.eq('cpf_cnpj', valor.replace(/\D/g, ''));
        break;
      case 'codigo':
        query = query.eq('ixc_id', valor);
        break;
      case 'os':
        // Buscar por número de O.S.
        const { data: os } = await supabase
          .from('ordens_servico')
          .select('cliente_id')
          .eq('numero_os', valor)
          .single();
        
        if (os) {
          query = query.eq('id', os.cliente_id);
        } else {
          return { success: false, message: 'O.S. não encontrada' };
        }
        break;
    }

    const { data: cliente, error } = await query.single();

    if (error || !cliente) {
      return { success: false, message: 'Cliente não encontrado' };
    }

    // Buscar dados da fibra (simulado - integração real com OLT/ONU)
    const dadosFibra = await buscarDadosFibra(cliente.ixc_id);

    return {
      success: true,
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        cpf_cnpj: cliente.cpf_cnpj || 'N/A',
        contrato: cliente.contrato,
        endereco: cliente.endereco,
        bairro: cliente.bairro,
        cidade: cliente.cidade,
        telefone: cliente.telefone,
        plano: cliente.plano,
        tecnologia: 'Fibra Óptica',
      },
      dadosFibra,
    };
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return { success: false, message: 'Erro ao buscar cliente' };
  }
}

async function buscarDadosFibra(ixcId: string) {
  try {
    // Simulação de dados da fibra
    // Em produção, isso viria de integração real com OLT/ONU
    const statusConexao = await ixcService.verificarStatusConexao(ixcId);

    return {
      olt: 'OLT-01-CENTRO',
      porta_pon: 'PON 1/1/4',
      onu: `ONU-${ixcId}`,
      status_onu: statusConexao.online ? 'online' as const : 'offline' as const,
      potencia_rx: '-18.5 dBm',
      potencia_tx: '2.3 dBm',
      alarmes: statusConexao.online ? [] : ['LOS - Loss of Signal'],
    };
  } catch (error) {
    console.error('Erro ao buscar dados fibra:', error);
    return {
      olt: 'N/A',
      porta_pon: 'N/A',
      onu: 'N/A',
      status_onu: 'offline' as const,
      potencia_rx: 'N/A',
      potencia_tx: 'N/A',
      alarmes: ['Erro ao obter dados'],
    };
  }
}

export async function executarDiagnosticoCompleto(
  clienteId: string
): Promise<DiagnosticoResult> {
  try {
    // 1. Criar O.S. temporária para diagnóstico
    const { data: os, error: osError } = await supabase
      .from('ordens_servico')
      .insert({
        cliente_id: clienteId,
        numero_os: `DIAG-${Date.now()}`,
        status: 'diagnosing',
        prioridade: 'high',
        problema_relatado: 'Diagnóstico automático solicitado pelo operador',
        origem: 'diagnostico_manual',
      })
      .select()
      .single();

    if (osError || !os) {
      return { success: false, message: 'Erro ao criar O.S. de diagnóstico' };
    }

    // 2. Executar diagnóstico com IA
    const diagnostico = await aiDiagnosticService.diagnosticar(os.id);

    if (!diagnostico) {
      return { success: false, message: 'Erro ao executar diagnóstico' };
    }

    // 3. Se decisão for despachar técnico, fazer despacho automático
    let tecnicoDespachado = undefined;
    if (diagnostico.decisao === 'despachar_tecnico') {
      const despacho = await dispatchService.despacharAutomatico(os.id);
      
      if (despacho) {
        const { data: tecnico } = await supabase
          .from('tecnicos')
          .select('nome, telefone')
          .eq('id', despacho.tecnico_id)
          .single();

        if (tecnico) {
          tecnicoDespachado = {
            nome: tecnico.nome,
            telefone: tecnico.telefone,
            previsao: new Date(despacho.previsao_chegada).toLocaleString('pt-BR'),
          };
        }
      }
    }

    // 4. Retornar resultado
    return {
      success: true,
      diagnostico: {
        status: 'success',
        decisao: diagnostico.decisao,
        laudo: diagnostico.laudo,
        testes: diagnostico.testes.map(t => ({
          nome: t.nome,
          status: t.status,
          resultado: t.resultado,
        })),
        tecnico_despachado: tecnicoDespachado,
      },
    };
  } catch (error) {
    console.error('Erro ao executar diagnóstico completo:', error);
    return { success: false, message: 'Erro ao executar diagnóstico' };
  }
}
