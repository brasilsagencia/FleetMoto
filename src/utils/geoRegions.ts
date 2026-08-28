import { RegiaoRota, PontoEntregaRota } from '../types';

export interface RegiaoConfig {
  id: RegiaoRota;
  label: string;
  corNome: string;
  corPrimaria: string;
  badgeClass: string;
  badgeActive: string;
  borderClass: string;
  bgLightClass: string;
  pinColor: string;
  hex: string;
  icone: string;
  descricao: string;
}

export const REGIOES_CONFIG: Record<RegiaoRota, RegiaoConfig> = {
  'Zona Norte': {
    id: 'Zona Norte',
    label: 'Zona Norte',
    corNome: 'Azul',
    corPrimaria: 'blue',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeActive: 'bg-blue-600 text-white border-blue-700 shadow-xs',
    borderClass: 'border-blue-400',
    bgLightClass: 'bg-blue-50/70',
    pinColor: '#2563eb',
    hex: '#2563eb',
    icone: '🧭',
    descricao: 'Tijuca, Méier, Madureira, Penha, Pavuna, Ilha e adjacências',
  },
  'Zona Oeste': {
    id: 'Zona Oeste',
    label: 'Zona Oeste',
    corNome: 'Laranja',
    corPrimaria: 'orange',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    badgeActive: 'bg-orange-600 text-white border-orange-700 shadow-xs',
    borderClass: 'border-orange-400',
    bgLightClass: 'bg-orange-50/70',
    pinColor: '#ea580c',
    hex: '#ea580c',
    icone: '🧭',
    descricao: 'Barra, Recreio, Jacarepaguá, Campo Grande, Bangu, Santa Cruz',
  },
  'Baixada Fluminense': {
    id: 'Baixada Fluminense',
    label: 'Baixada Fluminense',
    corNome: 'Verde',
    corPrimaria: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeActive: 'bg-emerald-600 text-white border-emerald-700 shadow-xs',
    borderClass: 'border-emerald-400',
    bgLightClass: 'bg-emerald-50/70',
    pinColor: '#16a34a',
    hex: '#16a34a',
    icone: '🧭',
    descricao: 'Caxias, Nova Iguaçu, Belford Roxo, S. J. Meriti, Nilópolis, Mesquita',
  },
  'Niterói / São Gonçalo': {
    id: 'Niterói / São Gonçalo',
    label: 'Niterói / São Gonçalo',
    corNome: 'Roxo',
    corPrimaria: 'purple',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeActive: 'bg-purple-600 text-white border-purple-700 shadow-xs',
    borderClass: 'border-purple-400',
    bgLightClass: 'bg-purple-50/70',
    pinColor: '#9333ea',
    hex: '#9333ea',
    icone: '🧭',
    descricao: 'Icaraí, Centro, Alcântara, Neves, Região Oceânica, Itaboraí',
  },
};

export const OPCOES_REGIAO_ROTA: {
  id: RegiaoRota;
  label: string;
  corNome: string;
  corHex: string;
  badgeClass: string;
  badgeActive: string;
  bgLightClass: string;
  borderClass: string;
  dotColor: string;
  icon: string;
  descricao: string;
}[] = [
  {
    id: 'Zona Norte',
    label: 'Zona Norte',
    corNome: 'Azul',
    corHex: '#2563eb',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeActive: 'bg-blue-600 text-white border-blue-700 shadow-xs',
    bgLightClass: 'bg-blue-50/70',
    borderClass: 'border-blue-300',
    dotColor: 'bg-blue-500',
    icon: '🧭',
    descricao: 'Tijuca, Méier, Madureira, Penha, Pavuna, Ilha e adjacências',
  },
  {
    id: 'Zona Oeste',
    label: 'Zona Oeste',
    corNome: 'Laranja',
    corHex: '#ea580c',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    badgeActive: 'bg-orange-600 text-white border-orange-700 shadow-xs',
    bgLightClass: 'bg-orange-50/70',
    borderClass: 'border-orange-300',
    dotColor: 'bg-orange-500',
    icon: '🧭',
    descricao: 'Barra, Recreio, Jacarepaguá, Campo Grande, Bangu, Santa Cruz',
  },
  {
    id: 'Baixada Fluminense',
    label: 'Baixada Fluminense',
    corNome: 'Verde',
    corHex: '#16a34a',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeActive: 'bg-emerald-600 text-white border-emerald-700 shadow-xs',
    bgLightClass: 'bg-emerald-50/70',
    borderClass: 'border-emerald-300',
    dotColor: 'bg-emerald-500',
    icon: '🧭',
    descricao: 'Caxias, Nova Iguaçu, Belford Roxo, S. J. Meriti, Nilópolis, Mesquita',
  },
  {
    id: 'Niterói / São Gonçalo',
    label: 'Niterói / São Gonçalo',
    corNome: 'Roxo',
    corHex: '#9333ea',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeActive: 'bg-purple-600 text-white border-purple-700 shadow-xs',
    bgLightClass: 'bg-purple-50/70',
    borderClass: 'border-purple-300',
    dotColor: 'bg-purple-500',
    icon: '🧭',
    descricao: 'Icaraí, Centro, Alcântara, Neves, Região Oceânica, Itaboraí',
  },
];

export function getRegiaoRotaConfig(regiao?: string) {
  if (regiao && regiao in REGIOES_CONFIG) {
    return {
      ...REGIOES_CONFIG[regiao as RegiaoRota],
      isDefinida: true,
    };
  }
  return {
    id: 'Rota não definida' as any,
    label: 'Rota não definida',
    corNome: 'Cinza',
    corPrimaria: 'slate',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-300',
    badgeActive: 'bg-slate-600 text-white border-slate-700',
    borderClass: 'border-slate-300',
    bgLightClass: 'bg-slate-50',
    pinColor: '#64748b',
    hex: '#64748b',
    icone: '⚠️',
    descricao: 'Cliente sem rota definida. Edite o cadastro para definir a região.',
    isDefinida: false,
  };
}

// Dicionário de Bairros e Municípios do RJ
const BAIRROS_ZONA_NORTE = [
  'tijuca', 'maracana', 'maracanã', 'vila isabel', 'grajau', 'grajaú', 'andarai', 'andaraí',
  'meier', 'méier', 'engenho de dentro', 'engenho novo', 'lins de vasconcelos', 'cachambi',
  'todos os santos', 'riachuelo', 'rocha', 'sampaio', 'maria da graca', 'maria da graça',
  'del castilho', 'inhauma', 'inhaúma', 'pilares', 'abolicao', 'abolição', 'encantado',
  'piedade', 'cascadura', 'madureira', 'campinho', 'quintino', 'cavalcanti', 'vaz lobo',
  'vicente de carvalho', 'iraja', 'irajá', 'colegio', 'colégio', 'vila da penha', 'vila kosmos',
  'vista alegre', 'rocha miranda', 'honorio gurgel', 'honório gurgel', 'oswaldo cruz',
  'bento ribeiro', 'marechal hermes', 'guadalupe', 'anchieta', 'ricardo de albuquerque',
  'pavuna', 'costa barros', 'barros filho', 'acari', 'coelho neto', 'penha', 'penha circular',
  'bras de pina', 'brás de pina', 'cordovil', 'parada de lucas', 'vigario geral', 'vigário geral',
  'jardim america', 'jardim américa', 'olaria', 'ramos', 'bonsucesso', 'manguinhos',
  'ilha do governador', 'portuguesa', 'galeao', 'galeão', 'jardim guanabara', 'cacuia',
  'cocota', 'cocotá', 'taua', 'tauá', 'ribeira', 'zumbi', 'pitangueiras', 'freguesia ilha',
  'bancarios', 'bancários', 'monero', 'moneró', 'sao cristovao', 'são cristóvão', 'mangueira',
  'benfica', 'vasco da gama', 'triagem', 'engenho da rainha', 'tomas coelho', 'tomás coelho',
];

const BAIRROS_ZONA_OESTE = [
  'barra da tijuca', 'barra', 'recreio dos bandeirantes', 'recreio', 'jacarepagua', 'jacarepaguá',
  'taquara', 'freguesia jacarepagua', 'freguesia jacarepaguá', 'freguesia', 'pechincha',
  'praca seca', 'praça seca', 'tanque', 'curicica', 'cidade de deus', 'gardenia azul', 'gardênia azul',
  'anil', 'camorim', 'vargem pequena', 'vargem grande', 'joa', 'joá', 'itanhanga', 'itanhangá',
  'grumari', 'campo grande', 'santa cruz', 'bangu', 'realengo', 'padre miguel', 'senador camara',
  'senador camará', 'santissimo', 'santíssimo', 'cosmos', 'inhoaiba', 'inhoaíba', 'paciencia',
  'paciência', 'sepetiba', 'guaratiba', 'pedra de guaratiba', 'barra de guaratiba', 'ilha de guaratiba',
  'deodoro', 'vila militar', 'magalhaes bastos', 'magalhães bastos', 'sulacap', 'jardim sulacap',
  'senador vasconcelos', 'jabour', 'vila alianca', 'vila kennedy',
];

const MUNICIPIOS_BAIXADA = [
  'duque de caxias', 'caxias', 'nova iguacu', 'nova iguaçu', 'belford roxo',
  'sao joao de meriti', 'são joão de meriti', 'meriti', 'nilopolis', 'nilópolis',
  'mesquita', 'queimados', 'japeri', 'mage', 'magé', 'guapimirim', 'paracambi',
  'seropedica', 'seropédica', 'itaguai', 'itaguaí', 'xerem', 'xerém', 'saracuruna',
  'imbariê', 'imbarie', 'gramacho', 'centenario', 'centenário', 'austin', 'comendador soares',
  'posse', 'heliopolis', 'heliópolis', 'vilar dos teles', 'eden', 'éden', 'tomazinho',
  'olinda', 'edson passos', 'banco de areia',
];

const MUNICIPIOS_NITEROI_SG = [
  'niteroi', 'niterói', 'sao goncalo', 'são gonçalo', 'itaborai', 'itaboraí', 'marica', 'maricá',
  'icarai', 'icaraí', 'santa rosa', 'inga', 'ingá', 'centro niteroi', 'sao francisco', 'são francisco',
  'charitas', 'jurujuba', 'piratininga', 'itaipu', 'camboinhas', 'itacoatiara', 'pendotiba',
  'maria paula', 'fonseca', 'barreto', 'santa barbara', 'santa bárbara', 'engenhoca', 'santana',
  'alcantara', 'alcântara', 'neves', 'porto novo', 'mutondo', 'trindade', 'ze garoto', 'zé garoto',
  'barro vermelho', 'rocha sg', 'santa luzia', 'guaxindiba', 'jardim catarina', 'pacheco',
  'vista alegre sg', 'arsenal', 'tribobo', 'tribobó', 'itauna', 'itaúna', 'amendoeira',
];

/**
 * Identifica e classifica automaticamente a região no Rio de Janeiro
 * com base no CEP, Bairro, Município e Endereço informado.
 */
export function classificarRegiaoAutomaticamente(params: {
  cep?: string;
  bairro?: string;
  municipio?: string;
  endereco?: string;
}): { regiao: RegiaoRota; confianca: 'alta' | 'media' | 'baixa'; motivo: string } {
  const cepDigits = (params.cep || '').replace(/\D/g, '');
  const bairro = (params.bairro || '').toLowerCase().trim();
  const municipio = (params.municipio || '').toLowerCase().trim();
  const endereco = (params.endereco || '').toLowerCase().trim();

  const textoCompleto = `${bairro} ${municipio} ${endereco}`;

  // 1. Verificação por Niterói / São Gonçalo
  for (const termo of MUNICIPIOS_NITEROI_SG) {
    if (textoCompleto.includes(termo)) {
      return {
        regiao: 'Niterói / São Gonçalo',
        confianca: 'alta',
        motivo: `Identificado pelo município/bairro: "${termo}"`,
      };
    }
  }

  // 2. Verificação por Baixada Fluminense
  for (const termo of MUNICIPIOS_BAIXADA) {
    if (textoCompleto.includes(termo)) {
      return {
        regiao: 'Baixada Fluminense',
        confianca: 'alta',
        motivo: `Identificado pelo município/bairro: "${termo}"`,
      };
    }
  }

  // 3. Verificação por Bairros da Zona Oeste
  for (const termo of BAIRROS_ZONA_OESTE) {
    if (textoCompleto.includes(termo)) {
      return {
        regiao: 'Zona Oeste',
        confianca: 'alta',
        motivo: `Identificado pelo bairro da Z.Oeste: "${termo}"`,
      };
    }
  }

  // 4. Verificação por Bairros da Zona Norte
  for (const termo of BAIRROS_ZONA_NORTE) {
    if (textoCompleto.includes(termo)) {
      return {
        regiao: 'Zona Norte',
        confianca: 'alta',
        motivo: `Identificado pelo bairro da Z.Norte: "${termo}"`,
      };
    }
  }

  // 5. Verificação por Faixas de CEP
  if (cepDigits.length >= 5) {
    const prefix = parseInt(cepDigits.slice(0, 5), 10);
    
    // Niterói e São Gonçalo: 24000 a 24999
    if (prefix >= 24000 && prefix <= 24999) {
      return {
        regiao: 'Niterói / São Gonçalo',
        confianca: 'alta',
        motivo: `CEP ${cepDigits} na faixa 24xxx (Niterói / São Gonçalo)`,
      };
    }

    // Baixada Fluminense: 25000 a 26599 e 23800 a 23899
    if ((prefix >= 25000 && prefix <= 26599) || (prefix >= 23800 && prefix <= 23899)) {
      return {
        regiao: 'Baixada Fluminense',
        confianca: 'alta',
        motivo: `CEP ${cepDigits} na faixa da Baixada Fluminense`,
      };
    }

    // Zona Oeste: 22600 a 23099 e 23500 a 23799
    if ((prefix >= 22600 && prefix <= 23099) || (prefix >= 23500 && prefix <= 23799)) {
      return {
        regiao: 'Zona Oeste',
        confianca: 'alta',
        motivo: `CEP ${cepDigits} na faixa da Zona Oeste`,
      };
    }

    // Zona Norte: 20260 a 21941
    if (prefix >= 20260 && prefix <= 21941) {
      return {
        regiao: 'Zona Norte',
        confianca: 'alta',
        motivo: `CEP ${cepDigits} na faixa da Zona Norte`,
      };
    }
  }

  // Padrão default inteligente
  return {
    regiao: 'Zona Norte',
    confianca: 'baixa',
    motivo: 'Região estimada por proximidade ao CD Central',
  };
}

/**
 * Coordenadas de referência aproximadas por Região do Rio de Janeiro
 */
export const COORDENADAS_REGIOES: Record<RegiaoRota, { lat: number; lng: number }> = {
  'Zona Norte': { lat: -22.8833, lng: -43.2833 }, // Méier / Madureira
  'Zona Oeste': { lat: -22.9997, lng: -43.3659 }, // Barra / Campo Grande
  'Baixada Fluminense': { lat: -22.7856, lng: -43.3054 }, // Caxias / Nova Iguaçu
  'Niterói / São Gonçalo': { lat: -22.8832, lng: -43.1034 }, // Niterói / SG
};

/**
 * Ponto de partida padrão da expedição
 */
export const PONTO_PARTIDA_PADRAO = 'Expedição Central FleetMoto - Av. Brasil, 500, Rio de Janeiro - RJ';
export const COORDENADA_PARTIDA_PADRAO = { lat: -22.8752, lng: -43.2501 }; // Av. Brasil CD

/**
 * Calcula estimativa de distância (km), tempo (minutos) e combustível (litros)
 * para a sequência de paradas informada.
 */
export function calcularEstimativasRota(
  paradas: PontoEntregaRota[],
  consumoKmPorLitro = 35 // Consumo médio de moto em entregas urbanas (35 km/l)
): {
  distanciaTotalKm: number;
  tempoEstimadoMinutos: number;
  combustivelLitros: number;
  totalMateriais: number;
  pesoTotalKgEstimado: number;
} {
  if (paradas.length === 0) {
    return {
      distanciaTotalKm: 0,
      tempoEstimadoMinutos: 0,
      combustivelLitros: 0,
      totalMateriais: 0,
      pesoTotalKgEstimado: 0,
    };
  }

  // Agrupamento por região para cálculo de dispersão
  let kmAcumulado = 12; // Deslocamento inicial da base até a primeira região
  let tempoParadasMinutos = paradas.length * 10; // Média de 10 min por parada (entrega + conferência + assinatura)

  let regiaoAtual = paradas[0].regiao;
  for (let i = 0; i < paradas.length; i++) {
    const p = paradas[i];
    if (p.regiao === regiaoAtual) {
      kmAcumulado += 4.5; // Média de 4.5 km entre paradas dentro da mesma região
    } else {
      kmAcumulado += 16.0; // Deslocamento entre regiões diferentes
      regiaoAtual = p.regiao;
    }
  }

  // Retorno à base
  kmAcumulado += 14;

  const distanciaTotalKm = Math.round(kmAcumulado * 10) / 10;
  // Tempo de pilotagem em trânsito urbano do RJ (média de 32 km/h) + tempo de atendimento
  const tempoDeslocamentoMinutos = Math.round((distanciaTotalKm / 32) * 60);
  const tempoEstimadoMinutos = tempoDeslocamentoMinutos + tempoParadasMinutos;

  const combustivelLitros = Math.round((distanciaTotalKm / consumoKmPorLitro) * 10) / 10;

  const totalMateriais = paradas.reduce((acc, p) => acc + (Number(p.quantidadeMaterial) || 0), 0);
  const pesoTotalKgEstimado = Math.round((totalMateriais * 0.08) * 10) / 10; // Estimativa média ~80g por item/pacote

  return {
    distanciaTotalKm,
    tempoEstimadoMinutos,
    combustivelLitros,
    totalMateriais,
    pesoTotalKgEstimado,
  };
}

/**
 * Reordena os pontos de entrega para a melhor sequência lógica
 * agrupando por região e proximidade de rota.
 */
export function otimizarSequenciaParadas(paradas: PontoEntregaRota[]): PontoEntregaRota[] {
  if (paradas.length <= 1) return paradas;

  // Ordem de roteirização lógica a partir do CD (Av. Brasil):
  // 1º Zona Norte -> 2º Baixada Fluminense -> 3º Niterói / SG -> 4º Zona Oeste
  const ordemRegioes: Record<RegiaoRota, number> = {
    'Zona Norte': 1,
    'Baixada Fluminense': 2,
    'Niterói / São Gonçalo': 3,
    'Zona Oeste': 4,
  };

  const prioridadePeso: Record<string, number> = {
    urgente: 0,
    alta: 1,
    normal: 2,
  };

  const ordenadas = [...paradas].sort((a, b) => {
    // 1º Prioridade alta/urgente vem antes
    const pA = prioridadePeso[a.prioridade] ?? 2;
    const pB = prioridadePeso[b.prioridade] ?? 2;
    if (pA !== pB) return pA - pB;

    // 2º Região geográfica
    const rA = ordemRegioes[a.regiao] ?? 99;
    const rB = ordemRegioes[b.regiao] ?? 99;
    if (rA !== rB) return rA - rB;

    // 3º CEP / Bairro para agrupar na mesma rua/bairro
    return (a.cep || a.bairro).localeCompare(b.cep || b.bairro);
  });

  return ordenadas.map((p, idx) => ({
    ...p,
    ordemSequencia: idx + 1,
  }));
}

/**
 * Gera URL do Google Maps para navegação em rota com múltiplos waypoints
 */
export function gerarLinkGoogleMapsRota(
  pontoPartida: string,
  paradas: PontoEntregaRota[]
): string {
  if (paradas.length === 0) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pontoPartida)}`;
  }

  const origin = encodeURIComponent(pontoPartida || PONTO_PARTIDA_PADRAO);
  const destination = encodeURIComponent(
    `${paradas[paradas.length - 1].enderecoCompleto}, ${paradas[paradas.length - 1].numeroComplemento}, ${paradas[paradas.length - 1].bairro}, ${paradas[paradas.length - 1].municipio}`
  );

  // Google Maps suporta até ~9 waypoints na URL padrão
  const waypoints = paradas
    .slice(0, paradas.length - 1)
    .map((p) => encodeURIComponent(`${p.enderecoCompleto}, ${p.numeroComplemento}, ${p.bairro}, ${p.municipio}`))
    .join('|');

  if (waypoints.length > 0) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
}

/**
 * Gera link do Waze para a parada selecionada ou primeiro destino
 */
export function gerarLinkWaze(parada: PontoEntregaRota): string {
  const query = encodeURIComponent(
    `${parada.enderecoCompleto}, ${parada.numeroComplemento}, ${parada.bairro}, ${parada.municipio} RJ`
  );
  return `https://waze.com/ul?q=${query}&navigate=yes`;
}
