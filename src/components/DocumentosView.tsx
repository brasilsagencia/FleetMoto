import React, { useState } from 'react';
import {
  FileCheck,
  FileText,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  Eye,
  X,
  QrCode,
  Building2,
  Calendar,
  Search,
  Filter,
  Check
} from 'lucide-react';
import { DocumentoEleitoral } from '../types';
import { formatDate, getStatusBadgeClass } from '../utils/formatters';
import { printElementById } from '../utils/printHelper';

interface DocumentosViewProps {
  documentos: DocumentoEleitoral[];
}

export const DocumentosView: React.FC<DocumentosViewProps> = ({ documentos }) => {
  const [filterCategory, setFilterCategory] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentoEleitoral | null>(null);

  const filteredDocs = documentos.filter((d) => {
    const matchesCategory = filterCategory === 'todos' ? true : d.categoria === filterCategory;
    const matchesSearch =
      d.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.entidadeNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.numeroRegistro && d.numeroRegistro.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleDownloadDoc = (doc: DocumentoEleitoral) => {
    const content = `=====================================================
FLEETMOTO LOGÍSTICA ELEITORAL 2026
COMPROVANTE OFICIAL DE DOCUMENTO ELEITORAL
=====================================================
Título: ${doc.titulo}
Categoria: ${doc.categoria.toUpperCase()}
Entidade Vinculada: ${doc.entidadeNome}
Tipo de Entidade: ${doc.entidadeTipo.toUpperCase()}
Número de Registro: ${doc.numeroRegistro || 'NÃO INFORMADO'}
Data de Emissão: ${formatDate(doc.dataEmissao)}
Data de Validade: ${doc.dataValidade ? formatDate(doc.dataValidade) : 'INDETERMINADA'}
Status de Conformidade: ${doc.status.toUpperCase()}
Arquivo Associado: ${doc.arquivoNome} (${doc.tamanho})
Código de Autenticidade: HASH-TSE-${doc.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}
Base Legal: Resolução TSE nº 23.610/2019
=====================================================
Emitido eletronicamente pela plataforma FleetMoto Logística.`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.arquivoNome.replace(/\.[^/.]+$/, '')}_comprovante.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold focus:ring-2 focus:ring-[#E05328] focus:border-transparent outline-none"
          >
            <option value="todos">Categorias: Todas</option>
            <option value="autorizacao_tse">Autorizações TSE</option>
            <option value="termo_prestacao">Contratos de Prestação</option>
            <option value="cnh">CNHs dos Motoboys</option>
            <option value="documento_veiculo">Documentos Veiculares (CRLV)</option>
            <option value="nota_fiscal_servico">Notas Fiscais de Serviço</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, entidade ou registro..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-[#E05328] focus:border-transparent outline-none"
          />
        </div>
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
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                  Nenhum documento encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => {
                const statusStyle = getStatusBadgeClass(doc.status);

                return (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-orange-600 shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{doc.titulo}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {doc.arquivoNome} ({doc.tamanho})
                          </p>
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
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          id={`btn-imprimir-doc-${doc.id}`}
                          onClick={() => setSelectedDoc(doc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold transition-colors cursor-pointer"
                          title="Visualizar e Imprimir Documento"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir</span>
                        </button>
                        <button
                          id={`btn-download-doc-${doc.id}`}
                          onClick={() => handleDownloadDoc(doc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                          title="Baixar comprovante de conformidade"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Download</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: VISUALIZAR E IMPRIMIR DOCUMENTO ELEITORAL                         */}
      {/* ========================================================================= */}
      {selectedDoc && (
        <div
          id="modal-doc-eleitoral-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        >
          <div
            id="modal-doc-eleitoral-card"
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Controls (Hidden during print) */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Documento Oficial de Conformidade Eleitoral
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-modal-imprimir-doc-acao"
                  onClick={() =>
                    printElementById('area-impressao-doc-eleitoral', {
                      title: `Documento_${selectedDoc.categoria}_${selectedDoc.numeroRegistro || selectedDoc.id}`
                    })
                  }
                  className="px-4 py-2 bg-[#E05328] hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Documento</span>
                </button>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div
              id="area-impressao-doc-eleitoral"
              className="border border-slate-300 p-8 rounded-2xl space-y-6 text-slate-800 text-xs bg-white printable-area"
            >
              {/* Document Official Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg text-slate-900 tracking-tight">
                      FLEETMOTO LOGÍSTICA ELEITORAL 2026
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-mono">
                      CERTIDÃO ELEITORAL
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold mt-0.5">
                    Sistema Integrado de Gestão e Auditoria de Materiais de Campanha
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Conformidade com a Resolução TSE nº 23.610/2019 e Lei nº 9.504/1997
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-bold text-slate-900 block">
                    {selectedDoc.numeroRegistro || `REG-${selectedDoc.id.slice(0, 8).toUpperCase()}`}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Emissão: {formatDate(selectedDoc.dataEmissao)}
                  </span>
                </div>
              </div>

              {/* Title and Identification */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 block">
                      {selectedDoc.categoria.replace(/_/g, ' ')}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">
                      {selectedDoc.titulo}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                      Status: {selectedDoc.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Entidade / Titular Vinculado
                  </span>
                  <p className="text-sm font-bold text-slate-900">{selectedDoc.entidadeNome}</p>
                  <p className="text-xs text-slate-600 capitalize">
                    Tipo de Cadastro: {selectedDoc.entidadeTipo}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">ID: {selectedDoc.entidadeId}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Validade & Arquivo Digital
                  </span>
                  <p className="text-xs text-slate-700">
                    <span className="font-bold">Data de Validade:</span>{' '}
                    {selectedDoc.dataValidade ? formatDate(selectedDoc.dataValidade) : 'Indeterminada / Permanente'}
                  </p>
                  <p className="text-xs text-slate-700">
                    <span className="font-bold">Arquivo Associado:</span> {selectedDoc.arquivoNome}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">Tamanho: {selectedDoc.tamanho}</p>
                </div>
              </div>

              {/* Legal Text */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2 text-[11px] text-slate-700 leading-relaxed bg-white">
                <h4 className="font-bold text-slate-900 uppercase text-xs">
                  Declaração de Validação e Regularidade Operacional
                </h4>
                <p>
                  Certifica-se para os devidos fins de direito e comprovação perante a Justiça Eleitoral (TSE / TRE)
                  que o documento acima qualificado encontra-se devidamente registrado, validado e arquivado nos
                  registros da operação logística FleetMoto.
                </p>
                <p>
                  O presente comprovante atesta a legalidade dos atos de armazenagem, manuseio, transporte e entrega de
                  materiais eleitorais conforme as normas de prestação de contas de campanha e as regras de
                  rastreabilidade por geolocalização e assinatura digital.
                </p>
              </div>

              {/* Signatures and Hash */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 pb-1 mb-1 font-medium text-slate-800">
                    Auditoria & Conformidade Regulatória FleetMoto
                  </div>
                  <span className="text-[10px] text-slate-500">Responsável Técnico / Emissor</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-1 mb-1 font-medium text-slate-800">
                    {selectedDoc.entidadeNome}
                  </div>
                  <span className="text-[10px] text-slate-500">Titular / Representante Legal</span>
                </div>
              </div>

              {/* Authenticity Hash Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>AUTENTICAÇÃO: HASH-TSE-{selectedDoc.id.toUpperCase()}-{Date.now().toString(36).toUpperCase()}</span>
                <span>VERIFICADO VIA FLEETMOTO AUDIT SYSTEM</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between print:hidden pt-2">
              <button
                type="button"
                onClick={() => handleDownloadDoc(selectedDoc)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download do Arquivo</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  id="btn-imprimir-doc-footer"
                  onClick={() =>
                    printElementById('area-impressao-doc-eleitoral', {
                      title: `Documento_${selectedDoc.categoria}_${selectedDoc.numeroRegistro || selectedDoc.id}`
                    })
                  }
                  className="px-5 py-2 text-xs font-bold bg-[#E05328] hover:bg-orange-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Documento</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
