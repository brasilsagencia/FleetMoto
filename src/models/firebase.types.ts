import { 
  StatusComite, 
  CargoEleitoral, 
  OrigemCliente, 
  RegiaoRota,
  StatusMotoboy, 
  TipoFrota, 
  StatusAdesivagem, 
  StatusMoto, 
  TipoMaterial, 
  StatusEntrega, 
  PrioridadeEntrega, 
  ComprovantePOD,
  StatusPedido,
  PrioridadePedido,
  ModalidadePedido,
  ItemPedido,
  EnderecoEntregaPedido,
  HistoricoStatusPedido,
  StatusExpedicao,
  ItemExpedicao,
  ConferenciaExpedicao,
  DivergenciaExpedicao,
  LiberacaoExpedicao,
  NotaEntrega,
  PedidoRotaItem,
  StatusRotaExpedicao,
  TipoDivergencia,
  StatusDivergencia,
} from '../types';

// Perfis de Acesso exigidos
export type UserRole = 'administrador' | 'gestor' | 'atendente' | 'cliente' | 'motoboy' | 'expedicao' | 'supervisor_expedicao' | 'estoque' | 'supervisor_estoque';


export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface UsuarioDoc extends BaseEntity {
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  role: UserRole;
  papelLegado?: string;
  clienteId?: string; // Para perfil 'cliente'
  motoboyId?: string; // Para perfil 'motoboy'
  status: 'ativo' | 'inativo' | 'bloqueado';
  avatarUrl?: string;
  ultimoAcesso?: string;
}

export interface ClienteDoc extends BaseEntity {
  nome: string;
  candidato: string;
  cargo?: CargoEleitoral;
  partido?: string;
  numero?: string;
  cnpjCampanha?: string;
  responsavel: string;
  cargoResponsavel?: string;
  telefone: string;
  email: string;
  endereco: string;
  numeroEnd: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  regiaoRota?: RegiaoRota;
  zonaEleitoral?: string;
  secoesAtendidas?: string;
  valorBaseRota?: number;
  status: StatusComite;
  origemCliente?: OrigemCliente;
  materiais?: string[];
  modeloCarro?: string;
  data?: string;
  horario?: string;
  interferencia?: string;
  totalEntregas: number;
  volumeTotalMateriais: number;
  dataCadastro: string;
  observacoes?: string;
}

export interface MotoboyDoc extends BaseEntity {
  nome: string;
  cpf: string;
  cnh: string;
  cnhCategoria: string;
  validadeCnh: string;
  telefone: string;
  email?: string;
  fotoUrl: string;
  placaMoto: string;
  modeloMoto: string;
  anoMoto: string;
  capacidadeBau: string;
  tipoFrota: TipoFrota;
  status: StatusMotoboy;
  statusAdesivagem: StatusAdesivagem;
  partidoAdesivado?: string;
  zonaPreferencial: string;
  totalEntregas: number;
  taxaPontualidade: number;
  avaliacao: number;
  valorDiaria: number;
  pix: string;
  dataCadastro: string;
  usuarioId?: string;
}

export interface VeiculoDoc extends BaseEntity {
  placa: string;
  modelo: string;
  marca: string;
  ano: string;
  cor: string;
  capacidadeBauLts: number;
  tipoPropriedade: TipoFrota;
  motoboyResponsavel?: string;
  status: StatusMoto;
  adesivoCampanha: boolean;
  partidoAdesivo?: string;
  dataUltimaRevisao: string;
  proximaRevisaoKm: number;
  kmAtual: number;
}

export interface PedidoDoc extends BaseEntity {
  numeroPedido: string;
  clienteId: string;
  clienteNome: string;
  candidato: string;
  cargoCandidato?: string;
  partido?: string;
  numeroCandidato?: string;
  cnpjCampanha?: string;
  responsavel: string;
  telefone: string;
  email?: string;
  itens: ItemPedido[];
  quantidadeTotal: number;
  subtotal: number;
  desconto: number;
  acrescimo: number;
  valorTotal: number;
  prioridade: PrioridadePedido;
  modalidade: ModalidadePedido;
  enderecoEntrega?: EnderecoEntregaPedido;
  status: StatusPedido;
  dataPedido: string;
  dataPrevisao: string;
  entregaId?: string | null;
  codigoRastreio?: string | null;
  observacoes?: string;
  criadoPor: string;
  criadoPorNome?: string;
  historicoStatus: HistoricoStatusPedido[];
}

export interface EntregaDoc extends BaseEntity {
  codigoRastreio: string;
  pedidoId?: string | null;
  comiteId: string;
  comiteNome: string;
  candidato: string;
  partido: string;
  cnpjCampanha: string;
  tipoMaterial: TipoMaterial;
  descricaoMaterial: string;
  quantidade: number;
  unidadeMedida: 'unidades' | 'milheiros' | 'kits' | 'fardos';
  pesoKg: number;
  enderecoDestino: string;
  bairro: string;
  cidade: string;
  zonaEleitoral: string;
  pontoReferencia?: string;
  responsavelRecebimento: string;
  telefoneContato: string;
  prioridade: PrioridadeEntrega;
  motoboyId?: string;
  motoboyNome?: string;
  motoboyTelefone?: string;
  motoboyPlaca?: string;
  status: StatusEntrega;
  dataCriacao: string;
  dataPrevisao: string;
  dataEntrega?: string;
  valorFrete: number;
  itens?: ItemPedido[];
  comprovantePOD?: ComprovantePOD;
  observacoes?: string;
  rotaId?: string;
  expedicaoId?: string;
}

export interface RotaDoc extends BaseEntity {
  nome: string;
  motoboyId: string;
  motoboyNome: string;
  status: 'planejada' | 'em_andamento' | 'concluida' | 'cancelada';
  entregasIds: string[];
  totalParadas: number;
  distanciaKmEstimada: number;
  tempoMinutosEstimado: number;
  dataInicio?: string;
  dataFim?: string;
  valorTotalRota: number;
}

export interface PagamentoDoc extends BaseEntity {
  tipo: 'faturamento_comite' | 'repasse_motoboy' | 'taxa_adesivagem' | 'despesa_combustivel';
  descricao: string;
  entidadeNome: string;
  entidadeId: string;
  partidoOuPlaca?: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'pago' | 'pendente' | 'atrasado' | 'cancelado';
  metodoPagamento: 'PIX' | 'Boleto Eleitoral' | 'Transferência Bancária';
  comprovanteRef?: string;
  comprovanteUrl?: string;
}

export interface AdesivoDoc extends BaseEntity {
  motoboyId: string;
  motoboyNome: string;
  placa: string;
  tipoAdesivagem: 'bau_completo' | 'laterais_tanque' | 'colete_campanha' | 'combo_total';
  candidato: string;
  partido: string;
  cnpjCampanha: string;
  fotoAdesivagemUrl: string;
  status: 'aprovado' | 'pendente_revisao' | 'reprovado';
  dataEnvio: string;
  dataValidacao?: string;
  validadoPor?: string;
  motivoReprovacao?: string;
}

export interface DocumentoDoc extends BaseEntity {
  titulo: string;
  categoria: 'cnh' | 'documento_veiculo' | 'autorizacao_tse' | 'termo_prestacao' | 'nota_fiscal_servico';
  entidadeTipo: 'motoboy' | 'comite' | 'frota';
  entidadeNome: string;
  entidadeId: string;
  numeroRegistro?: string;
  dataEmissao: string;
  dataValidade?: string;
  status: 'valido' | 'a_vencer' | 'vencido';
  arquivoNome: string;
  arquivoUrl?: string;
  tamanho: string;
}

export interface OcorrenciaDoc extends BaseEntity {
  titulo: string;
  descricao: string;
  tipo: 'atraso' | 'avaria' | 'recusa_recebimento' | 'acidente' | 'endereco_incorreto' | 'outro';
  gravidade: 'baixa' | 'media' | 'alta' | 'critica';
  status: 'aberta' | 'em_analise' | 'resolvida' | 'cancelada';
  entregaId?: string;
  motoboyId?: string;
  clienteId?: string;
  resolucao?: string;
  resolvidoPor?: string;
  dataResolucao?: string;
}

export interface NotificacaoDoc extends BaseEntity {
  usuarioId: string;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'alerta' | 'sucesso' | 'urgente';
  lida: boolean;
  linkAcao?: string;
  dataEnvio: string;
}

export interface ConfiguracaoDoc extends BaseEntity {
  chave: string;
  taxaBaseKm: number;
  taxaMinimaRota: number;
  adicionalUrgenciaPercentual: number;
  diariaPadraoMotoboy: number;
  limitePesoKgPorMoto: number;
  rastreamentoGpsAoVivo: boolean;
  notificacaoWhatsAppAtiva: boolean;
  exigirAssinaturaPOD: boolean;
  exigirFotoPOD: boolean;
  cidadeOperacao: string;
  eleicaoAno: string;
}

export interface LogAuditoriaDoc extends BaseEntity {
  acao: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'STATUS_CHANGE' | 'BATCH_OPERATION';
  colecao: string;
  documentoId: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioEmail: string;
  usuarioRole: UserRole;
  detalhes: string;
  dadosAnteriores?: any;
  dadosNovos?: any;
  ipOrigem?: string;
  timestamp: string;
}

export interface ExpedicaoDoc extends BaseEntity {
  pedidoId: string;
  numeroPedido: string;
  clienteId: string;
  clienteNome: string;
  candidato: string;
  partido?: string;
  telefone: string;
  enderecoCompleto: string;
  bairro: string;
  cidade: string;
  zonaEleitoral: string;
  prioridade: PrioridadePedido;
  dataPrevisaoSaida: string;
  quantidadeTotalItens: number;
  volumeTotal: number;
  pesoTotalKg: number;
  status: StatusExpedicao;
  localSeparacao?: string;
  separadorId?: string;
  separadorNome?: string;
  inicioSeparacao?: string;
  fimSeparacao?: string;
  tempoSeparacaoMinutos?: number;
  itens: ItemExpedicao[];
  conferencia?: ConferenciaExpedicao;
  divergencias?: DivergenciaExpedicao[];
  liberacao?: LiberacaoExpedicao;
  notaEntrega?: NotaEntrega;
  rotaId?: string;
  rotaNome?: string;
  entregaId?: string;
  codigoRastreio?: string;
  observacoes?: string;
  criadoPor?: string;
}

export interface DivergenciaDoc extends BaseEntity {
  pedidoId: string;
  numeroPedido: string;
  itemId?: string;
  nomeMaterial?: string;
  tipo: TipoDivergencia;
  quantidadeAfetada: number;
  descricao: string;
  fotoUrl?: string;
  registradoPorId: string;
  registradoPorNome: string;
  dataHoraRegistro: string;
  status: StatusDivergencia;
  solucaoAdotada?: string;
  autorizadoPorId?: string;
  autorizadoPorNome?: string;
  dataHoraResolucao?: string;
  justificativaCancelamento?: string;
}

export interface RotaExpedicaoDoc extends BaseEntity {
  codigoRota: string;
  nome: string;
  data: string;
  motoboyId: string;
  motoboyNome: string;
  motoboyTelefone: string;
  veiculoPlaca: string;
  veiculoModelo: string;
  horarioPrevisto: string;
  horarioRealSaida?: string;
  kmInicial?: number;
  kmFinal?: number;
  pedidos: PedidoRotaItem[];
  totalPedidos: number;
  totalVolumes: number;
  pesoTotalKg: number;
  status: StatusRotaExpedicao;
  observacoes?: string;
  criadoPor?: string;
}

export interface MaterialDoc extends BaseEntity {
  sku: string;
  codigoBarras?: string;
  nome: string;
  categoria: string;
  tipoMaterial: string;
  tipoMaterialLabel?: string;
  descricao?: string;
  unidadeMedida: string;
  estoqueMinimo: number;
  estoqueMaximo: number;
  custoUnitario: number;
  localizacao: string;
  cor?: string;
  tamanhoFormato?: string;
  dimensoes?: string;
  pesoUnitarioKg?: number;
  lote?: string;
  dataFabricacao?: string;
  dataValidade?: string;
  fornecedor?: string;
  clienteId?: string | null;
  clienteNome?: string;
  candidato?: string;
  partido?: string;
  numeroCandidato?: string;
  imagemUrl?: string;
  fotoUrl?: string;
  observacoes?: string;
  status: 'ativo' | 'inativo' | 'bloqueado';
}

export interface EstoqueSaldoDoc extends BaseEntity {
  materialId: string;
  estoqueFisico: number;
  disponivel: number;
  reservado: number;
  emSeparacao: number;
  liberado: number;
  avariado: number;
  bloqueado: number;
}

export interface EstoqueMovimentacaoDoc extends BaseEntity {
  materialId: string;
  materialNome?: string;
  materialSku?: string;
  tipo: 'entrada' | 'saida' | 'transferencia' | 'avaria' | 'estorno' | 'ajuste_inventario';
  subtipo: string;
  quantidade: number;
  saldoAnterior: number;
  saldoPosterior: number;
  custoUnitario?: number;
  valorTotal?: number;
  pedidoId?: string | null;
  numeroPedido?: string;
  expedicaoId?: string | null;
  rotaId?: string | null;
  entregaId?: string | null;
  lote?: string;
  fornecedor?: string;
  numeroNotaFiscal?: string;
  numeroPedidoCompra?: string;
  localizacaoOrigem?: string;
  localizacaoDestino?: string;
  responsavel?: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioEmail?: string;
  autorizadoPorId?: string;
  autorizadoPorNome?: string;
  motivo: string;
  documentoRef?: string;
  fotoUrl?: string;
  observacoes?: string;
  movimentacaoEstornadaId?: string;
  isEstorno?: boolean;
}

export interface EstoqueReservaDoc extends BaseEntity {
  pedidoId: string;
  numeroPedido: string;
  materialId: string;
  materialNome: string;
  materialSku: string;
  quantidadeSolicitada: number;
  quantidadeReservada: number;
  status: 'pendente' | 'reservado' | 'reserva_parcial' | 'sem_estoque' | 'liberado_separacao' | 'consumido' | 'cancelado';
}

export interface InventarioDoc extends BaseEntity {
  codigo: string;
  titulo: string;
  tipo: 'geral' | 'categoria' | 'localizacao' | 'amostragem';
  categoriaFiltro?: string;
  localizacaoFiltro?: string;
  status: 'planejado' | 'em_contagem' | 'aguardando_conferencia' | 'aguardando_aprovacao' | 'finalizado' | 'cancelado';
  bloquearMovimentacoes: boolean;
  itens: any[];
  totalItens: number;
  itensDivergentes: number;
  responsavelContagemId?: string;
  responsavelContagemNome?: string;
  aprovadoPorId?: string;
  aprovadoPorNome?: string;
  dataAbertura: string;
  dataFinalizacao?: string;
  observacoes?: string;
}

export interface RelatorioModeloDoc extends BaseEntity {
  nome: string;
  descricao?: string;
  tipoModelo: string;
  filtros: Record<string, any>;
  colunasVisiveis: string[];
  criadoPorId: string;
  criadoPorNome: string;
}

export interface RelatorioHistoricoDoc extends BaseEntity {
  titulo: string;
  tipoModelo: string;
  formato: 'pdf' | 'excel' | 'csv' | 'impressao' | 'compartilhamento';
  filtrosAplicados: Record<string, any>;
  totalRegistros: number;
  usuarioId: string;
  usuarioNome: string;
  usuarioPapel?: string;
  ipOuDispositivo?: string;
  identificadorUnico: string;
}

