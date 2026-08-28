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
} from 'lucide-react';
import { RotaCliente, PontoEntregaRota, RegiaoRota } from '../../types';
import { REGIOES_CONFIG } from '../../utils/geoRegions';

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
    window.print();
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
      <div className="bg-white rounded-3xl max-w-6xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 relative my-6 animate-in fade-in zoom-in-95 duration-150 print:p-0 print:border-none print:shadow-none">
        {/* Header do Relatório */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 print:pb-2">
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

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#E05328] hover:bg-[#c9451e] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filtros Analíticos */}
        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs print:hidden">
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
              <option value="Niterói / São Gonçalo">Niterói / São Gonçalo (Roxo)</option>
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
              <option value="Entregue">Apenas Entregues (POD)</option>
              <option value="Pendente">Apenas Pendentes / Rota</option>
              <option value="Insucesso">Ocorrências / Não entregues</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Data Início</label>
            <input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Data Fim</label>
            <input
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-[11px]"
            />
          </div>
        </div>

        {/* Métricas e KPIs Consolidados */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Total Paradas</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalParadas}</p>
            <p className="text-[10px] text-slate-400 font-medium">{rotasFiltradasUnicas.length} rotas geradas</p>
          </div>

          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
            <p className="text-[10px] font-bold text-emerald-800 uppercase">Entregues (POD)</p>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{totalEntregues}</p>
            <p className="text-[10px] text-emerald-600 font-bold">{taxaSucesso}% de eficácia</p>
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
            <p className="text-[10px] font-bold text-amber-800 uppercase">Pendentes / Rota</p>
            <p className="text-xl font-black text-amber-700 mt-0.5">{totalPendentes}</p>
            <p className="text-[10px] text-amber-600 font-medium">Em processamento</p>
          </div>

          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
            <p className="text-[10px] font-bold text-blue-800 uppercase">Quilometragem</p>
            <p className="text-xl font-black text-blue-700 mt-0.5">{kmTotal} km</p>
            <p className="text-[10px] text-blue-600 font-medium">~{Math.round(tempoTotalMin / 60)}h percurso</p>
          </div>

          <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200">
            <p className="text-[10px] font-bold text-purple-800 uppercase">Combustível</p>
            <p className="text-xl font-black text-purple-700 mt-0.5">{combustivelTotalL} L</p>
            <p className="text-[10px] text-purple-600 font-medium">R$ {custoCombustivel.toFixed(2)}</p>
          </div>

          <div className="p-3 bg-orange-50 rounded-2xl border border-orange-200">
            <p className="text-[10px] font-bold text-orange-800 uppercase">Custos Totais</p>
            <p className="text-xl font-black text-orange-700 mt-0.5">R$ {custoTotal.toFixed(2)}</p>
            <p className="text-[10px] text-orange-600 font-medium">Diárias + Combustível</p>
          </div>
        </div>

        {/* Tabela Detalhada */}
        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
              <tr>
                <th className="py-3 px-3">Rota</th>
                <th className="py-3 px-3">Cliente / Destinatário</th>
                <th className="py-3 px-3">Endereço & Bairro</th>
                <th className="py-3 px-3">Região</th>
                <th className="py-3 px-3">Material</th>
                <th className="py-3 px-3">Motoboy</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">POD TSE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paradasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    Nenhum registro encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                paradasFiltradas.map((p, idx) => {
                  const regConfig = REGIOES_CONFIG[p.regiao] || REGIOES_CONFIG['Zona Norte'];
                  return (
                    <tr key={`${p.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-[11px]">
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
