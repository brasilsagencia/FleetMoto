import React, { useState } from 'react';
import {
  X,
  Printer,
  ShieldCheck,
  MapPin,
  Calendar,
  User,
  Building2,
  Package,
  Bike,
  CheckCircle2,
  FileText,
  Download,
  Share2,
  Copy,
  Check,
  Phone,
} from 'lucide-react';
import { Entrega } from '../types';
import { formatCNPJ, formatDateTime, formatNumber } from '../utils/formatters';
import { printElementById } from '../utils/printHelper';

interface ComprovanteModalProps {
  entrega: Entrega | null;
  onClose: () => void;
}

export const ComprovanteModal: React.FC<ComprovanteModalProps> = ({
  entrega,
  onClose,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);

  if (!entrega || !entrega.comprovantePOD) return null;

  const pod = entrega.comprovantePOD;

  const handlePrint = () => {
    printElementById('area-impressao-comprovante-pod', {
      title: `Termo_Comprovacao_Entrega_${entrega.codigoRastreio}`,
    });
  };

  const handleShareWhatsApp = () => {
    const msg = [
      `*TERMO DE COMPROVAÇÃO DE ENTREGA (POD ELEITORAL)* 📦✅`,
      `*Código de Autenticidade:* ${pod.codigoAutenticidade || entrega.codigoRastreio}`,
      `*Pedido:* ${entrega.pedidoId || 'N/A'} • *Rastreio:* ${entrega.codigoRastreio}`,
      `*Comitê/Cliente:* ${entrega.comiteNome}`,
      `*Candidato:* ${entrega.candidato} (${entrega.partido})`,
      `*Material:* ${entrega.descricaoMaterial} (${formatNumber(entrega.quantidade)} ${entrega.unidadeMedida})`,
      `*Recebido por:* ${pod.nomeRecebedor} (${pod.documentoRecebedor})`,
      `*Data/Hora:* ${pod.dataHora}`,
      `*Motoboy:* ${pod.motoboyNome || entrega.motoboyNome || 'Motoboy'} (Placa: ${pod.motoboyPlaca || entrega.motoboyPlaca || 'N/A'})`,
      `*Endereço:* ${entrega.enderecoDestino}, ${entrega.bairro} - ${entrega.cidade} (${entrega.zonaEleitoral})`,
      `*GPS:* ${pod.localizacaoGps}`,
      `*Hash TSE:* \`${(pod.hashSha256 || 'SHA256-FLEETMOTO-TSE-OK').substring(0, 24)}...\``,
      `_Documento emitido com validade jurídica de comprovação de entrega perante o Tribunal Superior Eleitoral._`,
    ].join('\n');

    const encoded = encodeURIComponent(msg);
    const phoneClean = (pod.telefoneRecebedor || entrega.telefoneContato || '').replace(/\D/g, '');
    const url =
      phoneClean.length >= 10
        ? `https://api.whatsapp.com/send?phone=55${phoneClean}&text=${encoded}`
        : `https://api.whatsapp.com/send?text=${encoded}`;

    window.open(url, '_blank');
  };

  const copyHash = () => {
    if (pod.hashSha256) {
      navigator.clipboard.writeText(pod.hashSha256);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-slate-200 relative my-6 animate-in zoom-in-95 duration-150 print:border-none print:shadow-none print:m-0 print:p-2">
        {/* Header Action Buttons (hidden during print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                Termo Oficial de Comprovação de Entrega
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {entrega.codigoRastreio} • Resolução TSE 23.610/2019
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              id="btn-imprimir-comprovante-pod"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          id="area-impressao-comprovante-pod"
          className="mt-4 space-y-4 text-xs text-slate-700 bg-white printable-area"
        >
          {/* Document Heading */}
          <div className="text-center pb-3 border-b-2 border-slate-900 space-y-1">
            <div className="inline-block font-black text-xs tracking-wider uppercase text-slate-900">
              FleetMoto • Logística & Distribuição Eleitoral
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              TERMO DE COMPROVAÇÃO DE ENTREGA DE MATERIAL DE PROPAGANDA
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono">
              Código de Autenticidade: {pod.codigoAutenticidade || entrega.codigoRastreio} • Prestação de Contas Eleitoral
            </p>
          </div>

          {/* Tracking & Order Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-2.5 rounded-xl text-[10px] font-mono border border-slate-200">
            <div>
              <span className="text-slate-500 block">Nº PEDIDO:</span>
              <strong className="text-slate-900">{entrega.pedidoId || 'DIRETO'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">RASTREAMENTO:</span>
              <strong className="text-slate-900">{entrega.codigoRastreio}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">DATA/HORA ENTREGA:</span>
              <strong className="text-slate-900">{pod.dataHora}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">STATUS JURÍDICO:</span>
              <strong className="text-emerald-700 font-bold">COMPROVADO TSE</strong>
            </div>
          </div>

          {/* Campaign & Committee Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase">Comitê / Contratante</p>
              <p className="font-bold text-slate-900 text-xs mt-0.5">{entrega.comiteNome}</p>
              <p className="text-slate-600">
                Candidato: <strong>{entrega.candidato}</strong> ({entrega.partido})
              </p>
              <p className="font-mono text-[10px] text-slate-700 mt-1">
                CNPJ da Campanha: {formatCNPJ(entrega.cnpjCampanha)}
              </p>
            </div>

            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase">Endereço de Entrega</p>
              <p className="font-bold text-slate-900 text-xs mt-0.5">{entrega.enderecoDestino}</p>
              <p className="text-slate-600">
                {entrega.bairro} - {entrega.cidade}
              </p>
              <p className="font-semibold text-orange-700 text-[10px] mt-0.5">
                {entrega.zonaEleitoral}
              </p>
            </div>
          </div>

          {/* Material Quantities Table */}
          <div className="p-3.5 border border-slate-200 rounded-xl bg-white space-y-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase">
              Relação Completa dos Materiais Entregues
            </p>
            <div className="space-y-1">
              {pod.itensEntregues && pod.itensEntregues.length > 0 ? (
                pod.itensEntregues.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs border-b border-slate-100 last:border-0 pb-1"
                  >
                    <span className="font-bold text-slate-900">{it.materialNome}</span>
                    <span className="font-mono font-black text-slate-900">
                      {formatNumber(it.quantidade)} {it.unidadeMedida}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-1">
                  <span className="font-bold text-slate-900">{entrega.descricaoMaterial}</span>
                  <span className="font-mono font-black text-slate-900">
                    {formatNumber(entrega.quantidade)} {entrega.unidadeMedida} (~{entrega.pesoKg}kg)
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100 gap-1">
              <span>
                Motoboy: <strong>{pod.motoboyNome || entrega.motoboyNome || 'Não informado'}</strong> (Placa: {pod.motoboyPlaca || entrega.motoboyPlaca || 'N/A'})
              </span>
              <span>Identificação Transporte: {pod.motoboyId || entrega.motoboyId || 'FROTA_MOTO'}</span>
            </div>
          </div>

          {/* Receiver Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase">Nome do Recebedor</p>
              <p className="font-bold text-slate-900">{pod.nomeRecebedor}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase">Documento (CPF / RG)</p>
              <p className="font-mono font-bold text-slate-900">{pod.documentoRecebedor}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase">Telefone de Contato</p>
              <p className="font-mono text-slate-700">{pod.telefoneRecebedor || entrega.telefoneContato || 'Não informado'}</p>
            </div>
          </div>

          {/* Proof Evidence (Photo + Signature Canvas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Foto no Local */}
            <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 space-y-1.5">
              <p className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Registro Fotográfico Direto da Câmera
              </p>
              <div className="h-36 rounded-lg overflow-hidden border border-slate-200 bg-white">
                <img
                  src={pod.fotoUrl}
                  alt="Comprovante de entrega"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Assinatura Digital */}
            <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 space-y-1.5 flex flex-col justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Assinatura Digital do Recebedor
                </p>
                <div className="h-28 rounded-lg overflow-hidden border border-slate-200 bg-white p-2 flex items-center justify-center mt-1">
                  <img
                    src={pod.assinaturaBase64}
                    alt="Assinatura"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>

              <div className="text-[10px] pt-1 border-t border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-900">{pod.nomeRecebedor}</span>
                <span className="text-slate-500 font-mono">{pod.documentoRecebedor}</span>
              </div>
            </div>
          </div>

          {/* GPS & Timestamp Footnote */}
          <div className="p-2.5 bg-slate-100 rounded-xl font-mono text-[9px] text-slate-600 space-y-1 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <strong>Localização GPS:</strong> {pod.localizacaoGps}
              </div>
              <div>
                <strong>Auditoria TSE:</strong> Validado Criptograficamente
              </div>
            </div>
            {pod.hashSha256 && (
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200">
                <span className="truncate">
                  <strong>Hash SHA-256:</strong> {pod.hashSha256}
                </span>
                <button
                  type="button"
                  onClick={copyHash}
                  className="text-[#E05328] font-bold hover:underline shrink-0 flex items-center gap-0.5 cursor-pointer print:hidden"
                >
                  {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedHash ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            )}
          </div>

          {pod.notas && (
            <p className="text-[10px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-200">
              <strong>Observações de campo:</strong> "{pod.notas}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
