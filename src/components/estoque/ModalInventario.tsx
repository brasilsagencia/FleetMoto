import React, { useState, useEffect } from 'react';
import {
  X,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Search,
  Plus,
  ShieldCheck,
  DollarSign,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { Material, EstoqueSaldo, Inventario, ItemInventario, Usuario } from '../../types';
import { materiaisRepo, estoqueSaldosRepo, inventariosRepo } from '../../repositories';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface ModalInventarioProps {
  isOpen: boolean;
  onClose: () => void;
  materiais: Material[];
  saldosMap: Record<string, EstoqueSaldo>;
  inventarioAtivo?: Inventario | null;
  onSuccess: () => void;
  currentUser: Usuario;
}

export const ModalInventario: React.FC<ModalInventarioProps> = ({
  isOpen,
  onClose,
  materiais,
  saldosMap,
  inventarioAtivo,
  onSuccess,
  currentUser,
}) => {
  const [etapa, setEtapa] = useState<'abertura' | 'contagem' | 'aprovacao'>('abertura');
  
  // Abertura
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<'geral' | 'categoria' | 'localizacao' | 'amostragem'>('geral');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroLocalizacao, setFiltroLocalizacao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Itens em contagem
  const [itensContagem, setItensContagem] = useState<ItemInventario[]>([]);
  const [filtroBusca, setFiltroBusca] = useState('');
  const [justificativaAprovacao, setJustificativaAprovacao] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSupervisor = currentUser.papel === 'supervisor_estoque' || currentUser.papel === 'admin' || currentUser.papel === 'gerente';

  useEffect(() => {
    if (inventarioAtivo) {
      setTitulo(inventarioAtivo.titulo);
      setTipo(inventarioAtivo.tipo);
      setObservacoes(inventarioAtivo.observacoes || '');
      setItensContagem(inventarioAtivo.itens || []);
      if (inventarioAtivo.status === 'em_analise' || inventarioAtivo.status === 'contagem') {
        setEtapa(inventarioAtivo.status === 'em_analise' ? 'aprovacao' : 'contagem');
      } else {
        setEtapa('contagem');
      }
    } else {
      const dataHoje = new Intl.DateTimeFormat('pt-BR').format(new Date());
      setTitulo(`Inventário Físico — ${dataHoje}`);
      setTipo('geral');
      setFiltroCategoria('');
      setFiltroLocalizacao('');
      setObservacoes('');
      setEtapa('abertura');

      // Preparar itens baseado nos materiais ativos
      const initialItens: ItemInventario[] = materiais.map((m) => {
        const saldoSys = saldosMap[m.id]?.estoqueFisico || 0;
        return {
          materialId: m.id,
          sku: m.sku,
          nomeMaterial: m.nome,
          categoria: m.categoria,
          unidadeMedida: m.unidadeMedida,
          localizacao: m.localizacao || '',
          saldoSistema: saldoSys,
          contagemFisica: saldoSys, // padrão igual ao sistema
          divergencia: 0,
          custoUnitario: m.custoUnitario || 0,
          valorDivergencia: 0,
          justificativa: '',
        };
      });
      setItensContagem(initialItens);
    }
    setErrorMsg(null);
  }, [inventarioAtivo, isOpen, materiais, saldosMap]);

  if (!isOpen) return null;

  const handleUpdateContagem = (index: number, val: number) => {
    const updated = [...itensContagem];
    const item = updated[index];
    const contagem = Number(val) >= 0 ? Number(val) : 0;
    const divergencia = contagem - item.saldoSistema;
    const valorDiv = divergencia * (item.custoUnitario || 0);

    updated[index] = {
      ...item,
      contagemFisica: contagem,
      divergencia,
      valorDivergencia: valorDiv,
    };
    setItensContagem(updated);
  };

  const handleUpdateJustificativa = (index: number, just: string) => {
    const updated = [...itensContagem];
    updated[index] = {
      ...updated[index],
      justificativa: just,
    };
    setItensContagem(updated);
  };

  const totalDivergencias = itensContagem.filter((i) => i.divergencia !== 0).length;
  const valorTotalImpacto = itensContagem.reduce((acc, curr) => acc + (curr.valorDivergencia || 0), 0);

  const handleAbrirInventario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg(null);

      // Filtrar itens caso tipo seja categoria ou localização
      let itensFiltrados = [...itensContagem];
      if (tipo === 'categoria' && filtroCategoria) {
        itensFiltrados = itensFiltrados.filter((i) => i.categoria === filtroCategoria);
      } else if (tipo === 'localizacao' && filtroLocalizacao) {
        itensFiltrados = itensFiltrados.filter((i) =>
          i.localizacao.toLowerCase().includes(filtroLocalizacao.toLowerCase())
        );
      }

      await inventariosRepo.abrirInventario({
        titulo: titulo.trim(),
        tipo,
        categoriaFiltro: filtroCategoria,
        localizacaoFiltro: filtroLocalizacao,
        observacoes: observacoes.trim(),
        usuarioId: currentUser.id,
        usuarioNome: currentUser.nome,
      });

      onSuccess();
      setEtapa('contagem');
    } catch (err: any) {
      console.error('Erro ao abrir inventário:', err);
      setErrorMsg(err.message || 'Erro ao abrir inventário.');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarContagem = async () => {
    if (!inventarioAtivo) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      await inventariosRepo.atualizarContagem(
        inventarioAtivo.id,
        itensContagem,
        currentUser.id,
        currentUser.nome
      );

      onSuccess();
      setEtapa('aprovacao');
    } catch (err: any) {
      console.error('Erro ao salvar contagem:', err);
      setErrorMsg(err.message || 'Erro ao salvar contagem do inventário.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizarAjustes = async () => {
    if (!inventarioAtivo) return;
    if (!isSupervisor) {
      setErrorMsg('Apenas supervisores de estoque ou administradores podem aprovar e aplicar ajustes de inventário.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      await inventariosRepo.finalizarInventario(
        inventarioAtivo.id,
        currentUser.id,
        currentUser.nome,
        justificativaAprovacao.trim()
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao aprovar e finalizar inventário:', err);
      setErrorMsg(err.message || 'Erro ao finalizar inventário no banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  const itensExibidos = itensContagem.filter(
    (item) =>
      item.nomeMaterial.toLowerCase().includes(filtroBusca.toLowerCase()) ||
      item.sku.toLowerCase().includes(filtroBusca.toLowerCase()) ||
      item.categoria.toLowerCase().includes(filtroBusca.toLowerCase())
  );

  return (
    <div id="modal-inventario-backdrop" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div id="modal-inventario" className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1A1A1E] text-white px-6 py-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-950/30">
              <ClipboardList className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {inventarioAtivo ? `Inventário: ${inventarioAtivo.codigo}` : 'Novo Inventário Físico de Estoque'}
              </h3>
              <p className="text-xs text-slate-400">
                Contagem física, apuração de divergências (sobras/faltas) e aprovação de ajustes
              </p>
            </div>
          </div>
          <button
            id="btn-fechar-modal-inventario"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Breadcrumb */}
        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex items-center gap-4 text-xs font-semibold text-slate-600 shrink-0">
          <div className={`flex items-center gap-1.5 ${etapa === 'abertura' ? 'text-indigo-600 font-bold' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
            Parâmetros & Abertura
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <div className={`flex items-center gap-1.5 ${etapa === 'contagem' ? 'text-indigo-600 font-bold' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[10px]">2</span>
            Digitação da Contagem Física
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <div className={`flex items-center gap-1.5 ${etapa === 'aprovacao' ? 'text-indigo-600 font-bold' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[10px]">3</span>
            Auditoria & Aprovação do Supervisor
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="m-6 mb-0 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 shrink-0">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {etapa === 'abertura' && (
            <form onSubmit={handleAbrirInventario} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Título do Inventário *
                  </label>
                  <input
                    id="input-inventario-titulo"
                    type="text"
                    required
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Inventário Mensal de Campanha"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Escopo / Tipo de Contagem *
                  </label>
                  <select
                    id="select-inventario-tipo"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="geral">Inventário Geral (Todos os materiais)</option>
                    <option value="categoria">Por Categoria Específica</option>
                    <option value="localizacao">Por Setor / Prateleira</option>
                    <option value="amostragem">Amostragem Rápida (Itens Críticos)</option>
                  </select>
                </div>
              </div>

              {tipo === 'categoria' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selecione a Categoria
                  </label>
                  <input
                    type="text"
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    placeholder="Ex: Adesivos e perfurados"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {tipo === 'localizacao' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Setor / Localização no Armazém
                  </label>
                  <input
                    type="text"
                    value={filtroLocalizacao}
                    onChange={(e) => setFiltroLocalizacao(e.target.value)}
                    placeholder="Ex: Setor A"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações / Instruções para a Equipe de Contagem
                </label>
                <textarea
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Instruções para conferência física, lacres de caixas, etc."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  id="btn-abrir-inventario"
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-lg shadow-indigo-950/20 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Abrir Inventário & Iniciar Contagem</span>
                </button>
              </div>
            </form>
          )}

          {(etapa === 'contagem' || etapa === 'aprovacao') && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block font-medium">Itens no Inventário</span>
                  <span className="text-xl font-black text-slate-900">{itensContagem.length} itens</span>
                </div>
                <div className={`p-3.5 rounded-xl border ${totalDivergencias > 0 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                  <span className="text-xs block font-medium">Itens com Divergência</span>
                  <span className="text-xl font-black">
                    {totalDivergencias} {totalDivergencias === 1 ? 'item' : 'itens'}
                  </span>
                </div>
                <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200">
                  <span className="text-xs text-purple-900 block font-medium">Impacto Financeiro (R$)</span>
                  <span className={`text-xl font-black ${valorTotalImpacto < 0 ? 'text-rose-700' : valorTotalImpacto > 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                    {formatCurrency(valorTotalImpacto)}
                  </span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={filtroBusca}
                  onChange={(e) => setFiltroBusca(e.target.value)}
                  placeholder="Filtrar por SKU, nome do material ou categoria..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Table of items */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1A1A1E] text-slate-300 sticky top-0 uppercase tracking-wider font-semibold text-[10px]">
                      <tr>
                        <th className="p-3">SKU / Material</th>
                        <th className="p-3">Localização</th>
                        <th className="p-3 text-right">Saldo Sistema</th>
                        <th className="p-3 text-right">Contagem Física</th>
                        <th className="p-3 text-right">Divergência</th>
                        <th className="p-3 text-right">Impacto R$</th>
                        <th className="p-3">Justificativa da Divergência</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {itensExibidos.map((item, idx) => {
                        const originalIndex = itensContagem.findIndex((i) => i.materialId === item.materialId);
                        const hasDivergence = item.divergencia !== 0;

                        return (
                          <tr key={item.materialId} className={`hover:bg-slate-50 ${hasDivergence ? 'bg-amber-50/50' : ''}`}>
                            <td className="p-3">
                              <div className="font-mono font-bold text-slate-900">{item.sku}</div>
                              <div className="text-slate-600 font-medium">{item.nomeMaterial}</div>
                              <span className="text-[10px] text-slate-400">{item.categoria}</span>
                            </td>
                            <td className="p-3 font-mono text-slate-600">
                              {item.localizacao || '-'}
                            </td>
                            <td className="p-3 text-right font-bold text-slate-700">
                              {item.saldoSistema.toLocaleString('pt-BR')} {item.unidadeMedida}
                            </td>
                            <td className="p-3 text-right">
                              {etapa === 'contagem' ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={item.contagemFisica}
                                  onChange={(e) => handleUpdateContagem(originalIndex, Number(e.target.value))}
                                  className="w-24 px-2 py-1 text-right text-xs font-bold bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                                />
                              ) : (
                                <span className="font-bold text-slate-900">
                                  {item.contagemFisica.toLocaleString('pt-BR')} {item.unidadeMedida}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right font-bold">
                              {item.divergencia > 0 ? (
                                <span className="text-emerald-700 flex items-center justify-end gap-0.5">
                                  <TrendingUp className="w-3.5 h-3.5" />
                                  +{item.divergencia} {item.unidadeMedida} (Sobra)
                                </span>
                              ) : item.divergencia < 0 ? (
                                <span className="text-rose-700 flex items-center justify-end gap-0.5">
                                  <TrendingDown className="w-3.5 h-3.5" />
                                  {item.divergencia} {item.unidadeMedida} (Falta)
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">Exato</span>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono font-bold">
                              <span className={item.valorDivergencia < 0 ? 'text-rose-700' : item.valorDivergencia > 0 ? 'text-emerald-700' : 'text-slate-400'}>
                                {formatCurrency(item.valorDivergencia || 0)}
                              </span>
                            </td>
                            <td className="p-3">
                              {hasDivergence && etapa === 'contagem' ? (
                                <input
                                  type="text"
                                  value={item.justificativa || ''}
                                  onChange={(e) => handleUpdateJustificativa(originalIndex, e.target.value)}
                                  placeholder="Motivo da sobra ou falta..."
                                  className="w-full px-2 py-1 text-xs bg-white border border-amber-300 rounded focus:ring-2 focus:ring-indigo-500"
                                />
                              ) : (
                                <span className="text-slate-500 italic">{item.justificativa || (hasDivergence ? 'Sem justificativa' : '-')}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Justificativa do Supervisor (no fluxo de aprovação) */}
              {etapa === 'aprovacao' && (
                <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200 space-y-3">
                  <div className="flex items-center gap-2 text-purple-950 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5 text-purple-700" />
                    Parecer & Autorização do Supervisor de Estoque
                  </div>
                  <p className="text-xs text-purple-800">
                    Ao confirmar a finalização, os saldos físicos dos materiais serão automaticamente ajustados para a contagem física apurada, e os lançamentos contábeis de movimentação (Kardex) serão gravados com seu login.
                  </p>
                  <textarea
                    rows={2}
                    value={justificativaAprovacao}
                    onChange={(e) => setJustificativaAprovacao(e.target.value)}
                    placeholder="Descreva o parecer da supervisão sobre as divergências encontradas..."
                    className="w-full px-3 py-2 text-sm bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {inventarioAtivo ? `Status atual: ${inventarioAtivo.status.toUpperCase()}` : ''}
                </div>
                <div className="flex items-center gap-3">
                  {etapa === 'aprovacao' && (
                    <button
                      type="button"
                      onClick={() => setEtapa('contagem')}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                    >
                      Voltar para Digitação
                    </button>
                  )}
                  {etapa === 'contagem' && (
                    <button
                      type="button"
                      onClick={handleSalvarContagem}
                      disabled={loading}
                      className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Salvar Contagem & Avançar para Auditoria</span>
                    </button>
                  )}
                  {etapa === 'aprovacao' && (
                    <button
                      id="btn-finalizar-inventario"
                      type="button"
                      onClick={handleFinalizarAjustes}
                      disabled={loading || !isSupervisor}
                      className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-purple-950/20 disabled:opacity-50 flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isSupervisor ? 'Aprovar & Aplicar Ajustes no Estoque' : 'Aguardando Supervisor'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
