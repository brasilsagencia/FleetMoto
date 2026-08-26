import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowUpRight,
  Boxes,
  AlertTriangle,
  FileText,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { Material, EstoqueSaldo } from '../../types';
import { estoqueMovimentacoesRepo } from '../../repositories';

interface ModalSaidaEstoqueProps {
  isOpen: boolean;
  onClose: () => void;
  materiais: Material[];
  saldosMap: Record<string, EstoqueSaldo>;
  materialPreSelecionado?: Material | null;
  onSuccess: () => void;
  currentUserId: string;
  currentUserName: string;
}

export const ModalSaidaEstoque: React.FC<ModalSaidaEstoqueProps> = ({
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
  const [subtipo, setSubtipo] = useState<'perda' | 'avaria' | 'amostra' | 'entrega_comite' | 'pedido_venda'>('perda');
  const [quantidade, setQuantidade] = useState<number>(10);
  const [motivo, setMotivo] = useState('');
  const [destinatario, setDestinatario] = useState('');
  const [responsavelRetirada, setResponsavelRetirada] = useState('');
  const [documentoVinculado, setDocumentoVinculado] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (materialPreSelecionado) {
      setMaterialId(materialPreSelecionado.id);
    } else if (materiais.length > 0 && !materialId) {
      setMaterialId(materiais[0].id);
    }
    setQuantidade(10);
    setMotivo('');
    setDestinatario('');
    setResponsavelRetirada('');
    setDocumentoVinculado('');
    setObservacoes('');
    setErrorMsg(null);
  }, [materialPreSelecionado, isOpen, materiais]);

  const selectedMaterial = materiais.find((m) => m.id === materialId);
  const saldoFisico = materialId ? saldosMap[materialId]?.estoqueFisico || 0 : 0;
  const saldoDisponivel = materialId ? saldosMap[materialId]?.disponivel || 0 : 0;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialId) {
      setErrorMsg('Selecione um material.');
      return;
    }
    if (Number(quantidade) <= 0) {
      setErrorMsg('A quantidade deve ser maior que zero.');
      return;
    }
    if (Number(quantidade) > saldoDisponivel) {
      setErrorMsg(`Saldo disponível insuficiente (${saldoDisponivel} ${selectedMaterial?.unidadeMedida}). Não é permitido gerar estoque negativo.`);
      return;
    }
    if (!motivo.trim()) {
      setErrorMsg('Informe a justificativa/motivo para esta baixa no estoque.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      await estoqueMovimentacoesRepo.registrarSaida({
        materialId,
        quantidade: Number(quantidade),
        subtipo,
        motivo: motivo.trim(),
        destinatario: destinatario.trim(),
        responsavelRetirada: responsavelRetirada.trim(),
        documentoVinculado: documentoVinculado.trim(),
        observacoes: observacoes.trim(),
        usuarioId: currentUserId,
        usuarioNome: currentUserName,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao registrar saída de estoque:', err);
      setErrorMsg(err.message || 'Erro ao registrar saída no estoque.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="modal-saida-estoque-backdrop" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div id="modal-saida-estoque" className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#1A1A1E] text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/30">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Registrar Saída / Baixa de Material
              </h3>
              <p className="text-xs text-slate-400">
                Baixa manual por perda, avaria, amostra ou entrega direta
              </p>
            </div>
          </div>
          <button
            id="btn-fechar-modal-saida"
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
          {/* Material Selector & Balances */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Material para Baixa *
            </label>
            <select
              id="select-saida-material"
              required
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
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
                  <span className="text-slate-500 block">Saldo Físico:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {saldoFisico.toLocaleString('pt-BR')} {selectedMaterial.unidadeMedida}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Disponível p/ Baixa:</span>
                  <span className={`font-bold text-sm ${saldoDisponivel > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {saldoDisponivel.toLocaleString('pt-BR')} {selectedMaterial.unidadeMedida}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Localização:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedMaterial.localizacao || 'Não definida'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tipo de Saída & Quantidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo / Motivo da Baixa *
              </label>
              <select
                id="select-saida-subtipo"
                value={subtipo}
                onChange={(e) => setSubtipo(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="perda">Perda / Descarte Operacional</option>
                <option value="avaria">Avaria / Material Danificado</option>
                <option value="amostra">Amostra / Demonstração / Balcão</option>
                <option value="entrega_comite">Entrega Direta no Comitê</option>
                <option value="pedido_venda">Saída por Pedido Avulso</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantidade a Baixar *
              </label>
              <input
                id="input-saida-quantidade"
                type="number"
                min="1"
                max={saldoDisponivel}
                required
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                placeholder="Ex: 10"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Máximo permitido: {saldoDisponivel} {selectedMaterial?.unidadeMedida || 'un'}
              </span>
            </div>
          </div>

          {/* Justificativa Obrigatória */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Justificativa / Motivo Detalhado *
            </label>
            <input
              id="input-saida-motivo"
              type="text"
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Material rasgado durante manuseio / Amostra para conferência da comissão"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Destinatário & Responsável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Destino / Comitê / Evento
              </label>
              <input
                id="input-saida-destinatario"
                type="text"
                value={destinatario}
                onChange={(e) => setDestinatario(e.target.value)}
                placeholder="Ex: Comitê Central / Evento Praça da Sé"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Responsável pela Retirada
              </label>
              <input
                id="input-saida-responsavel"
                type="text"
                value={responsavelRetirada}
                onChange={(e) => setResponsavelRetirada(e.target.value)}
                placeholder="Ex: Carlos Santana (Coordenador)"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Documento Vinculado */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Documento / Protocolo Vinculado (Opcional)
            </label>
            <input
              id="input-saida-doc"
              type="text"
              value={documentoVinculado}
              onChange={(e) => setDocumentoVinculado(e.target.value)}
              placeholder="Ex: PROTOCOLO-2026-088 ou PED-2026-000101"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              id="btn-cancelar-saida"
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-confirmar-saida"
              type="submit"
              disabled={loading || saldoDisponivel <= 0}
              className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 rounded-xl shadow-lg shadow-rose-950/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? (
                <span>Processando baixa...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Saída</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
