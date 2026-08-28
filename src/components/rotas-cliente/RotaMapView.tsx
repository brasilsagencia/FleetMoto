import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  ExternalLink,
  Phone,
  CheckCircle2,
  Clock,
  Package,
  Layers,
  Sparkles,
  Info,
  Car,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { PontoEntregaRota, RegiaoRota, RotaCliente } from '../../types';
import {
  REGIOES_CONFIG,
  COORDENADAS_REGIOES,
  COORDENADA_PARTIDA_PADRAO,
  PONTO_PARTIDA_PADRAO,
  gerarLinkGoogleMapsRota,
  gerarLinkWaze,
} from '../../utils/geoRegions';

interface RotaMapViewProps {
  rota?: RotaCliente | null;
  paradas: PontoEntregaRota[];
  pontoPartida?: string;
  onSelectParada?: (parada: PontoEntregaRota) => void;
  onOpenPOD?: (parada: PontoEntregaRota) => void;
}

export const RotaMapView: React.FC<RotaMapViewProps> = ({
  rota,
  paradas,
  pontoPartida = PONTO_PARTIDA_PADRAO,
  onSelectParada,
  onOpenPOD,
}) => {
  const [selectedParada, setSelectedParada] = useState<PontoEntregaRota | null>(
    paradas.length > 0 ? paradas[0] : null
  );
  const [activeRegiaoFilter, setActiveRegiaoFilter] = useState<string>('todas');

  // Mapeamento visual das 4 regiões do Rio de Janeiro no viewport gráfico (0 a 100%)
  // Bounds aproximados: Lat -22.75 a -23.05, Lng -43.60 a -43.05
  const getMapCoordinatesPercent = (parada: PontoEntregaRota, index: number) => {
    // Offset orgânico e realista por região e índice
    switch (parada.regiao) {
      case 'Zona Norte':
        return {
          x: 48 + ((index * 7) % 18) - 9,
          y: 42 + ((index * 5) % 14) - 7,
        };
      case 'Zona Oeste':
        return {
          x: 24 + ((index * 9) % 22) - 10,
          y: 65 + ((index * 6) % 18) - 9,
        };
      case 'Baixada Fluminense':
        return {
          x: 38 + ((index * 8) % 20) - 10,
          y: 20 + ((index * 5) % 12) - 6,
        };
      case 'Niterói / São Gonçalo':
        return {
          x: 78 + ((index * 6) % 16) - 8,
          y: 38 + ((index * 7) % 16) - 8,
        };
      default:
        return { x: 50, y: 50 };
    }
  };

  const filteredParadas = paradas.filter(
    (p) => activeRegiaoFilter === 'todas' || p.regiao === activeRegiaoFilter
  );

  const cdCoords = { x: 45, y: 35 }; // Posição do CD (Av. Brasil)

  return (
    <div className="space-y-4">
      {/* Controles do Mapa & Filtros por Região */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mr-1">
            <Layers className="w-4 h-4 text-[#E05328]" />
            Filtrar Região no Mapa:
          </span>

          <button
            onClick={() => setActiveRegiaoFilter('todas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeRegiaoFilter === 'todas'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todas ({paradas.length})
          </button>

          {(Object.keys(REGIOES_CONFIG) as RegiaoRota[]).map((regKey) => {
            const conf = REGIOES_CONFIG[regKey];
            const count = paradas.filter((p) => p.regiao === regKey).length;
            const isSelected = activeRegiaoFilter === regKey;

            return (
              <button
                key={regKey}
                onClick={() => setActiveRegiaoFilter(regKey)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isSelected ? conf.badgeActive : `${conf.badgeClass} hover:opacity-100 opacity-90`
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: conf.hex }} />
                <span>{conf.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Botão de abrir rota inteira no Google Maps */}
        {paradas.length > 0 && (
          <a
            href={gerarLinkGoogleMapsRota(pontoPartida, paradas)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Navegar Rota Completa (Maps)</span>
          </a>
        )}
      </div>

      {/* Grid: Canvas do Mapa + Card de Detalhes da Parada */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mapa Interativo Canvas Container */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 shadow-lg p-4 relative overflow-hidden min-h-[440px] sm:min-h-[500px] flex flex-col justify-between select-none">
          {/* Fundo estilizado do Mapa do Grande Rio */}
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            {/* Grid Lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
            
            {/* Baía de Guanabara e Oceano Atlântico (Curvas Vetoriais) */}
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {/* Baía de Guanabara */}
              <path
                d="M 50% 10% Q 55% 25% 58% 35% T 65% 45% Q 60% 55% 52% 50% Z"
                fill="#0284c7"
                opacity="0.25"
              />
              {/* Oceano Atlântico */}
              <path
                d="M 0 85% Q 30% 80% 60% 88% T 100% 75% L 100% 100% L 0 100% Z"
                fill="#0284c7"
                opacity="0.3"
              />
              {/* Ponte Rio-Niterói */}
              <line x1="50%" y1="36%" x2="72%" y2="40%" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4 2" opacity="0.4" />
              {/* Linha Vermelha / Av. Brasil */}
              <path d="M 20% 60% Q 40% 45% 50% 35% T 70% 20%" fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="6 3" opacity="0.3" />
            </svg>
          </div>

          {/* Legenda de Regiões Flutuante no Topo */}
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-2 bg-slate-950/80 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800/80 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white">Mapa Operacional RJ:</span>
              <span>{paradas.length} paradas cadastradas</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Z. Norte
              </span>
              <span className="flex items-center gap-1 text-orange-400">
                <span className="w-2 h-2 rounded-full bg-orange-500" /> Z. Oeste
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Baixada
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-500" /> Niterói/SG
              </span>
            </div>
          </div>

          {/* SVG Traçado da Rota conectando os Pontos */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {filteredParadas.length > 1 && (
              <polyline
                points={`
                  ${cdCoords.x}%,${cdCoords.y}% 
                  ${filteredParadas.map((p, idx) => {
                    const c = getMapCoordinatesPercent(p, idx);
                    return `${c.x}%,${c.y}%`;
                  }).join(' ')}
                  ${cdCoords.x}%,${cdCoords.y}%
                `}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
                className="opacity-70 animate-pulse"
              />
            )}
          </svg>

          {/* Marcador CD Central (Base) */}
          <div
            style={{ left: `${cdCoords.x}%`, top: `${cdCoords.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg shadow-amber-500/30 border-2 border-white animate-bounce">
              CD
            </div>
            <span className="mt-1 px-2 py-0.5 rounded bg-black/80 text-amber-300 font-bold text-[9px] border border-amber-500/40 shadow-xs whitespace-nowrap">
              Base / CD Central
            </span>
          </div>

          {/* Marcadores de Paradas no Mapa */}
          <div className="relative w-full h-full min-h-[340px]">
            {filteredParadas.map((parada, idx) => {
              const coords = getMapCoordinatesPercent(parada, idx);
              const isSelected = selectedParada?.id === parada.id;
              const isEntregue = parada.status === 'Entregue';
              const conf = REGIOES_CONFIG[parada.regiao] || REGIOES_CONFIG['Zona Norte'];

              return (
                <div
                  key={parada.id}
                  onClick={() => {
                    setSelectedParada(parada);
                    onSelectParada?.(parada);
                  }}
                  style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center cursor-pointer transition-all duration-200 group ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-115'
                  }`}
                >
                  {/* Pin Circle */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shadow-md border-2 transition-all ${
                      isSelected
                        ? 'ring-4 ring-white/60 text-white'
                        : 'text-white'
                    }`}
                    style={{
                      backgroundColor: isEntregue ? '#10b981' : conf.hex,
                      borderColor: '#ffffff',
                    }}
                  >
                    {isEntregue ? '✓' : parada.ordemSequencia}
                  </div>

                  {/* Label da Parada */}
                  <div
                    className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold shadow-md whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-white text-slate-900 border-white'
                        : 'bg-slate-900/90 text-slate-200 border-slate-700 opacity-80 group-hover:opacity-100'
                    }`}
                  >
                    {parada.nomeDestinatario.slice(0, 14)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Barra de Status Inferior */}
          <div className="relative z-10 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span>Clique em qualquer parada para ver detalhes e abrir navegação GPS</span>
            <span className="font-mono text-slate-300">Rio de Janeiro • 2026</span>
          </div>
        </div>

        {/* Card Lateral: Detalhes da Parada Selecionada */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between space-y-4">
          {selectedParada ? (
            <div className="space-y-3.5">
              {/* Header do Card */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                      #{selectedParada.ordemSequencia}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {selectedParada.nomeDestinatario}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cliente: <strong>{selectedParada.clienteNome}</strong>
                  </p>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    REGIOES_CONFIG[selectedParada.regiao]?.badgeClass || 'bg-slate-100'
                  }`}
                >
                  {selectedParada.regiao}
                </span>
              </div>

              {/* Endereço & Localização */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-start gap-1.5 text-slate-700">
                  <MapPin className="w-4 h-4 text-[#E05328] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{selectedParada.enderecoCompleto}, {selectedParada.numeroComplemento}</p>
                    <p className="text-[11px] text-slate-500">{selectedParada.bairro} - {selectedParada.municipio} • CEP {selectedParada.cep}</p>
                    {selectedParada.pontoReferencia && (
                      <p className="text-[10px] text-slate-400 italic mt-0.5">Ref: {selectedParada.pontoReferencia}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Materiais & Quantidade */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-orange-50/60 border border-orange-200/80">
                  <p className="text-[10px] font-bold text-orange-800 uppercase">Material</p>
                  <p className="font-bold text-slate-900 truncate mt-0.5">{selectedParada.tipoMaterial}</p>
                  <p className="text-[10px] text-orange-700 font-semibold">{selectedParada.quantidadeMaterial} {selectedParada.unidadeMedida}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Janela / Horário</p>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedParada.horarioJanelaEntrega}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Prioridade: <span className="font-bold uppercase">{selectedParada.prioridade}</span></p>
                </div>
              </div>

              {/* Contato & Status */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/55${selectedParada.telefone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{selectedParada.telefone}</span>
                  </a>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  selectedParada.status === 'Entregue'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedParada.status === 'Em rota'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {selectedParada.status}
                </span>
              </div>

              {/* Botões de Ação Direta */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={gerarLinkWaze(selectedParada)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Waze</span>
                  </a>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${selectedParada.enderecoCompleto}, ${selectedParada.numeroComplemento}, ${selectedParada.bairro}, ${selectedParada.municipio}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Google Maps</span>
                  </a>
                </div>

                {onOpenPOD && selectedParada.status !== 'Entregue' && (
                  <button
                    onClick={() => onOpenPOD(selectedParada)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Registrar Comprovação POD</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <MapPin className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600 text-sm">Nenhuma parada selecionada</p>
              <p className="text-xs text-slate-400">Clique em um dos pontos do mapa para visualizar.</p>
            </div>
          )}

          {/* Quick Route Summary */}
          {rota && (
            <div className="p-3 bg-slate-100 rounded-2xl text-[11px] text-slate-600 space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Código: {rota.codigoRota}</span>
                <span>{rota.distanciaTotalKmEstimada} km • ~{rota.tempoEstimadoMinutos} min</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Motoboy: {rota.motoboyNome || 'A definir'}</span>
                <span>Combustível: ~{rota.previsaoCombustivelLitros} L</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
