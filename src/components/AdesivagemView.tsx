import React, { useState } from 'react';
import { Award, ShieldCheck, CheckCircle2, XCircle, Clock, Eye, AlertCircle } from 'lucide-react';
import { RegistroAdesivagem } from '../types';
import { getStatusBadgeClass, formatDate } from '../utils/formatters';

interface AdesivagemViewProps {
  adesivagens: RegistroAdesivagem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const AdesivagemView: React.FC<AdesivagemViewProps> = ({
  adesivagens,
  onApprove,
  onReject,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Validação & Compliance de Adesivagem Eleitoral
          </h2>
          <p className="text-xs text-slate-500">
            Auditoria fotográfica de propaganda em baús e tanques de motos credenciadas (TSE)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {adesivagens.map((item) => {
          const statusStyle = getStatusBadgeClass(item.status);
          const isPendente = item.status === 'pendente_revisao';

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div>
                {/* Photo Preview Header */}
                <div className="relative h-48 bg-slate-900 overflow-hidden group">
                  <img
                    src={item.fotoAdesivagemUrl}
                    alt={item.motoboyNome}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-xs font-mono font-bold">
                    Placa: {item.placa}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusStyle.bg} ${statusStyle.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      <span className="capitalize">{item.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {item.motoboyNome}
                  </h4>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Candidato / Partido:</span>
                    <strong className="text-[#E05328]">{item.candidato}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Tipo de Adesivo:</span>
                    <strong className="capitalize">{item.tipoAdesivagem.replace('_', ' ')}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>Data de Envio: {formatDate(item.dataEnvio)}</span>
                    {item.validadoPor && <span>Aprovado por: {item.validadoPor.split(' ')[0]}</span>}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0">
                {isPendente ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onApprove(item.id)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aprovar Adesivagem</span>
                    </button>
                    <button
                      onClick={() => onReject(item.id)}
                      className="py-2 px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl text-xs border border-rose-200"
                    >
                      Rejeitar
                    </button>
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center text-[11px] text-slate-600 font-semibold flex items-center justify-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Conformidade Validada para Campanha</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
