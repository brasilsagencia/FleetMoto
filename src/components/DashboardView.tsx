import React from 'react';
import {
  TrendingUp,
  Package,
  Users,
  Navigation,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Bike,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  MapPin,
  FileCheck,
  Smartphone,
} from 'lucide-react';
import { Comite, Motoboy, Entrega } from '../types';
import {
  formatCurrency,
  formatNumber,
  formatDateTime,
  getStatusBadgeClass,
} from '../utils/formatters';
import { TabType } from './Sidebar';

interface DashboardViewProps {
  comites: Comite[];
  motoboys: Motoboy[];
  entregas: Entrega[];
  onNavigate: (tab: TabType) => void;
  onOpenPODModal: (entrega: Entrega) => void;
  onNewDelivery: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  comites,
  motoboys,
  entregas,
  onNavigate,
  onOpenPODModal,
  onNewDelivery,
}) => {
  // Metrics calculation
  const entregasHoje = entregas.length;
  const entregasConcluidas = entregas.filter((e) => e.status === 'entregue').length;
  const entregasEmTransito = entregas.filter((e) => e.status === 'em_transito').length;
  const entregasPendentes = entregas.filter((e) => e.status === 'pendente').length;
  const taxaConclusao = entregasHoje > 0 ? Math.round((entregasConcluidas / entregasHoje) * 100) : 0;

  const motoboysAtivos = motoboys.filter(
    (m) => m.status === 'disponivel' || m.status === 'em_rota'
  ).length;

  const volumeTotalSantinhos = entregas.reduce((acc, curr) => {
    if (curr.tipoMaterial === 'santinhos' || curr.tipoMaterial === 'praguinhas') {
      return acc + curr.quantidade;
    }
    return acc;
  }, 0);

  const totalBandeiras = entregas.reduce((acc, curr) => {
    if (curr.tipoMaterial === 'bandeiras' || curr.tipoMaterial === 'combo_comicio') {
      return acc + curr.quantidade;
    }
    return acc;
  }, 0);

  // Group by Electoral Zones for zone breakdown
  const zoneBreakdown = [
    {
      zona: '001ª Zona Eleitoral (Bela Vista / Centro)',
      total: 3,
      concluidas: 2,
      percent: 66,
      lider: 'Lucas Rafael (FMT-4E28)',
    },
    {
      zona: '252ª Zona Eleitoral (Tatuapé / Z. Leste)',
      total: 2,
      concluidas: 2,
      percent: 100,
      lider: 'Geraldo Magela (ELE-2026)',
    },
    {
      zona: '002ª Zona Eleitoral (Perdizes / Paulista)',
      total: 2,
      concluidas: 1,
      percent: 50,
      lider: 'Bruno Henrique (VOT-7A99)',
    },
    {
      zona: '258ª Zona Eleitoral (Santo Amaro / Z. Sul)',
      total: 2,
      concluidas: 0,
      percent: 0,
      lider: 'Aguardando Despacho',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Election Alert Banner */}
      <div className="bg-gradient-to-r from-[#1A1A1E] via-slate-900 to-[#2A1D1A] rounded-2xl p-4 lg:p-6 text-white border border-slate-800 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 text-[#E05328] border border-orange-500/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              Operação Reta Final • Campanha Eleitoral 2026
            </div>
            <h2 className="text-xl lg:text-2xl font-black tracking-tight text-white font-sans">
              Logística & Distribuição de Material em Tempo Real
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Monitoramento instantâneo de motoboys credenciados, baús lacrados e comprovação de entrega (POD) com validação para prestação de contas no TSE.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('motoboy_app')}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-orange-300 hover:text-white border border-orange-500/30 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Smartphone className="w-4 h-4 text-[#E05328]" />
              <span>Simular App Motoboy</span>
            </button>
            <button
              onClick={onNewDelivery}
              className="px-4 py-2.5 rounded-xl bg-[#E05328] hover:bg-orange-700 text-white text-xs font-bold shadow-lg shadow-orange-950/40 flex items-center gap-2 transition-all"
            >
              <Navigation className="w-4 h-4" />
              <span>Despachar Entrega</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Entregas Hoje */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Entregas Hoje
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-3xl font-black text-slate-900 font-sans">
                {entregasHoje}
              </h3>
              <span className="text-xs font-bold text-emerald-600">
                {taxaConclusao}% concluído
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
              <span className="text-amber-600 font-semibold">{entregasEmTransito} em trânsito</span>
              <span>•</span>
              <span className="text-blue-600 font-semibold">{entregasPendentes} na fila</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#E05328] flex items-center justify-center border border-orange-100 shrink-0">
            <Navigation className="w-6 h-6" />
          </div>
        </div>

        {/* Motoboys em Campo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Motoboys Ativos
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-3xl font-black text-slate-900 font-sans">
                {motoboysAtivos}
              </h3>
              <span className="text-xs font-medium text-slate-500">
                de {motoboys.length} frotistas
              </span>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              100% CNHs e baús validados
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
            <Bike className="w-6 h-6" />
          </div>
        </div>

        {/* Santinhos & Praguinhas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Santinhos Despachados
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-3xl font-black text-slate-900 font-sans">
                {formatNumber(volumeTotalSantinhos)}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-2">
              Unidades impressas e distribuídas
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Bandeiras & Comícios */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Bandeiras & Kits
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-3xl font-black text-slate-900 font-sans">
                {formatNumber(totalBandeiras)}
              </h3>
            </div>
            <p className="text-[11px] text-orange-600 font-medium mt-2">
              Para caminhadas e semáforos
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Realtime Deliveries & Electoral Zone Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Deliveries Feed (2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#E05328] flex items-center justify-center">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Rotas em Andamento & Despachos Urgentes
                  </h3>
                  <p className="text-xs text-slate-500">
                    Materiais de campanha em trânsito com localização GPS
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('entregas')}
                className="text-xs font-bold text-[#E05328] hover:text-orange-700 flex items-center gap-1"
              >
                <span>Ver todas ({entregas.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Delivery Items */}
            <div className="divide-y divide-slate-100 mt-2">
              {entregas.slice(0, 4).map((entrega) => {
                const statusStyle = getStatusBadgeClass(entrega.status);
                const isUrgent = entrega.prioridade === 'urgente_comicio';

                return (
                  <div
                    key={entrega.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group hover:bg-slate-50/60 rounded-xl px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          isUrgent
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {entrega.codigoRastreio}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800">
                            {entrega.partido}
                          </span>
                          {isUrgent && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Urgente Comício
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-slate-800 mt-1">
                          {entrega.descricaoMaterial} ({formatNumber(entrega.quantidade)} {entrega.unidadeMedida})
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {entrega.bairro} ({entrega.zonaEleitoral})
                          </span>
                          {entrega.motoboyNome && (
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <Bike className="w-3 h-3 text-orange-600" />
                              {entrega.motoboyNome} ({entrega.motoboyPlaca})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusStyle.bg} ${statusStyle.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          <span className="capitalize">{entrega.status.replace('_', ' ')}</span>
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Previsão: {formatDateTime(entrega.dataPrevisao).slice(11)}
                        </div>
                      </div>

                      {entrega.comprovantePOD ? (
                        <button
                          onClick={() => onOpenPODModal(entrega)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition-colors"
                          title="Ver Comprovante Digital com Foto e Assinatura"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>POD TSE</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onNavigate('motoboy_app')}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-600 text-xs font-semibold transition-colors"
                        >
                          Acompanhar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Shortcuts Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onNavigate('comites')}
              className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <Building2 className="w-5 h-5 text-orange-600" />
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Gestão de Comitês</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {comites.length} comitês & candidatos ativos
              </p>
            </button>

            <button
              onClick={() => onNavigate('adesivagem')}
              className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Adesivagem de Baús</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Validação de compliance eleitoral
              </p>
            </button>

            <button
              onClick={() => onNavigate('relatorios')}
              className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <h4 className="font-bold text-slate-900 text-xs">Dossiê de Contas TSE</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Exportação de comprovantes e fotos
              </p>
            </button>
          </div>
        </div>

        {/* Right Column: Zone Progress & Motoboy Fleet Live */}
        <div className="space-y-4">
          {/* Electoral Zones Progress */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Distribuição por Zona Eleitoral
              </h3>
              <span className="text-[10px] text-slate-500 font-medium">Meta Diária</span>
            </div>

            <div className="space-y-3.5 mt-3">
              {zoneBreakdown.map((z, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-[180px]" title={z.zona}>
                      {z.zona}
                    </span>
                    <span className="font-bold text-slate-900">{z.percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        z.percent === 100
                          ? 'bg-emerald-500'
                          : z.percent >= 50
                          ? 'bg-orange-500'
                          : 'bg-amber-400'
                      }`}
                      style={{ width: `${z.percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{z.concluidas} de {z.total} entregas</span>
                    <span>{z.lider}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Motoboys Status Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Status dos Motoboys
              </h3>
              <button
                onClick={() => onNavigate('motoboys')}
                className="text-xs font-bold text-[#E05328] hover:underline"
              >
                Gerenciar
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {motoboys.slice(0, 4).map((moto) => {
                const statusStyle = getStatusBadgeClass(moto.status);

                return (
                  <div key={moto.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={moto.fotoUrl}
                        alt={moto.nome}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {moto.nome}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {moto.placaMoto} • {moto.tipoFrota === 'propria' ? 'Própria' : 'Alugada'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyle.bg} ${statusStyle.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      <span className="capitalize">{moto.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
