import * as esbuild from 'esbuild-wasm';
import type { Bundle, FileMap, Framework, HMRUpdate } from '@/types';

/**
 * In-browser bundler using esbuild-wasm for real-time compilation
 */
export class InBrowserBundler {
  private esbuild: typeof esbuild | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await esbuild.initialize({
        wasmURL: 'https://unpkg.com/esbuild-wasm/esbuild.wasm'
      });
      this.esbuild = esbuild;
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize esbuild:', error);
      throw error;
    }
  }

  async bundle(files: FileMap, framework: Framework): Promise<Bundle> {
    if (!this.initialized || !this.esbuild) {
      throw new Error('Bundler not initialized');
    }

    const entryPoint = this.findEntryPoint(files, framework);
    
    try {
      // Helper functions for the plugin
      const resolvePath = (baseDir: string, relativePath: string): string => {
        if (relativePath.startsWith('./')) {
          return baseDir + '/' + relativePath.slice(2);
        }
        if (relativePath.startsWith('../')) {
          const parts = baseDir.split('/');
          const upCount = (relativePath.match(/\.\.\//g) || []).length;
          const newParts = parts.slice(0, -upCount);
          const remainingPath = relativePath.replace(/\.\.\//g, '');
          return newParts.join('/') + '/' + remainingPath;
        }
        return relativePath;
      };

      const getLoader = (filePath: string): esbuild.Loader => {
        const ext = filePath.split('.').pop()?.toLowerCase();
        switch (ext) {
          case 'tsx': return 'tsx';
          case 'ts': return 'ts';
          case 'jsx': return 'jsx';
          case 'js': return 'js';
          case 'css': return 'css';
          case 'json': return 'json';
          default: return 'js';
        }
      };

      // Create virtual file system plugin
      const virtualFSPlugin: esbuild.Plugin = {
        name: 'virtual-fs',
        setup(build) {
          // Resolve virtual paths
          build.onResolve({ filter: /.*/ }, (args) => {
            if (args.path.startsWith('./') || args.path.startsWith('../')) {
              const resolvedPath = resolvePath(args.resolveDir, args.path);
              return {
                path: resolvedPath,
                namespace: 'virtual-fs'
              };
            }
            
            // Handle node_modules from CDN
            if (!args.path.startsWith('.')) {
              return {
                path: args.path,
                namespace: 'unpkg'
              };
            }
          });
          
          // Load virtual files
          build.onLoad({ filter: /.*/, namespace: 'virtual-fs' }, (args) => {
            const content = files[args.path];
            if (!content) {
              throw new Error(`File not found: ${args.path}`);
            }
            
            return {
              contents: content,
              loader: getLoader(args.path)
            };
          });
          
          // Load from unpkg CDN
          build.onLoad({ filter: /.*/, namespace: 'unpkg' }, async (args) => {
            const url = `https://unpkg.com/${args.path}`;
            try {
              const response = await fetch(url);
              const contents = await response.text();
              
              return {
                contents,
                loader: 'js'
              };
            } catch (error) {
              console.warn(`Failed to fetch ${url}:`, error);
              return {
                contents: `console.error('Failed to load ${args.path}');`,
                loader: 'js'
              };
            }
          });
        }
      };

      // Bundle with esbuild
      const result = await this.esbuild.build({
        entryPoints: [entryPoint],
        bundle: true,
        write: false,
        format: 'esm',
        target: 'es2020',
        plugins: [virtualFSPlugin],
        define: {
          'process.env.NODE_ENV': '"development"'
        },
        loader: {
          '.tsx': 'tsx',
          '.ts': 'ts',
          '.jsx': 'jsx',
          '.js': 'js',
          '.css': 'css',
          '.json': 'json'
        }
      });

      if (result.errors.length > 0) {
        throw new Error(result.errors.map(e => e.text).join('\n'));
      }

      const jsContent = result.outputFiles?.[0]?.text || '';
      const htmlContent = this.generateHTML(framework);
      const cssContent = this.extractCSS(jsContent);

      return {
        html: htmlContent,
        css: cssContent,
        js: jsContent,
        files,
        size: new Blob([htmlContent, cssContent, jsContent]).size
      };
    } catch (error) {
      console.error('Bundle error:', error);
      throw error;
    }
  }

  async canHotReload(filePath: string): Promise<boolean> {
    // Simple heuristic - CSS and most JS files can hot reload
    const ext = filePath.split('.').pop()?.toLowerCase();
    return ['css', 'js', 'jsx', 'ts', 'tsx'].includes(ext || '');
  }

  async createHMRUpdate(filePath: string, content: string): Promise<HMRUpdate> {
    return {
      id: filePath,
      newModule: { content, path: filePath },
      type: 'hot'
    };
  }

  private findEntryPoint(files: FileMap, framework: Framework): string {
    // Look for common entry points
    const entryPoints = {
      react: ['src/main.tsx', 'src/index.tsx', 'src/App.tsx', 'index.tsx'],
      vue: ['src/main.js', 'src/main.ts', 'index.vue'],
      angular: ['src/main.ts', 'src/app.module.ts'],
      svelte: ['src/main.js', 'src/App.svelte'],
      vanilla: ['src/index.js', 'src/main.js', 'index.js']
    };

    const candidates = entryPoints[framework] || entryPoints.vanilla;
    
    for (const candidate of candidates) {
      if (files[candidate]) {
        return candidate;
      }
    }

    // Fallback to first file
    const firstFile = Object.keys(files)[0];
    if (!firstFile) {
      throw new Error('No files provided for bundling');
    }
    
    return firstFile;
  }

  private generateHTML(framework: Framework): string {
    const frameworkSetup = this.getFrameworkSetup(framework);
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style id="preview-styles"></style>
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
        return await window.parent.postMessage({
          type: 'vfs:read',
          path
        }, '*');
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
    
    ${frameworkSetup}
  </script>
</head>
<body>
  <div id="root"></div>
  <div id="app"></div>
  <script type="module" id="app-entry"></script>
</body>
</html>`;
  }

  private getFrameworkSetup(framework: Framework): string {
    switch (framework) {
      case 'react':
        return `
          // React DevTools support
          window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || {};
        `;
      case 'vue':
        return `
          // Vue DevTools support
          window.__VUE_DEVTOOLS_GLOBAL_HOOK__ = window.__VUE_DEVTOOLS_GLOBAL_HOOK__ || {};
        `;
      default:
        return '';
    }
  }

  private extractCSS(jsContent: string): string {
    // Simple CSS extraction - in a real implementation, 
    // this would be more sophisticated
    const cssMatches = jsContent.match(/css`([^`]+)`/g) || [];
    return cssMatches.map(match => 
      match.slice(4, -1) // Remove css` and `
    ).join('\n');
  }
}