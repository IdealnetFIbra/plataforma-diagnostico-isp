'use server';

import { ixcService } from '@/lib/services/ixc-service';
import type { ClienteDiagnostico, ResultadoDiagnostico, TesteAutomatico } from '@/lib/types-diagnostico';

// Simula busca de cliente (integração real com IXC)
export async function buscarCliente(
  tipo: 'id' | 'nome' | 'cpf' | 'os',
  termo: string
): Promise<ClienteDiagnostico | null> {
  try {
    // Aqui você faria a busca real no IXC
    // Por enquanto, retornando dados simulados para demonstração
    
    // Simulação de delay de API
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Dados simulados - substituir por integração real IXC
    const clienteSimulado: ClienteDiagnostico = {
      id: '12345',
      nome: tipo === 'nome' ? termo : 'João Silva Santos',
      contrato: 'CTR-2024-001',
      endereco: 'Rua das Flores, 123 - Centro',
      bairro: 'Centro',
      cidade: 'São Paulo',
      telefone: '(11) 98765-4321',
      plano: 'Fibra 500MB',
      pop: 'POP-CENTRO-01',
      dados_fibra: {
        olt: 'OLT-SP-01',
        porta_pon: 'PON 1/1/5',
        onu: 'ONU-12345',
        status_onu: Math.random() > 0.3 ? 'online' : 'offline',
        potencia_rx: (Math.random() * -10 - 15).toFixed(2),
        potencia_tx: (Math.random() * 5 + 2).toFixed(2),
        historico_quedas: Math.floor(Math.random() * 5),
        alarmes: Math.random() > 0.7 ? ['LOS - Loss of Signal'] : [],
        ultimo_reboot: '2024-01-15 14:30:00',
      },
      dados_wifi: {
        canal: '6 (2.4GHz)',
        intensidade_sinal: '-65 dBm',
        interferencia: 'Baixa',
        dispositivos_conectados: 8,
        ultimo_reboot: '2024-01-15 14:30:00',
      },
    };

    return clienteSimulado;
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return null;
  }
}

// Executa diagnóstico automático completo
export async function executarDiagnosticoAutomatico(
  clienteId: string
): Promise<ResultadoDiagnostico> {
  try {
    // Simulação de processamento da IA
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 1. Executar testes automáticos
    const testes: TesteAutomatico[] = [
      {
        nome: 'Validação de Conectividade',
        status: 'success',
        resultado: 'Cliente conectado com IPv4 ativo',
        timestamp: new Date(),
      },
      {
        nome: 'Validação de Autenticação',
        status: 'success',
        resultado: 'Autenticação PPPoE válida',
        timestamp: new Date(),
      },
      {
        nome: 'Qualidade do Sinal Fibra',
        status: Math.random() > 0.5 ? 'success' : 'warning',
        resultado: 'Potência RX: -18.5 dBm (Ótimo)',
        timestamp: new Date(),
      },
      {
        nome: 'Análise de Wi-Fi',
        status: 'success',
        resultado: 'Sinal forte, sem interferências críticas',
        timestamp: new Date(),
      },
      {
        nome: 'Verificação de Falha em Massa',
        status: 'success',
        resultado: 'Sem incidentes na região',
        timestamp: new Date(),
      },
    ];

    // 2. Determinar se foi resolvido ou precisa de técnico
    const foiResolvido = Math.random() > 0.4; // 60% de chance de resolver

    if (foiResolvido) {
      // CASO 1: Problema Resolvido
      return {
        status_final: 'resolvido',
        causa_provavel: 'Instabilidade temporária de conexão',
        analise_ia: 'A IA identificou uma instabilidade temporária na conexão PPPoE. Após reprocessamento automático da autenticação e validação dos parâmetros de rede, o cliente foi reconectado com sucesso. Todos os testes de conectividade e qualidade de sinal estão dentro dos padrões esperados.',
        testes_executados: testes,
        acoes_executadas: [
          'Reprocessamento da autenticação PPPoE',
          'Validação de parâmetros de rede',
          'Verificação de qualidade do sinal óptico',
          'Teste de latência e perda de pacotes',
          'Confirmação de IPv4 ativo',
        ],
        mensagem: 'Conexão normalizada com sucesso. Cliente online com IPv4 ativo.',
        proximo_passo: 'Monitorar estabilidade nas próximas 24 horas',
        laudo_completo: 'Diagnóstico automático executado com sucesso. Cliente apresentava instabilidade temporária na conexão PPPoE. Sistema executou reprocessamento automático da autenticação, validou todos os parâmetros de rede e confirmou reconexão bem-sucedida. Qualidade do sinal óptico dentro dos padrões (RX: -18.5 dBm). Sem necessidade de intervenção técnica presencial.',
        timestamp: new Date(),
      };
    } else {
      // CASO 2: Precisa de Técnico
      return {
        status_final: 'despachado',
        causa_provavel: 'Atenuação excessiva no sinal óptico',
        analise_ia: 'A IA detectou atenuação excessiva no sinal óptico (RX: -28.5 dBm), indicando possível problema físico na fibra ou conectores. Tentativas automáticas de correção não foram bem-sucedidas. É necessária intervenção técnica presencial para inspeção física da rede óptica.',
        testes_executados: testes.map(t => ({ ...t, status: t.nome.includes('Fibra') ? 'error' as const : t.status })),
        acoes_executadas: [
          'Tentativa de reprocessamento da conexão',
          'Análise de histórico de quedas',
          'Verificação de alarmes na OLT',
          'Teste de qualidade do sinal óptico',
          'Classificação automática do problema',
        ],
        mensagem: 'Problema requer intervenção técnica. Técnico despachado automaticamente.',
        proximo_passo: 'Técnico realizará inspeção física da fibra e conectores',
        tecnico_atribuido: {
          id: 'TEC-001',
          nome: 'Carlos Eduardo Silva',
          regiao: 'Centro',
          previsao_chegada: 'Hoje, 16:30',
        },
        laudo_completo: 'Diagnóstico automático identificou atenuação excessiva no sinal óptico (RX: -28.5 dBm), fora dos padrões aceitáveis. Histórico mostra 3 quedas nas últimas 24h. Tentativas automáticas de reprocessamento não obtiveram sucesso. Sistema classificou como problema físico na rede óptica e despachou automaticamente técnico qualificado da região. Técnico Carlos Eduardo Silva foi atribuído com previsão de chegada para hoje às 16:30.',
        timestamp: new Date(),
      };
    }
  } catch (error) {
    console.error('Erro ao executar diagnóstico:', error);
    throw new Error('Falha ao executar diagnóstico automático');
  }
}

// Buscar configuração da IA (para integração com API externa)
export async function buscarConfiguracaoIA() {
  // Aqui você buscaria do banco de dados a configuração da IA
  // Por enquanto retorna configuração padrão
  return {
    id: '1',
    nome: 'OpenAI GPT-4',
    provider: 'openai' as const,
    api_url: 'https://api.openai.com/v1/chat/completions',
    api_key: process.env.OPENAI_API_KEY || '',
    modelo: 'gpt-4',
    ativo: true,
    temperatura: 0.7,
    max_tokens: 2000,
  };
}

// Executar análise com IA externa (quando configurada)
export async function executarAnaliseIA(
  dadosCliente: ClienteDiagnostico,
  testesExecutados: TesteAutomatico[]
): Promise<string> {
  try {
    const config = await buscarConfiguracaoIA();
    
    if (!config.ativo || !config.api_key) {
      return 'IA externa não configurada. Usando análise padrão do sistema.';
    }

    // Preparar prompt para a IA
    const prompt = `
Você é um especialista em diagnóstico de redes de fibra óptica para provedores ISP.

Analise os seguintes dados do cliente e testes executados:

CLIENTE:
- Nome: ${dadosCliente.nome}
- Plano: ${dadosCliente.plano}
- Endereço: ${dadosCliente.endereco}

DADOS DE REDE:
- OLT: ${dadosCliente.dados_fibra.olt}
- Status ONU: ${dadosCliente.dados_fibra.status_onu}
- Potência RX: ${dadosCliente.dados_fibra.potencia_rx} dBm
- Potência TX: ${dadosCliente.dados_fibra.potencia_tx} dBm
- Alarmes: ${dadosCliente.dados_fibra.alarmes.join(', ') || 'Nenhum'}
- Quedas recentes: ${dadosCliente.dados_fibra.historico_quedas}

TESTES EXECUTADOS:
${testesExecutados.map(t => `- ${t.nome}: ${t.status} - ${t.resultado}`).join('\n')}

Forneça uma análise técnica detalhada e determine:
1. Causa provável do problema
2. Se pode ser resolvido remotamente ou precisa de técnico
3. Ações recomendadas

Seja objetivo e técnico.
`;

    // Fazer requisição para API da IA
    const response = await fetch(config.api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.api_key}`,
      },
      body: JSON.stringify({
        model: config.modelo,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em diagnóstico de redes de fibra óptica.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: config.temperatura,
        max_tokens: config.max_tokens,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro na API da IA');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Erro ao executar análise IA:', error);
    return 'Erro ao conectar com IA externa. Usando análise padrão do sistema.';
  }
}
