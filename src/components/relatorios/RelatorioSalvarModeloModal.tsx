import React, { useState } from 'react';
import { X, BookmarkPlus, Save, Check } from 'lucide-react';
import { TipoModeloRelatorio, FiltrosRelatorioCentral } from '../../types';
import { relatoriosModelosRepo } from '../../repositories';

interface RelatorioSalvarModeloModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipoModelo: TipoModeloRelatorio;
  filtros: FiltrosRelatorioCentral;
  colunasVisiveis: string[];
  usuarioId: string;
  usuarioNome: string;
  onSavedSuccess?: () => void;
}

export const RelatorioSalvarModeloModal: React.FC<RelatorioSalvarModeloModalProps> = ({
  isOpen,
  onClose,
  tipoModelo,
  filtros,
  colunasVisiveis,
  usuarioId,
  usuarioNome,
  onSavedSuccess,
}) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [salvoComSucesso, setSalvoComSucesso] = useState(false);

  if (!isOpen) return null;

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    try {
      setSalvando(true);
      await relatoriosModelosRepo.create(
        {
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          tipoModelo,
          filtros,
          colunasVisiveis,
          criadoPorId: usuarioId || 'usr-admin',
          criadoPorNome: usuarioNome || 'Administrador',
        },
        usuarioId || 'usr-admin'
      );

      setSalvoComSucesso(true);
      setTimeout(() => {
        setSalvoComSucesso(false);
        onClose();
        if (onSavedSuccess) onSavedSuccess();
      }, 1200);
    } catch (err) {
      console.error('Erro ao salvar modelo de relatório:', err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      id="modal-salvar-modelo-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
    >
      <div
        id="modal-salvar-modelo-card"
        className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden"
      >
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E05328] flex items-center justify-center text-white">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Salvar Modelo de Relatório</h3>
              <p className="text-xs text-slate-400">Guarde seus filtros para consultas rápidas</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSalvar} className="p-6 space-y-4 text-xs">
          {salvoComSucesso ? (
            <div className="p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Modelo Salvo com Sucesso!</h4>
              <p className="text-slate-500">Agora você pode acessá-lo rapidamente no menu de modelos.</p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nome do Modelo *</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Entregas Urgentes Zona Sul - Semanal"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#E05328]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Descrição (Opcional)</label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Relatório semanal para prestação de contas com o comitê central..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#E05328]"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 space-y-1">
                <p><strong>Modelo Base:</strong> {tipoModelo.replace(/_/g, ' ').toUpperCase()}</p>
                <p><strong>Período:</strong> {filtros.tipoPeriodo.toUpperCase()}</p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando || !nome.trim()}
                  className="px-5 py-2 rounded-xl bg-[#E05328] hover:bg-orange-700 text-white font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{salvando ? 'Salvando...' : 'Salvar Modelo'}</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
