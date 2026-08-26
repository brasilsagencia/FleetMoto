import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Bike,
  Package,
  ArrowRight,
  ShieldCheck,
  Download,
  ExternalLink,
  MapPin,
  User,
  Calendar,
  Sparkles,
  Info,
  Scale,
  Maximize2,
  FileText,
  FileCheck2,
} from 'lucide-react';
import { Entrega, Comite, Motoboy, TipoMaterial } from '../types';
import {
  formatCurrency,
  formatNumber,
  formatDateTime,
  formatTipoMaterial,
  getStatusBadgeClass,
} from '../utils/formatters';

export type DestinoMaterialOption =
  | 'todos'
  | 'perfurado'
  | 'revista'
  | 'cartao'
  | 'santao'
  | 'pragao'
  | 'adesivos_15x40';

interface DestinoDetail {
  id: DestinoMaterialOption;
  nome: string;
  subtitulo: string;
  iconeEmoji: string;
  dimensoes: string;
  gramatura: string;
  capacidadeBau135L: string;
  limiteRecomendado: string;
  tseNorma: string;
  descricaoTecnica: string;
  unidadePadrao: string;
  pesoUnitarioGrama: number;
}

export const DESTINOS_CONFIG: Record<Exclude<DestinoMaterialOption, 'todos'>, DestinoDetail> = {
  perfurado: {
    id: 'perfurado',
    nome: 'Perfurado',
    subtitulo: 'Adesivo perfurado para vidro traseiro de veículos',
    iconeEmoji: '🚗',
    dimensoes: 'Até 138 x 42 cm (ou área total do vidro)',
    gramatura: 'Vinil adesivo microperfurado 120g/m²',
    capacidadeBau135L: 'Até 120 rolos enrolados com tubete',
    limiteRecomendado: '40 a 60 unidades por viagem (p/ não amassar)',
    tseNorma: 'Permitido no para-brisa traseiro de veículos particulares (Res. TSE nº 23.610/2019, art. 20)',
    descricaoTecnica: 'Material microperfurado com 50% de passagem de luz, garantindo visibilidade interna e total cobertura externa. Deve conter CNPJ do responsável e tiragem.',
    unidadePadrao: 'unidades',
    pesoUnitarioGrama: 95,
  },
  revista: {
    id: 'revista',
    nome: 'Revista',
    subtitulo: 'Revistas, tablóides e cartilhas de plano de governo',
    iconeEmoji: '📖',
    dimensoes: 'Formato Fechado A4 (21 x 29,7 cm) ou Tablóide',
    gramatura: 'Capa Couché 150g + Miolo LWC 75g (8 a 24 págs)',
    capacidadeBau135L: 'Até 600 a 1.200 exemplares (em fardos)',
    limiteRecomendado: 'Máximo 25 kg por viagem para estabilidade da moto',
    tseNorma: 'Prestação de contas obrigatória com nota fiscal gráfica e comprovação de distribuição por comitê',
    descricaoTecnica: 'Publicação impressa detalhada contendo histórico do candidato, propostas temáticas e prestação de mandato anterior.',
    unidadePadrao: 'unidades / fardos',
    pesoUnitarioGrama: 45,
  },
  cartao: {
    id: 'cartao',
    nome: 'Cartão',
    subtitulo: 'Cartões de visita, mini santinhos e cartões com QR Code',
    iconeEmoji: '📇',
    dimensoes: '9 x 5 cm ou 8,5 x 5,5 cm',
    gramatura: 'Couché 300g Fosco ou Brilho com verniz',
    capacidadeBau135L: 'Até 40.000 unidades em caixas padronizadas',
    limiteRecomendado: '25.000 unidades (aproximadamente 22 kg)',
    tseNorma: 'Deve constar nome do candidato, partido/coligação, número, CNPJ do candidato e CNPJ da gráfica',
    descricaoTecnica: 'Excelente para contatos individuais em reuniões fechadas, lideranças comunitárias e empresariais, com QR Code para WhatsApp e plano de governo.',
    unidadePadrao: 'milheiros / unidades',
    pesoUnitarioGrama: 1.5,
  },
  santao: {
    id: 'santao',
    nome: 'Santão',
    subtitulo: 'Santão formato expandido A4 / A5 para caminhadas',
    iconeEmoji: '📑',
    dimensoes: 'A4 (21 x 29,7 cm) ou A5 (15 x 21 cm)',
    gramatura: 'Couché 115g a 150g Brilho',
    capacidadeBau135L: 'Até 8.000 a 12.000 unidades empacotadas',
    limiteRecomendado: '6.000 unidades por baú (cerca de 20 kg)',
    tseNorma: 'Tiragem e CNPJ obrigatórios em rodapé legível. Proibido despejo em vias públicas (chuva de papel)',
    descricaoTecnica: 'Formato de grande impacto visual para panfletagem em feiras, semáforos, pontos de ônibus e comícios.',
    unidadePadrao: 'unidades',
    pesoUnitarioGrama: 6.5,
  },
  pragao: {
    id: 'pragao',
    nome: 'Pragão',
    subtitulo: 'Adesivo redondo grande (7 a 10cm) para militância e eventos',
    iconeEmoji: '🔴',
    dimensoes: 'Diâmetro de 7 cm, 8 cm ou 10 cm (circular)',
    gramatura: 'Papel adesivo brilho 80g ou Vinil',
    capacidadeBau135L: 'Até 25.000 unidades em rolos ou pacotes',
    limiteRecomendado: '15.000 unidades por moto',
    tseNorma: 'Uso pessoal de militantes em vestimentas, proibido ultrapassar 0,5m² em bens particulares',
    descricaoTecnica: 'Adesivo circular de peito com excelente fixação para voluntários, cabos eleitorais e participantes de caminhadas.',
    unidadePadrao: 'unidades / pacotes',
    pesoUnitarioGrama: 1.8,
  },
  adesivos_15x40: {
    id: 'adesivos_15x40',
    nome: 'Adesivos 15x40',
    subtitulo: 'Adesivo retangular para para-choque e lataria veicular',
    iconeEmoji: '🏷️',
    dimensoes: '15 x 40 cm ou 10 x 30 cm',
    gramatura: 'Vinil adesivo brilho resistente a sol e chuva',
    capacidadeBau135L: 'Até 2.500 unidades em pacotes retos',
    limiteRecomendado: '1.200 a 1.500 unidades por carga para evitar vincos',
    tseNorma: 'Tamanho máximo permitido pela legislação eleitoral para adesivos plásticos em para-choques (0,5m²)',
    descricaoTecnica: 'Adesivo de alta durabilidade com corte reto para aplicação traseira ou lateral em automóveis.',
    unidadePadrao: 'unidades',
    pesoUnitarioGrama: 12.0,
  },
};

interface DestinosMateriaisViewProps {
  entregas: Entrega[];
  comites: Comite[];
  motoboys: Motoboy[];
  onOpenNovaEntregaComMaterial?: (tipo: TipoMaterial) => void;
  onSelectEntregaPOD?: (entrega: Entrega) => void;
}

export const DestinosMateriaisView: React.FC<DestinosMateriaisViewProps> = ({
  entregas,
  comites,
  motoboys,
  onOpenNovaEntregaComMaterial,
  onSelectEntregaPOD,
}) => {
  const [selectedDestino, setSelectedDestino] = useState<DestinoMaterialOption>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComiteFilter, setSelectedComiteFilter] = useState('todos');

  // Interactive capacity calculator
  const [calcMaterial, setCalcMaterial] = useState<Exclude<DestinoMaterialOption, 'todos'>>('perfurado');
  const [calcBauLts, setCalcBauLts] = useState<number>(135);
  const [calcQtdDesejada, setCalcQtdDesejada] = useState<number>(500);

  // Filter deliveries based on selected destination option
  const filteredEntregas = useMemo(() => {
    return entregas.filter((e) => {
      // Match material
      let matchesMaterial = true;
      if (selectedDestino !== 'todos') {
        if (selectedDestino === 'perfurado') {
          matchesMaterial = e.tipoMaterial === 'perfurado' || e.tipoMaterial === 'perfurados';
        } else if (selectedDestino === 'adesivos_15x40') {
          matchesMaterial = e.tipoMaterial === 'adesivos_15x40' || e.tipoMaterial === 'adesivos_carro';
        } else {
          matchesMaterial = e.tipoMaterial === selectedDestino;
        }
      }

      // Match search
      const matchesSearch =
        e.codigoRastreio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.comiteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.candidato.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.descricaoMaterial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.enderecoDestino.toLowerCase().includes(searchTerm.toLowerCase());

      // Match comite/cliente
      const matchesComite =
        selectedComiteFilter === 'todos' ? true : e.comiteId === selectedComiteFilter;

      return matchesMaterial && matchesSearch && matchesComite;
    });
  }, [entregas, selectedDestino, searchTerm, selectedComiteFilter]);

  // Totals for all 6 destination types
  const statsByDestino = useMemo(() => {
    const stats: Record<
      Exclude<DestinoMaterialOption, 'todos'>,
      { totalEntregas: number; totalUnidades: number; ativas: number; pesoTotal: number }
    > = {
      perfurado: { totalEntregas: 0, totalUnidades: 0, ativas: 0, pesoTotal: 0 },
      revista: { totalEntregas: 0, totalUnidades: 0, ativas: 0, pesoTotal: 0 },
      cartao: { totalEntregas: 0, totalUnidades: 0, ativas: 0, pesoTotal: 0 },
      santao: { totalEntregas: 0, totalUnidades: 0, ativas: 0, pesoTotal: 0 },
      pragao: { totalEntregas: 0, totalUnidades: 0, ativas: 0, pesoTotal: 0 },
      adesivos_15x40: { totalEntregas: 0, totalUnidades: 0, ativas: 0, pesoTotal: 0 },
    };

    entregas.forEach((e) => {
      let key: Exclude<DestinoMaterialOption, 'todos'> | null = null;
      if (e.tipoMaterial === 'perfurado' || e.tipoMaterial === 'perfurados') key = 'perfurado';
      else if (e.tipoMaterial === 'revista' || e.tipoMaterial === 'jornais_informativos') key = 'revista';
      else if (e.tipoMaterial === 'cartao') key = 'cartao';
      else if (e.tipoMaterial === 'santao') key = 'santao';
      else if (e.tipoMaterial === 'pragao' || e.tipoMaterial === 'praguinhas') key = 'pragao';
      else if (e.tipoMaterial === 'adesivos_15x40' || e.tipoMaterial === 'adesivos_carro') key = 'adesivos_15x40';

      if (key && stats[key]) {
        stats[key].totalEntregas += 1;
        stats[key].totalUnidades += e.quantidade;
        stats[key].pesoTotal += e.pesoKg;
        if (e.status === 'em_transito' || e.status === 'pendente' || e.status === 'atribuida') {
          stats[key].ativas += 1;
        }
      }
    });

    return stats;
  }, [entregas]);

  // Capacity calculation result
  const calcDetail = DESTINOS_CONFIG[calcMaterial];
  const pesoEstimadoKg = (calcQtdDesejada * calcDetail.pesoUnitarioGrama) / 1000;
  const maxPesoMotoKg = 35; // Maximum secure weight for motorcycle cargo trunk
  const volumeEstimadoLts = (calcQtdDesejada * calcDetail.pesoUnitarioGrama * 2.2) / 1000; // approximate packing volume
  const percentualCapacidade = Math.min(100, Math.round((pesoEstimadoKg / maxPesoMotoKg) * 100));
  const motosNecessarias = Math.max(1, Math.ceil(pesoEstimadoKg / 30));

  return (
    <div className="space-y-6">
      {/* Top Banner & Context */}
      <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#E05328] flex items-center justify-center border border-orange-200">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Destinos & Tipos de Material Eleitoral
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Gestão especializada de distribuição para os 6 principais formatos de campanha:
              <strong className="text-slate-900"> Perfurado, Revista, Cartão, Santão, Pragão</strong> e{' '}
              <strong className="text-slate-900">Adesivos 15x40</strong>. Controle de peso por moto, volumetria e conformidade com a Resolução TSE nº 23.610.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenNovaEntregaComMaterial?.('perfurado')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#E05328] hover:bg-orange-700 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Despachar Material</span>
            </button>
          </div>
        </div>

        {/* 6 Destination Tabs / Material Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-6 pt-5 border-t border-slate-100">
          {/* Option: Todos */}
          <button
            onClick={() => setSelectedDestino('todos')}
            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
              selectedDestino === 'todos'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <span className="text-sm">🌐</span>
            <span className="text-xs font-bold mt-1">Todos</span>
            <span className={`text-[10px] mt-0.5 ${selectedDestino === 'todos' ? 'text-slate-300' : 'text-slate-500'}`}>
              {entregas.length} despachos
            </span>
          </button>

          {/* Option 1: Perfurado */}
          <button
            onClick={() => setSelectedDestino('perfurado')}
            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
              selectedDestino === 'perfurado'
                ? 'bg-[#E05328] text-white border-[#E05328] shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-sm">🚗</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedDestino === 'perfurado' ? 'bg-white/20 text-white' : 'bg-orange-100 text-[#E05328]'
              }`}>
                {statsByDestino.perfurado.totalEntregas}
              </span>
            </div>
            <span className="text-xs font-bold mt-1">Perfurado</span>
            <span className={`text-[10px] mt-0.5 ${selectedDestino === 'perfurado' ? 'text-orange-100' : 'text-slate-500'}`}>
              Vidro Traseiro
            </span>
          </button>

          {/* Option 2: Revista */}
          <button
            onClick={() => setSelectedDestino('revista')}
            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
              selectedDestino === 'revista'
                ? 'bg-[#E05328] text-white border-[#E05328] shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-sm">📖</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedDestino === 'revista' ? 'bg-white/20 text-white' : 'bg-orange-100 text-[#E05328]'
              }`}>
                {statsByDestino.revista.totalEntregas}
              </span>
            </div>
            <span className="text-xs font-bold mt-1">Revista</span>
            <span className={`text-[10px] mt-0.5 ${selectedDestino === 'revista' ? 'text-orange-100' : 'text-slate-500'}`}>
              Tablóides / Informativos
            </span>
          </button>

          {/* Option 3: Cartão */}
          <button
            onClick={() => setSelectedDestino('cartao')}
            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
              selectedDestino === 'cartao'
                ? 'bg-[#E05328] text-white border-[#E05328] shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-sm">📇</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedDestino === 'cartao' ? 'bg-white/20 text-white' : 'bg-orange-100 text-[#E05328]'
              }`}>
                {statsByDestino.cartao.totalEntregas}
              </span>
            </div>
            <span className="text-xs font-bold mt-1">Cartão</span>
            <span className={`text-[10px] mt-0.5 ${selectedDestino === 'cartao' ? 'text-orange-100' : 'text-slate-500'}`}>
              Mini / QR Code
            </span>
          </button>

          {/* Option 4: Santão */}
          <button
            onClick={() => setSelectedDestino('santao')}
            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
              selectedDestino === 'santao'
                ? 'bg-[#E05328] text-white border-[#E05328] shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-sm">📑</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedDestino === 'santao' ? 'bg-white/20 text-white' : 'bg-orange-100 text-[#E05328]'
              }`}>
                {statsByDestino.santao.totalEntregas}
              </span>
            </div>
            <span className="text-xs font-bold mt-1">Santão</span>
            <span className={`text-[10px] mt-0.5 ${selectedDestino === 'santao' ? 'text-orange-100' : 'text-slate-500'}`}>
              A4 / A5 Grande
            </span>
          </button>

          {/* Option 5: Pragão */}
          <button
            onClick={() => setSelectedDestino('pragao')}
            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
              selectedDestino === 'pragao'
                ? 'bg-[#E05328] text-white border-[#E05328] shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-sm">🔴</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedDestino === 'pragao' ? 'bg-white/20 text-white' : 'bg-orange-100 text-[#E05328]'
              }`}>
                {statsByDestino.pragao.totalEntregas}
              </span>
            </div>
            <span className="text-xs font-bold mt-1">Pragão</span>
            <span className={`text-[10px] mt-0.5 ${selectedDestino === 'pragao' ? 'text-orange-100' : 'text-slate-500'}`}>
              Adesivo Peito 10cm
            </span>
          </button>

          {/* Option 6: Adesivos 15x40 */}
          <button
            onClick={() => setSelectedDestino('adesivos_15x40')}
            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
              selectedDestino === 'adesivos_15x40'
                ? 'bg-[#E05328] text-white border-[#E05328] shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-sm">🏷️</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedDestino === 'adesivos_15x40' ? 'bg-white/20 text-white' : 'bg-orange-100 text-[#E05328]'
              }`}>
                {statsByDestino.adesivos_15x40.totalEntregas}
              </span>
            </div>
            <span className="text-xs font-bold mt-1">Adesivos 15x40</span>
            <span className={`text-[10px] mt-0.5 ${selectedDestino === 'adesivos_15x40' ? 'text-orange-100' : 'text-slate-500'}`}>
              Para-choque Vinil
            </span>
          </button>
        </div>
      </div>

      {/* Selected Material Detail Card (When a specific option is chosen) */}
      {selectedDestino !== 'todos' && (
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="text-3xl p-2.5 bg-orange-50 rounded-2xl border border-orange-100">
                {DESTINOS_CONFIG[selectedDestino].iconeEmoji}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 font-sans">
                    {DESTINOS_CONFIG[selectedDestino].nome}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    Regra TSE Validada
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {DESTINOS_CONFIG[selectedDestino].subtitulo}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCalcMaterial(selectedDestino);
                  const calcEl = document.getElementById('calculadora-bau-section');
                  calcEl?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
              >
                <Bike className="w-3.5 h-3.5 text-slate-600" />
                <span>Simular Carga na Moto</span>
              </button>

              <button
                onClick={() => onOpenNovaEntregaComMaterial?.(selectedDestino as TipoMaterial)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#E05328] hover:bg-orange-700 shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Rota de {DESTINOS_CONFIG[selectedDestino].nome}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Maximize2 className="w-3.5 h-3.5 text-[#E05328]" />
                <span className="text-xs font-semibold">Dimensões Padrão</span>
              </div>
              <p className="text-xs font-bold text-slate-900">
                {DESTINOS_CONFIG[selectedDestino].dimensoes}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {DESTINOS_CONFIG[selectedDestino].gramatura}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Bike className="w-3.5 h-3.5 text-[#E05328]" />
                <span className="text-xs font-semibold">Capacidade por Baú</span>
              </div>
              <p className="text-xs font-bold text-slate-900">
                {DESTINOS_CONFIG[selectedDestino].capacidadeBau135L}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {DESTINOS_CONFIG[selectedDestino].limiteRecomendado}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-semibold">Norma TSE & Resoluções</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-snug line-clamp-2">
                {DESTINOS_CONFIG[selectedDestino].tseNorma}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200">
              <div className="flex items-center gap-2 text-orange-900 mb-1">
                <Package className="w-3.5 h-3.5 text-[#E05328]" />
                <span className="text-xs font-bold">Despachos no Sistema</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-slate-900">
                  {formatNumber(statsByDestino[selectedDestino].totalUnidades)}
                </span>
                <span className="text-[11px] text-slate-600 font-semibold">unidades</span>
              </div>
              <p className="text-[10px] text-orange-700 font-semibold mt-0.5">
                {statsByDestino[selectedDestino].ativas} entrega(s) ativas no momento
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid of all 6 Options Overview when in 'todos' view */}
      {selectedDestino === 'todos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.keys(DESTINOS_CONFIG) as Array<Exclude<DestinoMaterialOption, 'todos'>>).map(
            (key) => {
              const item = DESTINOS_CONFIG[key];
              const stat = statsByDestino[key];

              return (
                <div
                  key={key}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-orange-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{item.iconeEmoji}</span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {item.nome}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            {item.subtitulo}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedDestino(key)}
                        className="text-xs font-semibold text-[#E05328] hover:text-orange-700 shrink-0"
                      >
                        Ver Detalhes →
                      </button>
                    </div>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-slate-100 text-slate-600">
                        <span className="text-slate-500">Dimensões:</span>
                        <span className="font-semibold text-slate-800 text-[11px]">{item.dimensoes}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100 text-slate-600">
                        <span className="text-slate-500">Capacidade Baú:</span>
                        <span className="font-semibold text-slate-800 text-[11px]">{item.capacidadeBau135L}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100 text-slate-600">
                        <span className="text-slate-500">Total Despachado:</span>
                        <span className="font-bold text-[#E05328]">{formatNumber(stat.totalUnidades)} un</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      <strong>{stat.totalEntregas}</strong> rota(s) / <strong>{stat.ativas}</strong> ativa(s)
                    </span>
                    <button
                      onClick={() => onOpenNovaEntregaComMaterial?.(key as TipoMaterial)}
                      className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#E05328] font-bold text-xs border border-orange-200"
                    >
                      + Despachar
                    </button>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* Deliveries Table for selected destination */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 lg:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Entregas e Rotas de Material ({selectedDestino === 'todos' ? 'Todos os Destinos' : DESTINOS_CONFIG[selectedDestino].nome})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rastreamento em tempo real com motoboy atribuído e comprovante digital (POD)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar rota, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328]"
              />
            </div>

            {/* Filter by Client / Comite */}
            <select
              value={selectedComiteFilter}
              onChange={(e) => setSelectedComiteFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328]"
            >
              <option value="todos">Todos os Clientes</option>
              {comites.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.candidato} ({c.partido})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Código / Data</th>
                <th className="py-3 px-4">Cliente / Candidato</th>
                <th className="py-3 px-4">Tipo & Destino</th>
                <th className="py-3 px-4">Quantidade / Peso</th>
                <th className="py-3 px-4">Motoboy / Rota</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Comprovante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntregas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">Nenhum despacho encontrado</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Não há rotas registradas para os filtros selecionados.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEntregas.map((entrega) => {
                  const statusStyle = getStatusBadgeClass(entrega.status);

                  return (
                    <tr key={entrega.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {entrega.codigoRastreio}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {formatDateTime(entrega.dataCriacao)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{entrega.candidato}</div>
                        <div className="text-[11px] text-slate-500">{entrega.partido}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#E05328] flex items-center gap-1">
                          <span>{formatTipoMaterial(entrega.tipoMaterial)}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          {entrega.enderecoDestino} ({entrega.bairro})
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {formatNumber(entrega.quantidade)} {entrega.unidadeMedida}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {entrega.pesoKg} kg
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {entrega.motoboyNome ? (
                          <div className="flex items-center gap-1.5">
                            <Bike className="w-3.5 h-3.5 text-slate-400" />
                            <div>
                              <span className="font-semibold text-slate-800">{entrega.motoboyNome}</span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {entrega.motoboyPlaca}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Aguardando atribuição</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusStyle.bg} ${statusStyle.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          {entrega.status === 'em_transito'
                            ? 'Em Rota'
                            : entrega.status === 'entregue'
                            ? 'Entregue (POD)'
                            : entrega.status === 'pendente'
                            ? 'Pendente'
                            : entrega.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {entrega.comprovantePOD ? (
                          <button
                            onClick={() => onSelectEntregaPOD?.(entrega)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs border border-emerald-200"
                            title="Ver assinatura e foto do recebedor"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Ver POD</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Pendente</span>
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

      {/* Interactive Motorcycle Trunk Capacity Simulator */}
      <div id="calculadora-bau-section" className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#E05328] flex items-center justify-center border border-orange-200">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Simulador de Capacidade e Logística por Moto
            </h3>
            <p className="text-xs text-slate-500">
              Calcule quantos fardos/unidades cabem no baú com segurança e estabilidade para o motoboy
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tipo de Material / Destino:
            </label>
            <select
              value={calcMaterial}
              onChange={(e) => setCalcMaterial(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328]"
            >
              <option value="perfurado">🚗 Perfurado (Vidro Traseiro)</option>
              <option value="revista">📖 Revista (Tablóides/Informativos)</option>
              <option value="cartao">📇 Cartão (Mini / QR Code)</option>
              <option value="santao">📑 Santão (A4 / A5 Grande)</option>
              <option value="pragao">🔴 Pragão (Adesivo 10cm)</option>
              <option value="adesivos_15x40">🏷️ Adesivos 15x40 (Para-choque)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Capacidade do Baú da Moto:
            </label>
            <select
              value={calcBauLts}
              onChange={(e) => setCalcBauLts(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328]"
            >
              <option value={80}>80 Litros (Baú Compacto)</option>
              <option value={110}>110 Litros (Padrão Urbano)</option>
              <option value={135}>135 Litros (Linha Cargo Reforçada)</option>
              <option value={160}>160 Litros (Mega Baú Logístico)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Quantidade Total a Despachar:
            </label>
            <input
              type="number"
              min={1}
              value={calcQtdDesejada}
              onChange={(e) => setCalcQtdDesejada(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328]"
            />
          </div>
        </div>

        {/* Calculation Outcome Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">Peso Estimado da Carga</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {pesoEstimadoKg.toFixed(1)} <span className="text-xs text-slate-500 font-normal">kg</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">Ocupação do Limite</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xl font-black ${
                percentualCapacidade > 90 ? 'text-rose-600' : 'text-slate-900'
              }`}>
                {percentualCapacidade}%
              </span>
              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    percentualCapacidade > 90 ? 'bg-rose-500' : 'bg-[#E05328]'
                  }`}
                  style={{ width: `${percentualCapacidade}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">Motos Recomendadas</span>
            <p className="text-xl font-black text-[#E05328] mt-0.5">
              {motosNecessarias} <span className="text-xs text-slate-500 font-normal">{motosNecessarias === 1 ? 'motoboy' : 'motoboys'}</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-[11px] text-emerald-800 font-medium">Conformidade Legal</span>
            <p className="text-xs font-bold text-emerald-900 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Dentro dos limites TSE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
