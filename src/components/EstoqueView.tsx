import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  Plus,
  RotateCcw,
  Printer,
  FileSpreadsheet,
  Layers,
  Building2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Tag,
  Barcode,
  Eye,
  Edit2,
  Trash2,
  ClipboardList,
  ShieldCheck,
  Calendar,
  History,
  ShoppingCart,
  Check,
  X,
  Warehouse,
  Download
} from 'lucide-react';
import {
  Material,
  EstoqueSaldo,
  EstoqueMovimentacao,
  EstoqueReserva,
  Inventario,
  Usuario,
  CATEGORIAS_MATERIAIS
} from '../types';
import {
  materiaisRepo,
  estoqueSaldosRepo,
  estoqueMovimentacoesRepo,
  estoqueReservasRepo,
  inventariosRepo
} from '../repositories';
import {
  formatCurrency,
  formatDateTime,
  formatDate,
  formatStatusEstoque,
  formatTipoMovimentacao
} from '../utils/formatters';

import { ModalCadastroMaterial } from './estoque/ModalCadastroMaterial';
import { ModalEntradaEstoque } from './estoque/ModalEntradaEstoque';
import { ModalSaidaEstoque } from './estoque/ModalSaidaEstoque';
import { ModalInventario } from './estoque/ModalInventario';
import { ModalEtiquetaMaterial } from './estoque/ModalEtiquetaMaterial';
import { ModalEstornoMovimentacao } from './estoque/ModalEstornoMovimentacao';
import { ModalDetalhesMaterial } from './estoque/ModalDetalhesMaterial';

interface EstoqueViewProps {
  currentUser: Usuario;
  onNavigateToPedidos?: () => void;
  onNavigateToExpedicao?: () => void;
}

type SubTab = 'catalogo' | 'movimentacoes' | 'reservas' | 'inventarios' | 'relatorios';

export const EstoqueView: React.FC<EstoqueViewProps> = ({
  currentUser,
  onNavigateToPedidos,
  onNavigateToExpedicao,
}) => {
  const [subTab, setSubTab] = useState<SubTab>('catalogo');
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [saldosMap, setSaldosMap] = useState<Record<string, EstoqueSaldo>>({});
  const [movimentacoes, setMovimentacoes] = useState<EstoqueMovimentacao[]>([]);
  const [reservas, setReservas] = useState<EstoqueReserva[]>([]);
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('todas');
  const [statusEstoqueFilter, setStatusEstoqueFilter] = useState<'todos' | 'ok' | 'baixo' | 'zerado'>('todos');
  const [tipoMovimentacaoFilter, setTipoMovimentacaoFilter] = useState('todos');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals state
  const [modalCadastroOpen, setModalCadastroOpen] = useState(false);
  const [materialParaEditar, setMaterialParaEditar] = useState<Material | null>(null);
  
  const [modalEntradaOpen, setModalEntradaOpen] = useState(false);
  const [modalSaidaOpen, setModalSaidaOpen] = useState(false);
  const [materialPreSelecionado, setMaterialPreSelecionado] = useState<Material | null>(null);

  const [modalInventarioOpen, setModalInventarioOpen] = useState(false);
  const [inventarioSelecionado, setInventarioSelecionado] = useState<Inventario | null>(null);

  const [modalEtiquetaOpen, setModalEtiquetaOpen] = useState(false);
  const [materialParaEtiqueta, setMaterialParaEtiqueta] = useState<Material | null>(null);

  const [modalEstornoOpen, setModalEstornoOpen] = useState(false);
  const [movimentacaoParaEstorno, setMovimentacaoParaEstorno] = useState<EstoqueMovimentacao | null>(null);

  const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false);
  const [materialParaDetalhes, setMaterialParaDetalhes] = useState<Material | null>(null);

  // Load Data with Realtime Listeners
  useEffect(() => {
    setLoading(true);
    const unsubs: Array<() => void> = [];

    // 1. Materiais
    unsubs.push(
      materiaisRepo.subscribe(
        (mats) => {
          setMateriais(mats);
          setLoading(false);
        },
        (err) => console.error('Erro realtime materiais:', err)
      )
    );

    // 2. Saldos
    unsubs.push(
      estoqueSaldosRepo.subscribe(
        (saldos) => {
          const sMap: Record<string, EstoqueSaldo> = {};
          saldos.forEach((s) => {
            sMap[s.materialId] = s;
          });
          setSaldosMap(sMap);
        },
        (err) => console.error('Erro realtime saldos:', err)
      )
    );

    // 3. Movimentações
    unsubs.push(
      estoqueMovimentacoesRepo.subscribe(
        (movs) => {
          // Ordenar por data decrescente
          const sorted = [...movs].sort((a, b) => 
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          setMovimentacoes(sorted);
        },
        (err) => console.error('Erro realtime movimentações:', err)
      )
    );

    // 4. Reservas
    unsubs.push(
      estoqueReservasRepo.subscribe(
        (resvs) => {
          setReservas(resvs);
        },
        (err) => console.error('Erro realtime reservas:', err)
      )
    );

    // 5. Inventários
    unsubs.push(
      inventariosRepo.subscribe(
        (invs) => {
          setInventarios(invs);
        },
        (err) => console.error('Erro realtime inventários:', err)
      )
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  // Metrics Calculations
  const metrics = useMemo(() => {
    let totalFisico = 0;
    let totalDisponivel = 0;
    let totalReservado = 0;
    let totalSeparacao = 0;
    let totalAvariado = 0;
    let itensBaixo = 0;
    let itensZerados = 0;
    let valorTotalEstoque = 0;

    materiais.forEach((m) => {
      const saldo = saldosMap[m.id];
      const fisico = saldo?.estoqueFisico || 0;
      const disponivel = saldo?.disponivel || 0;
      const reservado = saldo?.reservado || 0;
      const separacao = saldo?.emSeparacao || 0;
      const avariado = saldo?.avariado || 0;

      totalFisico += fisico;
      totalDisponivel += disponivel;
      totalReservado += reservado;
      totalSeparacao += separacao;
      totalAvariado += avariado;
      valorTotalEstoque += fisico * (m.custoUnitario || 0);

      if (fisico <= 0) {
        itensZerados++;
      } else if (fisico <= m.estoqueMinimo) {
        itensBaixo++;
      }
    });

    // Entradas e Saídas hoje
    const todayStr = new Date().toISOString().slice(0, 10);
    const movsHoje = movimentacoes.filter((mov) => (mov.createdAt || '').startsWith(todayStr));
    const entradasHoje = movsHoje.filter((m) => m.tipo === 'entrada').reduce((a, b) => a + (b.quantidade || 0), 0);
    const saidasHoje = movsHoje.filter((m) => m.tipo === 'saida').reduce((a, b) => a + (b.quantidade || 0), 0);

    return {
      totalMateriais: materiais.length,
      totalFisico,
      totalDisponivel,
      totalReservado,
      totalSeparacao,
      totalAvariado,
      itensBaixo,
      itensZerados,
      valorTotalEstoque,
      entradasHoje,
      saidasHoje,
    };
  }, [materiais, saldosMap, movimentacoes]);

  // Filtered Materials
  const materiaisFiltrados = useMemo(() => {
    return materiais.filter((m) => {
      const saldo = saldosMap[m.id]?.estoqueFisico || 0;
      const statusObj = formatStatusEstoque(saldo, m.estoqueMinimo);

      // Search match
      const q = searchTerm.toLowerCase();
      const matchSearch =
        (m.nome || '').toLowerCase().includes(q) ||
        (m.sku || '').toLowerCase().includes(q) ||
        (m.codigoBarras && m.codigoBarras.includes(searchTerm)) ||
        (m.candidato && m.candidato.toLowerCase().includes(q)) ||
        (m.fornecedor && m.fornecedor.toLowerCase().includes(q)) ||
        (m.lote && m.lote.toLowerCase().includes(q));

      // Category match
      const matchCat = categoriaFilter === 'todas' || m.categoria === categoriaFilter;

      // Status stock match
      const matchStatus =
        statusEstoqueFilter === 'todos' || statusObj.statusKey === statusEstoqueFilter;

      return matchSearch && matchCat && matchStatus;
    });
  }, [materiais, saldosMap, searchTerm, categoriaFilter, statusEstoqueFilter]);

  // Filtered Movimentações
  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter((mov) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        (mov.materialNome || '').toLowerCase().includes(q) ||
        (mov.materialSku || '').toLowerCase().includes(q) ||
        (mov.motivo && mov.motivo.toLowerCase().includes(q)) ||
        (mov.usuarioNome && mov.usuarioNome.toLowerCase().includes(q));

      const matchTipo = tipoMovimentacaoFilter === 'todos' || mov.tipo === tipoMovimentacaoFilter;

      return matchSearch && matchTipo;
    });
  }, [movimentacoes, searchTerm, tipoMovimentacaoFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['SKU', 'Nome', 'Categoria', 'Saldo Fisico', 'Disponivel', 'Reservado', 'Estoque Minimo', 'Custo Unitario (R$)', 'Valor Total (R$)', 'Localizacao', 'Lote', 'Status'];
    const rows = materiais.map((m) => {
      const saldo = saldosMap[m.id];
      const fisico = saldo?.estoqueFisico || 0;
      const disp = saldo?.disponivel || 0;
      const resv = saldo?.reservado || 0;
      const valor = fisico * (m.custoUnitario || 0);
      return [
        m.sku,
        `"${m.nome}"`,
        `"${m.categoria}"`,
        fisico,
        disp,
        resv,
        m.estoqueMinimo,
        m.custoUnitario || 0,
        valor.toFixed(2),
        `"${m.localizacao || ''}"`,
        `"${m.lote || ''}"`,
        m.status,
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `estoque_fleetmoto_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="view-estoque-container" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Header & Fast Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E05328] to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-950/20">
            <Warehouse className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Controle de Estoque & Armazém
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                TEMPO REAL
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Gestão de saldos físicos, reservas de campanha, entradas, baixas, inventário e rastreabilidade
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-abrir-entrada"
            type="button"
            onClick={() => {
              setMaterialPreSelecionado(null);
              setModalEntradaOpen(true);
            }}
            className="px-3.5 py-2 text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            <span>Nova Entrada</span>
          </button>

          <button
            id="btn-abrir-saida"
            type="button"
            onClick={() => {
              setMaterialPreSelecionado(null);
              setModalSaidaOpen(true);
            }}
            className="px-3.5 py-2 text-xs sm:text-sm font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
          >
            <ArrowUpRight className="w-4 h-4 text-amber-600" />
            <span>Nova Saída</span>
          </button>

          <button
            id="btn-abrir-inventario-topo"
            type="button"
            onClick={() => {
              setInventarioSelecionado(null);
              setModalInventarioOpen(true);
            }}
            className="px-3.5 py-2 text-xs sm:text-sm font-bold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
          >
            <ClipboardList className="w-4 h-4 text-indigo-600" />
            <span>Inventário Físico</span>
          </button>

          <button
            id="btn-cadastrar-material"
            type="button"
            onClick={() => {
              setMaterialParaEditar(null);
              setModalCadastroOpen(true);
            }}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#E05328] to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl shadow-md shadow-orange-950/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Cadastrar Material</span>
          </button>
        </div>
      </div>

      {/* Critical Stock Alerts Banner (if any item is low or zero) */}
      {(metrics.itensZerados > 0 || metrics.itensBaixo > 0) && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-orange-500/10 border border-amber-300/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-950/20 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                Atenção: Materiais com Estoque Crítico
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Existem <strong>{metrics.itensZerados} materiais zerados</strong> e{' '}
                <strong>{metrics.itensBaixo} abaixo do estoque mínimo</strong>. Programe reposição com a gráfica para não impactar os envios eleitorais.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setStatusEstoqueFilter('baixo');
              setSubTab('catalogo');
            }}
            className="px-4 py-2 text-xs font-bold text-amber-950 bg-amber-200/80 hover:bg-amber-300 rounded-xl border border-amber-400/60 transition-all shrink-0"
          >
            Ver Materiais Críticos
          </button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total SKUs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Catálogo Ativo</span>
            <Boxes className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {metrics.totalMateriais}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">SKUs cadastrados</span>
        </div>

        {/* Saldo Físico Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Saldo Físico</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {metrics.totalFisico.toLocaleString('pt-BR')}
          </div>
          <span className="text-[11px] text-blue-600 font-medium">Unidades no armazém</span>
        </div>

        {/* Saldo Disponível */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-semibold">Disponível</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight font-mono">
            {metrics.totalDisponivel.toLocaleString('pt-BR')}
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">Livre p/ novos pedidos</span>
        </div>

        {/* Reservado em Pedidos */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-semibold">Reservado</span>
            <ShoppingCart className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-800 tracking-tight font-mono">
            {metrics.totalReservado.toLocaleString('pt-BR')}
          </div>
          <span className="text-[11px] text-amber-700 font-medium">Em pedidos ativos</span>
        </div>

        {/* Em Separação / Expedição */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 shadow-xs bg-indigo-50/20">
          <div className="flex items-center justify-between text-indigo-800 mb-2">
            <span className="text-xs font-semibold">Em Expedição</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-800 tracking-tight font-mono">
            {metrics.totalSeparacao.toLocaleString('pt-BR')}
          </div>
          <span className="text-[11px] text-indigo-700 font-medium">Conferência / Picking</span>
        </div>

        {/* Valor Total do Estoque */}
        <div className="bg-white p-4 rounded-2xl border border-purple-200/80 shadow-xs bg-purple-50/20">
          <div className="flex items-center justify-between text-purple-900 mb-2">
            <span className="text-xs font-semibold">Valor em Estoque</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-black text-purple-950 tracking-tight font-mono truncate">
            {formatCurrency(metrics.valorTotalEstoque)}
          </div>
          <span className="text-[11px] text-purple-800 font-medium">Custo ponderado</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            id="tab-estoque-catalogo"
            type="button"
            onClick={() => setSubTab('catalogo')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              subTab === 'catalogo'
                ? 'bg-[#1A1A1E] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Catálogo & Saldos ({materiais.length})</span>
          </button>

          <button
            id="tab-estoque-movimentacoes"
            type="button"
            onClick={() => setSubTab('movimentacoes')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              subTab === 'movimentacoes'
                ? 'bg-[#1A1A1E] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico Kardex ({movimentacoes.length})</span>
          </button>

          <button
            id="tab-estoque-reservas"
            type="button"
            onClick={() => setSubTab('reservas')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              subTab === 'reservas'
                ? 'bg-[#1A1A1E] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Reservas de Pedidos ({reservas.length})</span>
          </button>

          <button
            id="tab-estoque-inventarios"
            type="button"
            onClick={() => setSubTab('inventarios')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              subTab === 'inventarios'
                ? 'bg-[#1A1A1E] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Inventários Físicos ({inventarios.length})</span>
          </button>
        </div>

        {/* Global Export & Label Printing */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: Catálogo & Saldos */}
      {subTab === 'catalogo' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="input-busca-estoque"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por SKU, nome, código de barras, lote..."
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300/80 rounded-xl focus:ring-2 focus:ring-[#E05328] focus:bg-white transition-all"
              />
            </div>

            {/* Selects */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={categoriaFilter}
                  onChange={(e) => setCategoriaFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden"
                >
                  <option value="todas">Todas Categorias</option>
                  {CATEGORIAS_MATERIAIS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <select
                  value={statusEstoqueFilter}
                  onChange={(e) => setStatusEstoqueFilter(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden"
                >
                  <option value="todos">Todos os Níveis</option>
                  <option value="ok">Normal / Disponível</option>
                  <option value="baixo">Estoque Baixo</option>
                  <option value="zerado">Estoque Zerado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Catalog Table View */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table id="table-materiais-estoque" className="w-full text-left text-xs">
                <thead className="bg-[#1A1A1E] text-slate-300 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="p-4">SKU / Material</th>
                    <th className="p-4">Categoria / Local</th>
                    <th className="p-4">Candidato / Comitê</th>
                    <th className="p-4 text-right">Saldo Físico</th>
                    <th className="p-4 text-right">Disponível</th>
                    <th className="p-4 text-right">Reservado</th>
                    <th className="p-4 text-center">Nível / Status</th>
                    <th className="p-4 text-right">Custo / Total</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {materiaisFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 font-medium">
                        Nenhum material encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    materiaisFiltrados.map((m) => {
                      const saldo = saldosMap[m.id];
                      const fisico = saldo?.estoqueFisico || 0;
                      const disp = saldo?.disponivel || 0;
                      const resv = saldo?.reservado || 0;
                      const statusBadge = formatStatusEstoque(fisico, m.estoqueMinimo);
                      const valorTotal = fisico * (m.custoUnitario || 0);

                      return (
                        <tr
                          key={m.id}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          {/* SKU & Name */}
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E05328] shrink-0 font-mono font-bold text-xs">
                                <Boxes className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{m.sku}</span>
                                  {m.lote && (
                                    <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                      {m.lote}
                                    </span>
                                  )}
                                </div>
                                <div className="font-semibold text-slate-800 text-xs line-clamp-1">
                                  {m.nome}
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  {m.tamanhoFormato || m.unidadeMedida}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Category & Location */}
                          <td className="p-4">
                            <div className="font-medium text-slate-700">{m.categoria}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span className="font-mono">{m.localizacao || 'Setor A'}</span>
                            </div>
                          </td>

                          {/* Candidate / Committee */}
                          <td className="p-4">
                            {m.candidato || m.partido ? (
                              <div>
                                <div className="font-bold text-slate-900">{m.candidato || '-'}</div>
                                <span className="text-[10px] font-mono font-bold text-[#E05328]">
                                  {m.partido || ''} {m.numeroCandidato ? `• ${m.numeroCandidato}` : ''}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Uso Geral</span>
                            )}
                          </td>

                          {/* Saldo Físico */}
                          <td className="p-4 text-right">
                            <span className="text-sm font-black text-slate-900 font-mono">
                              {fisico.toLocaleString('pt-BR')}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono uppercase">
                              {m.unidadeMedida}
                            </span>
                          </td>

                          {/* Disponível */}
                          <td className="p-4 text-right">
                            <span className="text-sm font-black text-emerald-700 font-mono">
                              {disp.toLocaleString('pt-BR')}
                            </span>
                            <span className="text-[10px] text-emerald-600 block">Livre</span>
                          </td>

                          {/* Reservado */}
                          <td className="p-4 text-right">
                            <span className={`text-sm font-bold font-mono ${resv > 0 ? 'text-amber-800' : 'text-slate-400'}`}>
                              {resv.toLocaleString('pt-BR')}
                            </span>
                            <span className="text-[10px] text-slate-400 block">Pedidos</span>
                          </td>

                          {/* Status */}
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusBadge.badgeClass}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotClass}`} />
                              {statusBadge.label}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Min: {m.estoqueMinimo} un
                            </span>
                          </td>

                          {/* Cost / Total Value */}
                          <td className="p-4 text-right font-mono">
                            <div className="font-bold text-slate-900">{formatCurrency(valorTotal)}</div>
                            <div className="text-[10px] text-slate-400">
                              {formatCurrency(m.custoUnitario || 0)}/un
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Details */}
                              <button
                                title="Visualizar Detalhes & Rastreabilidade"
                                onClick={() => {
                                  setMaterialParaDetalhes(m);
                                  setModalDetalhesOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Entrada Rápida */}
                              <button
                                title="Registrar Entrada"
                                onClick={() => {
                                  setMaterialPreSelecionado(m);
                                  setModalEntradaOpen(true);
                                }}
                                className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <ArrowDownLeft className="w-4 h-4" />
                              </button>

                              {/* Saída Rápida */}
                              <button
                                title="Registrar Saída"
                                onClick={() => {
                                  setMaterialPreSelecionado(m);
                                  setModalSaidaOpen(true);
                                }}
                                className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>

                              {/* Etiqueta */}
                              <button
                                title="Imprimir Etiqueta Térmica"
                                onClick={() => {
                                  setMaterialParaEtiqueta(m);
                                  setModalEtiquetaOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <Printer className="w-4 h-4" />
                              </button>

                              {/* Editar */}
                              <button
                                title="Editar Cadastro"
                                onClick={() => {
                                  setMaterialParaEditar(m);
                                  setModalCadastroOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-[#E05328] hover:bg-orange-50 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Histórico Kardex */}
      {subTab === 'movimentacoes' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por material, operador, motivo..."
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300/80 rounded-xl focus:ring-2 focus:ring-[#E05328] focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <select
                  value={tipoMovimentacaoFilter}
                  onChange={(e) => setTipoMovimentacaoFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden"
                >
                  <option value="todos">Todos os Tipos de Movimentação</option>
                  <option value="entrada">Apenas Entradas</option>
                  <option value="saida">Apenas Saídas</option>
                  <option value="avaria">Avarias</option>
                  <option value="estorno">Estornos Autorizados</option>
                  <option value="ajuste_inventario">Ajustes de Inventário</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table id="table-kardex-movimentacoes" className="w-full text-left text-xs">
                <thead className="bg-[#1A1A1E] text-slate-300 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="p-4">Data / Hora</th>
                    <th className="p-4">Tipo de Movimentação</th>
                    <th className="p-4">SKU / Material</th>
                    <th className="p-4 text-right">Qtd</th>
                    <th className="p-4 text-right">Saldo Ant.</th>
                    <th className="p-4 text-right">Saldo Pós.</th>
                    <th className="p-4 text-right">Valor Total</th>
                    <th className="p-4">Operador & Motivo</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {movimentacoesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 font-medium">
                        Nenhuma movimentação encontrada.
                      </td>
                    </tr>
                  ) : (
                    movimentacoesFiltradas.map((mov) => {
                      const isEntry = mov.tipo === 'entrada';
                      const isEstorno = mov.tipo === 'estorno';
                      const tipoBadge = formatTipoMovimentacao(mov.tipo, mov.subtipo);

                      return (
                        <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-mono text-slate-600 whitespace-nowrap">
                            {formatDateTime(mov.createdAt)}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${tipoBadge.badgeClass}`}>
                              {tipoBadge.label}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-mono font-bold text-slate-900">{mov.materialSku}</div>
                            <div className="text-slate-700 font-medium line-clamp-1">{mov.materialNome}</div>
                          </td>
                          <td className={`p-4 text-right font-mono font-black text-sm ${isEntry ? 'text-emerald-700' : 'text-amber-800'}`}>
                            {isEntry ? `+${mov.quantidade}` : `-${mov.quantidade}`}
                          </td>
                          <td className="p-4 text-right font-mono text-slate-500">
                            {mov.saldoAnterior}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-slate-900">
                            {mov.saldoPosterior}
                          </td>
                          <td className="p-4 text-right font-mono font-semibold text-slate-800">
                            {mov.valorTotal ? formatCurrency(mov.valorTotal) : '-'}
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-slate-900">{mov.usuarioNome}</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">{mov.motivo}</div>
                          </td>
                          <td className="p-4 text-center">
                            {!isEstorno && (
                              <button
                                title="Solicitar Estorno Autorizado"
                                onClick={() => {
                                  setMovimentacaoParaEstorno(mov);
                                  setModalEstornoOpen(true);
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg flex items-center gap-1 mx-auto transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Estorno</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Reservas de Pedidos */}
      {subTab === 'reservas' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Reservas Automáticas de Materiais por Pedido
              </h3>
              <p className="text-xs text-slate-500">
                Quando um pedido é criado, o sistema reserva os materiais garantindo que nenhum outro comitê utilize o saldo antes do despacho.
              </p>
            </div>
            {onNavigateToPedidos && (
              <button
                type="button"
                onClick={onNavigateToPedidos}
                className="px-4 py-2 text-xs font-bold text-[#E05328] bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Package className="w-4 h-4" />
                <span>Ver Pedidos Ativos</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table id="table-reservas-pedidos" className="w-full text-left text-xs">
                <thead className="bg-[#1A1A1E] text-slate-300 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="p-4">Pedido Nº</th>
                    <th className="p-4">Cliente / Comitê</th>
                    <th className="p-4">Material Reservado</th>
                    <th className="p-4 text-right">Qtd Reservada</th>
                    <th className="p-4 text-center">Status Reserva</th>
                    <th className="p-4">Data da Reserva</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reservas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                        Nenhuma reserva de material ativa no momento.
                      </td>
                    </tr>
                  ) : (
                    reservas.map((resv) => (
                      <tr key={resv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-900">
                          {resv.numeroPedido}
                        </td>
                        <td className="p-4 font-medium text-slate-800">
                          {resv.clienteNome}
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-slate-900">{resv.materialNome}</span>
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-blue-700 text-sm">
                          {resv.quantidadeReservada.toLocaleString('pt-BR')} un
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                            {resv.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-600">
                          {formatDateTime(resv.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Inventários Físicos */}
      {subTab === 'inventarios' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Inventários Físicos & Apuração de Sobras/Faltas
              </h3>
              <p className="text-xs text-slate-500">
                Contagem periódica e ajuste oficial de estoque com auditoria e aprovação pelo Supervisor de Estoque.
              </p>
            </div>
            <button
              id="btn-abrir-novo-inventario"
              type="button"
              onClick={() => {
                setInventarioSelecionado(null);
                setModalInventarioOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-950/20 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Abrir Novo Inventário</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventarios.length === 0 ? (
              <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200/80 text-slate-500">
                <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-sm">Nenhum inventário realizado até o momento.</p>
                <p className="text-xs mt-1">Abra um novo inventário para conferir e alinhar o estoque físico com o sistema.</p>
              </div>
            ) : (
              inventarios.map((inv) => {
                const totalItens = inv.itens?.length || 0;
                const totalDiv = inv.itens?.filter((i) => i.divergencia !== 0).length || 0;

                return (
                  <div
                    key={inv.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 hover:border-indigo-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {inv.codigo}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          inv.status === 'finalizado'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{inv.titulo}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Aberto por <strong>{inv.responsavelNome}</strong> em {formatDate(inv.dataAbertura)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-500 block">Itens Conferidos:</span>
                        <span className="font-bold text-slate-900">{totalItens}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Divergências:</span>
                        <span className={`font-bold ${totalDiv > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {totalDiv} {totalDiv === 1 ? 'item' : 'itens'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setInventarioSelecionado(inv);
                          setModalInventarioOpen(true);
                        }}
                        className="w-full py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{inv.status === 'finalizado' ? 'Ver Apuração Final' : 'Continuar Contagem / Aprovação'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      <ModalCadastroMaterial
        isOpen={modalCadastroOpen}
        onClose={() => setModalCadastroOpen(false)}
        materialParaEditar={materialParaEditar}
        onSuccess={() => {
          // Atualização automática via onSnapshot realtime listener
        }}
        currentUserId={currentUser.id}
        currentUserName={currentUser.nome}
      />

      <ModalEntradaEstoque
        isOpen={modalEntradaOpen}
        onClose={() => setModalEntradaOpen(false)}
        materiais={materiais}
        saldosMap={saldosMap}
        materialPreSelecionado={materialPreSelecionado}
        onSuccess={() => {
          // Atualização automática via onSnapshot realtime listener
        }}
        currentUserId={currentUser.id}
        currentUserName={currentUser.nome}
      />

      <ModalSaidaEstoque
        isOpen={modalSaidaOpen}
        onClose={() => setModalSaidaOpen(false)}
        materiais={materiais}
        saldosMap={saldosMap}
        materialPreSelecionado={materialPreSelecionado}
        onSuccess={() => {
          // Atualização automática via onSnapshot realtime listener
        }}
        currentUserId={currentUser.id}
        currentUserName={currentUser.nome}
      />

      <ModalInventario
        isOpen={modalInventarioOpen}
        onClose={() => setModalInventarioOpen(false)}
        materiais={materiais}
        saldosMap={saldosMap}
        inventarioAtivo={inventarioSelecionado}
        onSuccess={() => {
          // Atualização automática via onSnapshot realtime listener
        }}
        currentUser={currentUser}
      />

      <ModalEtiquetaMaterial
        isOpen={modalEtiquetaOpen}
        onClose={() => setModalEtiquetaOpen(false)}
        material={materialParaEtiqueta}
        saldo={materialParaEtiqueta ? saldosMap[materialParaEtiqueta.id] : null}
      />

      <ModalEstornoMovimentacao
        isOpen={modalEstornoOpen}
        onClose={() => setModalEstornoOpen(false)}
        movimentacao={movimentacaoParaEstorno}
        onSuccess={() => {
          // Atualização automática via onSnapshot realtime listener
        }}
        currentUser={currentUser}
      />

      <ModalDetalhesMaterial
        isOpen={modalDetalhesOpen}
        onClose={() => setModalDetalhesOpen(false)}
        material={materialParaDetalhes}
        saldo={materialParaDetalhes ? saldosMap[materialParaDetalhes.id] : null}
        onEdit={(m) => {
          setMaterialParaEditar(m);
          setModalCadastroOpen(true);
        }}
        onEntrada={(m) => {
          setMaterialPreSelecionado(m);
          setModalEntradaOpen(true);
        }}
        onSaida={(m) => {
          setMaterialPreSelecionado(m);
          setModalSaidaOpen(true);
        }}
        onEtiqueta={(m) => {
          setMaterialParaEtiqueta(m);
          setModalEtiquetaOpen(true);
        }}
      />
    </div>
  );
};
