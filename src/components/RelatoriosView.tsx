import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  Package,
  FileCheck,
  Search,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Truck,
  DollarSign,
  AlertTriangle,
  Clock,
  User,
  Users,
  Award,
  Boxes,
  ArrowLeftRight,
  AlertOctagon,
  MinusCircle,
  CreditCard,
  History,
  FileDown,
  Share2,
  BookmarkPlus,
  Eye,
  Check,
  X,
  XCircle,
  Navigation,
  CheckSquare,
  ClipboardList,
  CalendarClock,
  MapPin,
  Phone,
  Car,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  Entrega,
  Comite,
  Pedido,
  Material,
  EstoqueSaldo,
  EstoqueMovimentacao,
  Motoboy,
  TransacaoFinanceira,
  Usuario,
  ItemRelatorioCentral,
  TipoModeloRelatorio,
  FiltrosRelatorioCentral,
  ModeloRelatorioConfig,
  ModeloRelatorioSalvo,
} from '../types';
import { LogAuditoriaDoc, ExpedicaoDoc, RotaExpedicaoDoc } from '../models/firebase.types';
import { formatCNPJ, formatNumber, formatCurrency, formatDate } from '../utils/formatters';
import { MODELOS_RELATORIOS } from './relatorios/relatoriosConfig';
import { RelatorioDetalhesModal } from './relatorios/RelatorioDetalhesModal';
import { RelatorioPdfModal } from './relatorios/RelatorioPdfModal';
import { RelatorioSalvarModeloModal } from './relatorios/RelatorioSalvarModeloModal';
import { relatoriosModelosRepo, relatoriosHistoricoRepo, logsAuditoriaRepo } from '../repositories';

interface RelatoriosViewProps {
  entregas: Entrega[];
  comites: Comite[];
  pedidos?: Pedido[];
  materiais?: Material[];
  estoqueSaldos?: Record<string, EstoqueSaldo>;
  estoqueMovimentacoes?: EstoqueMovimentacao[];
  expedicoes?: ExpedicaoDoc[];
  rotasExpedicao?: RotaExpedicaoDoc[];
  motoboys?: Motoboy[];
  financeiro?: TransacaoFinanceira[];
  usuarios?: Usuario[];
  logsAuditoria?: LogAuditoriaDoc[];
  currentUser?: { id: string; nome: string; role?: string };
  onOpenPODModal: (entrega: Entrega) => void;
}

const COLORS = ['#E05328', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B'];

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({
  entregas = [],
  comites = [],
  pedidos = [],
  materiais = [],
  estoqueSaldos = {},
  estoqueMovimentacoes = [],
  expedicoes = [],
  rotasExpedicao = [],
  motoboys = [],
  financeiro = [],
  usuarios = [],
  logsAuditoria = [],
  currentUser = { id: 'usr-admin', nome: 'Administrador', role: 'administrador' },
  onOpenPODModal,
}) => {
  // Active Report Model
  const [selectedModelId, setSelectedModelId] = useState<TipoModeloRelatorio>('geral_pedidos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(true);
  const [showCharts, setShowCharts] = useState(true);

  // Saved Models
  const [modelosSalvos, setModelosSalvos] = useState<ModeloRelatorioSalvo[]>([]);
  const [selectedModeloSalvoId, setSelectedModeloSalvoId] = useState<string>('');

  // Modals
  const [detalhesItem, setDetalhesItem] = useState<ItemRelatorioCentral | null>(null);
  const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isSalvarModeloOpen, setIsSalvarModeloOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Sorting
  const [sortField, setSortField] = useState<string>('dataHora');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filters State
  const [filtros, setFiltros] = useState<FiltrosRelatorioCentral>({
    tipoPeriodo: 'mes',
    dataInicio: '',
    dataFim: '',
    dataAgendamento: '',
    numeroPedido: '',
    clienteId: '',
    materialId: '',
    categoriaMaterial: '',
    setor: '',
    responsavelId: '',
    motoboyId: '',
    equipe: '',
    regiao: '',
    statusPedido: '',
    formaPagamento: '',
    statusPagamento: '',
    origemCliente: '',
  });

  // Load saved models from Firestore realtime
  useEffect(() => {
    const unsub = relatoriosModelosRepo.subscribe(
      (docs) => {
        setModelosSalvos(docs as unknown as ModeloRelatorioSalvo[]);
      },
      (err) => console.error('Erro ao escutar modelos de relatórios:', err)
    );
    return () => unsub();
  }, []);

  // Get active model config
  const activeModelConfig = useMemo(() => {
    return MODELOS_RELATORIOS.find((m) => m.id === selectedModelId) || MODELOS_RELATORIOS[0];
  }, [selectedModelId]);

  // Date Calculation Helper
  const isWithinPeriod = (dateStr?: string, agendamentoStr?: string) => {
    // If specific dataAgendamento filter is set
    if (filtros.dataAgendamento) {
      if (agendamentoStr && agendamentoStr.startsWith(filtros.dataAgendamento)) {
        return true;
      }
      if (dateStr && dateStr.startsWith(filtros.dataAgendamento)) {
        return true;
      }
      return false;
    }

    const effectiveDateStr = (selectedModelId === 'agendamentos_cronograma' && agendamentoStr)
      ? agendamentoStr
      : (dateStr || agendamentoStr);

    if (!effectiveDateStr) return true;

    // Normalizing date without timezone issues
    let date: Date;
    if (effectiveDateStr.length === 10 && effectiveDateStr.includes('-')) {
      const [y, m, d] = effectiveDateStr.split('-').map(Number);
      date = new Date(y, m - 1, d);
    } else {
      date = new Date(effectiveDateStr);
    }

    if (isNaN(date.getTime())) return true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (filtros.tipoPeriodo === 'hoje') {
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      return date >= today && date <= todayEnd;
    }
    if (filtros.tipoPeriodo === 'ontem') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return date >= yesterday && date < today;
    }
    if (filtros.tipoPeriodo === 'semana') {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 7);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return date >= weekStart && date <= weekEnd;
    }
    if (filtros.tipoPeriodo === 'mes') {
      const monthStart = new Date(today);
      monthStart.setDate(monthStart.getDate() - 30);
      const monthEnd = new Date(today);
      monthEnd.setDate(monthEnd.getDate() + 30);
      return date >= monthStart && date <= monthEnd;
    }
    if (filtros.tipoPeriodo === 'personalizado') {
      if (filtros.dataInicio) {
        const [sy, sm, sd] = filtros.dataInicio.split('-').map(Number);
        const start = new Date(sy, sm - 1, sd);
        if (date < start) return false;
      }
      if (filtros.dataFim) {
        const [ey, em, ed] = filtros.dataFim.split('-').map(Number);
        const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
        if (date > end) return false;
      }
      return true;
    }
    return true;
  };

  // Convert and filter data based on active model and filter criteria
  const processedData: ItemRelatorioCentral[] = useMemo(() => {
    let result: ItemRelatorioCentral[] = [];

    // --- 1. GERAL PEDIDOS / PEDIDOS CLIENTE / PEDIDOS PERÍODO / PENDENTES ---
    if (
      selectedModelId === 'geral_pedidos' ||
      selectedModelId === 'pedidos_cliente' ||
      selectedModelId === 'pedidos_periodo' ||
      selectedModelId === 'pedidos_pendentes_atrasados'
    ) {
      result = pedidos.map((p) => {
        const comite = comites.find((c) => c.id === p.clienteId);
        const primeiroItem = p.itens?.[0];
        const qtdTotal = p.itens?.reduce((acc, it) => acc + (it.quantidade || 0), 0) || p.quantidadeTotal || 0;

        return {
          id: p.id,
          dataHora: p.createdAt || p.dataHoraSolicitacao || new Date().toISOString(),
          dataHoraFormatada: formatDate(p.createdAt || p.dataHoraSolicitacao),
          numeroPedido: p.numeroPedido || p.id.slice(0, 8),
          clienteNome: p.clienteNome || comite?.nome || 'Comitê Eleitoral',
          materialNome: primeiroItem ? `${primeiroItem.materialNome || primeiroItem.nome} (${p.itens.length} itens)` : 'Diversos',
          quantidade: qtdTotal,
          unidadeMedida: primeiroItem?.unidadeMedida || 'un',
          responsavelNome: p.criadoPorNome || 'Atendimento',
          setor: 'Atendimento / Pedidos',
          motoboyNome: p.motoboyNome || 'Aguardando Despacho',
          rotaNome: p.rotaNome || p.enderecoEntrega?.bairro || 'São Paulo',
          status: p.status,
          statusLabel: p.status ? p.status.replace(/_/g, ' ').toUpperCase() : 'SOLICITADO',
          valor: p.valorTotal || p.valorFrete || 0,
          observacoes: p.observacoes,
          registroOriginal: p,
          tipoRegistro: 'pedido',
        };
      });

      if (selectedModelId === 'pedidos_pendentes_atrasados') {
        result = result.filter(
          (r) => r.status === 'solicitado' || r.status === 'aprovado' || r.status === 'em_separacao'
        );
      }
    }

    // --- 2. RELATÓRIO DE AGENDAMENTOS POR DATA E HORÁRIO ---
    else if (selectedModelId === 'agendamentos_cronograma') {
      const agendamentosList: ItemRelatorioCentral[] = [];

      // A. Todos os comitês e clientes com data/horário de agendamento
      comites.forEach((c) => {
        const rawDate = c.data || c.dataCadastro || new Date().toISOString();
        const dataFormat = c.data ? formatDate(c.data) : (c.dataCadastro ? formatDate(c.dataCadastro) : '-');
        const horaFormat = c.horario || '14:00';
        const enderecoCompleto = [
          c.endereco,
          c.numeroEnd,
          c.bairro,
          c.cidade || 'Rio de Janeiro',
          c.cep ? `CEP ${c.cep}` : '',
        ].filter(Boolean).join(', ');

        agendamentosList.push({
          id: c.id,
          dataHora: c.data ? `${c.data}T${c.horario || '14:00'}:00` : (c.dataCadastro || new Date().toISOString()),
          dataHoraFormatada: `${dataFormat} às ${horaFormat}`,
          dataAgendamento: c.data || '',
          horarioAgendamento: c.horario || '14:00',
          dataHoraAgendamentoFormatada: `${dataFormat} às ${horaFormat}`,
          numeroPedido: c.numero || (c.cnpjCampanha ? formatCNPJ(c.cnpjCampanha) : c.id.slice(0, 8)),
          clienteNome: c.nome,
          candidato: c.candidato,
          partido: c.partido,
          cargo: c.cargo,
          telefone: c.telefone,
          regiaoRota: c.regiaoRota || c.bairro || 'Zona Norte',
          enderecoCompleto: enderecoCompleto,
          materialNome: c.materiaisSolicitados || (c.modeloCarro ? `Veículo: ${c.modeloCarro}${c.placaCarro ? ` (${c.placaCarro})` : ''}` : 'Materiais de Campanha'),
          quantidade: c.volumeTotalMateriais || 1,
          unidadeMedida: c.volumeTotalMateriais ? 'un' : 'agendamento',
          responsavelNome: c.responsavel || 'Atendimento / Rosane',
          setor: `Agendamento & Rotas (${c.regiaoRota || 'Rio de Janeiro'})`,
          motoboyNome: c.modeloCarro ? `Carro: ${c.modeloCarro}` : (c.regiaoRota || 'Rota Definida'),
          rotaNome: c.regiaoRota || c.bairro || 'Zona Norte',
          status: c.status || 'ativo',
          statusLabel: c.status === 'ativo' ? 'AGENDADO' : (c.status ? c.status.toUpperCase() : 'AGENDADO'),
          valor: c.valorBaseRota || 45,
          observacoes: `[Agendado: ${dataFormat} ${horaFormat}] ${c.observacoes || ''}`,
          registroOriginal: c,
          tipoRegistro: 'comite',
        });
      });

      // B. Pedidos com data de agendamento ou previsão
      pedidos.forEach((p) => {
        if (p.dataAgendada || p.previsaoEntrega) {
          const rawDate = p.dataAgendada || p.previsaoEntrega || p.createdAt || new Date().toISOString();
          const dataFormat = formatDate(rawDate);
          const horaFormat = p.horarioAgendado || '14:00';
          const primeiroItem = p.itens?.[0];
          const qtdTotal = p.itens?.reduce((acc, it) => acc + (it.quantidade || 0), 0) || p.quantidadeTotal || 0;

          agendamentosList.push({
            id: `ped-${p.id}`,
            dataHora: `${rawDate.slice(0, 10)}T${horaFormat}:00`,
            dataHoraFormatada: `${dataFormat} às ${horaFormat}`,
            dataAgendamento: rawDate.slice(0, 10),
            horarioAgendamento: horaFormat,
            dataHoraAgendamentoFormatada: `${dataFormat} às ${horaFormat}`,
            numeroPedido: p.numeroPedido || p.id.slice(0, 8),
            clienteNome: p.clienteNome || 'Comitê Eleitoral',
            candidato: p.candidato,
            telefone: p.telefoneContato,
            regiaoRota: p.rotaNome || p.enderecoEntrega?.bairro || 'Zona Norte',
            enderecoCompleto: p.enderecoEntrega ? `${p.enderecoEntrega.logradouro || ''}, ${p.enderecoEntrega.numero || ''} - ${p.enderecoEntrega.bairro || ''}` : '',
            materialNome: primeiroItem ? `${primeiroItem.materialNome || primeiroItem.nome} (${p.itens?.length || 1} itens)` : 'Materiais do Pedido',
            quantidade: qtdTotal,
            unidadeMedida: primeiroItem?.unidadeMedida || 'un',
            responsavelNome: p.criadoPorNome || 'Atendimento',
            setor: 'Entrega Programada',
            motoboyNome: p.motoboyNome || 'Aguardando Despacho',
            rotaNome: p.rotaNome || 'Zona Norte',
            status: p.status || 'agendado',
            statusLabel: p.status ? p.status.replace(/_/g, ' ').toUpperCase() : 'AGENDADO',
            valor: p.valorTotal || p.valorFrete || 0,
            observacoes: p.observacoes,
            registroOriginal: p,
            tipoRegistro: 'pedido',
          });
        }
      });

      // C. Entregas com agendamento
      entregas.forEach((e) => {
        if (e.dataHoraAgendada || e.previsaoEntrega) {
          const rawDate = e.dataHoraAgendada || e.previsaoEntrega || e.createdAt || new Date().toISOString();
          const dataFormat = formatDate(rawDate);
          const horaFormat = e.horarioAgendado || '14:00';

          agendamentosList.push({
            id: `ent-${e.id}`,
            dataHora: `${rawDate.slice(0, 10)}T${horaFormat}:00`,
            dataHoraFormatada: `${dataFormat} às ${horaFormat}`,
            dataAgendamento: rawDate.slice(0, 10),
            horarioAgendamento: horaFormat,
            dataHoraAgendamentoFormatada: `${dataFormat} às ${horaFormat}`,
            numeroPedido: e.codigoRastreio || e.id.slice(0, 8),
            clienteNome: e.comiteNome,
            regiaoRota: e.zonaEleitoral || e.endereco?.bairro || 'Rota RJ',
            enderecoCompleto: e.endereco ? `${e.endereco.logradouro || ''}, ${e.endereco.numero || ''} - ${e.endereco.bairro || ''}` : '',
            materialNome: `${e.tipoMaterial} (${e.quantidade} ${e.unidadeMedida})`,
            quantidade: e.quantidade,
            unidadeMedida: e.unidadeMedida,
            responsavelNome: e.motoboyNome,
            setor: 'Entrega Agendada',
            motoboyNome: e.motoboyNome,
            rotaNome: e.zonaEleitoral || 'Zona Norte',
            status: e.status || 'agendada',
            statusLabel: e.status ? e.status.replace(/_/g, ' ').toUpperCase() : 'AGENDADA',
            valor: e.valorFrete || 0,
            observacoes: e.observacoes,
            registroOriginal: e,
            tipoRegistro: 'entrega',
          });
        }
      });

      result = agendamentosList;
    }

    // --- 3. MATERIAIS SOLICITADOS / SEPARADOS / LIBERADOS ---
    else if (
      selectedModelId === 'materiais_solicitados' ||
      selectedModelId === 'materiais_separados' ||
      selectedModelId === 'materiais_liberados'
    ) {
      const itemsList: ItemRelatorioCentral[] = [];
      pedidos.forEach((p) => {
        (p.itens || []).forEach((it, idx) => {
          itemsList.push({
            id: `${p.id}-it-${idx}`,
            dataHora: p.createdAt || new Date().toISOString(),
            dataHoraFormatada: formatDate(p.createdAt),
            numeroPedido: p.numeroPedido || p.id.slice(0, 8),
            clienteNome: p.clienteNome || 'Comitê',
            materialNome: it.materialNome || it.nome,
            quantidade: it.quantidade,
            unidadeMedida: it.unidadeMedida || 'un',
            responsavelNome: p.criadoPorNome || 'Operador',
            setor: selectedModelId === 'materiais_liberados' ? 'Expedição' : 'Picking / Separação',
            status: p.status,
            statusLabel: p.status ? p.status.replace(/_/g, ' ').toUpperCase() : 'OK',
            valor: (it.quantidade || 0) * (it.precoUnitario || 0),
            registroOriginal: p,
            tipoRegistro: 'pedido',
          });
        });
      });
      result = itemsList;

      if (selectedModelId === 'materiais_liberados') {
        result = result.filter((r) => r.status === 'liberado' || r.status === 'em_rota' || r.status === 'entregue');
      } else if (selectedModelId === 'materiais_separados') {
        result = result.filter((r) => r.status === 'separado' || r.status === 'liberado' || r.status === 'entregue');
      }
    }

    // --- 4. ENTREGAS REALIZADAS / PENDENTES / ROTAS / MOTOBOYS ---
    else if (
      selectedModelId === 'entregas_realizadas' ||
      selectedModelId === 'entregas_pendentes_canceladas' ||
      selectedModelId === 'rotas_horarios' ||
      selectedModelId === 'desempenho_motoboys'
    ) {
      result = entregas.map((e) => ({
        id: e.id,
        dataHora: e.dataHoraEntrega || e.dataHoraSaida || e.createdAt || new Date().toISOString(),
        dataHoraFormatada: formatDate(e.dataHoraEntrega || e.dataHoraSaida || e.createdAt),
        numeroPedido: e.codigoRastreio || e.id.slice(0, 8),
        clienteNome: e.comiteNome,
        materialNome: `${e.tipoMaterial} (${e.quantidade} ${e.unidadeMedida})`,
        quantidade: e.quantidade,
        unidadeMedida: e.unidadeMedida,
        responsavelNome: e.motoboyNome,
        setor: 'Entrega / Logística de Campo',
        motoboyNome: e.motoboyNome,
        rotaNome: e.zonaEleitoral || e.endereco?.bairro || 'Rota SP',
        status: e.status,
        statusLabel: e.status ? e.status.replace(/_/g, ' ').toUpperCase() : 'EM ROTA',
        valor: e.valorFrete || 0,
        observacoes: e.comprovantePOD ? `POD Assinado por: ${e.comprovantePOD.nomeRecebedor}` : e.observacoes,
        registroOriginal: e,
        tipoRegistro: 'entrega',
      }));

      if (selectedModelId === 'entregas_realizadas') {
        result = result.filter((r) => r.status === 'entregue');
      } else if (selectedModelId === 'entregas_pendentes_canceladas') {
        result = result.filter((r) => r.status === 'cancelada' || r.status === 'devolvida' || r.status === 'pendente');
      }
    }

    // --- 5. ESTOQUE ATUAL / PRODUTOS ESTOQUE BAIXO / SEM ESTOQUE / INVENTÁRIO ---
    else if (
      selectedModelId === 'estoque_atual' ||
      selectedModelId === 'produtos_estoque_baixo' ||
      selectedModelId === 'produtos_sem_estoque' ||
      selectedModelId === 'inventario_materiais'
    ) {
      result = materiais.map((m) => {
        const saldo = estoqueSaldos[m.id]?.estoqueFisico || 0;
        const disponivel = estoqueSaldos[m.id]?.disponivel || 0;
        const reservado = estoqueSaldos[m.id]?.reservado || 0;
        const valorEstoque = saldo * (m.custoUnitario || 0);

        let statusEst = 'NORMAL';
        if (saldo === 0) statusEst = 'ZERADO';
        else if (saldo <= m.estoqueMinimo) statusEst = 'BAIXO';

        return {
          id: m.id,
          dataHora: m.atualizadoEm || m.criadoEm || new Date().toISOString(),
          dataHoraFormatada: formatDate(m.atualizadoEm || m.criadoEm),
          numeroPedido: m.sku,
          clienteNome: m.clienteNome || 'Geral / Candidato',
          materialNome: m.nome,
          quantidade: saldo,
          unidadeMedida: m.unidadeMedida,
          responsavelNome: m.criadoPor || 'Almoxarifado',
          setor: `Estoque (${m.categoria})`,
          rotaNome: m.localizacao || 'Depósito Principal',
          status: statusEst.toLowerCase(),
          statusLabel: statusEst,
          valor: valorEstoque,
          custo: m.custoUnitario,
          observacoes: `Físico: ${saldo} | Disp: ${disponivel} | Resv: ${reservado} | Mín: ${m.estoqueMinimo}`,
          registroOriginal: m,
          tipoRegistro: 'estoque',
        };
      });

      if (selectedModelId === 'produtos_estoque_baixo') {
        result = result.filter((r) => r.status === 'baixo');
      } else if (selectedModelId === 'produtos_sem_estoque') {
        result = result.filter((r) => r.status === 'zerado');
      }
    }

    // --- 6. ENTRADAS E SAÍDAS DO ESTOQUE (KARDEX) ---
    else if (selectedModelId === 'entradas_saidas_estoque') {
      result = estoqueMovimentacoes.map((mov) => ({
        id: mov.id,
        dataHora: mov.createdAt || new Date().toISOString(),
        dataHoraFormatada: formatDate(mov.createdAt),
        numeroPedido: mov.numeroNotaFiscal || mov.numeroPedido || mov.id.slice(0, 8),
        clienteNome: mov.fornecedor || 'Almoxarifado',
        materialNome: `${mov.materialNome} (${mov.materialSku})`,
        quantidade: mov.quantidade,
        unidadeMedida: 'un',
        responsavelNome: mov.usuarioNome,
        setor: mov.tipo === 'entrada' ? 'Entrada / Compra' : 'Saída / Despacho',
        status: mov.tipo,
        statusLabel: mov.tipo.toUpperCase(),
        valor: mov.valorTotal || (mov.quantidade * (mov.custoUnitario || 0)),
        custo: mov.custoUnitario,
        observacoes: `${mov.motivo || ''} [Saldo: ${mov.saldoAnterior} -> ${mov.saldoPosterior}]`,
        registroOriginal: mov,
        tipoRegistro: 'movimentacao',
      }));
    }

    // --- 7. FINANCEIRO (CUSTOS / PAGAMENTOS) ---
    else if (
      selectedModelId === 'custos_operacionais' ||
      selectedModelId === 'pagamentos_remuneracoes'
    ) {
      result = financeiro.map((f) => ({
        id: f.id,
        dataHora: f.data || new Date().toISOString(),
        dataHoraFormatada: formatDate(f.data),
        numeroPedido: f.comprovante || f.id.slice(0, 8),
        clienteNome: f.tipo === 'receita' ? (f.descricao || 'Recebimento Comitê') : (f.motoboyNome || f.categoria),
        materialNome: f.descricao,
        quantidade: 1,
        unidadeMedida: 'serv',
        responsavelNome: f.motoboyNome || 'Financeiro',
        setor: 'Departamento Financeiro',
        status: f.status,
        statusLabel: f.status.toUpperCase(),
        valor: f.valor,
        observacoes: `Forma: ${f.formaPagamento.toUpperCase()} | Cat: ${f.categoria}`,
        registroOriginal: f,
        tipoRegistro: 'financeiro',
      }));

      if (selectedModelId === 'custos_operacionais') {
        result = result.filter((r) => r.status === 'pago' || r.status === 'pendente');
      }
    }

    // --- 8. USUÁRIOS, EQUIPE E AUDITORIA / HISTÓRICO COMPLETO ---
    else if (
      selectedModelId === 'usuario_equipe_setor' ||
      selectedModelId === 'historico_alteracoes'
    ) {
      const logsDiretos: ItemRelatorioCentral[] = (logsAuditoria || []).map((log: any) => ({
        id: log.id,
        dataHora: log.timestamp || log.createdAt || new Date().toISOString(),
        dataHoraFormatada: formatDate(log.timestamp || log.createdAt),
        numeroPedido: (log.documentoId || log.documentId)
          ? `${log.colecao || log.collectionName || 'registro'}/${(log.documentoId || log.documentId || '').slice(0, 8)}`
          : 'SISTEMA',
        clienteNome: log.ipOrigem || log.ipAddress || 'Auditoria Geral',
        materialNome: log.detalhes || `${log.acao || log.action || 'Operação'} em ${log.colecao || log.collectionName || 'banco'}`,
        quantidade: 1,
        unidadeMedida: 'evento',
        responsavelNome: log.usuarioNome || log.userName || 'Sistema FleetMoto',
        setor: log.usuarioRole || log.userRole || 'Auditoria / Compliance',
        status: log.acao || log.action || 'REGISTRO',
        statusLabel: (log.acao || log.action || 'REGISTRO').toUpperCase(),
        valor: 0,
        observacoes: log.detalhes || (log.dadosNovos ? JSON.stringify(log.dadosNovos) : 'Log de segurança'),
        registroOriginal: log,
        tipoRegistro: 'auditoria',
      }));

      // Also collect status transitions from Pedidos, Movimentações and Rotas
      const logsPedidos: ItemRelatorioCentral[] = [];
      (pedidos || []).forEach((p) => {
        if (p.historicoStatus && p.historicoStatus.length > 0) {
          p.historicoStatus.forEach((h, idx) => {
            logsPedidos.push({
              id: `${p.id}-hist-${idx}`,
              dataHora: h.dataHora || p.dataPedido,
              dataHoraFormatada: formatDate(h.dataHora || p.dataPedido),
              numeroPedido: p.numeroPedido || p.id.slice(0, 8),
              clienteNome: p.clienteNome,
              candidato: p.candidato,
              materialNome: `Status: ${h.status.toUpperCase()}`,
              quantidade: p.itens?.length || 1,
              unidadeMedida: 'itens',
              responsavelNome: h.usuarioNome || 'Operador Logístico',
              setor: 'Gestão de Pedidos',
              status: h.status,
              statusLabel: h.status.toUpperCase(),
              valor: p.valorTotal || 0,
              observacoes: h.observacao || `Transição de status do pedido #${p.numeroPedido || p.id.slice(0, 6)}`,
              registroOriginal: p,
              tipoRegistro: 'auditoria',
            });
          });
        }
      });

      // Also collect from Estoque Movimentacoes
      const logsEstoque: ItemRelatorioCentral[] = (estoqueMovimentacoes || []).map((mov) => ({
        id: `mov-hist-${mov.id}`,
        dataHora: mov.createdAt || new Date().toISOString(),
        dataHoraFormatada: formatDate(mov.createdAt),
        numeroPedido: mov.numeroPedido || mov.materialSku || 'KARDEX',
        clienteNome: mov.fornecedor || 'Armazém Central',
        materialNome: `${mov.tipo.toUpperCase()}: ${mov.materialNome} (${mov.quantidade} un)`,
        quantidade: mov.quantidade,
        unidadeMedida: 'un',
        responsavelNome: mov.usuarioNome || 'Operador de Estoque',
        setor: 'Controle de Armazém',
        status: mov.tipo,
        statusLabel: mov.tipo.toUpperCase(),
        valor: mov.valorTotal || 0,
        observacoes: mov.motivo || `Movimentação de ${mov.tipo} de ${mov.materialNome}`,
        registroOriginal: mov,
        tipoRegistro: 'auditoria',
      }));

      result = [...logsDiretos, ...logsPedidos, ...logsEstoque];
    }

    // --- APPLY FILTERS ---
    return result.filter((item) => {
      // 1. Period & Scheduling Date
      if (!isWithinPeriod(item.dataHora, item.dataAgendamento)) return false;

      // 2. Global search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchSearch =
          (item.numeroPedido && item.numeroPedido.toLowerCase().includes(q)) ||
          (item.clienteNome && item.clienteNome.toLowerCase().includes(q)) ||
          (item.candidato && item.candidato.toLowerCase().includes(q)) ||
          (item.materialNome && item.materialNome.toLowerCase().includes(q)) ||
          (item.responsavelNome && item.responsavelNome.toLowerCase().includes(q)) ||
          (item.motoboyNome && item.motoboyNome.toLowerCase().includes(q)) ||
          (item.rotaNome && item.rotaNome.toLowerCase().includes(q)) ||
          (item.regiaoRota && item.regiaoRota.toLowerCase().includes(q)) ||
          (item.telefone && item.telefone.toLowerCase().includes(q)) ||
          (item.dataAgendamento && item.dataAgendamento.toLowerCase().includes(q)) ||
          (item.horarioAgendamento && item.horarioAgendamento.toLowerCase().includes(q)) ||
          (item.statusLabel && item.statusLabel.toLowerCase().includes(q)) ||
          (item.observacoes && item.observacoes.toLowerCase().includes(q));
        if (!matchSearch) return false;
      }

      // 3. Specific dataAgendamento filter
      if (filtros.dataAgendamento && item.dataAgendamento && !item.dataAgendamento.includes(filtros.dataAgendamento)) {
        return false;
      }

      // 4. Filter dropdowns
      if (filtros.numeroPedido && !item.numeroPedido?.toLowerCase().includes(filtros.numeroPedido.toLowerCase())) {
        return false;
      }
      if (filtros.clienteId && item.clienteNome) {
        const selComite = comites.find((c) => c.id === filtros.clienteId);
        if (selComite && !item.clienteNome.toLowerCase().includes(selComite.nome.toLowerCase())) {
          return false;
        }
      }
      if (filtros.motoboyId && item.motoboyNome) {
        const selMoto = motoboys.find((m) => m.id === filtros.motoboyId);
        if (selMoto && !item.motoboyNome.toLowerCase().includes(selMoto.nome.toLowerCase())) {
          return false;
        }
      }
      if (filtros.statusPedido && item.status && item.status !== filtros.statusPedido) {
        return false;
      }
      if (filtros.regiao && (item.rotaNome || item.regiaoRota)) {
        const matchRota =
          (item.rotaNome && item.rotaNome.toLowerCase().includes(filtros.regiao.toLowerCase())) ||
          (item.regiaoRota && item.regiaoRota.toLowerCase().includes(filtros.regiao.toLowerCase()));
        if (!matchRota) return false;
      }

      return true;
    });
  }, [
    selectedModelId,
    pedidos,
    comites,
    entregas,
    materiais,
    estoqueSaldos,
    estoqueMovimentacoes,
    financeiro,
    logsAuditoria,
    motoboys,
    filtros,
    searchTerm,
  ]);

  // Sorting
  const sortedData = useMemo(() => {
    return [...processedData].sort((a, b) => {
      let valA = (a as any)[sortField];
      let valB = (b as any)[sortField];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [processedData, sortField, sortDirection]);

  // Paginated Data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;

  // KPI Computations
  const kpis = useMemo(() => {
    const total = processedData.length;
    const pendentes = processedData.filter(
      (d) => d.status === 'solicitado' || d.status === 'aprovado' || d.status === 'em_separacao' || d.status === 'pendente' || d.status === 'agendado'
    ).length;
    const concluidos = processedData.filter(
      (d) => d.status === 'entregue' || d.status === 'pago' || d.status === 'finalizado' || d.status === 'ativo'
    ).length;
    const atrasados = processedData.filter(
      (d) => d.status === 'cancelada' || d.status === 'devolvida' || d.status === 'atrasado' || d.status === 'zerado'
    ).length;
    const totalItens = processedData.reduce((acc, it) => acc + (it.quantidade || 0), 0);
    const totalValor = processedData.reduce((acc, it) => acc + (it.valor || it.custo || 0), 0);

    return { total, pendentes, concluidos, atrasados, totalItens, totalValor };
  }, [processedData]);

  // Chart Data Calculations
  const chartDataStatus = useMemo(() => {
    const map: Record<string, number> = {};
    processedData.forEach((it) => {
      const st = it.statusLabel || it.status || 'OUTRO';
      map[st] = (map[st] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [processedData]);

  const chartDataTopMaterials = useMemo(() => {
    const map: Record<string, number> = {};
    processedData.forEach((it) => {
      const label = it.materialNome || it.regiaoRota || it.clienteNome;
      if (label) {
        const shortName = label.length > 20 ? label.slice(0, 20) + '...' : label;
        map[shortName] = (map[shortName] || 0) + (it.quantidade || 1);
      }
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, quantidade]) => ({ name, quantidade }));
  }, [processedData]);

  // Handlers for Sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Export CSV Handler
  const handleExportCSV = async () => {
    const isAgendamento = selectedModelId === 'agendamentos_cronograma';
    const headers = isAgendamento
      ? ['Data Agendamento', 'Horário', 'Identificador/Código', 'Cliente/Comitê', 'Candidato', 'Região/Rota', 'Responsável/Contato', 'Telefone', 'Material/Veículo', 'Status', 'Valor Base (R$)', 'Observações']
      : ['Data/Hora', 'Identificador', 'Cliente/Comitê', 'Material/Descrição', 'Quantidade', 'Responsável', 'Setor', 'Motoboy', 'Status', 'Valor (R$)', 'Observações'];

    const rows = sortedData.map((it) => {
      if (isAgendamento) {
        return [
          `"${it.dataAgendamento ? formatDate(it.dataAgendamento) : (it.dataHoraFormatada || it.dataHora)}"`,
          `"${it.horarioAgendamento || '14:00'}"`,
          `"${it.numeroPedido || it.id}"`,
          `"${(it.clienteNome || '').replace(/"/g, '""')}"`,
          `"${(it.candidato || '').replace(/"/g, '""')}"`,
          `"${(it.regiaoRota || it.rotaNome || '').replace(/"/g, '""')}"`,
          `"${(it.responsavelNome || '').replace(/"/g, '""')}"`,
          `"${(it.telefone || '').replace(/"/g, '""')}"`,
          `"${(it.materialNome || '').replace(/"/g, '""')}"`,
          `"${it.statusLabel || it.status || 'AGENDADO'}"`,
          (it.valor || it.custo || 0).toFixed(2),
          `"${(it.observacoes || '').replace(/"/g, '""')}"`,
        ].join(';');
      }
      return [
        `"${it.dataHoraFormatada || it.dataHora}"`,
        `"${it.numeroPedido || it.id}"`,
        `"${(it.clienteNome || '').replace(/"/g, '""')}"`,
        `"${(it.materialNome || '').replace(/"/g, '""')}"`,
        it.quantidade || 0,
        `"${(it.responsavelNome || '').replace(/"/g, '""')}"`,
        `"${(it.setor || '').replace(/"/g, '""')}"`,
        `"${(it.motoboyNome || '').replace(/"/g, '""')}"`,
        `"${it.statusLabel || it.status || ''}"`,
        (it.valor || it.custo || 0).toFixed(2),
        `"${(it.observacoes || '').replace(/"/g, '""')}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_${selectedModelId}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    // Register log
    await relatoriosHistoricoRepo.registrarEmissao({
      titulo: activeModelConfig.titulo,
      tipoModelo: selectedModelId,
      formato: 'csv',
      filtrosAplicados: filtros as any,
      totalRegistros: sortedData.length,
      usuarioId: currentUser.id,
      usuarioNome: currentUser.nome,
    });
  };

  // Export Excel Handler
  const handleExportExcel = async () => {
    handleExportCSV();
  };

  // Clear Filters
  const handleClearFilters = () => {
    setFiltros({
      tipoPeriodo: 'mes',
      dataInicio: '',
      dataFim: '',
      dataAgendamento: '',
      numeroPedido: '',
      clienteId: '',
      materialId: '',
      categoriaMaterial: '',
      setor: '',
      responsavelId: '',
      motoboyId: '',
      equipe: '',
      regiao: '',
      statusPedido: '',
      formaPagamento: '',
      statusPagamento: '',
      origemCliente: '',
    });
    setSearchTerm('');
    setSelectedModeloSalvoId('');
  };

  // Apply Saved Model
  const handleSelectModeloSalvo = (modeloId: string) => {
    setSelectedModeloSalvoId(modeloId);
    if (!modeloId) return;

    const saved = modelosSalvos.find((m) => m.id === modeloId);
    if (saved) {
      setSelectedModelId(saved.tipoModelo);
      setFiltros(saved.filtros);
      setCurrentPage(1);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E05328] to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-950/20">
            <FileSpreadsheet className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Central de Relatórios & Prestação de Contas (TSE)
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                TEMPO REAL
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Consolidação de agendamentos com data e hora, pedidos, rotas, comprovantes POD e dossiês oficiais
            </p>
          </div>
        </div>

        {/* Quick Action Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#E05328]" />
            <span>Imprimir / Gerar PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-slate-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => setIsSalvarModeloOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#E05328] border border-orange-300 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>Salvar Modelo</span>
          </button>
        </div>
      </div>

      {/* Model Selector Strip (21 Models in scannable categories) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#E05328]" />
            <h3 className="font-bold text-sm text-slate-900">
              Selecione o Modelo de Relatório (1 a 21)
            </h3>
          </div>

          {/* Saved Model Quick Loader */}
          {modelosSalvos.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-500 font-medium">Modelos Salvos:</label>
              <select
                value={selectedModeloSalvoId}
                onChange={(e) => handleSelectModeloSalvo(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
              >
                <option value="">Selecione um modelo salvo...</option>
                {modelosSalvos.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 21 Models Grid / Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {MODELOS_RELATORIOS.map((mod) => {
            const isSelected = selectedModelId === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => {
                  setSelectedModelId(mod.id);
                  setCurrentPage(1);
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'border-[#E05328] bg-orange-50/70 shadow-xs ring-2 ring-orange-400/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-[#E05328] text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    #{mod.numero}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {mod.categoria}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-1">
                  {mod.titulo}
                </h4>
                <p className="text-[10px] text-slate-500 line-clamp-1">
                  {mod.descricao}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Special Quick Agendamento Filter Bar (when agendamentos_cronograma is active) */}
      {selectedModelId === 'agendamentos_cronograma' && (
        <div className="bg-gradient-to-r from-orange-500 to-[#E05328] text-white p-4 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CalendarClock className="w-5 h-5 text-orange-200" />
            <div>
              <h4 className="font-bold text-sm">Filtros Rápidos de Agendamento</h4>
              <p className="text-[11px] text-orange-100">
                Visualize comitês, pedidos e clientes por data de agendamento e região de atendimento
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                setFiltros((prev) => ({ ...prev, tipoPeriodo: 'hoje', dataAgendamento: '', regiao: '' }));
              }}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Hoje
            </button>
            <button
              onClick={() => {
                setFiltros((prev) => ({ ...prev, tipoPeriodo: 'semana', dataAgendamento: '', regiao: '' }));
              }}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Esta Semana
            </button>
            <button
              onClick={() => {
                setFiltros((prev) => ({ ...prev, tipoPeriodo: 'mes', dataAgendamento: '', regiao: '' }));
              }}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Este Mês
            </button>
            <button
              onClick={() => {
                setFiltros((prev) => ({ ...prev, regiao: 'Zona Norte' }));
              }}
              className="px-2.5 py-1 bg-white text-[#E05328] rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              Zona Norte
            </button>
            <button
              onClick={() => {
                setFiltros((prev) => ({ ...prev, regiao: 'Zona Oeste' }));
              }}
              className="px-2.5 py-1 bg-white text-[#E05328] rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              Zona Oeste
            </button>
            <button
              onClick={() => {
                setFiltros((prev) => ({ ...prev, regiao: 'Baixada' }));
              }}
              className="px-2.5 py-1 bg-white text-[#E05328] rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              Baixada
            </button>
          </div>
        </div>
      )}

      {/* Filter Toolbar & Collapsible Advanced Filter Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filter Bar Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisa rápida nos resultados (pedido, cliente, data, rota, candidato)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#E05328]"
              />
            </div>

            {/* Quick Period Buttons */}
            <div className="hidden md:flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
              {(['hoje', 'ontem', 'semana', 'mes', 'personalizado'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFiltros((prev) => ({ ...prev, tipoPeriodo: p }))}
                  className={`px-3 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                    filtros.tipoPeriodo === p
                      ? 'bg-[#E05328] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p === 'mes' ? 'Este Mês' : p === 'semana' ? 'Esta Semana' : p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCharts(!showCharts)}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showCharts
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Gráficos</span>
            </button>

            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#E05328]" />
              <span>{showFiltersPanel ? 'Ocultar Filtros' : 'Filtros Avançados'}</span>
            </button>

            <button
              onClick={handleClearFilters}
              title="Limpar todos os filtros"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Detailed Filters Panel */}
        {showFiltersPanel && (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-white text-xs border-b border-slate-100">
            {/* Specific Data de Agendamento */}
            <div>
              <label className="text-slate-600 font-bold block mb-1">
                Data do Agendamento:
              </label>
              <input
                type="date"
                value={filtros.dataAgendamento || ''}
                onChange={(e) => setFiltros({ ...filtros, dataAgendamento: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            {/* Custom Dates if Personalized */}
            {filtros.tipoPeriodo === 'personalizado' && (
              <>
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Data Inicial:</label>
                  <input
                    type="date"
                    value={filtros.dataInicio}
                    onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Data Final:</label>
                  <input
                    type="date"
                    value={filtros.dataFim}
                    onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </>
            )}

            {/* Número do Pedido / Identificador */}
            <div>
              <label className="text-slate-600 font-bold block mb-1">Identificador / Pedido:</label>
              <input
                type="text"
                placeholder="Ex: PED-2026-001"
                value={filtros.numeroPedido}
                onChange={(e) => setFiltros({ ...filtros, numeroPedido: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            {/* Cliente / Comitê */}
            <div>
              <label className="text-slate-600 font-bold block mb-1">Cliente / Comitê:</label>
              <select
                value={filtros.clienteId}
                onChange={(e) => setFiltros({ ...filtros, clienteId: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
              >
                <option value="">Todos os Comitês</option>
                {comites.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.candidato ? `(${c.candidato})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Motoboy / Entregador */}
            <div>
              <label className="text-slate-600 font-bold block mb-1">Motoboy / Entregador:</label>
              <select
                value={filtros.motoboyId}
                onChange={(e) => setFiltros({ ...filtros, motoboyId: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
              >
                <option value="">Todos os Motoboys</option>
                {motoboys.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} ({m.telefone})
                  </option>
                ))}
              </select>
            </div>

            {/* Status do Pedido / Agendamento */}
            <div>
              <label className="text-slate-600 font-bold block mb-1">Status Operacional:</label>
              <select
                value={filtros.statusPedido}
                onChange={(e) => setFiltros({ ...filtros, statusPedido: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
              >
                <option value="">Todos os Status</option>
                <option value="ativo">Ativo / Agendado</option>
                <option value="solicitado">Solicitado</option>
                <option value="aprovado">Aprovado</option>
                <option value="em_separacao">Em Separação</option>
                <option value="separado">Separado</option>
                <option value="liberado">Liberado</option>
                <option value="em_rota">Em Rota</option>
                <option value="entregue">Entregue</option>
                <option value="cancelado">Cancelado</option>
                <option value="devolvido">Devolvido</option>
              </select>
            </div>

            {/* Região / Zona */}
            <div>
              <label className="text-slate-600 font-bold block mb-1">Região / Bairro / Rota:</label>
              <input
                type="text"
                placeholder="Ex: Zona Norte, Zona Oeste, Centro"
                value={filtros.regiao}
                onChange={(e) => setFiltros({ ...filtros, regiao: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block">Total Filtrado</span>
          <p className="text-xl font-black text-slate-900">{formatNumber(kpis.total)}</p>
          <span className="text-[10px] text-slate-400">Registros no relatório</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-amber-600 block">Em Aberto / Pendentes</span>
          <p className="text-xl font-black text-amber-700">{formatNumber(kpis.pendentes)}</p>
          <span className="text-[10px] text-amber-500">Aguardando etapa</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 block">Concluídos / Entregues</span>
          <p className="text-xl font-black text-emerald-700">{formatNumber(kpis.concluidos)}</p>
          <span className="text-[10px] text-emerald-500">100% validados</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-rose-600 block">Atrasados / Alertas</span>
          <p className="text-xl font-black text-rose-700">{formatNumber(kpis.atrasados)}</p>
          <span className="text-[10px] text-rose-500">Atenção requerida</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-indigo-600 block">Volume Total</span>
          <p className="text-xl font-black text-indigo-700">{formatNumber(kpis.totalItens)}</p>
          <span className="text-[10px] text-indigo-500">Unidades movimentadas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-700 block">Valor / Custo Total</span>
          <p className="text-xl font-black text-slate-900">{formatCurrency(kpis.totalValor)}</p>
          <span className="text-[10px] text-slate-400">Consolidado do período</span>
        </div>
      </div>

      {/* Visual Analytics Charts (Collapsible) */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Status Distribution */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#E05328]" />
                <h3 className="font-bold text-sm text-slate-900">Distribuição por Status</h3>
              </div>
              <span className="text-xs text-slate-500">{chartDataStatus.length} categorias</span>
            </div>

            <div className="h-60">
              {chartDataStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartDataStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {chartDataStatus.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                  Sem dados suficientes para gráfico
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Top Categorias / Materiais */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#E05328]" />
                <h3 className="font-bold text-sm text-slate-900">
                  {selectedModelId === 'agendamentos_cronograma' ? 'Top Regiões & Agendamentos' : 'Top Materiais & Volumes'}
                </h3>
              </div>
              <span className="text-xs text-slate-500">Ranking por volume</span>
            </div>

            <div className="h-60">
              {chartDataTopMaterials.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataTopMaterials}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="#E05328" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                  Sem dados suficientes para gráfico
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Results Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              Exibindo {paginatedData.length} de {sortedData.length} registros
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
              Modelo #{activeModelConfig.numero}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-500 font-medium">Itens por página:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 select-none">
              {selectedModelId === 'agendamentos_cronograma' ? (
                /* Header especializado para Agendamentos */
                <tr>
                  <th
                    onClick={() => handleSort('dataHora')}
                    className="p-3.5 cursor-pointer hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-center gap-1">
                      <span>Data & Horário Agendado</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('numeroPedido')}
                    className="p-3.5 cursor-pointer hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-center gap-1">
                      <span>Identificador / Código</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('clienteNome')}
                    className="p-3.5 cursor-pointer hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-center gap-1">
                      <span>Cliente / Comitê (Candidato)</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('regiaoRota')}
                    className="p-3.5 cursor-pointer hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-center gap-1">
                      <span>Região / Rota</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3.5">Contato / Responsável</th>
                  <th className="p-3.5">Material / Veículo Solicitado</th>
                  <th
                    onClick={() => handleSort('status')}
                    className="p-3.5 cursor-pointer hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-center gap-1">
                      <span>Status Agendamento</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('valor')}
                    className="p-3.5 text-right cursor-pointer hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Valor Base (R$)</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3.5 text-center">Ações</th>
                </tr>
              ) : (
                /* Header geral dos demais relatórios */
                <tr>
                  <th
                    onClick={() => handleSort('dataHora')}
                    className="p-3.5 cursor-pointer hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-center gap-1">
                      <span>Data & Hora</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('numeroPedido')}
                    className="p-3.5 cursor-pointer hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-center gap-1">
                      <span>Identificador / Pedido</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('clienteNome')}
                    className="p-3.5 cursor-pointer hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-center gap-1">
                      <span>Cliente / Comitê</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3.5">Material / Descrição</th>
                  <th
                    onClick={() => handleSort('quantidade')}
                    className="p-3.5 text-right cursor-pointer hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Qtd</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3.5">Responsável / Motoboy</th>
                  <th
                    onClick={() => handleSort('status')}
                    className="p-3.5 cursor-pointer hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('valor')}
                    className="p-3.5 text-right cursor-pointer hover:bg-slate-100 transition-all"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Valor (R$)</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="p-3.5 text-center">Ações</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => {
                  if (selectedModelId === 'agendamentos_cronograma') {
                    return (
                      <tr key={item.id} className="hover:bg-orange-50/40 transition-all">
                        <td className="p-3.5 text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <CalendarClock className="w-4 h-4 text-[#E05328] shrink-0" />
                            <div>
                              <strong className="block text-slate-900">
                                {item.dataAgendamento ? formatDate(item.dataAgendamento) : formatDate(item.dataHora)}
                              </strong>
                              <span className="text-[10px] text-slate-500 font-mono">
                                às {item.horarioAgendamento || '14:00'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200">
                            {item.numeroPedido || item.id.slice(0, 8)}
                          </span>
                        </td>

                        <td className="p-3.5 max-w-[200px]">
                          <p className="font-bold text-slate-900 truncate">{item.clienteNome || '-'}</p>
                          {item.candidato && (
                            <span className="text-[10px] text-slate-500 font-medium truncate block">
                              Candidato: {item.candidato} {item.partido ? `(${item.partido})` : ''}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 max-w-[160px]">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#E05328] shrink-0" />
                            <span className="font-semibold text-slate-800 truncate">
                              {item.regiaoRota || item.rotaNome || 'Zona Norte'}
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5 text-slate-600 whitespace-nowrap">
                          <p className="font-semibold text-slate-900">{item.responsavelNome || '-'}</p>
                          {item.telefone && (
                            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-0.5">
                              <Phone className="w-2.5 h-2.5 text-slate-400" />
                              {item.telefone}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-slate-700 max-w-[200px] truncate">
                          {item.materialNome || '-'}
                        </td>

                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-[#E05328] border border-orange-200 uppercase">
                            {item.statusLabel || item.status || 'AGENDADO'}
                          </span>
                        </td>

                        <td className="p-3.5 text-right font-bold text-emerald-700 whitespace-nowrap">
                          {item.valor ? formatCurrency(item.valor) : item.custo ? formatCurrency(item.custo) : 'R$ 45,00'}
                        </td>

                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              setDetalhesItem(item);
                              setIsDetalhesModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#E05328] hover:text-white text-slate-600 transition-all shadow-2xs cursor-pointer"
                            title="Ver Dossiê do Agendamento"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="p-3.5 text-slate-600 whitespace-nowrap">
                        {item.dataHoraFormatada || formatDate(item.dataHora)}
                      </td>

                      <td className="p-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-800 border border-orange-200">
                          {item.numeroPedido || item.id.slice(0, 8)}
                        </span>
                      </td>

                      <td className="p-3.5 font-bold text-slate-800 max-w-[180px] truncate">
                        {item.clienteNome || '-'}
                      </td>

                      <td className="p-3.5 text-slate-700 max-w-[200px] truncate">
                        {item.materialNome || '-'}
                      </td>

                      <td className="p-3.5 text-right font-bold text-slate-900">
                        {item.quantidade !== undefined ? formatNumber(item.quantidade) : '-'}
                      </td>

                      <td className="p-3.5 text-slate-600 whitespace-nowrap">
                        <p className="font-semibold text-slate-900">{item.motoboyNome || item.responsavelNome || '-'}</p>
                        <span className="text-[10px] text-slate-400">{item.setor || ''}</span>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.statusLabel || item.status || 'OK'}
                        </span>
                      </td>

                      <td className="p-3.5 text-right font-bold text-emerald-700 whitespace-nowrap">
                        {item.valor ? formatCurrency(item.valor) : item.custo ? formatCurrency(item.custo) : 'R$ 0,00'}
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => {
                            setDetalhesItem(item);
                            setIsDetalhesModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#E05328] hover:text-white text-slate-600 transition-all shadow-2xs cursor-pointer"
                          title="Ver Dossiê Completo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 space-y-2">
                    <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-bold text-slate-600">Nenhum registro encontrado para os filtros selecionados.</p>
                    <p className="text-xs text-slate-400">Tente ajustar o período ou limpar os filtros aplicados.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Página {currentPage} de {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
              >
                Anterior
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i + 1;
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-[#E05328] text-white'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Item Dossier Modal */}
      <RelatorioDetalhesModal
        isOpen={isDetalhesModalOpen}
        onClose={() => {
          setIsDetalhesModalOpen(false);
          setDetalhesItem(null);
        }}
        item={detalhesItem}
        onOpenPODModal={(ent) => onOpenPODModal(ent)}
      />

      {/* Official PDF / Print Modal */}
      <RelatorioPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        modeloAtivo={activeModelConfig}
        itens={sortedData}
        filtros={filtros}
        usuarioAtualNome={currentUser.nome}
        onExportCsv={handleExportCSV}
        onExportExcel={handleExportExcel}
      />

      {/* Save Model Template Modal */}
      <RelatorioSalvarModeloModal
        isOpen={isSalvarModeloOpen}
        onClose={() => setIsSalvarModeloOpen(false)}
        tipoModelo={selectedModelId}
        filtros={filtros}
        colunasVisiveis={[]}
        usuarioId={currentUser.id}
        usuarioNome={currentUser.nome}
      />
    </div>
  );
};
