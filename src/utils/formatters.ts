export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return digits.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5'
  );
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-BR').format(num);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getStatusBadgeClass(status: string): { bg: string; text: string; border: string; dot: string } {
  switch (status) {
    case 'ativo':
    case 'entregue':
    case 'aprovado':
    case 'aprovada':
    case 'pago':
    case 'valido':
    case 'disponivel':
    case 'operacional':
    case 'pronto':
    case 'confirmado':
      return {
        bg: 'bg-emerald-50 text-emerald-700',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'em_rota':
    case 'em_transito':
    case 'em_separacao':
    case 'processando':
    case 'urgente_comicio':
    case 'enviado':
      return {
        bg: 'bg-amber-50 text-amber-700',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'pendente':
    case 'pendente_revisao':
    case 'a_vencer':
    case 'atribuida':
    case 'reserva':
      return {
        bg: 'bg-blue-50 text-blue-700',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'rascunho':
      return {
        bg: 'bg-slate-100 text-slate-700',
        text: 'text-slate-700',
        border: 'border-slate-300',
        dot: 'bg-slate-400',
      };
    case 'inativo':
    case 'folga':
    case 'bloqueado':
    case 'cancelada':
    case 'cancelado':
    case 'reprovado':
    case 'reprovada':
    case 'vencido':
    case 'atrasado':
    case 'manutencao':
      return {
        bg: 'bg-rose-50 text-rose-700',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-500',
      };
    default:
      return {
        bg: 'bg-slate-50 text-slate-700',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

export function formatStatusPedido(status: string): string {
  switch (status) {
    case 'rascunho': return 'Rascunho';
    case 'pendente': return 'Pendente';
    case 'confirmado': return 'Confirmado';
    case 'em_separacao': return 'Em Separação';
    case 'pronto': return 'Pronto p/ Expedição';
    case 'enviado': return 'Enviado';
    case 'entregue': return 'Entregue';
    case 'cancelado': return 'Cancelado';
    default: return status;
  }
}

export function formatPrioridadePedido(prioridade: string): { label: string; badgeClass: string } {
  switch (prioridade) {
    case 'urgente':
    case 'urgente_comicio':
      return {
        label: 'Urgente (Comício)',
        badgeClass: 'bg-red-100 text-red-700 border-red-200',
      };
    case 'alta':
      return {
        label: 'Alta Prioridade',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'normal':
    default:
      return {
        label: 'Normal',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

export function formatUnidadeMedida(unidade: string): string {
  switch (unidade) {
    case 'unidade':
    case 'unidades': return 'Unidade(s)';
    case 'milheiro':
    case 'milheiros': return 'Milheiro(s)';
    case 'kit':
    case 'kits': return 'Kit(s)';
    case 'fardo':
    case 'fardos': return 'Fardo(s)';
    case 'caixa':
    case 'caixas': return 'Caixa(s)';
    case 'pacote':
    case 'pacotes': return 'Pacote(s)';
    case 'rolo':
    case 'rolos': return 'Rolo(s)';
    case 'metro_quadrado':
    case 'm2': return 'm² (Metro Quadrado)';
    default: return unidade;
  }
}

export const LISTA_MATERIAIS_PEDIDO = [
  { id: 'perfurado_vidro', nome: 'Perfurado — Vidro traseiro', descPadrao: 'Adesivo perfurado microperfurado para vidro traseiro de veículo' },
  { id: 'revista_tabloide', nome: 'Revista — Informativo ou tabloide', descPadrao: 'Revista informativa da campanha eleitoral 8 a 16 págs' },
  { id: 'cartao_qrcode', nome: 'Cartão — Mini cartão ou QR Code', descPadrao: 'Mini cartão de apresentação com QR Code de propostas' },
  { id: 'santao_a4_a5', nome: 'Santão — Formato A4/A5 grande', descPadrao: 'Santão impresso em alta gramatura formato A4/A5' },
  { id: 'pragao_10cm', nome: 'Pragão — Adesivo de 10 cm', descPadrao: 'Adesivo redondo formato pragão 10cm de diâmetro' },
  { id: 'adesivos_15x40', nome: 'Adesivos 15x40 — Para-choque', descPadrao: 'Adesivo retangular 15x40cm para para-choque de automóvel' },
  { id: 'santinhos_impressos', nome: 'Santinhos impressos', descPadrao: 'Santinhos tradicionais 7x10cm 4x4 cores c/ coligação' },
  { id: 'bandeiras_haste', nome: 'Bandeiras com haste', descPadrao: 'Bandeiras de tecido poliéster c/ haste plástica de apoio' },
  { id: 'praguinhas_adesivas', nome: 'Praguinhas adesivas', descPadrao: 'Adesivos circulares pequenos 5cm para lapela e vestuário' },
  { id: 'perfurados', nome: 'Perfurados', descPadrao: 'Adesivos perfurados diversos para comitês e vans' },
  { id: 'adesivos_carro', nome: 'Adesivos para carro', descPadrao: 'Kits adesivos variados para frota veicular da campanha' },
  { id: 'windbanners', nome: 'Windbanners de calçada', descPadrao: 'Windbanner completo com base e tecido de alta visibilidade' },
  { id: 'jornais_informativos', nome: 'Jornais informativos', descPadrao: 'Jornais eleitorais 4 a 8 páginas com prestação de contas' },
  { id: 'combo_comicio', nome: 'Combo completo para comício', descPadrao: 'Kit com bandeiras, pragões, santões e faixas para eventos' },
  { id: 'outro', nome: 'Outro material', descPadrao: 'Material personalizado sob demanda eleitoral' },
];

export function formatTipoMaterial(tipo: string): string {
  const match = LISTA_MATERIAIS_PEDIDO.find(m => m.id === tipo);
  if (match) return match.nome;
  switch (tipo) {
    case 'perfurado':
    case 'perfurados':
      return 'Perfurado (Vidro Traseiro)';
    case 'revista':
      return 'Revista / Informativo';
    case 'cartao':
      return 'Cartão de Visita / Mini';
    case 'santao':
      return 'Santão (A4 / A5)';
    case 'pragao':
      return 'Pragão (Adesivo Grande)';
    case 'adesivos_15x40':
    case 'adesivo_15x40':
      return 'Adesivos 15x40 (Para-choque)';
    case 'santinhos':
      return 'Santinhos Eleitorais';
    case 'bandeiras':
      return 'Bandeiras de Pano';
    case 'praguinhas':
      return 'Praguinhas Adesivas';
    case 'adesivos_carro':
      return 'Adesivos de Carro';
    case 'windbanners':
      return 'Windbanners';
    case 'jornais_informativos':
      return 'Jornais Informativos';
    case 'combo_comicio':
      return 'Combo de Comício';
    default:
      return tipo;
  }
}

export function formatStatusExpedicao(status: string): { label: string; bg: string; text: string; border: string; dot: string } {
  switch (status) {
    case 'aguardando_separacao':
      return {
        label: 'Aguardando Separação',
        bg: 'bg-amber-50 text-amber-800',
        text: 'text-amber-800',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'em_separacao':
      return {
        label: 'Em Separação',
        bg: 'bg-blue-50 text-blue-800',
        text: 'text-blue-800',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'aguardando_conferencia':
      return {
        label: 'Aguardando Conferência',
        bg: 'bg-purple-50 text-purple-800',
        text: 'text-purple-800',
        border: 'border-purple-200',
        dot: 'bg-purple-500',
      };
    case 'com_divergencia':
      return {
        label: 'Com Divergência',
        bg: 'bg-red-50 text-red-800',
        text: 'text-red-800',
        border: 'border-red-200',
        dot: 'bg-red-500',
      };
    case 'pronto_expedicao':
      return {
        label: 'Pronto p/ Expedição',
        bg: 'bg-teal-50 text-teal-800',
        text: 'text-teal-800',
        border: 'border-teal-200',
        dot: 'bg-teal-500',
      };
    case 'liberado_entrega':
      return {
        label: 'Liberado p/ Entrega',
        bg: 'bg-emerald-50 text-emerald-800',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'em_rota':
      return {
        label: 'Em Rota / Trânsito',
        bg: 'bg-cyan-50 text-cyan-800',
        text: 'text-cyan-800',
        border: 'border-cyan-200',
        dot: 'bg-cyan-500',
      };
    case 'finalizado':
      return {
        label: 'Finalizado / Entregue',
        bg: 'bg-slate-100 text-slate-800',
        text: 'text-slate-800',
        border: 'border-slate-300',
        dot: 'bg-slate-500',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-50 text-slate-700',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

export function formatSituacaoItemExpedicao(situacao: string): { label: string; badgeClass: string } {
  switch (situacao) {
    case 'aguardando':
      return { label: 'Aguardando', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
    case 'em_separacao':
      return { label: 'Em Separação', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' };
    case 'separado':
      return { label: 'Separado 100%', badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    case 'parcial':
      return { label: 'Separado Parcial', badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' };
    case 'em_falta':
      return { label: 'Em Falta no Estoque', badgeClass: 'bg-red-100 text-red-700 border-red-200' };
    case 'danificado':
      return { label: 'Material Danificado', badgeClass: 'bg-rose-100 text-rose-700 border-rose-200' };
    case 'substituido':
      return { label: 'Substituído', badgeClass: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
    case 'conferido':
      return { label: 'Conferido & Aprovado', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    default:
      return { label: situacao, badgeClass: 'bg-slate-100 text-slate-700' };
  }
}

export function formatTipoDivergencia(tipo: string): string {
  switch (tipo) {
    case 'material_em_falta': return 'Material em Falta';
    case 'quantidade_incorreta': return 'Quantidade Incorreta';
    case 'material_danificado': return 'Material Danificado / Avariado';
    case 'material_diferente': return 'Material Diferente do Pedido';
    case 'problema_impressao': return 'Problema de Impressão / Gráfica';
    case 'embalagem_danificada': return 'Embalagem Danificada';
    case 'pedido_incompleto': return 'Pedido Incompleto';
    case 'outro': return 'Outra Divergência';
    default: return tipo;
  }
}

export function formatTipoMovimentacao(tipo: string, subtipo?: string): { label: string; badgeClass: string } {
  if (tipo === 'entrada') {
    switch (subtipo) {
      case 'compra': return { label: 'Entrada por Compra', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'producao': return { label: 'Entrada por Produção', badgeClass: 'bg-teal-100 text-teal-800 border-teal-300' };
      case 'devolucao_sobra': return { label: 'Devolução de Sobra', badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300' };
      case 'transferencia_entrada': return { label: 'Transferência (Entrada)', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'ajuste_inventario_positivo': return { label: 'Ajuste Inventário (+)', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'estorno_saida': return { label: 'Estorno de Saída', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
      default: return { label: 'Entrada', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    }
  } else if (tipo === 'saida') {
    switch (subtipo) {
      case 'pedido_venda': return { label: 'Saída por Pedido', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'entrega_comite': return { label: 'Entrega para Comitê', badgeClass: 'bg-sky-100 text-sky-800 border-sky-300' };
      case 'perda': return { label: 'Perda de Material', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'avaria': return { label: 'Avaria / Danificado', badgeClass: 'bg-red-100 text-red-800 border-red-300' };
      case 'amostra': return { label: 'Amostra / Demonstração', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'ajuste_inventario_negativo': return { label: 'Ajuste Inventário (-)', badgeClass: 'bg-orange-100 text-orange-800 border-orange-300' };
      case 'estorno_entrada': return { label: 'Estorno de Entrada', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300' };
      default: return { label: 'Saída', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
  } else if (tipo === 'avaria') {
    return { label: 'Apontamento de Avaria', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' };
  } else if (tipo === 'bloqueio') {
    return { label: 'Bloqueio de Lote', badgeClass: 'bg-slate-200 text-slate-800 border-slate-300' };
  } else if (tipo === 'desbloqueio') {
    return { label: 'Desbloqueio de Lote', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  } else if (tipo === 'estorno') {
    return { label: 'Estorno Autorizado', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300' };
  } else if (tipo === 'ajuste_inventario') {
    return { label: 'Ajuste de Inventário', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
  }
  return { label: tipo, badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' };
}

export function formatStatusEstoque(saldoFisico: number, estoqueMinimo: number): {
  label: string;
  badgeClass: string;
  dotClass: string;
  statusKey: 'ok' | 'baixo' | 'zerado';
} {
  if (saldoFisico <= 0) {
    return {
      label: 'Estoque Zerado',
      badgeClass: 'bg-red-50 text-red-700 border-red-200',
      dotClass: 'bg-red-500',
      statusKey: 'zerado',
    };
  }
  if (saldoFisico <= estoqueMinimo) {
    return {
      label: 'Estoque Baixo',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
      dotClass: 'bg-amber-500 animate-pulse',
      statusKey: 'baixo',
    };
  }
  return {
    label: 'Normal / Disponível',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
    statusKey: 'ok',
  };
}

