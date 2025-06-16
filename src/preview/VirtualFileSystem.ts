import type { FileMap } from '@/types';

/**
 * Virtual file system for managing files in the preview sandbox
 */
export class VirtualFileSystem {
  private files: Map<string, string> = new Map();
  private watchers: Map<string, ((content: string) => void)[]> = new Map();

  writeFile(path: string, content: string): void {
    const normalizedPath = this.normalizePath(path);
    const oldContent = this.files.get(normalizedPath);
    
    this.files.set(normalizedPath, content);
    
    // Notify watchers if content changed
    if (oldContent !== content) {
      this.notifyWatchers(normalizedPath, content);
    }
  }

  readFile(path: string): string | undefined {
    const normalizedPath = this.normalizePath(path);
    return this.files.get(normalizedPath);
  }

  deleteFile(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    return this.files.delete(normalizedPath);
  }

  exists(path: string): boolean {
    const normalizedPath = this.normalizePath(path);
    return this.files.has(normalizedPath);
  }

  listFiles(): string[] {
    return Array.from(this.files.keys());
  }

  getFiles(): FileMap {
    const result: FileMap = {};
    for (const [path, content] of this.files) {
      result[path] = content;
    }
    return result;
  }

  watch(path: string, callback: (content: string) => void): () => void {
    const normalizedPath = this.normalizePath(path);
    const watchers = this.watchers.get(normalizedPath) || [];
    watchers.push(callback);
    this.watchers.set(normalizedPath, watchers);

    // Return unwatch function
    return () => {
      const currentWatchers = this.watchers.get(normalizedPath) || [];
      const index = currentWatchers.indexOf(callback);
      if (index > -1) {
        currentWatchers.splice(index, 1);
        if (currentWatchers.length === 0) {
          this.watchers.delete(normalizedPath);
        } else {
          this.watchers.set(normalizedPath, currentWatchers);
        }
      }
    };
  }

  loadFromFileMap(fileMap: FileMap): void {
    this.files.clear();
    for (const [path, content] of Object.entries(fileMap)) {
      this.writeFile(path, content);
    }
  }

  clear(): void {
    this.files.clear();
    this.watchers.clear();
  }

  getSize(): number {
    let totalSize = 0;
    for (const content of this.files.values()) {
      totalSize += new Blob([content]).size;
    }
    return totalSize;
  }

  private normalizePath(path: string): string {
    // Normalize path separators and remove leading/trailing slashes
    return path.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  }

  private notifyWatchers(path: string, content: string): void {
    const watchers = this.watchers.get(path);
    if (watchers) {
      watchers.forEach(callback => {
        try {
          callback(content);
        } catch (error) {
          console.error('Error in file watcher callback:', error);
        }
      });
    }
  }
}