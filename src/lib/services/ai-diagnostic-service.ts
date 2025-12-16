// Serviço de diagnóstico automático com IA
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';
import { ixcService } from './ixc-service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface TesteResultado {
  nome: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  resultado: string;
  timestamp: Date;
}

interface DiagnosticoCompleto {
  problema_classificado: string;
  decisao: 'resolver_remoto' | 'despachar_tecnico' | 'orientar_cliente';
  laudo: string;
  testes: TesteResultado[];
  ia_confidence: number;
}

export class AIDiagnosticService {
  // Classificar problema usando IA
  async classificarProblema(problemaRelatado: string): Promise<{
    tipo: string;
    confianca: number;
    palavras_chave: string[];
  }> {
    try {
      const prompt = `Você é um especialista em diagnóstico de problemas de internet/conexão ISP.

Analise o seguinte relato de problema e classifique em uma das categorias:
- no_internet (sem internet, não conecta, offline)
- slow (lento, devagar, travando)
- intermittent (cai, instável, oscilando, cai toda hora)
- wifi (problema Wi-Fi, sinal fraco, não conecta no Wi-Fi)
- auth (problema de autenticação, senha, login)
- incident (problema em massa, região toda sem internet)

Relato do cliente: "${problemaRelatado}"

Responda APENAS em formato JSON:
{
  "tipo": "categoria",
  "confianca": 0.95,
  "palavras_chave": ["palavra1", "palavra2"],
  "explicacao": "breve explicação"
}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const resultado = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        tipo: resultado.tipo || 'no_internet',
        confianca: resultado.confianca || 0.5,
        palavras_chave: resultado.palavras_chave || [],
      };
    } catch (error) {
      console.error('Erro ao classificar problema:', error);
      return {
        tipo: 'no_internet',
        confianca: 0.5,
        palavras_chave: [],
      };
    }
  }

  // Executar testes automáticos de conexão
  async executarTestes(clienteId: string, osId: string): Promise<TesteResultado[]> {
    const testes: TesteResultado[] = [];

    // Teste 1: Status de conexão
    try {
      const statusConexao = await ixcService.verificarStatusConexao(clienteId);
      testes.push({
        nome: 'Status de Conexão',
        status: statusConexao.online ? 'success' : 'error',
        resultado: statusConexao.online 
          ? `Cliente ONLINE - IP: ${statusConexao.ip || 'N/A'}` 
          : 'Cliente OFFLINE',
        timestamp: new Date(),
      });
    } catch (error) {
      testes.push({
        nome: 'Status de Conexão',
        status: 'error',
        resultado: 'Erro ao verificar status',
        timestamp: new Date(),
      });
    }

    // Teste 2: Verificar incidentes na região
    try {
      const { data: osRegiao } = await supabase
        .from('ordens_servico')
        .select('id, cliente_id, clientes(bairro)')
        .eq('status', 'pending')
        .gte('data_abertura', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString());

      const { data: clienteAtual } = await supabase
        .from('clientes')
        .select('bairro')
        .eq('id', clienteId)
        .single();

      const osMesmoBairro = osRegiao?.filter(
        (os: any) => os.clientes?.bairro === clienteAtual?.bairro
      ) || [];

      testes.push({
        nome: 'Incidente Regional',
        status: osMesmoBairro.length > 3 ? 'warning' : 'success',
        resultado: osMesmoBairro.length > 3
          ? `ALERTA: ${osMesmoBairro.length} O.S. abertas no mesmo bairro nas últimas 2h`
          : `Sem incidentes na região (${osMesmoBairro.length} O.S. no bairro)`,
        timestamp: new Date(),
      });
    } catch (error) {
      testes.push({
        nome: 'Incidente Regional',
        status: 'error',
        resultado: 'Erro ao verificar incidentes',
        timestamp: new Date(),
      });
    }

    // Teste 3: Histórico de instabilidade
    try {
      const { data: historicoOS } = await supabase
        .from('ordens_servico')
        .select('id, status, data_abertura')
        .eq('cliente_id', clienteId)
        .gte('data_abertura', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('data_abertura', { ascending: false });

      const osRecorrentes = historicoOS?.length || 0;

      testes.push({
        nome: 'Histórico de Instabilidade',
        status: osRecorrentes > 2 ? 'warning' : 'success',
        resultado: osRecorrentes > 2
          ? `ATENÇÃO: ${osRecorrentes} O.S. nos últimos 7 dias (cliente recorrente)`
          : `Histórico normal (${osRecorrentes} O.S. nos últimos 7 dias)`,
        timestamp: new Date(),
      });
    } catch (error) {
      testes.push({
        nome: 'Histórico de Instabilidade',
        status: 'error',
        resultado: 'Erro ao verificar histórico',
        timestamp: new Date(),
      });
    }

    // Teste 4: Simulação de ping/latência (placeholder - requer integração real)
    testes.push({
      nome: 'Ping/Latência',
      status: 'pending',
      resultado: 'Teste de ping não disponível (requer integração com equipamento)',
      timestamp: new Date(),
    });

    return testes;
  }

  // Tomar decisão baseada nos testes
  async tomarDecisao(
    testes: TesteResultado[],
    problemaClassificado: string,
    problemaRelatado: string
  ): Promise<DiagnosticoCompleto> {
    const testesComErro = testes.filter(t => t.status === 'error').length;
    const testesComWarning = testes.filter(t => t.status === 'warning').length;
    const clienteOnline = testes.find(t => t.nome === 'Status de Conexão')?.status === 'success';
    const incidenteRegional = testes.find(t => t.nome === 'Incidente Regional')?.status === 'warning';

    // Usar IA para gerar laudo e decisão
    const prompt = `Você é um especialista técnico de NOC de provedor de internet.

Analise os seguintes dados e tome uma decisão:

PROBLEMA RELATADO: "${problemaRelatado}"
PROBLEMA CLASSIFICADO: ${problemaClassificado}

RESULTADOS DOS TESTES:
${testes.map(t => `- ${t.nome}: ${t.status.toUpperCase()} - ${t.resultado}`).join('\n')}

Com base nisso, decida:
1. "resolver_remoto" - se o problema pode ser resolvido remotamente (ex: cliente online, problema simples)
2. "despachar_tecnico" - se é necessário enviar técnico (ex: cliente offline, problema físico)
3. "orientar_cliente" - se é problema no lado do cliente (ex: Wi-Fi, equipamento do cliente)

Gere um laudo técnico profissional e objetivo.

Responda APENAS em formato JSON:
{
  "decisao": "resolver_remoto|despachar_tecnico|orientar_cliente",
  "laudo": "Laudo técnico detalhado",
  "confianca": 0.95,
  "acoes_sugeridas": ["ação 1", "ação 2"]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const resultado = JSON.parse(response.choices[0].message.content || '{}');

      return {
        problema_classificado: problemaClassificado,
        decisao: resultado.decisao || 'despachar_tecnico',
        laudo: resultado.laudo || 'Laudo não gerado',
        testes,
        ia_confidence: resultado.confianca || 0.5,
      };
    } catch (error) {
      console.error('Erro ao gerar decisão:', error);

      // Fallback: decisão baseada em regras simples
      let decisao: 'resolver_remoto' | 'despachar_tecnico' | 'orientar_cliente' = 'despachar_tecnico';
      let laudo = 'Erro ao gerar laudo automático. ';

      if (clienteOnline && !incidenteRegional) {
        decisao = 'orientar_cliente';
        laudo += 'Cliente está online. Problema pode ser no equipamento do cliente (Wi-Fi, roteador).';
      } else if (incidenteRegional) {
        decisao = 'despachar_tecnico';
        laudo += 'Incidente regional detectado. Múltiplos clientes afetados na mesma região.';
      } else if (!clienteOnline) {
        decisao = 'despachar_tecnico';
        laudo += 'Cliente offline. Necessário verificação técnica presencial.';
      }

      return {
        problema_classificado: problemaClassificado,
        decisao,
        laudo,
        testes,
        ia_confidence: 0.6,
      };
    }
  }

  // Executar diagnóstico completo
  async diagnosticar(osId: string): Promise<DiagnosticoCompleto | null> {
    try {
      // Buscar dados da O.S.
      const { data: os, error } = await supabase
        .from('ordens_servico')
        .select('*, clientes(*)')
        .eq('id', osId)
        .single();

      if (error || !os) {
        console.error('O.S. não encontrada:', error);
        return null;
      }

      // Atualizar status para "diagnosing"
      await supabase
        .from('ordens_servico')
        .update({ status: 'diagnosing' })
        .eq('id', osId);

      // 1. Classificar problema
      const classificacao = await this.classificarProblema(os.problema_relatado);

      // Atualizar tipo do problema
      await supabase
        .from('ordens_servico')
        .update({ problema_tipo: classificacao.tipo })
        .eq('id', osId);

      // 2. Executar testes
      const testes = await this.executarTestes(os.cliente_id, osId);

      // 3. Tomar decisão
      const diagnostico = await this.tomarDecisao(
        testes,
        classificacao.tipo,
        os.problema_relatado
      );

      // 4. Salvar diagnóstico no banco
      await supabase.from('diagnosticos').insert({
        os_id: osId,
        problema_classificado: diagnostico.problema_classificado,
        decisao: diagnostico.decisao,
        laudo: diagnostico.laudo,
        testes: diagnostico.testes,
        ia_confidence: diagnostico.ia_confidence,
      });

      // 5. Adicionar observação automática
      await supabase.from('observacoes').insert({
        os_id: osId,
        texto: `[IA] ${diagnostico.laudo}`,
        autor: 'Sistema IA',
        tipo: 'ia',
      });

      // 6. Atualizar status da O.S. baseado na decisão
      let novoStatus: string = 'pending';
      if (diagnostico.decisao === 'resolver_remoto') {
        novoStatus = 'resolved_remote';
        
        // Tentar resolver remotamente (placeholder)
        await this.tentarResolverRemoto(osId, os.ixc_id);
      } else if (diagnostico.decisao === 'despachar_tecnico') {
        novoStatus = 'dispatched';
        // O sistema de despacho vai pegar essa O.S.
      }

      await supabase
        .from('ordens_servico')
        .update({ status: novoStatus })
        .eq('id', osId);

      // 7. Atualizar no IXC
      if (os.ixc_id) {
        await ixcService.adicionarObservacao(os.ixc_id, diagnostico.laudo);
      }

      // Log de auditoria
      await supabase.from('logs_auditoria').insert({
        usuario: 'sistema_ia',
        acao: 'diagnostico_automatico',
        entidade: 'ordem_servico',
        entidade_id: osId,
        detalhes: {
          decisao: diagnostico.decisao,
          confianca: diagnostico.ia_confidence,
          problema_classificado: diagnostico.problema_classificado,
        },
      });

      return diagnostico;
    } catch (error) {
      console.error('Erro ao diagnosticar:', error);
      return null;
    }
  }

  // Tentar resolver problema remotamente
  private async tentarResolverRemoto(osId: string, ixcId: string | null): Promise<boolean> {
    try {
      // Placeholder: aqui entraria integração com equipamentos (ONU/OLT)
      // Por exemplo: reboot de ONU, reprocessar conexão, etc.
      
      // Simular ação remota
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Adicionar observação
      await supabase.from('observacoes').insert({
        os_id: osId,
        texto: '[SISTEMA] Tentativa de resolução remota executada. Aguardando validação.',
        autor: 'Sistema',
        tipo: 'automatico',
      });

      // Atualizar no IXC
      if (ixcId) {
        await ixcService.atualizarStatusOS(
          ixcId,
          'R', // R = Resolvido
          'Resolvido automaticamente pelo sistema AUTONOC'
        );
      }

      return true;
    } catch (error) {
      console.error('Erro ao resolver remotamente:', error);
      return false;
    }
  }

  // Validar se problema foi resolvido
  async validarResolucao(osId: string): Promise<boolean> {
    try {
      const { data: os } = await supabase
        .from('ordens_servico')
        .select('*, clientes(*)')
        .eq('id', osId)
        .single();

      if (!os) return false;

      // Verificar se cliente voltou online
      const statusConexao = await ixcService.verificarStatusConexao(os.cliente_id);

      if (statusConexao.online) {
        // Marcar como concluído
        await supabase
          .from('ordens_servico')
          .update({ 
            status: 'completed',
            data_conclusao: new Date().toISOString(),
          })
          .eq('id', osId);

        await supabase.from('observacoes').insert({
          os_id: osId,
          texto: '[SISTEMA] Validação automática: Cliente voltou online. O.S. concluída.',
          autor: 'Sistema',
          tipo: 'automatico',
        });

        // Atualizar no IXC
        if (os.ixc_id) {
          await ixcService.atualizarStatusOS(os.ixc_id, 'F', 'Concluído - Cliente online');
        }

        return true;
      } else {
        // Cliente ainda offline - despachar técnico
        await supabase
          .from('ordens_servico')
          .update({ status: 'dispatched' })
          .eq('id', osId);

        await supabase.from('observacoes').insert({
          os_id: osId,
          texto: '[SISTEMA] Validação automática: Cliente ainda offline. Despachando técnico.',
          autor: 'Sistema',
          tipo: 'automatico',
        });

        return false;
      }
    } catch (error) {
      console.error('Erro ao validar resolução:', error);
      return false;
    }
  }
}

export const aiDiagnosticService = new AIDiagnosticService();
