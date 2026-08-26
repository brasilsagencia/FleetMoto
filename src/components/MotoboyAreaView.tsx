import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Entrega, Motoboy } from '../types';
import {
  formatNumber,
  formatDateTime,
  getStatusBadgeClass,
} from '../utils/formatters';

interface MotoboyAreaViewProps {
  motoboys: Motoboy[];
  entregas: Entrega[];
  onCompleteDelivery: (
    entregaId: string,
    podData: {
      fotoUrl: string;
      assinaturaBase64: string;
      nomeRecebedor: string;
      documentoRecebedor: string;
      telefoneRecebedor?: string;
      dataHora: string;
      localizacaoGps: string;
      notas?: string;
    }
  ) => void;
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

  // POD Form State
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [selectedEntregaParaPOD, setSelectedEntregaParaPOD] =
    useState<Entrega | null>(null);

  const [nomeRecebedor, setNomeRecebedor] = useState('');
  const [documentoRecebedor, setDocumentoRecebedor] = useState('');
  const [telefoneRecebedor, setTelefoneRecebedor] = useState('');
  const [notasEntrega, setNotasEntrega] = useState('Material conferido e lacre íntegro no comitê.');
  const [selectedPhoto, setSelectedPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=80'
  );

  // Canvas Digital Signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Initialize canvas
  useEffect(() => {
    if (isPodModalOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isPodModalOpen]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleOpenPODModal = (entrega: Entrega) => {
    setSelectedEntregaParaPOD(entrega);
    setNomeRecebedor(entrega.responsavelRecebimento || '');
    setDocumentoRecebedor('RG 29.841.019-X');
    setTelefoneRecebedor(entrega.telefoneContato || '');
    setIsPodModalOpen(true);
    setHasSignature(false);
  };

  const handleFinishPOD = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntregaParaPOD) return;

    if (!nomeRecebedor) {
      alert('Por favor, informe o nome de quem está recebendo o material.');
      return;
    }

    const canvas = canvasRef.current;
    const signatureDataUrl = canvas
      ? canvas.toDataURL('image/png')
      : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M 10 40 Q 60 10 110 45 T 190 30" stroke="%231E293B" stroke-width="3" fill="none"/></svg>';

    const nowStr = new Date();
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(nowStr);

    onCompleteDelivery(selectedEntregaParaPOD.id, {
      fotoUrl: selectedPhoto,
      assinaturaBase64: signatureDataUrl,
      nomeRecebedor: nomeRecebedor,
      documentoRecebedor: documentoRecebedor || 'CPF / RG Conferido no Local',
      telefoneRecebedor: telefoneRecebedor,
      dataHora: `${formattedDate}`,
      localizacaoGps: `-23.550520, -46.633308 (${selectedEntregaParaPOD.zonaEleitoral})`,
      notas: notasEntrega,
    });

    setIsPodModalOpen(false);

    // Fire celebratory confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const samplePhotos = [
    {
      label: 'Santinhos no Balcão Comitê',
      url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=80',
    },
    {
      label: 'Bandeiras e Praguinhas',
      url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=80',
    },
    {
      label: 'Adesivos Perfurados e Caixas',
      url: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=500&auto=format&fit=crop&q=80',
    },
  ];

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

      {/* Modal Interativo de Assinatura e Foto do POD */}
      {isPodModalOpen && selectedEntregaParaPOD && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#E05328] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Comprovação de Entrega (POD TSE)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {selectedEntregaParaPOD.codigoRastreio}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPodModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFinishPOD} className="space-y-4 mt-4">
              {/* Photo Preview & Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-orange-600" />
                  Foto da Entrega do Material no Comitê *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {samplePhotos.map((photo, i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setSelectedPhoto(photo.url)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all h-20 ${
                        selectedPhoto === photo.url
                          ? 'border-[#E05328] ring-2 ring-orange-500/20'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.label}
                        className="w-full h-full object-cover"
                      />
                      {selectedPhoto === photo.url && (
                        <div className="absolute inset-0 bg-[#E05328]/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Selecione a foto comprobatória da entrega de materiais.
                </p>
              </div>

              {/* Nome e Documento do Recebedor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Recebedor no Comitê *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Jorge Luis Santana"
                    value={nomeRecebedor}
                    onChange={(e) => setNomeRecebedor(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#E05328]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    RG ou CPF do Recebedor
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: RG 28.491.022-X"
                    value={documentoRecebedor}
                    onChange={(e) => setDocumentoRecebedor(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-mono focus:ring-2 focus:ring-[#E05328]/30"
                  />
                </div>
              </div>

              {/* Assinatura Digital no Canvas */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-orange-600" />
                    Assinatura Digital do Responsável (Desenhe abaixo) *
                  </label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[11px] text-[#E05328] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Limpar
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden relative touch-none">
                  <canvas
                    ref={canvasRef}
                    width={440}
                    height={110}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-28 cursor-crosshair"
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
                      Assine aqui com o dedo ou mouse
                    </div>
                  )}
                </div>
              </div>

              {/* Localização GPS Carimbada */}
              <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600 flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>GPS: -23.550520, -46.633308</span>
                </div>
                <span className="text-emerald-700 font-bold">● Válido TSE</span>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPodModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar & Concluir Entrega</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
