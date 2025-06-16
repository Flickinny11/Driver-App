import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { compress, decompress } from 'lz-string';
import type { 
  Agent, 
  Conversation, 
  Project, 
  MemoryItem, 
  EpisodicMemory, 
  ProceduralMemory 
} from '@/types';

/**
 * Database schema for the Driver AI Platform
 */
interface DriverDB extends DBSchema {
  agents: {
    key: string;
    value: {
      id: string;
      data: string; // Compressed agent data
      lastAccessed: Date;
      size: number;
      version: number;
    };
    indexes: {
      'lastAccessed': Date;
      'size': number;
    };
  };
  conversations: {
    key: string;
    value: {
      id: string;
      data: string; // Compressed conversation data
      lastAccessed: Date;
      size: number;
      participants: string[];
      projectId?: string;
    };
    indexes: {
      'lastAccessed': Date;
      'participants': string;
      'projectId': string;
    };
  };
  projects: {
    key: string;
    value: {
      id: string;
      data: string; // Compressed project data
      lastAccessed: Date;
      size: number;
      status: string;
    };
    indexes: {
      'lastAccessed': Date;
      'status': string;
    };
  };
  memories: {
    key: string;
    value: {
      id: string;
      agentId: string;
      type: 'episodic' | 'procedural' | 'semantic';
      data: string; // Compressed memory data
      importance: number;
      timestamp: Date;
      tags: string[];
    };
    indexes: {
      'agentId': string;
      'type': string;
      'importance': number;
      'timestamp': Date;
      'tags': string;
    };
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: any;
      timestamp: Date;
    };
  };
}

/**
 * Manages persistent memory using IndexedDB with compression and LRU eviction
 */
export class MemoryManager {
  private db: IDBPDatabase<DriverDB> | null = null;
  private readonly DB_NAME = 'driver-memory';
  private readonly DB_VERSION = 1;
  private readonly MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_SIZE = 100;

  /**
   * Initialize the memory database
   */
  async initialize(): Promise<void> {
    try {
      this.db = await openDB<DriverDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db, oldVersion, newVersion, _transaction) {
          console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);

          // Create object stores
          if (!db.objectStoreNames.contains('agents')) {
            const agentStore = db.createObjectStore('agents', { keyPath: 'id' });
            agentStore.createIndex('lastAccessed', 'lastAccessed');
            agentStore.createIndex('size', 'size');
          }

          if (!db.objectStoreNames.contains('conversations')) {
            const convStore = db.createObjectStore('conversations', { keyPath: 'id' });
            convStore.createIndex('lastAccessed', 'lastAccessed');
            convStore.createIndex('participants', 'participants', { multiEntry: true });
            convStore.createIndex('projectId', 'projectId');
          }

          if (!db.objectStoreNames.contains('projects')) {
            const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
            projectStore.createIndex('lastAccessed', 'lastAccessed');
            projectStore.createIndex('status', 'status');
          }

          if (!db.objectStoreNames.contains('memories')) {
            const memoryStore = db.createObjectStore('memories', { keyPath: 'id' });
            memoryStore.createIndex('agentId', 'agentId');
            memoryStore.createIndex('type', 'type');
            memoryStore.createIndex('importance', 'importance');
            memoryStore.createIndex('timestamp', 'timestamp');
            memoryStore.createIndex('tags', 'tags', { multiEntry: true });
          }

          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
        },
        blocked() {
          console.warn('Database upgrade blocked by another connection');
        },
        blocking() {
          console.warn('Database is blocking another connection');
        }
      });

      console.log('Memory database initialized successfully');
      
      // Perform cleanup on initialization
      await this.performMaintenance();
    } catch (error) {
      console.error('Failed to initialize memory database:', error);
      throw error;
    }
  }

  /**
   * Save agent memory with compression
   */
  async saveAgent(agent: Agent): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const compressed = compress(JSON.stringify(agent));
      const record = {
        id: agent.id,
        data: compressed,
        lastAccessed: new Date(),
        size: compressed.length,
        version: 1
      };

      await this.db.put('agents', record);
      
      // Update cache
      this.cache.set(`agent_${agent.id}`, {
        data: agent,
        lastAccessed: new Date(),
        size: compressed.length
      });

      // Trim cache if needed
      this.trimCache();
    } catch (error) {
      console.error('Failed to save agent:', error);
      throw error;
    }
  }

  /**
   * Get agent memory with decompression
   */
  async getAgent(agentId: string): Promise<Agent | null> {
    if (!this.db) throw new Error('Database not initialized');

    // Check cache first
    const cacheKey = `agent_${agentId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      cached.lastAccessed = new Date();
      return cached.data as Agent;
    }

    try {
      const record = await this.db.get('agents', agentId);
      if (!record) return null;

      // Update last accessed time
      record.lastAccessed = new Date();
      await this.db.put('agents', record);

      // Decompress and parse
      const decompressed = decompress(record.data);
      const agent = JSON.parse(decompressed) as Agent;

      // Add to cache
      this.cache.set(cacheKey, {
        data: agent,
        lastAccessed: new Date(),
        size: record.size
      });

      return agent;
    } catch (error) {
      console.error('Failed to get agent:', error);
      return null;
    }
  }

  /**
   * Save conversation with compression
   */
  async saveConversation(conversation: Conversation): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const compressed = compress(JSON.stringify(conversation));
      const record = {
        id: conversation.id,
        data: compressed,
        lastAccessed: new Date(),
        size: compressed.length,
        participants: conversation.participants,
        projectId: conversation.metadata.projectId
      };

      await this.db.put('conversations', record);

      // Update cache
      this.cache.set(`conversation_${conversation.id}`, {
        data: conversation,
        lastAccessed: new Date(),
        size: compressed.length
      });

      this.trimCache();
    } catch (error) {
      console.error('Failed to save conversation:', error);
      throw error;
    }
  }

  /**
   * Get conversation with decompression
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    if (!this.db) throw new Error('Database not initialized');

    // Check cache first
    const cacheKey = `conversation_${conversationId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      cached.lastAccessed = new Date();
      return cached.data as Conversation;
    }

    try {
      const record = await this.db.get('conversations', conversationId);
      if (!record) return null;

      // Update last accessed time
      record.lastAccessed = new Date();
      await this.db.put('conversations', record);

      // Decompress and parse
      const decompressed = decompress(record.data);
      const conversation = JSON.parse(decompressed) as Conversation;

      // Add to cache
      this.cache.set(cacheKey, {
        data: conversation,
        lastAccessed: new Date(),
        size: record.size
      });

      return conversation;
    } catch (error) {
      console.error('Failed to get conversation:', error);
      return null;
    }
  }

  /**
   * Save project with compression
   */
  async saveProject(project: Project): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const compressed = compress(JSON.stringify(project));
      const record = {
        id: project.id,
        data: compressed,
        lastAccessed: new Date(),
        size: compressed.length,
        status: project.status
      };

      await this.db.put('projects', record);

      // Update cache
      this.cache.set(`project_${project.id}`, {
        data: project,
        lastAccessed: new Date(),
        size: compressed.length
      });

      this.trimCache();
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error;
    }
  }

  /**
   * Get project with decompression
   */
  async getProject(projectId: string): Promise<Project | null> {
    if (!this.db) throw new Error('Database not initialized');

    // Check cache first
    const cacheKey = `project_${projectId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      cached.lastAccessed = new Date();
      return cached.data as Project;
    }

    try {
      const record = await this.db.get('projects', projectId);
      if (!record) return null;

      // Update last accessed time
      record.lastAccessed = new Date();
      await this.db.put('projects', record);

      // Decompress and parse
      const decompressed = decompress(record.data);
      const project = JSON.parse(decompressed) as Project;

      // Add to cache
      this.cache.set(cacheKey, {
        data: project,
        lastAccessed: new Date(),
        size: record.size
      });

      return project;
    } catch (error) {
      console.error('Failed to get project:', error);
      return null;
    }
  }

  /**
   * Save memory item for an agent
   */
  async saveMemory(
    agentId: string,
    memory: EpisodicMemory | ProceduralMemory | MemoryItem,
    type: 'episodic' | 'procedural' | 'semantic'
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const compressed = compress(JSON.stringify(memory));
      const record = {
        id: `${agentId}_${memory.id}`,
        agentId,
        type,
        data: compressed,
        importance: 'importance' in memory ? memory.importance : 1,
        timestamp: 'timestamp' in memory ? memory.timestamp : new Date(),
        tags: 'tags' in memory ? memory.tags : []
      };

      await this.db.put('memories', record);
    } catch (error) {
      console.error('Failed to save memory:', error);
      throw error;
    }
  }

  /**
   * Get memories for an agent
   */
  async getMemories(
    agentId: string,
    options: MemoryQueryOptions = {}
  ): Promise<Array<EpisodicMemory | ProceduralMemory | MemoryItem>> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      let tx = this.db.transaction('memories', 'readonly');
      let index = tx.store.index('agentId');
      let cursor = await index.openCursor(IDBKeyRange.only(agentId));
      
      const memories: Array<EpisodicMemory | ProceduralMemory | MemoryItem> = [];

      while (cursor) {
        const record = cursor.value;
        
        // Apply filters
        if (options.type && record.type !== options.type) {
          cursor = await cursor.continue();
          continue;
        }

        if (options.minImportance && record.importance < options.minImportance) {
          cursor = await cursor.continue();
          continue;
        }

        if (options.tags && !options.tags.some(tag => record.tags.includes(tag))) {
          cursor = await cursor.continue();
          continue;
        }

        // Decompress and parse memory
        const decompressed = decompress(record.data);
        const memory = JSON.parse(decompressed);
        memories.push(memory);

        cursor = await cursor.continue();
      }

      // Sort by importance and timestamp
      memories.sort((a, b) => {
        const importanceA = 'importance' in a ? a.importance : 1;
        const importanceB = 'importance' in b ? b.importance : 1;
        
        if (importanceA !== importanceB) {
          return importanceB - importanceA; // Higher importance first
        }

        const timestampA = 'timestamp' in a ? a.timestamp.getTime() : 0;
        const timestampB = 'timestamp' in b ? b.timestamp.getTime() : 0;
        
        return timestampB - timestampA; // More recent first
      });

      // Apply limit
      if (options.limit) {
        return memories.slice(0, options.limit);
      }

      return memories;
    } catch (error) {
      console.error('Failed to get memories:', error);
      return [];
    }
  }

  /**
   * Save application setting
   */
  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const record = {
        key,
        value,
        timestamp: new Date()
      };

      await this.db.put('settings', record);
    } catch (error) {
      console.error('Failed to save setting:', error);
      throw error;
    }
  }

  /**
   * Get application setting
   */
  async getSetting(key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const record = await this.db.get('settings', key);
      return record?.value;
    } catch (error) {
      console.error('Failed to get setting:', error);
      return null;
    }
  }

  /**
   * Perform maintenance tasks (LRU cleanup, compression optimization)
   */
  async performMaintenance(): Promise<void> {
    if (!this.db) return;

    try {
      // Check total storage size
      const stats = await this.getStorageStats();
      
      if (stats.totalSize > this.MAX_STORAGE_SIZE) {
        await this.evictOldData();
      }

      // Clean up expired or low-importance memories
      await this.cleanupMemories();
    } catch (error) {
      console.error('Failed to perform maintenance:', error);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const [agents, conversations, projects, memories] = await Promise.all([
        this.db.getAll('agents'),
        this.db.getAll('conversations'),
        this.db.getAll('projects'),
        this.db.getAll('memories')
      ]);

      const agentSize = agents.reduce((sum, agent) => sum + agent.size, 0);
      const conversationSize = conversations.reduce((sum, conv) => sum + conv.size, 0);
      const projectSize = projects.reduce((sum, proj) => sum + proj.size, 0);
      const memorySize = memories.reduce((sum, mem) => sum + mem.data.length, 0);

      return {
        totalSize: agentSize + conversationSize + projectSize + memorySize,
        agentCount: agents.length,
        conversationCount: conversations.length,
        projectCount: projects.length,
        memoryCount: memories.length,
        breakdown: {
          agents: agentSize,
          conversations: conversationSize,
          projects: projectSize,
          memories: memorySize
        }
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      throw error;
    }
  }

  /**
   * Evict old data using LRU strategy
   */
  private async evictOldData(): Promise<void> {
    if (!this.db) return;

    try {
      // Get all records sorted by last accessed time
      const [agents, conversations, projects] = await Promise.all([
        this.db.getAll('agents'),
        this.db.getAll('conversations'),
        this.db.getAll('projects')
      ]);

      const allRecords = [
        ...agents.map(a => ({ type: 'agents', id: a.id, lastAccessed: a.lastAccessed, size: a.size })),
        ...conversations.map(c => ({ type: 'conversations', id: c.id, lastAccessed: c.lastAccessed, size: c.size })),
        ...projects.map(p => ({ type: 'projects', id: p.id, lastAccessed: p.lastAccessed, size: p.size }))
      ];

      // Sort by last accessed (oldest first)
      allRecords.sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

      // Delete oldest records until we're under the size limit
      let freedSpace = 0;
      const targetFreed = this.MAX_STORAGE_SIZE * 0.2; // Free 20% of max size

      for (const record of allRecords) {
        if (freedSpace >= targetFreed) break;

        await this.db.delete(record.type as any, record.id);
        this.cache.delete(`${record.type.slice(0, -1)}_${record.id}`);
        freedSpace += record.size;
      }

      console.log(`Evicted ${freedSpace} bytes of old data`);
    } catch (error) {
      console.error('Failed to evict old data:', error);
    }
  }

  /**
   * Clean up low-importance memories
   */
  private async cleanupMemories(): Promise<void> {
    if (!this.db) return;

    try {
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const tx = this.db.transaction('memories', 'readwrite');
      const index = tx.store.index('timestamp');
      let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoffDate));

      let deletedCount = 0;
      while (cursor) {
        const record = cursor.value;
        
        // Delete low-importance old memories
        if (record.importance < 0.3) {
          await cursor.delete();
          deletedCount++;
        }

        cursor = await cursor.continue();
      }

      console.log(`Cleaned up ${deletedCount} old memories`);
    } catch (error) {
      console.error('Failed to cleanup memories:', error);
    }
  }

  /**
   * Trim cache to maintain size limit
   */
  private trimCache(): void {
    if (this.cache.size <= this.CACHE_SIZE) return;

    // Convert to array and sort by last accessed time
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime());

    // Remove oldest entries
    const toRemove = entries.slice(0, entries.length - this.CACHE_SIZE);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const tx = this.db.transaction(['agents', 'conversations', 'projects', 'memories', 'settings'], 'readwrite');
      await Promise.all([
        tx.objectStore('agents').clear(),
        tx.objectStore('conversations').clear(),
        tx.objectStore('projects').clear(),
        tx.objectStore('memories').clear(),
        tx.objectStore('settings').clear()
      ]);

      this.cache.clear();
      console.log('All data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.cache.clear();
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Supporting types and interfaces
interface CacheEntry {
  data: any;
  lastAccessed: Date;
  size: number;
}

export interface MemoryQueryOptions {
  type?: 'episodic' | 'procedural' | 'semantic';
  minImportance?: number;
  tags?: string[];
  limit?: number;
}

export interface StorageStats {
  totalSize: number;
  agentCount: number;
  conversationCount: number;
  projectCount: number;
  memoryCount: number;
  breakdown: {
    agents: number;
    conversations: number;
    projects: number;
    memories: number;
  };
}