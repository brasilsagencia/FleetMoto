import React, { useState, useMemo } from 'react';
import { 
  Bike, 
  Wrench, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  AlertTriangle,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  Gauge,
  Calendar,
  Layers,
  Sparkles,
  UserCheck,
  Fuel,
  Info
} from 'lucide-react';
import { Moto, Motoboy, StatusMoto, TipoFrota } from '../types';
import { getStatusBadgeClass } from '../utils/formatters';

interface MotosViewProps {
  motos: Moto[];
  motoboys: Motoboy[];
  onAddMoto: (moto: Omit<Moto, 'id'>) => Promise<void>;
  onUpdateMoto: (moto: Moto) => Promise<void>;
  onDeleteMoto: (id: string) => Promise<void>;
}

export const MotosView: React.FC<MotosViewProps> = ({
  motos,
  motoboys,
  onAddMoto,
  onUpdateMoto,
  onDeleteMoto,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterPropriedade, setFilterPropriedade] = useState<string>('todos');
  const [filterAdesivo, setFilterAdesivo] = useState<string>('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMoto, setEditingMoto] = useState<Moto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('Honda');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState(new Date().getFullYear().toString());
  const [cor, setCor] = useState('Vermelha');
  const [capacidadeBauLts, setCapacidadeBauLts] = useState(100);
  const [tipoPropriedade, setTipoPropriedade] = useState<TipoFrota>('propria');
  const [motoboyResponsavel, setMotoboyResponsavel] = useState('');
  const [status, setStatus] = useState<StatusMoto>('operacional');
  const [adesivoCampanha, setAdesivoCampanha] = useState(true);
  const [partidoAdesivo, setPartidoAdesivo] = useState('Coligação Esperança e Trabalho');
  const [kmAtual, setKmAtual] = useState(15000);
  const [proximaRevisaoKm, setProximaRevisaoKm] = useState(18000);
  const [dataUltimaRevisao, setDataUltimaRevisao] = useState(new Date().toISOString().slice(0, 10));

  const openAddModal = () => {
    setEditingMoto(null);
    setPlaca('');
    setMarca('Honda');
    setModelo('CG 160 Cargo');
    setAno('2024');
    setCor('Vermelha');
    setCapacidadeBauLts(100);
    setTipoPropriedade('propria');
    setMotoboyResponsavel(motoboys[0]?.nome || '');
    setStatus('operacional');
    setAdesivoCampanha(true);
    setPartidoAdesivo('Coligação Esperança e Trabalho');
    setKmAtual(12000);
    setProximaRevisaoKm(16000);
    setDataUltimaRevisao(new Date().toISOString().slice(0, 10));
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (moto: Moto) => {
    setEditingMoto(moto);
    setPlaca(moto.placa);
    setMarca(moto.marca);
    setModelo(moto.modelo);
    setAno(moto.ano);
    setCor(moto.cor);
    setCapacidadeBauLts(moto.capacidadeBauLts);
    setTipoPropriedade(moto.tipoPropriedade);
    setMotoboyResponsavel(moto.motoboyResponsavel || '');
    setStatus(moto.status);
    setAdesivoCampanha(moto.adesivoCampanha);
    setPartidoAdesivo(moto.partidoAdesivo || '');
    setKmAtual(moto.kmAtual);
    setProximaRevisaoKm(moto.proximaRevisaoKm);
    setDataUltimaRevisao(moto.dataUltimaRevisao);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanPlaca = placa.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanPlaca.length < 7) {
      setFormError('Informe uma placa válida com no mínimo 7 caracteres (ex: ABC1D23 ou ABC1234).');
      return;
    }

    if (!modelo.trim()) {
      setFormError('Informe o modelo da motocicleta.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingMoto) {
        await onUpdateMoto({
          ...editingMoto,
          placa: cleanPlaca,
          marca,
          modelo: modelo.trim(),
          ano,
          cor,
          capacidadeBauLts: Number(capacidadeBauLts) || 80,
          tipoPropriedade,
          motoboyResponsavel: motoboyResponsavel || undefined,
          status,
          adesivoCampanha,
          partidoAdesivo: adesivoCampanha ? partidoAdesivo : undefined,
          kmAtual: Number(kmAtual) || 0,
          proximaRevisaoKm: Number(proximaRevisaoKm) || 0,
          dataUltimaRevisao,
        });
      } else {
        await onAddMoto({
          placa: cleanPlaca,
          marca,
          modelo: modelo.trim(),
          ano,
          cor,
          capacidadeBauLts: Number(capacidadeBauLts) || 80,
          tipoPropriedade,
          motoboyResponsavel: motoboyResponsavel || undefined,
          status,
          adesivoCampanha,
          partidoAdesivo: adesivoCampanha ? partidoAdesivo : undefined,
          kmAtual: Number(kmAtual) || 0,
          proximaRevisaoKm: Number(proximaRevisaoKm) || 0,
          dataUltimaRevisao,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar a motocicleta no Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (moto: Moto, newStatus: StatusMoto) => {
    try {
      await onUpdateMoto({ ...moto, status: newStatus });
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  // Filtered Motos
  const filteredMotos = useMemo(() => {
    return motos.filter((moto) => {
      const matchSearch =
        moto.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        moto.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        moto.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (moto.motoboyResponsavel && moto.motoboyResponsavel.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = filterStatus === 'todos' || moto.status === filterStatus;
      const matchPropriedade = filterPropriedade === 'todos' || moto.tipoPropriedade === filterPropriedade;
      const matchAdesivo =
        filterAdesivo === 'todos' ||
        (filterAdesivo === 'sim' && moto.adesivoCampanha) ||
        (filterAdesivo === 'nao' && !moto.adesivoCampanha);

      return matchSearch && matchStatus && matchPropriedade && matchAdesivo;
    });
  }, [motos, searchTerm, filterStatus, filterPropriedade, filterAdesivo]);

  // Statistics
  const stats = useMemo(() => {
    const total = motos.length;
    const operacionais = motos.filter((m) => m.status === 'operacional').length;
    const manutencao = motos.filter((m) => m.status === 'manutencao').length;
    const reserva = motos.filter((m) => m.status === 'reserva').length;
    const totalCapacidade = motos.reduce((acc, m) => acc + (m.capacidadeBauLts || 0), 0);
    const adesivadas = motos.filter((m) => m.adesivoCampanha).length;

    return { total, operacionais, manutencao, reserva, totalCapacidade, adesivadas };
  }, [motos]);

  return (
    <div className="space-y-6">
      {/* Header with Title & Add Button */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Gestão da Frota de Motocicletas & Baús de Carga
            </h2>
            <span className="text-xs bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full border border-orange-200">
              {motos.length} {motos.length === 1 ? 'Moto' : 'Motos'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre novas motocicletas, acompanhe capacidade de baús (Litros), manutenções preventivas e adesivagem eleitoral
          </p>
        </div>

        <button
          id="btn-adicionar-motocicleta"
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E05328] hover:bg-orange-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Motocicleta</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Total Frota</span>
            <Bike className="w-4 h-4 text-slate-700" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.total}</p>
          <p className="text-[10px] text-slate-400">Motos cadastradas</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-600 font-medium">Operacionais</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-700 mt-1">{stats.operacionais}</p>
          <p className="text-[10px] text-emerald-500">Prontas para rota</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-600 font-medium">Em Manutenção</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-amber-700 mt-1">{stats.manutencao}</p>
          <p className="text-[10px] text-amber-500">Oficina / Revisão</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-orange-600 font-medium">Capacidade Baús</span>
            <Layers className="w-4 h-4 text-[#E05328]" />
          </div>
          <p className="text-xl font-bold text-[#E05328] mt-1">{stats.totalCapacidade} L</p>
          <p className="text-[10px] text-slate-400">Volume total de carga</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-600 font-medium">Adesivadas TSE</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-blue-700 mt-1">{stats.adesivadas}</p>
          <p className="text-[10px] text-blue-500">Campanha eleitoral</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por placa, modelo, marca ou motoboy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 outline-hidden"
          >
            <option value="todos">Todos os Status</option>
            <option value="operacional">Operacional</option>
            <option value="manutencao">Em Manutenção</option>
            <option value="reserva">Reserva Técnica</option>
          </select>

          <select
            value={filterPropriedade}
            onChange={(e) => setFilterPropriedade(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 outline-hidden"
          >
            <option value="todos">Todas as Frotas</option>
            <option value="propria">Própria da Campanha</option>
            <option value="alugada">Alugada</option>
            <option value="terceirizada">Terceirizada</option>
          </select>

          <select
            value={filterAdesivo}
            onChange={(e) => setFilterAdesivo(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 outline-hidden"
          >
            <option value="todos">Adesivagem (Todas)</option>
            <option value="sim">Com Adesivo de Campanha</option>
            <option value="nao">Sem Adesivo</option>
          </select>
        </div>
      </div>

      {/* Motorcycle Cards Grid */}
      {filteredMotos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-orange-50 text-[#E05328] flex items-center justify-center mx-auto">
            <Bike className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhuma motocicleta encontrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não encontramos motocicletas correspondentes aos filtros ou à busca aplicada. Cadastre uma nova moto para sua frota.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E05328] text-white font-bold text-xs shadow-xs hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeira Moto</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMotos.map((moto) => {
            const statusStyle = getStatusBadgeClass(moto.status);

            return (
              <div
                key={moto.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Placa, Edit & Delete */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black bg-slate-900 text-white px-2.5 py-1 rounded-lg tracking-wider border border-slate-700 shadow-2xs">
                          {moto.placa}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {moto.tipoPropriedade === 'propria' ? 'Frota Própria' : moto.tipoPropriedade === 'alugada' ? 'Alugada' : 'Terceirizada'}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-2.5">
                        {moto.marca} {moto.modelo} ({moto.ano})
                      </h4>
                      <p className="text-xs text-slate-500">Cor: <span className="font-medium text-slate-700">{moto.cor}</span></p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(moto)}
                        title="Editar Informações da Moto"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteMoto(moto.id)}
                        title="Excluir Motocicleta"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusStyle.bg} ${statusStyle.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      <span className="capitalize">{moto.status}</span>
                    </span>

                    {/* Quick status selector */}
                    <select
                      value={moto.status}
                      onChange={(e) => handleQuickStatusChange(moto, e.target.value as StatusMoto)}
                      className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 outline-hidden hover:bg-slate-100"
                    >
                      <option value="operacional">Definir: Operacional</option>
                      <option value="manutencao">Definir: Manutenção</option>
                      <option value="reserva">Definir: Reserva</option>
                    </select>
                  </div>

                  {/* Vehicle Spec Grid */}
                  <div className="mt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        Capacidade do Baú:
                      </span>
                      <strong className="text-[#E05328] font-black text-sm">
                        {moto.capacidadeBauLts} Litros
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        Condutor Alocado:
                      </span>
                      <strong className="text-slate-900 truncate max-w-[150px]">
                        {moto.motoboyResponsavel || 'Sem condutor (Livre)'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                        Adesivagem Eleitoral:
                      </span>
                      <span
                        className={`font-bold ${
                          moto.adesivoCampanha ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        {moto.adesivoCampanha
                          ? `Sim (${moto.partidoAdesivo || 'Adesivada'})`
                          : 'Não adesivada'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer specs: KM and Revision */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-slate-400" />
                    KM: <strong className="text-slate-800">{moto.kmAtual.toLocaleString('pt-BR')} km</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-slate-400" />
                    Revisão: <strong className="text-slate-800">{moto.proximaRevisaoKm.toLocaleString('pt-BR')} km</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Adicionar / Editar Motocicleta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#E05328] flex items-center justify-center shadow-xs">
                  <Bike className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingMoto ? 'Editar Motocicleta da Frota' : 'Cadastrar Nova Motocicleta'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Preencha os dados técnicos, baú de carga e vínculo com o condutor
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="flex-1">{formError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Placa do Veículo (Mercosul / Padrão) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: BRA2E19 ou ABC1234"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs uppercase font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Marca *
                  </label>
                  <select
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] outline-hidden bg-white"
                  >
                    <option value="Honda">Honda</option>
                    <option value="Yamaha">Yamaha</option>
                    <option value="Shineray">Shineray</option>
                    <option value="Haojue">Haojue</option>
                    <option value="Suzuki">Suzuki</option>
                    <option value="BMW">BMW</option>
                    <option value="Outra">Outra Marca</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Modelo da Moto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: CG 160 Cargo / Factor 150"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ano Fab.
                    </label>
                    <input
                      type="text"
                      placeholder="2024"
                      value={ano}
                      onChange={(e) => setAno(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cor
                    </label>
                    <input
                      type="text"
                      placeholder="Vermelha"
                      value={cor}
                      onChange={(e) => setCor(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Capacidade do Baú (Litros) *
                  </label>
                  <select
                    value={capacidadeBauLts}
                    onChange={(e) => setCapacidadeBauLts(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] outline-hidden bg-white"
                  >
                    <option value={80}>80 Litros (Compacto)</option>
                    <option value={90}>90 Litros (Padrão)</option>
                    <option value={100}>100 Litros (Recomendado Eleições)</option>
                    <option value={120}>120 Litros (Grande Porte)</option>
                    <option value={135}>135 Litros (Carga Pesada / Windbanner)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Frota / Propriedade *
                  </label>
                  <select
                    value={tipoPropriedade}
                    onChange={(e) => setTipoPropriedade(e.target.value as TipoFrota)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] outline-hidden bg-white"
                  >
                    <option value="propria">Própria da Campanha</option>
                    <option value="alugada">Alugada / Locadora</option>
                    <option value="terceirizada">Terceirizada / Motoboy Parceiro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Condutor / Motoboy Alocado
                  </label>
                  <select
                    value={motoboyResponsavel}
                    onChange={(e) => setMotoboyResponsavel(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] outline-hidden bg-white"
                  >
                    <option value="">Livre na Garagem (Sem condutor fixo)</option>
                    {motoboys.map((mb) => (
                      <option key={mb.id} value={mb.nome}>
                        {mb.nome} ({mb.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Operacional *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusMoto)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] outline-hidden bg-white"
                  >
                    <option value="operacional">Operacional (Pronta p/ Rota)</option>
                    <option value="manutencao">Em Manutenção / Oficina</option>
                    <option value="reserva">Reserva Técnica</option>
                  </select>
                </div>
              </div>

              {/* Adesivagem Eleitoral Section */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adesivoCampanha}
                      onChange={(e) => setAdesivoCampanha(e.target.checked)}
                      className="w-4 h-4 text-[#E05328] rounded border-slate-300 focus:ring-[#E05328]"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Possui Adesivo Oficial de Campanha Eleitoral (TSE)
                    </span>
                  </label>
                </div>

                {adesivoCampanha && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Identificação da Coligação / Partido no Baú
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Coligação Esperança e Trabalho - Candidato 15"
                      value={partidoAdesivo}
                      onChange={(e) => setPartidoAdesivo(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] outline-hidden bg-white"
                    />
                  </div>
                )}
              </div>

              {/* KM & Preventive Revisions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Quilometragem Atual (KM)
                  </label>
                  <input
                    type="number"
                    value={kmAtual}
                    onChange={(e) => setKmAtual(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Próxima Revisão (KM)
                  </label>
                  <input
                    type="number"
                    value={proximaRevisaoKm}
                    onChange={(e) => setProximaRevisaoKm(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Data Última Revisão
                  </label>
                  <input
                    type="date"
                    value={dataUltimaRevisao}
                    onChange={(e) => setDataUltimaRevisao(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] outline-hidden"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="salvar-moto-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#E05328] hover:bg-orange-700 rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Salvando no Firestore...</span>
                  ) : editingMoto ? (
                    <span>Atualizar Motocicleta</span>
                  ) : (
                    <span>Cadastrar Motocicleta</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
