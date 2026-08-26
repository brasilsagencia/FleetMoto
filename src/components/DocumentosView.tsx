import React, { useState } from 'react';
import { FileCheck, FileText, Download, Upload, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { DocumentoEleitoral } from '../types';
import { formatDate, getStatusBadgeClass } from '../utils/formatters';

interface DocumentosViewProps {
  documentos: DocumentoEleitoral[];
}

export const DocumentosView: React.FC<DocumentosViewProps> = ({ documentos }) => {
  const [filterCategory, setFilterCategory] = useState('todos');

  const filteredDocs = documentos.filter((d) =>
    filterCategory === 'todos' ? true : d.categoria === filterCategory
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Controle de Documentos, Contratos & Licenças Eleitorais
          </h2>
          <p className="text-xs text-slate-500">
            Autorizações TSE para circulação de materiais, CNHs, CRLVs e notas fiscais de serviço
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold"
        >
          <option value="todos">Categorias: Todas</option>
          <option value="autorizacao_tse">Autorizações TSE</option>
          <option value="termo_prestacao">Contratos de Prestação</option>
          <option value="cnh">CNHs dos Motoboys</option>
          <option value="documento_veiculo">Documentos Veiculares (CRLV)</option>
          <option value="nota_fiscal_servico">Notas Fiscais de Serviço</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Documento / Título</th>
              <th className="py-3 px-4">Categoria</th>
              <th className="py-3 px-4">Entidade Vinculada</th>
              <th className="py-3 px-4">Registro / Validade</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDocs.map((doc) => {
              const statusStyle = getStatusBadgeClass(doc.status);

              return (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-orange-600 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{doc.titulo}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{doc.arquivoNome} ({doc.tamanho})</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[11px] font-semibold text-slate-700 capitalize">
                      {doc.categoria.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    {doc.entidadeNome}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-[11px] text-slate-800">
                      {doc.numeroRegistro || '-'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Validade: {doc.dataValidade ? formatDate(doc.dataValidade) : 'Indeterminada'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyle.bg} ${statusStyle.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      <span className="capitalize">{doc.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert(`Baixando arquivo seguro: ${doc.arquivoNome}`)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
