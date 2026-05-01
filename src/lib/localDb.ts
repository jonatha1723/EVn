import { DecryptedMessage } from '../types';

const DB_NAME = 'ChatLocalDB';
const DB_VERSION = 1;
const STORE_NAME = 'messages';

class LocalDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('chatId', 'chatId', { unique: false });
          store.createIndex('clientTimestamp', 'clientTimestamp', { unique: false });
        }
      };
    });
  }

  async saveMessage(message: DecryptedMessage): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      // Usamos formatTime ou algo similar para garantir que salvamos apenas dados serializáveis
      // O messages já é DecryptedMessage (texto limpo)
      const request = store.put(message);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveMessages(messages: DecryptedMessage[]): Promise<void> {
    if (messages.length === 0) return;
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      messages.forEach(msg => store.put(msg));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getMessagesByChat(chatId: string): Promise<DecryptedMessage[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('chatId');
      const request = index.getAll(IDBKeyRange.only(chatId));

      request.onsuccess = () => {
        const msgs = request.result as DecryptedMessage[];
        // Ordenar por tempo
        msgs.sort((a, b) => (a.clientTimestamp || 0) - (b.clientTimestamp || 0));
        resolve(msgs);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getLastMessageTimestamp(chatId: string): Promise<number> {
    const msgs = await this.getMessagesByChat(chatId);
    if (msgs.length === 0) return 0;
    return msgs[msgs.length - 1].clientTimestamp || 0;
  }

  async clearChat(chatId: string): Promise<void> {
    const db = await this.init();
    const msgs = await this.getMessagesByChat(chatId);
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      msgs.forEach(msg => store.delete(msg.id));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async deleteMessages(messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) return;
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      messageIds.forEach(id => store.delete(id));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const localDb = new LocalDB();
