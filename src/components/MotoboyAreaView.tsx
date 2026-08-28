import React, { useState } from 'react';
import {
  Smartphone,
  Navigation,
  CheckCircle2,
  Camera,
  PenTool,
  MapPin,
  Phone,
  Package,
  Clock,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  FileText,
  Bike,
  Loader2,
} from 'lucide-react';
import { Entrega, Motoboy, ComprovantePOD } from '../types';
import {
  formatNumber,
  formatDateTime,
  getStatusBadgeClass,
} from '../utils/formatters';
import { MotoboyPODFlowModal } from './motoboy/MotoboyPODFlowModal';

interface MotoboyAreaViewProps {
  motoboys: Motoboy[];
  entregas: Entrega[];
  onCompleteDelivery: (
    entregaId: string,
    podData: ComprovantePOD
  ) => void | Promise<void>;
  onOpenPODModal: (entrega: Entrega) => void;
}

export const MotoboyAreaView: React.FC<MotoboyAreaViewProps> = ({
  motoboys,
  entregas,
  onCompleteDelivery,
  onOpenPODModal,
}) => {
  const [selectedMotoboyId, setSelectedMotoboyId] = useState<string>(
    motoboys[0]?.id || 'moto-1'
  );
  const selectedMotoboy =
    motoboys.find((m) => m.id === selectedMotoboyId) || motoboys[0];

  // Entregas do motoboy selecionado
  const entregasMotoboy = entregas.filter(
    (e) => e.motoboyId === selectedMotoboy.id
  );

  const entregaAtiva =
    entregasMotoboy.find((e) => e.status === 'em_transito') ||
    entregasMotoboy.find((e) => e.status === 'atribuida') ||
    entregasMotoboy[0];

  // POD Modal State
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [selectedEntregaParaPOD, setSelectedEntregaParaPOD] =
    useState<Entrega | null>(null);

  const handleOpenPODModal = (entrega: Entrega) => {
    setSelectedEntregaParaPOD(entrega);
    setIsPodModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Motoboy Switcher Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#E05328] flex items-center justify-center font-bold">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Simulador da Área do Motoboy (App Mobile)
            </h3>
            <p className="text-xs text-slate-500">
              Teste a experiência de campo do motoboy com confirmação de entrega (POD)
            </p>
          </div>
        </div>

        {/* Select active motoboy */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Motoboy Logado:</span>
          <select
            value={selectedMotoboyId}
            onChange={(e) => setSelectedMotoboyId(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E05328]/30"
          >
            {motoboys.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome} ({m.placaMoto})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Layout: Mobile Device Simulator + Realtime Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Mobile Phone Device Wrapper (5 Cols) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-[380px] bg-[#1A1A1E] p-3 rounded-[36px] shadow-2xl border-4 border-slate-800">
            {/* Phone Top Notch */}
            <div className="h-6 flex items-center justify-between px-5 mb-1 text-[11px] text-slate-400 font-mono font-semibold">
              <span>09:42</span>
              <div className="w-20 h-4 bg-black rounded-full mx-auto" />
              <span>5G 100%</span>
            </div>

            {/* Mobile Screen Content */}
            <div className="bg-[#F8F9FA] rounded-[28px] overflow-hidden min-h-[620px] text-slate-900 flex flex-col justify-between border border-slate-300/40">
              {/* Mobile Header */}
              <div className="bg-[#1A1A1E] text-white p-4 pb-5 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={selectedMotoboy.fotoUrl}
                      alt={selectedMotoboy.nome}
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#E05328]"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-white">
                        {selectedMotoboy.nome.split(' ')[0]} {selectedMotoboy.nome.split(' ')[1]}
                      </h4>
                      <p className="text-[10px] text-orange-400 font-mono">
                        {selectedMotoboy.placaMoto} • {selectedMotoboy.tipoFrota === 'propria' ? 'Frota Própria' : 'Alugada'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Online
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-center">
                  <div className="bg-slate-900/60 p-2 rounded-xl">
                    <p className="text-[9px] text-slate-400 uppercase">Diária Hoje</p>
                    <p className="text-sm font-black text-white">R$ 190,00</p>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-xl">
                    <p className="text-[9px] text-slate-400 uppercase">Entregas</p>
                    <p className="text-sm font-black text-emerald-400">{entregasMotoboy.length}</p>
                  </div>
                </div>
              </div>

              {/* Mobile Body: Active Route Card */}
              <div className="p-3.5 flex-1 space-y-3 overflow-y-auto max-h-[460px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Suas Corridas de Campanha
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {entregasMotoboy.length} atribuídas
                  </span>
                </div>

                {entregasMotoboy.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                    <Bike className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700 text-xs">Nenhuma rota ativa</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Aguardando novo despacho de material pela central de logística.
                    </p>
                  </div>
                ) : (
                  entregasMotoboy.map((ent) => {
                    const isEntregue = ent.status === 'entregue';
                    const isUrgent = ent.prioridade === 'urgente_comicio';

                    return (
                      <div
                        key={ent.id}
                        className={`bg-white rounded-2xl p-3.5 border shadow-xs space-y-2.5 transition-all ${
                          isEntregue
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : isUrgent
                            ? 'border-orange-300 ring-1 ring-orange-400/30'
                            : 'border-slate-200'
                        }`}
                      >
                        {/* Title & Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-[#E05328] font-mono">
                              {ent.codigoRastreio}
                            </span>
                            <h5 className="font-bold text-xs text-slate-900 mt-1">
                              {ent.comiteNome}
                            </h5>
                          </div>
                          {isEntregue ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Entregue
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                              Em Rota
                            </span>
                          )}
                        </div>

                        {/* Material Info */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">
                              {ent.descricaoMaterial}
                            </span>
                            <span className="font-bold text-[#E05328]">
                              {formatNumber(ent.quantidade)} {ent.unidadeMedida}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Peso: ~{ent.pesoKg}kg • Lacre de segurança verificado
                          </p>
                        </div>

                        {/* Address & Contact */}
                        <div className="text-[11px] space-y-1 text-slate-600">
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Destino:</strong> {ent.enderecoDestino} ({ent.zonaEleitoral})
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>
                              <strong>Recebedor:</strong> {ent.responsavelRecebimento} ({ent.telefoneContato})
                            </span>
                          </div>
                        </div>

                        {/* Buttons Action */}
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(ent.enderecoDestino)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 transition-colors"
                          >
                            <Navigation className="w-3 h-3 text-slate-600" />
                            <span>GPS Rota</span>
                          </a>

                          {isEntregue ? (
                            <button
                              onClick={() => onOpenPODModal(ent)}
                              className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 transition-colors"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Ver POD</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenPODModal(ent)}
                              className="flex-1 py-1.5 bg-[#E05328] hover:bg-orange-700 text-white font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 shadow-sm transition-all"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirmar POD</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Mobile Bottom Footer Navigation */}
              <div className="p-3 bg-white border-t border-slate-200 text-[10px] text-center text-slate-400 font-medium">
                FleetMoto Mobile • Conexão Criptografada TSE 2026
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Step-by-Step Logistics Field Guide & Fast Test (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Como Funciona a Comprovação de Entrega (POD Eleitoral)
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Para atender aos rigorosos critérios do Tribunal Superior Eleitoral (TSE) para prestação de contas de campanhas, todas as entregas exigem:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#E05328] flex items-center justify-center font-bold text-xs mb-2">
                  1
                </div>
                <h5 className="font-bold text-xs text-slate-900">Foto no Comitê</h5>
                <p className="text-[11px] text-slate-500">
                  Registro visual dos fardos de santinhos ou bandeiras descarregados.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs mb-2">
                  2
                </div>
                <h5 className="font-bold text-xs text-slate-900">Assinatura Digital</h5>
                <p className="text-[11px] text-slate-500">
                  Rubrica digital do responsável no comitê de bairro na tela do celular.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs mb-2">
                  3
                </div>
                <h5 className="font-bold text-xs text-slate-900">Geolocalização GPS</h5>
                <p className="text-[11px] text-slate-500">
                  Coordenadas com data/hora exata e zona eleitoral carimbadas no PDF.
                </p>
              </div>
            </div>
          </div>

          {/* Quick POD launcher for active delivery */}
          {entregaAtiva && entregaAtiva.status !== 'entregue' && (
            <div className="bg-orange-50 border border-orange-200 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-900 uppercase">
                  Entrega Pronta Para Finalização
                </span>
                <span className="text-[10px] font-mono bg-orange-200 text-orange-900 px-2 py-0.5 rounded font-bold">
                  {entregaAtiva.codigoRastreio}
                </span>
              </div>
              <h5 className="font-black text-slate-900 text-base">
                {entregaAtiva.comiteNome}
              </h5>
              <p className="text-xs text-slate-700">
                Material: <strong>{entregaAtiva.descricaoMaterial}</strong> ({formatNumber(entregaAtiva.quantidade)} un)
              </p>
              <button
                onClick={() => handleOpenPODModal(entregaAtiva)}
                className="w-full py-3 rounded-xl bg-[#E05328] hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-950/20 flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Abrir Tela de Confirmação & Assinatura (POD)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Interativo de Assinatura, Foto da Câmera e Termo do POD */}
      {isPodModalOpen && selectedEntregaParaPOD && (
        <MotoboyPODFlowModal
          entrega={selectedEntregaParaPOD}
          motoboy={selectedMotoboy}
          onClose={() => {
            setIsPodModalOpen(false);
            setSelectedEntregaParaPOD(null);
          }}
          onSuccess={async (entregaId, podData) => {
            await onCompleteDelivery(entregaId, podData);
          }}
        />
      )}
    </div>
  );
};
