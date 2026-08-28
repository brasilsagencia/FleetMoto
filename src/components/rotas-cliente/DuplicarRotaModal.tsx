import React, { useState } from 'react';
import { X, Copy, Calendar, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { RotaCliente } from '../../types';

interface DuplicarRotaModalProps {
  rota: RotaCliente;
  onClose: () => void;
  onConfirm: (novaData: string) => Promise<void>;
}

export const DuplicarRotaModal: React.FC<DuplicarRotaModalProps> = ({
  rota,
  onClose,
  onConfirm,
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().slice(0, 10);

  const [novaData, setNovaData] = useState(defaultDate);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaData) {
      alert('Selecione uma data para a nova rota.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(novaData);
      onClose();
    } catch (err: any) {
      alert(`Erro ao duplicar rota: ${err?.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#E05328] flex items-center justify-center border border-orange-200">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Duplicar Rota de Entrega</h3>
              <p className="text-xs text-slate-500">Replicar paradas para uma nova data</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
            <p className="font-bold text-slate-900">Rota Original: {rota.codigoRota}</p>
            <p className="text-slate-600">Cliente: <strong>{rota.clienteNome}</strong></p>
            <p className="text-slate-500">
              Total de Paradas: <strong>{rota.paradas?.length || 0}</strong> • Região: <strong>{rota.regiaoPredominante}</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#E05328]" />
              Nova Data da Rota *
            </label>
            <input
              type="date"
              required
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs font-mono font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Todas as paradas serão duplicadas com o status resetado para "Pendente".
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-[#E05328] hover:bg-[#c9451e] rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Duplicando...</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Confirmar & Gerar Rota</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
