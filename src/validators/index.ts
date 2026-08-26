// Validação de CPF
export function isValidCPF(cpf: string): boolean {
  if (!cpf) return false;
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

  return true;
}

// Validação de CNPJ
export function isValidCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

  let length = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, length);
  const digits = cleanCNPJ.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  length = length + 1;
  numbers = cleanCNPJ.substring(0, length);
  sum = 0;
  pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

// Validação de Placa (Mercosul ou Antiga)
export function isValidPlaca(placa: string): boolean {
  if (!placa) return false;
  const clean = placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  // Formato antigo: ABC1234 (3 letras + 4 números)
  const padraoAntigo = /^[A-Z]{3}[0-9]{4}$/;
  // Formato Mercosul: ABC1D23 (3 letras + 1 número + 1 letra + 2 números)
  const padraoMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  return padraoAntigo.test(clean) || padraoMercosul.test(clean);
}

// Validação de Telefone (Fixo ou Celular BR)
export function isValidTelefone(tel: string): boolean {
  if (!tel) return false;
  const clean = tel.replace(/\D/g, '');
  return clean.length >= 10 && clean.length <= 11;
}

// Validação de Email
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
}

// Formatação limpa de identificadores
export function sanitizeIdentificador(value: string): string {
  return (value || '').replace(/\D/g, '');
}

export function sanitizePlaca(value: string): string {
  return (value || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}
