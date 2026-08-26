import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Bike,
  ShieldCheck,
  Star,
  Phone,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Motoboy, StatusMotoboy, TipoFrota, StatusAdesivagem } from '../types';
import {
  formatCurrency,
  formatPhone,
  getStatusBadgeClass,
} from '../utils/formatters';

interface MotoboysViewProps {
  motoboys: Motoboy[];
  onAddMotoboy: (motoboy: Omit<Motoboy, 'id' | 'totalEntregas' | 'avaliacao' | 'taxaPontualidade' | 'dataCadastro'>) => void;
  onUpdateMotoboy: (motoboy: Motoboy) => void;
  onDeleteMotoboy: (id: string) => void;
}

export const MotoboysView: React.FC<MotoboysViewProps> = ({
  motoboys,
  onAddMotoboy,
  onUpdateMotoboy,
  onDeleteMotoboy,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    cnh: '',
    cnhCategoria: 'A',
    validadeCnh: '2028-12-31',
    telefone: '',
    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    placaMoto: '',
    modeloMoto: 'Honda CG 160 Fan',
    anoMoto: '2024',
    capacidadeBau: '135 Litros',
    tipoFrota: 'propria' as TipoFrota,
    status: 'disponivel' as StatusMotoboy,
    statusAdesivagem: 'pendente' as StatusAdesivagem,
    partidoAdesivado: '',
    zonaPreferencial: 'Zona Sul / Centro',
    valorDiaria: 180,
    pix: '',
  });

  const filteredMotoboys = motoboys.filter((m) => {
    const matchesSearch =
      m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.placaMoto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.cnh.includes(searchTerm) ||
      m.telefone.includes(searchTerm);
    const matchesStatus = statusFilter === 'todos' ? true : m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.placaMoto) {
      alert('Preencha os campos obrigatórios.');
      return;
    }
    onAddMotoboy(formData);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Cadastro de Motoboys Credenciados
          </h2>
          <p className="text-xs text-slate-500">
            Controle de habilitação CNH, placas, frotas e diárias da campanha eleitoral
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#E05328] hover:bg-orange-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Cadastrar Motoboy</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, placa ou CNH..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E05328]/30"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-[#E05328]/30"
        >
          <option value="todos">Status: Todos</option>
          <option value="disponivel">Disponível</option>
          <option value="em_rota">Em Rota</option>
          <option value="folga">Folga</option>
        </select>
      </div>

      {/* Motoboys Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMotoboys.map((moto) => {
          const statusStyle = getStatusBadgeClass(moto.status);

          return (
            <div
              key={moto.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Profile Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={moto.fotoUrl}
                      alt={moto.nome}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200 shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {moto.nome}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        CNH: {moto.cnh} ({moto.cnhCategoria})
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusStyle.bg} ${statusStyle.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                    <span className="capitalize">{moto.status.replace('_', ' ')}</span>
                  </span>
                </div>

                {/* Motorcycle & Fleet Details */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Bike className="w-3.5 h-3.5 text-orange-600" />
                      {moto.modeloMoto} ({moto.anoMoto})
                    </span>
                    <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                      {moto.placaMoto}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Baú: <strong>{moto.capacidadeBau}</strong></span>
                    <span className="capitalize text-slate-700 font-semibold">
                      Frota {moto.tipoFrota}
                    </span>
                  </div>
                </div>

                {/* Performance & Payouts */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3 pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Diária</p>
                    <p className="font-black text-slate-900 mt-0.5">{formatCurrency(moto.valorDiaria)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Entregas</p>
                    <p className="font-black text-emerald-700 mt-0.5">{moto.totalEntregas}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Pontual</p>
                    <p className="font-black text-blue-700 mt-0.5">{moto.taxaPontualidade}%</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <a
                  href={`https://wa.me/55${moto.telefone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {moto.telefone}
                </a>

                <button
                  onClick={() => onDeleteMotoboy(moto.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remover motoboy"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Novo Motoboy */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative my-8 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Cadastrar Novo Motoboy
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Wellington Costa"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CNH (Número) *</label>
                  <input
                    type="text"
                    required
                    value={formData.cnh}
                    onChange={(e) => setFormData({ ...formData, cnh: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Placa da Moto *</label>
                  <input
                    type="text"
                    required
                    placeholder="ABC-1234"
                    value={formData.placaMoto}
                    onChange={(e) => setFormData({ ...formData, placaMoto: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Frota</label>
                  <select
                    value={formData.tipoFrota}
                    onChange={(e) => setFormData({ ...formData, tipoFrota: e.target.value as TipoFrota })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="propria">Própria</option>
                    <option value="alugada">Alugada</option>
                    <option value="terceirizada">Terceirizada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor da Diária (R$)</label>
                  <input
                    type="number"
                    value={formData.valorDiaria}
                    onChange={(e) => setFormData({ ...formData, valorDiaria: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chave PIX</label>
                  <input
                    type="text"
                    placeholder="CPF, E-mail ou Telefone"
                    value={formData.pix}
                    onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#E05328] hover:bg-orange-700 rounded-xl shadow-sm"
                >
                  Salvar Motoboy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
