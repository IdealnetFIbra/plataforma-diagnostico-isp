'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Brain, Save, TestTube, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function ConfiguracaoIAPage() {
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'custom'>('openai');
  const [apiUrl, setApiUrl] = useState('https://api.openai.com/v1/chat/completions');
  const [apiKey, setApiKey] = useState('');
  const [modelo, setModelo] = useState('gpt-4');
  const [temperatura, setTemperatura] = useState('0.7');
  const [maxTokens, setMaxTokens] = useState('2000');
  const [testando, setTestando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [testeResultado, setTesteResultado] = useState<'success' | 'error' | null>(null);

  const handleProviderChange = (value: 'openai' | 'anthropic' | 'custom') => {
    setProvider(value);
    
    // Atualizar URL e modelo padrão baseado no provider
    if (value === 'openai') {
      setApiUrl('https://api.openai.com/v1/chat/completions');
      setModelo('gpt-4');
    } else if (value === 'anthropic') {
      setApiUrl('https://api.anthropic.com/v1/messages');
      setModelo('claude-3-opus-20240229');
    } else {
      setApiUrl('');
      setModelo('');
    }
  };

  const handleTestarConexao = async () => {
    setTestando(true);
    setTesteResultado(null);

    // Simular teste de conexão
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simular resultado (70% de sucesso)
    const sucesso = Math.random() > 0.3;
    setTesteResultado(sucesso ? 'success' : 'error');
    setTestando(false);
  };

  const handleSalvar = async () => {
    setSalvando(true);
    
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSalvando(false);
    alert('Configuração salva com sucesso!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuração de IA</h1>
            <p className="text-gray-600 mt-1">
              Configure a integração com provedores de IA para diagnóstico automático
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white">
            <Brain className="h-5 w-5" />
            <span className="font-semibold">IA Config</span>
          </div>
        </div>

        {/* Informações */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Brain className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Como funciona?</h3>
              <p className="text-sm text-blue-700 mt-1">
                O AUTONOC pode se integrar com qualquer provedor de IA via API para executar análises 
                avançadas durante o diagnóstico automático. Configure abaixo as credenciais do seu 
                provedor preferido (OpenAI, Anthropic, ou API customizada).
              </p>
            </div>
          </div>
        </Card>

        {/* Formulário de Configuração */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Configurações da API
          </h2>

          <div className="space-y-6">
            {/* Provider */}
            <div>
              <Label>Provedor de IA</Label>
              <Select value={provider} onValueChange={handleProviderChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI (GPT-4, GPT-3.5)</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                  <SelectItem value="custom">API Customizada</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600 mt-1">
                Escolha o provedor de IA que você deseja utilizar
              </p>
            </div>

            {/* API URL */}
            <div>
              <Label>URL da API</Label>
              <Input
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.openai.com/v1/chat/completions"
              />
              <p className="text-xs text-gray-600 mt-1">
                Endpoint completo da API do provedor
              </p>
            </div>

            {/* API Key */}
            <div>
              <Label>API Key</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
              <p className="text-xs text-gray-600 mt-1">
                Chave de autenticação da API (será armazenada de forma segura)
              </p>
            </div>

            {/* Modelo */}
            <div>
              <Label>Modelo</Label>
              <Input
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="gpt-4"
              />
              <p className="text-xs text-gray-600 mt-1">
                Nome do modelo a ser utilizado (ex: gpt-4, claude-3-opus-20240229)
              </p>
            </div>

            {/* Parâmetros Avançados */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label>Temperatura</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={temperatura}
                  onChange={(e) => setTemperatura(e.target.value)}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Criatividade da IA (0.0 - 2.0)
                </p>
              </div>

              <div>
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                />
                <p className="text-xs text-gray-600 mt-1">
                  Tamanho máximo da resposta
                </p>
              </div>
            </div>

            {/* Teste de Conexão */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleTestarConexao}
                disabled={testando || !apiKey}
                variant="outline"
                className="w-full"
              >
                {testando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando conexão...
                  </>
                ) : (
                  <>
                    <TestTube className="mr-2 h-4 w-4" />
                    Testar Conexão
                  </>
                )}
              </Button>

              {testeResultado === 'success' && (
                <div className="mt-3 rounded-lg bg-green-50 border border-green-200 p-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">
                    Conexão estabelecida com sucesso!
                  </span>
                </div>
              )}

              {testeResultado === 'error' && (
                <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-red-700 font-medium">
                    Erro ao conectar. Verifique as credenciais.
                  </span>
                </div>
              )}
            </div>

            {/* Botão Salvar */}
            <div className="pt-4">
              <Button
                onClick={handleSalvar}
                disabled={salvando || !apiKey}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="lg"
              >
                {salvando ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Salvar Configuração
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Exemplos de Uso */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Exemplos de Configuração
          </h2>

          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">OpenAI GPT-4</h3>
                <Badge className="bg-green-100 text-green-700">Recomendado</Badge>
              </div>
              <div className="space-y-1 text-sm text-gray-700">
                <p><strong>URL:</strong> https://api.openai.com/v1/chat/completions</p>
                <p><strong>Modelo:</strong> gpt-4 ou gpt-3.5-turbo</p>
                <p><strong>API Key:</strong> Obtenha em platform.openai.com</p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Anthropic Claude</h3>
                <Badge className="bg-blue-100 text-blue-700">Alternativa</Badge>
              </div>
              <div className="space-y-1 text-sm text-gray-700">
                <p><strong>URL:</strong> https://api.anthropic.com/v1/messages</p>
                <p><strong>Modelo:</strong> claude-3-opus-20240229</p>
                <p><strong>API Key:</strong> Obtenha em console.anthropic.com</p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">API Customizada</h3>
                <Badge className="bg-purple-100 text-purple-700">Avançado</Badge>
              </div>
              <div className="space-y-1 text-sm text-gray-700">
                <p><strong>URL:</strong> Seu endpoint customizado</p>
                <p><strong>Modelo:</strong> Nome do seu modelo</p>
                <p><strong>Formato:</strong> Deve seguir padrão OpenAI-compatible</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
