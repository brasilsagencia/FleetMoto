import React, { useState } from 'react';
import {
  X,
  Printer,
  Barcode,
  Boxes,
  Copy,
  Check,
  Building2,
  Calendar,
  Layers,
  MapPin
} from 'lucide-react';
import { Material, EstoqueSaldo } from '../../types';
import { formatDate } from '../../utils/formatters';
import { printElementById } from '../../utils/printHelper';

interface ModalEtiquetaMaterialProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  saldo?: EstoqueSaldo | null;
}

export const ModalEtiquetaMaterial: React.FC<ModalEtiquetaMaterialProps> = ({
  isOpen,
  onClose,
  material,
  saldo,
}) => {
  const [formato, setFormato] = useState<'termica_10x15' | 'termica_10x5' | 'a4_grade'>('termica_10x15');
  const [quantidadeCopias, setQuantidadeCopias] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !material) return null;

  const handlePrint = () => {
    printElementById('area-impressao-etiqueta', {
      pageFormat: 'termica',
      title: `Etiqueta_${material.sku}`
    });
  };

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(material.codigoBarras || material.sku);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="modal-etiqueta-backdrop" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div id="modal-etiqueta" className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#1A1A1E] text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E05328] to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-950/30">
              <Barcode className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Emissão de Etiquetas de Armazém
              </h3>
              <p className="text-xs text-slate-400">
                Padrão térmico para identificação de caixas, paletes e volumes eleitorais
              </p>
            </div>
          </div>
          <button
            id="btn-fechar-modal-etiqueta"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Formato de Impressão
            </label>
            <select
              value={formato}
              onChange={(e) => setFormato(e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328]"
            >
              <option value="termica_10x15">Térmica Padrão (10 x 15 cm — Caixa/Palete)</option>
              <option value="termica_10x5">Térmica Compacta (10 x 5 cm — Pacote)</option>
              <option value="a4_grade">Folha A4 Adesiva (Pimaco)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantidade de Cópias
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={quantidadeCopias}
              onChange={(e) => setQuantidadeCopias(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328]"
            />
          </div>
        </div>

        {/* Label Preview Card */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-100/70">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Pré-visualização da Etiqueta
          </span>

          {/* Printable Label container */}
          <div
            id="area-impressao-etiqueta"
            className="w-full max-w-md bg-white border-2 border-dashed border-slate-400 rounded-xl p-5 shadow-lg space-y-4 text-slate-900 printable-area"
          >
            {/* Header Brand */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight font-sans">
                  Fleet<span className="text-[#E05328]">Moto</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black text-white">
                  LOGÍSTICA ELEITORAL 2026
                </span>
              </div>
              <span className="text-xs font-mono font-bold">{formatDate(new Date().toISOString())}</span>
            </div>

            {/* SKU & Title */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono tracking-tight text-slate-950">
                  {material.sku}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono">
                  {material.categoria}
                </span>
              </div>
              <h2 className="text-lg font-black leading-snug mt-1 text-slate-900">
                {material.nome}
              </h2>
            </div>

            {/* Candidate / Committee metadata */}
            {(material.candidato || material.partido) && (
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-300 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Candidato / Comitê:</span>
                  <span className="font-bold text-slate-900">{material.candidato || 'Geral'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Partido / Nº:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {material.partido || '-'} {material.numeroCandidato ? `(${material.numeroCandidato})` : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Logistics Grid */}
            <div className="grid grid-cols-3 gap-2 text-xs border-y border-slate-300 py-2 font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block font-sans font-semibold">Lote:</span>
                <span className="font-bold text-slate-900">{material.lote || 'PADRAO'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans font-semibold">Localização:</span>
                <span className="font-bold text-slate-900">{material.localizacao || 'BOX-01'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-sans font-semibold">Unidade:</span>
                <span className="font-bold text-slate-900 uppercase">{material.unidadeMedida}</span>
              </div>
            </div>

            {/* Visual Barcode Pattern */}
            <div className="flex flex-col items-center justify-center pt-2">
              <div className="w-full h-14 bg-repeat-x flex items-center justify-center border-t border-b border-slate-900 py-1">
                {/* SVG Barcode Bars Generator */}
                <svg className="w-full h-12" viewBox="0 0 260 40" preserveAspectRatio="none">
                  <rect x="0" y="0" width="4" height="40" fill="#000" />
                  <rect x="6" y="0" width="2" height="40" fill="#000" />
                  <rect x="10" y="0" width="6" height="40" fill="#000" />
                  <rect x="18" y="0" width="2" height="40" fill="#000" />
                  <rect x="24" y="0" width="4" height="40" fill="#000" />
                  <rect x="32" y="0" width="6" height="40" fill="#000" />
                  <rect x="42" y="0" width="2" height="40" fill="#000" />
                  <rect x="48" y="0" width="4" height="40" fill="#000" />
                  <rect x="56" y="0" width="6" height="40" fill="#000" />
                  <rect x="66" y="0" width="4" height="40" fill="#000" />
                  <rect x="74" y="0" width="2" height="40" fill="#000" />
                  <rect x="80" y="0" width="6" height="40" fill="#000" />
                  <rect x="90" y="0" width="4" height="40" fill="#000" />
                  <rect x="98" y="0" width="2" height="40" fill="#000" />
                  <rect x="104" y="0" width="4" height="40" fill="#000" />
                  <rect x="112" y="0" width="6" height="40" fill="#000" />
                  <rect x="122" y="0" width="2" height="40" fill="#000" />
                  <rect x="128" y="0" width="4" height="40" fill="#000" />
                  <rect x="136" y="0" width="6" height="40" fill="#000" />
                  <rect x="146" y="0" width="4" height="40" fill="#000" />
                  <rect x="154" y="0" width="2" height="40" fill="#000" />
                  <rect x="160" y="0" width="6" height="40" fill="#000" />
                  <rect x="170" y="0" width="4" height="40" fill="#000" />
                  <rect x="178" y="0" width="2" height="40" fill="#000" />
                  <rect x="184" y="0" width="4" height="40" fill="#000" />
                  <rect x="192" y="0" width="6" height="40" fill="#000" />
                  <rect x="202" y="0" width="4" height="40" fill="#000" />
                  <rect x="210" y="0" width="2" height="40" fill="#000" />
                  <rect x="216" y="0" width="6" height="40" fill="#000" />
                  <rect x="226" y="0" width="4" height="40" fill="#000" />
                  <rect x="234" y="0" width="2" height="40" fill="#000" />
                  <rect x="240" y="0" width="4" height="40" fill="#000" />
                  <rect x="248" y="0" width="6" height="40" fill="#000" />
                  <rect x="256" y="0" width="4" height="40" fill="#000" />
                </svg>
              </div>
              <span className="text-xs font-mono tracking-widest font-bold mt-1">
                {material.codigoBarras || material.sku}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-6 bg-white border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopyBarcode}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Código Copiado!' : 'Copiar Código de Barras'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Fechar
            </button>
            <button
              id="btn-imprimir-etiqueta-real"
              type="button"
              onClick={handlePrint}
              className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#E05328] to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl shadow-lg shadow-orange-950/20 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Etiqueta ({quantidadeCopias}x)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
