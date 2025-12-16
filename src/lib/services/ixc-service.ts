// Serviço de integração com IXC Soft
import { supabase } from '@/lib/supabase';

interface IXCConfig {
  url_api: string;
  token: string;
}

interface IXCOrdemServico {
  id: string;
  numero: string;
  cliente_id: string;
  cliente_nome: string;
  endereco: string;
  bairro: string;
  cidade: string;
  telefone: string;
  contrato: string;
  plano: string;
  problema: string;
  status: string;
  data_abertura: string;
  prioridade: string;
}

export class IXCService {
  private config: IXCConfig | null = null;

  async loadConfig(): Promise<void> {
    const { data, error } = await supabase
      .from('config_ixc')
      .select('*')
      .eq('ativo', true)
      .single();

    if (error || !data) {
      throw new Error('Configuração IXC não encontrada');
    }

    this.config = {
      url_api: data.url_api,
      token: data.token,
    };
  }

  private async request(endpoint: string, method: string = 'GET', body?: any) {
    if (!this.config) {
      await this.loadConfig();
    }

    const response = await fetch(`${this.config!.url_api}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config!.token}`,
        'ixcsoft': 'listar',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Erro na API IXC: ${response.statusText}`);
    }

    return response.json();
  }

  // Buscar ordens de serviço abertas
  async buscarOrdensAbertas(): Promise<IXCOrdemServico[]> {
    try {
      const response = await this.request('/webservice/v1/su_oss_chamado', 'POST', {
        qtype: 'su_oss_chamado.status',
        query: 'A', // A = Aberto
        oper: '=',
        page: '1',
        rp: '100',
        sortname: 'su_oss_chamado.data_abertura',
        sortorder: 'desc',
      });

      return response.registros || [];
    } catch (error) {
      console.error('Erro ao buscar ordens IXC:', error);
      return [];
    }
  }

  // Buscar dados do cliente
  async buscarDadosCliente(clienteId: string) {
    try {
      const response = await this.request('/webservice/v1/cliente', 'POST', {
        qtype: 'cliente.id',
        query: clienteId,
        oper: '=',
        page: '1',
        rp: '1',
      });

      return response.registros?.[0] || null;
    } catch (error) {
      console.error('Erro ao buscar cliente IXC:', error);
      return null;
    }
  }

  // Verificar status de conexão do cliente
  async verificarStatusConexao(clienteId: string) {
    try {
      const response = await this.request('/webservice/v1/cliente_contrato', 'POST', {
        qtype: 'cliente_contrato.id_cliente',
        query: clienteId,
        oper: '=',
        page: '1',
        rp: '1',
      });

      const contrato = response.registros?.[0];
      
      if (!contrato) {
        return { online: false, status: 'desconhecido' };
      }

      // Verificar se está online (baseado no status do contrato)
      return {
        online: contrato.status === 'A', // A = Ativo
        status: contrato.status,
        ultima_conexao: contrato.ultima_conexao,
        ip: contrato.ip,
      };
    } catch (error) {
      console.error('Erro ao verificar status conexão:', error);
      return { online: false, status: 'erro' };
    }
  }

  // Atualizar status da O.S. no IXC
  async atualizarStatusOS(ixcId: string, status: string, observacao?: string) {
    try {
      await this.request('/webservice/v1/su_oss_chamado', 'POST', {
        id: ixcId,
        status: status,
        observacao: observacao || '',
      });

      // Log de auditoria
      await supabase.from('logs_auditoria').insert({
        usuario: 'sistema',
        acao: 'atualizar_status_os',
        entidade: 'ordem_servico',
        entidade_id: ixcId,
        detalhes: { status, observacao },
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar status O.S.:', error);
      return false;
    }
  }

  // Atribuir técnico à O.S. no IXC
  async atribuirTecnico(ixcId: string, tecnicoId: string, tecnicoNome: string) {
    try {
      await this.request('/webservice/v1/su_oss_chamado', 'POST', {
        id: ixcId,
        tecnico_id: tecnicoId,
        tecnico_nome: tecnicoNome,
        status: 'E', // E = Em execução
      });

      // Log de auditoria
      await supabase.from('logs_auditoria').insert({
        usuario: 'sistema',
        acao: 'atribuir_tecnico',
        entidade: 'ordem_servico',
        entidade_id: ixcId,
        detalhes: { tecnico_id: tecnicoId, tecnico_nome: tecnicoNome },
      });

      return true;
    } catch (error) {
      console.error('Erro ao atribuir técnico:', error);
      return false;
    }
  }

  // Adicionar observação/laudo à O.S.
  async adicionarObservacao(ixcId: string, observacao: string) {
    try {
      await this.request('/webservice/v1/su_oss_chamado_historico', 'POST', {
        id_os: ixcId,
        descricao: observacao,
        tipo: 'S', // S = Sistema
        data_hora: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Erro ao adicionar observação:', error);
      return false;
    }
  }

  // Agendar O.S.
  async agendarOS(ixcId: string, dataAgendamento: Date) {
    try {
      await this.request('/webservice/v1/su_oss_chamado', 'POST', {
        id: ixcId,
        data_agendamento: dataAgendamento.toISOString(),
        status: 'G', // G = Agendado
      });

      return true;
    } catch (error) {
      console.error('Erro ao agendar O.S.:', error);
      return false;
    }
  }

  // Sincronizar O.S. do IXC para o banco local
  async sincronizarOrdens(): Promise<number> {
    try {
      const ordensIXC = await this.buscarOrdensAbertas();
      let sincronizadas = 0;

      for (const ordem of ordensIXC) {
        // Verificar se cliente existe, senão criar
        let { data: cliente } = await supabase
          .from('clientes')
          .select('id')
          .eq('ixc_id', ordem.cliente_id)
          .single();

        if (!cliente) {
          const { data: novoCliente } = await supabase
            .from('clientes')
            .insert({
              ixc_id: ordem.cliente_id,
              nome: ordem.cliente_nome,
              contrato: ordem.contrato,
              endereco: ordem.endereco,
              bairro: ordem.bairro,
              cidade: ordem.cidade,
              telefone: ordem.telefone,
              plano: ordem.plano,
            })
            .select()
            .single();

          cliente = novoCliente;
        }

        // Verificar se O.S. já existe
        const { data: osExistente } = await supabase
          .from('ordens_servico')
          .select('id')
          .eq('ixc_id', ordem.id)
          .single();

        if (!osExistente) {
          // Criar nova O.S.
          await supabase.from('ordens_servico').insert({
            numero_os: ordem.numero,
            ixc_id: ordem.id,
            cliente_id: cliente!.id,
            status: 'pending',
            prioridade: this.mapearPrioridade(ordem.prioridade),
            problema_relatado: ordem.problema,
            data_abertura: ordem.data_abertura,
            sla_expira_em: this.calcularSLA(ordem.data_abertura, ordem.prioridade),
            origem: 'ixc',
          });

          sincronizadas++;
        }
      }

      // Atualizar última sincronização
      await supabase
        .from('config_ixc')
        .update({ ultima_sync: new Date().toISOString() })
        .eq('ativo', true);

      return sincronizadas;
    } catch (error) {
      console.error('Erro ao sincronizar ordens:', error);
      return 0;
    }
  }

  private mapearPrioridade(prioridadeIXC: string): 'low' | 'medium' | 'high' | 'critical' {
    const map: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'B': 'low',
      'N': 'medium',
      'A': 'high',
      'U': 'critical',
    };
    return map[prioridadeIXC] || 'medium';
  }

  private calcularSLA(dataAbertura: string, prioridade: string): string {
    const data = new Date(dataAbertura);
    const horasSLA: Record<string, number> = {
      'U': 2,  // Urgente: 2 horas
      'A': 4,  // Alta: 4 horas
      'N': 24, // Normal: 24 horas
      'B': 48, // Baixa: 48 horas
    };

    const horas = horasSLA[prioridade] || 24;
    data.setHours(data.getHours() + horas);
    
    return data.toISOString();
  }
}

export const ixcService = new IXCService();
