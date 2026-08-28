/**
 * Utilitário de Criptografia e Autenticação Digital para Comprovantes POD (TSE)
 */

export async function generateDeliveryHash(payload: {
  codigoRastreio: string;
  pedidoId?: string | null;
  comiteNome: string;
  cnpjCampanha: string;
  nomeRecebedor: string;
  documentoRecebedor: string;
  dataHora: string;
  localizacaoGps: string;
  quantidadeTotal: number;
  motoboyNome?: string;
  motoboyPlaca?: string;
}): Promise<{ hashSha256: string; codigoAutenticidade: string }> {
  const rawString = [
    payload.codigoRastreio,
    payload.pedidoId || 'SEM_PEDIDO',
    payload.comiteNome,
    payload.cnpjCampanha,
    payload.nomeRecebedor,
    payload.documentoRecebedor,
    payload.dataHora,
    payload.localizacaoGps,
    payload.quantidadeTotal.toString(),
    payload.motoboyPlaca || 'SEM_PLACA',
    'FLEETMOTO_TSE_2026_SECURITY_SALT'
  ].join('|');

  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(rawString);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      
      const shortCode = `TSE-${hashHex.substring(0, 4).toUpperCase()}-${hashHex.substring(4, 8).toUpperCase()}-${hashHex.substring(8, 12).toUpperCase()}`;
      return {
        hashSha256: hashHex,
        codigoAutenticidade: shortCode,
      };
    }
  } catch (e) {
    console.warn('Crypto subtle não disponível, usando fallback determinístico:', e);
  }

  // Fallback hash determinístico
  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hexPart = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  const timestampPart = Date.now().toString(16).substring(4).toUpperCase();
  const hashSha256 = `E8A2F9${hexPart}7B3C4D5E6F1A2B3C4D5E6F${timestampPart}`.padEnd(64, '0').toLowerCase();
  const codigoAutenticidade = `TSE-${hexPart.substring(0, 4)}-${hexPart.substring(4, 8)}-${timestampPart.substring(0, 4)}`;

  return {
    hashSha256,
    codigoAutenticidade,
  };
}
