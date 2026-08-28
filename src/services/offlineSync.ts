/**
 * Gerenciador de Sincronização Offline para Comprovantes POD
 */
import { ComprovantePOD } from '../types';

export interface OfflinePODQueueItem {
  id: string;
  entregaId: string;
  podData: ComprovantePOD;
  userId?: string;
  timestamp: string;
  tentativas: number;
}

const OFFLINE_QUEUE_KEY = 'fleetmoto_offline_pod_queue_v1';

export const offlineSyncService = {
  // Salva POD na fila offline local
  enqueue(entregaId: string, podData: ComprovantePOD, userId?: string): OfflinePODQueueItem {
    const queue = this.getQueue();
    const newItem: OfflinePODQueueItem = {
      id: `offline_pod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entregaId,
      podData: {
        ...podData,
        offlineSync: true,
      },
      userId,
      timestamp: new Date().toISOString(),
      tentativas: 0,
    };

    queue.push(newItem);
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Erro ao gravar fila offline no localStorage:', e);
    }
    return newItem;
  },

  // Obtém lista de itens na fila
  getQueue(): OfflinePODQueueItem[] {
    try {
      const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Erro ao ler fila offline:', e);
      return [];
    }
  },

  // Remove um item da fila
  removeItem(itemId: string) {
    const queue = this.getQueue().filter((item) => item.id !== itemId);
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Erro ao atualizar fila offline:', e);
    }
  },

  // Processa a fila enviando para o repositório
  async processQueue(
    syncHandler: (entregaId: string, podData: ComprovantePOD, userId?: string) => Promise<void>
  ): Promise<{ synced: number; failed: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        await syncHandler(item.entregaId, item.podData, item.userId);
        this.removeItem(item.id);
        synced++;
      } catch (err) {
        console.warn(`Falha ao sincronizar item offline ${item.id}:`, err);
        item.tentativas += 1;
        failed++;
      }
    }

    return { synced, failed };
  },

  // Verifica se está online
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },
};
