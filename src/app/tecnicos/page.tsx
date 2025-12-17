'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  MapPin,
  Phone,
  Mail,
  Star,
  Clock,
  Navigation,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Zap,
  TrendingUp,
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  buscarTecnicos,
  sugerirTecnicosParaOS,
  alocarOSParaTecnico,
  alocarOSAutomaticamente,
  buscarCoordenadas,
} from '../actions/tecnicos-actions';
import type {
  Tecnico,
  OrdemServico,
  SugestaoAlocacao,
  FiltrosTecnicos,
} from '@/lib/types-tecnicos';

export default function TecnicosPage() {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtros, setFiltros] = useState<FiltrosTecnicos>({});
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState<Tecnico | null>(
    null
  );
  const [modalAlocacao, setModalAlocacao] = useState(false);
  const [modalSugestoes, setModalSugestoes] = useState(false);
  const [sugestoes, setSugestoes] = useState<SugestaoAlocacao[]>([]);
  const [alocando, setAlocando] = useState(false);

  // Dados da nova O.S. para alocar
  const [novaOS, setNovaOS] = useState({
    cliente_nome: '',
    endereco: '',
    bairro: '',
    descricao: '',
    tipo: 'reparo' as const,
    prioridade: 'media' as const,
  });

  useEffect(() => {
    carregarTecnicos();
  }, [filtros]);

  const carregarTecnicos = async () => {
    setCarregando(true);
    const dados = await buscarTecnicos(filtros);
    setTecnicos(dados);
    setCarregando(false);
  };

  const handleAbrirModalAlocacao = (tecnico?: Tecnico) => {
    setTecnicoSelecionado(tecnico || null);
    setModalAlocacao(true);
  };

  const handleBuscarSugestoes = async () => {
    if (!novaOS.endereco || !novaOS.bairro) {
      alert('Preencha o endereço e bairro da O.S.');
      return;
    }

    setAlocando(true);

    // Buscar coordenadas do endereço
    const localizacao = await buscarCoordenadas(
      `${novaOS.endereco}, ${novaOS.bairro}`
    );

    if (!localizacao) {
      alert('Não foi possível localizar o endereço');
      setAlocando(false);
      return;
    }

    // Criar O.S. temporária
    const osTemp: OrdemServico = {
      id: `OS-${Date.now()}`,
      cliente_id: 'CLI-TEMP',
      cliente_nome: novaOS.cliente_nome,
      endereco: novaOS.endereco,
      bairro: novaOS.bairro,
      localizacao,
      tipo: novaOS.tipo,
      prioridade: novaOS.prioridade,
      status: 'pendente',
      descricao: novaOS.descricao,
      data_abertura: new Date().toISOString(),
      tempo_estimado_minutos: 60,
    };

    // Buscar sugestões
    const sugestoesIA = await sugerirTecnicosParaOS(osTemp);
    setSugestoes(sugestoesIA);
    setModalAlocacao(false);
    setModalSugestoes(true);
    setAlocando(false);
  };

  const handleAlocarAutomaticamente = async () => {
    if (!novaOS.endereco || !novaOS.bairro) {
      alert('Preencha o endereço e bairro da O.S.');
      return;
    }

    setAlocando(true);

    // Buscar coordenadas
    const localizacao = await buscarCoordenadas(
      `${novaOS.endereco}, ${novaOS.bairro}`
    );

    if (!localizacao) {
      alert('Não foi possível localizar o endereço');
      setAlocando(false);
      return;
    }

    // Criar O.S.
    const osTemp: OrdemServico = {
      id: `OS-${Date.now()}`,
      cliente_id: 'CLI-TEMP',
      cliente_nome: novaOS.cliente_nome,
      endereco: novaOS.endereco,
      bairro: novaOS.bairro,
      localizacao,
      tipo: novaOS.tipo,
      prioridade: novaOS.prioridade,
      status: 'pendente',
      descricao: novaOS.descricao,
      data_abertura: new Date().toISOString(),
      tempo_estimado_minutos: 60,
    };

    // Alocar automaticamente
    const resultado = await alocarOSAutomaticamente(osTemp);

    if (resultado.sucesso) {
      alert(resultado.mensagem);
      setModalAlocacao(false);
      setNovaOS({
        cliente_nome: '',
        endereco: '',
        bairro: '',
        descricao: '',
        tipo: 'reparo',
        prioridade: 'media',
      });
      carregarTecnicos();
    } else {
      alert(resultado.mensagem);
    }

    setAlocando(false);
  };

  const handleAlocarParaTecnico = async (tecnicoId: string) => {
    setAlocando(true);

    const localizacao = await buscarCoordenadas(
      `${novaOS.endereco}, ${novaOS.bairro}`
    );

    if (!localizacao) {
      alert('Não foi possível localizar o endereço');
      setAlocando(false);
      return;
    }

    const osTemp: OrdemServico = {
      id: `OS-${Date.now()}`,
      cliente_id: 'CLI-TEMP',
      cliente_nome: novaOS.cliente_nome,
      endereco: novaOS.endereco,
      bairro: novaOS.bairro,
      localizacao,
      tipo: novaOS.tipo,
      prioridade: novaOS.prioridade,
      status: 'pendente',
      descricao: novaOS.descricao,
      data_abertura: new Date().toISOString(),
      tempo_estimado_minutos: 60,
    };

    const resultado = await alocarOSParaTecnico(osTemp.id, tecnicoId);

    if (resultado.sucesso) {
      alert(resultado.mensagem);
      setModalSugestoes(false);
      setNovaOS({
        cliente_nome: '',
        endereco: '',
        bairro: '',
        descricao: '',
        tipo: 'reparo',
        prioridade: 'media',
      });
      carregarTecnicos();
    } else {
      alert(resultado.mensagem);
    }

    setAlocando(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'bg-green-100 text-green-700';
      case 'ocupado':
        return 'bg-yellow-100 text-yellow-700';
      case 'offline':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'Disponível';
      case 'ocupado':
        return 'Ocupado';
      case 'offline':
        return 'Offline';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestão de Técnicos
            </h1>
            <p className="text-gray-600 mt-1">
              Alocação inteligente de O.S. com IA
            </p>
          </div>
          <Button
            onClick={() => handleAbrirModalAlocacao()}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            <Zap className="mr-2 h-5 w-5" />
            Alocar Nova O.S.
          </Button>
        </div>

        {/* Filtros */}
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Nome, email ou telefone"
                  className="pl-9"
                  value={filtros.busca || ''}
                  onChange={(e) =>
                    setFiltros({ ...filtros, busca: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={filtros.status || 'todos'}
                onValueChange={(v) =>
                  setFiltros({
                    ...filtros,
                    status: v === 'todos' ? undefined : (v as any),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="ocupado">Ocupado</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Especialidade</Label>
              <Select
                value={filtros.especialidade || 'todas'}
                onValueChange={(v) =>
                  setFiltros({
                    ...filtros,
                    especialidade: v === 'todas' ? undefined : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="fibra">Fibra Óptica</SelectItem>
                  <SelectItem value="instalacao">Instalação</SelectItem>
                  <SelectItem value="suporte">Suporte Técnico</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFiltros({})}
                className="w-full"
              >
                <Filter className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </Card>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Técnicos Disponíveis</p>
                <p className="text-3xl font-bold text-green-600">
                  {tecnicos.filter((t) => t.status === 'disponivel').length}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Em Atendimento</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {tecnicos.filter((t) => t.status === 'ocupado').length}
                </p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Técnicos</p>
                <p className="text-3xl font-bold text-blue-600">
                  {tecnicos.length}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Lista de Técnicos */}
        {carregando ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tecnicos.map((tecnico) => (
              <Card key={tecnico.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {tecnico.nome}
                      </h3>
                      <Badge className={getStatusColor(tecnico.status)}>
                        {getStatusLabel(tecnico.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-medium">
                        {tecnico.avaliacao_media.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Contato */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{tecnico.telefone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{tecnico.email}</span>
                    </div>
                  </div>

                  {/* Localização */}
                  {tecnico.localizacao_atual && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="text-xs">
                        {tecnico.localizacao_atual.bairro},{' '}
                        {tecnico.localizacao_atual.cidade}
                      </span>
                    </div>
                  )}

                  {/* Especialidades */}
                  <div className="flex flex-wrap gap-1">
                    {tecnico.especialidades.slice(0, 3).map((esp, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs"
                      >
                        {esp}
                      </Badge>
                    ))}
                  </div>

                  {/* O.S. Ativas */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm">
                      <span className="text-gray-600">O.S. Ativas: </span>
                      <span className="font-semibold text-gray-900">
                        {tecnico.ordens_servico_ativas.length}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Hoje: </span>
                      <span className="font-semibold text-gray-900">
                        {tecnico.ordens_servico_hoje}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <Button
                    onClick={() => handleAbrirModalAlocacao(tecnico)}
                    variant="outline"
                    className="w-full"
                    disabled={tecnico.status === 'offline'}
                  >
                    <Navigation className="mr-2 h-4 w-4" />
                    Alocar O.S.
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Alocação */}
        <Dialog open={modalAlocacao} onOpenChange={setModalAlocacao}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {tecnicoSelecionado
                  ? `Alocar O.S. para ${tecnicoSelecionado.nome}`
                  : 'Alocar Nova O.S.'}
              </DialogTitle>
              <DialogDescription>
                {tecnicoSelecionado
                  ? 'Preencha os dados da ordem de serviço'
                  : 'A IA irá sugerir o melhor técnico baseado em localização e disponibilidade'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Nome do Cliente</Label>
                <Input
                  placeholder="Digite o nome do cliente"
                  value={novaOS.cliente_nome}
                  onChange={(e) =>
                    setNovaOS({ ...novaOS, cliente_nome: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Endereço Completo</Label>
                  <Input
                    placeholder="Rua, número"
                    value={novaOS.endereco}
                    onChange={(e) =>
                      setNovaOS({ ...novaOS, endereco: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Input
                    placeholder="Nome do bairro"
                    value={novaOS.bairro}
                    onChange={(e) =>
                      setNovaOS({ ...novaOS, bairro: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Tipo de Serviço</Label>
                  <Select
                    value={novaOS.tipo}
                    onValueChange={(v: any) => setNovaOS({ ...novaOS, tipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instalacao">Instalação</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                      <SelectItem value="reparo">Reparo</SelectItem>
                      <SelectItem value="suporte">Suporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select
                    value={novaOS.prioridade}
                    onValueChange={(v: any) =>
                      setNovaOS({ ...novaOS, prioridade: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Descrição do Problema</Label>
                <Input
                  placeholder="Descreva o problema"
                  value={novaOS.descricao}
                  onChange={(e) =>
                    setNovaOS({ ...novaOS, descricao: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              {!tecnicoSelecionado && (
                <Button
                  onClick={handleAlocarAutomaticamente}
                  disabled={alocando}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600"
                >
                  {alocando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Alocando...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Alocar Automaticamente (IA)
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={handleBuscarSugestoes}
                disabled={alocando}
                variant="outline"
              >
                {alocando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Ver Sugestões da IA
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Sugestões */}
        <Dialog open={modalSugestoes} onOpenChange={setModalSugestoes}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sugestões da IA</DialogTitle>
              <DialogDescription>
                Técnicos ordenados por proximidade e disponibilidade
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {sugestoes.map((sugestao, idx) => (
                <Card
                  key={sugestao.tecnico_id}
                  className={`p-4 ${
                    idx === 0 ? 'border-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {sugestao.tecnico_nome}
                        </h4>
                        {idx === 0 && (
                          <Badge className="bg-blue-100 text-blue-700">
                            Melhor Opção
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {sugestao.motivo}
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                        <span>📍 {sugestao.distancia_km}km</span>
                        <span>⏱️ {sugestao.tempo_estimado_minutos} min</span>
                        {sugestao.ordens_proximas > 0 && (
                          <span>
                            📋 {sugestao.ordens_proximas} O.S. próximas
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {sugestao.score}
                        </div>
                        <div className="text-xs text-gray-500">Score</div>
                      </div>
                      <Button
                        onClick={() =>
                          handleAlocarParaTecnico(sugestao.tecnico_id)
                        }
                        disabled={alocando}
                        size="sm"
                      >
                        Alocar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
