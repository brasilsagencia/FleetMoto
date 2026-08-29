import React, { useState, useMemo } from 'react';
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
  AlertTriangle,
  X,
  Edit2,
  Trash2,
  Gauge,
  Layers,
  MapPin,
  Check,
  Calendar,
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
  const [frotaFilter, setFrotaFilter] = useState('todos');

  // Modal de Cadastro/Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMotoboy, setEditingMotoboy] = useState<Motoboy | null>(null);

  // Modal de Confirmação de Exclusão
  const [motoboyToDelete, setMotoboyToDelete] = useState<Motoboy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast / Notificação
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const initialFormState = {
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
  };

  const [formData, setFormData] = useState(initialFormState);

  const openAddModal = () => {
    setEditingMotoboy(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (moto: Motoboy) => {
    setEditingMotoboy(moto);
    setFormData({
      nome: moto.nome || '',
      cpf: moto.cpf || '',
      cnh: moto.cnh || '',
      cnhCategoria: moto.cnhCategoria || 'A',
      validadeCnh: moto.validadeCnh || '2028-12-31',
      telefone: moto.telefone || '',
      fotoUrl: moto.fotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      placaMoto: moto.placaMoto || '',
      modeloMoto: moto.modeloMoto || 'Honda CG 160 Fan',
      anoMoto: moto.anoMoto || '2024',
      capacidadeBau: moto.capacidadeBau || '135 Litros',
      tipoFrota: moto.tipoFrota || 'propria',
      status: moto.status || 'disponivel',
      statusAdesivagem: moto.statusAdesivagem || 'pendente',
      partidoAdesivado: moto.partidoAdesivado || '',
      zonaPreferencial: moto.zonaPreferencial || 'Zona Sul / Centro',
      valorDiaria: moto.valorDiaria || 180,
      pix: moto.pix || '',
    });
    setIsModalOpen(true);
  };

  // KPIs
  const stats = useMemo(() => {
    const total = motoboys.length;
    const disponiveis = motoboys.filter((m) => m.status === 'disponivel').length;
    const emRota = motoboys.filter((m) => m.status === 'em_rota').length;
    const totalEntregas = motoboys.reduce((acc, m) => acc + (m.totalEntregas || 0), 0);
    const mediaDiaria = total > 0 ? motoboys.reduce((acc, m) => acc + (m.valorDiaria || 0), 0) / total : 0;

    return { total, disponiveis, emRota, totalEntregas, mediaDiaria };
  }, [motoboys]);

  const filteredMotoboys = useMemo(() => {
    return motoboys.filter((m) => {
      const matchesSearch =
        m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.placaMoto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.cnh.includes(searchTerm) ||
        m.telefone.includes(searchTerm);
      const matchesStatus = statusFilter === 'todos' ? true : m.status === statusFilter;
      const matchesFrota = frotaFilter === 'todos' ? true : m.tipoFrota === frotaFilter;
      return matchesSearch && matchesStatus && matchesFrota;
    });
  }, [motoboys, searchTerm, statusFilter, frotaFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.placaMoto.trim()) {
      alert('Preencha os campos obrigatórios: Nome Completo e Placa da Moto.');
      return;
    }

    if (editingMotoboy) {
      onUpdateMotoboy({
        ...editingMotoboy,
        ...formData,
      });
      showToast(`Motoboy ${formData.nome} atualizado com sucesso!`);
    } else {
      onAddMotoboy(formData);
      showToast(`Motoboy ${formData.nome} cadastrado com sucesso!`);
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!motoboyToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteMotoboy(motoboyToDelete.id);
      showToast(`Motoboy ${motoboyToDelete.nome} excluído com sucesso.`);
      setMotoboyToDelete(null);
    } catch (err: any) {
      console.error('Erro ao excluir motoboy:', err);
      alert(`Erro ao excluir: ${err?.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-[#E05328]">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Cadastro de Motoboys Credenciados
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle operacional de CNH, documentação, frotas, adesivagem e diárias eleitorais
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#E05328] hover:bg-orange-700 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Motoboy</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Cadastrados</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Profissionais ativos</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold">
            <span>Disponíveis</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.disponiveis}</p>
          <p className="text-[10px] text-emerald-600 mt-0.5">Prontos para rotas</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-blue-600 font-semibold">
            <span>Em Rota Agora</span>
            <Bike className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-1">{stats.emRota}</p>
          <p className="text-[10px] text-blue-500 mt-0.5">Entregas em andamento</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-orange-600 font-semibold">
            <span>Diária Média</span>
            <CreditCard className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-[#E05328] mt-1">{formatCurrency(stats.mediaDiaria)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{stats.totalEntregas} entregas registradas</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, placa, CNH ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#E05328]/30 outline-hidden transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:ring-2 focus:ring-[#E05328]/30 outline-hidden font-medium"
          >
            <option value="todos">Status: Todos</option>
            <option value="disponivel">Disponível</option>
            <option value="em_rota">Em Rota</option>
            <option value="folga">Folga</option>
          </select>

          <select
            value={frotaFilter}
            onChange={(e) => setFrotaFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:ring-2 focus:ring-[#E05328]/30 outline-hidden font-medium"
          >
            <option value="todos">Frota: Todas</option>
            <option value="propria">Frota Própria</option>
            <option value="alugada">Frota Alugada</option>
            <option value="terceirizada">Terceirizada</option>
          </select>
        </div>
      </div>

      {/* Motoboys Grid */}
      {filteredMotoboys.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Nenhum motoboy encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'todos' || frotaFilter !== 'todos'
              ? 'Tente ajustar os filtros de busca para encontrar o profissional desejado.'
              : 'Comece adicionando o primeiro motoboy credenciado para a frota eleitoral.'}
          </p>
          {(searchTerm || statusFilter !== 'todos' || frotaFilter !== 'todos') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('todos');
                setFrotaFilter('todos');
              }}
              className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      ) : (
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
                        className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200 shrink-0 bg-slate-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">
                          {moto.nome}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          CNH: {moto.cnh} ({moto.cnhCategoria})
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${statusStyle.bg} ${statusStyle.border}`}
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

                    {moto.partidoAdesivado && (
                      <div className="flex items-center justify-between text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/60 mt-1">
                        <span className="flex items-center gap-1 font-semibold">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Adesivado: {moto.partidoAdesivado}
                        </span>
                      </div>
                    )}
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
                    className="text-emerald-700 font-bold hover:underline flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200/50"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    {moto.telefone}
                  </a>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(moto)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Editar cadastro do motoboy"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setMotoboyToDelete(moto)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Excluir motoboy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {motoboyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Confirmar Exclusão de Motoboy
                </h3>
                <p className="text-xs text-slate-500">
                  Tem certeza que deseja remover este profissional credenciado?
                </p>
              </div>
            </div>

            {/* Profile Summary */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex items-center gap-3">
              <img
                src={motoboyToDelete.fotoUrl}
                alt={motoboyToDelete.nome}
                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
              />
              <div className="text-xs">
                <p className="font-bold text-slate-900">{motoboyToDelete.nome}</p>
                <p className="text-slate-500 font-mono text-[11px]">
                  CNH: {motoboyToDelete.cnh} • Placa: {motoboyToDelete.placaMoto}
                </p>
                <p className="text-slate-400 text-[10px]">
                  Total de entregas vinculadas: <strong>{motoboyToDelete.totalEntregas}</strong>
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-800">
              <strong>Nota de Conformidade TSE:</strong> A exclusão é lógica. Os relatórios de auditoria e comprovantes POD de rotas passadas serão preservados no banco para prestação de contas.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMotoboyToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro / Edição de Motoboy */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative my-8 text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#E05328] flex items-center justify-center">
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingMotoboy ? 'Editar Motoboy Credenciado' : 'Cadastrar Novo Motoboy'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingMotoboy
                      ? 'Atualize os dados cadastrais, veículo ou remuneração do motoboy'
                      : 'Preencha as informações para credenciamento oficial da frota'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Wellington Costa dos Santos"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CPF</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98765-4321"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">CNH (Número do Registro)</label>
                  <input
                    type="text"
                    placeholder="Ex: 05819283740"
                    value={formData.cnh}
                    onChange={(e) => setFormData({ ...formData, cnh: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria CNH</label>
                  <select
                    value={formData.cnhCategoria}
                    onChange={(e) => setFormData({ ...formData, cnhCategoria: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 outline-hidden font-bold"
                  >
                    <option value="A">A (Moto)</option>
                    <option value="AB">AB (Moto/Carro)</option>
                    <option value="B">B</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Placa da Moto *</label>
                  <input
                    type="text"
                    required
                    placeholder="ABC-1234"
                    value={formData.placaMoto}
                    onChange={(e) => setFormData({ ...formData, placaMoto: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase font-bold focus:ring-2 focus:ring-[#E05328]/30 outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Modelo / Ano</label>
                  <input
                    type="text"
                    placeholder="Honda CG 160 Fan (2024)"
                    value={formData.modeloMoto}
                    onChange={(e) => setFormData({ ...formData, modeloMoto: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Capacidade Baú</label>
                  <select
                    value={formData.capacidadeBau}
                    onChange={(e) => setFormData({ ...formData, capacidadeBau: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 outline-hidden"
                  >
                    <option value="120 Litros">120 Litros</option>
                    <option value="135 Litros">135 Litros (Padrão)</option>
                    <option value="140 Litros">140 Litros</option>
                    <option value="160 Litros Cargo">160 Litros (Cargo)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Frota</label>
                  <select
                    value={formData.tipoFrota}
                    onChange={(e) => setFormData({ ...formData, tipoFrota: e.target.value as TipoFrota })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 outline-hidden font-medium"
                  >
                    <option value="propria">Própria</option>
                    <option value="alugada">Alugada</option>
                    <option value="terceirizada">Terceirizada</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Operacional</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusMotoboy })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 outline-hidden font-bold"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="em_rota">Em Rota</option>
                    <option value="folga">Folga</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor da Diária (R$)</label>
                  <input
                    type="number"
                    value={formData.valorDiaria}
                    onChange={(e) => setFormData({ ...formData, valorDiaria: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-[#E05328]/30 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chave PIX para Pagamento</label>
                  <input
                    type="text"
                    placeholder="CPF, E-mail ou Telefone"
                    value={formData.pix}
                    onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#E05328] hover:bg-orange-700 rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  {editingMotoboy ? 'Salvar Alterações' : 'Cadastrar Motoboy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
