import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Calendar, 
  UserCheck, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  FileText,
  Clock,
  Download,
  History,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { LogAuditoriaDoc } from '../models/firebase.types';

interface AuditoriaViewProps {
  logs: LogAuditoriaDoc[];
  onRefresh?: () => void;
}

const DEFAULT_AUDIT_LOGS: LogAuditoriaDoc[] = [
  {
    id: 'log-seed-1',
    acao: 'CREATE',
    colecao: 'clientes',
    documentoId: 'com-1',
    usuarioId: 'usr-1',
    usuarioNome: 'Roberto Silveira',
    usuarioEmail: 'roberto.silveira@campanha2026.com.br',
    usuarioRole: 'administrador' as any,
    detalhes: 'Cadastrou o cliente Comitê Central Pinheiros (Dra. Mariana Costa / PSD) com data agendada para 2026-09-01 às 14:00',
    dadosNovos: { candidato: 'Dra. Mariana Costa', partido: 'PSD', dataAgendada: '2026-09-01', horarioAgendado: '14:00' },
    ipOrigem: '187.54.210.12',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    isDeleted: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'log-seed-2',
    acao: 'STATUS_CHANGE',
    colecao: 'pedidos',
    documentoId: 'ped-1',
    usuarioId: 'usr-2',
    usuarioNome: 'Luciana Mendonça',
    usuarioEmail: 'luciana.operacoes@fleetmoto.com.br',
    usuarioRole: 'gestor' as any,
    detalhes: 'Alterou status do Pedido #PED-2026-000101 de "solicitado" para "em_separacao" na Expedição',
    dadosAnteriores: { status: 'solicitado' },
    dadosNovos: { status: 'em_separacao' },
    ipOrigem: '187.54.210.15',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    isDeleted: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'log-seed-3',
    acao: 'UPDATE',
    colecao: 'entregas',
    documentoId: 'ent-1',
    usuarioId: 'usr-2',
    usuarioNome: 'Luciana Mendonça',
    usuarioEmail: 'luciana.operacoes@fleetmoto.com.br',
    usuarioRole: 'gestor' as any,
    detalhes: 'Atribuiu o motoboy Carlos Eduardo Santos (Placa: ABC-1234) para rota de entrega urgente em Pinheiros',
    dadosNovos: { motoboyId: 'mb-1', motoboyNome: 'Carlos Eduardo Santos', status: 'em_transito' },
    ipOrigem: '187.54.210.15',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    isDeleted: false,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'log-seed-4',
    acao: 'CREATE',
    colecao: 'estoque',
    documentoId: 'mat-1',
    usuarioId: 'usr-1',
    usuarioNome: 'Roberto Silveira',
    usuarioEmail: 'roberto.silveira@campanha2026.com.br',
    usuarioRole: 'administrador' as any,
    detalhes: 'Registrou entrada de lote de 15.000 un de Perfurado para Vidro Traseiro (NF-9082)',
    dadosNovos: { quantidade: 15000, tipo: 'entrada', notaFiscal: 'NF-9082' },
    ipOrigem: '187.54.210.12',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    isDeleted: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'log-seed-5',
    acao: 'STATUS_CHANGE',
    colecao: 'entregas',
    documentoId: 'ent-3',
    usuarioId: 'usr-4',
    usuarioNome: 'Carlos Eduardo Santos',
    usuarioEmail: 'carlos.santos@motoboys.com.br',
    usuarioRole: 'motoboy' as any,
    detalhes: 'Concluiu entrega com Comprovante Digital (POD) assinado e foto de recebimento no Comitê Butantã',
    dadosNovos: { status: 'entregue', podValidado: true, recebidoPor: 'Juliana Paes' },
    ipOrigem: 'Mobile 4G (São Paulo)',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    isDeleted: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export const AuditoriaView: React.FC<AuditoriaViewProps> = ({ logs = [], onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColecao, setSelectedColecao] = useState('todas');
  const [selectedAcao, setSelectedAcao] = useState('todas');
  const [periodoFilter, setPeriodoFilter] = useState<'todos' | 'hoje' | '7dias' | '30dias'>('todos');
  const [selectedLog, setSelectedLog] = useState<LogAuditoriaDoc | null>(null);

  // Combine live logs with default audit logs if empty
  const allLogs = useMemo(() => {
    if (logs && logs.length > 0) return logs;
    return DEFAULT_AUDIT_LOGS;
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        (log.usuarioNome || '').toLowerCase().includes(q) ||
        (log.usuarioEmail || '').toLowerCase().includes(q) ||
        (log.detalhes || '').toLowerCase().includes(q) ||
        (log.documentoId || '').toLowerCase().includes(q) ||
        (log.colecao || '').toLowerCase().includes(q) ||
        (log.ipOrigem || '').toLowerCase().includes(q);

      const matchColecao = selectedColecao === 'todas' || log.colecao === selectedColecao;
      const matchAcao = selectedAcao === 'todas' || log.acao === selectedAcao;

      // Period filter
      let matchPeriodo = true;
      if (periodoFilter !== 'todos') {
        const logDate = new Date(log.timestamp || log.createdAt);
        const now = new Date();
        if (periodoFilter === 'hoje') {
          matchPeriodo = logDate.toDateString() === now.toDateString();
        } else if (periodoFilter === '7dias') {
          matchPeriodo = now.getTime() - logDate.getTime() <= 7 * 86400000;
        } else if (periodoFilter === '30dias') {
          matchPeriodo = now.getTime() - logDate.getTime() <= 30 * 86400000;
        }
      }

      return matchSearch && matchColecao && matchAcao && matchPeriodo;
    });
  }, [allLogs, searchTerm, selectedColecao, selectedAcao, periodoFilter]);

  const getAcaoBadge = (acao: string) => {
    switch (acao) {
      case 'CREATE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            CRIAÇÃO
          </span>
        );
      case 'UPDATE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            ATUALIZAÇÃO
          </span>
        );
      case 'DELETE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            EXCLUSÃO LÓGICA
          </span>
        );
      case 'STATUS_CHANGE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            STATUS
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
            {acao}
          </span>
        );
    }
  };

  const handleExportCSV = () => {
    const headers = ['Data/Hora', 'Ação', 'Coleção', 'ID Documento', 'Operador', 'Email', 'Cargo', 'Detalhes', 'IP'];
    const rows = filteredLogs.map((l) => [
      `"${new Date(l.timestamp || l.createdAt).toLocaleString('pt-BR')}"`,
      `"${l.acao}"`,
      `"${l.colecao}"`,
      `"${l.documentoId}"`,
      `"${l.usuarioNome || ''}"`,
      `"${l.usuarioEmail || ''}"`,
      `"${l.usuarioRole || ''}"`,
      `"${(l.detalhes || '').replace(/"/g, '""')}"`,
      `"${l.ipOrigem || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historico_auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-[#E05328] flex items-center justify-center shrink-0 border border-orange-200 shadow-xs">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Histórico Completo & Logs de Auditoria</h2>
            <p className="text-xs text-slate-500">
              Rastreamento imutável de todas as ações, modificações e operações no sistema FleetMoto
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Exportar registros filtrados em formato CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar</span>
            </button>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{filteredLogs.length} Registros</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por usuário, documento, detalhe, IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328]"
            />
          </div>

          <div>
            <select
              value={selectedColecao}
              onChange={(e) => setSelectedColecao(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328]"
            >
              <option value="todas">Todas as Coleções</option>
              <option value="clientes">Clientes / Comitês</option>
              <option value="pedidos">Pedidos</option>
              <option value="entregas">Entregas & Rotas</option>
              <option value="estoque">Estoque & Materiais</option>
              <option value="expedicao">Expedição</option>
              <option value="motoboys">Motoboys</option>
              <option value="veiculos">Veículos</option>
              <option value="pagamentos">Financeiro</option>
              <option value="usuarios">Usuários</option>
            </select>
          </div>

          <div>
            <select
              value={selectedAcao}
              onChange={(e) => setSelectedAcao(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328]"
            >
              <option value="todas">Todas as Ações</option>
              <option value="CREATE">Criação (CREATE)</option>
              <option value="UPDATE">Atualização (UPDATE)</option>
              <option value="DELETE">Exclusão Lógica (DELETE)</option>
              <option value="STATUS_CHANGE">Mudança de Status</option>
            </select>
          </div>
        </div>

        {/* Quick Period Filter */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Período:</span>
          </span>
          <button
            onClick={() => setPeriodoFilter('todos')}
            className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
              periodoFilter === 'todos' ? 'bg-[#E05328] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos os Registros
          </button>
          <button
            onClick={() => setPeriodoFilter('hoje')}
            className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
              periodoFilter === 'hoje' ? 'bg-[#E05328] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setPeriodoFilter('7dias')}
            className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
              periodoFilter === '7dias' ? 'bg-[#E05328] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Últimos 7 dias
          </button>
          <button
            onClick={() => setPeriodoFilter('30dias')}
            className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
              periodoFilter === '30dias' ? 'bg-[#E05328] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Últimos 30 dias
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Ação</th>
                <th className="py-3 px-4">Coleção / Documento</th>
                <th className="py-3 px-4">Operador Responsável</th>
                <th className="py-3 px-4">Descrição da Alteração</th>
                <th className="py-3 px-4 text-center">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                    <History className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-600 text-sm">Nenhum registro encontrado no histórico</p>
                    <p className="text-xs text-slate-400">Tente ajustar os filtros de busca ou período selecionado.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(log.timestamp || log.createdAt).toLocaleString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getAcaoBadge(log.acao)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 uppercase">{log.colecao}</span>
                      <span className="block text-[10px] font-mono text-slate-400">ID: {log.documentoId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{log.usuarioNome || 'Sistema'}</div>
                      <div className="text-[10px] text-slate-400">{log.usuarioEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={log.detalhes}>
                      {log.detalhes}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors cursor-pointer"
                      >
                        Visualizar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#E05328]" />
                <h3 className="font-bold text-slate-900 text-base">Detalhes do Registro de Histórico & Auditoria</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Coleção</span>
                  <span className="font-semibold text-slate-800">{selectedLog.colecao}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Ação</span>
                  <span className="font-semibold text-slate-800">{selectedLog.acao}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">ID do Documento</span>
                  <span className="font-mono text-slate-800">{selectedLog.documentoId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Data e Hora</span>
                  <span className="font-mono text-slate-800">{new Date(selectedLog.timestamp || selectedLog.createdAt).toLocaleString('pt-BR')}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">Operador:</span>
                <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {selectedLog.usuarioNome} ({selectedLog.usuarioEmail}) - Perfil: {selectedLog.usuarioRole}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">Descrição:</span>
                <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {selectedLog.detalhes}
                </p>
              </div>

              {selectedLog.ipOrigem && (
                <div>
                  <span className="text-slate-500 font-bold block mb-1">Origem / IP:</span>
                  <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[11px]">
                    {selectedLog.ipOrigem}
                  </p>
                </div>
              )}

              {selectedLog.dadosNovos && (
                <div>
                  <span className="text-slate-500 font-bold block mb-1">Payload Gravado no Firestore:</span>
                  <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl overflow-x-auto text-[11px] font-mono">
                    {JSON.stringify(selectedLog.dadosNovos, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

