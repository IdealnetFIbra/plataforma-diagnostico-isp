'use client';

import { useState } from 'react';
import { Search, Loader2, CheckCircle, XCircle, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { buscarCliente, executarDiagnosticoAutomatico } from '../actions/diagnostico-actions';
import type { ClienteDiagnostico, ResultadoDiagnostico } from '@/lib/types-diagnostico';

export default function DiagnosticoPage() {
  const [tipoBusca, setTipoBusca] = useState<'id' | 'nome' | 'cpf' | 'os'>('nome');
  const [termoBusca, setTermoBusca] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [diagnosticando, setDiagnosticando] = useState(false);
  const [cliente, setCliente] = useState<ClienteDiagnostico | null>(null);
  const [resultado, setResultado] = useState<ResultadoDiagnostico | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleBuscarCliente = async () => {
    if (!termoBusca.trim()) {
      setErro('Digite um termo para buscar');
      return;
    }

    setBuscando(true);
    setErro(null);
    setCliente(null);
    setResultado(null);

    try {
      const clienteEncontrado = await buscarCliente(tipoBusca, termoBusca);
      
      if (!clienteEncontrado) {
        setErro('Cliente não encontrado');
        return;
      }

      setCliente(clienteEncontrado);
    } catch (error) {
      setErro('Erro ao buscar cliente. Tente novamente.');
      console.error(error);
    } finally {
      setBuscando(false);
    }
  };

  const handleExecutarDiagnostico = async () => {
    if (!cliente) return;

    setDiagnosticando(true);
    setErro(null);

    try {
      const resultadoDiag = await executarDiagnosticoAutomatico(cliente.id);
      setResultado(resultadoDiag);
    } catch (error) {
      setErro('Erro ao executar diagnóstico. Tente novamente.');
      console.error(error);
    } finally {
      setDiagnosticando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Diagnóstico Automático</h1>
            <p className="text-gray-600 mt-1">
              Execute diagnósticos completos com um único clique
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white">
            <Zap className="h-5 w-5" />
            <span className="font-semibold">IA Ativa</span>
          </div>
        </div>

        {/* Busca de Cliente */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            1. Buscar Cliente
          </h2>
          
          <div className="grid gap-4 md:grid-cols-[200px_1fr_auto]">
            <div>
              <Label>Buscar por</Label>
              <Select value={tipoBusca} onValueChange={(v: any) => setTipoBusca(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nome">Nome</SelectItem>
                  <SelectItem value="cpf">CPF/CNPJ</SelectItem>
                  <SelectItem value="id">Código Cliente</SelectItem>
                  <SelectItem value="os">Número O.S.</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                {tipoBusca === 'nome' && 'Nome do Cliente'}
                {tipoBusca === 'cpf' && 'CPF/CNPJ'}
                {tipoBusca === 'id' && 'Código do Cliente'}
                {tipoBusca === 'os' && 'Número da O.S.'}
              </Label>
              <Input
                placeholder={
                  tipoBusca === 'nome' ? 'Digite o nome completo' :
                  tipoBusca === 'cpf' ? 'Digite o CPF/CNPJ' :
                  tipoBusca === 'id' ? 'Digite o código' :
                  'Digite o número da O.S.'
                }
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscarCliente()}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleBuscarCliente}
                disabled={buscando}
                className="w-full md:w-auto"
              >
                {buscando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </div>

          {erro && !cliente && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Erro</p>
                <p className="text-sm text-red-700">{erro}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Dados do Cliente */}
        {cliente && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. Dados do Cliente
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Informações Básicas</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nome:</span>
                      <span className="font-medium text-gray-900">{cliente.nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contrato:</span>
                      <span className="font-medium text-gray-900">{cliente.contrato}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plano:</span>
                      <span className="font-medium text-gray-900">{cliente.plano}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Endereço:</span>
                      <span className="font-medium text-gray-900 text-right">{cliente.endereco}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tecnologia:</span>
                      <Badge className="bg-blue-100 text-blue-700">Fibra Óptica</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dados de Rede */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Dados de Rede (Fibra)</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">OLT:</span>
                      <span className="font-medium text-gray-900">{cliente.dados_fibra.olt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Porta PON:</span>
                      <span className="font-medium text-gray-900">{cliente.dados_fibra.porta_pon}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ONU:</span>
                      <span className="font-medium text-gray-900">{cliente.dados_fibra.onu}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status ONU:</span>
                      <Badge className={
                        cliente.dados_fibra.status_onu === 'online' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }>
                        {cliente.dados_fibra.status_onu === 'online' ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Potência RX:</span>
                      <span className={`font-medium ${
                        parseFloat(cliente.dados_fibra.potencia_rx) > -25 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {cliente.dados_fibra.potencia_rx} dBm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Potência TX:</span>
                      <span className="font-medium text-gray-900">{cliente.dados_fibra.potencia_tx} dBm</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alarmes Ativos */}
            {cliente.dados_fibra.alarmes.length > 0 && (
              <div className="mt-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-900">Alarmes Ativos</p>
                    <ul className="mt-2 space-y-1 text-sm text-yellow-800">
                      {cliente.dados_fibra.alarmes.map((alarme, idx) => (
                        <li key={idx}>• {alarme}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Botão de Diagnóstico */}
            <div className="mt-6 pt-6 border-t">
              <Button
                onClick={handleExecutarDiagnostico}
                disabled={diagnosticando}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold"
              >
                {diagnosticando ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Executando Diagnóstico Automático...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    Executar Diagnóstico Automático
                  </>
                )}
              </Button>
              <p className="text-center text-sm text-gray-600 mt-2">
                A IA irá analisar, testar e resolver automaticamente
              </p>
            </div>
          </Card>
        )}

        {/* Resultado do Diagnóstico */}
        {resultado && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              3. Resultado do Diagnóstico
            </h2>

            {/* Status Final */}
            <div className={`rounded-lg p-6 mb-6 ${
              resultado.status_final === 'resolvido'
                ? 'bg-green-50 border border-green-200'
                : 'bg-orange-50 border border-orange-200'
            }`}>
              <div className="flex items-start gap-4">
                {resultado.status_final === 'resolvido' ? (
                  <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-orange-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${
                    resultado.status_final === 'resolvido' ? 'text-green-900' : 'text-orange-900'
                  }`}>
                    {resultado.status_final === 'resolvido' 
                      ? '✅ Problema Resolvido Remotamente'
                      : '🔧 Técnico Despachado'
                    }
                  </h3>
                  <p className={`text-sm mt-1 ${
                    resultado.status_final === 'resolvido' ? 'text-green-700' : 'text-orange-700'
                  }`}>
                    {resultado.mensagem}
                  </p>
                </div>
              </div>
            </div>

            {/* Análise da IA */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Análise da IA</h3>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-900">{resultado.analise_ia}</p>
              </div>
            </div>

            {/* Causa Provável */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Causa Provável</h3>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-700 text-sm">
                  {resultado.causa_provavel}
                </Badge>
              </div>
            </div>

            {/* Testes Executados */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Testes Executados</h3>
              <div className="space-y-2">
                {resultado.testes_executados.map((teste, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                    {teste.status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {teste.status === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                    {teste.status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{teste.nome}</p>
                      <p className="text-xs text-gray-600">{teste.resultado}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ações Executadas */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Ações Executadas</h3>
              <ul className="space-y-2">
                {resultado.acoes_executadas.map((acao, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{acao}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Próximo Passo */}
            {resultado.proximo_passo && (
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Próximo Passo</h3>
                <p className="text-sm text-gray-700">{resultado.proximo_passo}</p>
              </div>
            )}

            {/* Técnico Atribuído (se despachado) */}
            {resultado.tecnico_atribuido && (
              <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Técnico Atribuído</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Nome:</span>
                    <span className="font-medium text-blue-900">{resultado.tecnico_atribuido.nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Região:</span>
                    <span className="font-medium text-blue-900">{resultado.tecnico_atribuido.regiao}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Previsão:</span>
                    <span className="font-medium text-blue-900">{resultado.tecnico_atribuido.previsao_chegada}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
