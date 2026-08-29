import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  Download,
  Filter,
  BarChart3,
  Calendar,
  User,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Fuel,
  FileSpreadsheet,
  Layers,
  Search,
  FileDown,
  Loader2,
} from 'lucide-react';
import { RotaCliente, PontoEntregaRota, RegiaoRota } from '../../types';
import { REGIOES_CONFIG } from '../../utils/geoRegions';
import { printElementById } from '../../utils/printHelper';
import { downloadRotasReportPdf } from '../../utils/pdfGenerator';

interface RotaRelatorioModalProps {
  rotas: RotaCliente[];
  onClose: () => void;
}

export const RotaRelatorioModal: React.FC<RotaRelatorioModalProps> = ({
  rotas,
  onClose,
}) => {
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroRegiao, setFiltroRegiao] = useState<string>('todas');
  const [filtroMotoboy, setFiltroMotoboy] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Coleta todas as paradas das rotas selecionadas
  const todasParadasComRota = useMemo(() => {
    return rotas.flatMap((r) =>
      (r.paradas || []).map((p) => ({
        ...p,
        rotaCodigo: r.codigoRota,
        rotaNome: r.nomeRota,
        motoboyNome: r.motoboyNome,
        dataRota: r.dataRota,
        valorDiaria: r.valorDiaria,
        valorCombustivel: r.valorCombustivel,
        valorAdicional: r.valorAdicionalPorEntrega,
      }))
    );
  }, [rotas]);

  // Filtragem
  const paradasFiltradas = useMemo(() => {
    return todasParadasComRota.filter((p) => {
      if (filtroCliente && !p.clienteNome.toLowerCase().includes(filtroCliente.toLowerCase()) && !p.nomeDestinatario.toLowerCase().includes(filtroCliente.toLowerCase())) {
        return false;
      }
      if (filtroRegiao !== 'todas' && p.regiao !== filtroRegiao) {
        return false;
      }
      if (filtroMotoboy && !p.motoboyNome.toLowerCase().includes(filtroMotoboy.toLowerCase())) {
        return false;
      }
      if (filtroStatus !== 'todos') {
        if (filtroStatus === 'Entregue' && p.status !== 'Entregue') return false;
        if (filtroStatus === 'Pendente' && p.status !== 'Pendente') return false;
        if (filtroStatus === 'Insucesso' && !['Não entregue', 'Endereço não localizado', 'Destinatário ausente', 'Cancelada'].includes(p.status)) return false;
      }
      if (filtroDataInicio && p.dataEntrega < filtroDataInicio) return false;
      if (filtroDataFim && p.dataEntrega > filtroDataFim) return false;
      return true;
    });
  }, [todasParadasComRota, filtroCliente, filtroRegiao, filtroMotoboy, filtroStatus, filtroDataInicio, filtroDataFim]);

  // Cálculos Consolidados
  const totalParadas = paradasFiltradas.length;
  const totalEntregues = paradasFiltradas.filter((p) => p.status === 'Entregue').length;
  const totalPendentes = paradasFiltradas.filter((p) => p.status === 'Pendente' || p.status === 'Separando material' || p.status === 'Em rota').length;
  const totalInsucessos = paradasFiltradas.filter((p) => ['Não entregue', 'Endereço não localizado', 'Destinatário ausente', 'Cancelada'].includes(p.status)).length;
  const taxaSucesso = totalParadas > 0 ? Math.round((totalEntregues / totalParadas) * 100) : 0;

  const rotasFiltradasUnicas = useMemo(() => {
    const codigos = new Set(paradasFiltradas.map((p) => p.rotaCodigo));
    return rotas.filter((r) => codigos.has(r.codigoRota));
  }, [rotas, paradasFiltradas]);

  const kmTotal = rotasFiltradasUnicas.reduce((acc, r) => acc + (r.distanciaTotalKmEstimada || 0), 0);
  const tempoTotalMin = rotasFiltradasUnicas.reduce((acc, r) => acc + (r.tempoEstimadoMinutos || 0), 0);
  const combustivelTotalL = rotasFiltradasUnicas.reduce((acc, r) => acc + (r.previsaoCombustivelLitros || 0), 0);
  const custoDiarias = rotasFiltradasUnicas.reduce((acc, r) => acc + (r.valorDiaria || 0), 0);
  const custoCombustivel = rotasFiltradasUnicas.reduce((acc, r) => acc + (r.valorCombustivel || 0), 0);
  const custoTotal = rotasFiltradasUnicas.reduce((acc, r) => acc + (r.valorTotalPrevisto || (r.valorDiaria + r.valorCombustivel)), 0);

  const handlePrint = () => {
    printElementById('area-impressao-relatorio-rotas', {
      title: `Relatorio_Rotas_FleetMoto_${new Date().toISOString().slice(0, 10)}`,
    });
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      downloadRotasReportPdf({
        paradas: paradasFiltradas,
        rotas: rotasFiltradasUnicas,
        totalParadas,
        entregues: totalEntregues,
        pendentes: totalPendentes,
        insucesso: totalInsucessos,
        kmTotal,
        custoTotal,
        fileName: `Relatorio_Rotas_FleetMoto_${new Date().toISOString().slice(0, 10)}.pdf`,
      });
    } catch (err) {
      console.error('[RotaRelatorioModal] Erro ao baixar PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Código Rota',
      'Cliente',
      'Destinatário',
      'Telefone',
      'Endereço',
      'Bairro',
      'Município',
      'CEP',
      'Região',
      'Material',
      'Quantidade',
      'Status',
      'Data Entrega',
      'Motoboy',
      'Recebedor POD',
      'Hash TSE',
    ];

    const rows = paradasFiltradas.map((p) => [
      `"${p.rotaCodigo}"`,
      `"${p.clienteNome}"`,
      `"${p.nomeDestinatario}"`,
      `"${p.telefone}"`,
      `"${p.enderecoCompleto}, ${p.numeroComplemento}"`,
      `"${p.bairro}"`,
      `"${p.municipio}"`,
      `"${p.cep}"`,
      `"${p.regiao}"`,
      `"${p.tipoMaterial}"`,
      p.quantidadeMaterial,
      `"${p.status}"`,
      `"${p.dataEntrega}"`,
      `"${p.motoboyNome}"`,
      `"${p.comprovantePOD?.nomeRecebedor || ''}"`,
      `"${p.comprovantePOD?.hashSha256 || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_rotas_fleetmoto_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div
        id="area-impressao-relatorio-rotas"
        className="bg-white rounded-3xl max-w-6xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 relative my-6 animate-in fade-in zoom-in-95 duration-150 printable-area"
      >
        {/* Header do Relatório */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#E05328] flex items-center justify-center font-bold">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight">
                  Relatório Operacional de Rotas e Entregas
                </h3>
                <p className="text-xs text-slate-500">
                  Consolidado por Cliente, Região, Motoboy e Comprovações de Entrega (POD TSE)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>Baixar PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#E05328] hover:bg-[#c9451e] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filtros Analíticos */}
        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs no-print">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Cliente / Destino</label>
            <input
              type="text"
              placeholder="Buscar..."
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Região</label>
            <select
              value={filtroRegiao}
              onChange={(e) => setFiltroRegiao(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
            >
              <option value="todas">Todas as Regiões</option>
              <option value="Zona Norte">Zona Norte (Azul)</option>
              <option value="Zona Oeste">Zona Oeste (Laranja)</option>
              <option value="Baixada Fluminense">Baixada Fluminense (Verde)</option>
              <option value="Niterói / São Gonçalo">Niterói / SG (Roxo)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Motoboy</label>
            <input
              type="text"
              placeholder="Nome do motoboy..."
              value={filtroMotoboy}
              onChange={(e) => setFiltroMotoboy(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Status Entrega</label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
            >
              <option value="todos">Todos os Status</option>
              <option value="Entregue">Entregues com Sucesso</option>
              <option value="Pendente">Pendentes / Em Rota</option>
              <option value="Insucesso">Insucessos / Devoluções</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Data Início</label>
            <input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Data Fim</label>
            <input
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        {/* Resumo Executivo / KPIs */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold block">Total de Paradas</span>
            <strong className="text-xl font-black text-slate-900">{totalParadas}</strong>
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
            <span className="text-[11px] text-emerald-700 font-semibold block">Entregues</span>
            <strong className="text-xl font-black text-emerald-900">{totalEntregues}</strong>
            <span className="text-[10px] text-emerald-600 font-bold ml-1.5">({taxaSucesso}%)</span>
          </div>

          <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200">
            <span className="text-[11px] text-amber-700 font-semibold block">Pendentes/Rota</span>
            <strong className="text-xl font-black text-amber-900">{totalPendentes}</strong>
          </div>

          <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-200">
            <span className="text-[11px] text-rose-700 font-semibold block">Insucessos</span>
            <strong className="text-xl font-black text-rose-900">{totalInsucessos}</strong>
          </div>

          <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-200">
            <span className="text-[11px] text-blue-700 font-semibold block">KM / Combustível</span>
            <strong className="text-base font-black text-blue-950 block">{kmTotal.toFixed(1)} km</strong>
            <span className="text-[10px] text-blue-700">{combustivelTotalL.toFixed(1)} L</span>
          </div>

          <div className="bg-purple-50/70 p-3 rounded-2xl border border-purple-200">
            <span className="text-[11px] text-purple-700 font-semibold block">Custo Operacional</span>
            <strong className="text-base font-black text-purple-950 block">R$ {custoTotal.toFixed(2)}</strong>
            <span className="text-[10px] text-purple-600 font-medium">Diárias + Comb.</span>
          </div>
        </div>

        {/* Tabela de Paradas e Status */}
        <div className="mt-5 border border-slate-200 rounded-2xl overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 bg-opacity-95 backdrop-blur-xs">
              <tr>
                <th className="py-2.5 px-3">Rota</th>
                <th className="py-2.5 px-3">Destinatário / Cliente</th>
                <th className="py-2.5 px-3">Endereço</th>
                <th className="py-2.5 px-3">Região</th>
                <th className="py-2.5 px-3">Material</th>
                <th className="py-2.5 px-3">Motoboy</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">POD / Assinatura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paradasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    Nenhuma entrega encontrada para os filtros aplicados.
                  </td>
                </tr>
              ) : (
                paradasFiltradas.map((p) => {
                  const regConfig = REGIOES_CONFIG[p.regiao as RegiaoRota] || { badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {p.rotaCodigo}
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">{p.nomeDestinatario}</p>
                        <p className="text-[10px] text-slate-500">{p.clienteNome} • {p.telefone}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="truncate max-w-[200px]">{p.enderecoCompleto}, {p.numeroComplemento}</p>
                        <p className="text-[10px] text-slate-400">{p.bairro} - {p.municipio}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${regConfig.badgeClass}`}>
                          {p.regiao}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-800">{p.quantidadeMaterial}x</span>{' '}
                        <span className="text-slate-500">{p.tipoMaterial}</span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">
                        {p.motoboyNome}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'Entregue'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'Em rota'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[10px]">
                        {p.comprovantePOD ? (
                          <div className="font-mono text-emerald-700 font-bold">
                            ✓ {p.comprovantePOD.hashSha256?.slice(0, 12)}...
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pendente</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé Oficial para Impressão */}
        <div className="mt-4 pt-4 border-t border-slate-200 text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>Relatório gerado em: {new Date().toLocaleString('pt-BR')} • Sistema FleetMoto Logística Eleitoral</span>
          <span className="font-mono">Auditoria TSE: CONFORME LEI 9.504/97</span>
        </div>
      </div>
    </div>
  );
};
