import React, { useState, useMemo } from 'react';
import {
  Navigation,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Bike,
  Package,
  FileCheck,
  Send,
  X,
  Layers,
  ChevronRight,
  User,
  Phone,
} from 'lucide-react';
import { Entrega, Comite, Motoboy, TipoMaterial, PrioridadeEntrega, StatusEntrega } from '../types';
import {
  formatCurrency,
  formatNumber,
  formatDateTime,
  getStatusBadgeClass,
} from '../utils/formatters';

interface EntregasViewProps {
  entregas: Entrega[];
  comites: Comite[];
  motoboys: Motoboy[];
  onAddEntrega: (entrega: Omit<Entrega, 'id' | 'codigoRastreio' | 'dataCriacao'>) => void;
  onUpdateStatusEntrega: (entregaId: string, status: StatusEntrega, motoboyId?: string) => void;
  onOpenPODModal: (entrega: Entrega) => void;
  preSelectedComite?: Comite | null;
  isOpenNewModalDefault?: boolean;
  onCloseNewModalDefault?: () => void;
}

export const EntregasView: React.FC<EntregasViewProps> = ({
  entregas,
  comites,
  motoboys,
  onAddEntrega,
  onUpdateStatusEntrega,
  onOpenPODModal,
  preSelectedComite = null,
  isOpenNewModalDefault = false,
  onCloseNewModalDefault,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [materialFilter, setMaterialFilter] = useState<string>('todos');
  const [zonaFilter, setZonaFilter] = useState<string>('todos');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(isOpenNewModalDefault);
  const [selectedComiteId, setSelectedComiteId] = useState<string>(
    preSelectedComite?.id || comites[0]?.id || ''
  );

  const [tipoMaterial, setTipoMaterial] = useState<TipoMaterial>('santinhos');
  const [descricaoMaterial, setDescricaoMaterial] = useState(
    'Santinhos 4x4 colorido c/ propostas'
  );
  const [quantidade, setQuantidade] = useState<number>(20000);
  const [unidadeMedida, setUnidadeMedida] = useState<'unidades' | 'milheiros' | 'kits' | 'fardos'>('unidades');
  const [pesoKg, setPesoKg] = useState<number>(15);
  const [enderecoDestino, setEnderecoDestino] = useState('');
  const [bairro, setBairro] = useState('');
  const [zonaEleitoral, setZonaEleitoral] = useState('001ª Zona Eleitoral (Bela Vista)');
  const [responsavelRecebimento, setResponsavelRecebimento] = useState('');
  const [telefoneContato, setTelefoneContato] = useState('');
  const [prioridade, setPrioridade] = useState<PrioridadeEntrega>('normal');
  const [motoboyId, setMotoboyId] = useState<string>(motoboys[0]?.id || '');
  const [valorFrete, setValorFrete] = useState<number>(55);
  const [observacoes, setObservacoes] = useState('');

  // When committee changes in form, prefill address/contact
  const handleComiteSelect = (cId: string) => {
    setSelectedComiteId(cId);
    const found = comites.find((c) => c.id === cId);
    if (found) {
      setEnderecoDestino(`${found.endereco}, ${found.numeroEnd}`);
      setBairro(found.bairro);
      setZonaEleitoral(found.zonaEleitoral);
      setResponsavelRecebimento(found.responsavel);
      setTelefoneContato(found.telefone);
      setValorFrete(found.valorBaseRota || 45);
    }
  };

  const handleOpenNewModal = () => {
    if (comites[0]) {
      handleComiteSelect(comites[0].id);
    }
    setIsModalOpen(true);
  };

  const handleSubmitNewEntrega = (e: React.FormEvent) => {
    e.preventDefault();
    const comite = comites.find((c) => c.id === selectedComiteId);
    if (!comite) {
      alert('Selecione um comitê válido.');
      return;
    }

    const motoboy = motoboys.find((m) => m.id === motoboyId);

    const now = new Date();
    const previsaoDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

    onAddEntrega({
      comiteId: comite.id,
      comiteNome: comite.nome,
      candidato: comite.candidato,
      partido: comite.partido,
      cnpjCampanha: comite.cnpjCampanha,
      tipoMaterial,
      descricaoMaterial,
      quantidade,
      unidadeMedida,
      pesoKg,
      enderecoDestino: enderecoDestino || `${comite.endereco}, ${comite.numeroEnd}`,
      bairro: bairro || comite.bairro,
      cidade: comite.cidade,
      zonaEleitoral: zonaEleitoral || comite.zonaEleitoral,
      responsavelRecebimento: responsavelRecebimento || comite.responsavel,
      telefoneContato: telefoneContato || comite.telefone,
      prioridade,
      motoboyId: motoboy?.id,
      motoboyNome: motoboy?.nome,
      motoboyTelefone: motoboy?.telefone,
      motoboyPlaca: motoboy?.placaMoto,
      status: motoboy ? 'em_transito' : 'pendente',
      dataPrevisao: previsaoDate.toISOString(),
      valorFrete,
      observacoes,
    });

    setIsModalOpen(false);
    if (onCloseNewModalDefault) onCloseNewModalDefault();
  };

  // Filtered deliveries
  const filteredEntregas = useMemo(() => {
    return entregas.filter((e) => {
      const matchesSearch =
        e.codigoRastreio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.comiteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.candidato.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.partido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.descricaoMaterial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.bairro.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.motoboyNome && e.motoboyNome.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'todos' ? true : e.status === statusFilter;
      const matchesMaterial =
        materialFilter === 'todos' ? true : e.tipoMaterial === materialFilter;
      const matchesZona =
        zonaFilter === 'todos' ? true : e.zonaEleitoral === zonaFilter;

      return matchesSearch && matchesStatus && matchesMaterial && matchesZona;
    });
  }, [entregas, searchTerm, statusFilter, materialFilter, zonaFilter]);

  const uniqueZonas = useMemo(() => {
    return Array.from(new Set(entregas.map((e) => e.zonaEleitoral)));
  }, [entregas]);

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base lg:text-lg font-bold text-slate-900">
            Painel de Despacho & Entregas Eleitorais
          </h2>
          <p className="text-xs text-slate-500">
            Rastreamento de materiais por zona eleitoral e comprovação digital (POD)
          </p>
        </div>

        <button
          id="nova-entrega-btn"
          onClick={handleOpenNewModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#E05328] hover:bg-orange-700 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nova Solicitação de Entrega</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, candidato, motoboy..."
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
          <option value="pendente">Pendente (Na fila)</option>
          <option value="em_transito">Em Trânsito</option>
          <option value="entregue">Entregue (Com POD)</option>
        </select>

        <select
          value={materialFilter}
          onChange={(e) => setMaterialFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-[#E05328]/30"
        >
          <option value="todos">Destino / Material: Todos</option>
          <option value="perfurado">Perfurado (Vidro Traseiro)</option>
          <option value="revista">Revista / Informativo</option>
          <option value="cartao">Cartão de Visita / Mini</option>
          <option value="santao">Santão (A4 / A5)</option>
          <option value="pragao">Pragão (Adesivo 10cm)</option>
          <option value="adesivos_15x40">Adesivos 15x40 (Para-choque)</option>
          <option value="santinhos">Santinhos Impressos</option>
          <option value="bandeiras">Bandeiras de Pano</option>
          <option value="praguinhas">Praguinhas Adesivas</option>
          <option value="windbanners">Windbanners</option>
          <option value="combo_comicio">Kits de Comício</option>
        </select>

        <select
          value={zonaFilter}
          onChange={(e) => setZonaFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-[#E05328]/30"
        >
          <option value="todos">Zona Eleitoral: Todas</option>
          {uniqueZonas.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>

      {/* Deliveries List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Código / Prioridade</th>
                <th className="py-3 px-4">Comitê & Candidato</th>
                <th className="py-3 px-4">Material & Quantidade</th>
                <th className="py-3 px-4">Destino / Zona</th>
                <th className="py-3 px-4">Motoboy Designado</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Comprovante / Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntregas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhuma entrega encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredEntregas.map((ent) => {
                  const statusStyle = getStatusBadgeClass(ent.status);
                  const isUrgent = ent.prioridade === 'urgente_comicio';

                  return (
                    <tr key={ent.id} className="hover:bg-slate-50 transition-colors">
                      {/* Código & Prioridade */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {ent.codigoRastreio}
                        </div>
                        {isUrgent ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            Urgente Comício
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 capitalize">
                            Prioridade {ent.prioridade}
                          </span>
                        )}
                      </td>

                      {/* Comitê & Candidato */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {ent.comiteNome}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ent.candidato} • <span className="font-semibold text-[#E05328]">{ent.partido}</span>
                        </div>
                      </td>

                      {/* Material & Quantidade */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 text-xs">
                          {ent.descricaoMaterial}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {formatNumber(ent.quantidade)} {ent.unidadeMedida} (~{ent.pesoKg}kg)
                        </div>
                      </td>

                      {/* Destino / Zona */}
                      <td className="py-3 px-4">
                        <div className="text-slate-900 text-xs truncate max-w-[190px]" title={ent.enderecoDestino}>
                          {ent.enderecoDestino}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-orange-600" />
                          <span className="truncate max-w-[170px]">{ent.zonaEleitoral}</span>
                        </div>
                      </td>

                      {/* Motoboy */}
                      <td className="py-3 px-4">
                        {ent.motoboyNome ? (
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                              <Bike className="w-3.5 h-3.5 text-orange-600" />
                              {ent.motoboyNome}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Placa: {ent.motoboyPlaca}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Não atribuído
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusStyle.bg} ${statusStyle.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          <span className="capitalize">{ent.status.replace('_', ' ')}</span>
                        </span>
                      </td>

                      {/* Ações / POD */}
                      <td className="py-3 px-4 text-right">
                        {ent.comprovantePOD ? (
                          <button
                            onClick={() => onOpenPODModal(ent)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Ver POD TSE</span>
                          </button>
                        ) : ent.status === 'pendente' ? (
                          <button
                            onClick={() =>
                              onUpdateStatusEntrega(ent.id, 'em_transito', motoboys[0]?.id)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                          >
                            <Send className="w-3 h-3" />
                            <span>Despachar</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-semibold">
                            Em Trânsito
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nova Solicitação de Entrega */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-[#E05328]" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Nova Solicitação de Entrega de Material Eleitoral
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  if (onCloseNewModalDefault) onCloseNewModalDefault();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewEntrega} className="space-y-4 mt-4 text-xs">
              {/* Cliente Solicitante */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cliente / Candidato *
                </label>
                <select
                  value={selectedComiteId}
                  onChange={(e) => handleComiteSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-semibold text-xs"
                >
                  {comites.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.candidato} ({c.partido}) — {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Material & Descrição */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Destino / Tipo de Material *
                  </label>
                  <select
                    value={tipoMaterial}
                    onChange={(e) => setTipoMaterial(e.target.value as TipoMaterial)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs font-semibold"
                  >
                    <option value="perfurado">🚗 Perfurado (Vidro Traseiro)</option>
                    <option value="revista">📖 Revista (Tablóides/Informativos)</option>
                    <option value="cartao">📇 Cartão (Mini / QR Code)</option>
                    <option value="santao">📑 Santão (A4 / A5 Grande)</option>
                    <option value="pragao">🔴 Pragão (Adesivo 10cm)</option>
                    <option value="adesivos_15x40">🏷️ Adesivos 15x40 (Para-choque)</option>
                    <option value="santinhos">📄 Santinhos Impressos</option>
                    <option value="bandeiras">🚩 Bandeiras com Haste</option>
                    <option value="praguinhas">🔘 Praguinhas Adesivas</option>
                    <option value="windbanners">🚩 Windbanners de Calçada</option>
                    <option value="combo_comicio">📦 Combo Completo para Comício</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Descrição Detalhada do Lote
                  </label>
                  <input
                    type="text"
                    required
                    value={descricaoMaterial}
                    onChange={(e) => setDescricaoMaterial(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs"
                  />
                </div>
              </div>

              {/* Quantidade, Unidade & Peso */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Quantidade Total *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    value={unidadeMedida}
                    onChange={(e) =>
                      setUnidadeMedida(e.target.value as 'unidades' | 'milheiros' | 'kits' | 'fardos')
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs"
                  >
                    <option value="unidades">Unidades</option>
                    <option value="milheiros">Milheiros</option>
                    <option value="kits">Kits</option>
                    <option value="fardos">Fardos</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Peso Estimado (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={pesoKg}
                    onChange={(e) => setPesoKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs"
                  />
                </div>
              </div>

              {/* Destino & Zona Eleitoral */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Endereço de Entrega *
                  </label>
                  <input
                    type="text"
                    required
                    value={enderecoDestino}
                    onChange={(e) => setEnderecoDestino(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Zona Eleitoral de Destino *
                  </label>
                  <input
                    type="text"
                    required
                    value={zonaEleitoral}
                    onChange={(e) => setZonaEleitoral(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs"
                  />
                </div>
              </div>

              {/* Responsável no Local & Motoboy */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Responsável no Comitê *
                  </label>
                  <input
                    type="text"
                    required
                    value={responsavelRecebimento}
                    onChange={(e) => setResponsavelRecebimento(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Telefone Recebedor
                  </label>
                  <input
                    type="text"
                    value={telefoneContato}
                    onChange={(e) => setTelefoneContato(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value as PrioridadeEntrega)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-xs"
                  >
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente_comicio">🚨 Urgente Comício</option>
                  </select>
                </div>
              </div>

              {/* Atribuir Motoboy & Valor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Atribuir a Motoboy Imediatamente
                  </label>
                  <select
                    value={motoboyId}
                    onChange={(e) => setMotoboyId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs font-semibold"
                  >
                    <option value="">Não atribuir agora (Fila Pendente)</option>
                    {motoboys.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} — {m.placaMoto} ({m.tipoFrota})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Valor do Frete (R$)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={valorFrete}
                    onChange={(e) => setValorFrete(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-bold text-xs"
                  />
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#E05328] hover:bg-orange-700 rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Cadastrar & Despachar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
