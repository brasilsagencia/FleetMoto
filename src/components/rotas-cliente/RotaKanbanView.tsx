import React from 'react';
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Package,
  Phone,
  Navigation,
  ShieldCheck,
  ChevronRight,
  User,
  ArrowRight,
} from 'lucide-react';
import { PontoEntregaRota, StatusParadaRota } from '../../types';
import { REGIOES_CONFIG, gerarLinkWaze } from '../../utils/geoRegions';

interface RotaKanbanViewProps {
  paradas: PontoEntregaRota[];
  onUpdateStatus: (paradaId: string, novoStatus: StatusParadaRota, motivo?: string) => Promise<void>;
  onOpenPOD: (parada: PontoEntregaRota) => void;
}

interface KanbanCol {
  id: string;
  title: string;
  statuses: StatusParadaRota[];
  badgeBg: string;
  headerColor: string;
}

const KANBAN_COLS: KanbanCol[] = [
  {
    id: 'pendente',
    title: 'Pendente',
    statuses: ['Pendente'],
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    headerColor: 'border-slate-400 text-slate-700',
  },
  {
    id: 'separando',
    title: 'Separando & Saída',
    statuses: ['Separando material', 'Aguardando saída'],
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    headerColor: 'border-amber-500 text-amber-800',
  },
  {
    id: 'em_rota',
    title: 'Em Rota / No Local',
    statuses: ['Em rota', 'Chegou ao local'],
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
    headerColor: 'border-blue-500 text-blue-800',
  },
  {
    id: 'entregue',
    title: 'Entregue (POD)',
    statuses: ['Entregue'],
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    headerColor: 'border-emerald-500 text-emerald-800',
  },
  {
    id: 'ocorrencias',
    title: 'Ocorrências & Insucesso',
    statuses: ['Não entregue', 'Endereço não localizado', 'Destinatário ausente', 'Reagendada', 'Cancelada'],
    badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
    headerColor: 'border-rose-500 text-rose-800',
  },
];

export const RotaKanbanView: React.FC<RotaKanbanViewProps> = ({
  paradas,
  onUpdateStatus,
  onOpenPOD,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {KANBAN_COLS.map((col) => {
        const colParadas = paradas.filter((p) => col.statuses.includes(p.status));

        return (
          <div
            key={col.id}
            className="bg-slate-100/80 rounded-3xl p-3 border border-slate-200/90 flex flex-col min-h-[460px]"
          >
            {/* Header da Coluna */}
            <div className={`flex items-center justify-between pb-2.5 mb-3 border-b-2 ${col.headerColor}`}>
              <h4 className="font-bold text-xs sm:text-sm tracking-tight flex items-center gap-1.5">
                {col.title}
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono border ${col.badgeBg}`}>
                {colParadas.length}
              </span>
            </div>

            {/* Lista de Cards da Coluna */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[640px] pr-0.5">
              {colParadas.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs italic border-2 border-dashed border-slate-200 rounded-2xl">
                  Nenhuma parada nesta etapa
                </div>
              ) : (
                colParadas.map((parada) => {
                  const regConfig = REGIOES_CONFIG[parada.regiao] || REGIOES_CONFIG['Zona Norte'];
                  const isEntregue = parada.status === 'Entregue';

                  return (
                    <div
                      key={parada.id}
                      className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-2.5"
                    >
                      {/* Topo do Card: Número, Nome e Badge Região */}
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-lg bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                            #{parada.ordemSequencia}
                          </span>
                          <span className="font-bold text-slate-900 text-xs line-clamp-1">
                            {parada.nomeDestinatario}
                          </span>
                        </div>

                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border shrink-0 ${regConfig.badgeClass}`}>
                          {parada.regiao}
                        </span>
                      </div>

                      {/* Endereço Resumido */}
                      <div className="flex items-start gap-1 text-[11px] text-slate-600">
                        <MapPin className="w-3 h-3 text-[#E05328] shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-tight">
                          {parada.enderecoCompleto}, {parada.numeroComplemento} - {parada.bairro}
                        </span>
                      </div>

                      {/* Material & Janela */}
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between text-[10px]">
                        <div className="truncate max-w-[140px]">
                          <span className="font-bold text-slate-800">{parada.quantidadeMaterial}x</span>{' '}
                          <span className="text-slate-600">{parada.tipoMaterial}</span>
                        </div>
                        <span className="font-semibold text-slate-500">{parada.horarioJanelaEntrega}</span>
                      </div>

                      {/* Prioridade & Telefone */}
                      <div className="flex items-center justify-between text-[10px]">
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                          parada.prioridade === 'urgente'
                            ? 'bg-rose-100 text-rose-700'
                            : parada.prioridade === 'alta'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {parada.prioridade}
                        </span>

                        <a
                          href={`https://wa.me/55${parada.telefone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:underline font-bold flex items-center gap-0.5"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          {parada.telefone}
                        </a>
                      </div>

                      {/* Botões de Ação do Card */}
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        {isEntregue ? (
                          <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center justify-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Concluído com POD TSE</span>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-1.5">
                              <a
                                href={gerarLinkWaze(parada)}
                                target="_blank"
                                rel="noreferrer"
                                className="py-1 px-2 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-[10px] font-bold flex items-center justify-center gap-1 border border-cyan-200"
                              >
                                <Navigation className="w-2.5 h-2.5" /> Waze
                              </a>

                              <button
                                onClick={() => onOpenPOD(parada)}
                                className="py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-xs"
                              >
                                <ShieldCheck className="w-2.5 h-2.5" /> POD
                              </button>
                            </div>

                            {/* Seletor rápido de Status */}
                            <select
                              value={parada.status}
                              onChange={(e) => onUpdateStatus(parada.id, e.target.value as StatusParadaRota)}
                              className="w-full text-[10px] py-1 px-2 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:bg-white cursor-pointer"
                            >
                              <option value="Pendente">● Pendente</option>
                              <option value="Separando material">● Separando material</option>
                              <option value="Aguardando saída">● Aguardando saída</option>
                              <option value="Em rota">● Em rota</option>
                              <option value="Chegou ao local">● Chegou ao local</option>
                              <option value="Não entregue">● Não entregue</option>
                              <option value="Endereço não localizado">● Endereço não localizado</option>
                              <option value="Destinatário ausente">● Destinatário ausente</option>
                              <option value="Reagendada">● Reagendada</option>
                              <option value="Cancelada">● Cancelada</option>
                            </select>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
