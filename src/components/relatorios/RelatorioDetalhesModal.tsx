import React, { useState } from 'react';
import {
  X,
  FileCheck,
  Calendar,
  Building2,
  Package,
  User,
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Printer,
  FileText,
  DollarSign,
  AlertTriangle,
  FileDown,
  Loader2,
} from 'lucide-react';
import { ItemRelatorioCentral } from '../../types';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';
import { printElementById } from '../../utils/printHelper';
import { exportElementToPdf } from '../../utils/pdfGenerator';

interface RelatorioDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ItemRelatorioCentral | null;
  onOpenPODModal?: (entrega: any) => void;
}

export const RelatorioDetalhesModal: React.FC<RelatorioDetalhesModalProps> = ({
  isOpen,
  onClose,
  item,
  onOpenPODModal,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen || !item) return null;

  const original = item.registroOriginal || {};

  const handlePrint = () => {
    printElementById('area-impressao-detalhes-relatorio', {
      title: `Ficha_${item?.numeroPedido || item?.id || 'Registro'}`,
    });
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await exportElementToPdf('area-impressao-detalhes-relatorio', {
        fileName: `Dossie_${item?.numeroPedido || item?.id || 'Registro'}_${Date.now()}.pdf`,
        orientation: 'portrait',
      });
    } catch (err) {
      console.error('[RelatorioDetalhesModal] Erro ao baixar PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div
      id="modal-detalhes-relatorio-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-fadeIn"
    >
      <div
        id="area-impressao-detalhes-relatorio"
        className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 printable-area"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E05328] flex items-center justify-center text-white shadow-lg">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-orange-200 uppercase">
                  {item.tipoRegistro}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {item.id.slice(0, 14)}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                {item.numeroPedido ? `Pedido #${item.numeroPedido}` : item.clienteNome || 'Detalhes do Registro'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              type="button"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Baixar PDF"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Baixar PDF</span>
            </button>

            <button
              onClick={handlePrint}
              type="button"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Imprimir Ficha"
            >
              <Printer className="w-4 h-4 text-orange-300" />
              <span className="hidden sm:inline">Imprimir Ficha</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Data & Horário</span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {item.dataHoraFormatada || formatDate(item.dataHora)}
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Cliente / Comitê</span>
              </div>
              <p className="text-sm font-bold text-slate-900 truncate">
                {item.clienteNome || 'Não informado'}
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Status Atual</span>
              </div>
              <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#E05328]" />
                {item.statusLabel || item.status || 'Registrado'}
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Package className="w-3.5 h-3.5 text-slate-400" />
                <span>Material Principal</span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {item.materialNome || 'N/A'}
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Truck className="w-3.5 h-3.5 text-slate-400" />
                <span>Motoboy / Entregador</span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {item.motoboyNome || 'Não atribuído'}
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>Valor / Custo</span>
              </div>
              <p className="text-sm font-bold text-emerald-700">
                {item.valor ? formatCurrency(item.valor) : item.custo ? formatCurrency(item.custo) : 'R$ 0,00'}
              </p>
            </div>
          </div>

          {/* Detailed Items List if Order */}
          {original.itens && Array.isArray(original.itens) && original.itens.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#E05328]" />
                <span>Itens e Materiais do Pedido ({original.itens.length})</span>
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Material / Descrição</th>
                      <th className="p-3 text-right">Quantidade</th>
                      <th className="p-3 text-right">Preço Unit.</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {original.itens.map((it: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{it.materialNome || it.nome}</p>
                          <span className="text-[10px] text-slate-500 font-mono">{it.materialSku || it.sku}</span>
                        </td>
                        <td className="p-3 text-right font-bold text-slate-800">
                          {formatNumber(it.quantidade)} {it.unidadeMedida || 'un'}
                        </td>
                        <td className="p-3 text-right text-slate-600">
                          {formatCurrency(it.precoUnitario || 0)}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">
                          {formatCurrency(it.subtotal || (it.quantidade * (it.precoUnitario || 0)))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Delivery POD Info if exists */}
          {original.comprovantePOD && (
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Comprovante de Entrega Digital (POD) Validado</span>
                </div>
                {onOpenPODModal && (
                  <button
                    onClick={() => onOpenPODModal(original)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1 cursor-pointer no-print"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ver Comprovante Oficial</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-emerald-950">
                <div>
                  <span className="text-emerald-700">Recebedor: </span>
                  <strong>{original.comprovantePOD.nomeRecebedor}</strong>
                </div>
                <div>
                  <span className="text-emerald-700">Documento / RG: </span>
                  <strong>{original.comprovantePOD.documentoRecebedor || 'Validado'}</strong>
                </div>
                <div>
                  <span className="text-emerald-700">Data/Hora: </span>
                  <strong>{original.comprovantePOD.dataHora}</strong>
                </div>
                <div>
                  <span className="text-emerald-700">Código Rastreio: </span>
                  <strong className="font-mono">{original.codigoRastreio || 'TSE-ENT-OK'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* History Timeline */}
          {original.historicoStatus && Array.isArray(original.historicoStatus) && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#E05328]" />
                <span>Trilha de Eventos e Alterações</span>
              </h4>
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50">
                {original.historicoStatus.map((h: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 text-xs border-b border-slate-200/60 pb-2 last:border-0 last:pb-0">
                    <span className="w-2 h-2 rounded-full bg-[#E05328] mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 capitalize">{h.status?.replace('_', ' ')}</strong>
                        <span className="text-[11px] text-slate-500">{formatDate(h.dataHora || h.createdAt)}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{h.observacao || h.motivo || 'Transição de status registrada'}</p>
                      {h.usuarioNome && (
                        <span className="text-[10px] text-slate-400 font-mono">Operador: {h.usuarioNome}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observations */}
          {item.observacoes && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Observações Registradas</span>
              </div>
              <p className="text-xs text-amber-950 whitespace-pre-wrap">{item.observacoes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-3 no-print">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
