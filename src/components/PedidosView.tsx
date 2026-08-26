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

  // Handle client selection and autofill address
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clientes.find(c => c.id === clientId);
    if (client) {
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
    setSelectedClientId(clientes[0]?.id || '');

    const firstClient = clientes[0];
    if (firstClient) {
      setDeliveryEndereco(firstClient.endereco || '');
      setDeliveryNumero(firstClient.numero || '');
      setDeliveryBairro(firstClient.bairro || '');
      setDeliveryCidade(firstClient.cidade || 'São Paulo');
      setDeliveryZona(firstClient.zonaEleitoral || 'Zona Central');
      setDeliveryRecebedor(firstClient.responsavel || firstClient.candidato || '');
      setDeliveryTelRecebedor(firstClient.telefone || '');
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
    setSelectedClientId(pedido.clienteId);

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
    setSelectedClientId(pedido.clienteId);

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

  // Filtered Orders
  const filteredPedidos = useMemo(() => {
    return pedidos.filter(p => {
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
      const matchDate = !dateFilter || p.dataPedido?.startsWith(dateFilter);

      return matchSearch && matchStatus && matchModalidade && matchPrioridade && matchDate;
    });
  }, [pedidos, searchTerm, statusFilter, modalidadeFilter, prioridadeFilter, dateFilter]);

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

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nº do pedido, cliente, candidato, CNPJ, rastreio ou material..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#E05328] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
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
              title="Filtrar por data do pedido"
            />

            {(searchTerm || statusFilter !== 'todos' || modalidadeFilter !== 'todos' || prioridadeFilter !== 'todos' || dateFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('todos');
                  setModalidadeFilter('todos');
                  setPrioridadeFilter('todos');
                  setDateFilter('');
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1"
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
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Prev: {formatDateTime(pedido.dataPrevisao)}
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
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Selecione o Cliente / Candidato *
                    </label>
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

                    {currentClientObj && (
                      <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600">
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
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase">FleetMoto Logística Eleitoral 2026</h2>
                <p className="text-xs text-slate-500 font-mono">Dossiê e Ordem de Produção / Romaneio de Separação</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold font-mono text-[#E05328]">{printPedido.numeroPedido}</span>
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
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <p className="font-bold">Endereço de Entrega:</p>
                <p>{printPedido.enderecoEntrega.endereco}, {printPedido.enderecoEntrega.numero} - {printPedido.enderecoEntrega.bairro}, {printPedido.enderecoEntrega.cidade}/{printPedido.enderecoEntrega.uf}</p>
                <p>Recebedor: {printPedido.enderecoEntrega.responsavelRecebimento} ({printPedido.enderecoEntrega.telefoneRecebedor})</p>
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
                        <div className="font-bold">{item.nomeMaterial}</div>
                        <div className="text-[10px] text-slate-500">{item.descricao}</div>
                      </td>
                      <td className="p-2 font-bold">{item.quantidade}</td>
                      <td className="p-2">{formatUnidadeMedida(item.unidadeMedida)}</td>
                      <td className="p-2 text-right">{item.observacao || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center text-xs font-bold pt-2 border-t">
              <span>Total de Itens: {printPedido.quantidadeTotal} unidades</span>
              <span className="text-sm text-slate-700">Modalidade: {printPedido.modalidade === 'entrega' ? 'Entrega em Comitê' : 'Retirada'}</span>
            </div>

            <div className="pt-8 border-t grid grid-cols-2 gap-8 text-center text-xs text-slate-400">
              <div className="border-t border-slate-300 pt-2">Assinatura Expedição</div>
              <div className="border-t border-slate-300 pt-2">Assinatura Recebedor</div>
            </div>

            <div className="flex items-center justify-end gap-3 print:hidden pt-4">
              <button
                onClick={() => setPrintPedido(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Fechar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 text-xs font-semibold bg-[#E05328] text-white rounded-xl"
              >
                Imprimir Documento
              </button>
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
