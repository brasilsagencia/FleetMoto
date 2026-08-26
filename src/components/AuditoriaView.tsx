import React, { useState } from 'react';
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
  Clock
} from 'lucide-react';
import { LogAuditoriaDoc } from '../models/firebase.types';

interface AuditoriaViewProps {
  logs: LogAuditoriaDoc[];
  onRefresh?: () => void;
}

export const AuditoriaView: React.FC<AuditoriaViewProps> = ({ logs, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColecao, setSelectedColecao] = useState('todas');
  const [selectedAcao, setSelectedAcao] = useState('todas');
  const [selectedLog, setSelectedLog] = useState<LogAuditoriaDoc | null>(null);

  const filteredLogs = logs.filter(log => {
    const matchSearch = 
      (log.usuarioNome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.usuarioEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.detalhes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.documentoId || '').includes(searchTerm);
    
    const matchColecao = selectedColecao === 'todas' || log.colecao === selectedColecao;
    const matchAcao = selectedAcao === 'todas' || log.acao === selectedAcao;

    return matchSearch && matchColecao && matchAcao;
  });

  const getAcaoBadge = (acao: string) => {
    switch (acao) {
      case 'CREATE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">CRIAÇÃO</span>;
      case 'UPDATE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">ATUALIZAÇÃO</span>;
      case 'DELETE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">EXCLUSÃO LÓGICA</span>;
      case 'STATUS_CHANGE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">STATUS</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">{acao}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-[#E05328] flex items-center justify-center shrink-0 border border-orange-200 shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Logs de Auditoria e Conformidade</h2>
            <p className="text-xs text-slate-500">
              Rastreamento imutável de todas as transações, modificações e exclusões no Cloud Firestore
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar</span>
            </button>
          )}
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{logs.length} Registros Auditados</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrar por usuário, ID ou detalhe..."
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
            <option value="entregas">Entregas</option>
            <option value="motoboys">Motoboys</option>
            <option value="veiculos">Veículos</option>
            <option value="pagamentos">Pagamentos</option>
            <option value="adesivos">Adesivos</option>
            <option value="documentos">Documentos</option>
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
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum log de auditoria encontrado para os filtros selecionados.
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
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {log.detalhes}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
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
                <h3 className="font-bold text-slate-900 text-base">Detalhes do Registro de Auditoria</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
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
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
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
