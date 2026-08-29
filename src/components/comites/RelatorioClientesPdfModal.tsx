import React, { useState } from 'react';
import {
  X,
  Printer,
  FileDown,
  Download,
  Settings2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  Sparkles,
  Phone,
  Package,
  Layers,
  User,
  Clock,
  Car,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { Comite } from '../../types';
import { formatDate, formatNumber } from '../../utils/formatters';
import {
  downloadClientesReportPdf,
  printClientesReportPdf,
} from '../../utils/pdfGenerator';
import { printElementById } from '../../utils/printHelper';

interface RelatorioClientesPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Comite[];
  filtrosAtivos: {
    termoBusca?: string;
    filtroDataAgendada?: string;
    filtroDataEspecifica?: string;
    filtroRegiao?: string;
    filtroStatus?: string;
    filtroOrigem?: string;
    filtroMaterial?: string;
  };
  usuarioAtualNome?: string;
  onExportCsv?: () => void;
}

export const RelatorioClientesPdfModal: React.FC<RelatorioClientesPdfModalProps> = ({
  isOpen,
  onClose,
  clientes,
  filtrosAtivos,
  usuarioAtualNome = 'Operador Logístico',
  onExportCsv,
}) => {
  const [orientacao, setOrientacao] = useState<'retrato' | 'paisagem'>('paisagem');
  const [tipoVisualizacao, setTipoVisualizacao] = useState<'analitico' | 'sintetico'>('analitico');
  const [incluirEnderecos, setIncluirEnderecos] = useState(true);
  const [incluirContatos, setIncluirContatos] = useState(true);
  const [incluirInterferencias, setIncluirInterferencias] = useState(true);
  const [incluirAssinaturas, setIncluirAssinaturas] = useState(true);
  const [observacoesPersonalizadas, setObservacoesPersonalizadas] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  if (!isOpen) return null;

  const dataEmissao = new Date().toLocaleString('pt-BR');
  const codigoAutenticacao = `DOC-CLI-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  // Métricas
  const totalRegistros = clientes.length;
  const volumeTotal = clientes.reduce((acc, c) => acc + (c.volumeTotalMateriais || 0), 0);
  const entregasTotal = clientes.reduce((acc, c) => acc + (c.totalEntregas || 0), 0);

  // Datas
  const hojeStr = new Date().toISOString().slice(0, 10);
  const amanhaCalc = new Date();
  amanhaCalc.setDate(amanhaCalc.getDate() + 1);
  const amanhaStr = amanhaCalc.toISOString().slice(0, 10);

  const agendadosHoje = clientes.filter(
    (c) => (c.dataAgendada || c.data || '').slice(0, 10) === hojeStr
  ).length;
  const agendadosAmanha = clientes.filter(
    (c) => (c.dataAgendada || c.data || '').slice(0, 10) === amanhaStr
  ).length;
  const semAgendamento = clientes.filter(
    (c) => !(c.dataAgendada || c.data)
  ).length;

  // Montar descrição de filtros
  const filtrosList: string[] = [];
  if (filtrosAtivos.filtroDataAgendada && filtrosAtivos.filtroDataAgendada !== 'todas') {
    if (filtrosAtivos.filtroDataAgendada === 'hoje') filtrosList.push('Agendamento: Hoje');
    else if (filtrosAtivos.filtroDataAgendada === 'amanha') filtrosList.push('Agendamento: Amanhã');
    else if (filtrosAtivos.filtroDataAgendada === 'semana') filtrosList.push('Agendamento: Próximos 7 Dias');
    else if (filtrosAtivos.filtroDataAgendada === 'sem_data') filtrosList.push('Agendamento: Sem Data');
    else if (filtrosAtivos.filtroDataAgendada === 'especifica' && filtrosAtivos.filtroDataEspecifica)
      filtrosList.push(`Data: ${formatDate(filtrosAtivos.filtroDataEspecifica)}`);
  }
  if (filtrosAtivos.filtroRegiao && filtrosAtivos.filtroRegiao !== 'todas') {
    filtrosList.push(`Rota/Região: ${filtrosAtivos.filtroRegiao === 'sem_rota' ? 'Sem Rota' : filtrosAtivos.filtroRegiao}`);
  }
  if (filtrosAtivos.filtroStatus && filtrosAtivos.filtroStatus !== 'todos') {
    filtrosList.push(`Status: ${filtrosAtivos.filtroStatus.toUpperCase()}`);
  }
  if (filtrosAtivos.filtroOrigem && filtrosAtivos.filtroOrigem !== 'todas') {
    filtrosList.push(`Origem: ${filtrosAtivos.filtroOrigem}`);
  }
  if (filtrosAtivos.termoBusca) {
    filtrosList.push(`Busca: "${filtrosAtivos.termoBusca}"`);
  }

  const filtrosDescricao =
    filtrosList.length > 0
      ? `Filtros Aplicados: ${filtrosList.join(' • ')}`
      : 'Filtros: Todos os clientes cadastrados da base';

  // Configuração para geração do PDF
  const pdfConfig = {
    clientes,
    usuarioAtualNome,
    orientacao,
    tipoVisualizacao,
    incluirEnderecos,
    incluirContatos,
    incluirInterferencias,
    incluirAssinaturas,
    observacoesPersonalizadas,
    filtrosDescricao,
    codigoAutenticacao,
    dataEmissao,
    fileName: `Relatorio_Clientes_FleetMoto_${new Date().toISOString().slice(0, 10)}.pdf`,
  };

  const handlePrint = () => {
    setFeedback(null);
    setIsGenerating(true);
    try {
      const result = printClientesReportPdf(pdfConfig);
      if (result.success) {
        setFeedback({
          tipo: 'sucesso',
          texto: 'Comando de impressão enviado com sucesso!',
        });
      } else {
        // Fallback para print HTML
        printElementById('fleetmoto-clientes-relatorio-preview', {
          title: `Relatório de Clientes - FleetMoto`,
          orientation: orientacao,
          pageFormat: 'a4',
        });
      }
    } catch (err: any) {
      console.error('Erro na impressão:', err);
      setFeedback({
        tipo: 'erro',
        texto: 'Falha ao acionar impressora. Tentando método alternativo...',
      });
      printElementById('fleetmoto-clientes-relatorio-preview', {
        title: `Relatório de Clientes - FleetMoto`,
        orientation: orientacao,
        pageFormat: 'a4',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = () => {
    setFeedback(null);
    setIsGenerating(true);
    try {
      const result = downloadClientesReportPdf(pdfConfig);
      if (result.success) {
        setFeedback({
          tipo: 'sucesso',
          texto: 'Arquivo PDF gerado e baixado com sucesso!',
        });
      } else {
        setFeedback({
          tipo: 'erro',
          texto: result.error || 'Erro ao gerar o arquivo PDF.',
        });
      }
    } catch (err: any) {
      console.error('Erro ao baixar PDF:', err);
      setFeedback({
        tipo: 'erro',
        texto: 'Erro inesperado ao criar o documento PDF.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      id="modal-relatorio-clientes-pdf"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E05328] flex items-center justify-center text-white shadow-md">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Relatório & Impressão em PDF de Clientes
                </h3>
                <span className="text-[10px] bg-orange-500/20 text-orange-300 font-bold px-2 py-0.5 rounded-full border border-orange-500/30">
                  SPCE-TSE
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {totalRegistros} cliente(s) selecionados • Exportação e impressão de alta fidelidade
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={isGenerating || totalRegistros === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#E05328] hover:bg-orange-600 text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
              title="Imprimir diretamente (Ctrl+P)"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating || totalRegistros === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer disabled:opacity-50 border border-white/20"
              title="Baixar arquivo PDF"
            >
              <FileDown className="w-4 h-4 text-orange-400" />
              <span>Baixar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-4 py-2 text-xs flex items-center gap-2 ${
              feedback.tipo === 'sucesso'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            {feedback.tipo === 'sucesso' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.texto}</span>
          </div>
        )}

        {/* Configuration Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {/* Orientação */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Orientação da Página
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setOrientacao('paisagem')}
                  className={`py-1 rounded font-bold transition-all cursor-pointer ${
                    orientacao === 'paisagem'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paisagem (Recomendado)
                </button>
                <button
                  type="button"
                  onClick={() => setOrientacao('retrato')}
                  className={`py-1 rounded font-bold transition-all cursor-pointer ${
                    orientacao === 'retrato'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Retrato
                </button>
              </div>
            </div>

            {/* Tipo de Visualização */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Estrutura do Relatório
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTipoVisualizacao('analitico')}
                  className={`py-1 rounded font-bold transition-all cursor-pointer ${
                    tipoVisualizacao === 'analitico'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Analítico (Detalhado)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoVisualizacao('sintetico')}
                  className={`py-1 rounded font-bold transition-all cursor-pointer ${
                    tipoVisualizacao === 'sintetico'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sintético (Rotas)
                </button>
              </div>
            </div>

            {/* Opções de Colunas */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Campos e Assinaturas
              </label>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={incluirEnderecos}
                    onChange={(e) => setIncluirEnderecos(e.target.checked)}
                    className="rounded text-[#E05328] focus:ring-[#E05328]"
                  />
                  <span>Endereço Completo</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={incluirContatos}
                    onChange={(e) => setIncluirContatos(e.target.checked)}
                    className="rounded text-[#E05328] focus:ring-[#E05328]"
                  />
                  <span>Contatos / Tel</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={incluirInterferencias}
                    onChange={(e) => setIncluirInterferencias(e.target.checked)}
                    className="rounded text-[#E05328] focus:ring-[#E05328]"
                  />
                  <span>Interferências / Obs</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={incluirAssinaturas}
                    onChange={(e) => setIncluirAssinaturas(e.target.checked)}
                    className="rounded text-[#E05328] focus:ring-[#E05328]"
                  />
                  <span>Assinaturas TSE</span>
                </label>
              </div>
            </div>
          </div>

          {/* Observações personalizadas */}
          <div className="mt-2.5 pt-2 border-t border-slate-200/80">
            <input
              type="text"
              placeholder="Observação personalizada para o cabeçalho/rodapé do PDF (ex: 'Campanha Eleitoral 2026 - Rota Especial')..."
              value={observacoesPersonalizadas}
              onChange={(e) => setObservacoesPersonalizadas(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#E05328]/30"
            />
          </div>
        </div>

        {/* Document Preview (Live A4 Sheet Simulation) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70">
          <div
            id="fleetmoto-clientes-relatorio-preview"
            className={`bg-white rounded-xl shadow-md border border-slate-200 p-6 mx-auto ${
              orientacao === 'paisagem' ? 'max-w-4xl' : 'max-w-3xl'
            }`}
          >
            {/* Header Documento */}
            <div className="border-b-2 border-orange-500 pb-3 mb-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg tracking-wider text-slate-900">
                      FLEETMOTO
                    </span>
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      LOGÍSTICA ELEITORAL
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-[#E05328] mt-1">
                    Relatório Oficial de Clientes, Rotas & Agendamentos
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{filtrosDescricao}</p>
                </div>
                <div className="text-right text-[11px] text-slate-600">
                  <p className="font-semibold text-slate-800">Emissão: {dataEmissao}</p>
                  <p>Operador: {usuarioAtualNome}</p>
                  <p className="font-mono text-orange-600 font-bold mt-0.5">{codigoAutenticacao}</p>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total de Clientes
                </span>
                <span className="text-base font-black text-slate-900">
                  {formatNumber(totalRegistros)}
                </span>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Agendados Hoje
                </span>
                <span className="text-base font-black text-emerald-700">
                  {agendadosHoje} cliente(s)
                </span>
              </div>
              <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                  Agendados Amanhã
                </span>
                <span className="text-base font-black text-blue-700">
                  {agendadosAmanha} cliente(s)
                </span>
              </div>
              <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-200">
                <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                  Volume de Materiais
                </span>
                <span className="text-base font-black text-purple-700">
                  {formatNumber(volumeTotal)} un
                </span>
              </div>
            </div>

            {/* Tabela do Preview */}
            {tipoVisualizacao === 'sintetico' ? (
              // Visão Sintética por Região/Rota
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white text-[11px]">
                    <tr>
                      <th className="p-2.5 font-bold">Região / Rota</th>
                      <th className="p-2.5 font-bold text-right">Qtd Clientes</th>
                      <th className="p-2.5 font-bold text-right">Agendados Hoje</th>
                      <th className="p-2.5 font-bold text-right">Agendados Amanhã</th>
                      <th className="p-2.5 font-bold text-right">Volume Materiais</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                    {['Zona Norte', 'Zona Oeste', 'Baixada Fluminense', 'Niterói / São Gonçalo', 'sem_rota'].map((rotaKey) => {
                      const rotaClientes = clientes.filter((c) =>
                        rotaKey === 'sem_rota' ? !c.regiaoRota : c.regiaoRota === rotaKey
                      );
                      if (rotaClientes.length === 0) return null;
                      const countHoje = rotaClientes.filter(
                        (c) => (c.dataAgendada || c.data || '').slice(0, 10) === hojeStr
                      ).length;
                      const countAmanha = rotaClientes.filter(
                        (c) => (c.dataAgendada || c.data || '').slice(0, 10) === amanhaStr
                      ).length;
                      const vol = rotaClientes.reduce(
                        (acc, c) => acc + (c.volumeTotalMateriais || 0),
                        0
                      );

                      return (
                        <tr key={rotaKey} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">
                            {rotaKey === 'sem_rota' ? 'Rota não definida' : rotaKey}
                          </td>
                          <td className="p-2.5 text-right font-semibold">
                            {rotaClientes.length}
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-700">
                            {countHoje}
                          </td>
                          <td className="p-2.5 text-right font-bold text-blue-700">
                            {countAmanha}
                          </td>
                          <td className="p-2.5 text-right font-bold text-purple-700">
                            {formatNumber(vol)} un
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <td className="p-2.5 uppercase">Total Consolidado</td>
                      <td className="p-2.5 text-right">{totalRegistros}</td>
                      <td className="p-2.5 text-right text-emerald-700">{agendadosHoje}</td>
                      <td className="p-2.5 text-right text-blue-700">{agendadosAmanha}</td>
                      <td className="p-2.5 text-right text-purple-700">
                        {formatNumber(volumeTotal)} un
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              // Visão Analítica Detalhada
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white text-[11px]">
                    <tr>
                      <th className="p-2 font-bold whitespace-nowrap">Data / Horário</th>
                      <th className="p-2 font-bold">Cliente / Candidato</th>
                      <th className="p-2 font-bold">Rota / Região</th>
                      {incluirEnderecos && <th className="p-2 font-bold">Endereço</th>}
                      <th className="p-2 font-bold">Materiais</th>
                      {incluirContatos && <th className="p-2 font-bold">Contato</th>}
                      {incluirInterferencias && (
                        <th className="p-2 font-bold">Interferência</th>
                      )}
                      <th className="p-2 font-bold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                    {clientes.map((c, idx) => {
                      const dataEfetiva = c.dataAgendada || c.data || '';
                      const horarioEfetivo = c.horarioAgendado || c.horario || '';
                      const isHoje = dataEfetiva === hojeStr;
                      const isAmanha = dataEfetiva === amanhaStr;

                      return (
                        <tr
                          key={c.id || idx}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                        >
                          <td className="p-2 font-semibold whitespace-nowrap">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                isHoje
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : isAmanha
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : dataEfetiva
                                  ? 'bg-slate-100 text-slate-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {dataEfetiva ? formatDate(dataEfetiva) : 'Sem data'}
                              {horarioEfetivo ? ` • ${horarioEfetivo}h` : ''}
                            </span>
                          </td>
                          <td className="p-2 font-bold text-slate-900">
                            <div>{c.nome}</div>
                            {c.candidato && c.candidato !== c.nome && (
                              <div className="text-[10px] text-slate-500 font-normal">
                                Cand: {c.candidato} {c.partido ? `(${c.partido})` : ''}
                              </div>
                            )}
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {c.regiaoRota || 'Sem rota'}
                            </span>
                          </td>
                          {incluirEnderecos && (
                            <td className="p-2 text-[10px] max-w-[200px] truncate">
                              {c.endereco}
                              {c.numeroEnd ? `, ${c.numeroEnd}` : ''}
                              {c.bairro ? ` - ${c.bairro}` : ''}
                            </td>
                          )}
                          <td className="p-2 text-[10px]">
                            {(c.materiais || []).join(', ') || '-'}
                          </td>
                          {incluirContatos && (
                            <td className="p-2 text-[10px] whitespace-nowrap">
                              <div className="font-semibold">{c.responsavel || '-'}</div>
                              {c.telefone && (
                                <div className="text-slate-500">{c.telefone}</div>
                              )}
                            </td>
                          )}
                          {incluirInterferencias && (
                            <td className="p-2 text-[10px] text-slate-600 max-w-[140px] truncate">
                              {c.interferencia || '-'}
                            </td>
                          )}
                          <td className="p-2 text-center whitespace-nowrap">
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                                c.status === 'ativo'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {c.status || 'ATIVO'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Observações personalizadas exibidas no preview */}
            {observacoesPersonalizadas && (
              <div className="mt-4 p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                <span className="font-bold">Observações: </span>
                <span>{observacoesPersonalizadas}</span>
              </div>
            )}

            {/* Bloco de Assinaturas */}
            {incluirAssinaturas && (
              <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-800">
                    {usuarioAtualNome}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Responsável pela Operação / Logística
                  </div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-800">
                    Auditoria de Conformidade TSE
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Comitê Central • FleetMoto
                  </div>
                </div>
              </div>
            )}

            {/* Rodapé Oficial */}
            <div className="mt-4 pt-2 border-t border-slate-100 text-center text-[10px] text-slate-400">
              FleetMoto Logística Eleitoral 2026 • Documento Oficial SPCE-TSE • Lei 9.504/97
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-white px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              Relatório configurado em <strong>{orientacao === 'paisagem' ? 'Paisagem' : 'Retrato'}</strong> com{' '}
              <strong>{totalRegistros}</strong> cliente(s)
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onExportCsv && (
              <button
                type="button"
                onClick={onExportCsv}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Exportar dados brutos em planilha CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Exportar CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Fechar
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating || totalRegistros === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-4 h-4 text-[#E05328]" />
              <span>Baixar PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={isGenerating || totalRegistros === 0}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#E05328] hover:bg-orange-700 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Relatório (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
