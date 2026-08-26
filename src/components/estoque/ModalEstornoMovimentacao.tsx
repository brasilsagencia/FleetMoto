import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  FileText,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User
} from 'lucide-react';
import { EstoqueMovimentacao, Usuario } from '../../types';
import { estoqueMovimentacoesRepo } from '../../repositories';
import { formatDateTime, formatCurrency } from '../../utils/formatters';

interface ModalEstornoMovimentacaoProps {
  isOpen: boolean;
  onClose: () => void;
  movimentacao: EstoqueMovimentacao | null;
  onSuccess: () => void;
  currentUser: Usuario;
}

export const ModalEstornoMovimentacao: React.FC<ModalEstornoMovimentacaoProps> = ({
  isOpen,
  onClose,
  movimentacao,
  onSuccess,
  currentUser,
}) => {
  const [motivoEstorno, setMotivoEstorno] = useState('');
  const [senhaSupervisor, setSenhaSupervisor] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAuthorized =
    currentUser.papel === 'supervisor_estoque' ||
    currentUser.papel === 'admin' ||
    currentUser.papel === 'gerente';

  if (!isOpen || !movimentacao) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) {
      setErrorMsg('Apenas Supervisores de Estoque ou Administradores têm permissão para estornar movimentações.');
      return;
    }
    if (!motivoEstorno.trim()) {
      setErrorMsg('Informe o motivo e justificativa para este estorno.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      await estoqueMovimentacoesRepo.estornarMovimentacao(
        movimentacao.id,
        motivoEstorno.trim(),
        currentUser.id,
        currentUser.nome
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao estornar movimentação:', err);
      setErrorMsg(err.message || 'Erro ao processar estorno.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="modal-estorno-backdrop" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div id="modal-estorno" className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#1A1A1E] text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-purple-950/30">
              <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Estorno Autorizado de Movimentação
              </h3>
              <p className="text-xs text-slate-400">
                Correção de lançamento contábil de estoque com rastreabilidade total
              </p>
            </div>
          </div>
          <button
            id="btn-fechar-modal-estorno"
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

        {/* Summary of Original Movement */}
        <div className="p-6 pb-0">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between font-mono font-bold text-slate-900 border-b border-slate-200 pb-2">
              <span>{movimentacao.materialSku}</span>
              <span className="uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {movimentacao.tipo.toUpperCase()} ({movimentacao.subtipo})
              </span>
            </div>
            <div className="font-semibold text-slate-900 text-sm">{movimentacao.materialNome}</div>
            <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
              <div>
                <span className="text-slate-400 block">Quantidade Movimentada:</span>
                <span className="font-bold text-slate-900">{movimentacao.quantidade} un</span>
              </div>
              <div>
                <span className="text-slate-400 block">Data Original:</span>
                <span className="font-semibold text-slate-800">{formatDateTime(movimentacao.createdAt)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Operador Original:</span>
                <span className="font-semibold text-slate-800">{movimentacao.usuarioNome}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Motivo Registrado:</span>
                <span className="font-semibold text-slate-800 truncate block">{movimentacao.motivo || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Diretriz de Imutabilidade TSE / Auditoria:</strong>
              O registro original não será apagado. O sistema gerará automaticamente uma movimentação inversa vinculada, restaurando o saldo do estoque e registrando seu usuário e data/hora.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Justificativa Obrigatória do Estorno *
            </label>
            <textarea
              id="textarea-motivo-estorno"
              rows={3}
              required
              value={motivoEstorno}
              onChange={(e) => setMotivoEstorno(e.target.value)}
              placeholder="Ex: Lançamento de quantidade incorreta pelo operador. Entrada correta será refeita com NF 1234."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supervisor Responsável
            </label>
            <div className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>{currentUser.nome} ({currentUser.papel})</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Autorizado
              </span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              id="btn-cancelar-estorno"
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-confirmar-estorno"
              type="submit"
              disabled={loading || !isAuthorized}
              className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-purple-950/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? (
                <span>Gravando estorno...</span>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Confirmar Estorno Autorizado</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
