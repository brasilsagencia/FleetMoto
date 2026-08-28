export type StatusComite = 'ativo' | 'inativo' | 'pendente';
export type CargoEleitoral = 
  | 'Deputado Estadual' 
  | 'Deputada Estadual'
  | 'Deputado Federal' 
  | 'Deputada Federal'
  | 'Senador' 
  | 'Senadora'
  | 'Governador' 
  | 'Governadora'
  | 'Prefeito' 
  | 'Prefeita'
  | 'Vereador'
  | 'Vereadora';

export type OrigemCliente = 'CRM' | 'Instagram' | 'prata' | 'ouro' | 'esther' | 'rosane' | 'descricao';

export type RegiaoRota = 
  | 'Zona Norte' 
  | 'Zona Oeste' 
  | 'Baixada Fluminense' 
  | 'Niterói / São Gonçalo';

export interface Comite {
  id: string;
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

export type Cliente = Comite;

export type StatusMotoboy = 'disponivel' | 'em_rota' | 'folga' | 'bloqueado';
export type TipoFrota = 'propria' | 'alugada' | 'terceirizada';
export type StatusAdesivagem = 'aprovada' | 'pendente' | 'reprovada' | 'nao_aplicavel';

export interface Motoboy {
  id: string;
  nome: string;
  cpf: string;
  cnh: string;
  cnhCategoria: string;
  validadeCnh: string;
  telefone: string;
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
}

export type StatusMoto = 'operacional' | 'manutencao' | 'reserva';

export interface Moto {
  id: string;
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

export type Veiculo = Moto;

export type StatusPedido = 
  | 'rascunho'
  | 'pendente'
  | 'confirmado'
  | 'em_separacao'
  | 'pronto'
  | 'enviado'
  | 'entregue'
  | 'cancelado';

export type PrioridadePedido = 'normal' | 'alta' | 'urgente';
export type ModalidadePedido = 'entrega' | 'retirada';

export type UnidadeMedidaItem = 
  | 'unidade'
  | 'milheiro'
  | 'kit'
  | 'fardo'
  | 'caixa'
  | 'pacote'
  | 'rolo'
  | 'metro_quadrado';

export interface ItemPedido {
  id: string;
  tipoMaterial: string;
  nomeMaterial: string;
  descricao: string;
  quantidade: number;
  unidadeMedida: string;
  valorUnitario: number;
  subtotal: number;
  observacao?: string;
}

export interface EnderecoEntregaPedido {
  cep?: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  pontoReferencia?: string;
  zonaEleitoral?: string;
  responsavelRecebimento?: string;
  telefoneRecebedor?: string;
}

export interface HistoricoStatusPedido {
  status: StatusPedido;
  dataHora: string;
  usuarioId: string;
  usuarioNome: string;
  observacao?: string;
}

export interface Pedido {
  id: string;
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
  criadoEm?: string;
  atualizadoEm?: string;
  historicoStatus: HistoricoStatusPedido[];
  isDeleted?: boolean;
  deletedAt?: string | null;
}

export type TipoMaterial = 
  | 'perfurado'
  | 'revista'
  | 'cartao'
  | 'santao'
  | 'pragao'
  | 'adesivos_15x40'
  | 'santinhos' 
  | 'bandeiras' 
  | 'praguinhas' 
  | 'perfurados' 
  | 'adesivos_carro'
  | 'windbanners' 
  | 'jornais_informativos'
  | 'combo_comicio'
  | 'outro';

export type StatusEntrega = 
  | 'pendente' 
  | 'atribuida' 
  | 'em_transito' 
  | 'entregue' 
  | 'cancelada';

export type PrioridadeEntrega = 'urgente_comicio' | 'alta' | 'normal';

export interface ItemComprovantePOD {
  materialNome: string;
  quantidade: number;
  unidadeMedida: string;
  sku?: string;
  pesoKg?: number;
}

export interface ComprovantePOD {
  fotoUrl: string;
  assinaturaBase64: string;
  nomeRecebedor: string;
  documentoRecebedor: string;
  telefoneRecebedor?: string;
  dataHora: string;
  localizacaoGps: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsPrecisaoMetros?: number;
  hashSha256?: string;
  codigoAutenticidade?: string;
  motoboyId?: string;
  motoboyNome?: string;
  motoboyPlaca?: string;
  enderecoCompleto?: string;
  itensEntregues?: ItemComprovantePOD[];
  notas?: string;
  offlineSync?: boolean;
  sincronizadoEm?: string;
}

export interface Entrega {
  id: string;
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
  expedicaoId?: string;
  rotaId?: string;
}

export interface RegistroAdesivagem {
  id: string;
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

export interface DocumentoEleitoral {
  id: string;
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
  tamanho: string;
}

export interface TransacaoFinanceira {
  id: string;
  tipo: 'faturamento_comite' | 'repasse_motoboy' | 'taxa_adesivagem' | 'despesa_combustivel';
  descricao: string;
  entidadeNome: string;
  entidadeId: string;
  partidoOuPlaca?: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'pago' | 'pendente' | 'atrasado';
  metodoPagamento: 'PIX' | 'Boleto Eleitoral' | 'Transferência Bancária';
  comprovanteRef?: string;
}

export type PapelUsuario = 
  | 'Administrador' 
  | 'Operador de Logística' 
  | 'Fiscal de Campanha' 
  | 'Representante Comitê'
  | 'Expedição'
  | 'Supervisor de Expedição'
  | 'Estoque'
  | 'Supervisor de Estoque';

export type StatusExpedicao = 
  | 'aguardando_separacao'
  | 'em_separacao'
  | 'aguardando_conferencia'
  | 'com_divergencia'
  | 'pronto_expedicao'
  | 'liberado_entrega'
  | 'em_rota'
  | 'finalizado';

export type SituacaoItemExpedicao = 
  | 'aguardando'
  | 'em_separacao'
  | 'separado'
  | 'parcial'
  | 'em_falta'
  | 'danificado'
  | 'substituido'
  | 'conferido';

export type TipoDivergencia = 
  | 'material_em_falta'
  | 'quantidade_incorreta'
  | 'material_danificado'
  | 'material_diferente'
  | 'problema_impressao'
  | 'embalagem_danificada'
  | 'pedido_incompleto'
  | 'outro';

export type StatusDivergencia = 'aberta' | 'resolvida' | 'cancelada';

export type ResultadoConferencia = 
  | 'aprovado' 
  | 'aprovado_com_ressalva' 
  | 'reprovado' 
  | 'devolvido_separacao';

export type StatusRotaExpedicao = 
  | 'planejada' 
  | 'aguardando_carregamento' 
  | 'carregando' 
  | 'liberada' 
  | 'em_andamento' 
  | 'concluida' 
  | 'cancelada';

export interface ItemExpedicao {
  id: string;
  materialId?: string;
  tipoMaterial: string;
  nomeMaterial: string;
  descricao: string;
  quantidadeSolicitada: number;
  unidadeMedida: string;
  quantidadeSeparada: number;
  quantidadeFaltante: number;
  lote?: string;
  localizacaoEstoque?: string;
  situacao: SituacaoItemExpedicao;
  observacao?: string;
  separadorNome?: string;
}

export interface ConferenciaExpedicao {
  conferenteId: string;
  conferenteNome: string;
  dataHora: string;
  resultado: ResultadoConferencia;
  embalagem: string;
  numeroVolumes: number;
  lacreOuVolume?: string;
  pesoTotalKg: number;
  fotoUrl?: string;
  observacoes?: string;
  motivoReprovacao?: string;
}

export interface DivergenciaExpedicao {
  id: string;
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

export interface LiberacaoExpedicao {
  motoboyId: string;
  motoboyNome: string;
  motoboyTelefone: string;
  veiculoModelo: string;
  veiculoPlaca: string;
  rotaId?: string;
  rotaNome?: string;
  sequenciaRota?: number;
  dataSaida: string;
  horarioPrevisto: string;
  horarioRealSaida: string;
  kmInicial: number;
  quantidadeVolumes: number;
  pesoTotalKg: number;
  numeroLacre?: string;
  responsavelLiberacaoId: string;
  responsavelLiberacaoNome: string;
  nomeRetirou: string;
  documentoRetirou: string;
  observacoes?: string;
}

export interface ReimpressaoNotaRegistro {
  usuarioId: string;
  usuarioNome: string;
  dataHora: string;
  motivo: string;
}

export interface NotaEntrega {
  id: string;
  numeroNota: string;
  pedidoId: string;
  numeroPedido: string;
  codigoRastreio: string;
  dataEmissao: string;
  clienteNome: string;
  candidato: string;
  partido: string;
  cnpjCpf: string;
  telefone: string;
  enderecoCompleto: string;
  bairro?: string;
  cidade?: string;
  zonaEleitoral?: string;
  rotaNome?: string;
  ordemParada?: number;
  motoboyNome: string;
  motoboyTelefone: string;
  veiculoPlaca: string;
  veiculoModelo: string;
  horarioPrevisto: string;
  horarioSaidaReal: string;
  itens: ItemExpedicao[];
  quantidadeVolumes: number;
  pesoTotalKg: number;
  numeroLacre?: string;
  separadoPor: string;
  conferidoPor: string;
  liberadoPor: string;
  retiradoPor: string;
  documentoRetirador?: string;
  recebidoPor?: string;
  documentoRecebedor?: string;
  dataHoraEntregaReal?: string;
  assinaturaBase64?: string;
  observacoes?: string;
  reimpressoes?: ReimpressaoNotaRegistro[];
}

export interface PedidoRotaItem {
  pedidoId: string;
  numeroPedido: string;
  expedicaoId: string;
  ordemParada: number;
  clienteNome: string;
  candidato: string;
  endereco: string;
  bairro: string;
  zonaEleitoral: string;
  volumes: number;
  pesoKg: number;
  status: string;
  telefone?: string;
  responsavel?: string;
}

export interface RotaExpedicao {
  id: string;
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
  criadoEm?: string;
  atualizadoEm?: string;
  isDeleted?: boolean;
}

export interface Expedicao {
  id: string;
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
  criadoEm?: string;
  atualizadoEm?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  comiteVinculado?: string;
  status: 'ativo' | 'inativo';
  avatarUrl: string;
  ultimoAcesso: string;
}

export interface ConfiguracaoGeral {
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

// ==========================================
// MÓDULO DE ESTOQUE & INVENTÁRIO (FLEETMOTO)
// ==========================================

export type StatusMaterial = 'ativo' | 'inativo' | 'bloqueado';

export const CATEGORIAS_MATERIAIS = [
  'Material eleitoral',
  'Impressos gráficos',
  'Adesivos e perfurados',
  'Bandeiras e estandartes',
  'Brindes e utilitários',
  'Estrutura e sinalização',
  'Embalagens e suprimentos',
  'Outra categoria',
] as const;

export type CategoriaMaterial = typeof CATEGORIAS_MATERIAIS[number];

export const UNIDADES_MEDIDA_ESTOQUE = [
  { value: 'unidades', label: 'Unidades (un)' },
  { value: 'milheiros', label: 'Milheiros (mil)' },
  { value: 'kits', label: 'Kits (kt)' },
  { value: 'fardos', label: 'Fardos (fd)' },
  { value: 'pacotes', label: 'Pacotes (pct)' },
  { value: 'caixas', label: 'Caixas (cx)' },
  { value: 'rolos', label: 'Rolos (rl)' },
  { value: 'folhas', label: 'Folhas (fl)' },
  { value: 'metros', label: 'Metros (m)' },
] as const;

export interface Material {
  id: string;
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
  observacoes?: string;
  status: StatusMaterial;
  criadoPor?: string;
  criadoEm?: string;
  atualizadoEm?: string;
  isDeleted?: boolean;
}

export interface EstoqueSaldo {
  id?: string;
  materialId: string;
  estoqueFisico: number;
  disponivel: number;
  reservado: number;
  emSeparacao: number;
  liberado: number;
  avariado: number;
  bloqueado: number;
  atualizadoEm?: string;
}

export type TipoMovimentacaoEstoque = 
  | 'entrada' 
  | 'saida' 
  | 'transferencia' 
  | 'avaria' 
  | 'estorno' 
  | 'ajuste_inventario';

export type SubtipoMovimentacao =
  // Entradas
  | 'compra'
  | 'producao_grafica'
  | 'transferencia_entrada'
  | 'devolucao_rota'
  | 'devolucao_cliente'
  | 'ajuste_inventario_entrada'
  | 'saldo_inicial'
  | 'bonificacao'
  // Saídas
  | 'saida_entrega'
  | 'uso_interno'
  | 'transferencia_saida'
  | 'perda'
  | 'avaria_saida'
  | 'amostra'
  | 'doacao'
  | 'descarte'
  | 'ajuste_inventario_saida'
  | 'estorno_movimentacao'
  | 'outro';

export interface EstoqueMovimentacao {
  id: string;
  materialId: string;
  materialNome?: string;
  materialSku?: string;
  tipo: TipoMovimentacaoEstoque;
  subtipo: SubtipoMovimentacao;
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
  criadoEm: string;
  movimentacaoEstornadaId?: string;
  isEstorno?: boolean;
}

export type StatusReservaEstoque =
  | 'pendente'
  | 'reservado'
  | 'reserva_parcial'
  | 'sem_estoque'
  | 'liberado_separacao'
  | 'consumido'
  | 'cancelado';

export interface EstoqueReserva {
  id: string;
  pedidoId: string;
  numeroPedido: string;
  materialId: string;
  materialNome: string;
  materialSku: string;
  quantidadeSolicitada: number;
  quantidadeReservada: number;
  status: StatusReservaEstoque;
  criadoEm: string;
  atualizadoEm: string;
}

export type StatusInventario =
  | 'planejado'
  | 'em_contagem'
  | 'aguardando_conferencia'
  | 'aguardando_aprovacao'
  | 'finalizado'
  | 'cancelado';

export interface ItemInventario {
  materialId: string;
  materialSku: string;
  materialNome: string;
  categoria: string;
  localizacao: string;
  lote?: string;
  saldoSistema: number;
  saldoContado?: number;
  diferenca?: number;
  custoUnitario?: number;
  justificativa?: string;
  fotoUrl?: string;
  conferido: boolean;
}

export interface Inventario {
  id: string;
  codigo: string;
  titulo: string;
  tipo: 'geral' | 'categoria' | 'localizacao' | 'amostragem';
  categoriaFiltro?: string;
  localizacaoFiltro?: string;
  status: StatusInventario;
  bloquearMovimentacoes: boolean;
  itens: ItemInventario[];
  totalItens: number;
  itensDivergentes: number;
  responsavelContagemId?: string;
  responsavelContagemNome?: string;
  aprovadoPorId?: string;
  aprovadoPorNome?: string;
  dataAbertura: string;
  dataFinalizacao?: string;
  observacoes?: string;
  criadoEm?: string;
  atualizadoEm?: string;
}

// ----------------------------------------------------
// CENTRAL DE RELATÓRIOS (20 MODELOS & ESTRUTURA COMPLETA)
// ----------------------------------------------------

export type TipoModeloRelatorio =
  | 'geral_pedidos'                     // 1. Relatório geral de pedidos
  | 'pedidos_cliente'                   // 2. Pedidos por cliente
  | 'pedidos_periodo'                   // 3. Pedidos por período
  | 'materiais_solicitados'             // 4. Materiais solicitados
  | 'materiais_separados'               // 5. Materiais separados
  | 'materiais_liberados'               // 6. Materiais liberados pela expedição
  | 'pedidos_pendentes_atrasados'       // 7. Pedidos pendentes e atrasados
  | 'entregas_realizadas'               // 8. Entregas realizadas
  | 'entregas_pendentes_canceladas'     // 9. Entregas pendentes, canceladas ou devolvidas
  | 'rotas_horarios'                    // 10. Rotas e horários de saída e chegada
  | 'desempenho_motoboys'               // 11. Desempenho dos motoboys
  | 'estoque_atual'                     // 12. Estoque atual
  | 'entradas_saidas_estoque'           // 13. Entradas e saídas do estoque
  | 'produtos_estoque_baixo'            // 14. Produtos com estoque baixo
  | 'produtos_sem_estoque'              // 15. Produtos sem estoque
  | 'inventario_materiais'              // 16. Inventário de materiais
  | 'custos_operacionais'               // 17. Custos operacionais
  | 'pagamentos_remuneracoes'           // 18. Pagamentos e remunerações
  | 'usuario_equipe_setor'              // 19. Relatório por usuário, equipe ou setor
  | 'historico_alteracoes';             // 20. Histórico completo de alterações e movimentações

export interface ModeloRelatorioConfig {
  id: TipoModeloRelatorio;
  numero: number;
  titulo: string;
  descricao: string;
  categoria: 'pedidos' | 'materiais' | 'entregas' | 'estoque' | 'financeiro' | 'auditoria';
  icone: string;
}

export interface FiltrosRelatorioCentral {
  tipoPeriodo: 'hoje' | 'ontem' | 'semana' | 'mes' | 'personalizado';
  dataInicio?: string;
  dataFim?: string;
  numeroPedido?: string;
  clienteId?: string;
  materialId?: string;
  categoriaMaterial?: string;
  setor?: string;
  responsavelId?: string;
  motoboyId?: string;
  equipe?: string;
  regiao?: string;
  statusPedido?: string;
  formaPagamento?: string;
  statusPagamento?: string;
  origemCliente?: string;
}

export interface ItemRelatorioCentral {
  id: string;
  dataHora: string;
  dataHoraFormatada?: string;
  numeroPedido?: string;
  clienteNome?: string;
  materialNome?: string;
  quantidade?: number;
  unidadeMedida?: string;
  responsavelNome?: string;
  setor?: string;
  motoboyNome?: string;
  rotaNome?: string;
  status?: string;
  statusLabel?: string;
  valor?: number;
  custo?: number;
  observacoes?: string;
  registroOriginal?: any;
  tipoRegistro: 'pedido' | 'entrega' | 'estoque' | 'movimentacao' | 'financeiro' | 'usuario' | 'auditoria' | 'expedicao' | 'inventario';
}

export interface ModeloRelatorioSalvo {
  id: string;
  nome: string;
  descricao?: string;
  tipoModelo: TipoModeloRelatorio;
  filtros: FiltrosRelatorioCentral;
  colunasVisiveis: string[];
  criadoPorId: string;
  criadoPorNome: string;
  criadoEm?: string;
}

export interface RelatorioHistoricoItem {
  id: string;
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
  criadoEm?: string;
}

// ==========================================
// CRIAÇÃO DE ROTAS POR CLIENTE (FLEETMOTO)
// ==========================================

export type StatusParadaRota =
  | 'Pendente'
  | 'Separando material'
  | 'Aguardando saída'
  | 'Em rota'
  | 'Chegou ao local'
  | 'Entregue'
  | 'Não entregue'
  | 'Endereço não localizado'
  | 'Destinatário ausente'
  | 'Reagendada'
  | 'Cancelada';

export type PrioridadeParada = 'normal' | 'alta' | 'urgente';

export interface PontoEntregaRota {
  id: string;
  clienteId: string;
  clienteNome: string;
  nomeDestinatario: string;
  telefone: string;
  enderecoCompleto: string;
  numeroComplemento: string;
  bairro: string;
  municipio: string;
  cep: string;
  pontoReferencia?: string;
  regiao: RegiaoRota;
  dataEntrega: string;
  horarioJanelaEntrega: string; // Ex: '08:00 - 12:00 (Manhã)', '13:00 - 17:00 (Tarde)', '14:30'
  tipoMaterial: string; // Ex: 'Santinhos 7x10', 'Adesivos Perfurados', 'Pragão', 'Bandeiras'
  quantidadeMaterial: number;
  unidadeMedida: string; // 'unidades', 'milheiros', 'kits', 'fardos'
  prioridade: PrioridadeParada;
  observacoes?: string;
  ordemSequencia: number;
  status: StatusParadaRota;
  latitude?: number;
  longitude?: number;
  horaChegada?: string;
  horaConclusao?: string;
  motivoInsucesso?: string;
  comprovantePOD?: ComprovantePOD;
  fotoSelfieMotoboyUrl?: string;
}

export type StatusRotaCliente = 
  | 'planejada' 
  | 'em_separacao' 
  | 'aguardando_saida' 
  | 'em_rota' 
  | 'concluida' 
  | 'cancelada';

export interface HistoricoAlteracaoRota {
  id: string;
  dataHora: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioRole?: string;
  acao: 'criacao' | 'edicao' | 'reordenacao' | 'adicao_parada' | 'remocao_parada' | 'inicio_rota' | 'conclusao_rota' | 'duplicacao' | 'alteracao_status';
  descricao: string;
  detalhes?: any;
}

export interface RotaCliente {
  id: string;
  codigoRota: string; // Ex: 'ROT-2026-ZN-001'
  nomeRota: string;
  clienteId: string;
  clienteNome: string;
  candidato?: string;
  partido?: string;
  cnpjCampanha?: string;
  regiaoPredominante: RegiaoRota | 'Múltiplas Regiões';
  dataRota: string;
  dataHorarioSaida?: string;
  dataHorarioRetorno?: string;
  pontoPartida: string; // Ex: 'CD Central - Av. Brasil, 500, Rio de Janeiro'
  pontoFinal: string;
  motoboyId: string;
  motoboyNome: string;
  motoboyTelefone?: string;
  motoboyFotoUrl?: string;
  veiculoModelo: string;
  veiculoPlaca: string;
  regiaoAtendimento: string;
  limiteEntregasMaximo: number;
  valorDiaria: number;
  valorCombustivel: number;
  valorAdicionalPorEntrega: number;
  valorTotalPrevisto: number;
  distanciaTotalKmEstimada: number;
  tempoEstimadoMinutos: number;
  previsaoCombustivelLitros: number;
  quantidadeParadas: number;
  quantidadeTotalMateriais: number;
  paradas: PontoEntregaRota[];
  status: StatusRotaCliente;
  observacoes?: string;
  criadoPor: string;
  criadoPorNome?: string;
  criadoEm: string;
  atualizadoEm: string;
  historicoAlteracoes: HistoricoAlteracaoRota[];
  isDeleted?: boolean;
  deletedAt?: string | null;
}

