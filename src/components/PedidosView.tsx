import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Calendar,
  Truck,
  Building2,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  Copy,
  Send,
  Printer,
  Download,
  MessageSquare,
  ChevronDown,
  ArrowRight,
  User,
  Phone,
  MapPin,
  FileText,
  HelpCircle,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  ShoppingBag,
  ListPlus
} from 'lucide-react';
import {
  Pedido,
  ItemPedido,
  StatusPedido,
  PrioridadePedido,
  ModalidadePedido,
  Cliente,
  Motoboy,
  Usuario,
  Entrega,
} from '../types';
import { pedidosRepo, clientesRepo, entregasRepo, expedicoesRepo } from '../repositories';
import { printElementById } from '../utils/printHelper';
import {
  formatCurrency,
  formatDateTime,
  formatDate,
  formatStatusPedido,
  getStatusBadgeClass,
  formatPrioridadePedido,
  formatUnidadeMedida,
  LISTA_MATERIAIS_PEDIDO,
} from '../utils/formatters';

interface PedidosViewProps {
  pedidos: Pedido[];
  clientes: Cliente[];
  motoboys: Motoboy[];
  entregas: Entrega[];
  currentUser: Usuario;
  onSelectTab: (tab: any) => void;
  onRefresh?: () => void;
}

export const PedidosView: React.FC<PedidosViewProps> = ({
  pedidos,
  clientes,
  motoboys,
  entregas,
  currentUser,
  onSelectTab,
  onRefresh,
}) => {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [modalidadeFilter, setModalidadeFilter] = useState<string>('todos');
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('todos');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [periodTab, setPeriodTab] = useState<'todos' | 'hoje' | 'amanha' | 'semana' | 'pendentes'>('todos');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [viewingPedido, setViewingPedido] = useState<Pedido | null>(null);
  const [dispatchPedido, setDispatchPedido] = useState<Pedido | null>(null);
  const [deliveryPedido, setDeliveryPedido] = useState<Pedido | null>(null);
  const [cancelPedidoModal, setCancelPedidoModal] = useState<Pedido | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // WhatsApp generation modal
  const [whatsappModal, setWhatsappModal] = useState<{ pedido: Pedido; message: string; phone: string } | null>(null);

  // Print view modal
  const [printPedido, setPrintPedido] = useState<Pedido | null>(null);

  // Form State
  const [isNewClientMode, setIsNewClientMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Selected Existing Client
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientSearchDropdownOpen, setIsClientSearchDropdownOpen] = useState(false);
  const [useLegacyClientSelect, setUseLegacyClientSelect] = useState(false);

  // Main table client search suggestion popup
  const [isMainSearchDropdownOpen, setIsMainSearchDropdownOpen] = useState(false);

  // New Client Fields
  const [newClientNome, setNewClientNome] = useState('');
  const [newClientCandidato, setNewClientCandidato] = useState('');
  const [newClientCargo, setNewClientCargo] = useState('Deputado Estadual');
  const [newClientPartido, setNewClientPartido] = useState('');
  const [newClientNumero, setNewClientNumero] = useState('');
  const [newClientCnpj, setNewClientCnpj] = useState('');
  const [newClientResponsavel, setNewClientResponsavel] = useState('');
  const [newClientTelefone, setNewClientTelefone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientEndereco, setNewClientEndereco] = useState('');
  const [newClientBairro, setNewClientBairro] = useState('');
  const [newClientCidade, setNewClientCidade] = useState('São Paulo');
  const [newClientZona, setNewClientZona] = useState('Zona Central');

  // Order Fields
  const [orderPrioridade, setOrderPrioridade] = useState<PrioridadePedido>('normal');
  const [orderModalidade, setOrderModalidade] = useState<ModalidadePedido>('entrega');
  const [orderDataPrevisao, setOrderDataPrevisao] = useState(
    new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16)
  );
  const [orderObservacoes, setOrderObservacoes] = useState('');
  const [orderDesconto, setOrderDesconto] = useState(0);
  const [orderAcrescimo, setOrderAcrescimo] = useState(0);

  // Address for Delivery
  const [deliveryCep, setDeliveryCep] = useState('');
  const [deliveryEndereco, setDeliveryEndereco] = useState('');
  const [deliveryNumero, setDeliveryNumero] = useState('');
  const [deliveryComplemento, setDeliveryComplemento] = useState('');
  const [deliveryBairro, setDeliveryBairro] = useState('');
  const [deliveryCidade, setDeliveryCidade] = useState('São Paulo');
  const [deliveryUf, setDeliveryUf] = useState('SP');
  const [deliveryZona, setDeliveryZona] = useState('Zona Central');
  const [deliveryPontoRef, setDeliveryPontoRef] = useState('');
  const [deliveryRecebedor, setDeliveryRecebedor] = useState('');
  const [deliveryTelRecebedor, setDeliveryTelRecebedor] = useState('');

  // Order Items
  const [orderItems, setOrderItems] = useState<ItemPedido[]>([
    {
      id: 'item-1',
      tipoMaterial: 'santinhos_impressos',
      nomeMaterial: 'Santinhos impressos',
      descricao: 'Santinhos tradicionais 7x10cm 4x4 cores c/ coligação',
      quantidade: 5000,
      unidadeMedida: 'unidades',
      valorUnitario: 0,
      subtotal: 0,
    },
  ]);

  // Temporary item being added in form
  const [currTipoMaterial, setCurrTipoMaterial] = useState('santinhos_impressos');
  const [currCustomNome, setCurrCustomNome] = useState('');
  const [currCustomDesc, setCurrCustomDesc] = useState('');
  const [currQtd, setCurrQtd] = useState(1000);
  const [currUnidade, setCurrUnidade] = useState('unidade');
  const [currItemObs, setCurrItemObs] = useState('');

  // Dispatch / Expedition Modal fields
  const [dispatchStatusAlvo, setDispatchStatusAlvo] = useState<'em_separacao' | 'pronto' | 'enviado'>('em_separacao');
  const [dispatchObs, setDispatchObs] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  // Generate Delivery Modal fields
  const [deliverySelectedMotoboy, setDeliverySelectedMotoboy] = useState('');
  const [deliveryFreteValor, setDeliveryFreteValor] = useState(45.0);
  const [deliveryObs, setDeliveryObs] = useState('');
  const [isGeneratingDelivery, setIsGeneratingDelivery] = useState(false);

  // Computed calculations
  const itemsSubtotal = useMemo(() => {
    return orderItems.reduce((acc, item) => acc + (item.subtotal || item.quantidade * item.valorUnitario), 0);
  }, [orderItems]);

  const itemsTotalQtd = useMemo(() => {
    return orderItems.reduce((acc, item) => acc + (Number(item.quantidade) || 0), 0);
  }, [orderItems]);

  const orderValorTotal = useMemo(() => {
    return Math.max(0, itemsSubtotal - Number(orderDesconto || 0) + Number(orderAcrescimo || 0));
  }, [itemsSubtotal, orderDesconto, orderAcrescimo]);

  // Active client object when in existing client mode
  const currentClientObj = useMemo(() => {
    return clientes.find(c => c.id === selectedClientId);
  }, [clientes, selectedClientId]);

  // Filter clients for modal search when at least 3 letters are typed
  const filteredClientsForModal = useMemo(() => {
    const q = clientSearchQuery.trim().toLowerCase();
    if (!q || q.length < 3) return [];
    return clientes.filter(c => {
      const nomeMatch = c.nome?.toLowerCase().includes(q);
      const candMatch = c.candidato?.toLowerCase().includes(q);
      const partidoMatch = c.partido?.toLowerCase().includes(q);
      const respMatch = c.responsavel?.toLowerCase().includes(q);
      const telMatch = c.telefone?.toLowerCase().includes(q);
      const cnpjMatch = c.cnpjCampanha?.toLowerCase().includes(q);
      const bairroMatch = c.bairro?.toLowerCase().includes(q);
      const cidadeMatch = c.cidade?.toLowerCase().includes(q);
      const zonaMatch = c.zonaEleitoral?.toLowerCase().includes(q);
      return Boolean(nomeMatch || candMatch || partidoMatch || respMatch || telMatch || cnpjMatch || bairroMatch || cidadeMatch || zonaMatch);
    });
  }, [clientes, clientSearchQuery]);

  // Main search bar suggestions when at least 3 letters are typed
  const mainSearchSuggestions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q || q.length < 3) return { clientes: [], pedidos: [] };

    const matchedClients = clientes.filter(c =>
      c.nome?.toLowerCase().includes(q) ||
      c.candidato?.toLowerCase().includes(q) ||
      c.responsavel?.toLowerCase().includes(q)
    ).slice(0, 6);

    const matchedPedidos = pedidos.filter(p =>
      p.numeroPedido?.toLowerCase().includes(q) ||
      p.codigoRastreio?.toLowerCase().includes(q) ||
      p.clienteNome?.toLowerCase().includes(q) ||
      p.candidato?.toLowerCase().includes(q)
    ).slice(0, 6);

    return { clientes: matchedClients, pedidos: matchedPedidos };
  }, [clientes, pedidos, searchTerm]);

  // Handle client selection and autofill address
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clientes.find(c => c.id === clientId);
    if (client) {
      setClientSearchQuery(client.nome);
      setIsClientSearchDropdownOpen(false);
      setDeliveryEndereco(client.endereco || '');
      setDeliveryNumero(client.numero || '');
      setDeliveryBairro(client.bairro || '');
      setDeliveryCidade(client.cidade || 'São Paulo');
      setDeliveryZona(client.zonaEleitoral || 'Zona Central');
      setDeliveryRecebedor(client.responsavel || client.candidato || '');
      setDeliveryTelRecebedor(client.telefone || '');
    }
  };

  // Add Item to Order list
  const handleAddItem = () => {
    const isOutro = currTipoMaterial === 'outro';
    const matMeta = LISTA_MATERIAIS_PEDIDO.find(m => m.id === currTipoMaterial);

    const nomeMaterial = isOutro ? currCustomNome.trim() : (matMeta?.nome || 'Material Eleitoral');
    const descricao = isOutro ? currCustomDesc.trim() : (currCustomDesc.trim() || matMeta?.descPadrao || '');

    if (isOutro && (!nomeMaterial || !descricao)) {
      setFormError('Para materiais do tipo "Outro material", é obrigatório informar o Nome e a Descrição.');
      return;
    }

    if (currQtd <= 0) {
      setFormError('A quantidade do item deve ser maior que zero.');
      return;
    }

    const newItem: ItemPedido = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tipoMaterial: currTipoMaterial,
      nomeMaterial,
      descricao,
      quantidade: Number(currQtd),
      unidadeMedida: currUnidade,
      valorUnitario: 0,
      subtotal: 0,
      observacao: currItemObs.trim() ? currItemObs.trim() : undefined,
    };

    setOrderItems(prev => [...prev, newItem]);
    setFormError(null);

    // Reset current item inputs to handy default
    setCurrCustomNome('');
    setCurrCustomDesc('');
    setCurrItemObs('');
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(i => i.id !== itemId));
  };

  // Open New Order Modal
  const handleOpenNewOrder = () => {
    setEditingPedido(null);
    setIsNewClientMode(false);
    setUseLegacyClientSelect(false);
    setIsClientSearchDropdownOpen(false);
    
    // Start with empty client so user can type 3 letters to search, or pick first if available
    const firstClient = clientes[0];
    if (firstClient) {
      setSelectedClientId(firstClient.id);
      setClientSearchQuery(firstClient.nome);
      setDeliveryEndereco(firstClient.endereco || '');
      setDeliveryNumero(firstClient.numero || '');
      setDeliveryBairro(firstClient.bairro || '');
      setDeliveryCidade(firstClient.cidade || 'São Paulo');
      setDeliveryZona(firstClient.zonaEleitoral || 'Zona Central');
      setDeliveryRecebedor(firstClient.responsavel || firstClient.candidato || '');
      setDeliveryTelRecebedor(firstClient.telefone || '');
    } else {
      setSelectedClientId('');
      setClientSearchQuery('');
    }

    setOrderPrioridade('normal');
    setOrderModalidade('entrega');
    setOrderDataPrevisao(new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16));
    setOrderObservacoes('');
    setOrderDesconto(0);
    setOrderAcrescimo(0);
    setOrderItems([
      {
        id: 'item-1',
        tipoMaterial: 'santinhos_impressos',
        nomeMaterial: 'Santinhos impressos',
        descricao: 'Santinhos tradicionais 7x10cm 4x4 cores c/ coligação',
        quantidade: 5000,
        unidadeMedida: 'unidades',
        valorUnitario: 0.12,
        subtotal: 600,
      },
    ]);
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  // Open Edit Order Modal
  const handleOpenEditOrder = (pedido: Pedido) => {
    setEditingPedido(pedido);
    setIsNewClientMode(false);
    setUseLegacyClientSelect(false);
    setSelectedClientId(pedido.clienteId);
    const existingClient = clientes.find(c => c.id === pedido.clienteId);
    setClientSearchQuery(existingClient?.nome || pedido.clienteNome || '');
    setIsClientSearchDropdownOpen(false);

    setOrderPrioridade(pedido.prioridade || 'normal');
    setOrderModalidade(pedido.modalidade || 'entrega');
    setOrderDataPrevisao(pedido.dataPrevisao ? pedido.dataPrevisao.slice(0, 16) : '');
    setOrderObservacoes(pedido.observacoes || '');
    setOrderDesconto(pedido.desconto || 0);
    setOrderAcrescimo(pedido.acrescimo || 0);
    setOrderItems(pedido.itens && pedido.itens.length > 0 ? [...pedido.itens] : []);

    if (pedido.enderecoEntrega) {
      setDeliveryCep(pedido.enderecoEntrega.cep || '');
      setDeliveryEndereco(pedido.enderecoEntrega.endereco || '');
      setDeliveryNumero(pedido.enderecoEntrega.numero || '');
      setDeliveryComplemento(pedido.enderecoEntrega.complemento || '');
      setDeliveryBairro(pedido.enderecoEntrega.bairro || '');
      setDeliveryCidade(pedido.enderecoEntrega.cidade || 'São Paulo');
      setDeliveryUf(pedido.enderecoEntrega.uf || 'SP');
      setDeliveryZona(pedido.enderecoEntrega.zonaEleitoral || 'Zona Central');
      setDeliveryPontoRef(pedido.enderecoEntrega.pontoReferencia || '');
      setDeliveryRecebedor(pedido.enderecoEntrega.responsavelRecebimento || '');
      setDeliveryTelRecebedor(pedido.enderecoEntrega.telefoneRecebedor || '');
    }

    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  // Duplicate Order
  const handleDuplicateOrder = (pedido: Pedido) => {
    setEditingPedido(null);
    setIsNewClientMode(false);
    setUseLegacyClientSelect(false);
    setSelectedClientId(pedido.clienteId);
    const existingClient = clientes.find(c => c.id === pedido.clienteId);
    setClientSearchQuery(existingClient?.nome || pedido.clienteNome || '');
    setIsClientSearchDropdownOpen(false);

    setOrderPrioridade(pedido.prioridade || 'normal');
    setOrderModalidade(pedido.modalidade || 'entrega');
    setOrderDataPrevisao(new Date(Date.now() + 24 * 3600000).toISOString().slice(0, 16));
    setOrderObservacoes(`Duplicado a partir do pedido ${pedido.numeroPedido}`);
    setOrderDesconto(pedido.desconto || 0);
    setOrderAcrescimo(pedido.acrescimo || 0);
    setOrderItems(
      pedido.itens.map(i => ({
        ...i,
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      }))
    );

    if (pedido.enderecoEntrega) {
      setDeliveryCep(pedido.enderecoEntrega.cep || '');
      setDeliveryEndereco(pedido.enderecoEntrega.endereco || '');
      setDeliveryNumero(pedido.enderecoEntrega.numero || '');
      setDeliveryComplemento(pedido.enderecoEntrega.complemento || '');
      setDeliveryBairro(pedido.enderecoEntrega.bairro || '');
      setDeliveryCidade(pedido.enderecoEntrega.cidade || 'São Paulo');
      setDeliveryUf(pedido.enderecoEntrega.uf || 'SP');
      setDeliveryZona(pedido.enderecoEntrega.zonaEleitoral || 'Zona Central');
      setDeliveryPontoRef(pedido.enderecoEntrega.pontoReferencia || '');
      setDeliveryRecebedor(pedido.enderecoEntrega.responsavelRecebimento || '');
      setDeliveryTelRecebedor(pedido.enderecoEntrega.telefoneRecebedor || '');
    }

    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  // Submit Order (Save / Update with anti-duplicate prevention)
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double click

    setFormError(null);

    if (orderItems.length === 0) {
      setFormError('Adicione pelo menos um item de material ao pedido.');
      return;
    }

    if (!isNewClientMode && !selectedClientId) {
      setFormError('Selecione um cliente para vincular o pedido.');
      return;
    }

    if (isNewClientMode) {
      if (!newClientNome.trim() || !newClientCandidato.trim() || !newClientTelefone.trim()) {
        setFormError('Preencha os campos obrigatórios do novo cliente (Nome, Candidato e Telefone).');
        return;
      }
    }

    if (orderModalidade === 'entrega' && !deliveryEndereco.trim()) {
      setFormError('Para pedidos com modalidade Entrega, o endereço de destino é obrigatório.');
      return;
    }

    setIsSubmitting(true);

    try {
      const nowIso = new Date().toISOString();
      const client = currentClientObj;

      const cleanedItems = orderItems.map(item => ({
        id: item.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tipoMaterial: item.tipoMaterial || 'outro',
        nomeMaterial: item.nomeMaterial || 'Material Eleitoral',
        descricao: item.descricao || '',
        quantidade: Number(item.quantidade) || 1,
        unidadeMedida: item.unidadeMedida || 'unidades',
        valorUnitario: Number(item.valorUnitario) || 0,
        subtotal: Number(item.subtotal) || 0,
        ...(item.observacao ? { observacao: item.observacao } : {}),
      }));

      const enderecoEntregaObj = orderModalidade === 'entrega' ? {
        cep: deliveryCep || '01000-000',
        endereco: deliveryEndereco || '',
        numero: deliveryNumero || 'S/N',
        complemento: deliveryComplemento || '',
        bairro: deliveryBairro || '',
        cidade: deliveryCidade || 'São Paulo',
        uf: deliveryUf || 'SP',
        zonaEleitoral: deliveryZona || 'Zona Central',
        pontoReferencia: deliveryPontoRef || '',
        responsavelRecebimento: deliveryRecebedor || client?.responsavel || client?.candidato || 'Responsável Comitê',
        telefoneRecebedor: deliveryTelRecebedor || client?.telefone || '',
      } : null;

      if (editingPedido) {
        // UPDATE existing order
        const updatePayload: any = {
          clienteId: isNewClientMode ? editingPedido.clienteId : (selectedClientId || editingPedido.clienteId),
          clienteNome: isNewClientMode ? editingPedido.clienteNome : (client?.nome || editingPedido.clienteNome),
          candidato: isNewClientMode ? editingPedido.candidato : (client?.candidato || editingPedido.candidato || ''),
          partido: isNewClientMode ? editingPedido.partido : (client?.partido || editingPedido.partido || ''),
          cnpjCampanha: isNewClientMode ? editingPedido.cnpjCampanha : (client?.cnpjCampanha || editingPedido.cnpjCampanha || ''),
          responsavel: isNewClientMode ? editingPedido.responsavel : (client?.responsavel || editingPedido.responsavel || ''),
          telefone: isNewClientMode ? editingPedido.telefone : (client?.telefone || editingPedido.telefone || ''),
          itens: cleanedItems,
          quantidadeTotal: itemsTotalQtd,
          subtotal: itemsSubtotal,
          desconto: Number(orderDesconto || 0),
          acrescimo: Number(orderAcrescimo || 0),
          valorTotal: orderValorTotal,
          prioridade: orderPrioridade,
          modalidade: orderModalidade,
          ...(enderecoEntregaObj ? { enderecoEntrega: enderecoEntregaObj } : {}),
          dataPrevisao: orderDataPrevisao ? new Date(orderDataPrevisao).toISOString() : (editingPedido.dataPrevisao || new Date(Date.now() + 24 * 3600000).toISOString()),
          observacoes: orderObservacoes || '',
          updatedAt: nowIso,
          updatedBy: currentUser.id,
        };

        await pedidosRepo.update(editingPedido.id, updatePayload, currentUser.id);
        setFormSuccess(`Pedido ${editingPedido.numeroPedido} atualizado com sucesso!`);
      } else if (isNewClientMode) {
        // CREATE order with brand new client
        const res = await pedidosRepo.criarPedidoComNovoCliente(
          {
            nome: newClientNome.trim(),
            candidato: newClientCandidato.trim(),
            cargo: (newClientCargo || 'Deputado Federal') as any,
            partido: newClientPartido || 'INDEPENDENTE',
            numero: newClientNumero || '00',
            cnpjCampanha: newClientCnpj || '',
            responsavel: newClientResponsavel || newClientCandidato,
            telefone: newClientTelefone.trim(),
            email: newClientEmail || '',
            endereco: newClientEndereco || deliveryEndereco || '',
            numeroEnd: deliveryNumero || 'S/N',
            bairro: newClientBairro || deliveryBairro || '',
            cidade: newClientCidade || deliveryCidade || 'São Paulo',
            uf: deliveryUf || 'SP',
            cep: deliveryCep || '01000-000',
            zonaEleitoral: newClientZona || deliveryZona || 'Zona Central',
            status: 'ativo',
            totalEntregas: 0,
            volumeTotalMateriais: 0,
            dataCadastro: new Date().toISOString(),
          },
          {
            clienteNome: newClientNome.trim(),
            candidato: newClientCandidato.trim(),
            cargoCandidato: newClientCargo || 'Deputado Federal',
            partido: newClientPartido || '',
            numeroCandidato: newClientNumero || '',
            cnpjCampanha: newClientCnpj || '',
            responsavel: newClientResponsavel || newClientCandidato,
            telefone: newClientTelefone.trim(),
            email: newClientEmail || '',
            itens: cleanedItems,
            quantidadeTotal: itemsTotalQtd,
            subtotal: itemsSubtotal,
            desconto: Number(orderDesconto || 0),
            acrescimo: Number(orderAcrescimo || 0),
            valorTotal: orderValorTotal,
            prioridade: orderPrioridade,
            modalidade: orderModalidade,
            ...(enderecoEntregaObj ? { enderecoEntrega: enderecoEntregaObj } : {}),
            status: 'pendente',
            dataPedido: nowIso,
            dataPrevisao: orderDataPrevisao ? new Date(orderDataPrevisao).toISOString() : new Date(Date.now() + 24 * 3600000).toISOString(),
            observacoes: orderObservacoes || '',
            criadoPor: currentUser.id,
            criadoPorNome: currentUser.nome,
            historicoStatus: [
              {
                status: 'pendente',
                dataHora: nowIso,
                usuarioId: currentUser.id,
                usuarioNome: currentUser.nome,
                observacao: 'Pedido criado com novo cliente cadastrado simultaneamente',
              },
            ],
          },
          currentUser.id,
          currentUser.nome
        );
        setFormSuccess(`Pedido ${res.numeroPedido} e cliente cadastrados com sucesso!`);
      } else {
        // CREATE order for existing client
        const res = await pedidosRepo.createPedido(
          {
            clienteId: selectedClientId,
            clienteNome: client?.nome || 'Comitê Central',
            candidato: client?.candidato || '',
            cargoCandidato: client?.cargo || 'Deputado Federal',
            partido: client?.partido || '',
            numeroCandidato: client?.numero || '',
            cnpjCampanha: client?.cnpjCampanha || '',
            responsavel: client?.responsavel || '',
            telefone: client?.telefone || '',
            email: client?.email || '',
            itens: cleanedItems,
            quantidadeTotal: itemsTotalQtd,
            subtotal: itemsSubtotal,
            desconto: Number(orderDesconto || 0),
            acrescimo: Number(orderAcrescimo || 0),
            valorTotal: orderValorTotal,
            prioridade: orderPrioridade,
            modalidade: orderModalidade,
            ...(enderecoEntregaObj ? { enderecoEntrega: enderecoEntregaObj } : {}),
            status: 'pendente',
            dataPedido: nowIso,
            dataPrevisao: orderDataPrevisao ? new Date(orderDataPrevisao).toISOString() : new Date(Date.now() + 24 * 3600000).toISOString(),
            observacoes: orderObservacoes || '',
            criadoPor: currentUser.id,
            criadoPorNome: currentUser.nome,
            historicoStatus: [
              {
                status: 'pendente',
                dataHora: nowIso,
                usuarioId: currentUser.id,
                usuarioNome: currentUser.nome,
                observacao: 'Pedido cadastrado no sistema',
              },
            ],
          },
          currentUser.id,
          currentUser.nome
        );
        setFormSuccess(`Pedido ${res.numeroPedido} cadastrado com sucesso!`);
      }

      setTimeout(() => {
        setIsModalOpen(false);
        setIsSubmitting(false);
        setFormSuccess(null);
        if (onRefresh) onRefresh();
      }, 1000);
    } catch (err: any) {
      console.error('Erro ao salvar pedido:', err);
      setFormError(err.message || 'Erro ao persistir pedido no Firestore.');
      setIsSubmitting(false);
    }
  };

  // Confirm Dispatch / Expedição
  const handleConfirmDispatch = async () => {
    if (!dispatchPedido) return;
    setIsDispatching(true);
    try {
      await pedidosRepo.confirmarEnvioExpedicao(
        dispatchPedido.id,
        dispatchStatusAlvo,
        { id: currentUser.id, nome: currentUser.nome },
        dispatchObs.trim() || undefined
      );

      // Auto-import to Expedição queue
      try {
        await expedicoesRepo.importarPedidoParaExpedicao(
          { ...dispatchPedido, status: dispatchStatusAlvo } as any,
          { id: currentUser.id, nome: currentUser.nome }
        );
      } catch (e) {
        console.warn('Expedição import sync:', e);
      }

      setDispatchPedido(null);
      setDispatchObs('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Erro ao atualizar status de expedição: ${err.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  // Generate Delivery from Order
  const handleGenerateDelivery = async () => {
    if (!deliveryPedido) return;
    setIsGeneratingDelivery(true);
    try {
      const selectedMb = motoboys.find(m => m.id === deliverySelectedMotoboy);
      const res = await pedidosRepo.gerarEntregaAPartirDoPedido(
        deliveryPedido.id,
        { id: currentUser.id, nome: currentUser.nome, papel: currentUser.papel },
        {
          motoboyId: selectedMb?.id,
          motoboyNome: selectedMb?.nome,
          motoboyTelefone: selectedMb?.telefone,
          motoboyPlaca: selectedMb?.placaMoto,
          valorFrete: Number(deliveryFreteValor || 45),
          observacoes: deliveryObs.trim() || undefined,
        }
      );
      alert(`Sucesso! Entrega gerada com código de rastreamento: ${res.codigoRastreio}`);
      setDeliveryPedido(null);
      setDeliveryObs('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Não foi possível gerar a entrega: ${err.message}`);
    } finally {
      setIsGeneratingDelivery(false);
    }
  };

  // Cancel Order
  const handleCancelPedido = async () => {
    if (!cancelPedidoModal) return;
    try {
      await pedidosRepo.cancelarPedido(
        cancelPedidoModal.id,
        { id: currentUser.id, nome: currentUser.nome },
        cancelReason.trim() || 'Cancelado pelo operador'
      );
      setCancelPedidoModal(null);
      setCancelReason('');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Erro ao cancelar pedido: ${err.message}`);
    }
  };

  // Open WhatsApp helper
  const handleOpenWhatsAppModal = (pedido: Pedido) => {
    const cleanPhone = (pedido.telefone || '').replace(/\D/g, '');
    const dataFormatada = formatDate(pedido.dataPedido);
    const itensTexto = pedido.itens.map(i => `• ${i.quantidade}x ${i.nomeMaterial}`).join('\n');
    const valorFormatado = formatCurrency(pedido.valorTotal);
    const rastreioTexto = pedido.codigoRastreio ? `\n📦 Código de Rastreio: *${pedido.codigoRastreio}*` : '';

    const msg = `Olá *${pedido.responsavel || pedido.candidato}*,\n\nSeu pedido *#${pedido.numeroPedido}* da campanha *${pedido.candidato} (${pedido.partido || 'Coligação'})* foi registrado no sistema *FleetMoto*.\n\n*Resumo dos Materiais:*\n${itensTexto}\n\n📅 *Data:* ${dataFormatada}\n📍 *Modalidade:* ${pedido.modalidade === 'entrega' ? 'Entrega no Comitê' : 'Retirada no Centro de Distribuição'}${rastreioTexto}\n\nQualquer dúvida, estamos à disposição!\n*Equipe de Logística FleetMoto 2026*`;

    setWhatsappModal({
      pedido,
      message: msg,
      phone: cleanPhone,
    });
  };

  const handleSendWhatsApp = () => {
    if (!whatsappModal) return;
    const encoded = encodeURIComponent(whatsappModal.message);
    const url = whatsappModal.phone
      ? `https://wa.me/55${whatsappModal.phone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
    setWhatsappModal(null);
  };

  // Computed reference dates for period filtering
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const next7DaysStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Tab counters (real-time)
  const tabCounts = useMemo(() => {
    let todos = pedidos.length;
    let hoje = 0;
    let amanha = 0;
    let semana = 0;
    let pendentes = 0;

    pedidos.forEach(p => {
      const dateP = p.dataPedido ? p.dataPedido.slice(0, 10) : '';
      const datePrev = p.dataPrevisao ? p.dataPrevisao.slice(0, 10) : '';

      if (datePrev === todayStr || dateP === todayStr) {
        hoje++;
      }
      if (datePrev === tomorrowStr || dateP === tomorrowStr) {
        amanha++;
      }
      if (
        (datePrev && datePrev >= todayStr && datePrev <= next7DaysStr) ||
        (dateP && dateP >= todayStr && dateP <= next7DaysStr)
      ) {
        semana++;
      }
      if (['pendente', 'rascunho', 'confirmado', 'em_separacao'].includes(p.status)) {
        pendentes++;
      }
    });

    return { todos, hoje, amanha, semana, pendentes };
  }, [pedidos, todayStr, tomorrowStr, next7DaysStr]);

  // Filtered Orders
  const filteredPedidos = useMemo(() => {
    return pedidos.filter(p => {
      // Period Tab Filter (Aba de Pedidos com opção "Amanhã")
      if (periodTab === 'hoje') {
        const isToday =
          (p.dataPrevisao && p.dataPrevisao.slice(0, 10) === todayStr) ||
          (p.dataPedido && p.dataPedido.slice(0, 10) === todayStr);
        if (!isToday) return false;
      } else if (periodTab === 'amanha') {
        const isTomorrow =
          (p.dataPrevisao && p.dataPrevisao.slice(0, 10) === tomorrowStr) ||
          (p.dataPedido && p.dataPedido.slice(0, 10) === tomorrowStr);
        if (!isTomorrow) return false;
      } else if (periodTab === 'semana') {
        const pDate = p.dataPrevisao?.slice(0, 10) || p.dataPedido?.slice(0, 10) || '';
        if (!pDate || pDate < todayStr || pDate > next7DaysStr) return false;
      } else if (periodTab === 'pendentes') {
        if (!['pendente', 'rascunho', 'confirmado', 'em_separacao'].includes(p.status)) return false;
      }

      // Search
      const search = searchTerm.toLowerCase().trim();
      const matchSearch =
        !search ||
        p.numeroPedido?.toLowerCase().includes(search) ||
        p.clienteNome?.toLowerCase().includes(search) ||
        p.candidato?.toLowerCase().includes(search) ||
        p.cnpjCampanha?.toLowerCase().includes(search) ||
        p.codigoRastreio?.toLowerCase().includes(search) ||
        p.itens?.some(i => i.nomeMaterial?.toLowerCase().includes(search) || i.descricao?.toLowerCase().includes(search));

      // Status
      const matchStatus = statusFilter === 'todos' || p.status === statusFilter;

      // Modalidade
      const matchModalidade = modalidadeFilter === 'todos' || p.modalidade === modalidadeFilter;

      // Prioridade
      const matchPrioridade = prioridadeFilter === 'todos' || p.prioridade === prioridadeFilter;

      // Date filter
      const matchDate = !dateFilter || p.dataPedido?.startsWith(dateFilter) || p.dataPrevisao?.startsWith(dateFilter);

      return matchSearch && matchStatus && matchModalidade && matchPrioridade && matchDate;
    });
  }, [pedidos, periodTab, todayStr, tomorrowStr, next7DaysStr, searchTerm, statusFilter, modalidadeFilter, prioridadeFilter, dateFilter]);

  // Quick stats
  const stats = useMemo(() => {
    const total = pedidos.length;
    const pendentes = pedidos.filter(p => ['pendente', 'rascunho', 'confirmado'].includes(p.status)).length;
    const emExpedicao = pedidos.filter(p => ['em_separacao', 'pronto'].includes(p.status)).length;
    const enviados = pedidos.filter(p => ['enviado', 'entregue'].includes(p.status)).length;
    const totalMateriais = pedidos
      .filter(p => p.status !== 'cancelado')
      .reduce((acc, p) => acc + (Number(p.quantidadeTotal) || 0), 0);

    return { total, pendentes, emExpedicao, enviados, totalMateriais };
  }, [pedidos]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 text-[#E05328] rounded-xl border border-orange-200">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Gestão de Pedidos de Materiais
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Controle integral de requisições, separação em estoque, expedição e geração automática de entregas
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="Atualizar dados em tempo real"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            id="btn-inserir-pedido"
            onClick={handleOpenNewOrder}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#E05328] hover:bg-[#c9451e] text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Inserir Pedido</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Pedidos</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500 mt-1">Registrados no sistema</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pendentes</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-blue-700">{stats.pendentes}</p>
          <p className="text-xs text-blue-600/80 mt-1">Aguardando separação</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Em Expedição</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700">{stats.emExpedicao}</p>
          <p className="text-xs text-amber-600/80 mt-1">Em separação / Prontos</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Despachados</span>
            <Truck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">{stats.enviados}</p>
          <p className="text-xs text-emerald-600/80 mt-1">Enviados / Entregues</p>
        </div>

        <div className="col-span-2 sm:col-span-2 lg:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Volume Total</span>
            <Layers className="w-4 h-4 text-[#E05328]" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{stats.totalMateriais.toLocaleString('pt-BR')} un.</p>
          <p className="text-xs text-slate-500 mt-1">Materiais requisitados</p>
        </div>
      </div>

      {/* Period Navigation Tabs with dedicated "Amanhã" tab */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            id="tab-pedidos-todos"
            onClick={() => setPeriodTab('todos')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodTab === 'todos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Todos os Pedidos</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                periodTab === 'todos' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tabCounts.todos}
            </span>
          </button>

          <button
            type="button"
            id="tab-pedidos-hoje"
            onClick={() => setPeriodTab('hoje')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodTab === 'hoje'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Hoje</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                periodTab === 'hoje' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {tabCounts.hoje}
            </span>
          </button>

          {/* Dedicated Tab: AMANHÃ */}
          <button
            type="button"
            id="tab-pedidos-amanha"
            onClick={() => setPeriodTab('amanha')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodTab === 'amanha'
                ? 'bg-[#E05328] text-white shadow-md ring-2 ring-orange-400/40'
                : 'text-orange-950 bg-orange-50/80 hover:bg-orange-100 border border-orange-200/90 font-bold'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${periodTab === 'amanha' ? 'text-white' : 'text-[#E05328]'}`} />
            <span>Amanhã</span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                periodTab === 'amanha' ? 'bg-white text-[#E05328]' : 'bg-[#E05328] text-white shadow-xs'
              }`}
            >
              {tabCounts.amanha}
            </span>
          </button>

          <button
            type="button"
            id="tab-pedidos-semana"
            onClick={() => setPeriodTab('semana')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodTab === 'semana'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Próximos 7 Dias</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                periodTab === 'semana' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tabCounts.semana}
            </span>
          </button>

          <button
            type="button"
            id="tab-pedidos-pendentes"
            onClick={() => setPeriodTab('pendentes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              periodTab === 'pendentes'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-amber-50 hover:text-amber-700'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Pendentes</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                periodTab === 'pendentes' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {tabCounts.pendentes}
            </span>
          </button>
        </div>

        {/* Active tab contextual indicator */}
        {periodTab === 'amanha' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-xl text-xs font-semibold text-orange-900">
            <span className="w-2 h-2 rounded-full bg-[#E05328] animate-ping" />
            <span>Exibindo pedidos com previsão ou agendamento para <strong>Amanhã</strong> ({formatDate(tomorrowStr)})</span>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nº do pedido, cliente, candidato, CNPJ, rastreio ou material..."
              value={searchTerm}
              onChange={e => {
                const val = e.target.value;
                setSearchTerm(val);
                setIsMainSearchDropdownOpen(val.trim().length >= 3);
              }}
              onFocus={() => {
                if (searchTerm.trim().length >= 3) {
                  setIsMainSearchDropdownOpen(true);
                }
              }}
              className="w-full pl-11 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#E05328] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setIsMainSearchDropdownOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Main Search Autocomplete Suggestions Popup */}
            {isMainSearchDropdownOpen && searchTerm.trim().length >= 3 && (
              <div className="absolute z-40 left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100 animate-in fade-in duration-150">
                <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-[#E05328]" />
                    Sugestões para &ldquo;{searchTerm}&rdquo;
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMainSearchDropdownOpen(false)}
                    className="p-0.5 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {mainSearchSuggestions.clientes.length === 0 && mainSearchSuggestions.pedidos.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    Nenhum cliente ou pedido específico corresponde a &ldquo;{searchTerm}&rdquo;. A tabela filtrará todos os campos.
                  </div>
                ) : (
                  <div>
                    {mainSearchSuggestions.clientes.length > 0 && (
                      <div className="p-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                          Clientes Correspondentes
                        </p>
                        {mainSearchSuggestions.clientes.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSearchTerm(c.nome);
                              setIsMainSearchDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-orange-50 rounded-lg flex items-center justify-between group"
                          >
                            <div>
                              <span className="font-bold text-slate-900 group-hover:text-[#E05328]">
                                {c.nome}
                              </span>
                              <span className="text-slate-500 ml-2">
                                (Candidato: {c.candidato})
                              </span>
                            </div>
                            <span className="text-[11px] text-[#E05328] font-semibold opacity-0 group-hover:opacity-100">
                              Filtrar pedidos
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {mainSearchSuggestions.pedidos.length > 0 && (
                      <div className="p-2 border-t border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                          Pedidos Encontrados
                        </p>
                        {mainSearchSuggestions.pedidos.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSearchTerm(p.numeroPedido);
                              setIsMainSearchDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-orange-50 rounded-lg flex items-center justify-between group"
                          >
                            <div>
                              <span className="font-mono font-bold text-slate-900 group-hover:text-[#E05328]">
                                {p.numeroPedido}
                              </span>
                              <span className="text-slate-600 ml-2">
                                {p.clienteNome} • {p.quantidadeTotal} un.
                              </span>
                            </div>
                            <span className="text-[11px] text-[#E05328] font-semibold opacity-0 group-hover:opacity-100">
                              Ver pedido
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#E05328]"
            >
              <option value="todos">Status: Todos</option>
              <option value="rascunho">Rascunho</option>
              <option value="pendente">Pendente</option>
              <option value="confirmado">Confirmado</option>
              <option value="em_separacao">Em Separação</option>
              <option value="pronto">Pronto p/ Expedição</option>
              <option value="enviado">Enviado / Em Trânsito</option>
              <option value="entregue">Entregue</option>
              <option value="cancelado">Cancelado</option>
            </select>

            <select
              value={modalidadeFilter}
              onChange={e => setModalidadeFilter(e.target.value)}
              className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#E05328]"
            >
              <option value="todos">Modalidade: Todas</option>
              <option value="entrega">Entrega no Destino</option>
              <option value="retirada">Retirada no Local</option>
            </select>

            <select
              value={prioridadeFilter}
              onChange={e => setPrioridadeFilter(e.target.value)}
              className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#E05328]"
            >
              <option value="todos">Prioridade: Todas</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente (Comício)</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#E05328]"
              title="Filtrar por data específica"
            />

            {(searchTerm || statusFilter !== 'todos' || modalidadeFilter !== 'todos' || prioridadeFilter !== 'todos' || dateFilter || periodTab !== 'todos') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('todos');
                  setModalidadeFilter('todos');
                  setPrioridadeFilter('todos');
                  setDateFilter('');
                  setPeriodTab('todos');
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 cursor-pointer"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Pedido / Data</th>
                <th className="py-3.5 px-4">Cliente / Candidato</th>
                <th className="py-3.5 px-4">Materiais & Qtd</th>
                <th className="py-3.5 px-4">Modalidade & Destino</th>
                <th className="py-3.5 px-4">Prioridade</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPedidos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-base font-semibold text-slate-700">Nenhum pedido encontrado</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {pedidos.length === 0
                        ? 'Cadastre o primeiro pedido clicando no botão "Inserir Pedido".'
                        : 'Ajuste os filtros ou o termo de busca para visualizar os registros.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPedidos.map(pedido => {
                  const badge = getStatusBadgeClass(pedido.status);
                  const prioridadeMeta = formatPrioridadePedido(pedido.prioridade);

                  return (
                    <tr
                      key={pedido.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Pedido / Data */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm font-mono">
                            {pedido.numeroPedido}
                          </span>
                          {pedido.codigoRastreio && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-md">
                              {pedido.codigoRastreio}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDate(pedido.dataPedido)}</span>
                        </div>
                        {pedido.dataPrevisao && (
                          <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="text-slate-400">Prev: {formatDateTime(pedido.dataPrevisao)}</span>
                            {pedido.dataPrevisao.slice(0, 10) === tomorrowStr && (
                              <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-orange-100 text-orange-900 border border-orange-300 rounded-md inline-flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-[#E05328]" />
                                Amanhã
                              </span>
                            )}
                            {pedido.dataPrevisao.slice(0, 10) === todayStr && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300 rounded-md">
                                Hoje
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Cliente / Candidato */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-semibold text-slate-900">
                          {pedido.clienteNome}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {pedido.candidato} {pedido.partido ? `(${pedido.partido})` : ''}
                        </div>
                        {pedido.telefone && (
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{pedido.telefone}</span>
                          </div>
                        )}
                      </td>

                      {/* Materiais & Qtd */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-medium text-slate-900">
                          {pedido.quantidadeTotal} un. / itens
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 max-w-xs line-clamp-2">
                          {pedido.itens && pedido.itens.length > 0
                            ? pedido.itens.map(i => `${i.quantidade}x ${i.nomeMaterial}`).join(', ')
                            : 'Sem itens especificados'}
                        </div>
                        {pedido.itens && pedido.itens.length > 1 && (
                          <div className="text-[11px] text-orange-600 font-medium mt-0.5">
                            +{pedido.itens.length - 1} outro(s) tipo(s)
                          </div>
                        )}
                      </td>

                      {/* Modalidade & Destino */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          {pedido.modalidade === 'entrega' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                              <Truck className="w-3 h-3" /> Entrega
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                              <Building2 className="w-3 h-3" /> Retirada
                            </span>
                          )}
                        </div>
                        {pedido.modalidade === 'entrega' && pedido.enderecoEntrega && (
                          <div className="text-xs text-slate-500 mt-1 max-w-[200px] truncate" title={`${pedido.enderecoEntrega.endereco}, ${pedido.enderecoEntrega.bairro}`}>
                            {pedido.enderecoEntrega.bairro} - {pedido.enderecoEntrega.cidade}
                          </div>
                        )}
                      </td>

                      {/* Prioridade */}
                      <td className="py-4 px-4 align-top">
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${prioridadeMeta.badgeClass}`}>
                          {prioridadeMeta.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 align-top">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${badge.bg} ${badge.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {formatStatusPedido(pedido.status)}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Visualizar */}
                          <button
                            onClick={() => setViewingPedido(pedido)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Visualizar detalhes do pedido"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* WhatsApp */}
                          <button
                            onClick={() => handleOpenWhatsAppModal(pedido)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Enviar resumo no WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {/* Expedição / Separar */}
                          {['pendente', 'confirmado', 'em_separacao', 'pronto'].includes(pedido.status) && (
                            <button
                              onClick={() => {
                                setDispatchPedido(pedido);
                                setDispatchStatusAlvo(
                                  pedido.status === 'pendente' ? 'em_separacao' :
                                  pedido.status === 'em_separacao' ? 'pronto' : 'enviado'
                                );
                              }}
                              className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Atualizar status de Expedição"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}

                          {/* Gerar Entrega */}
                          {!pedido.entregaId && pedido.status !== 'cancelado' && (
                            <button
                              onClick={() => {
                                setDeliveryPedido(pedido);
                                setDeliveryFreteValor(45.0);
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Gerar Entrega e Rastreamento"
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                          )}

                          {/* Editar */}
                          {pedido.status !== 'cancelado' && (
                            <button
                              onClick={() => handleOpenEditOrder(pedido)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Editar pedido"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Duplicar */}
                          <button
                            onClick={() => handleDuplicateOrder(pedido)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Duplicar pedido"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Imprimir */}
                          <button
                            onClick={() => setPrintPedido(pedido)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Imprimir pedido"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Cancelar */}
                          {pedido.status !== 'cancelado' && (
                            <button
                              onClick={() => {
                                setCancelPedidoModal(pedido);
                                setCancelReason('');
                              }}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Cancelar pedido"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: NOVO PEDIDO / EDITAR PEDIDO                                        */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-[#E05328] rounded-xl">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingPedido ? `Editar Pedido #${editingPedido.numeroPedido}` : 'Novo Pedido de Materiais'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Preencha as informações do cliente, adicione os materiais de campanha e defina a entrega
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Step 1: Cliente Selection */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#E05328]" />
                    1. Vinculação do Cliente / Comitê
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsNewClientMode(false)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                        !isNewClientMode
                          ? 'bg-[#E05328] text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Cliente Cadastrado
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNewClientMode(true)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                        isNewClientMode
                          ? 'bg-[#E05328] text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      + Cadastrar Novo Cliente
                    </button>
                  </div>
                </div>

                {!isNewClientMode ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800">
                        Buscar Cliente Cadastrado (digite ao menos 3 letras) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setUseLegacyClientSelect(prev => !prev)}
                        className="text-[11px] font-semibold text-[#E05328] hover:underline transition-colors"
                      >
                        {useLegacyClientSelect ? 'Usar busca preditiva' : 'Ver lista suspensa completa'}
                      </button>
                    </div>

                    {!useLegacyClientSelect ? (
                      <div className="relative">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Digite as 3 primeiras letras do nome (ex: Com, Dep, Gab, Sil)..."
                            value={clientSearchQuery}
                            onChange={e => {
                              const val = e.target.value;
                              setClientSearchQuery(val);
                              setIsClientSearchDropdownOpen(val.trim().length >= 3);
                            }}
                            onFocus={() => {
                              if (clientSearchQuery.trim().length >= 3) {
                                setIsClientSearchDropdownOpen(true);
                              }
                            }}
                            className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-[#E05328] shadow-xs"
                          />
                          {clientSearchQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setClientSearchQuery('');
                                setIsClientSearchDropdownOpen(false);
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Search Status & Helper Text */}
                        <div className="mt-1.5 flex items-center justify-between text-[11px]">
                          {clientSearchQuery.trim().length === 0 ? (
                            <span className="text-slate-400">
                              💡 Digite ao menos 3 letras para abrir o popup com os clientes encontrados.
                            </span>
                          ) : clientSearchQuery.trim().length < 3 ? (
                            <span className="text-amber-600 font-medium">
                              ⏳ Digite mais {3 - clientSearchQuery.trim().length} letra(s) para listar os clientes no popup...
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              {filteredClientsForModal.length} cliente(s) encontrado(s) para &ldquo;{clientSearchQuery}&rdquo;
                            </span>
                          )}

                          {clientSearchQuery.trim().length >= 3 && (
                            <button
                              type="button"
                              onClick={() => setIsClientSearchDropdownOpen(prev => !prev)}
                              className="text-[#E05328] font-bold hover:underline"
                            >
                              {isClientSearchDropdownOpen ? 'Fechar popup' : 'Abrir popup'}
                            </button>
                          )}
                        </div>

                        {/* Floating Dropdown / Popup Results */}
                        {isClientSearchDropdownOpen && clientSearchQuery.trim().length >= 3 && (
                          <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-80 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                            <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
                              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                <Search className="w-3.5 h-3.5 text-[#E05328]" />
                                Resultados da Busca ({filteredClientsForModal.length})
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsClientSearchDropdownOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {filteredClientsForModal.length === 0 ? (
                              <div className="p-5 text-center space-y-2">
                                <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                                <p className="text-xs text-slate-700 font-semibold">
                                  Nenhum cliente cadastrado com as letras &ldquo;{clientSearchQuery}&rdquo;
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  Verifique a ortografia ou cadastre um novo cliente agora mesmo.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsNewClientMode(true);
                                    setNewClientNome(clientSearchQuery);
                                    setIsClientSearchDropdownOpen(false);
                                  }}
                                  className="mt-2 px-3 py-1.5 text-xs font-bold text-white bg-[#E05328] hover:bg-orange-600 rounded-lg inline-flex items-center gap-1 shadow-xs"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Cadastrar &ldquo;{clientSearchQuery}&rdquo;
                                </button>
                              </div>
                            ) : (
                              <div className="divide-y divide-slate-100">
                                {filteredClientsForModal.map(c => {
                                  const isSelected = selectedClientId === c.id;
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => handleSelectClient(c.id)}
                                      className={`w-full text-left p-3.5 hover:bg-orange-50/70 transition-all flex items-start justify-between gap-3 group ${
                                        isSelected ? 'bg-orange-50/90 border-l-4 border-[#E05328]' : ''
                                      }`}
                                    >
                                      <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#E05328]' : 'text-slate-400 group-hover:text-[#E05328]'}`} />
                                          <span className="text-xs font-bold text-slate-900 group-hover:text-[#E05328]">
                                            {c.nome}
                                          </span>
                                          {isSelected && (
                                            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-orange-100 text-orange-800 rounded">
                                              Selecionado
                                            </span>
                                          )}
                                        </div>

                                        <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-6">
                                          <span className="font-semibold text-slate-800">
                                            Candidato: {c.candidato} {c.partido ? `(${c.partido})` : ''}
                                          </span>
                                          {c.cargo && <span className="text-slate-500">• {c.cargo}</span>}
                                          {c.telefone && <span className="text-slate-500">• Tel: {c.telefone}</span>}
                                        </div>

                                        {(c.endereco || c.bairro || c.zonaEleitoral) && (
                                          <div className="text-[10px] text-slate-400 flex items-center gap-1 pl-6">
                                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                            <span className="truncate">
                                              {c.endereco ? `${c.endereco}, ` : ''}{c.bairro ? `${c.bairro} - ` : ''}{c.cidade}
                                              {c.zonaEleitoral ? ` (${c.zonaEleitoral})` : ''}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      <div className="shrink-0 pt-1 flex items-center gap-1 text-xs font-bold text-[#E05328] group-hover:translate-x-0.5 transition-transform">
                                        <span>Selecionar</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <select
                        value={selectedClientId}
                        onChange={e => handleSelectClient(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-[#E05328]"
                        required={!isNewClientMode}
                      >
                        <option value="">-- Selecione um cliente da lista --</option>
                        {clientes.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.nome} — {c.candidato} ({c.partido || 'S/P'}) | {c.telefone}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Selected Client Card Details */}
                    {currentClientObj ? (
                      <div className="p-3.5 bg-white rounded-xl border border-orange-200/80 shadow-xs space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="p-1 bg-emerald-100 text-emerald-700 rounded-md">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {currentClientObj.nome}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClientId('');
                              setClientSearchQuery('');
                              setIsClientSearchDropdownOpen(false);
                            }}
                            className="text-[11px] font-semibold text-slate-500 hover:text-red-600 transition-colors"
                          >
                            Trocar Cliente
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600">
                          <div>
                            <span className="font-semibold text-slate-700">Candidato:</span> {currentClientObj.candidato}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-700">Cargo:</span> {currentClientObj.cargo || 'N/I'}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-700">Telefone:</span> {currentClientObj.telefone}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-700">CNPJ:</span> {currentClientObj.cnpjCampanha || 'N/I'}
                          </div>
                          <div className="col-span-2 sm:col-span-4 text-slate-500 text-[11px]">
                            <span className="font-semibold text-slate-700">Endereço:</span>{' '}
                            {currentClientObj.endereco ? `${currentClientObj.endereco}, ${currentClientObj.numero || 'S/N'}` : 'Não informado'}
                            {currentClientObj.bairro ? ` - ${currentClientObj.bairro}` : ''}, {currentClientObj.cidade}
                            {currentClientObj.zonaEleitoral ? ` (${currentClientObj.zonaEleitoral})` : ''}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Nenhum cliente selecionado. Digite ao menos 3 letras no campo de busca para selecionar o cliente no popup.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Comitê / Cliente *</label>
                      <input
                        type="text"
                        placeholder="Ex: Comitê Central Dr. Silva"
                        value={newClientNome}
                        onChange={e => setNewClientNome(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        required={isNewClientMode}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Candidato *</label>
                      <input
                        type="text"
                        placeholder="Ex: Dr. Silva"
                        value={newClientCandidato}
                        onChange={e => setNewClientCandidato(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        required={isNewClientMode}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo</label>
                      <input
                        type="text"
                        placeholder="Ex: Deputado Estadual"
                        value={newClientCargo}
                        onChange={e => setNewClientCargo(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Partido / Número</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Partido"
                          value={newClientPartido}
                          onChange={e => setNewClientPartido(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Nº"
                          value={newClientNumero}
                          onChange={e => setNewClientNumero(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">CNPJ de Campanha</label>
                      <input
                        type="text"
                        placeholder="00.000.000/0001-00"
                        value={newClientCnpj}
                        onChange={e => setNewClientCnpj(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Responsável</label>
                      <input
                        type="text"
                        placeholder="Nome do coordenador"
                        value={newClientResponsavel}
                        onChange={e => setNewClientResponsavel(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone WhatsApp *</label>
                      <input
                        type="text"
                        placeholder="(11) 98888-7777"
                        value={newClientTelefone}
                        onChange={e => setNewClientTelefone(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        required={isNewClientMode}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                      <input
                        type="email"
                        placeholder="contato@campanha.com.br"
                        value={newClientEmail}
                        onChange={e => setNewClientEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Itens do Pedido */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ListPlus className="w-4 h-4 text-[#E05328]" />
                    2. Materiais do Pedido ({orderItems.length} tipos de itens)
                  </h3>
                  <div className="text-xs font-semibold text-slate-700">
                    Total Itens: <span className="text-[#E05328] font-bold">{orderItems.reduce((acc, i) => acc + (Number(i.quantidade) || 0), 0).toLocaleString('pt-BR')} un.</span>
                  </div>
                </div>

                {/* Add Item Sub-form */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Material *</label>
                      <select
                        value={currTipoMaterial}
                        onChange={e => {
                          setCurrTipoMaterial(e.target.value);
                          const m = LISTA_MATERIAIS_PEDIDO.find(x => x.id === e.target.value);
                          if (m && e.target.value !== 'outro') {
                            setCurrCustomDesc(m.descPadrao);
                          }
                        }}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                      >
                        {LISTA_MATERIAIS_PEDIDO.map(mat => (
                          <option key={mat.id} value={mat.id}>
                            {mat.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Unidade</label>
                      <select
                        value={currUnidade}
                        onChange={e => setCurrUnidade(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                      >
                        <option value="unidade">Unidade(s)</option>
                        <option value="milheiro">Milheiro(s)</option>
                        <option value="kit">Kit(s)</option>
                        <option value="fardo">Fardo(s)</option>
                        <option value="caixa">Caixa(s)</option>
                        <option value="pacote">Pacote(s)</option>
                        <option value="rolo">Rolo(s)</option>
                        <option value="metro_quadrado">m² (Metro Quad.)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Quantidade *</label>
                      <input
                        type="number"
                        min="1"
                        value={currQtd}
                        onChange={e => setCurrQtd(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                      />
                    </div>
                  </div>

                  {currTipoMaterial === 'outro' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-orange-50/50 rounded-lg border border-orange-200">
                      <div>
                        <label className="block text-xs font-semibold text-orange-900 mb-1">
                          Nome do Material Personalizado *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Faixa de TNT 10 metros com ilhós"
                          value={currCustomNome}
                          onChange={e => setCurrCustomNome(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-orange-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-orange-900 mb-1">
                          Descrição Detalhada do Material *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Impressão serigráfica com logo da coligação"
                          value={currCustomDesc}
                          onChange={e => setCurrCustomDesc(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-orange-200 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Observação do Item</label>
                      <input
                        type="text"
                        placeholder="Ex: Embalar em fardos de 500 para entrega no comitê"
                        value={currItemObs}
                        onChange={e => setCurrItemObs(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                      />
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Adicionar Item</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items List Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                        <th className="py-2.5 px-3">Material</th>
                        <th className="py-2.5 px-3">Qtd</th>
                        <th className="py-2.5 px-3">Unid.</th>
                        <th className="py-2.5 px-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orderItems.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3">
                            <div className="font-semibold text-slate-900">{item.nomeMaterial}</div>
                            {item.descricao && (
                              <div className="text-[11px] text-slate-500 line-clamp-1">{item.descricao}</div>
                            )}
                            {item.observacao && (
                              <div className="text-[10px] text-orange-600 italic">Obs: {item.observacao}</div>
                            )}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800">{item.quantidade}</td>
                          <td className="py-2 px-3 text-slate-600">{formatUnidadeMedida(item.unidadeMedida)}</td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 3: Modalidade & Endereço */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#E05328]" />
                  3. Modalidade e Local de Destino
                </h3>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="modalidade"
                      checked={orderModalidade === 'entrega'}
                      onChange={() => setOrderModalidade('entrega')}
                      className="text-[#E05328] focus:ring-orange-500"
                    />
                    <span>Entrega no Destino (Comitê / Zona Eleitoral)</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="modalidade"
                      checked={orderModalidade === 'retirada'}
                      onChange={() => setOrderModalidade('retirada')}
                      className="text-[#E05328] focus:ring-orange-500"
                    />
                    <span>Retirada no Galpão Central FleetMoto</span>
                  </label>
                </div>

                {orderModalidade === 'entrega' && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço de Entrega *</label>
                      <input
                        type="text"
                        placeholder="Ex: Av. Paulista, 1000"
                        value={deliveryEndereco}
                        onChange={e => setDeliveryEndereco(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        required={orderModalidade === 'entrega'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Número / Complemento</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Nº"
                          value={deliveryNumero}
                          onChange={e => setDeliveryNumero(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Compl."
                          value={deliveryComplemento}
                          onChange={e => setDeliveryComplemento(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Bairro</label>
                      <input
                        type="text"
                        placeholder="Ex: Bela Vista"
                        value={deliveryBairro}
                        onChange={e => setDeliveryBairro(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade / UF</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Cidade"
                          value={deliveryCidade}
                          onChange={e => setDeliveryCidade(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        />
                        <input
                          type="text"
                          placeholder="UF"
                          value={deliveryUf}
                          onChange={e => setDeliveryUf(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Zona Eleitoral</label>
                      <input
                        type="text"
                        placeholder="Ex: 001ª Zona Central"
                        value={deliveryZona}
                        onChange={e => setDeliveryZona(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Ponto de Referência</label>
                      <input
                        type="text"
                        placeholder="Ex: Próximo à estação do metrô"
                        value={deliveryPontoRef}
                        onChange={e => setDeliveryPontoRef(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Responsável p/ Recebimento</label>
                      <input
                        type="text"
                        placeholder="Nome do recebedor"
                        value={deliveryRecebedor}
                        onChange={e => setDeliveryRecebedor(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone Recebedor</label>
                      <input
                        type="text"
                        placeholder="(11) 99999-8888"
                        value={deliveryTelRecebedor}
                        onChange={e => setDeliveryTelRecebedor(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 4: Prazos, Prioridade & Observações */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#E05328]" />
                  4. Prazos, Prioridade e Observações do Pedido
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridade</label>
                    <select
                      value={orderPrioridade}
                      onChange={e => setOrderPrioridade(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900"
                    >
                      <option value="normal">Normal</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente (Comício / Evento)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Previsão de Entrega / Retirada</label>
                    <input
                      type="datetime-local"
                      value={orderDataPrevisao}
                      onChange={e => setOrderDataPrevisao(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-500 font-medium">Atalhos:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setHours(18, 0, 0, 0);
                          const pad = (n: number) => String(n).padStart(2, '0');
                          const str = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T18:00`;
                          setOrderDataPrevisao(str);
                        }}
                        className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md transition-colors cursor-pointer"
                      >
                        Hoje (18h)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 1);
                          d.setHours(10, 0, 0, 0);
                          const pad = (n: number) => String(n).padStart(2, '0');
                          const str = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T10:00`;
                          setOrderDataPrevisao(str);
                        }}
                        className="px-2 py-0.5 text-[11px] bg-orange-100 hover:bg-orange-200 text-orange-900 font-bold rounded-md border border-orange-300 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-[#E05328]" /> Amanhã (10h)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 2);
                          d.setHours(10, 0, 0, 0);
                          const pad = (n: number) => String(n).padStart(2, '0');
                          const str = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T10:00`;
                          setOrderDataPrevisao(str);
                        }}
                        className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md transition-colors cursor-pointer"
                      >
                        +2 Dias
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Observações Gerais</label>
                  <input
                    type="text"
                    placeholder="Instruções de separação, horário limite de entrega, detalhes de campanha..."
                    value={orderObservacoes}
                    onChange={e => setOrderObservacoes(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-sm font-semibold bg-[#E05328] hover:bg-[#c9451e] text-white rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Salvando no Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingPedido ? 'Salvar Alterações' : 'Confirmar e Criar Pedido'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VISUALIZAR DETALHES DO PEDIDO                                     */}
      {/* ========================================================================= */}
      {viewingPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-[#E05328] rounded-xl">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">
                      Pedido #{viewingPedido.numeroPedido}
                    </h2>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusBadgeClass(viewingPedido.status).bg} ${getStatusBadgeClass(viewingPedido.status).border}`}>
                      {formatStatusPedido(viewingPedido.status)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Criado em {formatDateTime(viewingPedido.dataPedido)} por {viewingPedido.criadoPorNome || 'Operador'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingPedido(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Header Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Cliente</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{viewingPedido.clienteNome}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Candidato</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{viewingPedido.candidato} ({viewingPedido.partido || 'S/P'})</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Modalidade</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5 capitalize">{viewingPedido.modalidade === 'entrega' ? 'Entrega em Comitê' : 'Retirada no Galpão'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Qtd Total</span>
                  <p className="text-sm font-extrabold text-[#E05328] mt-0.5">{viewingPedido.quantidadeTotal} un.</p>
                </div>
              </div>

              {/* Endereço de Entrega */}
              {viewingPedido.enderecoEntrega && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#E05328]" />
                    Endereço de Entrega
                  </h4>
                  <p className="text-sm text-slate-800">
                    {viewingPedido.enderecoEntrega.endereco}, {viewingPedido.enderecoEntrega.numero}
                    {viewingPedido.enderecoEntrega.complemento ? ` - ${viewingPedido.enderecoEntrega.complemento}` : ''}
                    {' '}| {viewingPedido.enderecoEntrega.bairro} - {viewingPedido.enderecoEntrega.cidade}/{viewingPedido.enderecoEntrega.uf}
                  </p>
                  <p className="text-xs text-slate-500">
                    Recebedor: <span className="font-semibold text-slate-700">{viewingPedido.enderecoEntrega.responsavelRecebimento}</span> ({viewingPedido.enderecoEntrega.telefoneRecebedor})
                  </p>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Itens Requisitados ({viewingPedido.itens?.length || 0})
                </h4>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                        <th className="py-2.5 px-3">Item / Descrição</th>
                        <th className="py-2.5 px-3">Qtd</th>
                        <th className="py-2.5 px-3">Unidade</th>
                        <th className="py-2.5 px-3 text-right">Observação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingPedido.itens?.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{item.nomeMaterial}</div>
                            <div className="text-slate-500 text-[11px]">{item.descricao}</div>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{item.quantidade}</td>
                          <td className="py-2.5 px-3 text-slate-600">{formatUnidadeMedida(item.unidadeMedida)}</td>
                          <td className="py-2.5 px-3 text-slate-500 text-right">{item.observacao || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Timeline / Status History */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Histórico de Tramitação do Pedido
                </h4>
                <div className="space-y-2">
                  {viewingPedido.historicoStatus && viewingPedido.historicoStatus.length > 0 ? (
                    viewingPedido.historicoStatus.map((h, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="w-2 h-2 rounded-full bg-[#E05328] mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{formatStatusPedido(h.status)}</span>
                            <span className="text-slate-400">{formatDateTime(h.dataHora)}</span>
                          </div>
                          <p className="text-slate-600 mt-0.5">{h.observacao || 'Alteração de status registrada'}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Operador: {h.usuarioNome}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">Sem histórico detalhado disponível.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => handleOpenWhatsAppModal(viewingPedido)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar p/ WhatsApp</span>
              </button>

              <button
                onClick={() => setViewingPedido(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EXPEDIÇÃO / DESPACHO                                              */}
      {/* ========================================================================= */}
      {dispatchPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Enviar Pedido #{dispatchPedido.numeroPedido} para Expedição
                </h3>
                <p className="text-xs text-slate-500">
                  Cliente: {dispatchPedido.clienteNome} ({dispatchPedido.candidato})
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status Alvo do Setor de Expedição</label>
                <select
                  value={dispatchStatusAlvo}
                  onChange={e => setDispatchStatusAlvo(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                >
                  <option value="em_separacao">Em Separação (Estoque)</option>
                  <option value="pronto">Pronto para Expedição / Retirada</option>
                  <option value="enviado">Despachado / Em Rota de Entrega</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações da Expedição</label>
                <textarea
                  placeholder="Ex: Volumes conferidos, fardos etiquetados pelo operador da manhã."
                  value={dispatchObs}
                  onChange={e => setDispatchObs(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDispatchPedido(null)}
                disabled={isDispatching}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                disabled={isDispatching}
                className="px-5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors flex items-center gap-2"
              >
                {isDispatching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Confirmar Envio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GERAR ENTREGA (INTEGRAÇÃO)                                        */}
      {/* ========================================================================= */}
      {deliveryPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Gerar Entrega para Pedido #{deliveryPedido.numeroPedido}
                </h3>
                <p className="text-xs text-slate-500">
                  Cria registro oficial de frete com código de rastreamento no FleetMoto
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60 text-xs text-blue-900 space-y-1">
                <p><span className="font-semibold">Destino:</span> {deliveryPedido.enderecoEntrega?.endereco || 'Endereço do Comitê'}</p>
                <p><span className="font-semibold">Bairro/Zona:</span> {deliveryPedido.enderecoEntrega?.bairro} | {deliveryPedido.enderecoEntrega?.zonaEleitoral}</p>
                <p><span className="font-semibold">Itens:</span> {deliveryPedido.quantidadeTotal} unidades</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Atribuir Motoboy Imediatamente (Opcional)
                </label>
                <select
                  value={deliverySelectedMotoboy}
                  onChange={e => setDeliverySelectedMotoboy(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                >
                  <option value="">-- Deixar pendente na central de despacho --</option>
                  {motoboys.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nome} — Placa: {m.placaMoto} ({m.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor do Frete (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={deliveryFreteValor}
                    onChange={e => setDeliveryFreteValor(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Instruções de Rota</label>
                  <input
                    type="text"
                    placeholder="Ex: Entregar até as 18h"
                    value={deliveryObs}
                    onChange={e => setDeliveryObs(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeliveryPedido(null)}
                disabled={isGeneratingDelivery}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGenerateDelivery}
                disabled={isGeneratingDelivery}
                className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2"
              >
                {isGeneratingDelivery ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Gerar Entrega Oficial</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: WHATSAPP GENERATOR                                                */}
      {/* ========================================================================= */}
      {whatsappModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Mensagem WhatsApp para o Cliente
                </h3>
                <p className="text-xs text-slate-500">
                  Pedido #{whatsappModal.pedido.numeroPedido} — {whatsappModal.pedido.clienteNome}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número de Destino (WhatsApp)
              </label>
              <input
                type="text"
                value={whatsappModal.phone}
                onChange={e => setWhatsappModal({ ...whatsappModal, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pré-visualização da Mensagem
              </label>
              <textarea
                value={whatsappModal.message}
                onChange={e => setWhatsappModal({ ...whatsappModal, message: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl h-44 resize-none font-mono text-slate-800 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setWhatsappModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Abrir no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: IMPRIMIR PEDIDO                                                   */}
      {/* ========================================================================= */}
      {printPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150 print:p-0 print:border-none print:shadow-none">
            <div id="area-impressao-pedido" className="space-y-6 printable-area bg-white p-2">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">FleetMoto Logística Eleitoral 2026</h2>
                  <p className="text-xs text-slate-500 font-mono">Dossiê e Ordem de Produção / Romaneio de Separação</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono text-[#E05328] block">{printPedido.numeroPedido}</span>
                  <p className="text-xs text-slate-400">{formatDateTime(printPedido.dataPedido)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p><span className="font-bold">Cliente:</span> {printPedido.clienteNome}</p>
                  <p><span className="font-bold">Candidato:</span> {printPedido.candidato} ({printPedido.partido || 'S/P'})</p>
                  <p><span className="font-bold">CNPJ Campanha:</span> {printPedido.cnpjCampanha || 'N/I'}</p>
                  <p><span className="font-bold">Telefone:</span> {printPedido.telefone}</p>
                </div>
                <div className="space-y-1">
                  <p><span className="font-bold">Modalidade:</span> {printPedido.modalidade === 'entrega' ? 'Entrega em Comitê' : 'Retirada'}</p>
                  <p><span className="font-bold">Prioridade:</span> {printPedido.prioridade}</p>
                  <p><span className="font-bold">Previsão:</span> {formatDateTime(printPedido.dataPrevisao)}</p>
                  {printPedido.codigoRastreio && <p><span className="font-bold">Rastreamento:</span> {printPedido.codigoRastreio}</p>}
                </div>
              </div>

              {printPedido.enderecoEntrega && (
                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-100">
                  <p className="font-bold text-slate-800">Endereço de Entrega:</p>
                  <p className="text-slate-600">{printPedido.enderecoEntrega.endereco}, {printPedido.enderecoEntrega.numero} - {printPedido.enderecoEntrega.bairro}, {printPedido.enderecoEntrega.cidade}/{printPedido.enderecoEntrega.uf}</p>
                  <p className="text-slate-600">Recebedor: {printPedido.enderecoEntrega.responsavelRecebimento} ({printPedido.enderecoEntrega.telefoneRecebedor})</p>
                </div>
              )}

              <div>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead>
                    <tr className="bg-slate-100 border-b font-bold">
                      <th className="p-2">Item</th>
                      <th className="p-2">Quantidade</th>
                      <th className="p-2">Unidade</th>
                      <th className="p-2 text-right">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {printPedido.itens?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <div className="font-bold text-slate-900">{item.nomeMaterial}</div>
                          <div className="text-[10px] text-slate-500">{item.descricao}</div>
                        </td>
                        <td className="p-2 font-bold text-slate-900">{item.quantidade}</td>
                        <td className="p-2">{formatUnidadeMedida(item.unidadeMedida)}</td>
                        <td className="p-2 text-right">{item.observacao || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-slate-200">
                <span>Total de Itens: {printPedido.quantidadeTotal} unidades</span>
                <span className="text-sm text-slate-700">Modalidade: {printPedido.modalidade === 'entrega' ? 'Entrega em Comitê' : 'Retirada'}</span>
              </div>

              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-400">
                <div className="border-t border-slate-300 pt-2 font-medium">Assinatura Expedição</div>
                <div className="border-t border-slate-300 pt-2 font-medium">Assinatura Recebedor</div>
              </div>
            </div>

            <div className="flex items-center justify-between print:hidden pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const content = `=====================================================
FLEETMOTO LOGÍSTICA ELEITORAL 2026
DOSSIÊ E ORDEM DE PRODUÇÃO / ROMANEIO DE SEPARAÇÃO
=====================================================
Número do Pedido: ${printPedido.numeroPedido}
Data do Pedido: ${formatDateTime(printPedido.dataPedido)}
Cliente: ${printPedido.clienteNome}
Candidato: ${printPedido.candidato} (${printPedido.partido || 'S/P'})
CNPJ Campanha: ${printPedido.cnpjCampanha || 'N/I'}
Telefone: ${printPedido.telefone}
Modalidade: ${printPedido.modalidade === 'entrega' ? 'Entrega em Comitê' : 'Retirada'}
Prioridade: ${printPedido.prioridade.toUpperCase()}
Previsão: ${formatDateTime(printPedido.dataPrevisao)}
Código de Rastreamento: ${printPedido.codigoRastreio || 'NÃO ATRIBUÍDO'}

ENDEREÇO DE ENTREGA:
${printPedido.enderecoEntrega ? `${printPedido.enderecoEntrega.endereco}, ${printPedido.enderecoEntrega.numero} - ${printPedido.enderecoEntrega.bairro}, ${printPedido.enderecoEntrega.cidade}/${printPedido.enderecoEntrega.uf}
Responsável pelo Recebimento: ${printPedido.enderecoEntrega.responsavelRecebimento} (${printPedido.enderecoEntrega.telefoneRecebedor})` : 'Retirada no Centro de Distribuição'}

ITENS DO PEDIDO:
${printPedido.itens?.map((it, idx) => `${idx + 1}. ${it.nomeMaterial} - Qtd: ${it.quantidade} (${it.unidadeMedida}) | Obs: ${it.observacao || '-'}`).join('\n')}

Total de Volumes / Itens: ${printPedido.quantidadeTotal}
=====================================================
Assinatura Expedição: _____________________________
Assinatura Recebedor: _____________________________
=====================================================`;
                  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Pedido_${printPedido.numeroPedido}_Dossie.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Baixar cópia em arquivo texto"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Dossiê (.txt)</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPrintPedido(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  id="btn-imprimir-pedido-documento"
                  onClick={() => printElementById('area-impressao-pedido', { title: `Pedido_${printPedido.numeroPedido}` })}
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

      {/* ========================================================================= */}
      {/* MODAL: CANCELAR PEDIDO                                                   */}
      {/* ========================================================================= */}
      {cancelPedidoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Cancelar Pedido #{cancelPedidoModal.numeroPedido}
                </h3>
                <p className="text-xs text-slate-500">
                  Esta ação registrará o cancelamento no histórico do pedido
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo do Cancelamento
              </label>
              <textarea
                placeholder="Ex: Cliente solicitou cancelamento por alteração no material de campanha."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white h-24 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelPedidoModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleCancelPedido}
                className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
