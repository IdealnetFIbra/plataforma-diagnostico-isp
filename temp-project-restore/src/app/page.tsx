'use client';

import { MetricsCard } from '@/components/custom/metrics-card';
import { OSCard } from '@/components/custom/os-card';
import { mockMetricas, mockOrdensServico } from '@/lib/mock-data';
import { 
  ClipboardList, 
  CheckCircle, 
  TrendingUp, 
  Clock,
  Users,
  AlertTriangle,
  Filter,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Dashboard() {
  const osAtivas = mockOrdensServico.filter(
    os => !['completed', 'cancelled'].includes(os.status)
  );

  const osPendentes = mockOrdensServico.filter(os => os.status === 'pending');
  const osDiagnosticando = mockOrdensServico.filter(os => os.status === 'diagnosing');
  const osEmAndamento = mockOrdensServico.filter(os => os.status === 'in_progress');

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Visão geral das operações em tempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="hoje">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="mes">Este Mês</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total de O.S."
          value={mockMetricas.total_os}
          subtitle="Abertas hoje"
          icon={ClipboardList}
          color="blue"
          trend={{ value: 12, isPositive: false }}
        />
        <MetricsCard
          title="Resolvidas Remoto"
          value={mockMetricas.resolvidas_remoto}
          subtitle={`${((mockMetricas.resolvidas_remoto / mockMetricas.total_os) * 100).toFixed(0)}% do total`}
          icon={CheckCircle}
          color="green"
          trend={{ value: 8, isPositive: true }}
        />
        <MetricsCard
          title="Tempo Médio"
          value={`${mockMetricas.tempo_medio_solucao}min`}
          subtitle="De solução"
          icon={Clock}
          color="orange"
          trend={{ value: 5, isPositive: true }}
        />
        <MetricsCard
          title="SLA Cumprido"
          value={`${mockMetricas.sla_cumprido}%`}
          subtitle="Meta: 95%"
          icon={TrendingUp}
          color="purple"
          trend={{ value: 2, isPositive: true }}
        />
      </div>

      {/* Status Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Aguardando Diagnóstico</h3>
            <Badge className="bg-gray-100 text-gray-700">{osPendentes.length}</Badge>
          </div>
          <div className="space-y-3">
            {osPendentes.slice(0, 3).map(os => (
              <div key={os.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 truncate">{os.cliente.nome}</span>
                <span className="text-gray-400 font-mono text-xs">{os.numero_os.split('-')[2]}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Em Diagnóstico</h3>
            <Badge className="bg-blue-100 text-blue-700">{osDiagnosticando.length}</Badge>
          </div>
          <div className="space-y-3">
            {osDiagnosticando.slice(0, 3).map(os => (
              <div key={os.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 truncate">{os.cliente.nome}</span>
                <span className="text-gray-400 font-mono text-xs">{os.numero_os.split('-')[2]}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Em Atendimento</h3>
            <Badge className="bg-purple-100 text-purple-700">{osEmAndamento.length}</Badge>
          </div>
          <div className="space-y-3">
            {osEmAndamento.slice(0, 3).map(os => (
              <div key={os.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 truncate">{os.cliente.nome}</span>
                <span className="text-gray-400 font-mono text-xs">{os.numero_os.split('-')[2]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Active O.S. List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ordens de Serviço Ativas</h2>
            <p className="text-sm text-gray-600 mt-1">
              {osAtivas.length} O.S. requerem atenção
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {osAtivas.map(os => (
            <OSCard key={os.id} os={os} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Ações Rápidas</h3>
            <p className="text-sm text-gray-600 mt-1">
              {osPendentes.length} O.S. aguardando diagnóstico automático
            </p>
            <div className="flex gap-3 mt-4">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Processar Todas
              </Button>
              <Button variant="outline">
                Ver Fila
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
