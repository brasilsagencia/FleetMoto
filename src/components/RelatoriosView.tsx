import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  Package,
  FileCheck,
  Search,
} from 'lucide-react';
import { Entrega, Comite } from '../types';
import { formatCNPJ, formatNumber, formatCurrency, formatDate } from '../utils/formatters';

interface RelatoriosViewProps {
  entregas: Entrega[];
  comites: Comite[];
  onOpenPODModal: (entrega: Entrega) => void;
}

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({
  entregas,
  comites,
  onOpenPODModal,
}) => {
  const [selectedComiteId, setSelectedComiteId] = useState<string>('todos');

  const entregasComPOD = entregas.filter((e) => e.status === 'entregue' && e.comprovantePOD);

  const filteredEntregas = entregasComPOD.filter((e) =>
    selectedComiteId === 'todos' ? true : e.comiteId === selectedComiteId
  );

  const handleExportFullReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Dossiê de Prestação de Contas Eleitorais (TSE)
          </h2>
          <p className="text-xs text-slate-500">
            Geração de relatórios com comprovação de entrega (POD), assinaturas e georreferenciamento
          </p>
        </div>

        <button
          onClick={handleExportFullReport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir Dossiê Completo</span>
        </button>
      </div>

      {/* TSE Legal Notice Box */}
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-emerald-900">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-emerald-950">
            Conformidade com o SPCE / Sistema de Prestação de Contas Eleitorais
          </h4>
          <p className="mt-0.5 text-emerald-800">
            Este relatório consolida as despesas com transporte e distribuição física de material impresso (santinhos, praguinhas e bandeiras), cumprindo as exigências de comprovação material de gastos eleitorais perante a Justiça Eleitoral.
          </p>
        </div>
      </div>

      {/* Filter by Committee */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-bold text-slate-700">Filtrar por Comitê:</label>
        <select
          value={selectedComiteId}
          onChange={(e) => setSelectedComiteId(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold"
        >
          <option value="todos">Todos os Comitês Eleitorais</option>
          {comites.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome} ({formatCNPJ(c.cnpjCampanha)})
            </option>
          ))}
        </select>
      </div>

      {/* Entregas Prontas para TSE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEntregas.map((ent) => (
          <div
            key={ent.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                    {ent.codigoRastreio}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1.5">
                    {ent.comiteNome}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    CNPJ: {formatCNPJ(ent.cnpjCampanha)}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  POD Validado
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 mt-3 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Material Transportado:</span>
                  <strong className="text-slate-900">
                    {formatNumber(ent.quantidade)} {ent.unidadeMedida} ({ent.tipoMaterial})
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Recebedor no Local:</span>
                  <strong className="text-slate-900">
                    {ent.comprovantePOD?.nomeRecebedor}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>Data/Hora: {ent.comprovantePOD?.dataHora}</span>
                  <span>{ent.zonaEleitoral}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">
                Valor do Serviço: {formatCurrency(ent.valorFrete)}
              </span>

              <button
                onClick={() => onOpenPODModal(ent)}
                className="px-3 py-1.5 rounded-xl bg-[#E05328] hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Visualizar Comprovante Oficial</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
