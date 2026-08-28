import React, { useState } from 'react';
import {
  X,
  Printer,
  FileDown,
  FileSpreadsheet,
  Settings2,
  Mail,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Package,
  Layers,
} from 'lucide-react';
import { ItemRelatorioCentral, ModeloRelatorioConfig, FiltrosRelatorioCentral } from '../../types';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';
import { printElementById } from '../../utils/printHelper';
import { exportElementToPdf } from '../../utils/pdfGenerator';

interface RelatorioPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  modeloAtivo: ModeloRelatorioConfig;
  itens: ItemRelatorioCentral[];
  filtros: FiltrosRelatorioCentral;
  usuarioAtualNome: string;
  onExportCsv: () => void;
  onExportExcel: () => void;
}

export const RelatorioPdfModal: React.FC<RelatorioPdfModalProps> = ({
  isOpen,
  onClose,
  modeloAtivo,
  itens,
  filtros,
  usuarioAtualNome,
  onExportCsv,
  onExportExcel,
}) => {
  const [orientacao, setOrientacao] = useState<'retrato' | 'paisagem'>('retrato');
  const [tipoVisualizacao, setTipoVisualizacao] = useState<'sintetico' | 'analitico'>('analitico');
  const [incluirValores, setIncluirValores] = useState(true);
  const [incluirAssinaturas, setIncluirAssinaturas] = useState(true);
  const [observacoesPersonalizadas, setObservacoesPersonalizadas] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  if (!isOpen) return null;

  const dataEmissao = new Date().toLocaleString('pt-BR');
  const codigoAutenticacao = `DOC-TSE-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  // Totais
  const totalRegistros = itens.length;
  const valorTotal = itens.reduce((acc, it) => acc + (it.valor || it.custo || 0), 0);
  const quantidadeTotal = itens.reduce((acc, it) => acc + (it.quantidade || 0), 0);

  // Agrupamento para modo sintético
  const agrupadoPorStatus: Record<string, { count: number; qtd: number; valor: number }> = {};
  itens.forEach((it) => {
    const st = it.statusLabel || it.status || 'Não Definido';
    if (!agrupadoPorStatus[st]) {
      agrupadoPorStatus[st] = { count: 0, qtd: 0, valor: 0 };
    }
    agrupadoPorStatus[st].count += 1;
    agrupadoPorStatus[st].qtd += it.quantidade || 0;
    agrupadoPorStatus[st].valor += it.valor || it.custo || 0;
  });

  const handlePrint = () => {
    setFeedbackMsg(null);
    try {
      printElementById('area-impressao-relatorio-pdf', {
        title: `Relatorio_${modeloAtivo.numero}_${modeloAtivo.id}`,
        orientation: orientacao,
      });
    } catch (err: any) {
      console.error('[RelatorioPdfModal] Falha na impressão:', err);
      setFeedbackMsg({
        tipo: 'erro',
        texto: 'Não foi possível acionar a impressora diretamente. Clique em "Baixar PDF" para gerar o arquivo.',
      });
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setFeedbackMsg(null);
    try {
      const result = await exportElementToPdf('area-impressao-relatorio-pdf', {
        fileName: `Relatorio_FleetMoto_${modeloAtivo.numero}_${Date.now()}.pdf`,
        orientation: orientacao,
        title: modeloAtivo.titulo,
      });

      if (result.success) {
        setFeedbackMsg({
          tipo: 'sucesso',
          texto: 'PDF gerado e baixado com sucesso!',
        });
      } else {
        setFeedbackMsg({
          tipo: 'erro',
          texto: result.error || 'Erro ao gerar o arquivo PDF.',
        });
      }
    } catch (err: any) {
      setFeedbackMsg({
        tipo: 'erro',
        texto: err?.message || 'Falha na geração do PDF.',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareWhatsApp = () => {
    const texto = encodeURIComponent(
      `*Relatório FleetMoto - ${modeloAtivo.titulo}*\n` +
      `Emissão: ${dataEmissao}\n` +
      `Total de Registros: ${totalRegistros}\n` +
      `Qtd Total de Materiais: ${quantidadeTotal}\n` +
      `Valor Consolidado: ${formatCurrency(valorTotal)}\n` +
      `Autenticação: ${codigoAutenticacao}\n\n` +
      `Gerado por: ${usuarioAtualNome}`
    );
    window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');
  };

  const handleShareEmail = () => {
    const assunto = encodeURIComponent(`Relatório: ${modeloAtivo.titulo} - FleetMoto`);
    const corpo = encodeURIComponent(
      `Prezados,\n\n` +
      `Segue o resumo do relatório gerado na plataforma FleetMoto:\n\n` +
      `• Modelo: ${modeloAtivo.titulo}\n` +
      `• Data de Emissão: ${dataEmissao}\n` +
      `• Total de Registros: ${totalRegistros}\n` +
      `• Volume Total de Itens: ${quantidadeTotal}\n` +
      `• Valor Total: ${formatCurrency(valorTotal)}\n` +
      `• Código de Autenticidade: ${codigoAutenticacao}\n\n` +
      `Emitido por: ${usuarioAtualNome}\n` +
      `FleetMoto Logística Eleitoral`
    );
    window.location.href = `mailto:?subject=${assunto}&body=${corpo}`;
  };

  return (
    <div
      id="modal-pdf-relatorio-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn"
    >
      <div
        id="modal-pdf-relatorio-card"
        className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E05328] flex items-center justify-center text-white shadow-md">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Impressão & Exportação de Relatório PDF</span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono text-orange-200">
                  Modelo #{modeloAtivo.numero}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {modeloAtivo.titulo} • {totalRegistros} registros processados
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {feedbackMsg && (
          <div
            className={`p-3 text-xs flex items-center gap-2 border-b font-medium ${
              feedbackMsg.tipo === 'sucesso'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            {feedbackMsg.tipo === 'sucesso' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.texto}</span>
          </div>
        )}

        {/* Modal Body with 2 columns: Options & Preview */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Options Column */}
          <div className="space-y-5 lg:border-r lg:border-slate-200 lg:pr-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-[#E05328]" />
                <span>Configurações do Documento</span>
              </label>

              <div className="space-y-3 pt-1 text-xs">
                <div>
                  <label className="text-slate-600 block mb-1 font-semibold">Orientação da Página:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrientacao('retrato')}
                      className={`p-2.5 rounded-xl border font-bold transition-all text-center cursor-pointer ${
                        orientacao === 'retrato'
                          ? 'border-[#E05328] bg-orange-50 text-[#E05328]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Retrato (Vertical)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientacao('paisagem')}
                      className={`p-2.5 rounded-xl border font-bold transition-all text-center cursor-pointer ${
                        orientacao === 'paisagem'
                          ? 'border-[#E05328] bg-orange-50 text-[#E05328]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Paisagem (Horizontal)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 block mb-1 font-semibold">Estrutura do Conteúdo:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoVisualizacao('analitico')}
                      className={`p-2.5 rounded-xl border font-bold transition-all text-center cursor-pointer ${
                        tipoVisualizacao === 'analitico'
                          ? 'border-[#E05328] bg-orange-50 text-[#E05328]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Analítico (Completo)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoVisualizacao('sintetico')}
                      className={`p-2.5 rounded-xl border font-bold transition-all text-center cursor-pointer ${
                        tipoVisualizacao === 'sintetico'
                          ? 'border-[#E05328] bg-orange-50 text-[#E05328]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Sintético (Resumo)
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={incluirValores}
                      onChange={(e) => setIncluirValores(e.target.checked)}
                      className="rounded border-slate-300 text-[#E05328] focus:ring-[#E05328]"
                    />
                    <span className="text-slate-800 font-medium">Exibir Valores Financeiros (R$)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={incluirAssinaturas}
                      onChange={(e) => setIncluirAssinaturas(e.target.checked)}
                      className="rounded border-slate-300 text-[#E05328] focus:ring-[#E05328]"
                    />
                    <span className="text-slate-800 font-medium">Incluir Bloco de Assinaturas TSE</span>
                  </label>
                </div>

                <div className="pt-2">
                  <label className="text-slate-600 block mb-1 font-semibold">Observações / Notas no Rodapé:</label>
                  <textarea
                    value={observacoesPersonalizadas}
                    onChange={(e) => setObservacoesPersonalizadas(e.target.value)}
                    placeholder="Ex: Prestação de contas comitê financeiro eleitoral 2026..."
                    rows={2}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#E05328]"
                  />
                </div>
              </div>
            </div>

            {/* Direct Export Buttons */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Outros Formatos de Exportação
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onExportExcel}
                  className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={onExportCsv}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-slate-600" />
                  <span>CSV (UTF-8)</span>
                </button>
              </div>

              {/* Share */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareEmail}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>E-mail</span>
                </button>
              </div>
            </div>
          </div>

          {/* Document Preview & Printable Area */}
          <div className="lg:col-span-2 bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between overflow-y-auto max-h-[65vh]">
            <div
              id="area-impressao-relatorio-pdf"
              className="bg-white p-6 rounded-xl border border-slate-300 shadow-xs space-y-4 text-slate-900 font-sans printable-area"
              style={{ minWidth: orientacao === 'paisagem' ? '780px' : 'auto' }}
            >
              {/* Report Official Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black tracking-tight text-base text-slate-950 uppercase">
                      FleetMoto Logística Eleitoral
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-mono">
                      SPCE-TSE
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-[#E05328] mt-1">
                    {modeloAtivo.titulo}
                  </h2>
                  <p className="text-xs text-slate-600">
                    {modeloAtivo.descricao}
                  </p>
                </div>

                <div className="text-right text-[11px] text-slate-500 font-mono space-y-0.5">
                  <p><strong>Emissão:</strong> {dataEmissao}</p>
                  <p><strong>Operador:</strong> {usuarioAtualNome}</p>
                  <p className="text-[#E05328] font-bold">{codigoAutenticacao}</p>
                </div>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Total Registros:</span>
                  <strong className="text-slate-900 text-sm">{formatNumber(totalRegistros)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Volume Total:</span>
                  <strong className="text-slate-900 text-sm">{formatNumber(quantidadeTotal)} un</strong>
                </div>
                {incluirValores && (
                  <div>
                    <span className="text-slate-500 block">Valor Consolidado:</span>
                    <strong className="text-emerald-700 text-sm">{formatCurrency(valorTotal)}</strong>
                  </div>
                )}
              </div>

              {/* Content Mode: Analítico vs Sintético */}
              {tipoVisualizacao === 'analitico' ? (
                /* Analytical Complete Table */
                <div className="border border-slate-200 rounded-lg overflow-hidden text-[11px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Data</th>
                        <th className="p-2">Identificador</th>
                        <th className="p-2">Cliente / Beneficiário</th>
                        <th className="p-2">Material / Referência</th>
                        <th className="p-2 text-right">Qtd</th>
                        <th className="p-2">Status</th>
                        {incluirValores && <th className="p-2 text-right">Valor</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itens.length > 0 ? (
                        itens.map((it, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="p-2 text-slate-600 whitespace-nowrap">
                              {it.dataHoraFormatada || formatDate(it.dataHora)}
                            </td>
                            <td className="p-2 font-mono font-bold text-slate-900 whitespace-nowrap">
                              {it.numeroPedido || it.id.slice(0, 8)}
                            </td>
                            <td className="p-2 text-slate-800 font-medium max-w-[150px] truncate">
                              {it.clienteNome || '-'}
                            </td>
                            <td className="p-2 text-slate-700 max-w-[160px] truncate">
                              {it.materialNome || '-'}
                            </td>
                            <td className="p-2 text-right font-bold text-slate-900 whitespace-nowrap">
                              {it.quantidade !== undefined ? formatNumber(it.quantidade) : '-'}
                            </td>
                            <td className="p-2 whitespace-nowrap">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                {it.statusLabel || it.status || 'OK'}
                              </span>
                            </td>
                            {incluirValores && (
                              <td className="p-2 text-right font-bold text-emerald-700 whitespace-nowrap">
                                {it.valor ? formatCurrency(it.valor) : it.custo ? formatCurrency(it.custo) : '-'}
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-400">
                            Nenhum registro selecionado para este relatório.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {/* Table Summary Footer */}
                    {itens.length > 0 && (
                      <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={4} className="p-2 text-right">TOTAL CONSOLIDADO ({totalRegistros} itens):</td>
                          <td className="p-2 text-right">{formatNumber(quantidadeTotal)}</td>
                          <td></td>
                          {incluirValores && (
                            <td className="p-2 text-right text-emerald-800">{formatCurrency(valorTotal)}</td>
                          )}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              ) : (
                /* Synthetic Summary View */
                <div className="space-y-4 text-xs">
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#E05328]" />
                      <span>Consolidação por Status Operacional</span>
                    </h4>
                    <table className="w-full text-left bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                        <tr>
                          <th className="p-2">Status</th>
                          <th className="p-2 text-right">Qtd Registros</th>
                          <th className="p-2 text-right">Volume Total</th>
                          {incluirValores && <th className="p-2 text-right">Valor Consolidado</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {Object.entries(agrupadoPorStatus).map(([st, dados], idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-bold text-slate-800">{st}</td>
                            <td className="p-2 text-right text-slate-700">{formatNumber(dados.count)}</td>
                            <td className="p-2 text-right font-bold text-slate-900">{formatNumber(dados.qtd)} un</td>
                            {incluirValores && (
                              <td className="p-2 text-right font-bold text-emerald-700">
                                {formatCurrency(dados.valor)}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Custom Notes */}
              {observacoesPersonalizadas && (
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900">
                  <strong>Observações do Emissor:</strong> {observacoesPersonalizadas}
                </div>
              )}

              {/* Signatures */}
              {incluirAssinaturas && (
                <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-600">
                  <div>
                    <div className="border-b border-slate-400 mb-1 h-8" />
                    <strong>{usuarioAtualNome}</strong>
                    <p>Emissor Responsável / Logística</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 mb-1 h-8" />
                    <strong>Auditoria & Conformidade TSE</strong>
                    <p>Comitê Financeiro da Campanha</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Baixar Arquivo PDF (.pdf)</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              disabled={isGeneratingPdf}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-[#E05328]" />
              <span>Imprimir Documento</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
