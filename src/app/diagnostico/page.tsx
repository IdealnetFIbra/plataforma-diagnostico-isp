'use client';

import { useState } from 'react';
import { Search, Zap, CheckCircle, XCircle, AlertTriangle, Loader2, User, MapPin, Wifi, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { executarDiagnosticoCompleto, buscarClientePorFiltro } from '../actions/diagnostico-actions';

interface Cliente {
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
}

interface DadosFibra {
  olt: string;
  porta_pon: string;
  onu: string;
  status_onu: 'online' | 'offline';
  potencia_rx: string;
  potencia_tx: string;
  alarmes: string[];
}

interface ResultadoDiagnostico {
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
}

export default function DiagnosticoPage() {
  const [busca, setBusca] = useState('');
  const [tipoBusca, setTipoBusca] = useState<'nome' | 'cpf' | 'codigo' | 'os'>('nome');
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [dadosFibra, setDadosFibra] = useState<DadosFibra | null>(null);
  const [diagnostico, setDiagnostico] = useState<ResultadoDiagnostico | null>(null);
  const [loading, setLoading] = useState(false);
  const [diagnosticando, setDiagnosticando] = useState(false);

  const buscarCliente = async () => {
    if (!busca.trim()) return;

    setLoading(true);
    try {
      const resultado = await buscarClientePorFiltro(tipoBusca, busca);
      
      if (resultado.success && resultado.cliente) {
        setClienteSelecionado(resultado.cliente);
        setDadosFibra(resultado.dadosFibra || null);
        setDiagnostico(null);
      } else {
        alert(resultado.message || 'Cliente não encontrado');
      }
    } catch (error) {
      alert('Erro ao buscar cliente');
    } finally {
      setLoading(false);
    }
  };

  const executarDiagnostico = async () => {
    if (!clienteSelecionado) return;

    setDiagnosticando(true);
    setDiagnostico(null);

    try {
      const resultado = await executarDiagnosticoCompleto(clienteSelecionado.id);
      
      if (resultado.success && resultado.diagnostico) {
        setDiagnostico(resultado.diagnostico);
      } else {
        alert(resultado.message || 'Erro ao executar diagnóstico');
      }
    } catch (error) {
      alert('Erro ao executar diagnóstico');
    } finally {
      setDiagnosticando(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
    }
  };

  const getDecisaoColor = (decisao: string) => {
    switch (decisao) {
      case 'resolver_remoto':
        return 'bg-green-500';
      case 'orientar_cliente':
        return 'bg-blue-500';
      case 'despachar_tecnico':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getDecisaoTexto = (decisao: string) => {
    switch (decisao) {
      case 'resolver_remoto':
        return 'Resolvido Remotamente';
      case 'orientar_cliente':
        return 'Orientação ao Cliente';
      case 'despachar_tecnico':
        return 'Técnico Despachado';
      default:
        return 'Processando';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Diagnóstico Automático
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Diagnóstico completo com IA em um único clique
            </p>
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg">
            <Zap className="w-5 h-5" />
            <span className="font-semibold">IA Ativa</span>
          </div>
        </div>

        {/* Busca de Cliente */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            1️⃣ Selecionar Cliente
          </h2>
          
          <div className="flex gap-4 mb-4">
            <select
              value={tipoBusca}
              onChange={(e) => setTipoBusca(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="nome">Nome</option>
              <option value="cpf">CPF/CNPJ</option>
              <option value="codigo">Código Cliente</option>
              <option value="os">Número O.S.</option>
            </select>

            <div className="flex-1 flex gap-2">
              <Input
                placeholder={`Buscar por ${tipoBusca}...`}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscarCliente()}
                className="flex-1"
              />
              <Button onClick={buscarCliente} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Dados do Cliente */}
          {clienteSelecionado && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cliente</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{clienteSelecionado.nome}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Contrato: {clienteSelecionado.contrato} | {clienteSelecionado.plano}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Endereço</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{clienteSelecionado.endereco}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {clienteSelecionado.bairro} - {clienteSelecionado.cidade}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Dados da Fibra */}
        {dadosFibra && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              Dados da Rede (Fibra)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">OLT / Porta PON</p>
                <p className="font-semibold text-gray-900 dark:text-white">{dadosFibra.olt}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{dadosFibra.porta_pon}</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">ONU</p>
                <p className="font-semibold text-gray-900 dark:text-white">{dadosFibra.onu}</p>
                <Badge className={dadosFibra.status_onu === 'online' ? 'bg-green-500' : 'bg-red-500'}>
                  {dadosFibra.status_onu.toUpperCase()}
                </Badge>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Potência</p>
                <p className="text-sm text-gray-900 dark:text-white">RX: {dadosFibra.potencia_rx}</p>
                <p className="text-sm text-gray-900 dark:text-white">TX: {dadosFibra.potencia_tx}</p>
              </div>
            </div>

            {dadosFibra.alarmes.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="font-semibold text-red-700 dark:text-red-400 mb-2">⚠️ Alarmes Ativos:</p>
                <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400">
                  {dadosFibra.alarmes.map((alarme, idx) => (
                    <li key={idx}>{alarme}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        {/* Botão de Diagnóstico */}
        {clienteSelecionado && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              2️⃣ Executar Diagnóstico
            </h2>

            <Button
              onClick={executarDiagnostico}
              disabled={diagnosticando}
              className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {diagnosticando ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Executando Diagnóstico Automático...
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6 mr-2" />
                  Executar Diagnóstico Automático
                </>
              )}
            </Button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
              A IA irá analisar, testar e resolver automaticamente
            </p>
          </Card>
        )}

        {/* Resultado do Diagnóstico */}
        {diagnostico && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Resultado do Diagnóstico
            </h2>

            {/* Status Final */}
            <div className={`p-6 rounded-lg ${getDecisaoColor(diagnostico.decisao)} text-white mb-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Status Final</p>
                  <p className="text-2xl font-bold">{getDecisaoTexto(diagnostico.decisao)}</p>
                </div>
                {diagnostico.decisao === 'resolver_remoto' && (
                  <CheckCircle className="w-12 h-12" />
                )}
                {diagnostico.decisao === 'despachar_tecnico' && (
                  <AlertTriangle className="w-12 h-12" />
                )}
              </div>
            </div>

            {/* Laudo */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Laudo Técnico</p>
              <p className="text-gray-900 dark:text-white">{diagnostico.laudo}</p>
            </div>

            {/* Testes Executados */}
            <div className="mb-6">
              <p className="font-semibold text-gray-900 dark:text-white mb-3">Testes Executados:</p>
              <div className="space-y-2">
                {diagnostico.testes.map((teste, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    {getStatusIcon(teste.status)}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{teste.nome}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{teste.resultado}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Técnico Despachado */}
            {diagnostico.tecnico_despachado && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="font-semibold text-orange-700 dark:text-orange-400 mb-2">
                  🚚 Técnico Despachado
                </p>
                <p className="text-gray-900 dark:text-white">
                  <strong>{diagnostico.tecnico_despachado.nome}</strong>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tel: {diagnostico.tecnico_despachado.telefone}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Previsão: {diagnostico.tecnico_despachado.previsao}
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
