// Worker para processamento contínuo e automático
import { NextResponse } from 'next/server';
import { ixcService } from '@/lib/services/ixc-service';
import { aiDiagnosticService } from '@/lib/services/ai-diagnostic-service';
import { dispatchService } from '@/lib/services/dispatch-service';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Validar se Supabase está configurado
function isSupabaseConfigured() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  );
}

// Endpoint para ser chamado por cron job ou manualmente
export async function GET(request: Request) {
  try {
    // Verificar se Supabase está configurado
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          erro: 'Supabase não configurado',
          mensagem: 'Configure as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY',
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'all';

    const resultado = {
      timestamp: new Date().toISOString(),
      acoes: {} as Record<string, any>,
    };

    // 1. Sincronizar O.S. do IXC
    if (action === 'all' || action === 'sync') {
      try {
        const sincronizadas = await ixcService.sincronizarOrdens();
        resultado.acoes.sincronizacao = {
          sucesso: true,
          ordens_sincronizadas: sincronizadas,
        };
      } catch (error: any) {
        resultado.acoes.sincronizacao = {
          sucesso: false,
          erro: error.message,
        };
      }
    }

    // 2. Processar diagnósticos automáticos
    if (action === 'all' || action === 'diagnostico') {
      try {
        // Buscar O.S. pendentes de diagnóstico
        const { data: osPendentes } = await supabase
          .from('ordens_servico')
          .select('id')
          .eq('status', 'pending')
          .order('prioridade', { ascending: false })
          .order('data_abertura', { ascending: true })
          .limit(5);

        const diagnosticadas = [];

        if (osPendentes) {
          for (const os of osPendentes) {
            const diagnostico = await aiDiagnosticService.diagnosticar(os.id);
            if (diagnostico) {
              diagnosticadas.push({
                os_id: os.id,
                decisao: diagnostico.decisao,
                confianca: diagnostico.ia_confidence,
              });
            }
          }
        }

        resultado.acoes.diagnostico = {
          sucesso: true,
          ordens_diagnosticadas: diagnosticadas.length,
          detalhes: diagnosticadas,
        };
      } catch (error: any) {
        resultado.acoes.diagnostico = {
          sucesso: false,
          erro: error.message,
        };
      }
    }

    // 3. Validar resoluções remotas
    if (action === 'all' || action === 'validacao') {
      try {
        // Buscar O.S. resolvidas remotamente aguardando validação
        const { data: osResolvidasRemoto } = await supabase
          .from('ordens_servico')
          .select('id')
          .eq('status', 'resolved_remote')
          .is('data_conclusao', null)
          .limit(10);

        const validadas = [];

        if (osResolvidasRemoto) {
          for (const os of osResolvidasRemoto) {
            const resolvido = await aiDiagnosticService.validarResolucao(os.id);
            validadas.push({
              os_id: os.id,
              resolvido,
            });
          }
        }

        resultado.acoes.validacao = {
          sucesso: true,
          ordens_validadas: validadas.length,
          resolvidas: validadas.filter(v => v.resolvido).length,
          nao_resolvidas: validadas.filter(v => !v.resolvido).length,
        };
      } catch (error: any) {
        resultado.acoes.validacao = {
          sucesso: false,
          erro: error.message,
        };
      }
    }

    // 4. Processar despacho automático
    if (action === 'all' || action === 'despacho') {
      try {
        const despachadas = await dispatchService.processarDespachoAutomatico();
        resultado.acoes.despacho = {
          sucesso: true,
          ordens_despachadas: despachadas,
        };
      } catch (error: any) {
        resultado.acoes.despacho = {
          sucesso: false,
          erro: error.message,
        };
      }
    }

    // 5. Verificar SLA e alertas
    if (action === 'all' || action === 'sla') {
      try {
        const { data: osProximasVencer } = await supabase
          .from('ordens_servico')
          .select('id, numero_os, sla_expira_em, prioridade')
          .in('status', ['pending', 'diagnosing', 'dispatched', 'in_progress'])
          .lt('sla_expira_em', new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString())
          .order('sla_expira_em', { ascending: true });

        resultado.acoes.sla = {
          sucesso: true,
          ordens_proximas_vencer: osProximasVencer?.length || 0,
          detalhes: osProximasVencer?.slice(0, 5) || [],
        };
      } catch (error: any) {
        resultado.acoes.sla = {
          sucesso: false,
          erro: error.message,
        };
      }
    }

    return NextResponse.json(resultado, { status: 200 });
  } catch (error: any) {
    console.error('Erro no worker:', error);
    return NextResponse.json(
      {
        erro: 'Erro ao processar worker',
        mensagem: error.message,
      },
      { status: 500 }
    );
  }
}

// Endpoint POST para ações manuais
export async function POST(request: Request) {
  try {
    // Verificar se Supabase está configurado
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          erro: 'Supabase não configurado',
          mensagem: 'Configure as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { action, os_id } = body;

    if (action === 'diagnosticar' && os_id) {
      const diagnostico = await aiDiagnosticService.diagnosticar(os_id);
      return NextResponse.json({ sucesso: true, diagnostico });
    }

    if (action === 'despachar' && os_id) {
      const melhorTecnico = await dispatchService.encontrarMelhorTecnico(os_id);
      if (melhorTecnico) {
        const sucesso = await dispatchService.atribuirOS(os_id, melhorTecnico.tecnico.id);
        return NextResponse.json({ sucesso, tecnico: melhorTecnico });
      }
      return NextResponse.json({ sucesso: false, erro: 'Nenhum técnico disponível' });
    }

    return NextResponse.json({ erro: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
}
