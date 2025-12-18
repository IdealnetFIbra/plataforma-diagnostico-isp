'use client';

import { useState, useEffect } from 'react';
import { OrdemServico } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  MapPin, 
  User, 
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OSCardProps {
  os: OrdemServico;
  onClick?: () => void;
}

const statusConfig = {
  pending: { label: 'Aguardando', color: 'bg-gray-100 text-gray-700', icon: Clock },
  diagnosing: { label: 'Diagnosticando', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  resolved_remote: { label: 'Resolvido Remoto', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  dispatched: { label: 'Despachado', color: 'bg-orange-100 text-orange-700', icon: ArrowRight },
  in_progress: { label: 'Em Atendimento', color: 'bg-purple-100 text-purple-700', icon: User },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Média', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Crítica', color: 'bg-red-100 text-red-700' },
};

const problemTypeLabels = {
  no_internet: 'Sem Internet',
  slow: 'Lento',
  intermittent: 'Quedas',
  wifi: 'Wi-Fi',
  auth: 'Autenticação',
  incident: 'Incidente',
};

export function OSCard({ os, onClick }: OSCardProps) {
  const status = statusConfig[os.status];
  const priority = priorityConfig[os.prioridade];
  const StatusIcon = status.icon;

  // Estado para armazenar o SLA calculado apenas no cliente
  const [slaInfo, setSlaInfo] = useState<{
    text: string;
    urgent: boolean;
    minutes: number;
  }>({
    text: 'Calculando...',
    urgent: false,
    minutes: 0
  });

  // Calcular SLA apenas no cliente para evitar hydration mismatch
  useEffect(() => {
    const calculateSLA = () => {
      const slaMinutes = Math.floor((os.sla_expira_em.getTime() - new Date().getTime()) / 60000);
      const slaHours = Math.floor(slaMinutes / 60);
      const slaText = slaHours > 0 ? `${slaHours}h` : `${slaMinutes}min`;
      const slaUrgent = slaMinutes < 60;

      setSlaInfo({
        text: slaText,
        urgent: slaUrgent,
        minutes: slaMinutes
      });
    };

    // Calcular imediatamente
    calculateSLA();

    // Atualizar a cada minuto
    const interval = setInterval(calculateSLA, 60000);

    return () => clearInterval(interval);
  }, [os.sla_expira_em]);

  return (
    <Card 
      className="p-5 hover:shadow-lg transition-all cursor-pointer border-l-4"
      style={{ borderLeftColor: slaInfo.urgent ? '#EF4444' : '#3B82F6' }}
      onClick={onClick}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-semibold text-gray-900">
                {os.numero_os}
              </span>
              <Badge className={cn('text-xs', priority.color)}>
                {priority.label}
              </Badge>
            </div>
            <h3 className="font-semibold text-gray-900 truncate">
              {os.cliente.nome}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {problemTypeLabels[os.problema_tipo]}
            </p>
          </div>
          
          <Badge className={cn('flex items-center gap-1.5', status.color)}>
            <StatusIcon className="h-3.5 w-3.5" />
            {status.label}
          </Badge>
        </div>

        {/* Problem */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-700 line-clamp-2">
            {os.problema_relatado}
          </p>
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{os.cliente.bairro}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className={cn(slaInfo.urgent && 'text-red-600 font-semibold')}>
              SLA: {slaInfo.text}
            </span>
          </div>
        </div>

        {/* Técnico */}
        {os.tecnico_atribuido && (
          <div className="flex items-center gap-2 pt-3 border-t">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {os.tecnico_atribuido.nome}
              </p>
              <p className="text-xs text-gray-500">
                {os.tecnico_atribuido.territorio}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            Ver Detalhes
          </Button>
          {os.status === 'pending' && (
            <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
              Iniciar Diagnóstico
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
