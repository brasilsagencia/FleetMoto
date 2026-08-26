import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDownLeft,
  Boxes,
  Barcode,
  Building2,
  FileText,
  DollarSign,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { Material, EstoqueSaldo } from '../../types';
import { materiaisRepo, estoqueSaldosRepo, estoqueMovimentacoesRepo } from '../../repositories';
import { formatCurrency } from '../../utils/formatters';

interface ModalEntradaEstoqueProps {
  isOpen: boolean;
  onClose: () => void;
  materiais: Material[];
  saldosMap: Record<string, EstoqueSaldo>;
  materialPreSelecionado?: Material | null;
  onSuccess: () => void;
  currentUserId: string;
  currentUserName: string;
}

export const ModalEntradaEstoque: React.FC<ModalEntradaEstoqueProps> = ({
  isOpen,
  onClose,
  materiais,
  saldosMap,
  materialPreSelecionado,
  onSuccess,
  currentUserId,
  currentUserName,
}) => {
  const [materialId, setMaterialId] = useState('');
  const [subtipo, setSubtipo] = useState<'compra' | 'producao' | 'devolucao_sobra' | 'transferencia_entrada'>('compra');
  const [quantidade, setQuantidade] = useState<number>(100);
  const [custoUnitario, setCustoUnitario] = useState<number>(0);
  const [fornecedor, setFornecedor] = useState('');
  const [numeroNotaFiscal, setNumeroNotaFiscal] = useState('');
  const [numeroPedidoCompra, setNumeroPedidoCompra] = useState('');
  const [lote, setLote] = useState('');
  const [localizacaoDestino, setLocalizacaoDestino] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (materialPreSelecionado) {
      setMaterialId(materialPreSelecionado.id);
      setCustoUnitario(materialPreSelecionado.custoUnitario || 0);
      setFornecedor(materialPreSelecionado.fornecedor || '');
      setLocalizacaoDestino(materialPreSelecionado.localizacao || '');
      setLote(materialPreSelecionado.lote || `LOT-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`);
    } else if (materiais.length > 0 && !materialId) {
      setMaterialId(materiais[0].id);
      setCustoUnitario(materiais[0].custoUnitario || 0);
      setFornecedor(materiais[0].fornecedor || '');
      setLocalizacaoDestino(materiais[0].localizacao || '');
      setLote(materiais[0].lote || `LOT-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`);
    }
    setQuantidade(100);
    setNumeroNotaFiscal('');
    setNumeroPedidoCompra('');
    setMotivo('');
    setObservacoes('');
    setErrorMsg(null);
  }, [materialPreSelecionado, isOpen, materiais]);

  const selectedMaterial = materiais.find((m) => m.id === materialId);
  const saldoAtual = materialId ? saldosMap[materialId]?.estoqueFisico || 0 : 0;
  const saldoDisponivelAtual = materialId ? saldosMap[materialId]?.disponivel || 0 : 0;
  const valorTotal = (Number(quantidade) || 0) * (Number(custoUnitario) || 0);

  const handleMaterialChange = (newMatId: string) => {
    setMaterialId(newMatId);
    const mat = materiais.find((m) => m.id === newMatId);
    if (mat) {
      setCustoUnitario(mat.custoUnitario || 0);
      setFornecedor(mat.fornecedor || '');
      setLocalizacaoDestino(mat.localizacao || '');
      setLote(mat.lote || `LOT-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialId) {
      setErrorMsg('Selecione um material para a entrada.');
      return;
    }
    if (Number(quantidade) <= 0) {
      setErrorMsg('A quantidade deve ser maior que zero.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      await estoqueMovimentacoesRepo.registrarEntrada({
        materialId,
        quantidade: Number(quantidade),
        subtipo,
        custoUnitario: Number(custoUnitario),
        motivo: motivo.trim() || `Entrada de ${quantidade} ${selectedMaterial?.unidadeMedida || 'un'} (${subtipo})`,
        fornecedor: fornecedor.trim(),
        numeroNotaFiscal: numeroNotaFiscal.trim(),
        numeroPedidoCompra: numeroPedidoCompra.trim(),
        lote: lote.trim(),
        localizacaoDestino: localizacaoDestino.trim(),
        observacoes: observacoes.trim(),
        usuarioId: currentUserId,
        usuarioNome: currentUserName,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao registrar entrada de estoque:', err);
      setErrorMsg(err.message || 'Erro ao registrar entrada no estoque.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="modal-entrada-estoque-backdrop" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div id="modal-entrada-estoque" className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#1A1A1E] text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-950/30">
              <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Registrar Entrada de Material
              </h3>
              <p className="text-xs text-slate-400">
                Recebimento de compras, produção gráfica, transferências ou devoluções
              </p>
            </div>
          </div>
          <button
            id="btn-fechar-modal-entrada"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="m-6 mb-0 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Material Selector & Current Stock */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Material a ser estocado *
            </label>
            <select
              id="select-entrada-material"
              required
              value={materialId}
              onChange={(e) => handleMaterialChange(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              {materiais.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.sku}] {m.nome} — ({m.unidadeMedida})
                </option>
              ))}
            </select>

            {selectedMaterial && (
              <div className="mt-2.5 grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Saldo Físico Atual:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {saldoAtual.toLocaleString('pt-BR')} {selectedMaterial.unidadeMedida}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Saldo Disponível:</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {saldoDisponivelAtual.toLocaleString('pt-BR')} {selectedMaterial.unidadeMedida}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Localização Atual:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedMaterial.localizacao || 'Não definida'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tipo de Entrada & Quantidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo / Origem da Entrada *
              </label>
              <select
                id="select-entrada-subtipo"
                value={subtipo}
                onChange={(e) => setSubtipo(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="compra">Compra de Fornecedor / Gráfica</option>
                <option value="producao">Produção Interna / Gráfica Própria</option>
                <option value="devolucao_sobra">Devolução de Sobra de Rota</option>
                <option value="transferencia_entrada">Transferência entre Galpões</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantidade a Entrar *
              </label>
              <input
                id="input-entrada-quantidade"
                type="number"
                min="1"
                required
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                placeholder="Ex: 500"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Custos & Valores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200">
            <div>
              <label className="block text-xs font-semibold text-emerald-950 mb-1">
                Custo Unitário (R$)
              </label>
              <div className="relative">
                <span className="text-xs font-bold text-emerald-700 absolute left-3 top-2.5">R$</span>
                <input
                  id="input-entrada-custo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={custoUnitario}
                  onChange={(e) => setCustoUnitario(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-950 mb-1">
                Valor Total da Entrada
              </label>
              <div className="px-3 py-2 text-sm bg-white border border-emerald-300 rounded-lg font-bold text-emerald-800 font-mono flex items-center justify-between">
                <span>{formatCurrency(valorTotal)}</span>
                <span className="text-[10px] text-emerald-600 font-sans font-normal">
                  ({quantidade} x {formatCurrency(custoUnitario)})
                </span>
              </div>
            </div>
          </div>

          {/* Dados Fiscais / Rastreabilidade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fornecedor
              </label>
              <input
                id="input-entrada-fornecedor"
                type="text"
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                placeholder="Ex: Gráfica Paulista"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nº Nota Fiscal (NF-e)
              </label>
              <input
                id="input-entrada-nf"
                type="text"
                value={numeroNotaFiscal}
                onChange={(e) => setNumeroNotaFiscal(e.target.value)}
                placeholder="Ex: 001.234.567"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lote de Fabricação
              </label>
              <input
                id="input-entrada-lote"
                type="text"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                placeholder="LOT-2026-X"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Localização & Motivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Endereço no Armazém (Prateleira/Box)
              </label>
              <input
                id="input-entrada-localizacao"
                type="text"
                value={localizacaoDestino}
                onChange={(e) => setLocalizacaoDestino(e.target.value)}
                placeholder="Ex: Setor A — Prateleira 01"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo / Justificativa
              </label>
              <input
                id="input-entrada-motivo"
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Reposição de estoque semanal"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              id="btn-cancelar-entrada"
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-confirmar-entrada"
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-lg shadow-emerald-950/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? (
                <span>Gravando entrada...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Entrada</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
