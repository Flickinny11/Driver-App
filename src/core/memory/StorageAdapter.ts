import { MemoryManager } from './MemoryManager';

/**
 * Storage adapter that provides a simplified interface for common storage operations
 */
export class StorageAdapter {
  constructor(private memoryManager: MemoryManager) {}

  /**
   * Generic save operation with automatic serialization
   */
  async save<T>(collection: StorageCollection, id: string, data: T): Promise<void> {
    switch (collection) {
      case 'agents':
        await this.memoryManager.saveAgent(data as any);
        break;
      case 'conversations':
        await this.memoryManager.saveConversation(data as any);
        break;
      case 'projects':
        await this.memoryManager.saveProject(data as any);
        break;
      case 'settings':
        await this.memoryManager.saveSetting(id, data);
        break;
      default:
        throw new Error(`Unknown collection: ${collection}`);
    }
  }

  /**
   * Generic load operation with automatic deserialization
   */
  async load<T>(collection: StorageCollection, id: string): Promise<T | null> {
    switch (collection) {
      case 'agents':
        return await this.memoryManager.getAgent(id) as T;
      case 'conversations':
        return await this.memoryManager.getConversation(id) as T;
      case 'projects':
        return await this.memoryManager.getProject(id) as T;
      case 'settings':
        return await this.memoryManager.getSetting(id) as T;
      default:
        throw new Error(`Unknown collection: ${collection}`);
    }
  }

  /**
   * Batch save operation
   */
  async saveBatch<T>(collection: StorageCollection, items: Array<{ id: string; data: T }>): Promise<void> {
    const promises = items.map(item => this.save(collection, item.id, item.data));
    await Promise.all(promises);
  }

  /**
   * Batch load operation
   */
  async loadBatch<T>(collection: StorageCollection, ids: string[]): Promise<Array<T | null>> {
    const promises = ids.map(id => this.load<T>(collection, id));
    return await Promise.all(promises);
  }

  /**
   * Check if item exists
   */
  async exists(collection: StorageCollection, id: string): Promise<boolean> {
    const item = await this.load(collection, id);
    return item !== null;
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<any> {
    return await this.memoryManager.getStorageStats();
  }

  /**
   * Perform maintenance
   */
  async performMaintenance(): Promise<void> {
    await this.memoryManager.performMaintenance();
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    await this.memoryManager.clearAll();
  }
}

export type StorageCollection = 'agents' | 'conversations' | 'projects' | 'settings';