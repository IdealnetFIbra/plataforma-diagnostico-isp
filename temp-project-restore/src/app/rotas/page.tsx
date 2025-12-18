'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Filter, RefreshCw, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { buscarOrdensServico, buscarEstatisticasPorBairro, finalizarOrdemServico } from '@/app/actions/rotas-actions';
import { OrdemServico, EstatisticaBairro, FiltrosRotas } from '@/lib/types-rotas';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Importação dinâmica do mapa (apenas no cliente)
const MapaRotas = dynamic(
  () => import('@/components/custom/mapa-rotas').then(mod => mod.MapaRotas),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[500px]">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }
);

export default function RotasPage() {
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticaBairro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<FiltrosRotas>({
    status: ['aberta', 'em_andamento']
  });
  const [osSelecionada, setOsSelecionada] = useState<OrdemServico | null>(null);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [os, stats] = await Promise.all([
        buscarOrdensServico(filtros),
        buscarEstatisticasPorBairro()
      ]);
      setOrdensServico(os);
      setEstatisticas(stats);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [filtros]);

  const handleFinalizarOS = async (osId: string) => {
    const result = await finalizarOrdemServico(osId);
    if (result.success) {
      carregarDados();
      setOsSelecionada(null);
    }
  };

  const getPrioridadeColor = (prioridade: OrdemServico['prioridade']) => {
    const colors = {
      baixa: 'bg-green-100 text-green-800',
      media: 'bg-yellow-100 text-yellow-800',
      alta: 'bg-orange-100 text-orange-800',
      urgente: 'bg-red-100 text-red-800'
    };
    return colors[prioridade];
  };

  const getStatusColor = (status: OrdemServico['status']) => {
    const colors = {
      aberta: 'bg-blue-100 text-blue-800',
      em_andamento: 'bg-purple-100 text-purple-800',
      finalizada: 'bg-green-100 text-green-800',
      cancelada: 'bg-gray-100 text-gray-800'
    };
    return colors[status];
  };

  const totalOS = ordensServico.length;
  const osAbertas = ordensServico.filter(os => os.status === 'aberta').length;
  const osEmAndamento = ordensServico.filter(os => os.status === 'em_andamento').length;
  const osFinalizadas = ordensServico.filter(os => os.status === 'finalizada').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MapPin className="h-8 w-8 text-blue-600" />
              Rotas e Mapa de O.S.
            </h1>
            <p className="text-gray-600 mt-1">
              Visualize e gerencie ordens de serviço no mapa em tempo real
            </p>
          </div>
          <Button onClick={carregarDados} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de O.S.</p>
              <p className="text-2xl font-bold text-gray-900">{totalOS}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Abertas</p>
              <p className="text-2xl font-bold text-blue-600">{osAbertas}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Em Andamento</p>
              <p className="text-2xl font-bold text-purple-600">{osEmAndamento}</p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Finalizadas</p>
              <p className="text-2xl font-bold text-green-600">{osFinalizadas}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              value={filtros.status?.join(',') || 'aberta,em_andamento'}
              onValueChange={(value) => {
                const status = value.split(',') as OrdemServico['status'][];
                setFiltros({ ...filtros, status });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aberta,em_andamento">Abertas e Em Andamento</SelectItem>
                <SelectItem value="aberta">Apenas Abertas</SelectItem>
                <SelectItem value="em_andamento">Apenas Em Andamento</SelectItem>
                <SelectItem value="finalizada">Finalizadas</SelectItem>
                <SelectItem value="aberta,em_andamento,finalizada">Todas</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtros.prioridade?.join(',') || 'todas'}
              onValueChange={(value) => {
                if (value === 'todas') {
                  setFiltros({ ...filtros, prioridade: undefined });
                } else {
                  const prioridade = value.split(',') as OrdemServico['prioridade'][];
                  setFiltros({ ...filtros, prioridade });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Prioridades</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtros.bairro?.join(',') || 'todos'}
              onValueChange={(value) => {
                if (value === 'todos') {
                  setFiltros({ ...filtros, bairro: undefined });
                } else {
                  setFiltros({ ...filtros, bairro: [value] });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Bairro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Bairros</SelectItem>
                {estatisticas.map(stat => (
                  <SelectItem key={stat.bairro} value={stat.bairro}>
                    {stat.bairro} ({stat.total_os})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Layout Principal: Mapa + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapa */}
        <Card className="lg:col-span-2 p-4">
          <h2 className="text-lg font-semibold mb-4">Mapa de O.S.</h2>
          {loading ? (
            <div className="flex items-center justify-center h-[500px]">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <MapaRotas 
              ordensServico={ordensServico} 
              onMarkerClick={setOsSelecionada}
            />
          )}
        </Card>

        {/* Sidebar: Estatísticas por Bairro */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Demanda por Bairro</h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {estatisticas.map(stat => (
              <div 
                key={stat.bairro}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => setFiltros({ ...filtros, bairro: [stat.bairro] })}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{stat.bairro}</h3>
                  <Badge variant="secondary">{stat.total_os} O.S.</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-blue-600 font-semibold">{stat.os_abertas}</p>
                    <p className="text-gray-600">Abertas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-purple-600 font-semibold">{stat.os_em_andamento}</p>
                    <p className="text-gray-600">Andamento</p>
                  </div>
                  <div className="text-center">
                    <p className="text-green-600 font-semibold">{stat.os_finalizadas}</p>
                    <p className="text-gray-600">Finalizadas</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Detalhes da O.S. Selecionada */}
      {osSelecionada && (
        <Card className="mt-6 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{osSelecionada.numero_os}</h2>
              <p className="text-gray-600">{osSelecionada.cliente_nome}</p>
            </div>
            <div className="flex gap-2">
              <Badge className={getPrioridadeColor(osSelecionada.prioridade)}>
                {osSelecionada.prioridade}
              </Badge>
              <Badge className={getStatusColor(osSelecionada.status)}>
                {osSelecionada.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Endereço</p>
              <p className="font-medium">
                {osSelecionada.endereco.logradouro}, {osSelecionada.endereco.numero}
              </p>
              <p className="text-sm text-gray-600">
                {osSelecionada.endereco.bairro} - {osSelecionada.endereco.cidade}/{osSelecionada.endereco.estado}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Tipo de Serviço</p>
              <p className="font-medium capitalize">{osSelecionada.tipo_servico}</p>
              {osSelecionada.tecnico_nome && (
                <>
                  <p className="text-sm text-gray-600 mt-2">Técnico</p>
                  <p className="font-medium">{osSelecionada.tecnico_nome}</p>
                </>
              )}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">Descrição</p>
            <p className="text-gray-900">{osSelecionada.descricao}</p>
          </div>

          {osSelecionada.status !== 'finalizada' && (
            <div className="flex gap-2">
              <Button 
                onClick={() => handleFinalizarOS(osSelecionada.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalizar O.S.
              </Button>
              <Button variant="outline" onClick={() => setOsSelecionada(null)}>
                Fechar
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
