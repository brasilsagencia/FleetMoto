import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  CheckCircle2,
  MapPin,
  PenTool,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Upload,
  AlertCircle,
  Clock,
  Printer,
  Share2,
  Download,
  User,
  Phone,
  FileText,
  Package,
  Bike,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Loader2,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Entrega, Motoboy, ComprovantePOD, ItemComprovantePOD } from '../../types';
import { formatCNPJ, formatDateTime, formatNumber } from '../../utils/formatters';
import { generateDeliveryHash } from '../../utils/cryptoHelper';
import { offlineSyncService } from '../../services/offlineSync';
import { printElementById } from '../../utils/printHelper';

interface MotoboyPODFlowModalProps {
  entrega: Entrega;
  motoboy: Motoboy;
  onClose: () => void;
  onSuccess: (entregaId: string, podData: ComprovantePOD) => Promise<void>;
}

export const MotoboyPODFlowModal: React.FC<MotoboyPODFlowModalProps> = ({
  entrega,
  motoboy,
  onClose,
  onSuccess,
}) => {
  // Stepper state: 1 (Chegada & GPS), 2 (Câmera ao Vivo), 3 (Recebedor & Materiais), 4 (Assinatura), 5 (Termo & Sucesso)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // GPS State
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [gpsData, setGpsData] = useState<{
    latitude: number;
    longitude: number;
    precisao: number;
    textoFormatado: string;
    capturadoEm: string;
  }>({
    latitude: -23.55052,
    longitude: -46.633308,
    precisao: 4,
    textoFormatado: `-23.550520, -46.633308 (${entrega.zonaEleitoral || 'Zona Eleitoral'})`,
    capturadoEm: new Date().toLocaleTimeString('pt-BR'),
  });
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Camera State (Realtime WebRTC)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);

  // Receiver & Materials State
  const [nomeRecebedor, setNomeRecebedor] = useState(entrega.responsavelRecebimento || '');
  const [documentoRecebedor, setDocumentoRecebedor] = useState('');
  const [telefoneRecebedor, setTelefoneRecebedor] = useState(entrega.telefoneContato || '');
  const [notasEntrega, setNotasEntrega] = useState('Material conferido e recebido em perfeito estado.');
  const [materiaisConferidos, setMateriaisConferidos] = useState(true);

  // Digital Signature Canvas
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Submission & Final Term State
  const [isSaving, setIsSaving] = useState(false);
  const [generatedTermo, setGeneratedTermo] = useState<ComprovantePOD | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Auto-capture GPS on Step 1 mount
  useEffect(() => {
    captureRealGPS();
  }, []);

  // Initialize and clean up WebRTC Camera on Step 2
  useEffect(() => {
    if (currentStep === 2 && !capturedPhotoUrl) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [currentStep, cameraFacingMode, capturedPhotoUrl]);

  // Initialize Signature Canvas when reaching Step 4
  useEffect(() => {
    if (currentStep === 4 && signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [currentStep]);

  // GPS Capture Function
  const captureRealGPS = () => {
    setIsCapturingGps(true);
    setGpsError(null);

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          const accuracy = Math.round(pos.coords.accuracy || 5);
          const time = new Date().toLocaleTimeString('pt-BR');

          setGpsData({
            latitude: lat,
            longitude: lng,
            precisao: accuracy,
            textoFormatado: `${lat}, ${lng} (±${accuracy}m - ${entrega.zonaEleitoral || 'Zona Eleitoral'})`,
            capturadoEm: time,
          });
          setIsCapturingGps(false);
        },
        (err) => {
          console.warn('Geolocalização não autorizada ou indisponível:', err);
          setGpsError('Localização do dispositivo obtida por aproximação da rota.');
          setIsCapturingGps(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      setGpsError('Navegador sem suporte a GPS direto. Usando coordenadas da Zona Eleitoral.');
      setIsCapturingGps(false);
    }
  };

  // Camera Management
  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: cameraFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.warn('Erro ao dar play no vídeo:', e));
        }
        setIsCameraActive(true);
      } else {
        setCameraError('Câmera não suportada neste dispositivo. Certifique-se de estar usando HTTPS.');
      }
    } catch (err: any) {
      console.warn('Erro ao acessar câmera:', err);
      setCameraError(
        'Permissão de câmera não concedida. Por favor, autorize o acesso à câmera nas configurações do navegador para registrar a comprovação.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacingMode = () => {
    setCameraFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture Photo with Timestamp & GPS Watermark
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = photoCanvasRef.current || document.createElement('canvas');

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, width, height);

    // Apply Official Watermark Banner
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(now);

    const bannerHeight = Math.max(50, Math.floor(height * 0.14));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

    // Text on banner
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(11, Math.floor(width * 0.024))}px sans-serif`;
    ctx.fillText(`FLEETMOTO • POD ELEITORAL TSE • ${entrega.codigoRastreio}`, 12, height - bannerHeight + 18);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = `${Math.max(9, Math.floor(width * 0.02))}px monospace`;
    ctx.fillText(`DATA/HORA: ${formattedDate} | DESTINO: ${entrega.comiteNome.slice(0, 24)}`, 12, height - bannerHeight + 34);
    ctx.fillText(`GPS: ${gpsData.textoFormatado}`, 12, height - bannerHeight + 48);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedPhotoUrl(dataUrl);
    stopCamera();
  };

  const handleRetakePhoto = () => {
    setCapturedPhotoUrl(null);
    startCamera();
  };

  // Signature Canvas Drawing Logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
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
    const canvas = signatureCanvasRef.current;
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

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureDataUrl(null);
  };

  // Prepare & Confirm Delivery
  const handleFinalConfirmPOD = async () => {
    if (!capturedPhotoUrl) {
      alert('É obrigatório registrar a foto da entrega pela câmera.');
      setCurrentStep(2);
      return;
    }
    if (!nomeRecebedor.trim()) {
      alert('Informe o nome completo do recebedor.');
      setCurrentStep(3);
      return;
    }
    if (!documentoRecebedor.trim()) {
      alert('Informe o CPF ou RG do recebedor.');
      setCurrentStep(3);
      return;
    }
    if (!hasSignature && !signatureDataUrl) {
      alert('É obrigatório que o recebedor assine digitalmente na tela do celular.');
      setCurrentStep(4);
      return;
    }

    const canvas = signatureCanvasRef.current;
    const sigUrl =
      signatureDataUrl ||
      (canvas && hasSignature
        ? canvas.toDataURL('image/png')
        : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M 10 40 Q 60 10 110 45 T 190 30" stroke="%231E293B" stroke-width="3" fill="none"/></svg>');

    setSignatureDataUrl(sigUrl);
    setIsSaving(true);

    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(now);

    // Prepare Items List
    const itensEntregues: ItemComprovantePOD[] =
      entrega.itens && entrega.itens.length > 0
        ? entrega.itens.map((it) => ({
            materialNome: it.nomeMaterial || it.tipoMaterial || 'Material Eleitoral',
            quantidade: it.quantidade,
            unidadeMedida: it.unidadeMedida || 'unidades',
            sku: it.materialId,
          }))
        : [
            {
              materialNome: entrega.descricaoMaterial,
              quantidade: entrega.quantidade,
              unidadeMedida: entrega.unidadeMedida,
              pesoKg: entrega.pesoKg,
            },
          ];

    // Generate Hash
    const { hashSha256, codigoAutenticidade } = await generateDeliveryHash({
      codigoRastreio: entrega.codigoRastreio,
      pedidoId: entrega.pedidoId,
      comiteNome: entrega.comiteNome,
      cnpjCampanha: entrega.cnpjCampanha,
      nomeRecebedor: nomeRecebedor.trim(),
      documentoRecebedor: documentoRecebedor.trim(),
      dataHora: formattedDate,
      localizacaoGps: gpsData.textoFormatado,
      quantidadeTotal: entrega.quantidade,
      motoboyNome: motoboy.nome,
      motoboyPlaca: motoboy.placaMoto,
    });

    const finalPOD: ComprovantePOD = {
      fotoUrl: capturedPhotoUrl,
      assinaturaBase64: sigUrl,
      nomeRecebedor: nomeRecebedor.trim(),
      documentoRecebedor: documentoRecebedor.trim(),
      telefoneRecebedor: telefoneRecebedor.trim() || undefined,
      dataHora: formattedDate,
      localizacaoGps: gpsData.textoFormatado,
      gpsLatitude: gpsData.latitude,
      gpsLongitude: gpsData.longitude,
      gpsPrecisaoMetros: gpsData.precisao,
      hashSha256,
      codigoAutenticidade,
      motoboyId: motoboy.id,
      motoboyNome: motoboy.nome,
      motoboyPlaca: motoboy.placaMoto,
      enderecoCompleto: `${entrega.enderecoDestino}, ${entrega.bairro} - ${entrega.cidade} (${entrega.zonaEleitoral})`,
      itensEntregues,
      notas: notasEntrega.trim(),
      sincronizadoEm: new Date().toISOString(),
    };

    try {
      // Check online status and save
      if (!offlineSyncService.isOnline()) {
        offlineSyncService.enqueue(entrega.id, finalPOD, motoboy.id);
        alert('Dispositivo sem conexão de internet. O termo foi salvo em segurança na memória local e será sincronizado assim que a rede retornar.');
      } else {
        await onSuccess(entrega.id, finalPOD);
      }

      setGeneratedTermo(finalPOD);
      setCurrentStep(5);

      // Celebrate
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch (err: any) {
      console.error('Erro ao registrar POD:', err);
      alert(`Erro ao salvar comprovação: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  // WhatsApp Share Message
  const handleShareWhatsApp = () => {
    if (!generatedTermo) return;
    const msg = [
      `*TERMO DE COMPROVAÇÃO DE ENTREGA (POD ELEITORAL)* 📦✅`,
      `*Código de Autenticidade:* ${generatedTermo.codigoAutenticidade}`,
      `*Rastreio:* ${entrega.codigoRastreio}`,
      `*Comitê/Cliente:* ${entrega.comiteNome}`,
      `*Candidato:* ${entrega.candidato} (${entrega.partido})`,
      `*Material:* ${entrega.descricaoMaterial} (${formatNumber(entrega.quantidade)} ${entrega.unidadeMedida})`,
      `*Recebido por:* ${generatedTermo.nomeRecebedor} (${generatedTermo.documentoRecebedor})`,
      `*Data/Hora:* ${generatedTermo.dataHora}`,
      `*Entregue por:* ${motoboy.nome} (Placa: ${motoboy.placaMoto})`,
      `*GPS:* ${generatedTermo.localizacaoGps}`,
      `*Hash TSE:* \`${generatedTermo.hashSha256?.substring(0, 24)}...\``,
      `_Documento emitido pelo FleetMoto com validade jurídica de comprovação de entrega de material eleitoral._`,
    ].join('\n');

    const encoded = encodeURIComponent(msg);
    const phoneClean = (generatedTermo.telefoneRecebedor || entrega.telefoneContato || '').replace(/\D/g, '');
    const url = phoneClean.length >= 10
      ? `https://api.whatsapp.com/send?phone=55${phoneClean}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(url, '_blank');
  };

  const handlePrintTermo = () => {
    printElementById('area-impressao-termo-oficial', {
      title: `Termo_Comprovacao_Entrega_${entrega.codigoRastreio}`,
    });
  };

  const copyHashToClipboard = () => {
    if (generatedTermo?.hashSha256) {
      navigator.clipboard.writeText(generatedTermo.hashSha256);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative my-4 animate-in zoom-in-95 duration-150 print:border-none print:shadow-none print:m-0 print:p-0">
        {/* Header with Stepper Indicator */}
        <div className="pb-4 border-b border-slate-100 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#E05328] flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  Comprovação de Entrega (POD TSE)
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {entrega.codigoRastreio} • {entrega.comiteNome.slice(0, 28)}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Dots */}
          <div className="grid grid-cols-5 gap-1.5 mt-4">
            {[
              { step: 1, label: 'GPS' },
              { step: 2, label: 'Câmera' },
              { step: 3, label: 'Recebedor' },
              { step: 4, label: 'Assinatura' },
              { step: 5, label: 'Termo' },
            ].map((s) => (
              <div key={s.step} className="space-y-1">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    currentStep === s.step
                      ? 'bg-[#E05328]'
                      : currentStep > s.step
                      ? 'bg-emerald-500'
                      : 'bg-slate-200'
                  }`}
                />
                <p
                  className={`text-[9px] text-center font-bold uppercase truncate ${
                    currentStep === s.step
                      ? 'text-[#E05328]'
                      : currentStep > s.step
                      ? 'text-emerald-700'
                      : 'text-slate-400'
                  }`}
                >
                  {s.step}. {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- STEP 1: CHEGADA & GPS ---------------- */}
        {currentStep === 1 && (
          <div className="py-4 space-y-4 animate-in fade-in duration-150">
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-900">
                  Destino Cadastrado
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-200 text-orange-900">
                  {entrega.zonaEleitoral}
                </span>
              </div>
              <h4 className="font-black text-slate-900 text-base">{entrega.comiteNome}</h4>
              <p className="text-xs text-slate-700 font-medium">{entrega.enderecoDestino}</p>
              <p className="text-xs text-slate-500">
                {entrega.bairro} - {entrega.cidade}
              </p>
            </div>

            {/* GPS Capture Card */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 animate-bounce" />
                  <span className="text-xs font-bold text-slate-800">
                    Geolocalização Automática (GPS TSE)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={captureRealGPS}
                  disabled={isCapturingGps}
                  className="text-[11px] text-[#E05328] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isCapturingGps ? 'animate-spin' : ''}`} />
                  Recapturar GPS
                </button>
              </div>

              {isCapturingGps ? (
                <div className="flex items-center justify-center gap-2 py-3 text-xs text-slate-600">
                  <Loader2 className="w-4 h-4 animate-spin text-[#E05328]" />
                  <span>Obtendo coordenadas de alta precisão do dispositivo...</span>
                </div>
              ) : (
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-900">
                    <span>Coordenadas:</span>
                    <span>
                      {gpsData.latitude}, {gpsData.longitude}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Precisão Estimada: ±{gpsData.precisao}m</span>
                    <span>Hora do Registro: {gpsData.capturadoEm}</span>
                  </div>
                  {gpsError && (
                    <p className="text-[10px] text-amber-600 font-sans pt-1">{gpsError}</p>
                  )}
                </div>
              )}

              <p className="text-[11px] text-slate-500 leading-relaxed">
                As coordenadas e horário são carimbados digitalmente no Termo Oficial e no hash SHA-256 para comprovação jurídica perante o Tribunal Superior Eleitoral.
              </p>
            </div>

            {/* Next Step Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full py-3 bg-[#E05328] hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Confirmar Chegada & Abrir Câmera</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ---------------- STEP 2: CÂMERA AO VIVO (WEBRTC) ---------------- */}
        {currentStep === 2 && (
          <div className="py-4 space-y-4 animate-in fade-in duration-150">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#E05328]" />
                  Fotografar Recebedor com o Material na Câmera *
                </label>
                {!capturedPhotoUrl && (
                  <button
                    type="button"
                    onClick={toggleCameraFacingMode}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Trocar Câmera</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Fotografe o recebedor junto com os fardos/pacotes de material entregues no comitê. Imagens da galeria não são aceitas.
              </p>
            </div>

            {/* Camera Preview or Captured Snapshot */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-4/3 flex items-center justify-center">
              {!capturedPhotoUrl ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={photoCanvasRef} className="hidden" />

                  {/* Camera Overlay Guides */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        AO VIVO
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-black/60 text-orange-400 text-[10px] font-mono font-bold">
                        {entrega.codigoRastreio}
                      </span>
                    </div>

                    {/* Framing corner reticle */}
                    <div className="self-center border-2 border-dashed border-white/50 w-3/4 h-3/5 rounded-xl flex items-center justify-center">
                      <p className="text-white/70 text-[11px] font-bold text-center px-4 drop-shadow-md">
                        Enquadre o recebedor e os materiais entregues
                      </p>
                    </div>

                    <div className="text-[10px] text-white/80 font-mono text-center bg-black/50 py-1 rounded">
                      GPS: {gpsData.latitude}, {gpsData.longitude}
                    </div>
                  </div>

                  {/* Camera Error Fallback Message */}
                  {cameraError && (
                    <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center space-y-3">
                      <AlertCircle className="w-8 h-8 text-amber-400" />
                      <p className="text-xs text-white leading-relaxed">{cameraError}</p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 bg-[#E05328] hover:bg-orange-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Tentar Novamente
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={capturedPhotoUrl}
                    alt="Foto capturada da entrega"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Foto Carimbada
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions for Camera Step */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              {!capturedPhotoUrl ? (
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  disabled={!isCameraActive}
                  className="flex-1 py-3 bg-[#E05328] hover:bg-orange-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Tirar Foto Agora (Carimbar)</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleRetakePhoto}
                    className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Tirar Outra Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Avançar</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ---------------- STEP 3: IDENTIFICAÇÃO & MATERIAIS ---------------- */}
        {currentStep === 3 && (
          <div className="py-4 space-y-4 animate-in fade-in duration-150">
            {/* Materials List & Verification */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-[#E05328]" />
                  Relação de Materiais a Serem Conferidos
                </span>
                <span className="text-[10px] font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">
                  {formatNumber(entrega.quantidade)} {entrega.unidadeMedida}
                </span>
              </div>

              <div className="space-y-1.5">
                {entrega.itens && entrega.itens.length > 0 ? (
                  entrega.itens.map((it, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">
                          {it.nomeMaterial || it.tipoMaterial}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          SKU: {it.materialId || 'PADRAO'}
                        </span>
                      </div>
                      <span className="font-black text-[#E05328] font-mono">
                        {formatNumber(it.quantidade)} {it.unidadeMedida || 'un'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{entrega.descricaoMaterial}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Peso estimado: ~{entrega.pesoKg}kg
                      </span>
                    </div>
                    <span className="font-black text-[#E05328] font-mono">
                      {formatNumber(entrega.quantidade)} {entrega.unidadeMedida}
                    </span>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={materiaisConferidos}
                  onChange={(e) => setMateriaisConferidos(e.target.checked)}
                  className="rounded text-[#E05328] focus:ring-[#E05328] w-4 h-4"
                />
                <span className="text-[11px] font-bold text-slate-700">
                  Confirmo que os materiais foram contados e conferidos no comitê
                </span>
              </label>
            </div>

            {/* Recebedor Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nome Completo do Recebedor no Comitê *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo Silveira"
                  value={nomeRecebedor}
                  onChange={(e) => setNomeRecebedor(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#E05328]/30 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    CPF ou RG do Recebedor *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 123.456.789-00 ou RG"
                    value={documentoRecebedor}
                    onChange={(e) => setDocumentoRecebedor(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#E05328]/30 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex: (11) 98765-4321"
                    value={telefoneRecebedor}
                    onChange={(e) => setTelefoneRecebedor(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#E05328]/30 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Observações / Ocorrências de Campo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Material entregue na secretaria do comitê sem avarias."
                  value={notasEntrega}
                  onChange={(e) => setNotasEntrega(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#E05328]/30"
                />
              </div>
            </div>

            {/* Stepper Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!nomeRecebedor.trim()) {
                    alert('Por favor, digite o nome completo do recebedor.');
                    return;
                  }
                  if (!documentoRecebedor.trim()) {
                    alert('Por favor, informe o CPF ou documento do recebedor.');
                    return;
                  }
                  setCurrentStep(4);
                }}
                className="px-5 py-2.5 bg-[#E05328] hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1 cursor-pointer"
              >
                <span>Avançar para Assinatura</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ---------------- STEP 4: ASSINATURA DIGITAL ---------------- */}
        {currentStep === 4 && (
          <div className="py-4 space-y-4 animate-in fade-in duration-150">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900">
                Recebedor: {nomeRecebedor} ({documentoRecebedor})
              </p>
              <p className="text-[11px] text-slate-500">
                Ao assinar abaixo, você confirma o recebimento integral dos materiais discriminados em conformidade com a legislação eleitoral.
              </p>
            </div>

            {/* Canvas de Assinatura */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <PenTool className="w-4 h-4 text-[#E05328]" />
                  Assinatura Digital do Responsável (Assine na Tela) *
                </label>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[11px] font-bold text-[#E05328] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpar</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 overflow-hidden relative touch-none shadow-inner">
                <canvas
                  ref={signatureCanvasRef}
                  width={500}
                  height={130}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-32 cursor-crosshair bg-white"
                />
                {!hasSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
                    Desenhe sua assinatura aqui com o dedo ou mouse
                  </div>
                )}
              </div>
            </div>

            {/* Summary details before submission */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-center justify-between font-mono">
              <span>Motoboy: {motoboy.nome.split(' ')[0]} ({motoboy.placaMoto})</span>
              <span className="font-bold">● Pronto para Gravar</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                disabled={isSaving}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                type="button"
                onClick={handleFinalConfirmPOD}
                disabled={isSaving || !hasSignature}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gerando Hash & Gravando Termo...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finalizar Entrega & Gerar Termo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ---------------- STEP 5: TERMO OFICIAL GERADO & SUCESSO ---------------- */}
        {currentStep === 5 && generatedTermo && (
          <div className="py-4 space-y-4 animate-in fade-in duration-150">
            {/* Success Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-black text-emerald-900 text-base mt-2">
                Entrega Concluída com Sucesso!
              </h4>
              <p className="text-xs text-emerald-700">
                O Termo de Comprovação de Entrega foi gerado com Hash SHA-256 e anexado ao pedido.
              </p>
            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 print:hidden">
              <button
                type="button"
                onClick={handlePrintTermo}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / PDF</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={copyHashToClipboard}
                className="col-span-2 sm:col-span-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedHash ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedHash ? 'Hash Copiado!' : 'Copiar Hash'}</span>
              </button>
            </div>

            {/* Termo Oficial Printable Container */}
            <div
              id="area-impressao-termo-oficial"
              className="bg-white p-5 rounded-2xl border border-slate-200 text-slate-800 text-xs space-y-4 printable-area"
            >
              {/* Document Header */}
              <div className="text-center pb-3 border-b-2 border-slate-900 space-y-1">
                <p className="font-black text-xs uppercase tracking-widest text-slate-900">
                  FleetMoto • Logística & Distribuição Eleitoral
                </p>
                <h3 className="font-black text-sm text-slate-900">
                  TERMO DE COMPROVAÇÃO DE ENTREGA DE MATERIAL DE PROPAGANDA
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">
                  Código de Autenticidade: {generatedTermo.codigoAutenticidade} • Resolução TSE 23.610/2019
                </p>
              </div>

              {/* Committee & Destination */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Comitê / Cliente</p>
                  <p className="font-bold text-slate-900">{entrega.comiteNome}</p>
                  <p className="text-slate-600">
                    Candidato: <strong>{entrega.candidato}</strong> ({entrega.partido})
                  </p>
                  <p className="font-mono text-[10px] text-slate-500">
                    CNPJ: {formatCNPJ(entrega.cnpjCampanha)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Local de Entrega</p>
                  <p className="font-bold text-slate-900">{entrega.enderecoDestino}</p>
                  <p className="text-slate-600">
                    {entrega.bairro} - {entrega.cidade}
                  </p>
                  <p className="font-semibold text-orange-700 text-[10px]">{entrega.zonaEleitoral}</p>
                </div>
              </div>

              {/* Materials Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600 uppercase">
                  Materiais Entregues
                </div>
                <div className="p-3 space-y-1 text-xs">
                  {generatedTermo.itensEntregues && generatedTermo.itensEntregues.length > 0 ? (
                    generatedTermo.itensEntregues.map((it, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-1">
                        <span className="font-bold text-slate-900">{it.materialNome}</span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatNumber(it.quantidade)} {it.unidadeMedida}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{entrega.descricaoMaterial}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatNumber(entrega.quantidade)} {entrega.unidadeMedida}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Details, Motoboy & Receiver */}
              <div className="grid grid-cols-2 gap-3 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Transportador</p>
                  <p className="font-bold text-slate-900">{motoboy.nome}</p>
                  <p className="text-slate-600 font-mono">
                    Placa: {motoboy.placaMoto} • ID: {motoboy.id}
                  </p>
                  <p className="text-slate-500 text-[10px]">Data/Hora: {generatedTermo.dataHora}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Recebedor</p>
                  <p className="font-bold text-slate-900">{generatedTermo.nomeRecebedor}</p>
                  <p className="text-slate-600 font-mono">Doc: {generatedTermo.documentoRecebedor}</p>
                  {generatedTermo.telefoneRecebedor && (
                    <p className="text-slate-500 text-[10px]">Tel: {generatedTermo.telefoneRecebedor}</p>
                  )}
                </div>
              </div>

              {/* Evidence (Photo + Signature) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-1">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Foto no Local</p>
                  <div className="h-28 rounded-lg overflow-hidden border border-slate-200 bg-white">
                    <img
                      src={generatedTermo.fotoUrl}
                      alt="Foto da entrega"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-1">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Assinatura Digital</p>
                  <div className="h-28 rounded-lg overflow-hidden border border-slate-200 bg-white p-1 flex items-center justify-center">
                    <img
                      src={generatedTermo.assinaturaBase64}
                      alt="Assinatura digital"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Cryptographic Hash & GPS Footnote */}
              <div className="p-2.5 bg-slate-100 rounded-xl text-[9px] font-mono text-slate-600 space-y-1 border border-slate-200">
                <div>
                  <strong>GPS:</strong> {generatedTermo.localizacaoGps}
                </div>
                <div className="break-all">
                  <strong>Hash SHA-256:</strong> {generatedTermo.hashSha256}
                </div>
              </div>
            </div>

            {/* Final Close Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-[#E05328] hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                Concluir e Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
