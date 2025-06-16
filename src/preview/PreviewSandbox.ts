import { MessageBridge } from './MessageBridge';
import { VirtualFileSystem } from './VirtualFileSystem';
import { InBrowserBundler } from './InBrowserBundler';
import type { Framework, ConsoleMessage, PreviewError, ElementInfo } from '@/types';

/**
 * Secure preview sandbox with iframe isolation and HMR support
 */
export class PreviewSandbox {
  private iframe: HTMLIFrameElement;
  private messageBridge: MessageBridge;
  private virtualFS: VirtualFileSystem;
  private bundler: InBrowserBundler;
  private container: HTMLElement;
  private isDestroyed = false;
  private currentFramework: Framework = 'react';

  // Event handlers
  private onConsoleMessage?: (message: ConsoleMessage) => void;
  private onError?: (error: PreviewError) => void;
  private onReady?: () => void;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    
    this.container = container;
    this.iframe = this.createSecureIframe();
    this.messageBridge = new MessageBridge(this.iframe);
    this.virtualFS = new VirtualFileSystem();
    this.bundler = new InBrowserBundler();
    
    this.setupEventHandlers();
    this.container.appendChild(this.iframe);
  }

  async initialize(): Promise<void> {
    await this.bundler.initialize();
    await this.injectPreviewRuntime();
  }

  private createSecureIframe(): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    
    // Strict CSP for security
    iframe.setAttribute('csp', `
      default-src 'self' blob: data:;
      script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://unpkg.com;
      style-src 'self' 'unsafe-inline';
      img-src * data: blob:;
      font-src 'self' data: https://fonts.gstatic.com;
      connect-src *;
      frame-src 'none';
    `.replace(/\s+/g, ' ').trim());
    
    // Sandbox with specific permissions
    iframe.setAttribute('sandbox', [
      'allow-scripts',
      'allow-same-origin',
      'allow-popups',
      'allow-forms',
      'allow-modals'
    ].join(' '));
    
    iframe.className = 'w-full h-full border-0';
    iframe.loading = 'eager';
    
    return iframe;
  }

  private setupEventHandlers(): void {
    this.messageBridge.on('preview:console', (data) => {
      if (this.onConsoleMessage) {
        const message: ConsoleMessage = {
          type: data.method,
          args: data.args,
          timestamp: new Date()
        };
        this.onConsoleMessage(message);
      }
    });

    this.messageBridge.on('preview:error', (data) => {
      if (this.onError) {
        this.onError(data.error);
      }
    });

    this.messageBridge.on('preview:ready', () => {
      if (this.onReady) {
        this.onReady();
      }
    });

    this.messageBridge.on('vfs:read', async (data) => {
      const content = this.virtualFS.readFile(data.path);
      this.messageBridge.send('vfs:response', {
        path: data.path,
        content: content || ''
      });
    });
  }

  private async injectPreviewRuntime(): Promise<void> {
    const runtime = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <script>
          // Hot Module Replacement runtime
          window.__HMR__ = {
            accept: (id, callback) => {
              window.__HMR_CALLBACKS__ = window.__HMR_CALLBACKS__ || {};
              window.__HMR_CALLBACKS__[id] = callback;
            },
            
            update: async (id, newModule) => {
              const callback = window.__HMR_CALLBACKS__[id];
              if (callback) {
                await callback(newModule);
              } else {
                // Full reload if no HMR handler
                window.location.reload();
              }
            }
          };
          
          // Virtual file system access
          window.__VFS__ = {
            readFile: async (path) => {
              return new Promise((resolve) => {
                const handleResponse = (event) => {
                  if (event.data.type === 'vfs:response' && event.data.path === path) {
                    window.removeEventListener('message', handleResponse);
                    resolve(event.data.content);
                  }
                };
                window.addEventListener('message', handleResponse);
                window.parent.postMessage({
                  type: 'vfs:read',
                  path
                }, '*');
              });
            }
          };
          
          // Error handling
          window.addEventListener('error', (e) => {
            window.parent.postMessage({
              type: 'preview:error',
              error: {
                message: e.message,
                filename: e.filename,
                line: e.lineno,
                column: e.colno,
                stack: e.error?.stack
              }
            }, '*');
          });
          
          // Console capture
          const originalConsole = window.console;
          ['log', 'warn', 'error', 'info'].forEach(method => {
            window.console[method] = (...args) => {
              originalConsole[method](...args);
              window.parent.postMessage({
                type: 'preview:console',
                method,
                args: args.map(arg => {
                  try {
                    return JSON.stringify(arg);
                  } catch {
                    return String(arg);
                  }
                })
              }, '*');
            };
          });

          // Signal ready
          window.addEventListener('load', () => {
            window.parent.postMessage({
              type: 'preview:ready'
            }, '*');
          });
        </script>
      </head>
      <body>
        <div id="root"></div>
        <div id="app"></div>
        <script type="module" id="app-entry"></script>
      </body>
      </html>
    `;
    
    this.iframe.srcdoc = runtime;
    await this.waitForLoad();
  }

  private waitForLoad(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Iframe load timeout'));
      }, 10000);

      const onReady = () => {
        clearTimeout(timeout);
        this.messageBridge.off('preview:ready');
        resolve();
      };

      this.messageBridge.on('preview:ready', onReady);
    });
  }

  async updateFile(path: string, content: string): Promise<void> {
    if (this.isDestroyed) return;

    // Store in virtual FS
    this.virtualFS.writeFile(path, content);
    
    // Determine if HMR is possible
    const canHMR = await this.bundler.canHotReload(path);
    
    if (canHMR) {
      // Perform hot reload
      const update = await this.bundler.createHMRUpdate(path, content);
      this.messageBridge.send('hmr:update', update);
    } else {
      // Full reload required
      await this.rebuildAndReload();
    }
  }

  async loadProject(files: Record<string, string>, framework: Framework = 'react'): Promise<void> {
    this.currentFramework = framework;
    this.virtualFS.loadFromFileMap(files);
    await this.rebuildAndReload();
  }

  detectFramework(): Framework {
    const files = this.virtualFS.getFiles();
    
    // Use explicit framework if set
    if (this.currentFramework !== 'react') {
      return this.currentFramework;
    }
    
    // Check for React
    if (Object.keys(files).some(path => path.includes('react') || path.endsWith('.jsx') || path.endsWith('.tsx'))) {
      return 'react';
    }
    
    // Check for Vue
    if (Object.keys(files).some(path => path.endsWith('.vue'))) {
      return 'vue';
    }
    
    // Check for Angular
    if (Object.keys(files).some(path => path.includes('angular') || path.includes('@angular'))) {
      return 'angular';
    }
    
    // Check for Svelte
    if (Object.keys(files).some(path => path.endsWith('.svelte'))) {
      return 'svelte';
    }
    
    return 'vanilla';
  }

  private async rebuildAndReload(): Promise<void> {
    if (this.isDestroyed) return;

    const startTime = performance.now();
    
    try {
      // Bundle all files
      const framework = this.detectFramework();
      const bundle = await this.bundler.bundle(
        this.virtualFS.getFiles(),
        framework
      );
      
      // Inject into iframe
      this.messageBridge.send('preview:reload', {
        html: bundle.html,
        css: bundle.css,
        js: bundle.js
      });
      
      const elapsed = performance.now() - startTime;
      console.log(`Rebuild completed in ${elapsed.toFixed(2)}ms`);
    } catch (error) {
      console.error('Rebuild failed:', error);
      if (this.onError) {
        this.onError({
          message: error instanceof Error ? error.message : 'Build failed',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }
  }

  getElementAtPoint(x: number, y: number): ElementInfo | null {
    if (!this.iframe.contentDocument) return null;
    
    const rect = this.iframe.getBoundingClientRect();
    const relativeX = x - rect.left;
    const relativeY = y - rect.top;
    
    const element = this.iframe.contentDocument.elementFromPoint(relativeX, relativeY);
    if (!element) return null;
    
    const bounds = element.getBoundingClientRect();
    const selector = this.generateSelector(element);
    const xpath = this.generateXPath(element);
    
    return {
      selector,
      xpath,
      bounds: bounds,
      tagName: element.tagName,
      attributes: this.getElementAttributes(element)
    };
  }

  private generateSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }
    
    return element.tagName.toLowerCase();
  }

  private generateXPath(element: Element): string {
    const parts: string[] = [];
    let current: Element | null = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 1;
      let sibling = current.previousElementSibling;
      
      while (sibling) {
        if (sibling.tagName === current.tagName) {
          index++;
        }
        sibling = sibling.previousElementSibling;
      }
      
      const tagName = current.tagName.toLowerCase();
      const part = `${tagName}[${index}]`;
      parts.unshift(part);
      
      current = current.parentElement;
    }
    
    return `/${parts.join('/')}`;
  }

  private getElementAttributes(element: Element): Record<string, string> {
    const attributes: Record<string, string> = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attributes[attr.name] = attr.value;
    }
    return attributes;
  }

  // Event handler setters
  setOnConsoleMessage(handler: (message: ConsoleMessage) => void): void {
    this.onConsoleMessage = handler;
  }

  setOnError(handler: (error: PreviewError) => void): void {
    this.onError = handler;
  }

  setOnReady(handler: () => void): void {
    this.onReady = handler;
  }

  destroy(): void {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    this.messageBridge.destroy();
    this.virtualFS.clear();
    
    if (this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }
  }
}