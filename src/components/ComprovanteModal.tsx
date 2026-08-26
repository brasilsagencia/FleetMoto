import React from 'react';
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
} from 'lucide-react';
import { Entrega } from '../types';
import { formatCNPJ, formatDateTime, formatNumber } from '../utils/formatters';

interface ComprovanteModalProps {
  entrega: Entrega | null;
  onClose: () => void;
}

export const ComprovanteModal: React.FC<ComprovanteModalProps> = ({
  entrega,
  onClose,
}) => {
  if (!entrega || !entrega.comprovantePOD) return null;

  const pod = entrega.comprovantePOD;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 lg:p-8 shadow-2xl border border-slate-200 relative my-6 animate-in zoom-in-95 duration-150 print:border-none print:shadow-none print:m-0 print:p-4">
        {/* Header Action Buttons (hidden during print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Comprovante Oficial de Entrega de Material (POD - TSE)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="mt-4 space-y-5 text-xs text-slate-700">
          {/* Document Heading */}
          <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
            <div className="inline-block font-black text-sm tracking-wider uppercase text-slate-900">
              FleetMoto • Logística & Distribuição Eleitoral
            </div>
            <h2 className="text-lg font-black text-slate-900">
              TERMO DE COMPROVAÇÃO DE ENTREGA DE MATERIAL DE PROPAGANDA
            </h2>
            <p className="text-[11px] text-slate-500 font-mono">
              Código de Autenticidade: {entrega.codigoRastreio} • Resolução TSE 23.610/2019
            </p>
          </div>

          {/* Campaign & Committee Info */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Comitê Contratante</p>
              <p className="font-bold text-slate-900 text-xs mt-0.5">{entrega.comiteNome}</p>
              <p className="text-slate-600">Candidato: <strong>{entrega.candidato}</strong> ({entrega.partido})</p>
              <p className="font-mono text-[11px] text-slate-700 mt-1">
                CNPJ da Campanha: {formatCNPJ(entrega.cnpjCampanha)}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Destino da Entrega</p>
              <p className="font-bold text-slate-900 text-xs mt-0.5">{entrega.enderecoDestino}</p>
              <p className="text-slate-600">{entrega.bairro} - {entrega.cidade}</p>
              <p className="font-semibold text-orange-700 text-[11px] mt-1">
                {entrega.zonaEleitoral}
              </p>
            </div>
          </div>

          {/* Material Quantities */}
          <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase">
              Discriminação dos Materiais Impressos Entregues
            </p>
            <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-900">{entrega.descricaoMaterial}</span>
              <span className="font-mono font-black text-slate-900 text-sm">
                {formatNumber(entrega.quantidade)} {entrega.unidadeMedida} (~{entrega.pesoKg}kg)
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Motoboy Responsável pelo Transporte: <strong>{entrega.motoboyNome}</strong> (Placa: {entrega.motoboyPlaca})</span>
              <span>Data/Hora da Entrega: <strong>{pod.dataHora}</strong></span>
            </div>
          </div>

          {/* Proof Evidence (Photo + Signature Canvas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Foto no Local */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Registro Fotográfico da Carga no Comitê
              </p>
              <div className="h-40 rounded-lg overflow-hidden border border-slate-200 bg-white">
                <img
                  src={pod.fotoUrl}
                  alt="Comprovante de entrega"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Assinatura Digital */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Assinatura Digital do Recebedor
                </p>
                <div className="h-28 rounded-lg overflow-hidden border border-slate-200 bg-white p-2 flex items-center justify-center mt-2">
                  <img
                    src={pod.assinaturaBase64}
                    alt="Assinatura"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>

              <div className="text-[11px] pt-1 border-t border-slate-200">
                <p className="font-bold text-slate-900">{pod.nomeRecebedor}</p>
                <p className="text-slate-500 font-mono">{pod.documentoRecebedor}</p>
              </div>
            </div>
          </div>

          {/* GPS & Timestamp Footnote */}
          <div className="p-3 bg-slate-100 rounded-xl font-mono text-[10px] text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border border-slate-200">
            <div>
              <strong>Coordenadas GPS:</strong> {pod.localizacaoGps}
            </div>
            <div>
              <strong>Validador Criptográfico:</strong> SHA256-FLEETMOTO-TSE-OK
            </div>
          </div>

          {pod.notas && (
            <p className="text-[11px] text-slate-500 italic">
              <strong>Observações de campo:</strong> "{pod.notas}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
