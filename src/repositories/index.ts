import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp, 
  writeBatch, 
  runTransaction,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  uploadString 
} from 'firebase/storage';
import { db, storage } from '../services/firebase/config';
import { 
  BaseEntity, 
  UsuarioDoc, 
  ClienteDoc, 
  MotoboyDoc, 
  VeiculoDoc, 
  EntregaDoc, 
  PedidoDoc,
  RotaDoc, 
  PagamentoDoc, 
  AdesivoDoc, 
  DocumentoDoc, 
  OcorrenciaDoc, 
  NotificacaoDoc, 
  ConfiguracaoDoc, 
  LogAuditoriaDoc, 
  UserRole,
  ExpedicaoDoc,
  DivergenciaDoc,
  RotaExpedicaoDoc,
  MaterialDoc,
  EstoqueSaldoDoc,
  EstoqueMovimentacaoDoc,
  EstoqueReservaDoc,
  InventarioDoc,
  RelatorioModeloDoc,
  RelatorioHistoricoDoc
} from '../models/firebase.types';
import {
  ItemExpedicao,
  ConferenciaExpedicao,
  DivergenciaExpedicao,
  LiberacaoExpedicao,
  NotaEntrega,
  PedidoRotaItem,
  Material,
  EstoqueSaldo,
  EstoqueMovimentacao,
  EstoqueReserva,
  Inventario,
  ItemInventario,
} from '../types';


// Universal Firestore Data Sanitizer (Removes undefined fields recursively to prevent Firestore errors)
export function sanitizeFirestoreData<T = any>(data: T): T {
  if (data === undefined) {
    return null as any;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (data instanceof Date) {
    return data.toISOString() as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeFirestoreData(item)) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      clean[key] = sanitizeFirestoreData(value);
    }
  }
  return clean as T;
}

// Generic CRUD repository helper with audit logging & logical deletion
export class BaseRepository<T extends BaseEntity> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // Create document with audit log & uniqueness check
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, currentUserId?: string): Promise<string> {
    const colRef = collection(db, this.collectionName);
    const nowIso = new Date().toISOString();
    const cleanData: any = sanitizeFirestoreData({
      ...data,
      isDeleted: false,
      deletedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: currentUserId || 'sistema',
      updatedBy: currentUserId || 'sistema'
    });

    const docRef = await addDoc(colRef, cleanData);
    
    // Log audit asynchronously
    this.logAudit({
      acao: 'CREATE',
      colecao: this.collectionName,
      documentoId: docRef.id,
      usuarioId: currentUserId || 'sistema',
      usuarioNome: 'Usuário Ativo',
      usuarioEmail: 'sistema@fleetmoto.com.br',
      usuarioRole: 'administrador',
      detalhes: `Criação de registro em ${this.collectionName}`,
      dadosNovos: cleanData,
      timestamp: nowIso
    }).catch(console.error);

    return docRef.id;
  }

  // Set document with custom ID
  async setWithId(id: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, currentUserId?: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    const nowIso = new Date().toISOString();
    const cleanData: any = sanitizeFirestoreData({
      ...data,
      isDeleted: false,
      deletedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: currentUserId || 'sistema',
      updatedBy: currentUserId || 'sistema'
    });

    await setDoc(docRef, cleanData, { merge: true });

    this.logAudit({
      acao: 'CREATE',
      colecao: this.collectionName,
      documentoId: id,
      usuarioId: currentUserId || 'sistema',
      usuarioNome: 'Usuário Ativo',
      usuarioEmail: 'sistema@fleetmoto.com.br',
      usuarioRole: 'administrador',
      detalhes: `Definição de registro com ID ${id} em ${this.collectionName}`,
      dadosNovos: cleanData,
      timestamp: nowIso
    }).catch(console.error);
  }

  // Get by ID (excluding logically deleted unless requested)
  async getById(id: string, includeDeleted = false): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data() as T;
    if (!includeDeleted && data.isDeleted) return null;
    return { ...data, id: snap.id };
  }

  // List all active documents
  async getAll(includeDeleted = false): Promise<T[]> {
    const colRef = collection(db, this.collectionName);
    const q = includeDeleted
      ? query(colRef)
      : query(colRef, where('isDeleted', '==', false));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as T));
  }

  // Subscribe to real-time updates
  subscribe(onData: (items: T[]) => void, onError?: (error: Error) => void): () => void {
    const colRef = collection(db, this.collectionName);
    const q = query(colRef);
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs
          .map(d => ({ ...d.data(), id: d.id } as T))
          .filter(d => !d.isDeleted);
        onData(items);
      },
      (err) => {
        console.error(`Erro na subscrição de ${this.collectionName}:`, err);
        if (onError) onError(err);
      }
    );
  }

  // Update document
  async update(id: string, data: Partial<T>, currentUserId?: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    const nowIso = new Date().toISOString();
    const updatePayload: any = sanitizeFirestoreData({
      ...data,
      updatedAt: nowIso,
      updatedBy: currentUserId || 'sistema'
    });

    const prevSnap = await getDoc(docRef);
    const prevData = prevSnap.exists() ? prevSnap.data() : null;

    await updateDoc(docRef, updatePayload);

    this.logAudit({
      acao: 'UPDATE',
      colecao: this.collectionName,
      documentoId: id,
      usuarioId: currentUserId || 'sistema',
      usuarioNome: 'Usuário Ativo',
      usuarioEmail: 'sistema@fleetmoto.com.br',
      usuarioRole: 'administrador',
      detalhes: `Atualização de campos em ${this.collectionName}`,
      dadosAnteriores: prevData,
      dadosNovos: updatePayload,
      timestamp: nowIso
    }).catch(console.error);
  }

  // Soft delete (logical deletion)
  async softDelete(id: string, currentUserId?: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    const nowIso = new Date().toISOString();
    
    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: nowIso,
      deletedBy: currentUserId || 'sistema',
      updatedAt: nowIso,
      updatedBy: currentUserId || 'sistema'
    });

    this.logAudit({
      acao: 'DELETE',
      colecao: this.collectionName,
      documentoId: id,
      usuarioId: currentUserId || 'sistema',
      usuarioNome: 'Usuário Ativo',
      usuarioEmail: 'sistema@fleetmoto.com.br',
      usuarioRole: 'administrador',
      detalhes: `Exclusão lógica do registro em ${this.collectionName}`,
      timestamp: nowIso
    }).catch(console.error);
  }

  // Hard delete (for specific purge cases)
  async hardDelete(id: string, currentUserId?: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);

    this.logAudit({
      acao: 'DELETE',
      colecao: this.collectionName,
      documentoId: id,
      usuarioId: currentUserId || 'sistema',
      usuarioNome: 'Usuário Ativo',
      usuarioEmail: 'sistema@fleetmoto.com.br',
      usuarioRole: 'administrador',
      detalhes: `Exclusão física permanente em ${this.collectionName}`,
      timestamp: new Date().toISOString()
    }).catch(console.error);
  }

  // Internal audit logging helper
  protected async logAudit(logData: Omit<LogAuditoriaDoc, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>) {
    try {
      const logsCol = collection(db, 'logs_auditoria');
      await addDoc(logsCol, {
        ...logData,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Erro ao salvar log de auditoria:', e);
    }
  }
}

// Concrete Repositories for each of the requested collections:
// usuarios, motoboys, clientes, entregas, rotas, veiculos, pagamentos, adesivos, documentos, ocorrencias, notificacoes, configuracoes, logs_auditoria

export class UsuariosRepository extends BaseRepository<UsuarioDoc> {
  constructor() {
    super('usuarios');
  }

  async findByEmail(email: string): Promise<UsuarioDoc | null> {
    const colRef = collection(db, this.collectionName);
    const q = query(colRef, where('email', '==', email.trim().toLowerCase()), where('isDeleted', '==', false));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { ...snap.docs[0].data(), id: snap.docs[0].id } as UsuarioDoc;
  }

  async checkDuplicate(email: string, cpf?: string, excludeId?: string): Promise<{ isDuplicate: boolean; field?: string }> {
    const colRef = collection(db, this.collectionName);
    if (email) {
      const qEmail = query(colRef, where('email', '==', email.trim().toLowerCase()), where('isDeleted', '==', false));
      const snap = await getDocs(qEmail);
      const match = snap.docs.find(d => d.id !== excludeId);
      if (match) return { isDuplicate: true, field: 'E-mail' };
    }
    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, '');
      const qCpf = query(colRef, where('cpf', '==', cleanCpf), where('isDeleted', '==', false));
      const snap = await getDocs(qCpf);
      const match = snap.docs.find(d => d.id !== excludeId);
      if (match) return { isDuplicate: true, field: 'CPF' };
    }
    return { isDuplicate: false };
  }
}

export class MotoboysRepository extends BaseRepository<MotoboyDoc> {
  constructor() {
    super('motoboys');
  }

  async checkDuplicate(cpf: string, telefone: string, placaMoto?: string, excludeId?: string): Promise<{ isDuplicate: boolean; field?: string }> {
    const colRef = collection(db, this.collectionName);
    const cleanCpf = cpf.replace(/\D/g, '');
    const cleanTel = telefone.replace(/\D/g, '');

    if (cleanCpf) {
      const q = query(colRef, where('cpf', '==', cleanCpf), where('isDeleted', '==', false));
      const snap = await getDocs(q);
      const match = snap.docs.find(d => d.id !== excludeId);
      if (match) return { isDuplicate: true, field: 'CPF' };
    }

    if (cleanTel) {
      const q = query(colRef, where('telefone', '==', cleanTel), where('isDeleted', '==', false));
      const snap = await getDocs(q);
      const match = snap.docs.find(d => d.id !== excludeId);
      if (match) return { isDuplicate: true, field: 'Telefone' };
    }

    if (placaMoto) {
      const cleanPlaca = placaMoto.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const q = query(colRef, where('placaMoto', '==', cleanPlaca), where('isDeleted', '==', false));
      const snap = await getDocs(q);
      const match = snap.docs.find(d => d.id !== excludeId);
      if (match) return { isDuplicate: true, field: 'Placa da Moto' };
    }

    return { isDuplicate: false };
  }
}

export class ClientesRepository extends BaseRepository<ClienteDoc> {
  constructor() {
    super('clientes');
  }

  async checkDuplicate(telefone: string, cnpjCampanha?: string, excludeId?: string): Promise<{ isDuplicate: boolean; field?: string }> {
    const colRef = collection(db, this.collectionName);
    const cleanTel = telefone.replace(/\D/g, '');
    if (cleanTel) {
      const q = query(colRef, where('telefone', '==', cleanTel), where('isDeleted', '==', false));
      const snap = await getDocs(q);
      const match = snap.docs.find(d => d.id !== excludeId);
      if (match) return { isDuplicate: true, field: 'Telefone' };
    }
    if (cnpjCampanha) {
      const cleanCnpj = cnpjCampanha.replace(/\D/g, '');
      if (cleanCnpj) {
        const q = query(colRef, where('cnpjCampanha', '==', cleanCnpj), where('isDeleted', '==', false));
        const snap = await getDocs(q);
        const match = snap.docs.find(d => d.id !== excludeId);
        if (match) return { isDuplicate: true, field: 'CNPJ' };
      }
    }
    return { isDuplicate: false };
  }
}

export class VeiculosRepository extends BaseRepository<VeiculoDoc> {
  constructor() {
    super('veiculos');
  }

  async checkDuplicatePlaca(placa: string, excludeId?: string): Promise<boolean> {
    const colRef = collection(db, this.collectionName);
    const cleanPlaca = placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const q = query(colRef, where('placa', '==', cleanPlaca), where('isDeleted', '==', false));
    const snap = await getDocs(q);
    return snap.docs.some(d => d.id !== excludeId);
  }
}

export class EntregasRepository extends BaseRepository<EntregaDoc> {
  constructor() {
    super('entregas');
  }

  // Atomic batch/transaction for updating delivery status and motoboy counters
  async atribuirMotoboy(entregaId: string, motoboy: MotoboyDoc, currentUserId?: string): Promise<void> {
    await runTransaction(db, async (transaction) => {
      const entregaRef = doc(db, 'entregas', entregaId);
      const motoboyRef = doc(db, 'motoboys', motoboy.id);

      const entregaSnap = await transaction.get(entregaRef);
      if (!entregaSnap.exists()) throw new Error('Entrega não encontrada');

      const nowIso = new Date().toISOString();
      transaction.update(entregaRef, {
        motoboyId: motoboy.id,
        motoboyNome: motoboy.nome,
        motoboyTelefone: motoboy.telefone,
        motoboyPlaca: motoboy.placaMoto,
        status: 'atribuida',
        updatedAt: nowIso,
        updatedBy: currentUserId || 'sistema'
      });

      transaction.update(motoboyRef, {
        status: 'em_rota',
        updatedAt: nowIso,
        updatedBy: currentUserId || 'sistema'
      });
    });
  }

  // Finish delivery with POD and update stats
  async concluirEntregaComPOD(entregaId: string, podData: any, currentUserId?: string): Promise<void> {
    await runTransaction(db, async (transaction) => {
      const entregaRef = doc(db, 'entregas', entregaId);
      const entregaSnap = await transaction.get(entregaRef);
      if (!entregaSnap.exists()) throw new Error('Entrega não encontrada');

      const entregaData = entregaSnap.data() as EntregaDoc;
      const nowIso = new Date().toISOString();

      // Read motoboy doc BEFORE any write
      let motoboySnap: any = null;
      let motoboyRef: any = null;
      if (entregaData.motoboyId) {
        motoboyRef = doc(db, 'motoboys', entregaData.motoboyId);
        motoboySnap = await transaction.get(motoboyRef);
      }

      // Read cliente doc BEFORE any write
      let clienteSnap: any = null;
      let clienteRef: any = null;
      if (entregaData.comiteId) {
        clienteRef = doc(db, 'clientes', entregaData.comiteId);
        clienteSnap = await transaction.get(clienteRef);
      }

      // Read pedido doc BEFORE any write
      let pedidoSnap: any = null;
      let pedidoRef: any = null;
      if (entregaData.pedidoId) {
        pedidoRef = doc(db, 'pedidos', entregaData.pedidoId);
        pedidoSnap = await transaction.get(pedidoRef);
      }

      // Read expedicao doc BEFORE any write
      let expedicaoSnap: any = null;
      let expedicaoRef: any = null;
      if (entregaData.expedicaoId) {
        expedicaoRef = doc(db, 'expedicoes', entregaData.expedicaoId);
        expedicaoSnap = await transaction.get(expedicaoRef);
      }

      // --- ALL WRITES AFTER ALL READS ---
      const cleanPod = sanitizeFirestoreData(podData);

      transaction.update(entregaRef, sanitizeFirestoreData({
        status: 'entregue',
        dataEntrega: nowIso,
        comprovantePOD: cleanPod,
        updatedAt: nowIso,
        updatedBy: currentUserId || 'sistema'
      }));

      if (motoboyRef && motoboySnap && motoboySnap.exists()) {
        const mData = motoboySnap.data() as MotoboyDoc;
        transaction.update(motoboyRef, sanitizeFirestoreData({
          totalEntregas: (mData.totalEntregas || 0) + 1,
          status: 'disponivel',
          updatedAt: nowIso,
          updatedBy: currentUserId || 'sistema'
        }));
      }

      if (clienteRef && clienteSnap && clienteSnap.exists()) {
        const cData = clienteSnap.data() as ClienteDoc;
        transaction.update(clienteRef, sanitizeFirestoreData({
          totalEntregas: (cData.totalEntregas || 0) + 1,
          volumeTotalMateriais: (cData.volumeTotalMateriais || 0) + (entregaData.quantidade || 0),
          updatedAt: nowIso,
          updatedBy: currentUserId || 'sistema'
        }));
      }

      if (pedidoRef && pedidoSnap && pedidoSnap.exists()) {
        const pData = pedidoSnap.data() as PedidoDoc;
        const historico = [
          ...(pData.historicoStatus || []),
          {
            status: 'entregue' as const,
            dataHora: nowIso,
            usuarioId: currentUserId || 'sistema',
            usuarioNome: 'Motoboy / POD',
            observacao: `Entrega concluída via POD (${cleanPod?.nomeRecebedor || 'Recebedor'})`,
          }
        ];
        transaction.update(pedidoRef, sanitizeFirestoreData({
          status: 'entregue',
          historicoStatus: historico,
          updatedAt: nowIso,
          updatedBy: currentUserId || 'sistema'
        }));
      }

      if (expedicaoRef && expedicaoSnap && expedicaoSnap.exists()) {
        transaction.update(expedicaoRef, sanitizeFirestoreData({
          status: 'entregue',
          updatedAt: nowIso,
          updatedBy: currentUserId || 'sistema'
        }));
      }

      // Registro imutável na trilha de auditoria TSE
      const logRef = doc(collection(db, 'logs_auditoria'));
      transaction.set(logRef, sanitizeFirestoreData({
        id: logRef.id,
        acao: 'conclusao_entrega_pod',
        entidade: 'entregas',
        entidadeId: entregaId,
        usuarioId: currentUserId || 'sistema',
        usuarioNome: cleanPod?.motoboyNome || 'Motoboy',
        detalhes: `Entrega ${entregaData.codigoRastreio} finalizada com POD. Recebedor: ${cleanPod?.nomeRecebedor || 'N/A'}. Hash: ${cleanPod?.hashSha256 || 'N/A'}`,
        dataHora: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
        updatedBy: currentUserId || 'sistema',
        metadados: {
          codigoRastreio: entregaData.codigoRastreio,
          pedidoId: entregaData.pedidoId || null,
          comiteId: entregaData.comiteId || null,
          hashSha256: cleanPod?.hashSha256 || null,
          localizacaoGps: cleanPod?.localizacaoGps || null,
          nomeRecebedor: cleanPod?.nomeRecebedor || null,
        }
      }));
    });
  }
}

export class PedidosRepository extends BaseRepository<PedidoDoc> {
  constructor() {
    super('pedidos');
  }

  // Generate safe sequential order number (PED-2026-000001)
  async gerarProximoNumero(): Promise<string> {
    try {
      const counterRef = doc(db, 'metadata', 'pedidos_counter');
      const nextNumber = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let currentSeq = 100;
        if (counterDoc.exists()) {
          currentSeq = (counterDoc.data().seq || 100) + 1;
        }
        transaction.set(counterRef, { seq: currentSeq, updatedAt: new Date().toISOString() }, { merge: true });
        return currentSeq;
      });
      return `PED-2026-${String(nextNumber).padStart(6, '0')}`;
    } catch (e) {
      console.warn('Fallback gerador sequencial de pedidos:', e);
      const fallbackSeq = Math.floor(100000 + Math.random() * 900000);
      return `PED-2026-${fallbackSeq}`;
    }
  }

  // Create order with sequential number and audit
  async createPedido(
    pedidoData: Omit<PedidoDoc, 'id' | 'numeroPedido' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>,
    currentUserId?: string,
    currentUserName?: string
  ): Promise<{ id: string; numeroPedido: string }> {
    const numeroPedido = await this.gerarProximoNumero();
    const nowIso = new Date().toISOString();

    const historicoInicial = pedidoData.historicoStatus && pedidoData.historicoStatus.length > 0
      ? pedidoData.historicoStatus
      : [{
          status: pedidoData.status || 'pendente',
          dataHora: nowIso,
          usuarioId: currentUserId || 'sistema',
          usuarioNome: currentUserName || 'Operador',
          observacao: 'Pedido criado no sistema',
        }];

    const cleanData: any = sanitizeFirestoreData({
      ...pedidoData,
      numeroPedido,
      historicoStatus: historicoInicial,
      isDeleted: false,
      deletedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: currentUserId || 'sistema',
      updatedBy: currentUserId || 'sistema',
      criadoPor: currentUserId || 'sistema',
      criadoPorNome: currentUserName || 'Operador',
    });

    const colRef = collection(db, this.collectionName);
    const docRef = await addDoc(colRef, cleanData);

    this.logAudit({
      acao: 'CREATE',
      colecao: this.collectionName,
      documentoId: docRef.id,
      usuarioId: currentUserId || 'sistema',
      usuarioNome: currentUserName || 'Usuário Ativo',
      usuarioEmail: 'sistema@fleetmoto.com.br',
      usuarioRole: 'administrador',
      detalhes: `Novo pedido ${numeroPedido} criado para o cliente ${pedidoData.clienteNome}`,
      dadosNovos: cleanData,
      timestamp: nowIso,
    }).catch(console.error);

    return { id: docRef.id, numeroPedido };
  }

  // Create order and a brand new client in atomic sequence
  async criarPedidoComNovoCliente(
    novoClienteData: Omit<ClienteDoc, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>,
    pedidoData: Omit<PedidoDoc, 'id' | 'numeroPedido' | 'clienteId' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>,
    currentUserId?: string,
    currentUserName?: string
  ): Promise<{ clienteId: string; pedidoId: string; numeroPedido: string }> {
    const cleanTel = novoClienteData.telefone.replace(/\D/g, '');
    const cleanCnpj = (novoClienteData.cnpjCampanha || '').replace(/\D/g, '');

    // Check duplicate client
    const dup = await clientesRepo.checkDuplicate(cleanTel, cleanCnpj);
    let clienteId: string;

    const nowIso = new Date().toISOString();

    if (dup.isDuplicate) {
      // Find existing
      const existing = await clientesRepo.getAll();
      const match = existing.find(c => 
        (cleanTel && c.telefone.replace(/\D/g, '') === cleanTel) ||
        (cleanCnpj && (c.cnpjCampanha || '').replace(/\D/g, '') === cleanCnpj)
      );
      if (match) {
        clienteId = match.id;
      } else {
        clienteId = await clientesRepo.create(novoClienteData, currentUserId);
      }
    } else {
      clienteId = await clientesRepo.create(novoClienteData, currentUserId);
    }

    const { id: pedidoId, numeroPedido } = await this.createPedido(
      {
        ...pedidoData,
        clienteId,
        clienteNome: novoClienteData.nome,
        candidato: novoClienteData.candidato,
        partido: novoClienteData.partido,
        numeroCandidato: novoClienteData.numero,
        cnpjCampanha: novoClienteData.cnpjCampanha,
        responsavel: novoClienteData.responsavel,
        telefone: novoClienteData.telefone,
        email: novoClienteData.email,
      },
      currentUserId,
      currentUserName
    );

    return { clienteId, pedidoId, numeroPedido };
  }

  // Generate Delivery from Order (Integration)
  async gerarEntregaAPartirDoPedido(
    pedidoId: string,
    activeUser: { id: string; nome: string; papel?: string },
    options?: {
      motoboyId?: string;
      motoboyNome?: string;
      motoboyTelefone?: string;
      motoboyPlaca?: string;
      valorFrete?: number;
      observacoes?: string;
    }
  ): Promise<{ entregaId: string; codigoRastreio: string }> {
    const pedidoRef = doc(db, 'pedidos', pedidoId);
    const nowIso = new Date().toISOString();

    return await runTransaction(db, async (transaction) => {
      const pedidoSnap = await transaction.get(pedidoRef);
      if (!pedidoSnap.exists()) {
        throw new Error('Pedido não encontrado no banco de dados.');
      }

      const pedido = pedidoSnap.data() as PedidoDoc;

      if (pedido.entregaId) {
        throw new Error(`Este pedido já possui uma entrega gerada (Código: ${pedido.codigoRastreio || pedido.entregaId}).`);
      }

      if (pedido.status === 'cancelado') {
        throw new Error('Não é possível gerar entrega para um pedido cancelado.');
      }

      // Generate tracking code
      const randTrack = Math.floor(100000 + Math.random() * 900000);
      const codigoRastreio = `TRK-${randTrack}`;

      // Pick primary material for legacy compatibility
      const primeItem = pedido.itens?.[0] || {
        tipoMaterial: 'combo_comicio',
        descricao: 'Materiais de Campanha',
        quantidade: pedido.quantidadeTotal || 1,
        unidadeMedida: 'unidades',
      };

      const entregasCol = collection(db, 'entregas');
      const newEntregaDocRef = doc(entregasCol);

      const enderecoFinal = pedido.enderecoEntrega?.endereco
        ? `${pedido.enderecoEntrega.endereco}${pedido.enderecoEntrega.numero ? ', ' + pedido.enderecoEntrega.numero : ''}${pedido.enderecoEntrega.complemento ? ' - ' + pedido.enderecoEntrega.complemento : ''}`
        : 'Endereço do Comitê';

      const bairroFinal = pedido.enderecoEntrega?.bairro || 'Centro';
      const cidadeFinal = pedido.enderecoEntrega?.cidade || 'São Paulo';
      const zonaFinal = pedido.enderecoEntrega?.zonaEleitoral || 'Zona Central';
      const responsavelFinal = pedido.enderecoEntrega?.responsavelRecebimento || pedido.responsavel;
      const telefoneFinal = pedido.enderecoEntrega?.telefoneRecebedor || pedido.telefone;

      const prioridadeEntrega = pedido.prioridade === 'urgente'
        ? 'urgente_comicio'
        : pedido.prioridade === 'alta'
        ? 'alta'
        : 'normal';

      const entregaData: any = sanitizeFirestoreData({
        codigoRastreio,
        pedidoId,
        comiteId: pedido.clienteId,
        comiteNome: pedido.clienteNome,
        candidato: pedido.candidato,
        partido: pedido.partido || '',
        cnpjCampanha: pedido.cnpjCampanha || '',
        tipoMaterial: (primeItem.tipoMaterial as any) || 'combo_comicio',
        descricaoMaterial: pedido.itens?.map(i => `${i.quantidade}x ${i.nomeMaterial}`).join(', ') || primeItem.descricao,
        quantidade: pedido.quantidadeTotal || primeItem.quantidade,
        unidadeMedida: (primeItem.unidadeMedida as any) || 'unidades',
        pesoKg: Math.max(2, Math.round((pedido.quantidadeTotal || 100) / 50)),
        enderecoDestino: enderecoFinal,
        bairro: bairroFinal,
        cidade: cidadeFinal,
        zonaEleitoral: zonaFinal,
        pontoReferencia: pedido.enderecoEntrega?.pontoReferencia || '',
        responsavelRecebimento: responsavelFinal,
        telefoneContato: telefoneFinal,
        prioridade: prioridadeEntrega,
        motoboyId: options?.motoboyId || '',
        motoboyNome: options?.motoboyNome || '',
        motoboyTelefone: options?.motoboyTelefone || '',
        motoboyPlaca: options?.motoboyPlaca || '',
        status: options?.motoboyId ? 'atribuida' : 'pendente',
        dataCriacao: nowIso,
        dataPrevisao: pedido.dataPrevisao || new Date(Date.now() + 3 * 3600000).toISOString(),
        valorFrete: options?.valorFrete || 45.0,
        itens: pedido.itens || [],
        observacoes: options?.observacoes || pedido.observacoes || `Entrega gerada a partir do Pedido ${pedido.numeroPedido}`,
        isDeleted: false,
        deletedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        createdBy: activeUser.id,
        updatedBy: activeUser.id,
      });

      transaction.set(newEntregaDocRef, entregaData);

      const novoHistorico = [
        ...(pedido.historicoStatus || []),
        {
          status: 'enviado' as const,
          dataHora: nowIso,
          usuarioId: activeUser.id,
          usuarioNome: activeUser.nome,
          observacao: `Entrega gerada automaticamente (${codigoRastreio})`,
        }
      ];

      transaction.update(pedidoRef, sanitizeFirestoreData({
        status: 'enviado',
        entregaId: newEntregaDocRef.id,
        codigoRastreio,
        historicoStatus: novoHistorico,
        updatedAt: nowIso,
        updatedBy: activeUser.id,
      }));

      return { entregaId: newEntregaDocRef.id, codigoRastreio };
    });
  }

  // Transition status with history log
  async atualizarStatus(
    pedidoId: string,
    novoStatus: PedidoDoc['status'],
    activeUser: { id: string; nome: string },
    observacao?: string
  ): Promise<void> {
    const pedidoRef = doc(db, 'pedidos', pedidoId);
    const nowIso = new Date().toISOString();

    const pedidoSnap = await getDoc(pedidoRef);
    if (!pedidoSnap.exists()) throw new Error('Pedido não encontrado.');

    const pedido = pedidoSnap.data() as PedidoDoc;
    const historicoAtualizado = [
      ...(pedido.historicoStatus || []),
      {
        status: novoStatus,
        dataHora: nowIso,
        usuarioId: activeUser.id,
        usuarioNome: activeUser.nome,
        observacao: observacao || `Status alterado para ${novoStatus}`,
      }
    ];

    await updateDoc(pedidoRef, sanitizeFirestoreData({
      status: novoStatus,
      historicoStatus: historicoAtualizado,
      updatedAt: nowIso,
      updatedBy: activeUser.id,
    }));

    this.logAudit({
      acao: 'UPDATE',
      colecao: this.collectionName,
      documentoId: pedidoId,
      usuarioId: activeUser.id,
      usuarioNome: activeUser.nome,
      usuarioEmail: 'sistema@fleetmoto.com.br',
      usuarioRole: 'administrador',
      detalhes: `Status do pedido ${pedido.numeroPedido} alterado para ${novoStatus}`,
      dadosNovos: { status: novoStatus, observacao },
      timestamp: nowIso,
    }).catch(console.error);
  }

  // Confirm Dispatch / Expedition
  async confirmarEnvioExpedicao(
    pedidoId: string,
    statusAlvo: 'em_separacao' | 'pronto' | 'enviado',
    activeUser: { id: string; nome: string },
    observacao?: string
  ): Promise<void> {
    await this.atualizarStatus(
      pedidoId,
      statusAlvo,
      activeUser,
      observacao || `Enviado para setor de expedição (${statusAlvo})`
    );
  }

  // Cancel order preserving history
  async cancelarPedido(
    pedidoId: string,
    activeUser: { id: string; nome: string },
    motivo?: string
  ): Promise<void> {
    await this.atualizarStatus(
      pedidoId,
      'cancelado',
      activeUser,
      motivo ? `Cancelamento: ${motivo}` : 'Pedido cancelado pelo usuário'
    );
  }
}

export class RotasRepository extends BaseRepository<RotaDoc> {
  constructor() {
    super('rotas');
  }
}

export class DivergenciasRepository extends BaseRepository<DivergenciaDoc> {
  constructor() {
    super('divergencias');
  }

  async findByPedidoId(pedidoId: string): Promise<DivergenciaDoc[]> {
    const colRef = collection(db, this.collectionName);
    const q = query(colRef, where('pedidoId', '==', pedidoId), where('isDeleted', '==', false));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as DivergenciaDoc));
  }
}

export class RotasExpedicaoRepository extends BaseRepository<RotaExpedicaoDoc> {
  constructor() {
    super('rotas_expedicao');
  }

  async gerarProximoCodigo(): Promise<string> {
    try {
      const counterRef = doc(db, 'metadata', 'rotas_counter');
      const nextNumber = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let currentSeq = 1;
        if (counterDoc.exists()) {
          currentSeq = (counterDoc.data().seq || 0) + 1;
        }
        transaction.set(counterRef, { seq: currentSeq, updatedAt: new Date().toISOString() }, { merge: true });
        return currentSeq;
      });
      return `ROTA-2026-${String(nextNumber).padStart(3, '0')}`;
    } catch (e) {
      console.warn('Fallback gerador sequencial de rotas:', e);
      return `ROTA-2026-${Math.floor(100 + Math.random() * 900)}`;
    }
  }
}

export class ExpedicoesRepository extends BaseRepository<ExpedicaoDoc> {
  constructor() {
    super('expedicoes');
  }

  // Generate safe sequential delivery note number (NOT-EXP-2026-000001)
  async gerarProximoNumeroNota(): Promise<string> {
    try {
      const counterRef = doc(db, 'metadata', 'notas_counter');
      const nextNumber = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let currentSeq = 1;
        if (counterDoc.exists()) {
          currentSeq = (counterDoc.data().seq || 0) + 1;
        }
        transaction.set(counterRef, { seq: currentSeq, updatedAt: new Date().toISOString() }, { merge: true });
        return currentSeq;
      });
      return `NOT-EXP-2026-${String(nextNumber).padStart(6, '0')}`;
    } catch (e) {
      console.warn('Fallback gerador sequencial de notas:', e);
      const fallbackSeq = Math.floor(100000 + Math.random() * 900000);
      return `NOT-EXP-2026-${fallbackSeq}`;
    }
  }

  // Import order to expedition automatically or manually with duplicate check
  async importarPedidoParaExpedicao(
    pedido: PedidoDoc,
    activeUser: { id: string; nome: string }
  ): Promise<string> {
    const colRef = collection(db, this.collectionName);
    const q = query(colRef, where('pedidoId', '==', pedido.id), where('isDeleted', '==', false));
    const snap = await getDocs(q);

    if (!snap.empty) {
      return snap.docs[0].id; // Já existe, retorna ID existente sem duplicar
    }

    const nowIso = new Date().toISOString();

    const itensExpedicao: ItemExpedicao[] = (pedido.itens || []).map((it, idx) => ({
      id: it.id || `item-exp-${idx + 1}`,
      materialId: it.tipoMaterial,
      tipoMaterial: it.tipoMaterial || 'outro',
      nomeMaterial: it.nomeMaterial || it.descricao || 'Material Eleitoral',
      descricao: it.descricao || '',
      quantidadeSolicitada: it.quantidade || 0,
      unidadeMedida: it.unidadeMedida || 'unidades',
      quantidadeSeparada: 0,
      quantidadeFaltante: it.quantidade || 0,
      situacao: 'aguardando',
      localizacaoEstoque: 'Galpão Central - Setor A',
    }));

    const enderecoCompleto = pedido.enderecoEntrega?.endereco
      ? `${pedido.enderecoEntrega.endereco}${pedido.enderecoEntrega.numero ? ', ' + pedido.enderecoEntrega.numero : ''}${pedido.enderecoEntrega.complemento ? ' (' + pedido.enderecoEntrega.complemento + ')' : ''}`
      : 'Retirada no Local / Balcão';

    const cleanData: any = sanitizeFirestoreData({
      pedidoId: pedido.id,
      numeroPedido: pedido.numeroPedido,
      clienteId: pedido.clienteId,
      clienteNome: pedido.clienteNome,
      candidato: pedido.candidato,
      partido: pedido.partido || '',
      telefone: pedido.telefone || '',
      enderecoCompleto,
      bairro: pedido.enderecoEntrega?.bairro || 'Centro',
      cidade: pedido.enderecoEntrega?.cidade || 'São Paulo',
      zonaEleitoral: pedido.enderecoEntrega?.zonaEleitoral || 'Zona Central',
      prioridade: pedido.prioridade || 'normal',
      dataPrevisaoSaida: pedido.dataPrevisao || new Date(Date.now() + 24 * 3600000).toISOString(),
      quantidadeTotalItens: pedido.quantidadeTotal || 1,
      volumeTotal: Math.max(1, Math.ceil((pedido.quantidadeTotal || 100) / 500)),
      pesoTotalKg: Math.max(2, Math.round((pedido.quantidadeTotal || 100) / 40)),
      status: 'aguardando_separacao',
      itens: itensExpedicao,
      divergencias: [],
      isDeleted: false,
      deletedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      criadoPor: activeUser.id,
      createdBy: activeUser.id,
      updatedBy: activeUser.id,
    });

    const docRef = await addDoc(colRef, cleanData);

    this.logAudit({
      acao: 'CREATE',
      colecao: this.collectionName,
      documentoId: docRef.id,
      usuarioId: activeUser.id,
      usuarioNome: activeUser.nome,
      usuarioEmail: 'sistema@fleetmoto.com.br',
      usuarioRole: 'expedicao' as any,
      detalhes: `Pedido ${pedido.numeroPedido} importado para a fila de Expedição`,
      dadosNovos: cleanData,
      timestamp: nowIso,
    }).catch(console.error);

    return docRef.id;
  }

  // Start Separation Process
  async iniciarSeparacao(
    expedicaoId: string,
    separador: { id: string; nome: string },
    localSeparacao: string,
    observacoes?: string
  ): Promise<void> {
    const expRef = doc(db, this.collectionName, expedicaoId);
    const nowIso = new Date().toISOString();

    const snap = await getDoc(expRef);
    if (!snap.exists()) throw new Error('Expedição não encontrada.');
    const expData = snap.data() as ExpedicaoDoc;

    const itensAtualizados = (expData.itens || []).map(i => ({
      ...i,
      situacao: (i.situacao === 'aguardando' ? 'em_separacao' : i.situacao) as any,
      separadorNome: separador.nome
    }));

    await updateDoc(expRef, sanitizeFirestoreData({
      status: 'em_separacao',
      inicioSeparacao: nowIso,
      separadorId: separador.id,
      separadorNome: separador.nome,
      localSeparacao: localSeparacao || 'Galpão Central - Bancada 1',
      itens: itensAtualizados,
      observacoes: observacoes || expData.observacoes || '',
      updatedAt: nowIso,
      updatedBy: separador.id,
    }));

    // Sincroniza status do pedido se aplicável
    if (expData.pedidoId) {
      await pedidosRepo.atualizarStatus(
        expData.pedidoId,
        'em_separacao',
        separador,
        `Separação iniciada por ${separador.nome} no local: ${localSeparacao}`
      ).catch(console.warn);
    }

    this.logAudit({
      acao: 'STATUS_CHANGE',
      colecao: this.collectionName,
      documentoId: expedicaoId,
      usuarioId: separador.id,
      usuarioNome: separador.nome,
      usuarioEmail: 'sistema@fleetmoto.com.br',
      usuarioRole: 'expedicao' as any,
      detalhes: `Separação iniciada por ${separador.nome} no ${localSeparacao}`,
      timestamp: nowIso,
    }).catch(console.error);
  }

  // Update item state during separation
  async atualizarItemSeparacao(
    expedicaoId: string,
    itemId: string,
    atualizacao: Partial<ItemExpedicao>,
    activeUser: { id: string; nome: string }
  ): Promise<void> {
    const expRef = doc(db, this.collectionName, expedicaoId);
    const nowIso = new Date().toISOString();

    const snap = await getDoc(expRef);
    if (!snap.exists()) throw new Error('Expedição não encontrada.');
    const expData = snap.data() as ExpedicaoDoc;

    const itens = (expData.itens || []).map(it => {
      if (it.id === itemId) {
        const qtySep = atualizacao.quantidadeSeparada !== undefined ? atualizacao.quantidadeSeparada : it.quantidadeSeparada;
        const faltante = Math.max(0, it.quantidadeSolicitada - qtySep);
        return {
          ...it,
          ...atualizacao,
          quantidadeSeparada: qtySep,
          quantidadeFaltante: faltante,
          separadorNome: activeUser.nome
        };
      }
      return it;
    });

    await updateDoc(expRef, sanitizeFirestoreData({
      itens,
      updatedAt: nowIso,
      updatedBy: activeUser.id,
    }));
  }

  // Finalize separation and move to conference
  async finalizarSeparacao(
    expedicaoId: string,
    activeUser: { id: string; nome: string },
    observacoes?: string
  ): Promise<void> {
    const expRef = doc(db, this.collectionName, expedicaoId);
    const nowIso = new Date().toISOString();

    const snap = await getDoc(expRef);
    if (!snap.exists()) throw new Error('Expedição não encontrada.');
    const expData = snap.data() as ExpedicaoDoc;

    // Check if items are separated
    const itensPendentes = (expData.itens || []).filter(
      i => !['separado', 'conferido', 'substituido', 'parcial'].includes(i.situacao)
    );

    if (itensPendentes.length > 0) {
      throw new Error(`Não é possível finalizar: existem ${itensPendentes.length} itens sem confirmação ou com pendência.`);
    }

    const inicio = expData.inicioSeparacao ? new Date(expData.inicioSeparacao).getTime() : Date.now();
    const fim = new Date(nowIso).getTime();
    const tempoMinutos = Math.max(1, Math.round((fim - inicio) / 60000));

    await updateDoc(expRef, sanitizeFirestoreData({
      status: 'aguardando_conferencia',
      fimSeparacao: nowIso,
      tempoSeparacaoMinutos: tempoMinutos,
      observacoes: observacoes || expData.observacoes || '',
      updatedAt: nowIso,
      updatedBy: activeUser.id,
    }));

    this.logAudit({
      acao: 'STATUS_CHANGE',
      colecao: this.collectionName,
      documentoId: expedicaoId,
      usuarioId: activeUser.id,
      usuarioNome: activeUser.nome,
      usuarioEmail: 'sistema@fleetmoto.com.br',
      usuarioRole: 'expedicao' as any,
      detalhes: `Separação concluída por ${activeUser.nome} em ${tempoMinutos} min. Aguardando conferência.`,
      timestamp: nowIso,
    }).catch(console.error);
  }

  // Register Conference
  async registrarConferencia(
    expedicaoId: string,
    conferenciaData: ConferenciaExpedicao,
    activeUser: { id: string; nome: string }
  ): Promise<void> {
    const expRef = doc(db, this.collectionName, expedicaoId);
    const nowIso = new Date().toISOString();

    const snap = await getDoc(expRef);
    if (!snap.exists()) throw new Error('Expedição não encontrada.');
    const expData = snap.data() as ExpedicaoDoc;

    let novoStatus: ExpedicaoDoc['status'] = 'pronto_expedicao';
    if (conferenciaData.resultado === 'reprovado' || conferenciaData.resultado === 'devolvido_separacao') {
      novoStatus = 'em_separacao';
    } else if (conferenciaData.resultado === 'aprovado_com_ressalva') {
      novoStatus = 'pronto_expedicao';
    }

    const itensConferidos = (expData.itens || []).map(i => ({
      ...i,
      situacao: (conferenciaData.resultado === 'reprovado' ? 'em_separacao' : 'conferido') as any
    }));

    await updateDoc(expRef, sanitizeFirestoreData({
      status: novoStatus,
      conferencia: conferenciaData,
      itens: itensConferidos,
      volumeTotal: conferenciaData.numeroVolumes || expData.volumeTotal || 1,
      pesoTotalKg: conferenciaData.pesoTotalKg || expData.pesoTotalKg || 2,
      updatedAt: nowIso,
      updatedBy: activeUser.id,
    }));

    if (expData.pedidoId && novoStatus === 'pronto_expedicao') {
      await pedidosRepo.atualizarStatus(
        expData.pedidoId,
        'pronto',
        activeUser,
        `Conferência aprovada por ${conferenciaData.conferenteNome} (${conferenciaData.numeroVolumes} volumes, ${conferenciaData.pesoTotalKg}kg)`
      ).catch(console.warn);
    }

    this.logAudit({
      acao: 'STATUS_CHANGE',
      colecao: this.collectionName,
      documentoId: expedicaoId,
      usuarioId: activeUser.id,
      usuarioNome: activeUser.nome,
      usuarioEmail: 'sistema@fleetmoto.com.br',
      usuarioRole: 'expedicao' as any,
      detalhes: `Conferência registrada: ${conferenciaData.resultado.toUpperCase()} por ${conferenciaData.conferenteNome}`,
      timestamp: nowIso,
    }).catch(console.error);
  }

  // Register Divergence
  async registrarDivergencia(
    divergenciaData: Omit<DivergenciaDoc, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'>,
    activeUser: { id: string; nome: string }
  ): Promise<string> {
    const divCol = collection(db, 'divergencias');
    const nowIso = new Date().toISOString();

    const cleanDiv: any = sanitizeFirestoreData({
      ...divergenciaData,
      isDeleted: false,
      deletedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: activeUser.id,
      updatedBy: activeUser.id,
    });

    const divRef = await addDoc(divCol, cleanDiv);

    // Update expedicao status and list
    const qExp = query(collection(db, 'expedicoes'), where('pedidoId', '==', divergenciaData.pedidoId));
    const snap = await getDocs(qExp);
    if (!snap.empty) {
      const expDocRef = snap.docs[0].ref;
      const expData = snap.docs[0].data() as ExpedicaoDoc;
      const divs = [...(expData.divergencias || []), { ...cleanDiv, id: divRef.id }];

      await updateDoc(expDocRef, sanitizeFirestoreData({
        status: 'com_divergencia',
        divergencias: divs,
        updatedAt: nowIso,
        updatedBy: activeUser.id,
      }));
    }

    this.logAudit({
      acao: 'CREATE',
      colecao: 'divergencias',
      documentoId: divRef.id,
      usuarioId: activeUser.id,
      usuarioNome: activeUser.nome,
      usuarioEmail: 'sistema@fleetmoto.com.br',
      usuarioRole: 'supervisor_expedicao' as any,
      detalhes: `Divergência registrada para pedido ${divergenciaData.numeroPedido}: ${divergenciaData.tipo} - ${divergenciaData.descricao}`,
      timestamp: nowIso,
    }).catch(console.error);

    return divRef.id;
  }

  // Resolve Divergence (Supervisor Authorization)
  async resolverDivergencia(
    divergenciaId: string,
    pedidoId: string,
    solucao: {
      solucaoAdotada: string;
      autorizadoPorId: string;
      autorizadoPorNome: string;
      novoStatusExpedicao?: ExpedicaoDoc['status'];
    },
    activeUser: { id: string; nome: string }
  ): Promise<void> {
    const nowIso = new Date().toISOString();
    const divRef = doc(db, 'divergencias', divergenciaId);

    await updateDoc(divRef, sanitizeFirestoreData({
      status: 'resolvida',
      solucaoAdotada: solucao.solucaoAdotada,
      autorizadoPorId: solucao.autorizadoPorId,
      autorizadoPorNome: solucao.autorizadoPorNome,
      dataHoraResolucao: nowIso,
      updatedAt: nowIso,
      updatedBy: activeUser.id,
    }));

    // Update in expedicao
    const qExp = query(collection(db, 'expedicoes'), where('pedidoId', '==', pedidoId));
    const snap = await getDocs(qExp);
    if (!snap.empty) {
      const expDocRef = snap.docs[0].ref;
      const expData = snap.docs[0].data() as ExpedicaoDoc;
      const divs = (expData.divergencias || []).map(d => {
        if (d.id === divergenciaId) {
          return {
            ...d,
            status: 'resolvida' as const,
            solucaoAdotada: solucao.solucaoAdotada,
            autorizadoPorId: solucao.autorizadoPorId,
            autorizadoPorNome: solucao.autorizadoPorNome,
            dataHoraResolucao: nowIso,
          };
        }
        return d;
      });

      const abertas = divs.filter(d => d.status === 'aberta');
      const targetStatus = abertas.length === 0 ? (solucao.novoStatusExpedicao || 'pronto_expedicao') : 'com_divergencia';

      await updateDoc(expDocRef, sanitizeFirestoreData({
        status: targetStatus,
        divergencias: divs,
        updatedAt: nowIso,
        updatedBy: activeUser.id,
      }));
    }

    this.logAudit({
      acao: 'UPDATE',
      colecao: 'divergencias',
      documentoId: divergenciaId,
      usuarioId: activeUser.id,
      usuarioNome: activeUser.nome,
      usuarioEmail: 'sistema@fleetmoto.com.br',
      usuarioRole: 'supervisor_expedicao' as any,
      detalhes: `Divergência ${divergenciaId} resolvida com autorização de ${solucao.autorizadoPorNome}`,
      timestamp: nowIso,
    }).catch(console.error);
  }

  // Atomic Release for Delivery (Liberação com Nota de Entrega e Criação de Entrega)
  async liberarParaEntrega(
    expedicaoId: string,
    liberacaoData: LiberacaoExpedicao,
    activeUser: { id: string; nome: string }
  ): Promise<{ notaNumero: string; entregaId: string; codigoRastreio: string }> {
    const nowIso = new Date().toISOString();
    const expRef = doc(db, 'expedicoes', expedicaoId);

    const expSnap = await getDoc(expRef);
    if (!expSnap.exists()) throw new Error('Expedição não encontrada.');
    const exp = expSnap.data() as ExpedicaoDoc;

    if (exp.status === 'liberado_entrega' || exp.status === 'em_rota' || exp.status === 'finalizado') {
      throw new Error(`Este pedido já foi liberado anteriormente (Nota: ${exp.notaEntrega?.numeroNota || 'Emitida'}).`);
    }

    const notaNumero = await this.gerarProximoNumeroNota();
    const randTrack = Math.floor(100000 + Math.random() * 900000);
    const codigoRastreio = `FLEET-EXP-${randTrack}`;

    // Create delivery doc in `entregas`
    const entregasCol = collection(db, 'entregas');
    const newEntregaDocRef = doc(entregasCol);

    const entregaData: any = sanitizeFirestoreData({
      codigoRastreio,
      pedidoId: exp.pedidoId,
      comiteId: exp.clienteId,
      comiteNome: exp.clienteNome,
      candidato: exp.candidato,
      partido: exp.partido || '',
      cnpjCampanha: '',
      tipoMaterial: exp.itens?.[0]?.tipoMaterial || 'combo_comicio',
      descricaoMaterial: exp.itens?.map(i => `${i.quantidadeSolicitada}x ${i.nomeMaterial}`).join(', ') || 'Material de Campanha',
      quantidade: exp.quantidadeTotalItens || 1,
      unidadeMedida: 'unidades',
      pesoKg: liberacaoData.pesoTotalKg || exp.pesoTotalKg || 5,
      enderecoDestino: exp.enderecoCompleto,
      bairro: exp.bairro || 'Centro',
      cidade: exp.cidade || 'São Paulo',
      zonaEleitoral: exp.zonaEleitoral || 'Zona Central',
      responsavelRecebimento: liberacaoData.nomeRetirou || 'Responsável pelo Comitê',
      telefoneContato: exp.telefone || '',
      prioridade: exp.prioridade === 'urgente' ? 'urgente_comicio' : exp.prioridade === 'alta' ? 'alta' : 'normal',
      motoboyId: liberacaoData.motoboyId || '',
      motoboyNome: liberacaoData.motoboyNome || '',
      motoboyTelefone: liberacaoData.motoboyTelefone || '',
      motoboyPlaca: liberacaoData.veiculoPlaca || '',
      status: 'atribuida',
      dataCriacao: nowIso,
      dataPrevisao: exp.dataPrevisaoSaida || nowIso,
      valorFrete: 50.0,
      itens: exp.itens || [],
      observacoes: `Liberado na Expedição com Nota ${notaNumero}. Lacre: ${liberacaoData.numeroLacre || 'N/A'}. Retirado por: ${liberacaoData.nomeRetirou} (${liberacaoData.documentoRetirou})`,
      isDeleted: false,
      deletedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: activeUser.id,
      updatedBy: activeUser.id,
    });

    const notaDoc: NotaEntrega = {
      id: `nota-${exp.id}`,
      numeroNota: notaNumero,
      pedidoId: exp.pedidoId,
      numeroPedido: exp.numeroPedido,
      codigoRastreio,
      dataEmissao: nowIso,
      clienteNome: exp.clienteNome,
      candidato: exp.candidato,
      partido: exp.partido || '',
      cnpjCpf: '',
      telefone: exp.telefone,
      enderecoCompleto: exp.enderecoCompleto,
      bairro: exp.bairro,
      cidade: exp.cidade,
      zonaEleitoral: exp.zonaEleitoral,
      rotaNome: liberacaoData.rotaNome,
      ordemParada: liberacaoData.sequenciaRota || 1,
      motoboyNome: liberacaoData.motoboyNome,
      motoboyTelefone: liberacaoData.motoboyTelefone,
      veiculoPlaca: liberacaoData.veiculoPlaca,
      veiculoModelo: liberacaoData.veiculoModelo,
      horarioPrevisto: liberacaoData.horarioPrevisto || nowIso.slice(11, 16),
      horarioSaidaReal: liberacaoData.horarioRealSaida || nowIso.slice(11, 16),
      itens: exp.itens || [],
      quantidadeVolumes: liberacaoData.quantidadeVolumes || exp.volumeTotal || 1,
      pesoTotalKg: liberacaoData.pesoTotalKg || exp.pesoTotalKg || 5,
      numeroLacre: liberacaoData.numeroLacre || '',
      separadoPor: exp.separadorNome || 'Equipe Expedição',
      conferidoPor: exp.conferencia?.conferenteNome || 'Supervisor de Qualidade',
      liberadoPor: liberacaoData.responsavelLiberacaoNome || activeUser.nome,
      retiradoPor: liberacaoData.nomeRetirou || 'Portador Credenciado',
      documentoRetirador: liberacaoData.documentoRetirou || '',
      observacoes: liberacaoData.observacoes || exp.observacoes || '',
      reimpressoes: [],
    };

    // Execute atomic batch
    const batch = writeBatch(db);

    // 1. Set entrega
    batch.set(newEntregaDocRef, entregaData);

    // 2. Update expedicao
    batch.update(expRef, sanitizeFirestoreData({
      status: 'liberado_entrega',
      liberacao: liberacaoData,
      notaEntrega: notaDoc,
      entregaId: newEntregaDocRef.id,
      codigoRastreio,
      updatedAt: nowIso,
      updatedBy: activeUser.id,
    }));

    // 3. Update motoboy if assigned
    if (liberacaoData.motoboyId) {
      const mbRef = doc(db, 'motoboys', liberacaoData.motoboyId);
      batch.update(mbRef, {
        status: 'em_rota',
        updatedAt: nowIso,
        updatedBy: activeUser.id,
      });
    }

    // 4. Update pedido
    if (exp.pedidoId) {
      const pedRef = doc(db, 'pedidos', exp.pedidoId);
      batch.update(pedRef, sanitizeFirestoreData({
        status: 'enviado',
        entregaId: newEntregaDocRef.id,
        codigoRastreio,
        updatedAt: nowIso,
        updatedBy: activeUser.id,
      }));
    }

    await batch.commit();

    this.logAudit({
      acao: 'STATUS_CHANGE',
      colecao: this.collectionName,
      documentoId: expedicaoId,
      usuarioId: activeUser.id,
      usuarioNome: activeUser.nome,
      usuarioEmail: 'sistema@fleetmoto.com.br',
      usuarioRole: 'supervisor_expedicao' as any,
      detalhes: `Expedição liberada para entrega. Nota: ${notaNumero}, Rastreio: ${codigoRastreio}, Motoboy: ${liberacaoData.motoboyNome}`,
      dadosNovos: { notaNumero, codigoRastreio, liberacaoData },
      timestamp: nowIso,
    }).catch(console.error);

    return { notaNumero, entregaId: newEntregaDocRef.id, codigoRastreio };
  }

  // Reprint Note with required justification log
  async registrarReimpressaoNota(
    expedicaoId: string,
    motivo: string,
    activeUser: { id: string; nome: string }
  ): Promise<void> {
    const expRef = doc(db, this.collectionName, expedicaoId);
    const nowIso = new Date().toISOString();

    const snap = await getDoc(expRef);
    if (!snap.exists()) throw new Error('Expedição não encontrada.');
    const exp = snap.data() as ExpedicaoDoc;

    if (!exp.notaEntrega) throw new Error('Este pedido ainda não possui nota emitida.');

    const novoRegistro = {
      usuarioId: activeUser.id,
      usuarioNome: activeUser.nome,
      dataHora: nowIso,
      motivo: motivo.trim() || 'Reimpressão operacional solicitada',
    };

    const reimpressoes = [...(exp.notaEntrega.reimpressoes || []), novoRegistro];
    const notaAtualizada = { ...exp.notaEntrega, reimpressoes };

    await updateDoc(expRef, sanitizeFirestoreData({
      notaEntrega: notaAtualizada,
      updatedAt: nowIso,
      updatedBy: activeUser.id,
    }));

    this.logAudit({
      acao: 'UPDATE',
      colecao: this.collectionName,
      documentoId: expedicaoId,
      usuarioId: activeUser.id,
      usuarioNome: activeUser.nome,
      usuarioEmail: 'sistema@fleetmoto.com.br',
      usuarioRole: 'expedicao' as any,
      detalhes: `Reimpressão de Nota (${exp.notaEntrega.numeroNota}) realizada por ${activeUser.nome}. Motivo: ${motivo}`,
      timestamp: nowIso,
    }).catch(console.error);
  }
}


export class PagamentosRepository extends BaseRepository<PagamentoDoc> {
  constructor() {
    super('pagamentos');
  }
}

export class AdesivosRepository extends BaseRepository<AdesivoDoc> {
  constructor() {
    super('adesivos');
  }
}

export class DocumentosRepository extends BaseRepository<DocumentoDoc> {
  constructor() {
    super('documentos');
  }
}

export class OcorrenciasRepository extends BaseRepository<OcorrenciaDoc> {
  constructor() {
    super('ocorrencias');
  }
}

export class NotificacoesRepository extends BaseRepository<NotificacaoDoc> {
  constructor() {
    super('notificacoes');
  }
}

export class ConfiguracoesRepository extends BaseRepository<ConfiguracaoDoc> {
  constructor() {
    super('configuracoes');
  }
}

export class LogsAuditoriaRepository extends BaseRepository<LogAuditoriaDoc> {
  constructor() {
    super('logs_auditoria');
  }
}

// ============================================================================
// REPOSITÓRIOS DO MÓDULO DE ESTOQUE & INVENTÁRIO (FLEETMOTO)
// ============================================================================

export class MateriaisRepository extends BaseRepository<MaterialDoc> {
  constructor() {
    super('materiais');
  }

  // Busca material por SKU
  async getBySku(sku: string): Promise<MaterialDoc | null> {
    try {
      const cleanSku = (sku || '').trim().toUpperCase();
      const all = await this.getAll();
      return all.find((m) => m.sku && m.sku.trim().toUpperCase() === cleanSku) || null;
    } catch {
      return null;
    }
  }

  // Gera o próximo SKU sequencial seguro (ex: MAT-000001)
  async gerarProximoSku(): Promise<string> {
    try {
      const all = await this.getAll();
      let maxNum = 0;
      all.forEach((mat) => {
        if (mat.sku) {
          const match = mat.sku.match(/MAT-(\d+)/i);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
      });
      const next = maxNum + 1;
      return `MAT-${String(next).padStart(6, '0')}`;
    } catch {
      return `MAT-${String(Date.now()).slice(-6)}`;
    }
  }

  // Valida duplicidades por SKU, Código de barras ou combinação de Nome + Candidato + Formato + Lote
  async checkDuplicate(
    sku: string,
    codigoBarras?: string,
    nome?: string,
    candidato?: string,
    tamanhoFormato?: string,
    lote?: string,
    excludeId?: string
  ): Promise<{ isDuplicate: boolean; reason?: string }> {
    const all = await this.getAll();
    const cleanSku = (sku || '').trim().toUpperCase();
    const cleanBar = (codigoBarras || '').trim();
    const cleanNome = (nome || '').trim().toLowerCase();
    const cleanCand = (candidato || '').trim().toLowerCase();
    const cleanFmt = (tamanhoFormato || '').trim().toLowerCase();
    const cleanLote = (lote || '').trim().toLowerCase();

    for (const mat of all) {
      if (excludeId && mat.id === excludeId) continue;

      if (cleanSku && mat.sku && mat.sku.trim().toUpperCase() === cleanSku) {
        return { isDuplicate: true, reason: `Já existe um material cadastrado com o SKU "${mat.sku}".` };
      }

      if (cleanBar && mat.codigoBarras && mat.codigoBarras.trim() === cleanBar) {
        return { isDuplicate: true, reason: `Já existe um material com o Código de Barras "${mat.codigoBarras}".` };
      }

      if (
        cleanNome &&
        mat.nome &&
        mat.nome.trim().toLowerCase() === cleanNome &&
        cleanCand === (mat.candidato || '').trim().toLowerCase() &&
        cleanFmt === (mat.tamanhoFormato || '').trim().toLowerCase() &&
        cleanLote === (mat.lote || '').trim().toLowerCase()
      ) {
        return {
          isDuplicate: true,
          reason: `Material idêntico detectado (Nome: "${mat.nome}", Candidato: "${mat.candidato || 'Geral'}", Formato: "${mat.tamanhoFormato || 'Padrão'}", Lote: "${mat.lote || 'Geral'}").`,
        };
      }
    }

    return { isDuplicate: false };
  }

  // Cria material e inicializa saldos e movimentação atômica
  async createMaterialComSaldo(
    materialData: Omit<MaterialDoc, 'id' | 'sku' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'> & { sku?: string },
    quantidadeInicial: number = 0,
    currentUserId?: string,
    currentUserName?: string
  ): Promise<{ id: string; sku: string }> {
    const sku = materialData.sku && materialData.sku.trim()
      ? materialData.sku.trim().toUpperCase()
      : await this.gerarProximoSku();

    const nowIso = new Date().toISOString();
    const cleanMatData: any = sanitizeFirestoreData({
      ...materialData,
      sku,
      status: materialData.status || 'ativo',
      isDeleted: false,
      deletedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: currentUserId || 'sistema',
      updatedBy: currentUserId || 'sistema',
    });

    const matColRef = collection(db, this.collectionName);
    const matDocRef = await addDoc(matColRef, cleanMatData);
    const materialId = matDocRef.id;

    // Inicializa saldo operacional em estoque_saldos
    const initialQty = Math.max(0, Number(quantidadeInicial) || 0);
    const saldoDocRef = doc(db, 'estoque_saldos', materialId);
    const saldoData: any = sanitizeFirestoreData({
      materialId,
      estoqueFisico: initialQty,
      disponivel: initialQty,
      reservado: 0,
      emSeparacao: 0,
      liberado: 0,
      avariado: 0,
      bloqueado: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      isDeleted: false,
    });
    await setDoc(saldoDocRef, saldoData, { merge: true });

    // Registra movimentação de saldo inicial se quantidadeInicial > 0
    if (initialQty > 0) {
      const movColRef = collection(db, 'estoque_movimentacoes');
      const movData: any = sanitizeFirestoreData({
        materialId,
        materialNome: cleanMatData.nome,
        materialSku: sku,
        tipo: 'entrada',
        subtipo: 'saldo_inicial',
        quantidade: initialQty,
        saldoAnterior: 0,
        saldoPosterior: initialQty,
        custoUnitario: cleanMatData.custoUnitario || 0,
        valorTotal: initialQty * (cleanMatData.custoUnitario || 0),
        motivo: 'Lançamento de Saldo Inicial no Cadastro',
        lote: cleanMatData.lote || '',
        localizacaoDestino: cleanMatData.localizacao || '',
        usuarioId: currentUserId || 'sistema',
        usuarioNome: currentUserName || 'Gestor de Estoque',
        createdAt: nowIso,
        updatedAt: nowIso,
        isDeleted: false,
      });
      await addDoc(movColRef, movData);
    }

    this.logAudit({
      acao: 'CREATE',
      colecao: 'materiais',
      documentoId: materialId,
      usuarioId: currentUserId || 'sistema',
      usuarioNome: currentUserName || 'Usuário Ativo',
      usuarioEmail: 'sistema@fleetmoto.com.br',
      usuarioRole: 'administrador',
      detalhes: `Material ${sku} (${cleanMatData.nome}) cadastrado com saldo inicial de ${initialQty} ${cleanMatData.unidadeMedida}`,
      dadosNovos: cleanMatData,
      timestamp: nowIso,
    }).catch(console.error);

    return { id: materialId, sku };
  }
}

export class EstoqueSaldosRepository extends BaseRepository<EstoqueSaldoDoc> {
  constructor() {
    super('estoque_saldos');
  }

  async getByMaterialId(materialId: string): Promise<EstoqueSaldoDoc | null> {
    try {
      const snap = await getDoc(doc(db, this.collectionName, materialId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as EstoqueSaldoDoc;
      }
      return null;
    } catch {
      return null;
    }
  }

  async ensureSaldo(materialId: string, currentUserId?: string): Promise<EstoqueSaldoDoc> {
    const existing = await this.getByMaterialId(materialId);
    if (existing) return existing;

    const nowIso = new Date().toISOString();
    const defaultSaldo: any = sanitizeFirestoreData({
      materialId,
      estoqueFisico: 0,
      disponivel: 0,
      reservado: 0,
      emSeparacao: 0,
      liberado: 0,
      avariado: 0,
      bloqueado: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      isDeleted: false,
    });

    await setDoc(doc(db, this.collectionName, materialId), defaultSaldo, { merge: true });
    return { id: materialId, ...defaultSaldo };
  }
}

export class EstoqueMovimentacoesRepository extends BaseRepository<EstoqueMovimentacaoDoc> {
  constructor() {
    super('estoque_movimentacoes');
  }

  // 1. REGISTRAR ENTRADA MANUAL
  async registrarEntrada(params: {
    materialId: string;
    quantidade: number;
    subtipo: string;
    motivo: string;
    custoUnitario?: number;
    lote?: string;
    fornecedor?: string;
    numeroNotaFiscal?: string;
    numeroPedidoCompra?: string;
    localizacaoDestino?: string;
    responsavel?: string;
    fotoUrl?: string;
    observacoes?: string;
    usuarioId: string;
    usuarioNome: string;
    usuarioEmail?: string;
  }): Promise<string> {
    const qty = Number(params.quantidade);
    if (isNaN(qty) || qty <= 0) {
      throw new Error('A quantidade de entrada deve ser maior que zero.');
    }

    const nowIso = new Date().toISOString();

    return await runTransaction(db, async (transaction) => {
      const matDocRef = doc(db, 'materiais', params.materialId);
      const saldoDocRef = doc(db, 'estoque_saldos', params.materialId);

      const matSnap = await transaction.get(matDocRef);
      if (!matSnap.exists()) {
        throw new Error('Material não encontrado no cadastro de estoque.');
      }
      const matData = matSnap.data() as MaterialDoc;

      const saldoSnap = await transaction.get(saldoDocRef);
      let currentFisico = 0;
      let currentDisponivel = 0;
      let currentReservado = 0;
      let currentEmSeparacao = 0;
      let currentLiberado = 0;
      let currentAvariado = 0;
      let currentBloqueado = 0;

      if (saldoSnap.exists()) {
        const s = saldoSnap.data() as EstoqueSaldoDoc;
        currentFisico = s.estoqueFisico || 0;
        currentDisponivel = s.disponivel || 0;
        currentReservado = s.reservado || 0;
        currentEmSeparacao = s.emSeparacao || 0;
        currentLiberado = s.liberado || 0;
        currentAvariado = s.avariado || 0;
        currentBloqueado = s.bloqueado || 0;
      }

      const saldoAnterior = currentFisico;
      const novoFisico = currentFisico + qty;
      const novoDisponivel = novoFisico - currentReservado - currentEmSeparacao - currentBloqueado - currentAvariado;

      // Atualiza saldo operacional
      transaction.set(
        saldoDocRef,
        sanitizeFirestoreData({
          materialId: params.materialId,
          estoqueFisico: novoFisico,
          disponivel: Math.max(0, novoDisponivel),
          reservado: currentReservado,
          emSeparacao: currentEmSeparacao,
          liberado: currentLiberado,
          avariado: currentAvariado,
          bloqueado: currentBloqueado,
          updatedAt: nowIso,
          isDeleted: false,
        }),
        { merge: true }
      );

      // Atualiza custo unitário ou lote do material se informado
      const matUpdates: any = { updatedAt: nowIso };
      if (params.custoUnitario !== undefined && params.custoUnitario > 0) {
        matUpdates.custoUnitario = params.custoUnitario;
      }
      if (params.lote) matUpdates.lote = params.lote;
      if (params.localizacaoDestino) matUpdates.localizacao = params.localizacaoDestino;
      if (params.fornecedor) matUpdates.fornecedor = params.fornecedor;
      transaction.update(matDocRef, sanitizeFirestoreData(matUpdates));

      // Cria a movimentação de entrada
      const movColRef = collection(db, 'estoque_movimentacoes');
      const movDocRef = doc(movColRef);
      const unitCost = params.custoUnitario !== undefined ? params.custoUnitario : (matData.custoUnitario || 0);

      const cleanMov: any = sanitizeFirestoreData({
        materialId: params.materialId,
        materialNome: matData.nome,
        materialSku: matData.sku,
        tipo: 'entrada',
        subtipo: params.subtipo || 'compra',
        quantidade: qty,
        saldoAnterior,
        saldoPosterior: novoFisico,
        custoUnitario: unitCost,
        valorTotal: qty * unitCost,
        motivo: params.motivo || 'Entrada manual de material',
        lote: params.lote || matData.lote || '',
        fornecedor: params.fornecedor || matData.fornecedor || '',
        numeroNotaFiscal: params.numeroNotaFiscal || '',
        numeroPedidoCompra: params.numeroPedidoCompra || '',
        localizacaoDestino: params.localizacaoDestino || matData.localizacao || '',
        responsavel: params.responsavel || params.usuarioNome,
        fotoUrl: params.fotoUrl || '',
        observacoes: params.observacoes || '',
        usuarioId: params.usuarioId,
        usuarioNome: params.usuarioNome,
        usuarioEmail: params.usuarioEmail || '',
        createdAt: nowIso,
        updatedAt: nowIso,
        isDeleted: false,
      });

      transaction.set(movDocRef, cleanMov);
      return movDocRef.id;
    });
  }

  // 2. REGISTRAR SAÍDA MANUAL
  async registrarSaidaManual(params: {
    materialId: string;
    quantidade: number;
    subtipo: string;
    motivo: string;
    pedidoId?: string;
    clienteNome?: string;
    destino?: string;
    responsavelRetirada?: string;
    autorizadoPorId?: string;
    autorizadoPorNome?: string;
    fotoUrl?: string;
    observacoes?: string;
    usuarioId: string;
    usuarioNome: string;
    usuarioEmail?: string;
  }): Promise<string> {
    const qty = Number(params.quantidade);
    if (isNaN(qty) || qty <= 0) {
      throw new Error('A quantidade de saída deve ser maior que zero.');
    }

    const nowIso = new Date().toISOString();

    return await runTransaction(db, async (transaction) => {
      const matDocRef = doc(db, 'materiais', params.materialId);
      const saldoDocRef = doc(db, 'estoque_saldos', params.materialId);

      const matSnap = await transaction.get(matDocRef);
      if (!matSnap.exists()) {
        throw new Error('Material não encontrado no estoque.');
      }
      const matData = matSnap.data() as MaterialDoc;

      const saldoSnap = await transaction.get(saldoDocRef);
      if (!saldoSnap.exists()) {
        throw new Error('Registro de saldo do material não encontrado.');
      }
      const s = saldoSnap.data() as EstoqueSaldoDoc;

      const currentFisico = s.estoqueFisico || 0;
      const currentDisponivel = s.disponivel || 0;

      if (currentDisponivel < qty) {
        throw new Error(
          `Saldo disponível insuficiente! Disponível: ${currentDisponivel} ${matData.unidadeMedida}, Solicitado: ${qty} ${matData.unidadeMedida}.`
        );
      }

      const saldoAnterior = currentFisico;
      const novoFisico = currentFisico - qty;
      const novoDisponivel = currentDisponivel - qty;

      if (novoFisico < 0 || novoDisponivel < 0) {
        throw new Error('Operação cancelada: estoque negativo não é permitido.');
      }

      transaction.update(
        saldoDocRef,
        sanitizeFirestoreData({
          estoqueFisico: novoFisico,
          disponivel: novoDisponivel,
          updatedAt: nowIso,
        })
      );

      const movColRef = collection(db, 'estoque_movimentacoes');
      const movDocRef = doc(movColRef);
      const unitCost = matData.custoUnitario || 0;

      const cleanMov: any = sanitizeFirestoreData({
        materialId: params.materialId,
        materialNome: matData.nome,
        materialSku: matData.sku,
        tipo: 'saida',
        subtipo: params.subtipo || 'uso_interno',
        quantidade: qty,
        saldoAnterior,
        saldoPosterior: novoFisico,
        custoUnitario: unitCost,
        valorTotal: qty * unitCost,
        pedidoId: params.pedidoId || null,
        localizacaoOrigem: matData.localizacao || '',
        localizacaoDestino: params.destino || '',
        responsavel: params.responsavelRetirada || params.usuarioNome,
        autorizadoPorId: params.autorizadoPorId || params.usuarioId,
        autorizadoPorNome: params.autorizadoPorNome || params.usuarioNome,
        motivo: params.motivo || 'Saída manual de estoque',
        fotoUrl: params.fotoUrl || '',
        observacoes: params.observacoes || '',
        usuarioId: params.usuarioId,
        usuarioNome: params.usuarioNome,
        usuarioEmail: params.usuarioEmail || '',
        createdAt: nowIso,
        updatedAt: nowIso,
        isDeleted: false,
      });

      transaction.set(movDocRef, cleanMov);
      return movDocRef.id;
    });
  }

  // 3. REGISTRAR ESTORNO DE MOVIMENTAÇÃO (Não apaga a anterior, cria uma inversa vinculada)
  async registrarEstorno(params: {
    movimentacaoId: string;
    motivo: string;
    usuarioId: string;
    usuarioNome: string;
    autorizadoPorId: string;
    autorizadoPorNome: string;
    observacoes?: string;
  }): Promise<string> {
    const nowIso = new Date().toISOString();

    return await runTransaction(db, async (transaction) => {
      const origMovRef = doc(db, 'estoque_movimentacoes', params.movimentacaoId);
      const origSnap = await transaction.get(origMovRef);

      if (!origSnap.exists()) {
        throw new Error('Movimentação original não encontrada para estorno.');
      }
      const orig = origSnap.data() as EstoqueMovimentacaoDoc;

      if (orig.isEstorno) {
        throw new Error('Não é permitido estornar uma movimentação que já é um estorno.');
      }

      const saldoDocRef = doc(db, 'estoque_saldos', orig.materialId);
      const saldoSnap = await transaction.get(saldoDocRef);
      if (!saldoSnap.exists()) {
        throw new Error('Saldo do material não encontrado.');
      }
      const s = saldoSnap.data() as EstoqueSaldoDoc;

      let novoFisico = s.estoqueFisico || 0;
      let novoDisponivel = s.disponivel || 0;
      let novoAvariado = s.avariado || 0;
      let novoBloqueado = s.bloqueado || 0;

      const saldoAnterior = novoFisico;

      if (orig.tipo === 'entrada') {
        // Estorno de entrada = subtrai do estoque
        if (novoDisponivel < orig.quantidade) {
          throw new Error(
            `Impossível estornar entrada: o estoque disponível (${novoDisponivel}) é menor que a quantidade da entrada (${orig.quantidade}). Parte do material já foi reservada ou consumida.`
          );
        }
        novoFisico -= orig.quantidade;
        novoDisponivel -= orig.quantidade;
      } else if (orig.tipo === 'saida') {
        // Estorno de saída = devolve ao estoque físico e disponível
        novoFisico += orig.quantidade;
        novoDisponivel += orig.quantidade;
      } else if (orig.tipo === 'avaria') {
        // Estorno de avaria = devolve de avariado para disponível
        novoAvariado = Math.max(0, novoAvariado - orig.quantidade);
        novoDisponivel += orig.quantidade;
      } else {
        // Outros tipos genéricos
        novoFisico += orig.quantidade;
        novoDisponivel += orig.quantidade;
      }

      if (novoFisico < 0 || novoDisponivel < 0) {
        throw new Error('Estorno rejeitado: resultaria em estoque negativo.');
      }

      transaction.update(
        saldoDocRef,
        sanitizeFirestoreData({
          estoqueFisico: novoFisico,
          disponivel: novoDisponivel,
          avariado: novoAvariado,
          bloqueado: novoBloqueado,
          updatedAt: nowIso,
        })
      );

      // Cria a nova movimentação inversa de estorno
      const newMovRef = doc(collection(db, 'estoque_movimentacoes'));
      const estornoDoc: any = sanitizeFirestoreData({
        materialId: orig.materialId,
        materialNome: orig.materialNome,
        materialSku: orig.materialSku,
        tipo: 'estorno',
        subtipo: 'estorno_movimentacao',
        quantidade: orig.quantidade,
        saldoAnterior,
        saldoPosterior: novoFisico,
        custoUnitario: orig.custoUnitario || 0,
        valorTotal: orig.valorTotal || 0,
        motivo: `[ESTORNO AUTORIZADO] ${params.motivo} (Ref. Movimentação ${params.movimentacaoId.slice(0, 8)})`,
        movimentacaoEstornadaId: params.movimentacaoId,
        isEstorno: true,
        autorizadoPorId: params.autorizadoPorId,
        autorizadoPorNome: params.autorizadoPorNome,
        usuarioId: params.usuarioId,
        usuarioNome: params.usuarioNome,
        observacoes: params.observacoes || '',
        createdAt: nowIso,
        updatedAt: nowIso,
        isDeleted: false,
      });

      transaction.set(newMovRef, estornoDoc);
      return newMovRef.id;
    });
  }

  // 4. REGISTRAR AVARIA / PERDA INTERNA
  async registrarAvaria(params: {
    materialId: string;
    quantidade: number;
    motivo: string;
    lote?: string;
    fotoUrl?: string;
    usuarioId: string;
    usuarioNome: string;
    autorizadoPorId?: string;
    autorizadoPorNome?: string;
  }): Promise<string> {
    const qty = Number(params.quantidade);
    if (isNaN(qty) || qty <= 0) throw new Error('Quantidade inválida.');

    const nowIso = new Date().toISOString();

    return await runTransaction(db, async (transaction) => {
      const matSnap = await transaction.get(doc(db, 'materiais', params.materialId));
      if (!matSnap.exists()) throw new Error('Material não encontrado.');
      const mat = matSnap.data() as MaterialDoc;

      const saldoRef = doc(db, 'estoque_saldos', params.materialId);
      const saldoSnap = await transaction.get(saldoRef);
      if (!saldoSnap.exists()) throw new Error('Saldo não encontrado.');
      const s = saldoSnap.data() as EstoqueSaldoDoc;

      if ((s.disponivel || 0) < qty) {
        throw new Error(`Estoque disponível insuficiente para registro de avaria (${s.disponivel || 0} disponíveis).`);
      }

      const novoDisponivel = (s.disponivel || 0) - qty;
      const novoAvariado = (s.avariado || 0) + qty;

      transaction.update(
        saldoRef,
        sanitizeFirestoreData({
          disponivel: novoDisponivel,
          avariado: novoAvariado,
          updatedAt: nowIso,
        })
      );

      const movRef = doc(collection(db, 'estoque_movimentacoes'));
      const movData: any = sanitizeFirestoreData({
        materialId: params.materialId,
        materialNome: mat.nome,
        materialSku: mat.sku,
        tipo: 'avaria',
        subtipo: 'avaria_saida',
        quantidade: qty,
        saldoAnterior: s.estoqueFisico || 0,
        saldoPosterior: s.estoqueFisico || 0,
        motivo: `Material Avariado/Danificado: ${params.motivo}`,
        lote: params.lote || mat.lote || '',
        fotoUrl: params.fotoUrl || '',
        usuarioId: params.usuarioId,
        usuarioNome: params.usuarioNome,
        autorizadoPorId: params.autorizadoPorId || params.usuarioId,
        autorizadoPorNome: params.autorizadoPorNome || params.usuarioNome,
        createdAt: nowIso,
        updatedAt: nowIso,
        isDeleted: false,
      });

      transaction.set(movRef, movData);
      return movRef.id;
    });
  }

  // 5. REINTEGRAR AVARIA AO DISPONÍVEL (Recuperação ou reavaliação)
  async reintegrarAvaria(params: {
    materialId: string;
    quantidade: number;
    motivo: string;
    usuarioId: string;
    usuarioNome: string;
  }): Promise<void> {
    const qty = Number(params.quantidade);
    if (isNaN(qty) || qty <= 0) throw new Error('Quantidade inválida.');

    const nowIso = new Date().toISOString();

    await runTransaction(db, async (transaction) => {
      const saldoRef = doc(db, 'estoque_saldos', params.materialId);
      const saldoSnap = await transaction.get(saldoRef);
      if (!saldoSnap.exists()) throw new Error('Saldo não encontrado.');
      const s = saldoSnap.data() as EstoqueSaldoDoc;

      if ((s.avariado || 0) < qty) {
        throw new Error(`Quantidade avariada insuficiente para reintegração (${s.avariado || 0} avariados).`);
      }

      const novoAvariado = (s.avariado || 0) - qty;
      const novoDisponivel = (s.disponivel || 0) + qty;

      transaction.update(
        saldoRef,
        sanitizeFirestoreData({
          avariado: novoAvariado,
          disponivel: novoDisponivel,
          updatedAt: nowIso,
        })
      );

      const movRef = doc(collection(db, 'estoque_movimentacoes'));
      const movData: any = sanitizeFirestoreData({
        materialId: params.materialId,
        tipo: 'transferencia',
        subtipo: 'reintegracao_avaria',
        quantidade: qty,
        saldoAnterior: s.estoqueFisico || 0,
        saldoPosterior: s.estoqueFisico || 0,
        motivo: `Reintegração de Avaria ao Estoque Disponível: ${params.motivo}`,
        usuarioId: params.usuarioId,
        usuarioNome: params.usuarioNome,
        createdAt: nowIso,
        updatedAt: nowIso,
        isDeleted: false,
      });

      transaction.set(movRef, movData);
    });
  }

  // Alias para registrarSaidaManual
  async registrarSaida(params: any): Promise<string> {
    return this.registrarSaidaManual(params);
  }

  // Busca movimentações recentes ordenadas por data
  async getRecent(maxLimit: number = 100): Promise<EstoqueMovimentacaoDoc[]> {
    try {
      const all = await this.getAll();
      return all.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, maxLimit);
    } catch {
      return [];
    }
  }

  // Busca histórico de movimentações por ID de material
  async getByMaterialId(materialId: string): Promise<EstoqueMovimentacaoDoc[]> {
    try {
      const all = await this.getAll();
      return all
        .filter((m) => m.materialId === materialId)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch {
      return [];
    }
  }

  // Alias para registrarEstorno
  async estornarMovimentacao(
    movimentacaoId: string,
    motivo: string,
    usuarioId: string,
    usuarioNome: string
  ): Promise<string> {
    return this.registrarEstorno({
      movimentacaoId,
      motivo,
      usuarioId,
      usuarioNome,
      autorizadoPorId: usuarioId,
      autorizadoPorNome: usuarioNome,
    });
  }
}

export class EstoqueReservasRepository extends BaseRepository<EstoqueReservaDoc> {
  constructor() {
    super('estoque_reservas');
  }

  async getByMaterialId(materialId: string): Promise<EstoqueReservaDoc[]> {
    try {
      const all = await this.getAll();
      return all
        .filter((r) => r.materialId === materialId)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch {
      return [];
    }
  }

  // 1. RESERVA AUTOMÁTICA AO CONFIRMAR/CRIAR PEDIDO
  async reservarParaPedido(
    pedidoId: string,
    numeroPedido: string,
    itens: { materialId?: string; nomeMaterial: string; tipoMaterial: string; quantidade: number }[],
    usuarioId: string = 'sistema',
    usuarioNome: string = 'Sistema'
  ): Promise<{ sucesso: boolean; reservas: { materialNome: string; solicitado: number; reservado: number; status: string }[] }> {
    const nowIso = new Date().toISOString();
    const resultados: { materialNome: string; solicitado: number; reservado: number; status: string }[] = [];

    await runTransaction(db, async (transaction) => {
      // Busca todos os materiais cadastrados para mapear por ID ou nome
      const matColRef = collection(db, 'materiais');
      const matSnaps = await getDocs(query(matColRef, where('isDeleted', '!=', true)));
      const materiaisCadastrados = matSnaps.docs.map((d) => ({ id: d.id, ...(d.data() as MaterialDoc) }));

      // Phase 1: All Reads
      const itemsToReserve: {
        item: any;
        qtySolicitada: number;
        mat?: MaterialDoc;
        saldoDocRef?: any;
        saldoSnap?: any;
      }[] = [];

      for (const item of itens) {
        const qtySolicitada = Number(item.quantidade) || 0;
        if (qtySolicitada <= 0) continue;

        // Tenta encontrar material correspondente
        let mat = materiaisCadastrados.find((m) => item.materialId && m.id === item.materialId);
        if (!mat) {
          mat = materiaisCadastrados.find(
            (m) =>
              (item.nomeMaterial && m.nome.trim().toLowerCase() === item.nomeMaterial.trim().toLowerCase()) ||
              (item.tipoMaterial && m.tipoMaterial.trim().toLowerCase() === item.tipoMaterial.trim().toLowerCase())
          );
        }

        if (!mat) {
          itemsToReserve.push({ item, qtySolicitada });
          continue;
        }

        const saldoDocRef = doc(db, 'estoque_saldos', mat.id);
        const saldoSnap = await transaction.get(saldoDocRef);
        itemsToReserve.push({ item, qtySolicitada, mat, saldoDocRef, saldoSnap });
      }

      // Phase 2: All Writes
      for (const { item, qtySolicitada, mat, saldoDocRef, saldoSnap } of itemsToReserve) {
        if (!mat || !saldoDocRef || !saldoSnap) {
          resultados.push({
            materialNome: item.nomeMaterial || item.tipoMaterial,
            solicitado: qtySolicitada,
            reservado: 0,
            status: 'sem_estoque',
          });
          continue;
        }

        let currentDisponivel = 0;
        let currentReservado = 0;
        let currentFisico = 0;

        if (saldoSnap.exists()) {
          const s = saldoSnap.data() as EstoqueSaldoDoc;
          currentDisponivel = s.disponivel || 0;
          currentReservado = s.reservado || 0;
          currentFisico = s.estoqueFisico || 0;
        }

        const qtdReservar = Math.min(Math.max(0, currentDisponivel), qtySolicitada);
        const statusReserva =
          qtdReservar === qtySolicitada
            ? 'reservado'
            : qtdReservar > 0
            ? 'reserva_parcial'
            : 'sem_estoque';

        if (qtdReservar > 0) {
          const novoDisponivel = Math.max(0, currentDisponivel - qtdReservar);
          const novoReservado = currentReservado + qtdReservar;

          transaction.set(
            saldoDocRef,
            sanitizeFirestoreData({
              materialId: mat.id,
              estoqueFisico: currentFisico,
              disponivel: novoDisponivel,
              reservado: novoReservado,
              updatedAt: nowIso,
            }),
            { merge: true }
          );
        }

        // Cria registro de reserva
        const resDocRef = doc(collection(db, 'estoque_reservas'));
        transaction.set(
          resDocRef,
          sanitizeFirestoreData({
            pedidoId,
            numeroPedido,
            materialId: mat.id,
            materialNome: mat.nome,
            materialSku: mat.sku,
            quantidadeSolicitada: qtySolicitada,
            quantidadeReservada: qtdReservar,
            status: statusReserva,
            createdAt: nowIso,
            updatedAt: nowIso,
            isDeleted: false,
          })
        );

        resultados.push({
          materialNome: mat.nome,
          solicitado: qtySolicitada,
          reservado: qtdReservar,
          status: statusReserva,
        });
      }
    });

    return { sucesso: true, reservas: resultados };
  }

  // 2. TRANSIÇÃO AO INICIAR SEPARAÇÃO (Reservado -> Em Separação)
  async iniciarSeparacaoExpedicao(pedidoId: string, usuarioId: string = 'sistema', usuarioNome: string = 'Expedição'): Promise<void> {
    const nowIso = new Date().toISOString();

    await runTransaction(db, async (transaction) => {
      const q = query(collection(db, 'estoque_reservas'), where('pedidoId', '==', pedidoId), where('isDeleted', '!=', true));
      const resSnaps = await getDocs(q);

      // Phase 1: All Reads
      const validReservas: { rDoc: any; res: EstoqueReservaDoc; saldoRef: any; saldoSnap: any }[] = [];
      for (const rDoc of resSnaps.docs) {
        const res = rDoc.data() as EstoqueReservaDoc;
        if (res.quantidadeReservada > 0 && (res.status === 'reservado' || res.status === 'reserva_parcial' || res.status === 'pendente')) {
          const saldoRef = doc(db, 'estoque_saldos', res.materialId);
          const saldoSnap = await transaction.get(saldoRef);
          validReservas.push({ rDoc, res, saldoRef, saldoSnap });
        }
      }

      // Phase 2: All Writes
      for (const { rDoc, res, saldoRef, saldoSnap } of validReservas) {
        if (saldoSnap.exists()) {
          const s = saldoSnap.data() as EstoqueSaldoDoc;
          const transferQtd = Math.min(s.reservado || 0, res.quantidadeReservada);

          if (transferQtd > 0) {
            transaction.update(
              saldoRef,
              sanitizeFirestoreData({
                reservado: Math.max(0, (s.reservado || 0) - transferQtd),
                emSeparacao: (s.emSeparacao || 0) + transferQtd,
                updatedAt: nowIso,
              })
            );
          }
        }

        transaction.update(
          rDoc.ref,
          sanitizeFirestoreData({
            status: 'liberado_separacao',
            updatedAt: nowIso,
          })
        );
      }
    });
  }

  // 3. BAIXA DEFINITIVA NA LIBERAÇÃO DA ENTREGA (Baixa física e zera separação/reserva)
  async liberarSaidaEntrega(
    pedidoId: string,
    expedicaoId: string,
    entregaId: string,
    rotaId: string,
    itensLiberados: { materialId?: string; nomeMaterial: string; tipoMaterial: string; quantidade: number }[],
    usuarioId: string = 'sistema',
    usuarioNome: string = 'Expedição'
  ): Promise<void> {
    const nowIso = new Date().toISOString();

    await runTransaction(db, async (transaction) => {
      // Busca materiais cadastrados
      const matColRef = collection(db, 'materiais');
      const matSnaps = await getDocs(query(matColRef, where('isDeleted', '!=', true)));
      const materiaisCadastrados = matSnaps.docs.map((d) => ({ id: d.id, ...(d.data() as MaterialDoc) }));

      // Phase 1: All Reads
      const itemsToProcess: {
        qty: number;
        mat: MaterialDoc;
        saldoRef: any;
        saldoSnap: any;
      }[] = [];

      for (const item of itensLiberados) {
        const qty = Number(item.quantidade) || 0;
        if (qty <= 0) continue;

        let mat = materiaisCadastrados.find((m) => item.materialId && m.id === item.materialId);
        if (!mat) {
          mat = materiaisCadastrados.find(
            (m) =>
              (item.nomeMaterial && m.nome.trim().toLowerCase() === item.nomeMaterial.trim().toLowerCase()) ||
              (item.tipoMaterial && m.tipoMaterial.trim().toLowerCase() === item.tipoMaterial.trim().toLowerCase())
          );
        }

        if (mat) {
          const saldoRef = doc(db, 'estoque_saldos', mat.id);
          const saldoSnap = await transaction.get(saldoRef);
          itemsToProcess.push({ qty, mat, saldoRef, saldoSnap });
        }
      }

      // Phase 2: All Writes
      for (const { qty, mat, saldoRef, saldoSnap } of itemsToProcess) {
        if (saldoSnap.exists()) {
          const s = saldoSnap.data() as EstoqueSaldoDoc;
          const currentFisico = s.estoqueFisico || 0;
          const currentEmSep = s.emSeparacao || 0;
          const currentReserv = s.reservado || 0;

          const novoFisico = Math.max(0, currentFisico - qty);
          const novoEmSep = Math.max(0, currentEmSep - qty);
          const novoReserv = Math.max(0, currentReserv - Math.max(0, qty - currentEmSep));

          transaction.update(
            saldoRef,
            sanitizeFirestoreData({
              estoqueFisico: novoFisico,
              emSeparacao: novoEmSep,
              reservado: novoReserv,
              updatedAt: nowIso,
            })
          );

          // Cria movimentação de saída para entrega
          const movRef = doc(collection(db, 'estoque_movimentacoes'));
          transaction.set(
            movRef,
            sanitizeFirestoreData({
              materialId: mat.id,
              materialNome: mat.nome,
              materialSku: mat.sku,
              tipo: 'saida',
              subtipo: 'saida_entrega',
              quantidade: qty,
              saldoAnterior: currentFisico,
              saldoPosterior: novoFisico,
              custoUnitario: mat.custoUnitario || 0,
              valorTotal: qty * (mat.custoUnitario || 0),
              pedidoId,
              expedicaoId,
              entregaId,
              rotaId,
              motivo: `Despacho e Liberação para Entrega (Pedido #${pedidoId.slice(0, 8)})`,
              responsavel: usuarioNome,
              usuarioId,
              usuarioNome,
              createdAt: nowIso,
              updatedAt: nowIso,
              isDeleted: false,
            })
          );
        }
      }

      // Atualiza reservas para status 'consumido'
      const q = query(collection(db, 'estoque_reservas'), where('pedidoId', '==', pedidoId), where('isDeleted', '!=', true));
      const resSnaps = await getDocs(q);
      for (const rDoc of resSnaps.docs) {
        transaction.update(
          rDoc.ref,
          sanitizeFirestoreData({
            status: 'consumido',
            updatedAt: nowIso,
          })
        );
      }
    });
  }

  // 4. CANCELAMENTO DE PEDIDO (Devolve quantidades reservadas ao estoque disponível)
  async cancelarReservaPedido(pedidoId: string, usuarioId: string = 'sistema', usuarioNome: string = 'Sistema'): Promise<void> {
    const nowIso = new Date().toISOString();

    await runTransaction(db, async (transaction) => {
      const q = query(collection(db, 'estoque_reservas'), where('pedidoId', '==', pedidoId), where('isDeleted', '!=', true));
      const resSnaps = await getDocs(q);

      // Phase 1: All Reads
      const reservasToCancel: { rDoc: any; res: EstoqueReservaDoc; saldoRef: any; saldoSnap: any }[] = [];
      for (const rDoc of resSnaps.docs) {
        const res = rDoc.data() as EstoqueReservaDoc;

        if (
          res.quantidadeReservada > 0 &&
          (res.status === 'reservado' || res.status === 'reserva_parcial' || res.status === 'liberado_separacao' || res.status === 'pendente')
        ) {
          const saldoRef = doc(db, 'estoque_saldos', res.materialId);
          const saldoSnap = await transaction.get(saldoRef);
          reservasToCancel.push({ rDoc, res, saldoRef, saldoSnap });
        }
      }

      // Phase 2: All Writes
      for (const { rDoc, res, saldoRef, saldoSnap } of reservasToCancel) {
        if (saldoSnap.exists()) {
          const s = saldoSnap.data() as EstoqueSaldoDoc;
          const currentDisponivel = s.disponivel || 0;
          const currentReservado = s.reservado || 0;
          const currentEmSep = s.emSeparacao || 0;

          const devSep = Math.min(currentEmSep, res.quantidadeReservada);
          const devRes = Math.min(currentReservado, res.quantidadeReservada - devSep);

          const novoDisponivel = currentDisponivel + res.quantidadeReservada;
          const novoReservado = Math.max(0, currentReservado - devRes);
          const novoEmSep = Math.max(0, currentEmSep - devSep);

          transaction.update(
            saldoRef,
            sanitizeFirestoreData({
              disponivel: novoDisponivel,
              reservado: novoReservado,
              emSeparacao: novoEmSep,
              updatedAt: nowIso,
            })
          );
        }

        transaction.update(
          rDoc.ref,
          sanitizeFirestoreData({
            status: 'cancelado',
            updatedAt: nowIso,
          })
        );
      }
    });
  }
}

export class InventariosRepository extends BaseRepository<InventarioDoc> {
  constructor() {
    super('inventarios');
  }

  // Gera código sequencial para o inventário (ex: INV-2026-001)
  async gerarProximoCodigo(): Promise<string> {
    try {
      const all = await this.getAll();
      let maxNum = 0;
      all.forEach((inv) => {
        if (inv.codigo) {
          const match = inv.codigo.match(/INV-2026-(\d+)/i);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        }
      });
      return `INV-2026-${String(maxNum + 1).padStart(3, '0')}`;
    } catch {
      return `INV-2026-${String(Date.now()).slice(-3)}`;
    }
  }

  // Abertura de Novo Inventário (Snapshot do saldo do sistema)
  async abrirInventario(params: {
    titulo: string;
    tipo: 'geral' | 'categoria' | 'localizacao' | 'amostragem';
    categoriaFiltro?: string;
    localizacaoFiltro?: string;
    bloquearMovimentacoes?: boolean;
    usuarioId: string;
    usuarioNome: string;
    observacoes?: string;
  }): Promise<string> {
    const codigo = await this.gerarProximoCodigo();
    const nowIso = new Date().toISOString();

    // Carrega materiais e saldos para gerar itens de contagem
    const matSnaps = await getDocs(query(collection(db, 'materiais'), where('isDeleted', '!=', true)));
    let materiais = matSnaps.docs.map((d) => ({ id: d.id, ...(d.data() as MaterialDoc) }));

    if (params.categoriaFiltro && params.categoriaFiltro !== 'todas') {
      materiais = materiais.filter((m) => m.categoria === params.categoriaFiltro);
    }
    if (params.localizacaoFiltro && params.localizacaoFiltro.trim()) {
      materiais = materiais.filter((m) => (m.localizacao || '').toLowerCase().includes(params.localizacaoFiltro!.toLowerCase()));
    }

    const saldoSnaps = await getDocs(query(collection(db, 'estoque_saldos'), where('isDeleted', '!=', true)));
    const saldosMap = new Map<string, EstoqueSaldoDoc>();
    saldoSnaps.docs.forEach((d) => saldosMap.set(d.id, d.data() as EstoqueSaldoDoc));

    const itens: ItemInventario[] = materiais.map((m) => {
      const saldo = saldosMap.get(m.id);
      const saldoSis = saldo ? saldo.estoqueFisico || 0 : 0;
      return {
        materialId: m.id,
        materialSku: m.sku,
        materialNome: m.nome,
        categoria: m.categoria || 'Geral',
        localizacao: m.localizacao || 'Armazém Central',
        lote: m.lote || '',
        saldoSistema: saldoSis,
        saldoContado: undefined,
        diferenca: 0,
        custoUnitario: m.custoUnitario || 0,
        justificativa: '',
        conferido: false,
      };
    });

    const cleanData: any = sanitizeFirestoreData({
      codigo,
      titulo: params.titulo,
      tipo: params.tipo,
      categoriaFiltro: params.categoriaFiltro || '',
      localizacaoFiltro: params.localizacaoFiltro || '',
      status: 'em_contagem',
      bloquearMovimentacoes: !!params.bloquearMovimentacoes,
      itens,
      totalItens: itens.length,
      itensDivergentes: 0,
      responsavelContagemId: params.usuarioId,
      responsavelContagemNome: params.usuarioNome,
      dataAbertura: nowIso,
      observacoes: params.observacoes || '',
      createdAt: nowIso,
      updatedAt: nowIso,
      isDeleted: false,
    });

    const docRef = await addDoc(collection(db, this.collectionName), cleanData);
    return docRef.id;
  }

  // Salva a contagem física digitada pelo operador
  async salvarContagem(
    inventarioId: string,
    itensContados: ItemInventario[],
    usuarioId: string,
    usuarioNome: string,
    enviarParaAprovacao: boolean = false
  ): Promise<void> {
    const nowIso = new Date().toISOString();

    let divergentes = 0;
    const processados = itensContados.map((it) => {
      const contado = it.saldoContado !== undefined && it.saldoContado !== null ? Number(it.saldoContado) : it.saldoSistema;
      const dif = contado - it.saldoSistema;
      if (dif !== 0) divergentes++;
      return {
        ...it,
        saldoContado: contado,
        diferenca: dif,
        conferido: true,
      };
    });

    await updateDoc(
      doc(db, this.collectionName, inventarioId),
      sanitizeFirestoreData({
        itens: processados,
        itensDivergentes: divergentes,
        status: enviarParaAprovacao ? 'aguardando_aprovacao' : 'em_contagem',
        updatedAt: nowIso,
        updatedBy: usuarioId,
      })
    );
  }

  // Aprova o inventário e aplica os ajustes nos saldos e gera movimentações
  async aprovarEFinalizarInventario(
    inventarioId: string,
    supervisorId: string,
    supervisorNome: string,
    observacaoAprovacao?: string
  ): Promise<void> {
    const nowIso = new Date().toISOString();

    await runTransaction(db, async (transaction) => {
      const invDocRef = doc(db, 'inventarios', inventarioId);
      const invSnap = await transaction.get(invDocRef);

      if (!invSnap.exists()) throw new Error('Inventário não encontrado.');
      const inv = invSnap.data() as InventarioDoc;

      if (inv.status === 'finalizado') {
        throw new Error('Este inventário já foi finalizado anteriormente.');
      }

      const itens = (inv.itens || []) as ItemInventario[];

      // Phase 1: All Reads
      const diffItens: { item: ItemInventario; saldoRef: any; saldoSnap: any }[] = [];
      for (const item of itens) {
        if (item.diferenca && item.diferenca !== 0) {
          const saldoRef = doc(db, 'estoque_saldos', item.materialId);
          const saldoSnap = await transaction.get(saldoRef);
          diffItens.push({ item, saldoRef, saldoSnap });
        }
      }

      // Phase 2: All Writes
      for (const { item, saldoRef, saldoSnap } of diffItens) {
        let currentFisico = item.saldoSistema;
        let currentDisponivel = item.saldoSistema;
        let currentReserv = 0;
        let currentSep = 0;
        let currentBloq = 0;
        let currentAvar = 0;

        if (saldoSnap.exists()) {
          const s = saldoSnap.data() as EstoqueSaldoDoc;
          currentFisico = s.estoqueFisico || 0;
          currentDisponivel = s.disponivel || 0;
          currentReserv = s.reservado || 0;
          currentSep = s.emSeparacao || 0;
          currentBloq = s.bloqueado || 0;
          currentAvar = s.avariado || 0;
        }

        const novoFisico = Math.max(0, item.saldoContado ?? currentFisico);
        const novoDisponivel = Math.max(0, novoFisico - currentReserv - currentSep - currentBloq - currentAvar);

        transaction.set(
          saldoRef,
          sanitizeFirestoreData({
            materialId: item.materialId,
            estoqueFisico: novoFisico,
            disponivel: novoDisponivel,
            reservado: currentReserv,
            emSeparacao: currentSep,
            bloqueado: currentBloq,
            avariado: currentAvar,
            updatedAt: nowIso,
          }),
          { merge: true }
        );

        // Cria movimentação de ajuste de inventário
        const movRef = doc(collection(db, 'estoque_movimentacoes'));
        transaction.set(
          movRef,
          sanitizeFirestoreData({
            materialId: item.materialId,
            materialNome: item.materialNome,
            materialSku: item.materialSku,
            tipo: 'ajuste_inventario',
            subtipo: item.diferenca > 0 ? 'ajuste_inventario_entrada' : 'ajuste_inventario_saida',
            quantidade: Math.abs(item.diferenca),
            saldoAnterior: currentFisico,
            saldoPosterior: novoFisico,
            custoUnitario: item.custoUnitario || 0,
            valorTotal: Math.abs(item.diferenca) * (item.custoUnitario || 0),
            motivo: `Ajuste do Inventário ${inv.codigo}: ${item.diferenca > 0 ? 'Sobra de contagem' : 'Falta de contagem'}${
              item.justificativa ? ` (${item.justificativa})` : ''
            }`,
            autorizadoPorId: supervisorId,
            autorizadoPorNome: supervisorNome,
            usuarioId: supervisorId,
            usuarioNome: supervisorNome,
            createdAt: nowIso,
            updatedAt: nowIso,
            isDeleted: false,
          })
        );
      }

      transaction.update(
        invDocRef,
        sanitizeFirestoreData({
          status: 'finalizado',
          aprovadoPorId: supervisorId,
          aprovadoPorNome: supervisorNome,
          dataFinalizacao: nowIso,
          observacoes: observacaoAprovacao || inv.observacoes || '',
          updatedAt: nowIso,
        })
      );
    });
  }

  // Alias para salvarContagem
  async atualizarContagem(
    inventarioId: string,
    itensContados: any[],
    usuarioId: string,
    usuarioNome: string
  ): Promise<void> {
    return this.salvarContagem(inventarioId, itensContados, usuarioId, usuarioNome, true);
  }

  // Alias para aprovarEFinalizarInventario
  async finalizarInventario(
    inventarioId: string,
    supervisorId: string,
    supervisorNome: string,
    observacaoAprovacao?: string
  ): Promise<void> {
    return this.aprovarEFinalizarInventario(inventarioId, supervisorId, supervisorNome, observacaoAprovacao);
  }
}

// Storage File Upload Service
export class StorageService {
  static async uploadFile(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (e) {
      console.warn('Fallback para DataURL local se Storage offline:', e);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
  }

  static async uploadBase64(base64Data: string, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadString(storageRef, base64Data, 'data_url');
      return await getDownloadURL(snapshot.ref);
    } catch (e) {
      return base64Data; // Return direct base64 if storage isn't reachable
    }
  }
}

// Instâncias Singleton exportadas
export const usuariosRepo = new UsuariosRepository();
export const motoboysRepo = new MotoboysRepository();
export const clientesRepo = new ClientesRepository();
export const veiculosRepo = new VeiculosRepository();
export const entregasRepo = new EntregasRepository();
export const pedidosRepo = new PedidosRepository();
export const rotasRepo = new RotasRepository();
export const pagamentosRepo = new PagamentosRepository();
export const adesivosRepo = new AdesivosRepository();
export const documentosRepo = new DocumentosRepository();
export const ocorrenciasRepo = new OcorrenciasRepository();
export const notificacoesRepo = new NotificacoesRepository();
export const configuracoesRepo = new ConfiguracoesRepository();
export const logsAuditoriaRepo = new LogsAuditoriaRepository();
export const expedicoesRepo = new ExpedicoesRepository();
export const divergenciasRepo = new DivergenciasRepository();
export const rotasExpedicaoRepo = new RotasExpedicaoRepository();
export const materiaisRepo = new MateriaisRepository();
export const estoqueSaldosRepo = new EstoqueSaldosRepository();
export const estoqueMovimentacoesRepo = new EstoqueMovimentacoesRepository();
export const estoqueReservasRepo = new EstoqueReservasRepository();
export const inventariosRepo = new InventariosRepository();

export class RelatoriosModelosRepository extends BaseRepository<RelatorioModeloDoc> {
  constructor() {
    super('relatorios_modelos');
  }
}

export class RelatoriosHistoricoRepository extends BaseRepository<RelatorioHistoricoDoc> {
  constructor() {
    super('relatorios_historico');
  }

  async registrarEmissao(log: {
    titulo: string;
    tipoModelo: string;
    formato: 'pdf' | 'excel' | 'csv' | 'impressao' | 'compartilhamento';
    filtrosAplicados: Record<string, any>;
    totalRegistros: number;
    usuarioId: string;
    usuarioNome: string;
    usuarioPapel?: string;
  }): Promise<string> {
    const idUnico = `REL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    return this.create({
      ...log,
      identificadorUnico: idUnico,
      ipOuDispositivo: typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Browser',
    } as any, log.usuarioId);
  }
}

export const relatoriosModelosRepo = new RelatoriosModelosRepository();
export const relatoriosHistoricoRepo = new RelatoriosHistoricoRepository();

// ==========================================
// REPOSITÓRIO DE ROTAS POR CLIENTE (FLEETMOTO)
// ==========================================
export class RotasClienteRepository extends BaseRepository<any> {
  constructor() {
    super('rotas_clientes');
  }

  // Gera código amigável de rota: ROT-2026-ZN-001 ou ROT-2026-0001
  async gerarProximoCodigo(regiao?: string): Promise<string> {
    try {
      const prefixoRegiao = regiao === 'Zona Norte' ? 'ZN' :
        regiao === 'Zona Oeste' ? 'ZO' :
        regiao === 'Baixada Fluminense' ? 'BX' :
        regiao === 'Niterói / São Gonçalo' ? 'NSG' : 'GERAL';
      
      const counterRef = doc(db, 'metadata', `rotas_counter_${prefixoRegiao}`);
      const nextSeq = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(counterRef);
        let current = 1;
        if (snap.exists()) {
          current = (snap.data().seq || 0) + 1;
        }
        transaction.set(counterRef, { seq: current, updatedAt: new Date().toISOString() }, { merge: true });
        return current;
      });
      return `ROT-2026-${prefixoRegiao}-${String(nextSeq).padStart(3, '0')}`;
    } catch (e) {
      console.warn('Fallback código de rota:', e);
      const rand = Math.floor(100 + Math.random() * 900);
      return `ROT-2026-${regiao?.slice(0, 2).toUpperCase() || 'RT'}-${rand}`;
    }
  }

  // Salva nova rota com auditoria e vínculo de paradas
  async criarRotaCliente(
    rotaData: any,
    currentUserId?: string,
    currentUserName?: string
  ): Promise<string> {
    const colRef = collection(db, 'rotas_clientes');
    const nowIso = new Date().toISOString();
    const codigoRota = rotaData.codigoRota || await this.gerarProximoCodigo(rotaData.regiaoPredominante);

    const historicoInicial = [
      {
        id: `HIST-${Date.now()}`,
        dataHora: nowIso,
        usuarioId: currentUserId || 'sistema',
        usuarioNome: currentUserName || 'Gestor Operacional',
        acao: 'criacao',
        descricao: `Criação da rota ${codigoRota} para o cliente ${rotaData.clienteNome} com ${rotaData.paradas?.length || 0} paradas.`,
      }
    ];

    const cleanData: any = sanitizeFirestoreData({
      ...rotaData,
      codigoRota,
      historicoAlteracoes: historicoInicial,
      isDeleted: false,
      deletedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: currentUserId || 'sistema',
      updatedBy: currentUserId || 'sistema',
    });

    const docRef = await addDoc(colRef, cleanData);

    // Registra na trilha de auditoria universal
    this.logAudit({
      acao: 'CREATE',
      colecao: 'rotas_clientes',
      documentoId: docRef.id,
      usuarioId: currentUserId || 'sistema',
      usuarioNome: currentUserName || 'Gestor Operacional',
      usuarioEmail: 'operacoes@fleetmoto.com.br',
      usuarioRole: 'administrador',
      detalhes: `Criação de Rota por Cliente: ${codigoRota} (${rotaData.clienteNome})`,
      dadosNovos: { ...cleanData, id: docRef.id },
      timestamp: nowIso,
    }).catch(console.error);

    return docRef.id;
  }

  // Atualiza parada e registra histórico
  async atualizarStatusParada(
    rotaId: string,
    paradaId: string,
    novoStatus: string,
    motivoOuNota?: string,
    currentUserId?: string,
    currentUserName?: string,
    comprovantePOD?: any
  ): Promise<void> {
    const rotaRef = doc(db, 'rotas_clientes', rotaId);
    const nowIso = new Date().toISOString();

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(rotaRef);
      if (!snap.exists()) throw new Error('Rota não encontrada');

      const rota = snap.data();
      const paradas = (rota.paradas || []).map((p: any) => {
        if (p.id === paradaId) {
          return {
            ...p,
            status: novoStatus,
            motivoInsucesso: motivoOuNota || p.motivoInsucesso,
            comprovantePOD: comprovantePOD || p.comprovantePOD,
            horaConclusao: novoStatus === 'Entregue' ? nowIso : p.horaConclusao,
          };
        }
        return p;
      });

      // Recalcula status geral da rota se todas paradas foram entregues
      const todasEntregues = paradas.every((p: any) => p.status === 'Entregue');
      const statusRota = todasEntregues ? 'concluida' : (rota.status === 'planejada' ? 'em_rota' : rota.status);

      const novoHistorico = [
        ...(rota.historicoAlteracoes || []),
        {
          id: `HIST-${Date.now()}`,
          dataHora: nowIso,
          usuarioId: currentUserId || 'sistema',
          usuarioNome: currentUserName || 'Operador',
          acao: 'alteracao_status',
          descricao: `Parada atualizada para "${novoStatus}". ${motivoOuNota ? `Obs: ${motivoOuNota}` : ''}`,
        }
      ];

      transaction.update(rotaRef, sanitizeFirestoreData({
        paradas,
        status: statusRota,
        historicoAlteracoes: novoHistorico,
        updatedAt: nowIso,
        updatedBy: currentUserId || 'sistema',
      }));
    });
  }

  // Duplicar Rota para outra data
  async duplicarParaData(
    rotaId: string,
    novaData: string,
    currentUserId?: string,
    currentUserName?: string
  ): Promise<string> {
    const rotaSnap = await getDoc(doc(db, 'rotas_clientes', rotaId));
    if (!rotaSnap.exists()) throw new Error('Rota de origem não encontrada');

    const rotaOrigem = rotaSnap.data();
    const novoCodigo = await this.gerarProximoCodigo(rotaOrigem.regiaoPredominante);

    // Reseta status de todas paradas para 'Pendente' e remove PODs antigos
    const novasParadas = (rotaOrigem.paradas || []).map((p: any, idx: number) => ({
      ...p,
      id: `PARADA-${Date.now()}-${idx}`,
      status: 'Pendente',
      dataEntrega: novaData,
      comprovantePOD: null,
      horaChegada: null,
      horaConclusao: null,
      motivoInsucesso: null,
    }));

    const { id, createdAt, updatedAt, ...restoOrigem } = rotaOrigem as any;

    const novaRotaData = {
      ...restoOrigem,
      codigoRota: novoCodigo,
      nomeRota: `${rotaOrigem.nomeRota} (Cópia ${novaData})`,
      dataRota: novaData,
      status: 'planejada',
      paradas: novasParadas,
    };

    return await this.criarRotaCliente(novaRotaData, currentUserId, currentUserName);
  }
}

export const rotasClienteRepo = new RotasClienteRepository();

