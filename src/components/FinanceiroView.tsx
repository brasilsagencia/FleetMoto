import React, { useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, DollarSign, CheckCircle2, Clock, Download, Plus } from 'lucide-react';
import { TransacaoFinanceira } from '../types';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../utils/formatters';

interface FinanceiroViewProps {
  transacoes: TransacaoFinanceira[];
}

export const FinanceiroView: React.FC<FinanceiroViewProps> = ({ transacoes }) => {
  const [filterTipo, setFilterTipo] = useState('todos');

  const totalFaturado = transacoes
    .filter((t) => t.tipo === 'faturamento_comite')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const totalRepasses = transacoes
    .filter((t) => t.tipo === 'repasse_motoboy' || t.tipo === 'taxa_adesivagem')
    .reduce((acc, curr) => acc + curr.valor, 0);

  const saldoOperacional = totalFaturado - totalRepasses;

  const filteredTransacoes = transacoes.filter((t) =>
    filterTipo === 'todos' ? true : t.tipo === filterTipo
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Controle Financeiro de Rotas & Repasses
          </h2>
          <p className="text-xs text-slate-500">
            Faturamento direto por CNPJ de campanha e liquidação de diárias de motoboys
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Faturamento Comitês</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2 font-sans">
            {formatCurrency(totalFaturado)}
          </h3>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            Recebimento via boleto e transferências eleitorais
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Repasses a Motoboys</span>
            <ArrowDownLeft className="w-4 h-4 text-orange-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2 font-sans">
            {formatCurrency(totalRepasses)}
          </h3>
          <p className="text-[11px] text-orange-600 font-medium mt-1">
            Diárias de campo + bônus de adesivagem PIX
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Margem Operacional</span>
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-2xl font-black text-blue-700 mt-2 font-sans">
            {formatCurrency(saldoOperacional)}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Balanço consolidado da operação
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Extrato de Lançamentos & Pagamentos
          </h3>

          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold"
          >
            <option value="todos">Todos os lançamentos</option>
            <option value="faturamento_comite">Faturamento Comitê</option>
            <option value="repasse_motoboy">Repasse Motoboy</option>
            <option value="taxa_adesivagem">Bônus Adesivagem</option>
          </select>
        </div>

        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Descrição</th>
              <th className="py-3 px-4">Entidade / Beneficiário</th>
              <th className="py-3 px-4">Método</th>
              <th className="py-3 px-4">Vencimento / Data</th>
              <th className="py-3 px-4 text-right">Valor</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransacoes.map((t) => {
              const statusStyle = getStatusBadgeClass(t.status);
              const isReceita = t.tipo === 'faturamento_comite';

              return (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900 text-xs">{t.descricao}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{t.tipo.replace(/_/g, ' ')}</p>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {t.entidadeNome}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      {t.metodoPagamento}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {formatDate(t.dataVencimento)}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-sm">
                    <span className={isReceita ? 'text-emerald-700' : 'text-slate-900'}>
                      {isReceita ? '+' : '-'} {formatCurrency(t.valor)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyle.bg} ${statusStyle.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      <span className="capitalize">{t.status}</span>
                    </span>
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
