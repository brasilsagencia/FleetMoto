import React, { useState, useMemo, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Boxes,
  Package,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  User,
  MapPin,
  FileText,
  Printer,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Plus,
  Play,
  Check,
  X,
  AlertCircle,
  QrCode,
  Calendar,
  Layers,
  Sparkles,
  Barcode,
  Navigation,
  FileCheck,
  Send,
  Eye,
  Info,
  Scale,
  Lock,
  Phone,
  Building2,
  Hash
} from 'lucide-react';
import {
  Expedicao,
  ItemExpedicao,
  StatusExpedicao,
  DivergenciaExpedicao,
  NotaEntrega,
  RotaExpedicao,
  Pedido,
  Motoboy,
  Usuario,
  Cliente,
  SituacaoItemExpedicao,
  TipoDivergencia,
  ResultadoConferencia,
} from '../types';
import {
  expedicoesRepo,
  pedidosRepo,
  divergenciasRepo,
  rotasExpedicaoRepo,
} from '../repositories';
import {
  formatDateTime,
  formatDate,
  formatStatusExpedicao,
  formatSituacaoItemExpedicao,
  formatTipoDivergencia,
  formatPrioridadePedido,
} from '../utils/formatters';

interface ExpedicaoViewProps {
  currentUser: Usuario;
  motoboys: Motoboy[];
  clientes: Cliente[];
  pedidos: Pedido[];
  onNavigate?: (tab: any) => void;
}

export const ExpedicaoView: React.FC<ExpedicaoViewProps> = ({
  currentUser,
  motoboys,
  clientes,
  pedidos,
  onNavigate,
}) => {
  const [expedicoes, setExpedicoes] = useState<Expedicao[]>([]);
  const [rotas, setRotas] = useState<RotaExpedicao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('todos');
  const [zonaFilter, setZonaFilter] = useState<string>('todas');
  const [activeTab, setActiveTab] = useState<'fila' | 'rotas' | 'divergencias' | 'historico_notas'>('fila');

  // Modais
  const [selectedExpedicao, setSelectedExpedicao] = useState<Expedicao | null>(null);
  const [isSeparacaoModalOpen, setIsSeparacaoModalOpen] = useState(false);
  const [isConferenciaModalOpen, setIsConferenciaModalOpen] = useState(false);
  const [isDivergenciaModalOpen, setIsDivergenciaModalOpen] = useState(false);
  const [isLiberacaoModalOpen, setIsLiberacaoModalOpen] = useState(false);
  const [isNotaPrintModalOpen, setIsNotaPrintModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNovaRotaModalOpen, setIsNovaRotaModalOpen] = useState(false);
  const [isReimprimirModalOpen, setIsReimprimirModalOpen] = useState(false);

  // States de Formulários
  const [separacaoLocal, setSeparacaoLocal] = useState('Galpão Central - Bancada A');
  const [conferenciaResultado, setConferenciaResultado] = useState<ResultadoConferencia>('aprovado');
  const [conferenciaVolumes, setConferenciaVolumes] = useState(1);
  const [conferenciaPeso, setConferenciaPeso] = useState(2.5);
  const [conferenciaEmbalagem, setConferenciaEmbalagem] = useState('Caixa Papelão Reforçada');
  const [conferenciaLacre, setConferenciaLacre] = useState(`LAC-${Math.floor(10000 + Math.random() * 90000)}`);
  const [conferenciaObs, setConferenciaObs] = useState('');
  const [conferenciaMotivoReprovacao, setConferenciaMotivoReprovacao] = useState('');

  // Divergencia Form
  const [divTipo, setDivTipo] = useState<TipoDivergencia>('material_em_falta');
  const [divItemNome, setDivItemNome] = useState('');
  const [divQtd, setDivQtd] = useState(1);
  const [divDescricao, setDivDescricao] = useState('');

  // Liberacao Form
  const [selectedMotoboyId, setSelectedMotoboyId] = useState('');
  const [liberacaoRetirouNome, setLiberacaoRetirouNome] = useState('');
  const [liberacaoRetirouDoc, setLiberacaoRetirouDoc] = useState('');
  const [liberacaoKmInicial, setLiberacaoKmInicial] = useState(12450);
  const [liberacaoHorarioSaida, setLiberacaoHorarioSaida] = useState(new Date().toTimeString().slice(0, 5));
  const [liberacaoObs, setLiberacaoObs] = useState('');

  // Reimpressao Justificativa
  const [reimpressaoMotivo, setReimpressaoMotivo] = useState('');

  // Realtime subscription to expedicoes
  useEffect(() => {
    setIsLoading(true);
    const unsubExp = expedicoesRepo.subscribe(
      (data) => {
        setExpedicoes(data as unknown as Expedicao[]);
        setIsLoading(false);
      },
      (err) => {
        console.error('Erro ao escutar expedições:', err);
        setIsLoading(false);
      }
    );

    const unsubRotas = rotasExpedicaoRepo.subscribe(
      (data) => {
        setRotas(data as unknown as RotaExpedicao[]);
      },
      (err) => console.error('Erro ao escutar rotas:', err)
    );

    return () => {
      unsubExp();
      unsubRotas();
    };
  }, []);

  // Auto-sync all active orders from pedidos to expedicoes so they appear immediately in Expedição
  useEffect(() => {
    if (!pedidos || pedidos.length === 0) return;
    const existingPedidoIds = new Set(expedicoes.map((e) => e.pedidoId));
    
    // Find active orders that don't have an expedicao entry yet
    const pendingToSync = pedidos.filter(
      (p) => !existingPedidoIds.has(p.id) && p.status !== 'cancelado'
    );

    if (pendingToSync.length > 0) {
      pendingToSync.forEach((p) => {
        expedicoesRepo.importarPedidoParaExpedicao(p as any, {
          id: currentUser?.id || 'sistema',
          nome: currentUser?.nome || 'Setor de Expedição',
        }).catch((e) => console.warn('Auto import order to expedicao:', e));
      });
    }
  }, [pedidos, expedicoes, currentUser]);

  // Sync selectedExpedicao with live updates
  useEffect(() => {
    if (selectedExpedicao) {
      const live = expedicoes.find((e) => e.id === selectedExpedicao.id);
      if (live) {
        setSelectedExpedicao(live);
      }
    }
  }, [expedicoes]);

  // When selectedMotoboyId changes in liberation modal, auto-fill credentials
  const handleSelectMotoboyChange = (mbId: string) => {
    setSelectedMotoboyId(mbId);
    if (!mbId) return;
    const mb = motoboys.find((m) => m.id === mbId);
    if (mb) {
      setLiberacaoRetirouNome(mb.nome);
      setLiberacaoRetirouDoc(mb.cnh || 'CNH Ativa - ' + (mb.placa || mb.placaMoto || ''));
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    const total = expedicoes.length;
    const aguardandoSep = expedicoes.filter((e) => e.status === 'aguardando_separacao').length;
    const emSep = expedicoes.filter((e) => e.status === 'em_separacao').length;
    const aguardandoConf = expedicoes.filter((e) => e.status === 'aguardando_conferencia').length;
    const comDiv = expedicoes.filter((e) => e.status === 'com_divergencia').length;
    const prontos = expedicoes.filter((e) => e.status === 'pronto_expedicao').length;
    const liberadosHoje = expedicoes.filter((e) => e.status === 'liberado_entrega' || e.status === 'em_rota').length;
    return { total, aguardandoSep, emSep, aguardandoConf, comDiv, prontos, liberadosHoje };
  }, [expedicoes]);

  // Gráfico de Rosca: Status dos Pedidos (Pendente de Separação, Em Separação, Pronto para Coleta)
  const donutStatusData = useMemo(() => {
    // 1. Pendente de Separação
    const pendente = expedicoes.filter((e) => e.status === 'aguardando_separacao').length;

    // 2. Em Separação (inclui em_separacao, aguardando_conferencia e divergencias em tratamento)
    const emSeparacao = expedicoes.filter(
      (e) => e.status === 'em_separacao' || e.status === 'aguardando_conferencia' || e.status === 'com_divergencia'
    ).length;

    // 3. Pronto para Coleta (pronto para expedição, liberado para entrega ou em rota)
    const prontoColeta = expedicoes.filter(
      (e) => e.status === 'pronto_expedicao' || e.status === 'liberado_entrega' || e.status === 'em_rota'
    ).length;

    const total = pendente + emSeparacao + prontoColeta;

    const items = [
      {
        name: 'Pendente de Separação',
        value: pendente,
        color: '#f59e0b', // Amber
        bgClass: 'bg-amber-500',
        lightBg: 'bg-amber-50',
        textClass: 'text-amber-700',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
        filterKey: 'aguardando_separacao',
        percent: total > 0 ? ((pendente / total) * 100).toFixed(1) : '0',
        descricao: 'Aguardando início da separação de materiais',
      },
      {
        name: 'Em Separação',
        value: emSeparacao,
        color: '#3b82f6', // Blue
        bgClass: 'bg-blue-500',
        lightBg: 'bg-blue-50',
        textClass: 'text-blue-700',
        badgeClass: 'bg-blue-100 text-blue-900 border-blue-200',
        filterKey: 'em_separacao',
        percent: total > 0 ? ((emSeparacao / total) * 100).toFixed(1) : '0',
        descricao: 'Na bancada, conferência ou pesagem de volumes',
      },
      {
        name: 'Pronto para Coleta',
        value: prontoColeta,
        color: '#10b981', // Emerald
        bgClass: 'bg-emerald-500',
        lightBg: 'bg-emerald-50',
        textClass: 'text-emerald-700',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
        filterKey: 'pronto_expedicao',
        percent: total > 0 ? ((prontoColeta / total) * 100).toFixed(1) : '0',
        descricao: 'Embalado e liberado para o motoboy designado',
      },
    ];

    return {
      total,
      pendente,
      emSeparacao,
      prontoColeta,
      items,
      chartItems: items.filter((i) => i.value > 0).length > 0 ? items : [{ name: 'Sem Pedidos', value: 1, color: '#e2e8f0', bgClass: 'bg-slate-300', lightBg: 'bg-slate-50', textClass: 'text-slate-500', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', filterKey: 'todos', percent: '0', descricao: 'Nenhum pedido cadastrado no momento' }],
    };
  }, [expedicoes]);

  // Lista filtrada
  const expedicoesFiltradas = useMemo(() => {
    return expedicoes.filter((exp) => {
      if (statusFilter !== 'todos' && exp.status !== statusFilter) return false;
      if (prioridadeFilter !== 'todos' && exp.prioridade !== prioridadeFilter) return false;
      if (zonaFilter !== 'todas' && exp.zonaEleitoral !== zonaFilter) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesNumero = exp.numeroPedido?.toLowerCase().includes(term);
        const matchesCliente = exp.clienteNome?.toLowerCase().includes(term);
        const matchesCandidato = exp.candidato?.toLowerCase().includes(term);
        const matchesBairro = exp.bairro?.toLowerCase().includes(term);
        const matchesNota = exp.notaEntrega?.numeroNota?.toLowerCase().includes(term);
        const matchesRastreio = exp.codigoRastreio?.toLowerCase().includes(term);
        const matchesMotoboy = exp.liberacao?.motoboyNome?.toLowerCase().includes(term);
        return matchesNumero || matchesCliente || matchesCandidato || matchesBairro || matchesNota || matchesRastreio || matchesMotoboy;
      }

      return true;
    });
  }, [expedicoes, statusFilter, prioridadeFilter, zonaFilter, searchTerm]);

  // Extrair Zonas Eleitorais Únicas
  const zonasDisponiveis = useMemo(() => {
    const setZ = new Set<string>();
    expedicoes.forEach((e) => {
      if (e.zonaEleitoral) setZ.add(e.zonaEleitoral);
    });
    return Array.from(setZ);
  }, [expedicoes]);

  // Pedidos prontos para serem importados que ainda não estão na expedição
  const pedidosImportaveis = useMemo(() => {
    const expedicaoPedidoIds = new Set(expedicoes.map((e) => e.pedidoId));
    return pedidos.filter(
      (p) => !expedicaoPedidoIds.has(p.id) && p.status !== 'cancelado'
    );
  }, [pedidos, expedicoes]);

  // Handler: Importar Pedido para Expedição
  const handleImportarPedido = async (pedido: Pedido) => {
    try {
      await expedicoesRepo.importarPedidoParaExpedicao(pedido as any, {
        id: currentUser.id,
        nome: currentUser.nome,
      });
      setIsImportModalOpen(false);
    } catch (err: any) {
      alert(`Erro ao importar pedido: ${err.message || err}`);
    }
  };

  // Sincronizar todos os pedidos ativos manualmente
  const handleSyncAllOrders = async () => {
    try {
      setIsLoading(true);
      for (const ped of pedidosImportaveis) {
        await expedicoesRepo.importarPedidoParaExpedicao(ped as any, {
          id: currentUser.id,
          nome: currentUser.nome,
        });
      }
      setIsLoading(false);
      alert(`${pedidosImportaveis.length} pedido(s) sincronizados com a fila de expedição!`);
    } catch (err: any) {
      setIsLoading(false);
      alert(`Erro ao sincronizar pedidos: ${err.message || err}`);
    }
  };

  // Handler: Iniciar Separação
  const handleIniciarSeparacao = async () => {
    if (!selectedExpedicao) return;
    try {
      await expedicoesRepo.iniciarSeparacao(
        selectedExpedicao.id,
        { id: currentUser.id, nome: currentUser.nome },
        separacaoLocal
      );
      setIsSeparacaoModalOpen(true);
    } catch (err: any) {
      alert(`Erro ao iniciar separação: ${err.message || err}`);
    }
  };

  // Handler: Alterar Quantidade/Status do Item de Separação
  const handleToggleItemSeparado = async (item: ItemExpedicao) => {
    if (!selectedExpedicao) return;
    const isSeparado = item.situacao === 'separado';
    const novaQtd = isSeparado ? 0 : item.quantidadeSolicitada;
    const novaSituacao: SituacaoItemExpedicao = isSeparado ? 'em_separacao' : 'separado';

    try {
      await expedicoesRepo.atualizarItemSeparacao(
        selectedExpedicao.id,
        item.id,
        {
          quantidadeSeparada: novaQtd,
          situacao: novaSituacao,
        },
        { id: currentUser.id, nome: currentUser.nome }
      );
    } catch (err: any) {
      alert(`Erro ao atualizar item: ${err.message || err}`);
    }
  };

  // Handler: Concluir Separação
  const handleConcluirSeparacao = async () => {
    if (!selectedExpedicao) return;
    try {
      await expedicoesRepo.finalizarSeparacao(selectedExpedicao.id, {
        id: currentUser.id,
        nome: currentUser.nome,
      });
      setIsSeparacaoModalOpen(false);
      alert('Separação finalizada com sucesso! O pedido agora está pronto para conferência ou liberação ao motoboy.');
    } catch (err: any) {
      alert(err.message || 'Erro ao finalizar separação.');
    }
  };

  // Handler: Registrar Conferência
  const handleRegistrarConferencia = async () => {
    if (!selectedExpedicao) return;
    if (conferenciaResultado === 'reprovado' && !conferenciaMotivoReprovacao.trim()) {
      alert('Informe a justificativa/motivo para reprovação da conferência.');
      return;
    }

    try {
      await expedicoesRepo.registrarConferencia(
        selectedExpedicao.id,
        {
          conferenteId: currentUser.id,
          conferenteNome: currentUser.nome,
          dataHora: new Date().toISOString(),
          resultado: conferenciaResultado,
          embalagem: conferenciaEmbalagem,
          numeroVolumes: Number(conferenciaVolumes) || 1,
          pesoTotalKg: Number(conferenciaPeso) || 1,
          lacreOuVolume: conferenciaLacre,
          observacoes: conferenciaObs,
          motivoReprovacao: conferenciaMotivoReprovacao,
        },
        { id: currentUser.id, nome: currentUser.nome }
      );
      setIsConferenciaModalOpen(false);
      alert(
        conferenciaResultado === 'aprovado'
          ? 'Conferência aprovada! Pedido pronto para designar motoboy e liberar a saída.'
          : 'Resultado da conferência registrado no histórico.'
      );
    } catch (err: any) {
      alert(`Erro ao registrar conferência: ${err.message || err}`);
    }
  };

  // Handler: Abrir Registro de Divergência
  const handleRegistrarDivergencia = async () => {
    if (!selectedExpedicao) return;
    if (!divDescricao.trim()) {
      alert('Por favor, descreva detalhadamente a divergência ou avaria.');
      return;
    }

    try {
      await expedicoesRepo.registrarDivergencia(
        {
          pedidoId: selectedExpedicao.pedidoId,
          numeroPedido: selectedExpedicao.numeroPedido,
          nomeMaterial: divItemNome || selectedExpedicao.itens?.[0]?.nomeMaterial || 'Material Geral',
          tipo: divTipo,
          quantidadeAfetada: Number(divQtd) || 1,
          descricao: divDescricao.trim(),
          registradoPorId: currentUser.id,
          registradoPorNome: currentUser.nome,
          dataHoraRegistro: new Date().toISOString(),
          status: 'aberta',
        },
        { id: currentUser.id, nome: currentUser.nome }
      );

      setIsDivergenciaModalOpen(false);
      setDivDescricao('');
      alert('Divergência registrada com sucesso! Notificação enviada à supervisão.');
    } catch (err: any) {
      alert(`Erro ao registrar divergência: ${err.message || err}`);
    }
  };

  // Handler: Resolver Divergência
  const handleResolverDivergencia = async (divId: string, solucaoTexto: string) => {
    if (!selectedExpedicao) return;
    if (!solucaoTexto.trim()) {
      alert('Digite a solução autorizada para a divergência.');
      return;
    }

    try {
      await expedicoesRepo.resolverDivergencia(
        divId,
        selectedExpedicao.pedidoId,
        {
          solucaoAdotada: solucaoTexto,
          autorizadoPorId: currentUser.id,
          autorizadoPorNome: currentUser.nome,
          novoStatusExpedicao: 'pronto_expedicao',
        },
        { id: currentUser.id, nome: currentUser.nome }
      );
      alert('Divergência resolvida e autorizada com sucesso!');
    } catch (err: any) {
      alert(`Erro ao resolver divergência: ${err.message || err}`);
    }
  };

  // Handler: Abrir Modal de Liberação com dados pré-carregados
  const handleAbrirLiberacaoModal = (exp: Expedicao) => {
    setSelectedExpedicao(exp);
    // Se o pedido já tiver um motoboy correspondente nas entregas ou itens
    const mbDefault = motoboys.find(m => m.status === 'disponivel') || motoboys[0];
    if (mbDefault && !selectedMotoboyId) {
      setSelectedMotoboyId(mbDefault.id);
      setLiberacaoRetirouNome(mbDefault.nome);
      setLiberacaoRetirouDoc(mbDefault.cnh || 'CNH ' + (mbDefault.placa || ''));
    }
    setConferenciaVolumes(exp.volumeTotal || Math.max(1, Math.ceil((exp.quantidadeTotalItens || 100) / 500)));
    setConferenciaPeso(exp.pesoTotalKg || Math.max(2, Math.round((exp.quantidadeTotalItens || 100) / 40)));
    setConferenciaLacre(`LAC-2026-${Math.floor(10000 + Math.random() * 90000)}`);
    setLiberacaoHorarioSaida(new Date().toTimeString().slice(0, 5));
    setIsLiberacaoModalOpen(true);
  };

  // Handler: Liberar para Entrega e Gerar Nota
  const handleLiberarParaEntrega = async () => {
    if (!selectedExpedicao) return;
    const mb = motoboys.find((m) => m.id === selectedMotoboyId);

    if (!selectedMotoboyId && !liberacaoRetirouNome.trim()) {
      alert('Por favor, selecione o motoboy designado ou informe o nome do portador responsável pela retirada.');
      return;
    }

    try {
      const res = await expedicoesRepo.liberarParaEntrega(
        selectedExpedicao.id,
        {
          motoboyId: mb?.id || '',
          motoboyNome: mb?.nome || liberacaoRetirouNome.trim() || 'Entregador Autorizado',
          motoboyTelefone: mb?.telefone || '',
          veiculoModelo: mb?.veiculo || 'Moto de Entrega',
          veiculoPlaca: mb?.placa || mb?.placaMoto || 'N/A',
          dataSaida: new Date().toISOString().slice(0, 10),
          horarioPrevisto: selectedExpedicao.dataPrevisaoSaida?.slice(11, 16) || '14:00',
          horarioRealSaida: liberacaoHorarioSaida,
          kmInicial: Number(liberacaoKmInicial) || 12450,
          quantidadeVolumes: Number(conferenciaVolumes) || selectedExpedicao.conferencia?.numeroVolumes || selectedExpedicao.volumeTotal || 1,
          pesoTotalKg: Number(conferenciaPeso) || selectedExpedicao.conferencia?.pesoTotalKg || selectedExpedicao.pesoTotalKg || 2.5,
          numeroLacre: conferenciaLacre || selectedExpedicao.conferencia?.lacreOuVolume || `LAC-${Math.floor(10000 + Math.random() * 90000)}`,
          responsavelLiberacaoId: currentUser.id,
          responsavelLiberacaoNome: currentUser.nome,
          nomeRetirou: liberacaoRetirouNome.trim() || mb?.nome || 'Entregador Autorizado',
          documentoRetirou: liberacaoRetirouDoc.trim() || mb?.cnh || 'RG/CPF informado no balcão',
          observacoes: liberacaoObs,
        },
        { id: currentUser.id, nome: currentUser.nome }
      );

      setIsLiberacaoModalOpen(false);

      // Atualiza estado local e abre modal de impressão da Nota automaticamente
      const updatedExp = {
        ...selectedExpedicao,
        status: 'liberado_entrega' as const,
        notaEntrega: {
          id: `nota-${selectedExpedicao.id}`,
          numeroNota: res.notaNumero,
          pedidoId: selectedExpedicao.pedidoId,
          numeroPedido: selectedExpedicao.numeroPedido,
          codigoRastreio: res.codigoRastreio,
          dataEmissao: new Date().toISOString(),
          clienteNome: selectedExpedicao.clienteNome,
          candidato: selectedExpedicao.candidato,
          partido: selectedExpedicao.partido || '',
          cnpjCpf: '',
          telefone: selectedExpedicao.telefone,
          enderecoCompleto: selectedExpedicao.enderecoCompleto,
          bairro: selectedExpedicao.bairro,
          cidade: selectedExpedicao.cidade,
          zonaEleitoral: selectedExpedicao.zonaEleitoral,
          motoboyNome: mb?.nome || liberacaoRetirouNome,
          motoboyTelefone: mb?.telefone,
          veiculoPlaca: mb?.placa || mb?.placaMoto,
          veiculoModelo: mb?.veiculo,
          horarioPrevisto: selectedExpedicao.dataPrevisaoSaida?.slice(11, 16) || '14:00',
          horarioSaidaReal: liberacaoHorarioSaida,
          itens: selectedExpedicao.itens || [],
          quantidadeVolumes: Number(conferenciaVolumes) || selectedExpedicao.volumeTotal || 1,
          pesoTotalKg: Number(conferenciaPeso) || selectedExpedicao.pesoTotalKg || 2.5,
          numeroLacre: conferenciaLacre || 'N/A',
          separadoPor: selectedExpedicao.separadorNome || currentUser.nome,
          conferidoPor: selectedExpedicao.conferencia?.conferenteNome || currentUser.nome,
          liberadoPor: currentUser.nome,
          retiradoPor: liberacaoRetirouNome.trim() || mb?.nome || 'Entregador',
          documentoRetirador: liberacaoRetirouDoc.trim() || mb?.cnh || '',
          observacoes: liberacaoObs,
          reimpressoes: [],
        }
      };

      setSelectedExpedicao(updatedExp);
      setIsNotaPrintModalOpen(true);
    } catch (err: any) {
      alert(`Erro ao liberar expedição: ${err.message || err}`);
    }
  };

  // Handler: Reimpressão com Justificativa
  const handleRegistrarReimpressao = async () => {
    if (!selectedExpedicao || !selectedExpedicao.notaEntrega) return;
    if (!reimpressaoMotivo.trim()) {
      alert('Para fins de auditoria eleitoral, informe a justificativa da reimpressão da Nota.');
      return;
    }

    try {
      await expedicoesRepo.registrarReimpressaoNota(
        selectedExpedicao.id,
        reimpressaoMotivo.trim(),
        { id: currentUser.id, nome: currentUser.nome }
      );
      setIsReimprimirModalOpen(false);
      setReimpressaoMotivo('');
      window.print();
    } catch (err: any) {
      alert(`Erro ao registrar reimpressão: ${err.message || err}`);
    }
  };

  return (
    <div className="space-y-6 pb-12" id="expedicao-main-container">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600 text-white rounded-lg shadow-xs">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expedição & Separação de Materiais</h1>
              <p className="text-sm text-slate-500">
                Fluxo completo de picking, conferência de volumes, controle de divergências e emissão de notas de saída eleitorais
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {pedidosImportaveis.length > 0 && (
            <button
              onClick={handleSyncAllOrders}
              id="btn-sync-pedidos-exp"
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm rounded-lg border border-slate-300 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-amber-600" />
              Sincronizar Pedidos ({pedidosImportaveis.length})
            </button>
          )}

          <button
            onClick={() => setIsImportModalOpen(true)}
            id="btn-importar-pedidos-exp"
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Importar Pedidos ({pedidosImportaveis.length})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Aguardando</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">{kpis.aguardandoSep}</span>
            <p className="text-xs text-slate-500 mt-0.5">p/ iniciar separação</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Em Separação</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-blue-700">{kpis.emSep}</span>
            <p className="text-xs text-slate-500 mt-0.5">na bancada / picking</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Conferência</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-purple-700">{kpis.aguardandoConf}</span>
            <p className="text-xs text-slate-500 mt-0.5">pesagem e volumes</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Divergências</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-rose-700">{kpis.comDiv}</span>
            <p className="text-xs text-slate-500 mt-0.5">bloqueados p/ ajuste</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Prontos Saída</span>
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-teal-700">{kpis.prontos}</span>
            <p className="text-xs text-slate-500 mt-0.5">aguardando motoboy</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Liberados Hoje</span>
            <Truck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-700">{kpis.liberadosHoje}</span>
            <p className="text-xs text-slate-500 mt-0.5">em rota / entregues</p>
          </div>
        </div>
      </div>

      {/* Visualizador Gráfico de Rosca - Status dos Pedidos na Expedição */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs" id="grafico-rosca-expedicao">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-50 text-amber-700 rounded-md">
                <Boxes className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900">Status dos Pedidos na Expedição</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Distribuição em tempo real dos pedidos entre <strong className="text-amber-700 font-semibold">Pendente de Separação</strong>, <strong className="text-blue-700 font-semibold">Em Separação</strong> e <strong className="text-emerald-700 font-semibold">Pronto para Coleta</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">
              Total no Fluxo: {donutStatusData.total} {donutStatusData.total === 1 ? 'pedido' : 'pedidos'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Lado Esquerdo: Gráfico de Rosca (Donut Chart) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div className="w-full h-56 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutStatusData.chartItems}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={donutStatusData.total > 0 ? 4 : 0}
                    dataKey="value"
                    nameKey="name"
                    animationDuration={800}
                  >
                    {donutStatusData.chartItems.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `${value} ${value === 1 ? 'pedido' : 'pedidos'} (${donutStatusData.total > 0 ? ((Number(value) / donutStatusData.total) * 100).toFixed(1) : 0}%)`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      padding: '8px 12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    itemStyle={{ color: '#ffffff', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Indicador Central no Miolo da Rosca */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-2xl font-extrabold text-slate-900 leading-none tracking-tight">
                  {donutStatusData.total}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                  {donutStatusData.total === 1 ? 'Pedido' : 'Pedidos'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-1 font-medium text-center">
              {donutStatusData.total === 0 ? 'Nenhum pedido ativo na fila' : 'Clique nos status ao lado para filtrar a fila'}
            </p>
          </div>

          {/* Lado Direito: Cards de Detalhamento com Percentuais e Ações Rápidas */}
          <div className="lg:col-span-7 space-y-3">
            {donutStatusData.items.map((item, index) => {
              const isActiveFilter = statusFilter === item.filterKey;
              return (
                <div
                  key={index}
                  onClick={() => {
                    setActiveTab('fila');
                    setStatusFilter(isActiveFilter ? 'todos' : item.filterKey);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isActiveFilter
                      ? 'border-slate-800 bg-slate-50 shadow-xs ring-1 ring-slate-800'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full mt-1 shrink-0 ring-4 ring-slate-100"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{item.name}</span>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${item.badgeClass}`}>
                          {item.percent}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{item.descricao}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-slate-900">
                        {item.value}
                      </span>
                      <span className="text-xs text-slate-400 font-medium ml-1">
                        {item.value === 1 ? 'ped.' : 'peds.'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors border ${
                        isActiveFilter
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isActiveFilter ? 'Filtrado' : 'Filtrar'}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Barra de Distribuição Visual Linear Complementar */}
            {donutStatusData.total > 0 && (
              <div className="pt-2">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  {donutStatusData.items.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        width: `${item.percent}%`,
                        backgroundColor: item.color,
                      }}
                      className="h-full transition-all duration-500"
                      title={`${item.name}: ${item.value} (${item.percent}%)`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs & Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('fila')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'fila'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Fila de Expedição ({expedicoes.length})
        </button>

        <button
          onClick={() => setActiveTab('divergencias')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'divergencias'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Divergências & Avarias ({kpis.comDiv})
        </button>

        <button
          onClick={() => setActiveTab('rotas')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'rotas'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Navigation className="w-4 h-4" />
          Agrupamento em Rotas ({rotas.length})
        </button>
      </div>

      {/* Main Tab: Fila de Expedição */}
      {activeTab === 'fila' && (
        <div className="space-y-4">
          {/* Filters and Search Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por Nº Pedido, Comitê, Candidato, Nota ou Bairro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="todos">Todos os Status</option>
                <option value="aguardando_separacao">Aguardando Separação</option>
                <option value="em_separacao">Em Separação</option>
                <option value="aguardando_conferencia">Aguardando Conferência</option>
                <option value="com_divergencia">Com Divergência</option>
                <option value="pronto_expedicao">Pronto p/ Expedição</option>
                <option value="liberado_entrega">Liberado p/ Entrega</option>
                <option value="em_rota">Em Rota / Trânsito</option>
              </select>
            </div>

            <div>
              <select
                value={zonaFilter}
                onChange={(e) => setZonaFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="todas">Todas as Zonas Eleitorais</option>
                {zonasDisponiveis.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expedição Cards Table */}
          {isLoading ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-600 mx-auto" />
              <p className="mt-2 text-sm text-slate-500">Carregando fila de expedição do Firestore...</p>
            </div>
          ) : expedicoesFiltradas.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">Nenhum pedido encontrado na fila</h3>
              <p className="text-sm text-slate-500 mt-1">
                {searchTerm || statusFilter !== 'todos'
                  ? 'Tente ajustar os filtros de busca acima.'
                  : 'Importe pedidos aprovados para iniciar o fluxo de separação.'}
              </p>
              {pedidosImportaveis.length > 0 && (
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Importar Pedidos Disponíveis ({pedidosImportaveis.length})
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {expedicoesFiltradas.map((exp) => {
                const statusInfo = formatStatusExpedicao(exp.status);
                const prioridadeInfo = formatPrioridadePedido(exp.prioridade);
                const totalItens = exp.itens?.reduce((acc, i) => acc + (i.quantidadeSolicitada || 0), 0) || 0;
                const separados = exp.itens?.filter((i) => i.situacao === 'separado' || i.situacao === 'conferido').length || 0;

                return (
                  <div
                    key={exp.id}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Info Principal */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-base text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                            {exp.numeroPedido}
                          </span>

                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.border} border`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                            {statusInfo.label}
                          </span>

                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${prioridadeInfo.badgeClass}`}>
                            {prioridadeInfo.label}
                          </span>

                          {exp.notaEntrega && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-200">
                              <FileCheck className="w-3.5 h-3.5" />
                              Nota: {exp.notaEntrega.numeroNota}
                            </span>
                          )}

                          {exp.codigoRastreio && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-cyan-100 text-cyan-800 rounded-full text-xs font-semibold border border-cyan-200">
                              <QrCode className="w-3.5 h-3.5" />
                              {exp.codigoRastreio}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-1.5 gap-x-6 text-sm text-slate-600 pt-1">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-800">{exp.clienteNome}</span>
                            <span className="text-xs text-slate-400">({exp.candidato})</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="truncate">{exp.bairro} - {exp.cidade} ({exp.zonaEleitoral})</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>
                              {exp.itens?.length || 0} tipos de material ({totalItens} un) • {exp.volumeTotal || 1} vol • {exp.pesoTotalKg || 2} kg
                            </span>
                          </div>
                        </div>

                        {/* Detalhes de Separação / Conferente / Motoboy Designado */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                          {exp.separadorNome && (
                            <span>
                              Separador: <strong className="text-slate-700">{exp.separadorNome}</strong> ({exp.localSeparacao || 'Bancada 1'})
                            </span>
                          )}
                          {exp.conferencia?.conferenteNome && (
                            <span>
                              Conferido por: <strong className="text-slate-700">{exp.conferencia.conferenteNome}</strong> (Lacre: {exp.conferencia.lacreOuVolume})
                            </span>
                          )}
                          {exp.liberacao?.motoboyNome ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 font-semibold rounded-lg border border-emerald-200">
                              <Truck className="w-3.5 h-3.5 text-emerald-600" />
                              Motoboy Designado: <strong className="text-emerald-950">{exp.liberacao.motoboyNome}</strong> ({exp.liberacao.veiculoPlaca})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 font-medium rounded-lg border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Aguardando designação de motoboy
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* 1. Botão Principal: Liberar p/ Motoboy (Disponível em qualquer etapa antes da saída) */}
                        {exp.status !== 'liberado_entrega' && exp.status !== 'em_rota' && exp.status !== 'entregue' && (
                          <button
                            onClick={() => handleAbrirLiberacaoModal(exp)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Liberar Material p/ Motoboy
                          </button>
                        )}

                        {/* 2. Separação */}
                        {exp.status === 'aguardando_separacao' && (
                          <button
                            onClick={() => {
                              setSelectedExpedicao(exp);
                              handleIniciarSeparacao();
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 text-blue-600" />
                            Iniciar Separação
                          </button>
                        )}

                        {exp.status === 'em_separacao' && (
                          <button
                            onClick={() => {
                              setSelectedExpedicao(exp);
                              setIsSeparacaoModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors"
                          >
                            <Package className="w-3.5 h-3.5 text-blue-600" />
                            Bancada de Separação ({separados}/{exp.itens?.length || 0})
                          </button>
                        )}

                        {/* 3. Conferência */}
                        {exp.status === 'aguardando_conferencia' && (
                          <button
                            onClick={() => {
                              setSelectedExpedicao(exp);
                              setConferenciaVolumes(exp.volumeTotal || 1);
                              setConferenciaPeso(exp.pesoTotalKg || 2.5);
                              setIsConferenciaModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg border border-purple-200 transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                            Conferência
                          </button>
                        )}

                        {/* 4. Divergência */}
                        {exp.status === 'com_divergencia' && (
                          <button
                            onClick={() => {
                              setSelectedExpedicao(exp);
                              setActiveTab('divergencias');
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Ver Divergência
                          </button>
                        )}

                        {/* 5. Imprimir Nota / Romaneio */}
                        {exp.notaEntrega && (
                          <button
                            onClick={() => {
                              setSelectedExpedicao(exp);
                              setIsNotaPrintModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-400" />
                            Imprimir Romaneio / Nota
                          </button>
                        )}

                        {/* Registrar Divergência Avulsa */}
                        <button
                          onClick={() => {
                            setSelectedExpedicao(exp);
                            setDivItemNome(exp.itens?.[0]?.nomeMaterial || '');
                            setIsDivergenciaModalOpen(true);
                          }}
                          title="Reportar Avaria ou Falta"
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Divergências */}
      {activeTab === 'divergencias' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Painel de Divergências & Controle de Qualidade</h2>
            <p className="text-sm text-slate-500 mb-6">
              Ocorrências de materiais faltantes, avariados ou divergentes registradas durante o fluxo de expedição eleitoral.
            </p>

            {expedicoes.filter((e) => (e.divergencias?.length || 0) > 0).length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Nenhuma divergência registrada no momento</p>
                <p className="text-xs text-slate-500">Todas as separações estão operando conforme o padrão de conformidade.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expedicoes
                  .filter((e) => (e.divergencias?.length || 0) > 0)
                  .map((exp) => (
                    <div key={exp.id} className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{exp.numeroPedido}</span>
                          <span className="text-sm text-slate-600">• {exp.clienteNome} ({exp.candidato})</span>
                        </div>
                        <span className="text-xs text-slate-500">Zona: {exp.zonaEleitoral}</span>
                      </div>

                      <div className="space-y-2">
                        {exp.divergencias?.map((div) => (
                          <div
                            key={div.id}
                            className={`p-3 rounded-lg border ${
                              div.status === 'aberta' ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    div.status === 'aberta' ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'
                                  }`}>
                                    {div.status === 'aberta' ? 'ABERTA / PENDENTE' : 'RESOLVIDA'}
                                  </span>
                                  <span className="font-semibold text-sm text-slate-800">
                                    {formatTipoDivergencia(div.tipo)}
                                  </span>
                                  <span className="text-xs text-slate-500">({div.quantidadeAfetada} afetado)</span>
                                </div>
                                <p className="text-sm text-slate-700 mt-1">{div.descricao}</p>
                                <p className="text-xs text-slate-400 mt-1">
                                  Registrado por {div.registradoPorNome} em {formatDateTime(div.dataHoraRegistro)}
                                </p>

                                {div.solucaoAdotada && (
                                  <div className="mt-2 text-xs bg-white p-2 rounded border border-slate-200 text-slate-700">
                                    <strong>Solução Adotada:</strong> {div.solucaoAdotada} (Autorizado por:{' '}
                                    {div.autorizadoPorNome})
                                  </div>
                                )}
                              </div>

                              {div.status === 'aberta' && (
                                <button
                                  onClick={() => {
                                    const sol = prompt('Informe a autorização e solução técnica adotada:');
                                    if (sol) {
                                      setSelectedExpedicao(exp);
                                      handleResolverDivergencia(div.id, sol);
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs shrink-0"
                                >
                                  Autorizar / Resolver
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Agrupamento em Rotas */}
      {activeTab === 'rotas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Planejamento e Despacho de Rotas</h2>
              <p className="text-sm text-slate-500">Agrupamento de pedidos expedidos por região e entregador</p>
            </div>
            <button
              onClick={() => {
                const prontos = expedicoes.filter((e) => e.status === 'pronto_expedicao' || e.status === 'liberado_entrega');
                if (prontos.length === 0) {
                  alert('Não há pedidos prontos para agrupar em rotas no momento.');
                  return;
                }
                setIsNovaRotaModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-lg shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Criar Nova Rota de Expedição
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rotas.length === 0 ? (
              <div className="md:col-span-2 p-12 text-center bg-white rounded-xl border border-slate-200">
                <Navigation className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Nenhuma rota de despacho ativa</p>
                <p className="text-xs text-slate-500">Crie uma rota para consolidar saídas de múltiplos comitês.</p>
              </div>
            ) : (
              rotas.map((rota) => (
                <div key={rota.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-base">{rota.codigoRota}</span>
                      <p className="text-xs text-slate-500">{rota.nome}</p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200">
                      {rota.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400">Entregador:</span>
                      <p className="font-semibold text-slate-800">{rota.motoboyNome || 'Não atribuído'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Veículo / Placa:</span>
                      <p className="font-semibold text-slate-800">{rota.veiculoPlaca || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Pedidos / Paradas:</span>
                      <p className="font-semibold text-slate-800">{rota.pedidos?.length || 0} comitês</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Carga Total:</span>
                      <p className="font-semibold text-slate-800">{rota.totalVolumes || 1} vol • {rota.pesoTotalKg || 5} kg</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-700 block mb-1">Comitês nesta rota:</span>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {rota.pedidos?.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 p-1.5 rounded">
                          <span className="font-medium text-slate-800">{idx + 1}. {p.clienteNome}</span>
                          <span className="text-slate-500">{p.bairro} ({p.volumes} vol)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: BANCADA DE SEPARAÇÃO (PICKING INTERATIVO)
         ========================================================================= */}
      {isSeparacaoModalOpen && selectedExpedicao && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                    <Package className="w-5 h-5" />
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">Bancada de Separação de Materiais</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Pedido <strong>{selectedExpedicao.numeroPedido}</strong> • {selectedExpedicao.clienteNome} ({selectedExpedicao.candidato})
                </p>
              </div>
              <button
                onClick={() => setIsSeparacaoModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center justify-between">
              <span>
                Local de Separação: <strong>{selectedExpedicao.localSeparacao || separacaoLocal}</strong> • Separador: <strong>{currentUser.nome}</strong>
              </span>
              <span className="font-semibold">
                Progresso: {selectedExpedicao.itens?.filter((i) => i.situacao === 'separado').length || 0} / {selectedExpedicao.itens?.length || 0} itens
              </span>
            </div>

            {/* Checklist de Itens */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {selectedExpedicao.itens?.map((item) => {
                const isSeparado = item.situacao === 'separado';
                const sit = formatSituacaoItemExpedicao(item.situacao);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                      isSeparado ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">{item.nomeMaterial}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${sit.badgeClass}`}>
                          {sit.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {item.descricao || 'Sem especificação adicional'} • Setor: {item.localizacaoEstoque || 'Estoque Central'}
                      </p>
                      <div className="text-xs text-slate-700">
                        Qtd Solicitada: <strong>{item.quantidadeSolicitada} {item.unidadeMedida}</strong> | Separado: <strong>{item.quantidadeSeparada}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleItemSeparado(item)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          isSeparado
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isSeparado ? 'Separado 100%' : 'Confirmar Item'}
                      </button>

                      <button
                        onClick={() => {
                          setDivItemNome(item.nomeMaterial);
                          setIsDivergenciaModalOpen(true);
                        }}
                        title="Reportar Avaria/Falta"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                onClick={() => setIsSeparacaoModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg"
              >
                Salvar e Continuar Depois
              </button>

              <button
                onClick={handleConcluirSeparacao}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                Concluir Separação & Enviar para Conferência
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: CONFERÊNCIA & PESAGEM DE VOLUMES
         ========================================================================= */}
      {isConferenciaModalOpen && selectedExpedicao && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">Conferência & Inspeção de Carga</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Pedido <strong>{selectedExpedicao.numeroPedido}</strong> • {selectedExpedicao.clienteNome}
                </p>
              </div>
              <button onClick={() => setIsConferenciaModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resultado da Inspeção</label>
                <select
                  value={conferenciaResultado}
                  onChange={(e) => setConferenciaResultado(e.target.value as ResultadoConferencia)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold"
                >
                  <option value="aprovado">Aprovado 100% (Sem divergências)</option>
                  <option value="aprovado_com_ressalva">Aprovado com Ressalva Operacional</option>
                  <option value="reprovado">Reprovado (Devolver à Bancada)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Embalagem</label>
                <input
                  type="text"
                  value={conferenciaEmbalagem}
                  onChange={(e) => setConferenciaEmbalagem(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Número de Volumes (Caixas/Pacotes)</label>
                <input
                  type="number"
                  min="1"
                  value={conferenciaVolumes}
                  onChange={(e) => setConferenciaVolumes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Peso Total Aferido (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={conferenciaPeso}
                  onChange={(e) => setConferenciaPeso(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Número do Lacre Eleitoral / Selo</label>
                <input
                  type="text"
                  value={conferenciaLacre}
                  onChange={(e) => setConferenciaLacre(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>

              {conferenciaResultado === 'reprovado' && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-rose-700 mb-1">Motivo da Reprovação (Obrigatório)</label>
                  <textarea
                    rows={2}
                    value={conferenciaMotivoReprovacao}
                    onChange={(e) => setConferenciaMotivoReprovacao(e.target.value)}
                    placeholder="Descreva o motivo da devolução para a separação..."
                    className="w-full px-3 py-2 bg-rose-50 border border-rose-300 rounded-lg text-sm"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações da Qualidade</label>
                <textarea
                  rows={2}
                  value={conferenciaObs}
                  onChange={(e) => setConferenciaObs(e.target.value)}
                  placeholder="Informações adicionais sobre acondicionamento ou manuseio..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setIsConferenciaModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg"
              >
                Cancelar
              </button>

              <button
                onClick={handleRegistrarConferencia}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-lg shadow-sm"
              >
                Confirmar Conferência
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: REGISTRO DE DIVERGÊNCIA / AVARIA
         ========================================================================= */}
      {isDivergenciaModalOpen && selectedExpedicao && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <h2 className="text-base font-bold text-slate-900">Registrar Divergência Operacional</h2>
              </div>
              <button onClick={() => setIsDivergenciaModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo da Divergência</label>
                <select
                  value={divTipo}
                  onChange={(e) => setDivTipo(e.target.value as TipoDivergencia)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="material_em_falta">Material em Falta no Estoque</option>
                  <option value="quantidade_incorreta">Quantidade Incorreta Separada</option>
                  <option value="material_danificado">Material Danificado / Rasgado / Molhado</option>
                  <option value="material_diferente">Material Diferente do Pedido</option>
                  <option value="problema_impressao">Problema na Gráfica / Impressão</option>
                  <option value="embalagem_danificada">Embalagem Avariada</option>
                  <option value="outro">Outro Motivo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Material Afetado</label>
                <input
                  type="text"
                  value={divItemNome}
                  onChange={(e) => setDivItemNome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantidade Afetada</label>
                <input
                  type="number"
                  min="1"
                  value={divQtd}
                  onChange={(e) => setDivQtd(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição Detalhada do Problema</label>
                <textarea
                  rows={3}
                  value={divDescricao}
                  onChange={(e) => setDivDescricao(e.target.value)}
                  placeholder="Explique o que ocorreu com o material..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setIsDivergenciaModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegistrarDivergencia}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Salvar Divergência
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: LIBERAÇÃO & DESPACHO (CRIAÇÃO DE NOTA & ATRIBUIÇÃO MOTOBOY)
         ========================================================================= */}
      {isLiberacaoModalOpen && selectedExpedicao && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <Send className="w-5 h-5" />
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">Liberação de Expedição & Emissão de Nota</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Pedido <strong>{selectedExpedicao.numeroPedido}</strong> • Destino: {selectedExpedicao.bairro} ({selectedExpedicao.zonaEleitoral})
                </p>
              </div>
              <button onClick={() => setIsLiberacaoModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumo dos Materiais a Liberar */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Materiais a Despachar ({selectedExpedicao.itens?.length || 0} itens)
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  Total: {selectedExpedicao.itens?.reduce((acc, i) => acc + (i.quantidadeSolicitada || 0), 0) || 0} un
                </span>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {selectedExpedicao.itens?.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-100">
                    <span className="font-medium text-slate-800">{it.nomeMaterial}</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {it.quantidadeSeparada || it.quantidadeSolicitada} {it.unidadeMedida || 'un'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Entregador / Motoboy Designado *</label>
                <select
                  value={selectedMotoboyId}
                  onChange={(e) => handleSelectMotoboyChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold"
                >
                  <option value="">Selecione um entregador credenciado...</option>
                  {motoboys.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome} - {m.placa || m.placaMoto || 'Moto'} ({m.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Horário Real de Saída</label>
                <input
                  type="time"
                  value={liberacaoHorarioSaida}
                  onChange={(e) => setLiberacaoHorarioSaida(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Portador / Quem Retirou</label>
                <input
                  type="text"
                  placeholder="Nome do portador/motoboy"
                  value={liberacaoRetirouNome}
                  onChange={(e) => setLiberacaoRetirouNome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Documento de Identificação (RG / CNH)</label>
                <input
                  type="text"
                  placeholder="RG / CNH do portador"
                  value={liberacaoRetirouDoc}
                  onChange={(e) => setLiberacaoRetirouDoc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Volumes (Pacotes / Caixas)</label>
                <input
                  type="number"
                  min="1"
                  value={conferenciaVolumes}
                  onChange={(e) => setConferenciaVolumes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Peso Total Estimado (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={conferenciaPeso}
                  onChange={(e) => setConferenciaPeso(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lacre de Segurança Eleitoral</label>
                <input
                  type="text"
                  value={conferenciaLacre}
                  onChange={(e) => setConferenciaLacre(e.target.value)}
                  placeholder="LAC-2026-XXXXX"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-amber-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">KM Inicial do Veículo</label>
                <input
                  type="number"
                  value={liberacaoKmInicial}
                  onChange={(e) => setLiberacaoKmInicial(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instruções de Entrega / Observações</label>
                <textarea
                  rows={2}
                  value={liberacaoObs}
                  onChange={(e) => setLiberacaoObs(e.target.value)}
                  placeholder="Ex: Entregar exclusivamente ao responsável do comitê com assinatura..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setIsLiberacaoModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg"
              >
                Cancelar
              </button>

              <button
                onClick={handleLiberarParaEntrega}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-sm"
              >
                <FileCheck className="w-4 h-4" />
                Gerar Nota & Liberar Saída
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: IMPRESSÃO DA NOTA DE ENTREGA / ROMANEIO
         ========================================================================= */}
      {isNotaPrintModalOpen && selectedExpedicao?.notaEntrega && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            {/* Print Header Controls (Hidden during print) */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-900">Nota de Entrega & Romaneio de Carga</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsReimprimirModalOpen(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Reimprimir com Justificativa
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Imprimir Agora
                </button>
                <button
                  onClick={() => setIsNotaPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body (Print Friendly Layout) */}
            <div className="border border-slate-300 p-6 rounded-lg space-y-6 text-slate-800 text-sm">
              <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">FLEETMOTO LOGÍSTICA ELEITORAL</h1>
                  <p className="text-xs text-slate-500">Comprovante Oficial de Despacho e Saída de Carga</p>
                  <p className="text-xs text-slate-500">Conformidade com a Resolução TSE 23.610/2019</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-lg text-slate-900 block">
                    {selectedExpedicao.notaEntrega.numeroNota}
                  </span>
                  <span className="text-xs text-slate-500">
                    Emissão: {formatDateTime(selectedExpedicao.notaEntrega.dataEmissao)}
                  </span>
                </div>
              </div>

              {/* Grid de Informações */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <strong className="text-slate-900 block mb-1">DADOS DO DESTINATÁRIO / COMITÊ</strong>
                  <p><strong>Comitê:</strong> {selectedExpedicao.notaEntrega.clienteNome}</p>
                  <p><strong>Candidato:</strong> {selectedExpedicao.notaEntrega.candidato} ({selectedExpedicao.notaEntrega.partido})</p>
                  <p><strong>Endereço:</strong> {selectedExpedicao.notaEntrega.enderecoCompleto}</p>
                  <p><strong>Bairro / Cidade:</strong> {selectedExpedicao.notaEntrega.bairro} - {selectedExpedicao.notaEntrega.cidade}</p>
                  <p><strong>Zona Eleitoral:</strong> {selectedExpedicao.notaEntrega.zonaEleitoral}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                  <strong className="text-slate-900 block mb-1">DADOS DO TRANSPORTE & EXPEDIÇÃO</strong>
                  <p><strong>Pedido Original:</strong> {selectedExpedicao.notaEntrega.numeroPedido}</p>
                  <p><strong>Rastreio:</strong> {selectedExpedicao.notaEntrega.codigoRastreio}</p>
                  <p><strong>Entregador:</strong> {selectedExpedicao.notaEntrega.motoboyNome} ({selectedExpedicao.notaEntrega.veiculoPlaca})</p>
                  <p><strong>Volumes / Peso:</strong> {selectedExpedicao.notaEntrega.quantidadeVolumes} vol • {selectedExpedicao.notaEntrega.pesoTotalKg} kg</p>
                  <p><strong>Lacre:</strong> {selectedExpedicao.notaEntrega.numeroLacre || 'N/A'}</p>
                </div>
              </div>

              {/* Tabela de Itens */}
              <div>
                <strong className="text-xs text-slate-900 block mb-2">RELAÇÃO DE MATERIAIS EXPEDIDOS</strong>
                <table className="w-full text-xs text-left border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-2 border-b">Material</th>
                      <th className="p-2 border-b text-right">Qtd Solicitada</th>
                      <th className="p-2 border-b text-right">Qtd Expedida</th>
                      <th className="p-2 border-b">Unidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedExpedicao.notaEntrega.itens?.map((it, idx) => (
                      <tr key={idx} className="border-b border-slate-100">
                        <td className="p-2 font-medium">{it.nomeMaterial}</td>
                        <td className="p-2 text-right">{it.quantidadeSolicitada}</td>
                        <td className="p-2 text-right font-bold">{it.quantidadeSeparada || it.quantidadeSolicitada}</td>
                        <td className="p-2 text-slate-500">{it.unidadeMedida}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Assinaturas */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 text-xs">
                <div className="text-center">
                  <div className="border-b border-slate-400 pb-1 mb-1 font-medium">
                    {selectedExpedicao.notaEntrega.liberadoPor}
                  </div>
                  <span className="text-slate-500">Responsável pela Expedição (FleetMoto)</span>
                </div>

                <div className="text-center">
                  <div className="border-b border-slate-400 pb-1 mb-1 font-medium">
                    {selectedExpedicao.notaEntrega.retiradoPor} ({selectedExpedicao.notaEntrega.documentoRetirador})
                  </div>
                  <span className="text-slate-500">Assinatura do Portador / Entregador</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: REIMPRESSÃO COM JUSTIFICATIVA
         ========================================================================= */}
      {isReimprimirModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Justificativa de Reimpressão</h3>
            <p className="text-xs text-slate-500">
              Para auditoria e conformidade eleitoral, registre o motivo da reimpressão da Nota de Entrega.
            </p>
            <textarea
              rows={3}
              value={reimpressaoMotivo}
              onChange={(e) => setReimpressaoMotivo(e.target.value)}
              placeholder="Ex: Danificação física da 1ª via durante o carregamento..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsReimprimirModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegistrarReimpressao}
                className="px-4 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Confirmar & Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 7: IMPORTAR PEDIDOS DISPONÍVEIS
         ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Importar Pedidos para a Expedição</h2>
              <button onClick={() => setIsImportModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {pedidosImportaveis.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-lg">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Todos os pedidos aprovados já estão na expedição!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pedidosImportaveis.map((ped) => (
                  <div
                    key={ped.id}
                    className="p-3 bg-slate-50 hover:bg-amber-50/60 border border-slate-200 rounded-xl flex items-center justify-between gap-4 transition-colors"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900">{ped.numeroPedido}</span>
                      <p className="text-xs text-slate-700 font-medium">{ped.clienteNome} ({ped.candidato})</p>
                      <p className="text-xs text-slate-500">
                        {ped.itens?.length || 0} materiais • {ped.quantidadeTotal || 0} un • Zona: {ped.enderecoEntrega?.zonaEleitoral || 'Central'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleImportarPedido(ped)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Importar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
