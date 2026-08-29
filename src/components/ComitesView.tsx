import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Star,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Package,
  Layers,
  Send,
  Navigation,
  X,
  Sparkles,
  Car,
  Tag,
  Check,
  Compass,
  UserCheck,
  Share2,
  Briefcase,
  Shield,
  Crown,
  BookOpen,
  CreditCard,
  FileCheck2,
  Disc,
  Globe,
  Users,
  Printer,
  FileDown,
} from 'lucide-react';
import { Comite, StatusComite, CargoEleitoral, OrigemCliente, RegiaoRota } from '../types';
import { RotasClienteView } from './rotas-cliente/RotasClienteView';
import { RelatorioClientesPdfModal } from './comites/RelatorioClientesPdfModal';
import {
  OPCOES_REGIAO_ROTA,
  getRegiaoRotaConfig,
  classificarRegiaoAutomaticamente,
  REGIOES_CONFIG,
} from '../utils/geoRegions';
import {
  formatCurrency,
  formatCNPJ,
  formatNumber,
  formatDate,
  getStatusBadgeClass,
} from '../utils/formatters';

export const renderMaterialIcon = (matId: string, className = 'w-3.5 h-3.5') => {
  switch (matId) {
    case 'perfurado':
      return <Car className={className} />;
    case 'revista':
      return <BookOpen className={className} />;
    case 'cartao':
      return <CreditCard className={className} />;
    case 'santao':
      return <FileCheck2 className={className} />;
    case 'pragao':
      return <Disc className={className} />;
    case 'adesivos_15x40':
      return <Tag className={className} />;
    default:
      return <Package className={className} />;
  }
};

export const renderOrigemIcon = (origemId?: OrigemCliente, className = 'w-3.5 h-3.5') => {
  switch (origemId) {
    case 'rosane':
      return <UserCheck className={className} />;
    case 'esther':
      return <Star className={`${className} fill-current`} />;
    case 'Instagram':
      return <Share2 className={className} />;
    case 'descricao':
      return <FileText className={className} />;
    case 'CRM':
      return <Briefcase className={className} />;
    case 'prata':
      return <Shield className={className} />;
    case 'ouro':
      return <Crown className={`${className} fill-current`} />;
    default:
      return <Building2 className={className} />;
  }
};

/**
 * Utilitário para formatar a data agendada com segurança sem desvios de fuso horário UTC
 */
export const formatDataAgendada = (dateString?: string, horarioString?: string): string => {
  if (!dateString) return 'Sem agendamento';
  try {
    const clean = dateString.trim().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      const [year, month, day] = clean.split('-');
      const str = `${day}/${month}/${year}`;
      return horarioString ? `${str} às ${horarioString}h` : str;
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const formatted = d.toLocaleDateString('pt-BR');
    return horarioString ? `${formatted} às ${horarioString}h` : formatted;
  } catch {
    return dateString;
  }
};

/**
 * Retorna status e estilização rica para datas agendadas
 */
export const getDataAgendadaInfo = (dataString?: string, horarioString?: string) => {
  if (!dataString) {
    return {
      statusKey: 'sem_data' as const,
      label: 'Sem data agendada',
      statusLabel: 'Sem data agendada',
      badgeClass: 'bg-amber-50 text-amber-900 border-amber-300 font-semibold',
      statusBadgeClass: 'bg-amber-50 text-amber-900 border-amber-300 font-semibold',
      dotClass: 'bg-amber-500',
      textoFormatado: 'Sem agendamento',
      dataTexto: 'Sem data definida',
      formattedDate: 'Sem data definida',
      horarioTexto: horarioString ? `${horarioString}h` : 'Não definido',
      formattedTime: horarioString ? `${horarioString}h` : 'Não definido',
      isHoje: false,
      isAmanha: false,
      isSemana: false,
    };
  }

  const cleanIso = dataString.slice(0, 10);
  const [yearStr, monthStr, dayStr] = cleanIso.split('-');
  const dataFormatada = yearStr && monthStr && dayStr ? `${dayStr}/${monthStr}/${yearStr}` : formatDate(dataString);

  const hoje = new Date().toISOString().slice(0, 10);
  const dTom = new Date();
  dTom.setDate(dTom.getDate() + 1);
  const amanha = dTom.toISOString().slice(0, 10);

  const dWeek = new Date();
  dWeek.setDate(dWeek.getDate() + 7);
  const semanaFim = dWeek.toISOString().slice(0, 10);

  const isHoje = cleanIso === hoje;
  const isAmanha = cleanIso === amanha;
  const isSemana = cleanIso >= hoje && cleanIso <= semanaFim;
  const isPassado = cleanIso < hoje;

  if (isHoje) {
    return {
      statusKey: 'hoje' as const,
      label: 'Agendado para Hoje',
      statusLabel: 'Agendado para Hoje',
      badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-extrabold ring-1 ring-emerald-200 shadow-2xs',
      statusBadgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-extrabold ring-1 ring-emerald-200 shadow-2xs',
      dotClass: 'bg-emerald-500 animate-pulse',
      textoFormatado: `Hoje • ${dataFormatada}${horarioString ? ` às ${horarioString}h` : ''}`,
      dataTexto: `Hoje (${dataFormatada})`,
      formattedDate: `Hoje (${dataFormatada})`,
      horarioTexto: horarioString ? `${horarioString}h` : '14:00h',
      formattedTime: horarioString ? `${horarioString}h` : '14:00h',
      isHoje: true,
      isAmanha: false,
      isSemana: true,
    };
  }

  if (isAmanha) {
    return {
      statusKey: 'amanha' as const,
      label: 'Agendado para Amanhã',
      statusLabel: 'Agendado para Amanhã',
      badgeClass: 'bg-blue-50 text-blue-900 border-blue-300 font-bold ring-1 ring-blue-200 shadow-2xs',
      statusBadgeClass: 'bg-blue-50 text-blue-900 border-blue-300 font-bold ring-1 ring-blue-200 shadow-2xs',
      dotClass: 'bg-blue-500',
      textoFormatado: `Amanhã • ${dataFormatada}${horarioString ? ` às ${horarioString}h` : ''}`,
      dataTexto: `Amanhã (${dataFormatada})`,
      formattedDate: `Amanhã (${dataFormatada})`,
      horarioTexto: horarioString ? `${horarioString}h` : '14:00h',
      formattedTime: horarioString ? `${horarioString}h` : '14:00h',
      isHoje: false,
      isAmanha: true,
      isSemana: true,
    };
  }

  if (isPassado) {
    return {
      statusKey: 'passado' as const,
      label: 'Data Passada',
      statusLabel: 'Data Passada',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
      statusBadgeClass: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
      dotClass: 'bg-slate-400',
      textoFormatado: `${dataFormatada}${horarioString ? ` às ${horarioString}h` : ''}`,
      dataTexto: dataFormatada,
      formattedDate: dataFormatada,
      horarioTexto: horarioString ? `${horarioString}h` : '',
      formattedTime: horarioString ? `${horarioString}h` : '',
      isHoje: false,
      isAmanha: false,
      isSemana: false,
    };
  }

  return {
    statusKey: 'futuro' as const,
    label: 'Próximos Dias',
    statusLabel: 'Próximos Dias',
    badgeClass: 'bg-purple-50 text-purple-900 border-purple-300 font-semibold',
    statusBadgeClass: 'bg-purple-50 text-purple-900 border-purple-300 font-semibold',
    dotClass: 'bg-purple-500',
    textoFormatado: `${dataFormatada}${horarioString ? ` às ${horarioString}h` : ''}`,
    dataTexto: dataFormatada,
    formattedDate: dataFormatada,
    horarioTexto: horarioString ? `${horarioString}h` : '',
    formattedTime: horarioString ? `${horarioString}h` : '',
    isHoje: false,
    isAmanha: false,
    isSemana,
  };
};

export const OPCOES_MATERIAIS = [
  {
    id: 'perfurado',
    label: 'Perfurado',
    sublabel: 'Vidro Traseiro',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    id: 'revista',
    label: 'Revista',
    sublabel: 'Informativo / Tabloide',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'cartao',
    label: 'Cartão',
    sublabel: 'Mini / QR Code',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'santao',
    label: 'Santão',
    sublabel: 'A4 / A5 Grande',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    id: 'pragao',
    label: 'Pragão',
    sublabel: 'Adesivo 10cm',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    id: 'adesivos_15x40',
    label: 'Adesivos 15x40',
    sublabel: 'Para-choque',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
];

export const OPCOES_ORIGEM: Array<{
  id: OrigemCliente;
  label: string;
  sublabel: string;
  badgeClass: string;
  colorClass: string;
}> = [
  {
    id: 'rosane',
    label: 'Rosane',
    sublabel: 'Indicação Rosane',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-300 font-bold',
    colorClass: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    id: 'esther',
    label: 'Esther',
    sublabel: 'Indicação Esther',
    badgeClass: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-300 font-bold',
    colorClass: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
  },
  {
    id: 'Instagram',
    label: 'Instagram',
    sublabel: 'Redes Sociais / Leads',
    badgeClass: 'bg-pink-50 text-pink-700 border-pink-200 font-bold',
    colorClass: 'bg-pink-100 text-pink-700 border-pink-300',
  },
  {
    id: 'descricao',
    label: 'Descrição',
    sublabel: 'Detalhamento / Direto',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200 font-bold',
    colorClass: 'bg-teal-100 text-teal-800 border-teal-300',
  },
  {
    id: 'CRM',
    label: 'CRM',
    sublabel: 'Base Corporativa / CRM',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 font-bold',
    colorClass: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  {
    id: 'prata',
    label: 'Prata',
    sublabel: 'Plano Intermediário',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 font-bold',
    colorClass: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  {
    id: 'ouro',
    label: 'Ouro',
    sublabel: 'Prioritário / Especial',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
    colorClass: 'bg-amber-100 text-amber-800 border-amber-300',
  },
];

interface ComitesViewProps {
  comites: Comite[];
  onAddComite: (comite: Omit<Comite, 'id' | 'totalEntregas' | 'volumeTotalMateriais' | 'dataCadastro'>) => void | Promise<void>;
  onUpdateComite: (comite: Comite) => void | Promise<void>;
  onDeleteComite: (id: string) => void | Promise<void>;
  onRequestDeliveryForComite: (comite: Comite) => void;
  initialSearchQuery?: string;
}

export const ComitesView: React.FC<ComitesViewProps> = ({
  comites,
  onAddComite,
  onUpdateComite,
  onDeleteComite,
  onRequestDeliveryForComite,
  initialSearchQuery = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [secaoAtiva, setSecaoAtiva] = useState<'lista_clientes' | 'criacao_rotas'>('lista_clientes');
  const [clienteParaRotaId, setClienteParaRotaId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [origemFilter, setOrigemFilter] = useState<string>('todos');
  const [materialFilter, setMaterialFilter] = useState<string>('todos');
  const [filtroRegiao, setFiltroRegiao] = useState<string>('todas');
  const [filtroDataAgendada, setFiltroDataAgendada] = useState<'todas' | 'hoje' | 'amanha' | 'semana' | 'sem_data' | 'especifica'>('todas');
  const [filtroDataEspecifica, setFiltroDataEspecifica] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(6);

  // Modals & Details state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'origem' | 'agendamento' | 'materiais' | 'descricao' | 'confirmar'>('origem');
  const [editingComite, setEditingComite] = useState<Comite | null>(null);
  const [selectedComiteDetails, setSelectedComiteDetails] = useState<Comite | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form submission and feedback state
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Form State
  const [formData, setFormData] = useState<{
    nome: string;
    candidato: string;
    cargo: CargoEleitoral;
    partido: string;
    numero: string;
    cnpjCampanha: string;
    responsavel: string;
    cargoResponsavel: string;
    telefone: string;
    email: string;
    endereco: string;
    numeroEnd: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    regiaoRota?: RegiaoRota;
    origemCliente: OrigemCliente;
    data: string;
    horario: string;
    dataAgendada?: string;
    horarioAgendado?: string;
    interferencia: string;
    materiais: string[];
    modeloCarro: string;
    zonaEleitoral: string;
    secoesAtendidas: string;
    valorBaseRota: number;
    status: StatusComite;
    observacoes: string;
  }>({
    nome: '',
    candidato: '',
    cargo: 'Deputado Federal' as CargoEleitoral,
    partido: '',
    numero: '',
    cnpjCampanha: '',
    responsavel: '',
    cargoResponsavel: 'Responsável',
    telefone: '',
    email: '',
    endereco: '',
    numeroEnd: '',
    bairro: '',
    cidade: 'Rio de Janeiro',
    uf: 'RJ',
    cep: '',
    regiaoRota: undefined,
    origemCliente: 'rosane' as OrigemCliente,
    data: new Date().toISOString().slice(0, 10),
    horario: '14:00',
    dataAgendada: new Date().toISOString().slice(0, 10),
    horarioAgendado: '14:00',
    interferencia: '',
    materiais: ['perfurado', 'santao'],
    modeloCarro: '',
    zonaEleitoral: '',
    secoesAtendidas: '',
    valorBaseRota: 45,
    status: 'ativo' as StatusComite,
    observacoes: '',
  });

  // Sugestão automática de região baseada no endereço/CEP digitados no modal
  const sugestaoRegiao = useMemo(() => {
    if (!formData.endereco && !formData.bairro && !formData.cidade && !formData.cep) {
      return null;
    }
    return classificarRegiaoAutomaticamente({
      cep: formData.cep,
      bairro: formData.bairro,
      municipio: formData.cidade,
      endereco: formData.endereco,
    });
  }, [formData.endereco, formData.bairro, formData.cidade, formData.cep]);

  // Alerta de divergência entre CEP/Endereço e a Rota selecionada
  const divergenciaCepAviso = useMemo(() => {
    if (!formData.regiaoRota || !formData.cep) return null;
    const cepDigits = formData.cep.replace(/\D/g, '');
    if (
      cepDigits.length >= 5 &&
      sugestaoRegiao &&
      sugestaoRegiao.confianca === 'alta' &&
      sugestaoRegiao.regiao !== formData.regiaoRota
    ) {
      return `Aviso de Divergência: O CEP/Bairro informado (${formData.cep} - ${formData.bairro || 'bairro'}) sugere "${sugestaoRegiao.regiao}" (${sugestaoRegiao.motivo}), mas a rota escolhida manualmente é "${formData.regiaoRota}". Você pode prosseguir ou ajustar a rota se desejar.`;
    }
    return null;
  }, [formData.regiaoRota, formData.cep, formData.bairro, sugestaoRegiao]);

  const handleAplicarSugestaoRegiao = () => {
    if (sugestaoRegiao) {
      setFormData((prev) => ({
        ...prev,
        regiaoRota: sugestaoRegiao.regiao,
      }));
    }
  };

  // Filtered comites
  const filteredComites = useMemo(() => {
    const hojeStr = new Date().toISOString().slice(0, 10);
    const dTomorrow = new Date();
    dTomorrow.setDate(dTomorrow.getDate() + 1);
    const amanhaStr = dTomorrow.toISOString().slice(0, 10);
    const dWeek = new Date();
    dWeek.setDate(dWeek.getDate() + 7);
    const semanaFimStr = dWeek.toISOString().slice(0, 10);

    return comites.filter((c) => {
      const dataEfetiva = (c.dataAgendada || c.data || '').slice(0, 10);
      const horarioEfetivo = c.horarioAgendado || c.horario || '';

      const matchesSearch =
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.candidato.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.telefone.includes(searchTerm) ||
        c.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.cep && c.cep.includes(searchTerm)) ||
        (c.regiaoRota && c.regiaoRota.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.modeloCarro && c.modeloCarro.toLowerCase().includes(searchTerm.toLowerCase())) ||
        c.responsavel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.bairro.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.interferencia && c.interferencia.toLowerCase().includes(searchTerm.toLowerCase())) ||
        dataEfetiva.includes(searchTerm) ||
        horarioEfetivo.includes(searchTerm);

      const matchesStatus =
        statusFilter === 'todos' ? true : c.status === statusFilter;
      const matchesOrigem =
        origemFilter === 'todos' ? true : c.origemCliente === origemFilter;
      const matchesMaterial =
        materialFilter === 'todos'
          ? true
          : c.materiais && c.materiais.includes(materialFilter);
      const matchesRegiao =
        filtroRegiao === 'todas'
          ? true
          : filtroRegiao === 'sem_rota'
          ? !c.regiaoRota
          : c.regiaoRota === filtroRegiao;

      // Filtro de Data Agendada
      let matchesData = true;
      if (filtroDataAgendada === 'hoje') {
        matchesData = dataEfetiva === hojeStr;
      } else if (filtroDataAgendada === 'amanha') {
        matchesData = dataEfetiva === amanhaStr;
      } else if (filtroDataAgendada === 'semana') {
        matchesData = dataEfetiva >= hojeStr && dataEfetiva <= semanaFimStr;
      } else if (filtroDataAgendada === 'sem_data') {
        matchesData = !dataEfetiva;
      } else if (filtroDataAgendada === 'especifica') {
        matchesData = filtroDataEspecifica ? dataEfetiva === filtroDataEspecifica : true;
      }

      return matchesSearch && matchesStatus && matchesOrigem && matchesMaterial && matchesRegiao && matchesData;
    });
  }, [comites, searchTerm, statusFilter, origemFilter, materialFilter, filtroRegiao, filtroDataAgendada, filtroDataEspecifica]);

  // Pagination logic
  const totalPages = Math.ceil(filteredComites.length / itemsPerPage) || 1;
  const paginatedComites = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredComites.slice(start, start + itemsPerPage);
  }, [filteredComites, currentPage, itemsPerPage]);

  // Estatísticas por Região / Rota
  const clientesZonaNorteCount = comites.filter((c) => c.regiaoRota === 'Zona Norte').length;
  const clientesZonaOesteCount = comites.filter((c) => c.regiaoRota === 'Zona Oeste').length;
  const clientesBaixadaCount = comites.filter((c) => c.regiaoRota === 'Baixada Fluminense').length;
  const clientesNiteroiSGCount = comites.filter((c) => c.regiaoRota === 'Niterói / São Gonçalo').length;
  const clientesSemRotaCount = comites.filter((c) => !c.regiaoRota).length;

  // Estatísticas de Agendamento
  const hojeIsoStr = new Date().toISOString().slice(0, 10);
  const amanhaDateCalc = new Date();
  amanhaDateCalc.setDate(amanhaDateCalc.getDate() + 1);
  const amanhaIsoStr = amanhaDateCalc.toISOString().slice(0, 10);
  const semanaDateCalc = new Date();
  semanaDateCalc.setDate(semanaDateCalc.getDate() + 7);
  const semanaFimIsoStr = semanaDateCalc.toISOString().slice(0, 10);

  const agendadosHojeCount = comites.filter((c) => {
    const d = (c.dataAgendada || c.data || '').slice(0, 10);
    return d === hojeIsoStr;
  }).length;

  const agendadosAmanhaCount = comites.filter((c) => {
    const d = (c.dataAgendada || c.data || '').slice(0, 10);
    return d === amanhaIsoStr;
  }).length;

  const agendadosSemanaCount = comites.filter((c) => {
    const d = (c.dataAgendada || c.data || '').slice(0, 10);
    return d >= hojeIsoStr && d <= semanaFimIsoStr;
  }).length;

  const semAgendamentoCount = comites.filter((c) => {
    const d = (c.dataAgendada || c.data || '').slice(0, 10);
    return !d;
  }).length;

  // Statistics de Origem e Geral
  const totalMateriaisTodos = comites.reduce(
    (acc, curr) => acc + curr.volumeTotalMateriais,
    0
  );
  const totalEntregasTodos = comites.reduce(
    (acc, curr) => acc + curr.totalEntregas,
    0
  );
  const clientesRosaneCount = comites.filter((c) => c.origemCliente === 'rosane').length;
  const clientesEstherCount = comites.filter((c) => c.origemCliente === 'esther').length;
  const clientesInstagramCount = comites.filter((c) => c.origemCliente === 'Instagram').length;
  const clientesDescricaoCount = comites.filter((c) => c.origemCliente === 'descricao').length;
  const clientesCRMCount = comites.filter((c) => c.origemCliente === 'CRM').length;
  const clientesPrataCount = comites.filter((c) => c.origemCliente === 'prata').length;
  const clientesOuroCount = comites.filter((c) => c.origemCliente === 'ouro').length;
  const perfuradosDemandCount = comites.filter(
    (c) => c.materiais && c.materiais.includes('perfurado')
  ).length;

  const handleOpenNewModal = () => {
    setEditingComite(null);
    setModalTab('origem');
    setFormError(null);
    const hojeStr = new Date().toISOString().slice(0, 10);
    setFormData({
      nome: '',
      candidato: '',
      cargo: 'Deputado Federal',
      partido: '',
      numero: '',
      cnpjCampanha: '',
      responsavel: '',
      cargoResponsavel: 'Responsável',
      telefone: '',
      email: '',
      endereco: '',
      numeroEnd: '',
      bairro: '',
      cidade: 'Rio de Janeiro',
      uf: 'RJ',
      cep: '',
      regiaoRota: 'Zona Norte',
      origemCliente: 'rosane',
      data: hojeStr,
      horario: '14:00',
      dataAgendada: hojeStr,
      horarioAgendado: '14:00',
      interferencia: '',
      materiais: ['perfurado', 'santao'],
      modeloCarro: '',
      zonaEleitoral: '',
      secoesAtendidas: '',
      valorBaseRota: 45,
      status: 'ativo',
      observacoes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (comite: Comite) => {
    setEditingComite(comite);
    setModalTab('origem');
    setFormError(null);
    const dataEfetiva = comite.dataAgendada || comite.data || new Date().toISOString().slice(0, 10);
    const horarioEfetivo = comite.horarioAgendado || comite.horario || '14:00';
    setFormData({
      nome: comite.nome || '',
      candidato: comite.candidato || '',
      cargo: comite.cargo || 'Deputado Federal',
      partido: comite.partido || '',
      numero: comite.numero || '',
      cnpjCampanha: comite.cnpjCampanha || '',
      responsavel: comite.responsavel || '',
      cargoResponsavel: comite.cargoResponsavel || 'Responsável',
      telefone: comite.telefone || '',
      email: comite.email || '',
      endereco: comite.endereco || '',
      numeroEnd: comite.numeroEnd || '',
      bairro: comite.bairro || '',
      cidade: comite.cidade || 'Rio de Janeiro',
      uf: comite.uf || 'RJ',
      cep: comite.cep || '',
      regiaoRota: comite.regiaoRota || 'Zona Norte',
      origemCliente: comite.origemCliente || 'rosane',
      data: dataEfetiva,
      horario: horarioEfetivo,
      dataAgendada: dataEfetiva,
      horarioAgendado: horarioEfetivo,
      interferencia: comite.interferencia || '',
      materiais: comite.materiais || ['perfurado'],
      modeloCarro: comite.modeloCarro || '',
      zonaEleitoral: comite.zonaEleitoral || '',
      secoesAtendidas: comite.secoesAtendidas || '',
      valorBaseRota: comite.valorBaseRota || 45,
      status: comite.status || 'ativo',
      observacoes: comite.observacoes || '',
    });
    setIsModalOpen(true);
  };

  const handleToggleMaterial = (matId: string) => {
    setFormData((prev) => {
      const exists = prev.materiais.includes(matId);
      if (exists) {
        return { ...prev, materiais: prev.materiais.filter((m) => m !== matId) };
      } else {
        return { ...prev, materiais: [...prev.materiais, matId] };
      }
    });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setFormError(null);

    // Validação básica obrigatória
    if (!formData.nome || !formData.nome.trim()) {
      setFormError('Por favor, informe o Nome do Cliente / Comitê.');
      setModalTab('origem');
      return;
    }

    if (!formData.telefone || !formData.telefone.trim()) {
      setFormError('Por favor, informe o Telefone / WhatsApp do Cliente.');
      setModalTab('origem');
      return;
    }

    // Região / Rota: se não selecionada, aplicar sugestão inteligente ou valor padrão ('Zona Norte')
    const finalRegiaoRota: RegiaoRota = formData.regiaoRota || (sugestaoRegiao?.regiao as RegiaoRota) || 'Zona Norte';
    const finalCandidato = (formData.candidato && formData.candidato.trim()) ? formData.candidato.trim() : formData.nome.trim();
    const finalEndereco = (formData.endereco && formData.endereco.trim()) ? formData.endereco.trim() : 'A definir / Retirada';
    const finalCep = (formData.cep && formData.cep.trim()) ? formData.cep.trim() : '20000-000';
    const finalData = formData.dataAgendada || formData.data || new Date().toISOString().slice(0, 10);
    const finalHorario = formData.horarioAgendado || formData.horario || '14:00';

    const payload = {
      ...formData,
      nome: formData.nome.trim(),
      candidato: finalCandidato,
      telefone: formData.telefone.trim(),
      endereco: finalEndereco,
      cep: finalCep,
      regiaoRota: finalRegiaoRota,
      data: finalData,
      horario: finalHorario,
      dataAgendada: finalData,
      horarioAgendado: finalHorario,
    };

    setIsSaving(true);
    try {
      if (editingComite) {
        await onUpdateComite({
          ...editingComite,
          ...payload,
        });
        showToast(`Cliente "${payload.nome}" atualizado com sucesso!`);
      } else {
        await onAddComite(payload);
        showToast(`Cliente "${payload.nome}" cadastrado com sucesso!`);
      }
      setIsModalOpen(false);
      setEditingComite(null);
    } catch (err: any) {
      console.error('Erro ao salvar cliente:', err);
      setFormError(err?.message || 'Erro ao processar o cadastro do cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Nome do Cliente',
      'Candidato/Titular',
      'Regiao/Rota',
      'Origem / Indicacao',
      'Data Agendada',
      'Horario Agendado',
      'Status Agendamento',
      'Interferencia',
      'Telefone',
      'Endereco Completo',
      'CEP',
      'Materiais Solicitados',
      'Modelo do Carro',
      'Responsavel',
      'Status',
      'Total Entregas',
      'Volume Materiais',
    ];

    const rows = filteredComites.map((c) => {
      const dataEfetiva = c.dataAgendada || c.data || '';
      const horarioEfetivo = c.horarioAgendado || c.horario || '';
      const agendamentoInfo = getDataAgendadaInfo(dataEfetiva, horarioEfetivo);

      return [
        c.id,
        `"${c.nome}"`,
        `"${c.candidato}"`,
        `"${c.regiaoRota || 'Rota não definida'}"`,
        `"${c.origemCliente || 'esther'}"`,
        `"${dataEfetiva}"`,
        `"${horarioEfetivo}"`,
        `"${agendamentoInfo.label}"`,
        `"${(c.interferencia || '').replace(/"/g, '""')}"`,
        `"${c.telefone}"`,
        `"${c.endereco}, ${c.numeroEnd} - ${c.bairro}, ${c.cidade}/${c.uf}"`,
        `"${c.cep || ''}"`,
        `"${(c.materiais || []).join(', ')}"`,
        `"${c.modeloCarro || ''}"`,
        `"${c.responsavel}"`,
        c.status,
        c.totalEntregas,
        c.volumeTotalMateriais,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clientes_fleetmoto_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getOrigemBadge = (origem?: OrigemCliente) => {
    const found = OPCOES_ORIGEM.find((o) => o.id === (origem || 'esther'));
    if (!found) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          Esther
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${found.badgeClass}`}
      >
        {renderOrigemIcon(found.id, 'w-3 h-3')}
        <span className="capitalize">{found.label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Seção: Clientes Cadastrados vs Criação de Rotas */}
      <div className="flex items-center justify-between bg-white p-2.5 rounded-3xl border border-slate-200 shadow-xs flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setSecaoAtiva('lista_clientes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              secaoAtiva === 'lista_clientes'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#E05328]" />
            <span>Clientes Cadastrados ({comites.length})</span>
          </button>

          <button
            onClick={() => {
              setClienteParaRotaId(null);
              setSecaoAtiva('criacao_rotas');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              secaoAtiva === 'criacao_rotas'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Navigation className="w-4 h-4 text-blue-600" />
            <span>Criação de Rotas</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E05328] text-white font-black">
              4 Regiões
            </span>
          </button>
        </div>

        {secaoAtiva === 'lista_clientes' && (
          <button
            id="open-novo-comite-modal-btn"
            onClick={handleOpenNewModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold text-white bg-[#E05328] hover:bg-orange-700 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>
        )}
      </div>

      {/* Renderização Condicional: Seção Criação de Rotas */}
      {secaoAtiva === 'criacao_rotas' ? (
        <RotasClienteView initialClienteId={clienteParaRotaId} />
      ) : (
        <>
          {/* 4 Indicadores Principais de Região / Rota + Total & Sem Rota */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Zona Norte (Azul) */}
            <div
              onClick={() => {
                setFiltroRegiao(filtroRegiao === 'Zona Norte' ? 'todas' : 'Zona Norte');
                setCurrentPage(1);
              }}
              className={`p-3.5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
                filtroRegiao === 'Zona Norte'
                  ? 'bg-blue-100/90 border-blue-400 ring-2 ring-blue-300 shadow-sm'
                  : 'bg-blue-50/50 border-blue-200 hover:border-blue-300 hover:bg-blue-50/80'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <p className="text-[11px] font-black text-blue-900 uppercase tracking-wider">
                    Zona Norte
                  </p>
                </div>
                <h3 className="text-xl font-black text-blue-900 mt-1">
                  {clientesZonaNorteCount}{' '}
                  <span className="text-xs font-semibold text-blue-700">clientes</span>
                </h3>
                <p className="text-[10px] text-blue-600 font-medium mt-0.5">
                  {filtroRegiao === 'Zona Norte' ? '● Filtro ativo' : 'Tijuca, Méier, Madureira...'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs font-bold shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
            </div>

            {/* Zona Oeste (Laranja) */}
            <div
              onClick={() => {
                setFiltroRegiao(filtroRegiao === 'Zona Oeste' ? 'todas' : 'Zona Oeste');
                setCurrentPage(1);
              }}
              className={`p-3.5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
                filtroRegiao === 'Zona Oeste'
                  ? 'bg-orange-100/90 border-orange-400 ring-2 ring-orange-300 shadow-sm'
                  : 'bg-orange-50/50 border-orange-200 hover:border-orange-300 hover:bg-orange-50/80'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                  <p className="text-[11px] font-black text-orange-900 uppercase tracking-wider">
                    Zona Oeste
                  </p>
                </div>
                <h3 className="text-xl font-black text-orange-900 mt-1">
                  {clientesZonaOesteCount}{' '}
                  <span className="text-xs font-semibold text-orange-700">clientes</span>
                </h3>
                <p className="text-[10px] text-orange-600 font-medium mt-0.5">
                  {filtroRegiao === 'Zona Oeste' ? '● Filtro ativo' : 'Barra, Recreio, Campo Grande...'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs font-bold shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
            </div>

            {/* Baixada Fluminense (Verde) */}
            <div
              onClick={() => {
                setFiltroRegiao(filtroRegiao === 'Baixada Fluminense' ? 'todas' : 'Baixada Fluminense');
                setCurrentPage(1);
              }}
              className={`p-3.5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
                filtroRegiao === 'Baixada Fluminense'
                  ? 'bg-emerald-100/90 border-emerald-400 ring-2 ring-emerald-300 shadow-sm'
                  : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/80'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <p className="text-[11px] font-black text-emerald-900 uppercase tracking-wider">
                    Baixada Fluminense
                  </p>
                </div>
                <h3 className="text-xl font-black text-emerald-900 mt-1">
                  {clientesBaixadaCount}{' '}
                  <span className="text-xs font-semibold text-emerald-700">clientes</span>
                </h3>
                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                  {filtroRegiao === 'Baixada Fluminense' ? '● Filtro ativo' : 'Caxias, Nova Iguaçu, Belford Roxo...'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs font-bold shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
            </div>

            {/* Niterói / São Gonçalo (Roxo) */}
            <div
              onClick={() => {
                setFiltroRegiao(filtroRegiao === 'Niterói / São Gonçalo' ? 'todas' : 'Niterói / São Gonçalo');
                setCurrentPage(1);
              }}
              className={`p-3.5 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
                filtroRegiao === 'Niterói / São Gonçalo'
                  ? 'bg-purple-100/90 border-purple-400 ring-2 ring-purple-300 shadow-sm'
                  : 'bg-purple-50/50 border-purple-200 hover:border-purple-300 hover:bg-purple-50/80'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  <p className="text-[11px] font-black text-purple-900 uppercase tracking-wider">
                    Niterói / São Gonçalo
                  </p>
                </div>
                <h3 className="text-xl font-black text-purple-900 mt-1">
                  {clientesNiteroiSGCount}{' '}
                  <span className="text-xs font-semibold text-purple-700">clientes</span>
                </h3>
                <p className="text-[10px] text-purple-600 font-medium mt-0.5">
                  {filtroRegiao === 'Niterói / São Gonçalo' ? '● Filtro ativo' : 'Icaraí, Centro, Alcântara, Neves...'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs font-bold shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Aviso se houver clientes com Rota não definida */}
          {clientesSemRotaCount > 0 && (
            <div
              onClick={() => {
                setFiltroRegiao('sem_rota');
                setCurrentPage(1);
              }}
              className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 cursor-pointer hover:bg-amber-100/70 transition-all shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold">
                    {clientesSemRotaCount} cliente(s) cadastrado(s) com status <strong>Rota não definida</strong>
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Clique aqui para filtrar esses clientes e definir a Região/Rota correspondente na edição.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-800 underline shrink-0">
                Filtrar sem rota →
              </span>
            </div>
          )}

          {/* Secondary Origin & Total Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {/* Total Geral */}
            <div 
              onClick={() => { setOrigemFilter('todos'); setFiltroRegiao('todas'); setCurrentPage(1); }}
              className={`p-3 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
                origemFilter === 'todos' && filtroRegiao === 'todas'
                  ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Geral
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-base font-black text-slate-900">
                    {comites.length}
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    ({comites.filter((c) => c.status === 'ativo').length} ativos)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[9px] font-bold flex-wrap">
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    <Shield className="w-2.5 h-2.5 text-slate-500" />
                    {clientesPrataCount} Prata
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    <Crown className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                    {clientesOuroCount} Ouro
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#E05328] flex items-center justify-center border border-orange-100 shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Indicações Rosane */}
            <div 
              onClick={() => { setOrigemFilter(origemFilter === 'rosane' ? 'todos' : 'rosane'); setCurrentPage(1); }}
              className={`p-3 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
                origemFilter === 'rosane'
                  ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-300'
                  : 'bg-white border-slate-200 hover:border-purple-200 hover:bg-purple-50/30'
              }`}
            >
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-[10px] font-black text-purple-800 uppercase tracking-wider">
                    Rosane
                  </p>
                  <UserCheck className="w-3 h-3 text-purple-600" />
                </div>
                <h3 className="text-base font-black text-purple-800 mt-0.5">
                  {clientesRosaneCount}
                </h3>
                <p className="text-[10px] text-purple-600 font-medium mt-0.5">
                  {origemFilter === 'rosane' ? 'Filtro ativo' : 'Indicação'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200 shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Indicações Esther */}
            <div 
              onClick={() => { setOrigemFilter(origemFilter === 'esther' ? 'todos' : 'esther'); setCurrentPage(1); }}
              className={`p-3 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
                origemFilter === 'esther'
                  ? 'bg-fuchsia-50 border-fuchsia-400 ring-2 ring-fuchsia-300'
                  : 'bg-white border-slate-200 hover:border-fuchsia-200 hover:bg-fuchsia-50/30'
              }`}
            >
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-[10px] font-black text-fuchsia-800 uppercase tracking-wider">
                    Esther
                  </p>
                  <Star className="w-2.5 h-2.5 text-fuchsia-600 fill-fuchsia-600" />
                </div>
                <h3 className="text-base font-black text-fuchsia-800 mt-0.5">
                  {clientesEstherCount}
                </h3>
                <p className="text-[10px] text-fuchsia-600 font-medium mt-0.5">
                  {origemFilter === 'esther' ? 'Filtro ativo' : 'Indicação'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-fuchsia-100 text-fuchsia-700 flex items-center justify-center border border-fuchsia-200 shrink-0">
                <Star className="w-4 h-4 fill-fuchsia-600 text-fuchsia-600" />
              </div>
            </div>

            {/* Instagram / Leads */}
            <div 
              onClick={() => { setOrigemFilter(origemFilter === 'Instagram' ? 'todos' : 'Instagram'); setCurrentPage(1); }}
              className={`p-3 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
                origemFilter === 'Instagram'
                  ? 'bg-pink-50 border-pink-400 ring-2 ring-pink-300'
                  : 'bg-white border-slate-200 hover:border-pink-200 hover:bg-pink-50/30'
              }`}
            >
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-[10px] font-bold text-pink-700 uppercase tracking-wider">
                    Instagram
                  </p>
                  <Share2 className="w-2.5 h-2.5 text-pink-600" />
                </div>
                <h3 className="text-base font-black text-pink-700 mt-0.5">
                  {clientesInstagramCount}
                </h3>
                <p className="text-[10px] text-pink-600 font-medium mt-0.5">
                  {origemFilter === 'Instagram' ? 'Filtro ativo' : 'Redes'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center border border-pink-200 shrink-0">
                <Share2 className="w-4 h-4" />
              </div>
            </div>

            {/* Descrição / Direto */}
            <div 
              onClick={() => { setOrigemFilter(origemFilter === 'descricao' ? 'todos' : 'descricao'); setCurrentPage(1); }}
              className={`p-3 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
                origemFilter === 'descricao'
                  ? 'bg-teal-50 border-teal-400 ring-2 ring-teal-300'
                  : 'bg-white border-slate-200 hover:border-teal-200 hover:bg-teal-50/30'
              }`}
            >
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                    Descrição
                  </p>
                  <FileText className="w-2.5 h-2.5 text-teal-600" />
                </div>
                <h3 className="text-base font-black text-teal-800 mt-0.5">
                  {clientesDescricaoCount}
                </h3>
                <p className="text-[10px] text-teal-600 font-medium mt-0.5">
                  {origemFilter === 'descricao' ? 'Filtro ativo' : 'Direto'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center border border-teal-200 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
            </div>

            {/* Clientes CRM */}
            <div 
              onClick={() => { setOrigemFilter(origemFilter === 'CRM' ? 'todos' : 'CRM'); setCurrentPage(1); }}
              className={`p-3 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
                origemFilter === 'CRM'
                  ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300'
                  : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-blue-50/30'
              }`}
            >
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                    CRM
                  </p>
                  <Briefcase className="w-2.5 h-2.5 text-blue-600" />
                </div>
                <h3 className="text-base font-black text-blue-700 mt-0.5">
                  {clientesCRMCount}
                </h3>
                <p className="text-[10px] text-blue-600 font-medium mt-0.5">
                  {origemFilter === 'CRM' ? 'Filtro ativo' : 'Base de dados'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>

            {/* Prata */}
            <div 
              onClick={() => { setOrigemFilter(origemFilter === 'prata' ? 'todos' : 'prata'); setCurrentPage(1); }}
              className={`p-3 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
                origemFilter === 'prata'
                  ? 'bg-slate-200/90 border-slate-400 ring-2 ring-slate-400 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">
                    Prata
                  </p>
                  <Shield className="w-2.5 h-2.5 text-slate-600" />
                </div>
                <h3 className="text-base font-black text-slate-800 mt-0.5">
                  {clientesPrataCount}
                </h3>
                <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                  {origemFilter === 'prata' ? 'Filtro ativo' : 'Intermediário'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-300 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
            </div>

            {/* Ouro */}
            <div 
              onClick={() => { setOrigemFilter(origemFilter === 'ouro' ? 'todos' : 'ouro'); setCurrentPage(1); }}
              className={`p-3 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
                origemFilter === 'ouro'
                  ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/40'
              }`}
            >
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                    Ouro
                  </p>
                  <Crown className="w-2.5 h-2.5 text-amber-700 fill-amber-500" />
                </div>
                <h3 className="text-base font-black text-amber-900 mt-0.5">
                  {clientesOuroCount}
                </h3>
                <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                  {origemFilter === 'ouro' ? 'Filtro ativo' : 'Prioritário'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-300 shrink-0">
                <Crown className="w-4 h-4 fill-amber-500 text-amber-700" />
              </div>
            </div>
          </div>

          {/* Agendamentos Rápidos / Status de Data Agendada */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setFiltroDataAgendada(filtroDataAgendada === 'hoje' ? 'todas' : 'hoje');
                setCurrentPage(1);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                filtroDataAgendada === 'hoje'
                  ? 'bg-emerald-100/80 border-emerald-500 ring-2 ring-emerald-400 shadow-xs'
                  : 'bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-50 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-2xs">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-950 uppercase tracking-wider">
                    Agendados Hoje
                  </p>
                  <p className="text-xs font-black text-emerald-800">
                    {agendadosHojeCount} cliente(s)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-white/80 px-1.5 py-0.5 rounded border border-emerald-200">
                {filtroDataAgendada === 'hoje' ? 'Filtro Ativo' : 'Filtrar'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFiltroDataAgendada(filtroDataAgendada === 'amanha' ? 'todas' : 'amanha');
                setCurrentPage(1);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                filtroDataAgendada === 'amanha'
                  ? 'bg-blue-100/80 border-blue-500 ring-2 ring-blue-400 shadow-xs'
                  : 'bg-blue-50/60 border-blue-200/80 hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-2xs">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-950 uppercase tracking-wider">
                    Agendados Amanhã
                  </p>
                  <p className="text-xs font-black text-blue-800">
                    {agendadosAmanhaCount} cliente(s)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-white/80 px-1.5 py-0.5 rounded border border-blue-200">
                {filtroDataAgendada === 'amanha' ? 'Filtro Ativo' : 'Filtrar'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFiltroDataAgendada(filtroDataAgendada === 'semana' ? 'todas' : 'semana');
                setCurrentPage(1);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                filtroDataAgendada === 'semana'
                  ? 'bg-purple-100/80 border-purple-500 ring-2 ring-purple-400 shadow-xs'
                  : 'bg-purple-50/60 border-purple-200/80 hover:bg-purple-50 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-black shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-purple-950 uppercase tracking-wider">
                    Próximos 7 Dias
                  </p>
                  <p className="text-xs font-black text-purple-800">
                    {agendadosSemanaCount} cliente(s)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-white/80 px-1.5 py-0.5 rounded border border-purple-200">
                {filtroDataAgendada === 'semana' ? 'Filtro Ativo' : 'Filtrar'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFiltroDataAgendada(filtroDataAgendada === 'sem_data' ? 'todas' : 'sem_data');
                setCurrentPage(1);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                filtroDataAgendada === 'sem_data'
                  ? 'bg-amber-100/80 border-amber-500 ring-2 ring-amber-400 shadow-xs'
                  : 'bg-amber-50/60 border-amber-200/80 hover:bg-amber-50 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-black shadow-2xs">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-amber-950 uppercase tracking-wider">
                    Sem Agendamento
                  </p>
                  <p className="text-xs font-black text-amber-800">
                    {semAgendamentoCount} cliente(s)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-white/80 px-1.5 py-0.5 rounded border border-amber-200">
                {filtroDataAgendada === 'sem_data' ? 'Filtro Ativo' : 'Filtrar'}
              </span>
            </button>
          </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Header with Title and Global Actions */}
        <div className="p-4 lg:p-5 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base lg:text-lg font-bold text-slate-900">
                  Lista de Clientes, Regiões/Rotas & Datas Agendadas
                </h2>
                {filtroRegiao !== 'todas' && (
                  <span className="text-xs bg-slate-900 text-white font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-orange-400" />
                    <span>Filtro Rota: {filtroRegiao === 'sem_rota' ? 'Sem Rota' : filtroRegiao}</span>
                    <button
                      onClick={() => setFiltroRegiao('todas')}
                      className="ml-1 hover:text-rose-300 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filtroDataAgendada !== 'todas' && (
                  <span className="text-xs bg-[#E05328] text-white font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-white" />
                    <span>
                      Data: {filtroDataAgendada === 'hoje' ? 'Hoje' : filtroDataAgendada === 'amanha' ? 'Amanhã' : filtroDataAgendada === 'semana' ? 'Próximos 7 Dias' : filtroDataAgendada === 'sem_data' ? 'Sem Data' : filtroDataEspecifica}
                    </span>
                    <button
                      onClick={() => {
                        setFiltroDataAgendada('todas');
                        setFiltroDataEspecifica('');
                      }}
                      className="ml-1 hover:text-rose-200 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Organização por <strong>Data Agendada</strong>, <strong>Região/Rota</strong> (Zona Norte, Zona Oeste, Baixada Fluminense, Niterói / SG), abas de origem, materiais e dados de entrega.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="btn-relatorio-pdf-clientes"
                onClick={() => setIsPdfModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-900 bg-orange-50 hover:bg-orange-100 border border-orange-200 hover:border-orange-300 shadow-2xs transition-all cursor-pointer"
                title="Visualizar, Configurar e Imprimir Relatório Oficial em PDF"
              >
                <Printer className="w-4 h-4 text-[#E05328]" />
                <span>Imprimir Relatório (PDF)</span>
              </button>

              <button
                id="btn-novo-cliente"
                onClick={handleOpenNewModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#E05328] hover:bg-orange-700 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Cliente</span>
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 mt-4 pt-3 border-t border-slate-100">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="comites-search-filter"
                type="text"
                placeholder="Buscar por nome, data (AAAA-MM-DD), CEP, rota..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtro de Data Agendada */}
            <div>
              <select
                id="comites-data-agendada-filter"
                value={filtroDataAgendada}
                onChange={(e) => {
                  setFiltroDataAgendada(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328]"
              >
                <option value="todas">📅 Data Agendada: Todas</option>
                <option value="hoje">🟢 Agendados Hoje ({agendadosHojeCount})</option>
                <option value="amanha">🔵 Agendados Amanhã ({agendadosAmanhaCount})</option>
                <option value="semana">🗓️ Próximos 7 Dias ({agendadosSemanaCount})</option>
                <option value="sem_data">⚠️ Sem Agendamento ({semAgendamentoCount})</option>
                <option value="especifica">🎯 Escolher Data Específica...</option>
              </select>
            </div>

            {/* Região / Rota Filter */}
            <div>
              <select
                id="comites-regiao-filter"
                value={filtroRegiao}
                onChange={(e) => {
                  setFiltroRegiao(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-hidden focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328]"
              >
                <option value="todas">Região/Rota: Todas</option>
                <option value="Zona Norte">Zona Norte (Azul) ({clientesZonaNorteCount})</option>
                <option value="Zona Oeste">Zona Oeste (Laranja) ({clientesZonaOesteCount})</option>
                <option value="Baixada Fluminense">Baixada Fluminense (Verde) ({clientesBaixadaCount})</option>
                <option value="Niterói / São Gonçalo">Niterói / São Gonçalo (Roxo) ({clientesNiteroiSGCount})</option>
                <option value="sem_rota">Rota não definida ({clientesSemRotaCount})</option>
              </select>
            </div>

            {/* Origem / Indicação Filter */}
            <div>
              <select
                id="comites-origem-filter"
                value={origemFilter}
                onChange={(e) => {
                  setOrigemFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328]"
              >
                <option value="todos">Origem / Indicação: Todas</option>
                <option value="rosane">Origem: Rosane</option>
                <option value="esther">Indicação: Esther</option>
                <option value="Instagram">Origem: Instagram</option>
                <option value="descricao">Origem: Descrição</option>
                <option value="CRM">Origem: CRM</option>
                <option value="prata">Origem: Prata</option>
                <option value="ouro">Origem: Ouro</option>
              </select>
            </div>

            {/* Material & Status Filter */}
            <div>
              <select
                id="comites-material-filter"
                value={materialFilter}
                onChange={(e) => {
                  setMaterialFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328]"
              >
                <option value="todos">Material: Todos</option>
                <option value="perfurado">🚗 Perfurado</option>
                <option value="revista">📖 Revista</option>
                <option value="cartao">📇 Cartão</option>
                <option value="santao">📑 Santão</option>
                <option value="pragao">🔴 Pragão</option>
                <option value="adesivos_15x40">🏷️ Adesivos 15x40</option>
              </select>
            </div>
          </div>

          {/* Date Picker para Data Específica quando selecionada */}
          {filtroDataAgendada === 'especifica' && (
            <div className="mt-2.5 p-2.5 bg-orange-50/80 rounded-xl border border-orange-200 flex items-center gap-3 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#E05328]" />
                <span>Selecione a Data Agendada para filtrar:</span>
              </span>
              <input
                type="date"
                value={filtroDataEspecifica}
                onChange={(e) => {
                  setFiltroDataEspecifica(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 text-xs border border-orange-300 rounded-lg bg-white font-bold text-slate-900 focus:ring-2 focus:ring-[#E05328]/30"
              />
              {filtroDataEspecifica && (
                <span className="text-xs font-semibold text-orange-900">
                  Exibindo clientes agendados para {formatDate(filtroDataEspecifica)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Clean Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 w-8 text-center">#</th>
                <th className="py-3 px-4">Cliente / Indicação</th>
                <th className="py-3 px-3">Região / Rota</th>
                <th className="py-3 px-4">Data & Horário</th>
                <th className="py-3 px-4">Interferência</th>
                <th className="py-3 px-4">Contato</th>
                <th className="py-3 px-4">Endereço & CEP</th>
                <th className="py-3 px-4">Materiais & Carro</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedComites.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Building2 className="w-10 h-10 text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">
                        Nenhum cliente encontrado
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tente ajustar os filtros de busca ou cadastre um novo cliente.
                      </p>
                      <button
                        onClick={handleOpenNewModal}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-[#E05328] text-white text-xs font-bold cursor-pointer"
                      >
                        + Cadastrar Cliente
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedComites.map((comite, index) => {
                  const statusStyle = getStatusBadgeClass(comite.status);
                  const isDeleteConfirm = deleteConfirmId === comite.id;
                  const comiteMateriais = comite.materiais || ['perfurado'];
                  const regiaoCfg = getRegiaoRotaConfig(comite.regiaoRota);

                  return (
                    <tr
                      key={comite.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Row Index */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-400">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>

                      {/* Nome do Cliente & Indicação */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border shadow-2xs ${
                            comite.origemCliente === 'esther'
                              ? 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300'
                              : 'bg-orange-100 text-[#E05328] border-orange-200'
                          }`}>
                            {comite.origemCliente === 'esther' ? (
                              <Star className="w-4 h-4 fill-fuchsia-700 text-fuchsia-700" />
                            ) : comite.nome ? (
                              comite.nome.slice(0, 2).toUpperCase()
                            ) : (
                              'CL'
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => setSelectedComiteDetails(comite)}
                                className="font-bold text-slate-900 hover:text-[#E05328] transition-colors text-left text-xs line-clamp-1 cursor-pointer"
                              >
                                {comite.nome}
                              </button>
                              {getOrigemBadge(comite.origemCliente)}
                            </div>
                            {comite.candidato && (
                              <div className="mt-0.5 text-[11px] text-slate-500 font-medium truncate max-w-[180px]">
                                {comite.candidato}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Região / Rota */}
                      <td className="py-3 px-3">
                        {comite.regiaoRota ? (
                          <button
                            onClick={() => {
                              setFiltroRegiao(comite.regiaoRota!);
                              setCurrentPage(1);
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${regiaoCfg.badgeClass} hover:shadow-xs`}
                            title={`Filtrar apenas ${comite.regiaoRota}`}
                          >
                            <span>{regiaoCfg.icone}</span>
                            <span className="truncate">{comite.regiaoRota}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setFiltroRegiao('sem_rota');
                              setCurrentPage(1);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                            title="Rota não definida. Clique para filtrar e corrigir"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Rota não definida</span>
                          </button>
                        )}
                      </td>

                      {/* Data Agendada & Horário */}
                      <td className="py-3 px-4">
                        {(() => {
                          const info = getDataAgendadaInfo(comite.dataAgendada || comite.data, comite.horarioAgendado || comite.horario);
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md border ${info.statusBadgeClass}`}>
                                  <Calendar className="w-3 h-3" />
                                  <span>{info.formattedDate}</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium pl-0.5">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{info.formattedTime}h</span>
                                {info.statusLabel && info.statusLabel !== 'Sem data' && (
                                  <span className="text-[10px] font-bold text-slate-500">
                                    • {info.statusLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Interferência */}
                      <td className="py-3 px-4">
                        {comite.interferencia ? (
                          <div className="max-w-[200px]" title={comite.interferencia}>
                            <div className="inline-flex items-start gap-1 p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-tight">
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{comite.interferencia}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Sem interferência
                          </span>
                        )}
                      </td>

                      {/* Telefone & Contato */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://wa.me/55${comite.telefone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors text-[11px]"
                            title="Conversar no WhatsApp"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{comite.telefone}</span>
                          </a>
                        </div>
                        {comite.responsavel && (
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[130px]">
                            {comite.responsavel}
                          </div>
                        )}
                      </td>

                      {/* Endereço Completo & CEP */}
                      <td className="py-3 px-4">
                        <div className="text-slate-800 text-xs font-medium truncate max-w-[170px]" title={`${comite.endereco}, ${comite.numeroEnd}`}>
                          {comite.endereco}, {comite.numeroEnd}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                          <span>{comite.bairro}</span>
                          {comite.cep && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="font-mono text-slate-600 font-semibold bg-slate-100 px-1 rounded">
                                {comite.cep}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Materiais & Carro */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 flex-wrap max-w-[180px]">
                            {comiteMateriais.slice(0, 2).map((matId) => {
                              const opt = OPCOES_MATERIAIS.find((m) => m.id === matId);
                              if (!opt) return null;
                              return (
                                <span
                                  key={matId}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${opt.badgeClass}`}
                                >
                                  {renderMaterialIcon(matId, 'w-3 h-3')}
                                  <span>{opt.label}</span>
                                </span>
                              );
                            })}
                            {comiteMateriais.length > 2 && (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1 rounded">
                                +{comiteMateriais.length - 2}
                              </span>
                            )}
                          </div>
                          {comite.modeloCarro && (
                            <div className="flex items-center gap-1 text-[10px] text-indigo-800 font-semibold truncate max-w-[160px]">
                              <Car className="w-3 h-3 text-indigo-500 shrink-0" />
                              <span className="truncate">{comite.modeloCarro}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyle.bg} ${statusStyle.border}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}
                          />
                          <span className="capitalize">{comite.status}</span>
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        {isDeleteConfirm ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[10px] text-rose-600 font-bold mr-1">
                              Excluir?
                            </span>
                            <button
                              onClick={() => {
                                onDeleteComite(comite.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 cursor-pointer"
                            >
                              Sim
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-[11px] hover:bg-slate-300 cursor-pointer"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setClienteParaRotaId(comite.id);
                                setSecaoAtiva('criacao_rotas');
                              }}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Criar Rota de Entrega para este cliente (4 Regiões)"
                            >
                              <Navigation className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onRequestDeliveryForComite(comite)}
                              className="p-1.5 rounded-lg text-[#E05328] hover:bg-orange-50 transition-colors cursor-pointer"
                              title="Solicitar Nova Entrega para este cliente"
                            >
                              <Send className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setSelectedComiteDetails(comite)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Visualizar Ficha Completa"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenEditModal(comite)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Editar Dados do Cliente"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeleteConfirmId(comite.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Excluir Cliente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Clean Pagination Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Mostrar</span>
            <select
              id="comites-items-per-page"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value={6}>6 clientes</option>
              <option value={12}>12 clientes</option>
              <option value={24}>24 clientes</option>
            </select>
            <span>
              de <strong>{filteredComites.length}</strong> clientes filtrados
            </span>
          </div>

          <div className="flex items-center gap-1.5 justify-end">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    currentPage === page
                      ? 'bg-[#E05328] text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 transition-colors"
            >
              <span>Próxima</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Modal: Novo / Editar Cliente - Reduzido e com Abas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-5 shadow-2xl border border-slate-200 relative my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#E05328] flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {editingComite ? 'Editar Dados do Cliente' : 'Cadastrar Novo Cliente'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Selecione a aba desejada ou siga o passo a passo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Internal Tabs Bar */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl my-3 shrink-0 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setModalTab('origem')}
                className={`flex-1 min-w-[100px] py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  modalTab === 'origem'
                    ? 'bg-white text-[#E05328] shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Rosane / Origem</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('agendamento')}
                className={`flex-1 min-w-[100px] py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  modalTab === 'agendamento'
                    ? 'bg-white text-[#E05328] shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Agendamento</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('materiais')}
                className={`flex-1 min-w-[100px] py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  modalTab === 'materiais'
                    ? 'bg-white text-[#E05328] shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Materiais</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('descricao')}
                className={`flex-1 min-w-[100px] py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  modalTab === 'descricao'
                    ? 'bg-white text-[#E05328] shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Descrição</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('confirmar')}
                className={`flex-1 min-w-[120px] py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  modalTab === 'confirmar'
                    ? 'bg-white text-[#E05328] shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Confirmar Cadastro</span>
              </button>
            </div>

            {/* Form & Tab Content */}
            <form noValidate onSubmit={handleSubmitForm} className="flex flex-col flex-1 overflow-hidden">
              {/* Form Error Banner */}
              {formError && (
                <div className="mb-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in duration-150 shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Atenção ao salvar:</p>
                    <p className="text-[11px] mt-0.5">{formError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormError(null)}
                    className="text-red-400 hover:text-red-700 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 text-xs py-1">
                {/* ABA 1: Rosane & Origem / Dados Básicos */}
                {modalTab === 'origem' && (
                  <div className="space-y-3 animate-in fade-in duration-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Canal / Indicação de Origem *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {OPCOES_ORIGEM.map((origem) => {
                          const isSelected = formData.origemCliente === origem.id;
                          return (
                            <button
                              key={origem.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, origemCliente: origem.id })}
                              className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                                isSelected
                                  ? `${origem.colorClass} ring-2 ring-[#E05328]/30 font-black shadow-xs`
                                  : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="shrink-0">
                                {renderOrigemIcon(origem.id, 'w-4 h-4')}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate">
                                  {origem.label}
                                </p>
                                <p className="text-[9px] opacity-75 truncate">
                                  {origem.sublabel}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Nome do Cliente / Comitê *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Comitê Central Pinheiros"
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Nome do Candidato *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Roberto Alencar"
                          value={formData.candidato}
                          onChange={(e) => setFormData({ ...formData, candidato: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Telefone / WhatsApp *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="(11) 98765-4321"
                          value={formData.telefone}
                          onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-semibold focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Nome do Responsável
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Marcos Vinicius"
                          value={formData.responsavel}
                          onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        E-mail do Cliente
                      </label>
                      <input
                        type="email"
                        placeholder="cliente@campanha.com.br"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328]"
                      />
                    </div>
                  </div>
                )}

                {/* ABA 2: Agendamento & Endereço */}
                {modalTab === 'agendamento' && (
                  <div className="space-y-3 animate-in fade-in duration-100">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#E05328]" />
                          <span>Data Agendada, Horário e Restrições</span>
                        </p>
                        {/* Quick Presets */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const hojeStr = new Date().toISOString().split('T')[0];
                              setFormData({ ...formData, data: hojeStr, dataAgendada: hojeStr });
                            }}
                            className="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 rounded cursor-pointer"
                          >
                            Hoje
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const am = new Date();
                              am.setDate(am.getDate() + 1);
                              const amStr = am.toISOString().split('T')[0];
                              setFormData({ ...formData, data: amStr, dataAgendada: amStr });
                            }}
                            className="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 rounded cursor-pointer"
                          >
                            Amanhã
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const d7 = new Date();
                              d7.setDate(d7.getDate() + 7);
                              const d7Str = d7.toISOString().split('T')[0];
                              setFormData({ ...formData, data: d7Str, dataAgendada: d7Str });
                            }}
                            className="px-2 py-0.5 text-[10px] font-bold bg-white hover:bg-purple-50 text-purple-700 border border-slate-200 rounded cursor-pointer"
                          >
                            +7 Dias
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Data do Agendamento *
                          </label>
                          <input
                            type="date"
                            required
                            value={formData.dataAgendada || formData.data}
                            onChange={(e) => setFormData({ ...formData, data: e.target.value, dataAgendada: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-semibold focus:ring-2 focus:ring-[#E05328]/30"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Horário Agendado *
                          </label>
                          <input
                            type="time"
                            required
                            value={formData.horarioAgendado || formData.horario}
                            onChange={(e) => setFormData({ ...formData, horario: e.target.value, horarioAgendado: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-semibold focus:ring-2 focus:ring-[#E05328]/30"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Interferência Operacional
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Trânsito, feira, restrição de horário..."
                            value={formData.interferencia}
                            onChange={(e) => setFormData({ ...formData, interferencia: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-[#E05328]/30"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                      <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#E05328]" />
                        <span>Local de Entrega / Endereço</span>
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                            Logradouro & Número / Complemento *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Av. Brigadeiro Faria Lima, 1800"
                            value={formData.endereco}
                            onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-[#E05328]/30"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                            CEP *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="01451-000"
                            value={formData.cep}
                            onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-mono font-semibold focus:ring-2 focus:ring-[#E05328]/30"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                            Bairro
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Tijuca / Barra da Tijuca"
                            value={formData.bairro}
                            onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-[#E05328]/30"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                            Cidade
                          </label>
                          <input
                            type="text"
                            placeholder="Rio de Janeiro"
                            value={formData.cidade}
                            onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-[#E05328]/30"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                            UF
                          </label>
                          <input
                            type="text"
                            maxLength={2}
                            placeholder="RJ"
                            value={formData.uf}
                            onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white uppercase font-bold focus:ring-2 focus:ring-[#E05328]/30"
                          />
                        </div>
                      </div>

                      {/* Campo Obrigatório: Região / Rota */}
                      <div className="pt-2 border-t border-slate-200/80">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                            <Navigation className="w-3.5 h-3.5 text-[#E05328]" />
                            <span>Região / Rota Principal *</span>
                          </label>
                          <span className="text-[10px] font-bold text-[#E05328] uppercase tracking-wider">
                            Obrigatório
                          </span>
                        </div>

                        <select
                          id="form-cliente-regiao-rota"
                          required
                          value={formData.regiaoRota || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              regiaoRota: e.target.value as RegiaoRota,
                            })
                          }
                          className="w-full px-2.5 py-2 text-xs border-2 border-[#E05328]/40 rounded-xl bg-white font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328] transition-all"
                        >
                          <option value="" disabled>
                            -- Selecione a Região / Rota Principal (Obrigatório) --
                          </option>
                          {OPCOES_REGIAO_ROTA.map((opcao) => (
                            <option key={opcao.id} value={opcao.id}>
                              {opcao.icon} {opcao.label} — {opcao.descricao}
                            </option>
                          ))}
                        </select>

                        {/* Banner de Sugestão Automática por CEP/Bairro */}
                        {sugestaoRegiao && (
                          <div className="mt-2 p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-base shrink-0">✨</span>
                              <div>
                                <p className="font-bold text-blue-900 leading-tight">
                                  Sugestão inteligente identificada:{' '}
                                  <span className="underline">{sugestaoRegiao.regiao}</span>
                                </p>
                                <p className="text-[10px] text-blue-700">
                                  {sugestaoRegiao.motivo}
                                </p>
                              </div>
                            </div>
                            {formData.regiaoRota !== sugestaoRegiao.regiao && (
                              <button
                                type="button"
                                onClick={handleAplicarSugestaoRegiao}
                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-2xs"
                              >
                                Aplicar {sugestaoRegiao.regiao.split(' ')[0]}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Alerta de Divergência se selecionou rota divergente do CEP */}
                        {divergenciaCepAviso && (
                          <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <strong>Atenção:</strong> {divergenciaCepAviso}
                            </div>
                          </div>
                        )}

                        {/* Preview da Região Selecionada */}
                        {formData.regiaoRota && (
                          <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                            {(() => {
                              const cfg = getRegiaoRotaConfig(formData.regiaoRota);
                              return (
                                <>
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black border ${cfg.badgeClass}`}>
                                    <span>{cfg.icone}</span>
                                    <span>{formData.regiaoRota}</span>
                                  </span>
                                  <span className="text-[11px] text-slate-500 truncate">
                                    {cfg.descricao}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA 3: Materiais & Modelo do Carro */}
                {modalTab === 'materiais' && (
                  <div className="space-y-3 animate-in fade-in duration-100">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-[#E05328]" />
                          <span>Materiais de Interesse:</span>
                        </label>
                        <span className="text-[10px] text-[#E05328] font-bold">
                          {formData.materiais.length} selecionado(s)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {OPCOES_MATERIAIS.map((mat) => {
                          const isChecked = formData.materiais.includes(mat.id);
                          return (
                            <button
                              key={mat.id}
                              type="button"
                              onClick={() => handleToggleMaterial(mat.id)}
                              className={`p-2 rounded-xl border text-left flex items-start gap-1.5 transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-orange-50/50 border-[#E05328] ring-1 ring-[#E05328] shadow-2xs'
                                  : 'bg-white border-slate-200 hover:border-slate-300 opacity-80'
                              }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded mt-0.5 flex items-center justify-center border shrink-0 transition-all ${
                                  isChecked
                                    ? 'bg-[#E05328] border-[#E05328] text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                              <div className="min-w-0 flex items-center gap-1.5">
                                {renderMaterialIcon(mat.id, 'w-3.5 h-3.5 text-slate-700')}
                                <div>
                                  <p className="text-[11px] font-bold text-slate-800 truncate">
                                    {mat.label}
                                  </p>
                                  <p className="text-[9px] text-slate-400 truncate">
                                    {mat.sublabel}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center gap-1">
                        <Car className="w-3.5 h-3.5 text-[#E05328]" />
                        <span>Modelo do Carro (para aplicação de perfurados)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Fiat Strada Endurance 2024 / Hilux / Gol G8"
                        value={formData.modeloCarro}
                        onChange={(e) => setFormData({ ...formData, modeloCarro: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-[#E05328]/30 font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* ABA 4: Descrição & Status */}
                {modalTab === 'descricao' && (
                  <div className="space-y-3 animate-in fade-in duration-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Status de Atendimento
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value as StatusComite })
                        }
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white font-semibold focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328]"
                      >
                        <option value="ativo">Ativo (Rotas e Despachos Liberados)</option>
                        <option value="pendente">Pendente (Aguardando Aprovação)</option>
                        <option value="inativo">Inativo (Bloqueado)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Aba Descrição & Observações Operacionais
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Insira a descrição detalhada do pedido, restrições de entrega, referências de rota ou instruções para a equipe..."
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#E05328]/30 focus:border-[#E05328]"
                      />
                    </div>
                  </div>
                )}

                {/* ABA 5: Confirmar Cadastro & Resumo */}
                {modalTab === 'confirmar' && (
                  <div className="space-y-3 animate-in fade-in duration-100">
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
                      <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-emerald-950 text-xs">
                          Revisão e Confirmação dos Dados Cadastrais
                        </h4>
                        <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                          Verifique os dados abaixo antes de finalizar. Ao confirmar, o cliente será gravado no sistema e estará imediatamente disponível para rotas e pedidos.
                        </p>
                      </div>
                    </div>

                    {/* Resumo em Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Bloco 1: Identificação */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#E05328]" />
                          <span>Identificação do Cliente / Campanha</span>
                        </p>
                        <div className="text-[11px] space-y-1 text-slate-700">
                          <p><span className="font-semibold text-slate-500">Nome:</span> <strong className="text-slate-900">{formData.nome || <span className="text-red-500 italic">Não informado</span>}</strong></p>
                          <p><span className="font-semibold text-slate-500">Candidato:</span> {formData.candidato || formData.nome || '-'}</p>
                          <p><span className="font-semibold text-slate-500">Cargo / Partido:</span> {formData.cargo} {formData.partido ? `• ${formData.partido}` : ''} {formData.numero ? `(${formData.numero})` : ''}</p>
                          {formData.cnpjCampanha && <p><span className="font-semibold text-slate-500">CNPJ:</span> {formData.cnpjCampanha}</p>}
                          <div className="pt-1 flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-slate-500">Origem:</span>
                            {(() => {
                              const opc = OPCOES_ORIGEM.find(o => o.id === formData.origemCliente);
                              return (
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${opc?.colorClass || 'bg-slate-100 text-slate-700'}`}>
                                  {opc?.label || formData.origemCliente}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Bloco 2: Contato & Endereço */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#E05328]" />
                          <span>Local de Entrega & Contato</span>
                        </p>
                        <div className="text-[11px] space-y-1 text-slate-700">
                          <p><span className="font-semibold text-slate-500">WhatsApp / Tel:</span> <strong className="text-slate-900">{formData.telefone || <span className="text-red-500 italic">Não informado</span>}</strong></p>
                          {formData.email && <p><span className="font-semibold text-slate-500">E-mail:</span> {formData.email}</p>}
                          <p><span className="font-semibold text-slate-500">Endereço:</span> {formData.endereco || 'A definir / Retirada'}</p>
                          <p><span className="font-semibold text-slate-500">Bairro / CEP:</span> {formData.bairro ? `${formData.bairro}, ` : ''}{formData.cidade} - {formData.uf} {formData.cep ? `(${formData.cep})` : ''}</p>
                          <div className="pt-1 flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-slate-500">Região / Rota:</span>
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-orange-100 text-[#E05328] border border-orange-200">
                              {formData.regiaoRota || 'Zona Norte'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bloco 3: Agendamento & Materiais */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#E05328]" />
                          <span>Data de Agendamento & Materiais</span>
                        </p>
                        <div className="text-[11px] space-y-1 text-slate-700">
                          {(() => {
                            const dateVal = formData.dataAgendada || formData.data;
                            const timeVal = formData.horarioAgendado || formData.horario;
                            const info = getDataAgendadaInfo(dateVal, timeVal);
                            return (
                              <p>
                                <span className="font-semibold text-slate-500">Data Agendada:</span>{' '}
                                <strong className="text-slate-900">{info.formattedDate}</strong> às{' '}
                                <strong className="text-slate-900">{info.formattedTime}h</strong>
                                {info.statusLabel && info.statusLabel !== 'Sem data' && (
                                  <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-black border ${info.statusBadgeClass}`}>
                                    {info.statusLabel}
                                  </span>
                                )}
                              </p>
                            );
                          })()}
                          {formData.interferencia && (
                            <p><span className="font-semibold text-slate-500">Interferência:</span> {formData.interferencia}</p>
                          )}
                          {formData.modeloCarro && (
                            <p><span className="font-semibold text-slate-500">Modelo do Carro:</span> {formData.modeloCarro}</p>
                          )}
                          <div className="pt-1">
                            <span className="text-[10px] font-semibold text-slate-500 block mb-1">Materiais ({formData.materiais.length}):</span>
                            <div className="flex flex-wrap gap-1">
                              {formData.materiais.length === 0 ? (
                                <span className="text-[10px] text-slate-400 italic">Nenhum material selecionado</span>
                              ) : (
                                formData.materiais.map((mId) => {
                                  const matObj = OPCOES_MATERIAIS.find((m) => m.id === mId);
                                  return (
                                    <span key={mId} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-800">
                                      {renderMaterialIcon(mId, 'w-3 h-3 text-slate-600')}
                                      <span>{matObj?.label || mId}</span>
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bloco 4: Status & Observações */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#E05328]" />
                          <span>Status & Instruções Operacionais</span>
                        </p>
                        <div className="text-[11px] space-y-1 text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-500">Status:</span>
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${getStatusBadgeClass(formData.status)}`}>
                              {formData.status.toUpperCase()}
                            </span>
                          </div>
                          {formData.observacoes ? (
                            <div className="mt-1 p-1.5 bg-white rounded border border-slate-200 text-[10px] text-slate-600 max-h-20 overflow-y-auto">
                              {formData.observacoes}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic mt-1">Sem observações adicionais.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Call to action de confirmação direta dentro da aba */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#E05328] text-white flex items-center justify-center font-bold shrink-0">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Pronto para salvar no sistema
                          </p>
                          <p className="text-[10px] text-slate-600">
                            Clique no botão abaixo para gravar no banco de dados e fechar a tela.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleSubmitForm}
                        className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-[#E05328] hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Salvando no Firestore...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{editingComite ? 'Salvar Alterações e Fechar' : 'Confirmar e Salvar Cadastro'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons & Tab Navigation */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0 mt-2">
                <div className="flex items-center gap-1.5">
                  {modalTab !== 'origem' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (modalTab === 'confirmar') setModalTab('descricao');
                        else if (modalTab === 'descricao') setModalTab('materiais');
                        else if (modalTab === 'materiais') setModalTab('agendamento');
                        else if (modalTab === 'agendamento') setModalTab('origem');
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      ← Voltar
                    </button>
                  )}
                  {modalTab !== 'confirmar' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (modalTab === 'origem') setModalTab('agendamento');
                        else if (modalTab === 'agendamento') setModalTab('materiais');
                        else if (modalTab === 'materiais') setModalTab('descricao');
                        else if (modalTab === 'descricao') setModalTab('confirmar');
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold text-[#E05328] hover:bg-orange-50 rounded-xl transition-colors cursor-pointer"
                    >
                      Avançar →
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#E05328] hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{editingComite ? 'Salvar Alterações' : 'Confirmar Cadastro'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Visualizar Ficha Completa do Cliente */}
      {selectedComiteDetails && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#E05328]" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Ficha Cadastral do Cliente
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedComiteDetails(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                {/* Header info with Origin & Região/Rota */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-[#E05328] border border-orange-200">
                      Cliente Ativo
                    </span>
                    {getOrigemBadge(selectedComiteDetails.origemCliente)}
                  </div>
                  <h4 className="text-base font-black text-slate-900 mt-2">
                    {selectedComiteDetails.nome}
                  </h4>
                  {selectedComiteDetails.candidato && (
                    <p className="text-slate-600 font-medium mt-1">
                      Candidato / Titular: <strong>{selectedComiteDetails.candidato}</strong>
                    </p>
                  )}

                  {/* Região / Rota Badge */}
                  <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Região / Rota Principal
                      </p>
                      {selectedComiteDetails.regiaoRota ? (
                        (() => {
                          const cfg = getRegiaoRotaConfig(selectedComiteDetails.regiaoRota);
                          return (
                            <div className="mt-1">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black border ${cfg.badgeClass}`}>
                                <span>{cfg.icone}</span>
                                <span>{selectedComiteDetails.regiaoRota}</span>
                              </span>
                              <p className="text-[10px] text-slate-500 mt-1">
                                {cfg.descricao}
                              </p>
                            </div>
                          );
                        })()
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 mt-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Rota não definida
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setClienteParaRotaId(selectedComiteDetails.id);
                        setSecaoAtiva('criacao_rotas');
                        setSelectedComiteDetails(null);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Abrir módulo Criação de Rotas"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Ver Rota</span>
                    </button>
                  </div>
                </div>

                {/* Data Agendada, Horário e Interferência */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  {(() => {
                    const info = getDataAgendadaInfo(
                      selectedComiteDetails.dataAgendada || selectedComiteDetails.data,
                      selectedComiteDetails.horarioAgendado || selectedComiteDetails.horario
                    );
                    return (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#E05328]" />
                            <span>Data Agendada & Horário</span>
                          </span>
                          {info.statusLabel && info.statusLabel !== 'Sem data' && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${info.statusBadgeClass}`}>
                              {info.statusLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-black text-slate-900">
                          {info.formattedDate} às {info.formattedTime}h
                        </p>
                      </div>
                    );
                  })()}

                  {selectedComiteDetails.interferencia && (
                    <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-950 mt-1.5 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-[10px] uppercase text-amber-800">Interferência Operacional:</strong>
                        <p className="text-xs font-medium">{selectedComiteDetails.interferencia}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contato & WhatsApp */}
                <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      Telefone & WhatsApp
                    </span>
                    <a
                      href={`https://wa.me/55${selectedComiteDetails.telefone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-black text-emerald-800 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{selectedComiteDetails.telefone}</span>
                    </a>
                  </div>
                  <p className="text-emerald-900 text-[11px]">
                    Responsável: <strong>{selectedComiteDetails.responsavel}</strong> ({selectedComiteDetails.cargoResponsavel})
                  </p>
                  {selectedComiteDetails.email && (
                    <p className="text-emerald-800 text-[11px]">
                      E-mail: {selectedComiteDetails.email}
                    </p>
                  )}
                </div>

                {/* Endereço Completo & CEP */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <MapPin className="w-4 h-4 text-[#E05328]" />
                    <span>Endereço Completo</span>
                  </div>
                  <p className="text-slate-700">
                    <strong>Logradouro:</strong> {selectedComiteDetails.endereco}, {selectedComiteDetails.numeroEnd}
                  </p>
                  <p className="text-slate-700">
                    <strong>Bairro:</strong> {selectedComiteDetails.bairro}
                  </p>
                  <p className="text-slate-700">
                    <strong>Cidade / UF:</strong> {selectedComiteDetails.cidade} - {selectedComiteDetails.uf}
                  </p>
                  <p className="text-slate-700 font-mono">
                    <strong>CEP:</strong> {selectedComiteDetails.cep || 'Não informado'}
                  </p>
                </div>

                {/* Materiais Solicitados */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#E05328]" />
                    <span>Opções de Material de Interesse</span>
                  </h5>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(selectedComiteDetails.materiais || ['perfurado']).map((matId) => {
                      const opt = OPCOES_MATERIAIS.find((m) => m.id === matId);
                      if (!opt) return null;
                      return (
                        <div
                          key={matId}
                          className={`p-2 rounded-lg border flex items-center gap-2 ${opt.badgeClass}`}
                        >
                          <div className="shrink-0">
                            {renderMaterialIcon(matId, 'w-4 h-4')}
                          </div>
                          <div>
                            <p className="font-bold text-xs">{opt.label}</p>
                            <p className="text-[9px] opacity-80">{opt.sublabel}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modelo do Carro */}
                {selectedComiteDetails.modeloCarro && (
                  <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200">
                    <div className="flex items-center gap-1.5 text-indigo-900 font-bold mb-1">
                      <Car className="w-4 h-4 text-indigo-600" />
                      <span>Modelo do Carro Cadastrado</span>
                    </div>
                    <p className="text-indigo-950 font-semibold text-xs">
                      {selectedComiteDetails.modeloCarro}
                    </p>
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="text-[10px] text-emerald-800 font-semibold uppercase">
                      Total Entregas
                    </p>
                    <p className="text-xl font-black text-emerald-900 mt-0.5">
                      {selectedComiteDetails.totalEntregas}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-[10px] text-blue-800 font-semibold uppercase">
                      Materiais Entregues
                    </p>
                    <p className="text-xl font-black text-blue-900 mt-0.5">
                      {formatNumber(selectedComiteDetails.volumeTotalMateriais)}
                    </p>
                  </div>
                </div>

                {selectedComiteDetails.observacoes && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                    <strong className="block mb-0.5">Observações:</strong>
                    {selectedComiteDetails.observacoes}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center gap-2">
              <button
                onClick={() => {
                  onRequestDeliveryForComite(selectedComiteDetails);
                  setSelectedComiteDetails(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#E05328] hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Nova Entrega p/ este Cliente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Relatório & Impressão em PDF de Clientes */}
      <RelatorioClientesPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        clientes={filteredComites}
        filtrosAtivos={{
          termoBusca: searchTerm,
          filtroDataAgendada,
          filtroDataEspecifica,
          filtroRegiao,
          filtroStatus: statusFilter,
          filtroOrigem: origemFilter,
          filtroMaterial: materialFilter,
        }}
        onExportCsv={handleExportCSV}
      />
    </div>
  );
};
