import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Navigation,
  Plus,
  Trash2,
  Edit2,
  Copy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  User,
  Users,
  Search,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Phone,
  Package,
  Layers,
  Fuel,
  DollarSign,
  Calendar,
  ExternalLink,
  ShieldCheck,
  BarChart3,
  Loader2,
  RefreshCw,
  Eye,
  Check,
  ChevronDown,
  Flame,
} from 'lucide-react';
import {
  Comite,
  Motoboy,
  Veiculo,
  PontoEntregaRota,
  RotaCliente,
  RegiaoRota,
  StatusParadaRota,
  PrioridadeParada,
  ComprovantePOD,
  StatusRotaCliente,
} from '../../types';
import {
  REGIOES_CONFIG,
  PONTO_PARTIDA_PADRAO,
  classificarRegiaoAutomaticamente,
  calcularEstimativasRota,
  otimizarSequenciaParadas,
  gerarLinkGoogleMapsRota,
  gerarLinkWaze,
} from '../../utils/geoRegions';
import { rotasClienteRepo, clientesRepo, motoboysRepo, veiculosRepo } from '../../repositories';
import { RotaMapView } from './RotaMapView';
import { RotaKanbanView } from './RotaKanbanView';
import { RotaRelatorioModal } from './RotaRelatorioModal';
import { DuplicarRotaModal } from './DuplicarRotaModal';
import { PontoEntregaPODModal } from './PontoEntregaPODModal';

interface RotasClienteViewProps {
  initialClienteId?: string | null;
  onNavigateTab?: (tab: any) => void;
}

export const RotasClienteView: React.FC<RotasClienteViewProps> = ({
  initialClienteId,
  onNavigateTab,
}) => {
  // Estado das coleções
  const [clientes, setClientes] = useState<Comite[]>([]);
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [rotasSalvas, setRotasSalvas] = useState<RotaCliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sub-abas de visualização: 'criar_rota' | 'minhas_rotas'
  const [subAbaAtiva, setSubAbaAtiva] = useState<'criar_rota' | 'minhas_rotas'>('criar_rota');

  // Modo de exibição das rotas salvas: 'lista' | 'mapa' | 'kanban'
  const [modoExibicao, setModoExibicao] = useState<'lista' | 'mapa' | 'kanban'>('lista');

  // Rota selecionada para exibição/edição
  const [rotaVisualizada, setRotaVisualizada] = useState<RotaCliente | null>(null);

  // ==========================================
  // ESTADO DO FORMULÁRIO DE CRIAÇÃO DE ROTA
  // ==========================================
  const [clienteBusca, setClienteBusca] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<Comite | null>(null);
  const [isDropdownClienteAberto, setIsDropdownClienteAberto] = useState(false);

  // Ponto de partida
  const [pontoPartida, setPontoPartida] = useState(PONTO_PARTIDA_PADRAO);
  const [dataRota, setDataRota] = useState(new Date().toISOString().slice(0, 10));
  const [horarioSaida, setHorarioSaida] = useState('08:30');

  // Distribuição para Motoboy
  const [motoboySelecionadoId, setMotoboySelecionadoId] = useState('');
  const [veiculoSelecionadoId, setVeiculoSelecionadoId] = useState('');
  const [limiteEntregas, setLimiteEntregas] = useState(25);
  const [valorDiaria, setValorDiaria] = useState(150);
  const [valorCombustivel, setValorCombustivel] = useState(40);
  const [valorAdicional, setValorAdicional] = useState(5);
  const [observacoesGerais, setObservacoesGerais] = useState('');

  // Lista de pontos de entrega cadastrados na rota em criação
  const [paradasRota, setParadasRota] = useState<PontoEntregaRota[]>([]);

  // ==========================================
  // ESTADO DO FORMULÁRIO DE NOVO PONTO DE ENTREGA
  // ==========================================
  const [novoDestinatario, setNovoDestinatario] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [novoCep, setNovoCep] = useState('');
  const [novoEndereco, setNovoEndereco] = useState('');
  const [novoNumeroCompl, setNovoNumeroCompl] = useState('');
  const [novoBairro, setNovoBairro] = useState('');
  const [novoMunicipio, setNovoMunicipio] = useState('Rio de Janeiro');
  const [novoPontoRef, setNovoPontoRef] = useState('');
  const [novaRegiao, setNovaRegiao] = useState<RegiaoRota>('Zona Norte');
  const [regiaoMotivo, setRegiaoMotivo] = useState('');
  const [novaJanela, setNovaJanela] = useState('09:00 - 13:00 (Manhã)');
  const [novoTipoMaterial, setNovoTipoMaterial] = useState('Santinhos 7x10');
  const [novaQuantidade, setNovaQuantidade] = useState(5000);
  const [novaUnidade, setNovaUnidade] = useState('unidades');
  const [novaPrioridade, setNovaPrioridade] = useState<PrioridadeParada>('normal');
  const [novasObsParada, setNovasObsParada] = useState('');
  const [isBuscandoCep, setIsBuscandoCep] = useState(false);

  // Modais
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState(false);
  const [modalDuplicarRota, setModalDuplicarRota] = useState<RotaCliente | null>(null);
  const [modalPODParada, setModalPODParada] = useState<{ parada: PontoEntregaRota; rotaId?: string } | null>(null);
  const [modalHistoricoRota, setModalHistoricoRota] = useState<RotaCliente | null>(null);

  // Filtros da aba "Minhas Rotas"
  const [filtroRegiaoSalva, setFiltroRegiaoSalva] = useState('todas');
  const [filtroStatusSalva, setFiltroStatusSalva] = useState('todas');
  const [buscaTextoSalva, setBuscaTextoSalva] = useState('');

  // 1. Carregamento em tempo real do Firestore
  useEffect(() => {
    setIsLoading(true);
    const unsubs: (() => void)[] = [];

    // Clientes
    const unsubClientes = clientesRepo.subscribe((list: any[]) => {
      setClientes(list);
      if (initialClienteId) {
        const found = list.find((c) => c.id === initialClienteId);
        if (found) {
          setClienteSelecionado(found);
        }
      }
    });
    unsubs.push(unsubClientes);

    // Motoboys
    const unsubMotoboys = motoboysRepo.subscribe((list: any[]) => {
      setMotoboys(list);
      if (list.length > 0 && !motoboySelecionadoId) {
        setMotoboySelecionadoId(list[0].id);
      }
    });
    unsubs.push(unsubMotoboys);

    // Veiculos
    const unsubVeiculos = veiculosRepo.subscribe((list: any[]) => {
      setVeiculos(list);
      if (list.length > 0 && !veiculoSelecionadoId) {
        setVeiculoSelecionadoId(list[0].id);
      }
    });
    unsubs.push(unsubVeiculos);

    // Rotas de Clientes
    const unsubRotas = rotasClienteRepo.subscribe((list: any[]) => {
      setRotasSalvas(list);
      setIsLoading(false);
    });
    unsubs.push(unsubRotas);

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [initialClienteId]);

  // Atualiza veículo quando motoboy é alterado
  useEffect(() => {
    if (motoboySelecionadoId) {
      const mb = motoboys.find((m) => m.id === motoboySelecionadoId);
      if (mb) {
        if (mb.valorDiaria) setValorDiaria(mb.valorDiaria);
        const matchingVehicle = veiculos.find((v) => v.placa === mb.placaMoto || v.motoboyResponsavel === mb.nome);
        if (matchingVehicle) {
          setVeiculoSelecionadoId(matchingVehicle.id);
        }
      }
    }
  }, [motoboySelecionadoId, motoboys, veiculos]);

  // Auto-classificação da região ao digitar CEP, Bairro, Município ou Endereço
  useEffect(() => {
    if (novoEndereco || novoBairro || novoCep || novoMunicipio) {
      const classif = classificarRegiaoAutomaticamente({
        cep: novoCep,
        bairro: novoBairro,
        municipio: novoMunicipio,
        endereco: novoEndereco,
      });
      setNovaRegiao(classif.regiao);
      setRegiaoMotivo(classif.motivo);
    }
  }, [novoCep, novoBairro, novoMunicipio, novoEndereco]);

  // Consulta automática de CEP via ViaCEP
  const handleConsultarCep = async (cepInput: string) => {
    const cleanCep = cepInput.replace(/\D/g, '');
    setNovoCep(cepInput);
    if (cleanCep.length === 8) {
      setIsBuscandoCep(true);
      try {
        const resp = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await resp.json();
        if (!data.erro) {
          setNovoEndereco(data.logradouro || '');
          setNovoBairro(data.bairro || '');
          setNovoMunicipio(data.localidade || 'Rio de Janeiro');
          const autoRegiao = classificarRegiaoAutomaticamente({
            cep: cleanCep,
            bairro: data.bairro,
            municipio: data.localidade,
            endereco: data.logradouro,
          });
          setNovaRegiao(autoRegiao.regiao);
          setRegiaoMotivo(autoRegiao.motivo);
        }
      } catch (e) {
        console.warn('Falha ao consultar CEP:', e);
      } finally {
        setIsBuscandoCep(false);
      }
    }
  };

  // Cálculo das estimativas da rota em criação
  const estimativas = useMemo(() => {
    return calcularEstimativasRota(paradasRota);
  }, [paradasRota]);

  // Região predominante
  const regiaoPredominante = useMemo((): RegiaoRota | 'Múltiplas Regiões' => {
    if (paradasRota.length === 0) return 'Zona Norte';
    const counts: Record<string, number> = {};
    paradasRota.forEach((p) => {
      counts[p.regiao] = (counts[p.regiao] || 0) + 1;
    });
    const entries = Object.entries(counts);
    entries.sort((a, b) => b[1] - a[1]);
    if (entries.length === 1) return entries[0][0] as RegiaoRota;
    if (entries[0][1] >= paradasRota.length * 0.7) return entries[0][0] as RegiaoRota;
    return 'Múltiplas Regiões';
  }, [paradasRota]);

  // Alerta de endereços duplicados na mesma rota
  const enderecosDuplicados = useMemo(() => {
    const vistos = new Set<string>();
    const dupes: string[] = [];
    paradasRota.forEach((p) => {
      const chave = `${p.enderecoCompleto.toLowerCase().trim()}_${p.numeroComplemento.toLowerCase().trim()}`;
      if (vistos.has(chave)) {
        dupes.push(`${p.enderecoCompleto}, ${p.numeroComplemento}`);
      } else {
        vistos.add(chave);
      }
    });
    return dupes;
  }, [paradasRota]);

  // Adicionar novo ponto de entrega à rota
  const handleAdicionarPonto = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteSelecionado) {
      alert('Selecione primeiro o Cliente da entrega.');
      return;
    }
    if (!novoDestinatario.trim()) {
      alert('Informe o Nome do Destinatário.');
      return;
    }
    if (!novoEndereco.trim() || !novoNumeroCompl.trim()) {
      alert('Informe o Endereço completo e Número/Complemento.');
      return;
    }
    if (!novoBairro.trim()) {
      alert('Informe o Bairro.');
      return;
    }
    if (paradasRota.length >= limiteEntregas) {
      alert(`Limite máximo de entregas para esta rota atingido (${limiteEntregas} paradas).`);
      return;
    }

    const novaParada: PontoEntregaRota = {
      id: `PONTO-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      clienteId: clienteSelecionado.id,
      clienteNome: clienteSelecionado.nome,
      nomeDestinatario: novoDestinatario.trim(),
      telefone: novoTelefone.trim() || clienteSelecionado.telefone || '(21) 99999-9999',
      enderecoCompleto: novoEndereco.trim(),
      numeroComplemento: novoNumeroCompl.trim(),
      bairro: novoBairro.trim(),
      municipio: novoMunicipio.trim() || 'Rio de Janeiro',
      cep: novoCep.trim() || '20000-000',
      pontoReferencia: novoPontoRef.trim() || undefined,
      regiao: novaRegiao,
      dataEntrega: dataRota,
      horarioJanelaEntrega: novaJanela,
      tipoMaterial: novoTipoMaterial,
      quantidadeMaterial: Number(novaQuantidade) || 1,
      unidadeMedida: novaUnidade,
      prioridade: novaPrioridade,
      observacoes: novasObsParada.trim() || undefined,
      ordemSequencia: paradasRota.length + 1,
      status: 'Pendente',
    };

    setParadasRota([...paradasRota, novaParada]);

    // Limpar formulário de parada para o próximo ponto
    setNovoDestinatario('');
    setNovoTelefone('');
    setNovoCep('');
    setNovoEndereco('');
    setNovoNumeroCompl('');
    setNovoBairro('');
    setNovoPontoRef('');
    setNovasObsParada('');
  };

  // Reordenação manual de paradas (Subir / Descer)
  const moverParada = (index: number, direcao: 'cima' | 'baixo') => {
    const novoIndex = direcao === 'cima' ? index - 1 : index + 1;
    if (novoIndex < 0 || novoIndex >= paradasRota.length) return;

    const novaLista = [...paradasRota];
    const itemTemp = novaLista[index];
    novaLista[index] = novaLista[novoIndex];
    novaLista[novoIndex] = itemTemp;

    // Atualiza numeração da sequência
    const listaReordenada = novaLista.map((p, idx) => ({
      ...p,
      ordemSequencia: idx + 1,
    }));
    setParadasRota(listaReordenada);
  };

  // Remover parada da rota em criação
  const removerParada = (paradaId: string) => {
    const filtradas = paradasRota.filter((p) => p.id !== paradaId);
    const reindexadas = filtradas.map((p, idx) => ({
      ...p,
      ordemSequencia: idx + 1,
    }));
    setParadasRota(reindexadas);
  };

  // Otimização automática de sequência
  const handleOtimizarSequencia = () => {
    if (paradasRota.length <= 1) return;
    const otimizadas = otimizarSequenciaParadas(paradasRota);
    setParadasRota(otimizadas);
  };

  // Salvar Rota Completa no Firestore
  const handleCriarRotaFinal = async () => {
    // 1. Validação Estrita exigida: "Impedir a criação de rota sem cliente, endereço, região e responsável"
    if (!clienteSelecionado) {
      alert('Erro de validação: Você deve selecionar um Cliente para a rota.');
      return;
    }
    if (paradasRota.length === 0) {
      alert('Erro de validação: Adicione ao menos um ponto de entrega com endereço completo.');
      return;
    }
    if (!motoboySelecionadoId) {
      alert('Erro de validação: Selecione o Motoboy responsável pela rota.');
      return;
    }

    const motoboyObj = motoboys.find((m) => m.id === motoboySelecionadoId);
    const veiculoObj = veiculos.find((v) => v.id === veiculoSelecionadoId);

    const valorTotalPrevisto = Number(valorDiaria) + Number(valorCombustivel) + (paradasRota.length * Number(valorAdicional));

    const novaRotaPayload: Omit<RotaCliente, 'id' | 'createdAt' | 'updatedAt' | 'codigoRota'> = {
      nomeRota: `Rota ${regiaoPredominante} - ${clienteSelecionado.nome.slice(0, 25)}`,
      clienteId: clienteSelecionado.id,
      clienteNome: clienteSelecionado.nome,
      candidato: clienteSelecionado.candidato,
      partido: clienteSelecionado.partido,
      cnpjCampanha: clienteSelecionado.cnpjCampanha,
      regiaoPredominante,
      dataRota,
      dataHorarioSaida: `${dataRota}T${horarioSaida}:00`,
      pontoPartida,
      pontoFinal: paradasRota[paradasRota.length - 1]?.enderecoCompleto || pontoPartida,
      motoboyId: motoboySelecionadoId,
      motoboyNome: motoboyObj?.nome || 'Motoboy Responsável',
      motoboyTelefone: motoboyObj?.telefone,
      motoboyFotoUrl: motoboyObj?.fotoUrl,
      veiculoModelo: veiculoObj ? `${veiculoObj.marca} ${veiculoObj.modelo}` : (motoboyObj?.modeloMoto || 'Honda CG 160'),
      veiculoPlaca: veiculoObj?.placa || motoboyObj?.placaMoto || 'BRA-2026',
      regiaoAtendimento: regiaoPredominante,
      limiteEntregasMaximo: limiteEntregas,
      valorDiaria: Number(valorDiaria),
      valorCombustivel: Number(valorCombustivel),
      valorAdicionalPorEntrega: Number(valorAdicional),
      valorTotalPrevisto,
      distanciaTotalKmEstimada: estimativas.distanciaTotalKm,
      tempoEstimadoMinutos: estimativas.tempoEstimadoMinutos,
      previsaoCombustivelLitros: estimativas.combustivelLitros,
      quantidadeParadas: paradasRota.length,
      quantidadeTotalMateriais: estimativas.totalMateriais,
      paradas: paradasRota,
      status: 'planejada',
      observacoes: observacoesGerais.trim() || undefined,
      criadoPor: 'sistema',
      criadoPorNome: 'Operador Logístico',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      historicoAlteracoes: [],
    };

    setIsLoading(true);
    try {
      const rotaId = await rotasClienteRepo.criarRotaCliente(
        novaRotaPayload,
        'user-operador',
        'Gestor de Logística'
      );

      // Limpar formulário e navegar para Minhas Rotas
      setParadasRota([]);
      setObservacoesGerais('');
      setSubAbaAtiva('minhas_rotas');
      alert('Rota criada com sucesso e sincronizada no sistema!');
    } catch (err: any) {
      alert(`Erro ao salvar rota: ${err?.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar status de parada em rota salva
  const handleAtualizarStatusParadaSalva = async (
    rotaId: string,
    paradaId: string,
    novoStatus: StatusParadaRota,
    motivo?: string,
    podData?: ComprovantePOD
  ) => {
    try {
      await rotasClienteRepo.atualizarStatusParada(
        rotaId,
        paradaId,
        novoStatus,
        motivo,
        'user-operador',
        'Operador',
        podData
      );
    } catch (e: any) {
      alert(`Erro ao atualizar status: ${e?.message || e}`);
    }
  };

  // Duplicar Rota
  const handleConfirmarDuplicacao = async (novaData: string) => {
    if (!modalDuplicarRota) return;
    try {
      await rotasClienteRepo.duplicarParaData(
        modalDuplicarRota.id,
        novaData,
        'user-operador',
        'Gestor de Logística'
      );
      setModalDuplicarRota(null);
      alert('Rota duplicada com sucesso para a nova data!');
    } catch (e: any) {
      alert(`Erro ao duplicar rota: ${e?.message || e}`);
    }
  };

  // Filtragem na aba Minhas Rotas
  const rotasFiltradas = useMemo(() => {
    return rotasSalvas.filter((r) => {
      if (filtroRegiaoSalva !== 'todas' && r.regiaoPredominante !== filtroRegiaoSalva) return false;
      if (filtroStatusSalva !== 'todas' && r.status !== filtroStatusSalva) return false;
      if (buscaTextoSalva) {
        const txt = buscaTextoSalva.toLowerCase();
        const matchNome = r.nomeRota?.toLowerCase().includes(txt);
        const matchCodigo = r.codigoRota?.toLowerCase().includes(txt);
        const matchCliente = r.clienteNome?.toLowerCase().includes(txt);
        const matchMotoboy = r.motoboyNome?.toLowerCase().includes(txt);
        if (!matchNome && !matchCodigo && !matchCliente && !matchMotoboy) return false;
      }
      return true;
    });
  }, [rotasSalvas, filtroRegiaoSalva, filtroStatusSalva, buscaTextoSalva]);

  // Estatísticas Rápidas
  const totalRotasAtivas = rotasSalvas.filter((r) => r.status === 'em_rota' || r.status === 'planejada').length;
  const totalParadasGerais = rotasSalvas.reduce((acc, r) => acc + (r.paradas?.length || 0), 0);
  const totalEntreguesGerais = rotasSalvas.reduce(
    (acc, r) => acc + (r.paradas?.filter((p) => p.status === 'Entregue').length || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Estatísticas */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E05328] text-white font-black text-[10px] uppercase tracking-wider">
              FleetMoto Rotas RJ
            </span>
            <span className="text-slate-400 text-xs">• 4 Regiões Estratégicas</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Criação e Gerenciamento de Rotas por Cliente
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Planejamento inteligente, classificação automática de regiões (Zona Norte, Zona Oeste, Baixada Fluminense, Niterói/SG), integração com GPS e comprovação digital POD.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setModalRelatorioAberto(true)}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-[#E05328]" />
            <span>Relatórios & Prestação</span>
          </button>
        </div>
      </div>

      {/* Navegação de Sub-Abas */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => setSubAbaAtiva('criar_rota')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subAbaAtiva === 'criar_rota'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4 text-[#E05328]" />
            <span>Criar Nova Rota</span>
          </button>

          <button
            onClick={() => setSubAbaAtiva('minhas_rotas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subAbaAtiva === 'minhas_rotas'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Rotas Cadastradas ({rotasSalvas.length})</span>
          </button>
        </div>

        {/* Citações das 4 Regiões com cores oficiais */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-bold">
          <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 border border-blue-200">
            Zona Norte (Azul)
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-orange-100 text-orange-800 border border-orange-200">
            Zona Oeste (Laranja)
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
            Baixada Fluminense (Verde)
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-800 border border-purple-200">
            Niterói / SG (Roxo)
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-ABA 1: CRIAR NOVA ROTA / PLANEJAMENTO                                 */}
      {/* ========================================================================= */}
      {subAbaAtiva === 'criar_rota' && (
        <div className="space-y-6">
          {/* SEÇÃO 1: SELEÇÃO DO CLIENTE & CONFIGURAÇÃO GERAL */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#E05328] flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Selecionar Cliente & Origem da Expedição
                  </h3>
                  <p className="text-xs text-slate-500">
                    Busque por nome, candidato, partido, telefone ou código de comitê
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Autocomplete / Seletor de Cliente */}
              <div className="md:col-span-2 relative">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#E05328]" />
                  Cliente / Candidato Contratante *
                </label>

                {clienteSelecionado ? (
                  <div className="p-3 bg-orange-50/70 border-2 border-[#E05328]/50 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {clienteSelecionado.nome}
                        </span>
                        {clienteSelecionado.partido && (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-orange-200 text-xs font-black text-orange-800">
                            {clienteSelecionado.partido}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Candidato: <strong>{clienteSelecionado.candidato || clienteSelecionado.nome}</strong> • Tel: {clienteSelecionado.telefone}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setClienteSelecionado(null)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      Trocar Cliente
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={clienteBusca}
                        onChange={(e) => {
                          setClienteBusca(e.target.value);
                          setIsDropdownClienteAberto(true);
                        }}
                        onFocus={() => setIsDropdownClienteAberto(true)}
                        placeholder="Digite para buscar cliente cadastrado..."
                        className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 font-medium"
                      />
                    </div>

                    {isDropdownClienteAberto && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl max-h-60 overflow-y-auto z-40 p-1.5 space-y-1">
                        {clientes
                          .filter((c) =>
                            c.nome?.toLowerCase().includes(clienteBusca.toLowerCase()) ||
                            c.candidato?.toLowerCase().includes(clienteBusca.toLowerCase()) ||
                            c.partido?.toLowerCase().includes(clienteBusca.toLowerCase()) ||
                            c.telefone?.includes(clienteBusca)
                          )
                          .map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setClienteSelecionado(c);
                                setIsDropdownClienteAberto(false);
                                setClienteBusca('');
                              }}
                              className="w-full text-left p-2.5 rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-between group"
                            >
                              <div>
                                <p className="font-bold text-xs text-slate-900 group-hover:text-[#E05328]">
                                  {c.nome}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {c.candidato} • {c.partido} • {c.cidade} - {c.bairro}
                                </p>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                                {c.telefone}
                              </span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Data & Ponto de Partida */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#E05328]" />
                    Data da Rota & Horário de Saída
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={dataRota}
                      onChange={(e) => setDataRota(e.target.value)}
                      className="px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                    />
                    <input
                      type="time"
                      value={horarioSaida}
                      onChange={(e) => setHorarioSaida(e.target.value)}
                      className="px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ponto de Partida (CD Base)
                  </label>
                  <input
                    type="text"
                    value={pontoPartida}
                    onChange={(e) => setPontoPartida(e.target.value)}
                    className="w-full px-3 py-1.5 text-[11px] border border-slate-200 rounded-xl bg-slate-50 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: FORMULÁRIO DE PONTOS DE ENTREGA + CLASSIFICAÇÃO AUTOMÁTICA */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Cadastrar Pontos de Entrega & Classificação Automática
                  </h3>
                  <p className="text-xs text-slate-500">
                    O sistema identifica a região e auto-organiza os destinos
                  </p>
                </div>
              </div>

              {regiaoMotivo && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-slate-600 font-medium">{regiaoMotivo}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleAdicionarPonto} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Nome Destinatário */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome do Destinatário *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoDestinatario}
                    onChange={(e) => setNovoDestinatario(e.target.value)}
                    placeholder="Ex: Comitê Bairro ou Responsável"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefone de Contato *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoTelefone}
                    onChange={(e) => setNovoTelefone(e.target.value)}
                    placeholder="(21) 99999-9999"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>

                {/* CEP */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>CEP</span>
                    {isBuscandoCep && <Loader2 className="w-3 h-3 animate-spin text-[#E05328]" />}
                  </label>
                  <input
                    type="text"
                    value={novoCep}
                    onChange={(e) => handleConsultarCep(e.target.value)}
                    placeholder="00000-000"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-mono font-bold"
                  />
                </div>

                {/* Região (Classificação Automática com Seleção) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Região (Classificação) *
                  </label>
                  <select
                    value={novaRegiao}
                    onChange={(e) => setNovaRegiao(e.target.value as RegiaoRota)}
                    className={`w-full px-3 py-2 text-xs border rounded-xl font-bold cursor-pointer transition-all ${
                      REGIOES_CONFIG[novaRegiao]?.badgeClass || 'bg-slate-50'
                    }`}
                  >
                    <option value="Zona Norte">Zona Norte (Azul)</option>
                    <option value="Zona Oeste">Zona Oeste (Laranja)</option>
                    <option value="Baixada Fluminense">Baixada Fluminense (Verde)</option>
                    <option value="Niterói / São Gonçalo">Niterói / São Gonçalo (Roxo)</option>
                  </select>
                </div>
              </div>

              {/* Endereço, Número, Bairro, Município */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Endereço Completo (Rua / Av) *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoEndereco}
                    onChange={(e) => setNovoEndereco(e.target.value)}
                    placeholder="Ex: Av. Dom Hélder Câmara"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número & Complemento *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoNumeroCompl}
                    onChange={(e) => setNovoNumeroCompl(e.target.value)}
                    placeholder="1200, Sala 102"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoBairro}
                    onChange={(e) => setNovoBairro(e.target.value)}
                    placeholder="Ex: Madureira / Méier / Barra"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>
              </div>

              {/* Materiais, Janela de Horário e Prioridade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Material *
                  </label>
                  <select
                    value={novoTipoMaterial}
                    onChange={(e) => setNovoTipoMaterial(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium cursor-pointer"
                  >
                    <option value="Santinhos 7x10">Santinhos 7x10</option>
                    <option value="Adesivos Perfurados">Adesivos Perfurados</option>
                    <option value="Pragão / Praguinha">Pragão / Praguinha</option>
                    <option value="Bandeiras & Mastros">Bandeiras & Mastros</option>
                    <option value="Cartões & Folders">Cartões & Folders</option>
                    <option value="Jornais Informativos">Jornais Informativos</option>
                    <option value="Combo Comício Completo">Combo Comício Completo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantidade & Unidade *
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="number"
                      required
                      min={1}
                      value={novaQuantidade}
                      onChange={(e) => setNovaQuantidade(Number(e.target.value))}
                      className="px-2.5 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50"
                    />
                    <select
                      value={novaUnidade}
                      onChange={(e) => setNovaUnidade(e.target.value)}
                      className="px-2 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium cursor-pointer"
                    >
                      <option value="unidades">unidades</option>
                      <option value="milheiros">milheiros</option>
                      <option value="kits">kits</option>
                      <option value="fardos">fardos</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Janela / Horário de Entrega *
                  </label>
                  <select
                    value={novaJanela}
                    onChange={(e) => setNovaJanela(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium cursor-pointer"
                  >
                    <option value="08:00 - 12:00 (Manhã)">08:00 - 12:00 (Manhã)</option>
                    <option value="13:00 - 17:00 (Tarde)">13:00 - 17:00 (Tarde)</option>
                    <option value="18:00 - 21:00 (Noite)">18:00 - 21:00 (Noite)</option>
                    <option value="Horário Comercial (09h-18h)">Horário Comercial (09h-18h)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prioridade da Parada *
                  </label>
                  <select
                    value={novaPrioridade}
                    onChange={(e) => setNovaPrioridade(e.target.value as PrioridadeParada)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold cursor-pointer"
                  >
                    <option value="normal">● Normal</option>
                    <option value="alta">▲ Alta</option>
                    <option value="urgente">🔥 Urgente (Comício/Ato)</option>
                  </select>
                </div>
              </div>

              {/* Ponto de Referência e Botão Adicionar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <input
                  type="text"
                  value={novoPontoRef}
                  onChange={(e) => setNovoPontoRef(e.target.value)}
                  placeholder="Ponto de referência (opcional: ao lado da praça, portão azul...)"
                  className="w-full sm:w-2/3 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50"
                />

                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Ponto à Rota</span>
                </button>
              </div>
            </form>
          </div>

          {/* ALERTA DE ENDEREÇOS DUPLICADOS OU INCOMPLETOS */}
          {enderecosDuplicados.length > 0 && (
            <div className="p-3.5 bg-amber-50 rounded-2xl border-2 border-amber-300 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Atenção: Endereços duplicados detectados nesta rota!</strong>
                <p className="mt-0.5 text-amber-800">
                  Os seguintes endereços foram inseridos mais de uma vez: {enderecosDuplicados.join(' • ')}
                </p>
              </div>
            </div>
          )}

          {/* SEÇÃO 3: LISTA DE PARADAS CADASTRADAS + REORDENAÇÃO + MAPA PREVIEW */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Sequência de Paradas ({paradasRota.length} endereços)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Reordene manualmente ou use a otimização por proximidade
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {paradasRota.length > 1 && (
                  <button
                    type="button"
                    onClick={handleOtimizarSequencia}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 border border-indigo-200 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Otimizar Sequência Inteligente</span>
                  </button>
                )}
              </div>
            </div>

            {paradasRota.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic border-2 border-dashed border-slate-200 rounded-3xl space-y-2">
                <MapPin className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-600">Nenhum ponto de entrega adicionado ainda</p>
                <p>Preencha os campos acima para montar o roteiro.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {paradasRota.map((parada, idx) => {
                  const regConfig = REGIOES_CONFIG[parada.regiao] || REGIOES_CONFIG['Zona Norte'];

                  return (
                    <div
                      key={parada.id}
                      className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        {/* Indicador de Ordem */}
                        <div className="w-7 h-7 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              {parada.nomeDestinatario}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${regConfig.badgeClass}`}>
                              {parada.regiao}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              Tel: {parada.telefone}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 mt-0.5">
                            {parada.enderecoCompleto}, {parada.numeroComplemento} - {parada.bairro} ({parada.municipio})
                          </p>

                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                            <span className="font-bold text-slate-800">
                              {parada.quantidadeMaterial}x {parada.tipoMaterial}
                            </span>
                            <span>•</span>
                            <span>Janela: {parada.horarioJanelaEntrega}</span>
                          </div>
                        </div>
                      </div>

                      {/* Botões de Ação e Reordenação */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moverParada(idx, 'cima')}
                          className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                          title="Subir parada na ordem"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          disabled={idx === paradasRota.length - 1}
                          onClick={() => moverParada(idx, 'baixo')}
                          className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                          title="Descer parada na ordem"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => removerParada(parada.id)}
                          className="p-1.5 rounded-xl bg-white border border-slate-200 text-rose-600 hover:bg-rose-50"
                          title="Remover parada"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SEÇÃO 4: DISTRIBUIÇÃO POR MOTOBOY & CUSTOS */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Distribuição Operacional & Responsável
                  </h3>
                  <p className="text-xs text-slate-500">
                    Defina o motoboy, veículo, diária, combustível e adicionais
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Seleção do Motoboy */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motoboy Responsável *
                </label>
                <select
                  value={motoboySelecionadoId}
                  onChange={(e) => setMotoboySelecionadoId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold cursor-pointer"
                >
                  {motoboys.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome} (Placa: {m.placaMoto})
                    </option>
                  ))}
                </select>
              </div>

              {/* Veículo / Placa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Veículo / Placa
                </label>
                <select
                  value={veiculoSelecionadoId}
                  onChange={(e) => setVeiculoSelecionadoId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium cursor-pointer"
                >
                  {veiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} - {v.placa}
                    </option>
                  ))}
                </select>
              </div>

              {/* Diária (R$) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Valor da Diária (R$)
                </label>
                <input
                  type="number"
                  min={0}
                  value={valorDiaria}
                  onChange={(e) => setValorDiaria(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              {/* Combustível (R$) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Combustível / Ajuda Custo (R$)
                </label>
                <input
                  type="number"
                  min={0}
                  value={valorCombustivel}
                  onChange={(e) => setValorCombustivel(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 5: RESUMO MÉTRICO & BOTÃO FINAL CRIAR ROTA */}
          <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-base text-white">
                  Resumo Geral do Planejamento de Rota
                </h3>
                <p className="text-xs text-slate-400">
                  Região Predominante: <strong className="text-amber-400">{regiaoPredominante}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {paradasRota.length > 0 && (
                  <a
                    href={gerarLinkGoogleMapsRota(pontoPartida, paradasRota)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Visualizar no Google Maps</span>
                  </a>
                )}
              </div>
            </div>

            {/* Cards de Métricas da Rota */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Distância Estimada</p>
                <p className="text-xl font-black text-amber-400 mt-0.5">{estimativas.distanciaTotalKm} km</p>
                <p className="text-[10px] text-slate-400">Circuito CD + Paradas</p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Tempo Estimado</p>
                <p className="text-xl font-black text-blue-400 mt-0.5">
                  {Math.floor(estimativas.tempoEstimadoMinutos / 60)}h {estimativas.tempoEstimadoMinutos % 60}m
                </p>
                <p className="text-[10px] text-slate-400">Piloto + Entregas</p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Consumo Estimado</p>
                <p className="text-xl font-black text-purple-400 mt-0.5">{estimativas.combustivelLitros} L</p>
                <p className="text-[10px] text-slate-400">Base: 35 km/l</p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total de Paradas</p>
                <p className="text-xl font-black text-emerald-400 mt-0.5">{paradasRota.length}</p>
                <p className="text-[10px] text-slate-400">{estimativas.totalMateriais} itens</p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Custo Previsto</p>
                <p className="text-xl font-black text-orange-400 mt-0.5">
                  R$ {(Number(valorDiaria) + Number(valorCombustivel) + paradasRota.length * Number(valorAdicional)).toFixed(2)}
                </p>
                <p className="text-[10px] text-slate-400">Diária + Combustível</p>
              </div>
            </div>

            {/* Botão Principal de Criação */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
              <p className="text-xs text-slate-400">
                Ao criar a rota, os pontos serão registrados com auditoria TSE e disponibilizados na Área do Motoboy.
              </p>

              <button
                type="button"
                onClick={handleCriarRotaFinal}
                disabled={isLoading || paradasRota.length === 0 || !clienteSelecionado}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-[#E05328] hover:bg-[#c9451e] text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processando Rota...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Criar e Disparar Rota</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-ABA 2: ROTAS CADASTRADAS (MINHAS ROTAS) - MAPA / LISTA / KANBAN       */}
      {/* ========================================================================= */}
      {subAbaAtiva === 'minhas_rotas' && (
        <div className="space-y-5">
          {/* Barra de Filtros e Seletores de Modo */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Busca e Filtro de Região */}
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={buscaTextoSalva}
                  onChange={(e) => setBuscaTextoSalva(e.target.value)}
                  placeholder="Buscar por código, cliente, motoboy..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              <select
                value={filtroRegiaoSalva}
                onChange={(e) => setFiltroRegiaoSalva(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold"
              >
                <option value="todas">Todas as Regiões</option>
                <option value="Zona Norte">Zona Norte</option>
                <option value="Zona Oeste">Zona Oeste</option>
                <option value="Baixada Fluminense">Baixada Fluminense</option>
                <option value="Niterói / São Gonçalo">Niterói / São Gonçalo</option>
              </select>

              <select
                value={filtroStatusSalva}
                onChange={(e) => setFiltroStatusSalva(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium"
              >
                <option value="todas">Todos os Status</option>
                <option value="planejada">Planejada</option>
                <option value="em_rota">Em Rota</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>

            {/* Alternador de Modos de Exibição (Mapa / Lista / Kanban) */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 shrink-0">
              <button
                onClick={() => setModoExibicao('lista')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modoExibicao === 'lista'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lista
              </button>

              <button
                onClick={() => setModoExibicao('mapa')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modoExibicao === 'mapa'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Modo Mapa
              </button>

              <button
                onClick={() => setModoExibicao('kanban')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modoExibicao === 'kanban'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Quadro Kanban
              </button>
            </div>
          </div>

          {/* MODO MAPA */}
          {modoExibicao === 'mapa' && (
            <RotaMapView
              paradas={rotasFiltradas.flatMap((r) => r.paradas || [])}
              onOpenPOD={(parada) => setModalPODParada({ parada })}
            />
          )}

          {/* MODO KANBAN */}
          {modoExibicao === 'kanban' && (
            <RotaKanbanView
              paradas={rotasFiltradas.flatMap((r) => r.paradas || [])}
              onUpdateStatus={async (paradaId, novoStatus) => {
                const rotaPai = rotasSalvas.find((r) => r.paradas?.some((p) => p.id === paradaId));
                if (rotaPai) {
                  await handleAtualizarStatusParadaSalva(rotaPai.id, paradaId, novoStatus);
                }
              }}
              onOpenPOD={(parada) => {
                const rotaPai = rotasSalvas.find((r) => r.paradas?.some((p) => p.id === parada.id));
                setModalPODParada({ parada, rotaId: rotaPai?.id });
              }}
            />
          )}

          {/* MODO LISTA DE ROTAS */}
          {modoExibicao === 'lista' && (
            <div className="space-y-4">
              {rotasFiltradas.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400 space-y-3">
                  <Layers className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-700 text-base">Nenhuma rota cadastrada encontrada</p>
                  <p className="text-xs text-slate-400">
                    Crie uma nova rota na aba "Criar Nova Rota" para iniciar o acompanhamento.
                  </p>
                </div>
              ) : (
                rotasFiltradas.map((rota) => {
                  const regConfig = REGIOES_CONFIG[rota.regiaoPredominante as RegiaoRota] || REGIOES_CONFIG['Zona Norte'];
                  const totalParadas = rota.paradas?.length || 0;
                  const totalEntregues = rota.paradas?.filter((p) => p.status === 'Entregue').length || 0;
                  const taxaConclusao = totalParadas > 0 ? Math.round((totalEntregues / totalParadas) * 100) : 0;

                  return (
                    <div
                      key={rota.id}
                      className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4"
                    >
                      {/* Topo do Card de Rota */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-xl bg-slate-900 text-white">
                            {rota.codigoRota}
                          </span>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{rota.nomeRota}</h4>
                            <p className="text-xs text-slate-500">
                              Cliente: <strong className="text-slate-800">{rota.clienteNome}</strong> • Data: {rota.dataRota}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${regConfig.badgeClass}`}>
                            {rota.regiaoPredominante}
                          </span>

                          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                            rota.status === 'concluida'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rota.status === 'em_rota'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            ● {rota.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Dados Operacionais da Rota */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                        <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Motoboy</p>
                          <p className="font-bold text-slate-900 truncate">{rota.motoboyNome}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{rota.veiculoPlaca}</p>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Paradas</p>
                          <p className="font-bold text-slate-900">{totalEntregues} / {totalParadas}</p>
                          <p className="text-[10px] text-emerald-600 font-bold">{taxaConclusao}% entregue</p>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Distância & Tempo</p>
                          <p className="font-bold text-slate-900">{rota.distanciaTotalKmEstimada} km</p>
                          <p className="text-[10px] text-slate-500">~{rota.tempoEstimadoMinutos} min</p>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Combustível</p>
                          <p className="font-bold text-slate-900">~{rota.previsaoCombustivelLitros} L</p>
                          <p className="text-[10px] text-slate-500">R$ {rota.valorCombustivel}</p>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Custo Total</p>
                          <p className="font-bold text-orange-600">R$ {rota.valorTotalPrevisto?.toFixed(2)}</p>
                          <p className="text-[10px] text-slate-500">Diária R$ {rota.valorDiaria}</p>
                        </div>

                        <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-center gap-1">
                          <button
                            onClick={() => setModalDuplicarRota(rota)}
                            className="w-full py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[10px] font-bold flex items-center justify-center gap-1"
                          >
                            <Copy className="w-3 h-3 text-[#E05328]" /> Duplicar Rota
                          </button>

                          <a
                            href={gerarLinkGoogleMapsRota(rota.pontoPartida, rota.paradas || [])}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-bold flex items-center justify-center gap-1 border border-blue-200"
                          >
                            <ExternalLink className="w-3 h-3" /> Abrir Maps
                          </a>
                        </div>
                      </div>

                      {/* Lista de Paradas Expansível */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <p className="text-xs font-bold text-slate-700">Paradas da Rota:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(rota.paradas || []).map((parada) => (
                            <div
                              key={parada.id}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                            >
                              <div className="truncate max-w-[240px]">
                                <span className="font-bold text-slate-900">#{parada.ordemSequencia} {parada.nomeDestinatario}</span>
                                <p className="text-[10px] text-slate-500 truncate">{parada.enderecoCompleto}, {parada.numeroComplemento} - {parada.bairro}</p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {parada.status === 'Entregue' ? (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Entregue
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setModalPODParada({ parada, rotaId: rota.id })}
                                    className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs"
                                  >
                                    <ShieldCheck className="w-3 h-3" /> POD
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE COMPROVAÇÃO DE ENTREGA (POD) */}
      {modalPODParada && (
        <PontoEntregaPODModal
          parada={modalPODParada.parada}
          onClose={() => setModalPODParada(null)}
          onSuccess={async (podData) => {
            const rotaPai = rotasSalvas.find((r) => r.id === modalPODParada.rotaId) ||
              rotasSalvas.find((r) => r.paradas?.some((p) => p.id === modalPODParada.parada.id));
            if (rotaPai) {
              await handleAtualizarStatusParadaSalva(
                rotaPai.id,
                modalPODParada.parada.id,
                'Entregue',
                'Comprovante assinado e registrado com sucesso.',
                podData
              );
            }
          }}
        />
      )}

      {/* MODAL DE DUPLICAR ROTA */}
      {modalDuplicarRota && (
        <DuplicarRotaModal
          rota={modalDuplicarRota}
          onClose={() => setModalDuplicarRota(null)}
          onConfirm={handleConfirmarDuplicacao}
        />
      )}

      {/* MODAL DE RELATÓRIO CONSOLIDADO */}
      {modalRelatorioAberto && (
        <RotaRelatorioModal
          rotas={rotasSalvas}
          onClose={() => setModalRelatorioAberto(false)}
        />
      )}
    </div>
  );
};
