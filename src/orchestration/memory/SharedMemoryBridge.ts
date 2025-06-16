/**
 * Manages shared memory communication between agents using SharedArrayBuffer
 * Provides atomic operations and efficient data transfer
 */
export class SharedMemoryBridge {
  private buffers: Map<string, SharedArrayBuffer> = new Map();
  private locks: Map<string, Int32Array> = new Map();
  private metadata: Map<string, MemoryMetadata> = new Map();

  /**
   * Create a new shared memory buffer
   */
  createSharedMemory(key: string, size: number): SharedArrayBuffer {
    // Check if SharedArrayBuffer is supported
    if (typeof SharedArrayBuffer === 'undefined') {
      console.warn('SharedArrayBuffer not supported, falling back to regular ArrayBuffer');
      // Fallback to regular ArrayBuffer for development/testing
      return new ArrayBuffer(size) as any;
    }

    const buffer = new SharedArrayBuffer(size);
    this.buffers.set(key, buffer);

    // Create lock for atomic operations
    const lockBuffer = new SharedArrayBuffer(4);
    const lock = new Int32Array(lockBuffer);
    this.locks.set(key, lock);

    // Initialize metadata
    this.metadata.set(key, {
      size,
      writers: new Set(),
      readers: new Set(),
      lastUpdated: new Date(),
      version: 0
    });

    return buffer;
  }

  /**
   * Write data to shared memory atomically
   */
  async writeAtomic(key: string, offset: number, data: ArrayBuffer): Promise<void> {
    const lock = this.locks.get(key);
    const buffer = this.buffers.get(key);
    
    if (!lock || !buffer) {
      throw new Error(`Shared memory key "${key}" not found`);
    }

    // Acquire lock using atomic compare and swap
    let acquired = false;
    const maxRetries = 1000;
    let retries = 0;

    while (!acquired && retries < maxRetries) {
      if (Atomics.compareExchange(lock, 0, 0, 1) === 0) {
        acquired = true;
      } else {
        // Wait a bit before retrying
        await this.sleep(1);
        retries++;
      }
    }

    if (!acquired) {
      throw new Error(`Failed to acquire lock for key "${key}" after ${maxRetries} retries`);
    }

    try {
      // Write data
      const view = new Uint8Array(buffer, offset);
      const dataView = new Uint8Array(data);
      
      if (offset + dataView.length > buffer.byteLength) {
        throw new Error('Data exceeds buffer size');
      }
      
      view.set(dataView);

      // Update metadata
      const meta = this.metadata.get(key)!;
      meta.lastUpdated = new Date();
      meta.version++;

      // Notify readers that data has been updated
      this.notifyReaders(key);
    } finally {
      // Release lock
      Atomics.store(lock, 0, 0);
      Atomics.notify(lock, 0, 1); // Wake up waiting threads
    }
  }

  /**
   * Read data from shared memory
   */
  readAtomic(key: string, offset: number, length: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const buffer = this.buffers.get(key);
      
      if (!buffer) {
        reject(new Error(`Shared memory key "${key}" not found`));
        return;
      }

      try {
        const view = new Uint8Array(buffer, offset, length);
        const result = new ArrayBuffer(length);
        const resultView = new Uint8Array(result);
        resultView.set(view);
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Subscribe to updates for a specific memory key
   */
  subscribe(key: string, callback: (data: ArrayBuffer) => void): () => void {
    const meta = this.metadata.get(key);
    if (!meta) {
      throw new Error(`Shared memory key "${key}" not found`);
    }

    const readerId = Math.random().toString(36).substr(2, 9);
    meta.readers.add(readerId);

    // Set up listener for updates
    const listener = (event: CustomEvent) => {
      if (event.detail.key === key) {
        this.readAtomic(key, 0, event.detail.size)
          .then(callback)
          .catch(console.error);
      }
    };

    document.addEventListener('sharedMemoryUpdate', listener as EventListener);

    // Return unsubscribe function
    return () => {
      meta.readers.delete(readerId);
      document.removeEventListener('sharedMemoryUpdate', listener as EventListener);
    };
  }

  /**
   * Notify readers that data has been updated
   */
  private notifyReaders(key: string): void {
    const meta = this.metadata.get(key);
    if (!meta) return;

    const event = new CustomEvent('sharedMemoryUpdate', {
      detail: { key, size: meta.size, version: meta.version }
    });
    
    document.dispatchEvent(event);
  }

  /**
   * Write JSON data to shared memory
   */
  async writeJSON(key: string, data: any): Promise<void> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(jsonString);
    
    await this.writeAtomic(key, 0, encoded.buffer);
  }

  /**
   * Read JSON data from shared memory
   */
  async readJSON<T = any>(key: string): Promise<T> {
    const buffer = this.buffers.get(key);
    if (!buffer) {
      throw new Error(`Shared memory key "${key}" not found`);
    }

    const data = await this.readAtomic(key, 0, buffer.byteLength);
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(data);
    
    // Find the null terminator to get actual string length
    const nullIndex = jsonString.indexOf('\0');
    const actualString = nullIndex >= 0 ? jsonString.substring(0, nullIndex) : jsonString;
    
    if (!actualString.trim()) {
      return {} as T;
    }
    
    return JSON.parse(actualString);
  }

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    const stats: MemoryStats = {
      totalBuffers: this.buffers.size,
      totalSize: 0,
      buffers: []
    };

    for (const [key, buffer] of this.buffers.entries()) {
      const meta = this.metadata.get(key)!;
      stats.totalSize += buffer.byteLength;
      stats.buffers.push({
        key,
        size: buffer.byteLength,
        writers: meta.writers.size,
        readers: meta.readers.size,
        lastUpdated: meta.lastUpdated,
        version: meta.version
      });
    }

    return stats;
  }

  /**
   * Clean up a shared memory buffer
   */
  cleanup(key: string): void {
    this.buffers.delete(key);
    this.locks.delete(key);
    this.metadata.delete(key);
  }

  /**
   * Sleep utility for lock retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if SharedArrayBuffer is supported
   */
  static isSupported(): boolean {
    return typeof SharedArrayBuffer !== 'undefined';
  }

  /**
   * Create a fallback implementation when SharedArrayBuffer is not available
   */
  static createFallback(): SharedMemoryBridge {
    console.warn('Using fallback SharedMemoryBridge implementation');
    return new SharedMemoryBridge();
  }
}

interface MemoryMetadata {
  size: number;
  writers: Set<string>;
  readers: Set<string>;
  lastUpdated: Date;
  version: number;
}

interface MemoryStats {
  totalBuffers: number;
  totalSize: number;
  buffers: Array<{
    key: string;
    size: number;
    writers: number;
    readers: number;
    lastUpdated: Date;
    version: number;
  }>;
}