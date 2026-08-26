import React, { useState, useEffect } from 'react';
import {
  X,
  Boxes,
  Barcode,
  Building2,
  Calendar,
  Layers,
  MapPin,
  Tag,
  DollarSign,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Printer,
  Edit2,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  History,
  ShoppingCart
} from 'lucide-react';
import { Material, EstoqueSaldo, EstoqueMovimentacao, EstoqueReserva } from '../../types';
import { estoqueMovimentacoesRepo, estoqueReservasRepo } from '../../repositories';
import { formatCurrency, formatDateTime, formatStatusEstoque, formatTipoMovimentacao } from '../../utils/formatters';

interface ModalDetalhesMaterialProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  saldo?: EstoqueSaldo | null;
  onEdit: (material: Material) => void;
  onEntrada: (material: Material) => void;
  onSaida: (material: Material) => void;
  onEtiqueta: (material: Material) => void;
}

export const ModalDetalhesMaterial: React.FC<ModalDetalhesMaterialProps> = ({
  isOpen,
  onClose,
  material,
  saldo,
  onEdit,
  onEntrada,
  onSaida,
  onEtiqueta,
}) => {
  const [activeTab, setActiveTab] = useState<'geral' | 'kardex' | 'reservas'>('geral');
  const [movimentacoes, setMovimentacoes] = useState<EstoqueMovimentacao[]>([]);
  const [reservas, setReservas] = useState<EstoqueReserva[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (material && isOpen) {
      setLoadingHistory(true);
      Promise.all([
        estoqueMovimentacoesRepo.getByMaterialId(material.id),
        estoqueReservasRepo.getByMaterialId(material.id),
      ])
        .then(([movs, resvs]) => {
          setMovimentacoes(movs);
          setReservas(resvs);
        })
        .catch((err) => console.error('Erro ao carregar histórico:', err))
        .finally(() => setLoadingHistory(false));
    }
  }, [material, isOpen]);

  if (!isOpen || !material) return null;

  const saldoFisico = saldo?.estoqueFisico ?? 0;
  const saldoDisponivel = saldo?.disponivel ?? 0;
  const saldoReservado = saldo?.reservado ?? 0;
  const saldoSeparacao = saldo?.emSeparacao ?? 0;
  const saldoAvariado = saldo?.avariado ?? 0;
  const statusBadge = formatStatusEstoque(saldoFisico, material.estoqueMinimo);
  const valorTotalEstoque = saldoFisico * (material.custoUnitario || 0);

  return (
    <div id="modal-detalhes-material-backdrop" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div id="modal-detalhes-material" className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1A1A1E] text-white px-6 py-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E05328] to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-950/30">
              <Boxes className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-[#E05328]">{material.sku}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.badgeClass}`}>
                  {statusBadge.label}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight leading-tight">
                {material.nome}
              </h3>
            </div>
          </div>
          <button
            id="btn-fechar-modal-detalhes"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Subtabs */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl text-xs font-semibold text-slate-700">
            <button
              onClick={() => setActiveTab('geral')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'geral' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('kardex')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'kardex' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Kardex ({movimentacoes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('reservas')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'reservas' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Reservas ({reservas.length})</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onClose(); onEntrada(material); }}
              className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Entrada</span>
            </button>
            <button
              onClick={() => { onClose(); onSaida(material); }}
              className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg flex items-center gap-1"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Saída</span>
            </button>
            <button
              onClick={() => { onClose(); onEtiqueta(material); }}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Etiqueta</span>
            </button>
            <button
              onClick={() => { onClose(); onEdit(material); }}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'geral' && (
            <>
              {/* Balance Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block">Saldo Físico</span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {saldoFisico.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[10px] text-slate-500 block">{material.unidadeMedida}</span>
                </div>

                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-semibold text-emerald-800 uppercase block">Disponível</span>
                  <span className="text-xl font-black text-emerald-700 font-mono">
                    {saldoDisponivel.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[10px] text-emerald-600 block">Livre p/ pedidos</span>
                </div>

                <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                  <span className="text-[10px] font-semibold text-blue-800 uppercase block">Reservado</span>
                  <span className="text-xl font-black text-blue-700 font-mono">
                    {saldoReservado.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[10px] text-blue-600 block">Em pedidos</span>
                </div>

                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <span className="text-[10px] font-semibold text-amber-800 uppercase block">Em Separação</span>
                  <span className="text-xl font-black text-amber-700 font-mono">
                    {saldoSeparacao.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[10px] text-amber-600 block">Expedição</span>
                </div>

                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <span className="text-[10px] font-semibold text-rose-800 uppercase block">Avariado</span>
                  <span className="text-xl font-black text-rose-700 font-mono">
                    {saldoAvariado.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[10px] text-rose-600 block">Bloqueado</span>
                </div>

                <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
                  <span className="text-[10px] font-semibold text-purple-900 uppercase block">Valor Total</span>
                  <span className="text-sm font-black text-purple-950 font-mono block mt-1">
                    {formatCurrency(valorTotalEstoque)}
                  </span>
                  <span className="text-[10px] text-purple-700 block">
                    {formatCurrency(material.custoUnitario || 0)} / un
                  </span>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Tag className="w-4 h-4 text-[#E05328]" />
                    Dados Cadastrais & Armazenamento
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block">Categoria:</span>
                      <span className="font-semibold text-slate-800">{material.categoria}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Tipo Campanha:</span>
                      <span className="font-semibold text-slate-800">{material.tipoMaterialLabel || material.tipoMaterial}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Localização:</span>
                      <span className="font-bold text-slate-900">{material.localizacao || 'Setor A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Formato / Tamanho:</span>
                      <span className="font-semibold text-slate-800">{material.tamanhoFormato || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Lote Atual:</span>
                      <span className="font-mono font-bold text-slate-900">{material.lote || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Estoque Mínimo:</span>
                      <span className="font-bold text-slate-900">{material.estoqueMinimo} {material.unidadeMedida}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Building2 className="w-4 h-4 text-[#E05328]" />
                    Vínculo Político & Fornecedor
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 block">Fornecedor / Gráfica:</span>
                      <span className="font-semibold text-slate-800">{material.fornecedor || 'Gráfica Alpha'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Candidato:</span>
                      <span className="font-bold text-slate-900">{material.candidato || 'Geral / Comitê'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Partido / Nº:</span>
                      <span className="font-mono font-bold text-slate-900">{material.partido || '-'} {material.numeroCandidato || ''}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Código de Barras:</span>
                      <span className="font-mono text-slate-800">{material.codigoBarras || material.sku}</span>
                    </div>
                  </div>

                  {material.observacoes && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-slate-500 block font-semibold">Observações:</span>
                      <p className="text-slate-700 italic">{material.observacoes}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'kardex' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-600" />
                  Livro de Movimentações (Kardex do Material)
                </h4>
                <span className="text-xs text-slate-500 font-mono">
                  {movimentacoes.length} lançamentos registrados
                </span>
              </div>

              {movimentacoes.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  Nenhuma movimentação registrada para este material ainda.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1A1A1E] text-slate-300 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="p-3">Data / Hora</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3 text-right">Qtd</th>
                        <th className="p-3 text-right">Saldo Ant.</th>
                        <th className="p-3 text-right">Saldo Pós.</th>
                        <th className="p-3">Operador / Motivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {movimentacoes.map((mov) => {
                        const isEntry = mov.tipo === 'entrada';
                        const tipoBadge = formatTipoMovimentacao(mov.tipo, mov.subtipo);

                        return (
                          <tr key={mov.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono text-slate-600">
                              {formatDateTime(mov.createdAt)}
                            </td>
                            <td className="p-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${tipoBadge.badgeClass}`}>
                                {tipoBadge.label}
                              </span>
                            </td>
                            <td className={`p-3 text-right font-mono font-bold ${isEntry ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {isEntry ? `+${mov.quantidade}` : `-${mov.quantidade}`}
                            </td>
                            <td className="p-3 text-right font-mono text-slate-500">
                              {mov.saldoAnterior}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              {mov.saldoPosterior}
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-800">{mov.usuarioNome}</div>
                              <div className="text-[10px] text-slate-500 truncate max-w-xs">{mov.motivo}</div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reservas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  Reservas Ativas em Pedidos
                </h4>
              </div>

              {reservas.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  Nenhuma reserva ativa para este material no momento.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1A1A1E] text-slate-300 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="p-3">Pedido Nº</th>
                        <th className="p-3">Cliente / Comitê</th>
                        <th className="p-3 text-right">Qtd Reservada</th>
                        <th className="p-3">Status Reserva</th>
                        <th className="p-3">Data Reserva</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {reservas.map((resv) => (
                        <tr key={resv.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-slate-900">
                            {resv.numeroPedido}
                          </td>
                          <td className="p-3 font-medium text-slate-800">
                            {resv.clienteNome}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-blue-700">
                            {resv.quantidadeReservada} un
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                              {resv.status}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-600">
                            {formatDateTime(resv.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-200 border border-slate-300 rounded-xl"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
