import { nanoid } from 'nanoid';
import type { 
  FileMap, 
  PWAManifest, 
  AppPackageResult, 
  Icon, 
  IconSet 
} from '@/types';

/**
 * Packages and deploys apps as PWAs with auto-generated icons
 */
export class AppPackager {
  private iconGenerator: IconGenerator;
  private manifestBuilder: ManifestBuilder;
  private serviceWorkerGenerator: ServiceWorkerGenerator;

  constructor() {
    this.iconGenerator = new IconGenerator();
    this.manifestBuilder = new ManifestBuilder();
    this.serviceWorkerGenerator = new ServiceWorkerGenerator();
  }

  async packageApp(
    projectName: string,
    files: FileMap,
    description?: string
  ): Promise<AppPackageResult> {
    try {
      // Generate app icon from content
      const icon = await this.iconGenerator.generateFromApp(files, projectName);
      
      // Extract theme color from CSS/styles
      const themeColor = await this.extractThemeColor(files);
      
      // Create PWA manifest
      const manifest = await this.manifestBuilder.build({
        name: projectName,
        short_name: this.generateShortName(projectName),
        description: description || `${projectName} - Built with Driver AI`,
        start_url: '/',
        display: 'standalone',
        theme_color: themeColor,
        background_color: '#ffffff',
        icons: await this.generateIconSizes(icon)
      });
      
      // Generate service worker
      const serviceWorker = this.serviceWorkerGenerator.generate({
        cacheName: `driver-app-${nanoid()}`,
        precacheFiles: Object.keys(files),
        offlineStrategy: 'network-first'
      });
      
      // Build final bundle
      const bundle = await this.bundleApp(files, manifest, serviceWorker);
      
      // Deploy to unique subdomain (simulated)
      const deployedUrl = await this.deployToSubdomain(nanoid(), bundle);
      
      return {
        id: nanoid(),
        name: projectName,
        url: deployedUrl,
        icon: icon.dataUrl,
        size: bundle.size,
        files: Object.keys(files).length,
        createdAt: new Date(),
        manifest,
        installable: true
      };
    } catch (error) {
      console.error('App packaging failed:', error);
      throw error;
    }
  }

  private async generateIconSizes(baseIcon: Icon): Promise<IconSet> {
    const sizes = [16, 32, 64, 128, 192, 256, 512];
    const icons: IconSet = {};
    
    for (const size of sizes) {
      icons[`${size}x${size}`] = await this.resizeIcon(baseIcon, size);
    }
    
    // Special iOS icons
    icons['apple-touch-icon'] = await this.resizeIcon(baseIcon, 180);
    
    return icons;
  }

  private async resizeIcon(baseIcon: Icon, targetSize: number): Promise<Icon> {
    // Create a canvas and resize the icon
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    canvas.width = targetSize;
    canvas.height = targetSize;

    // Load the base icon image
    const img = new Image();
    img.src = baseIcon.dataUrl;
    
    return new Promise((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, targetSize, targetSize);
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          size: targetSize
        });
      };
    });
  }

  private async deployToSubdomain(
    projectId: string,
    bundle: { files: FileMap; size: number }
  ): Promise<string> {
    // Simulate deployment to a unique subdomain
    const subdomain = `${projectId.toLowerCase()}.apps.driver.dev`;
    
    // In a real implementation, this would deploy to:
    // - Cloudflare Workers
    // - Vercel
    // - Netlify
    // - Or custom hosting solution
    
    console.log(`Deploying app to https://${subdomain}`, {
      files: Object.keys(bundle.files).length,
      size: bundle.size
    });
    
    return `https://${subdomain}`;
  }

  private async bundleApp(
    files: FileMap, 
    manifest: PWAManifest, 
    serviceWorker: string
  ): Promise<{ files: FileMap; size: number }> {
    const bundledFiles = { ...files };
    
    // Add manifest
    bundledFiles['manifest.json'] = JSON.stringify(manifest, null, 2);
    
    // Add service worker
    bundledFiles['sw.js'] = serviceWorker;
    
    // Calculate total size
    const size = Object.values(bundledFiles).reduce(
      (total, content) => total + new Blob([content]).size, 
      0
    );
    
    return { files: bundledFiles, size };
  }

  private generateShortName(name: string): string {
    // Generate a short name (max 12 characters)
    if (name.length <= 12) return name;
    
    const words = name.split(' ');
    if (words.length > 1) {
      return words.map(w => w[0]).join('').toUpperCase();
    }
    
    return name.substring(0, 12);
  }

  private async extractThemeColor(files: FileMap): Promise<string> {
    // Look for CSS custom properties or common color patterns
    const cssFiles = Object.entries(files).filter(([path]) => 
      path.endsWith('.css') || path.endsWith('.scss')
    );
    
    for (const [, content] of cssFiles) {
      // Look for CSS custom properties like --primary-color
      const primaryColorMatch = content.match(/--primary-color:\s*([^;]+)/);
      if (primaryColorMatch) {
        return primaryColorMatch[1].trim();
      }
      
      // Look for common blue colors
      if (content.includes('#3b82f6') || content.includes('rgb(59, 130, 246)')) {
        return '#3b82f6';
      }
    }
    
    // Default to a nice blue
    return '#3b82f6';
  }
}

/**
 * Generates app icons from content analysis
 */
class IconGenerator {
  async generateFromApp(files: FileMap, projectName: string): Promise<Icon> {
    // Analyze project to determine icon style
    const hasReact = Object.keys(files).some(path => 
      path.includes('react') || path.endsWith('.jsx') || path.endsWith('.tsx')
    );
    
    const isGame = projectName.toLowerCase().includes('game') ||
                  Object.keys(files).some(path => path.includes('game'));
    
    const isTool = projectName.toLowerCase().includes('tool') ||
                  projectName.toLowerCase().includes('util');
    
    // Generate SVG icon based on project type
    const iconSvg = this.generateIconSvg(projectName, { hasReact, isGame, isTool });
    
    // Convert SVG to data URL
    const dataUrl = `data:image/svg+xml;base64,${btoa(iconSvg)}`;
    
    return {
      dataUrl,
      size: 256
    };
  }

  private generateIconSvg(
    name: string, 
    features: { hasReact: boolean; isGame: boolean; isTool: boolean }
  ): string {
    const firstLetter = name[0]?.toUpperCase() || 'A';
    
    let bgColor = '#3b82f6'; // Default blue
    let iconSymbol = firstLetter;
    
    if (features.hasReact) {
      bgColor = '#61dafb';
      iconSymbol = '⚛';
    } else if (features.isGame) {
      bgColor = '#f59e0b';
      iconSymbol = '🎮';
    } else if (features.isTool) {
      bgColor = '#10b981';
      iconSymbol = '🔧';
    }
    
    return `
      <svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="256" height="256" rx="32" fill="${bgColor}"/>
        <text x="128" y="140" font-family="system-ui, sans-serif" font-size="120" font-weight="bold" fill="white" text-anchor="middle">${iconSymbol}</text>
      </svg>
    `.trim();
  }
}

/**
 * Builds PWA manifests
 */
class ManifestBuilder {
  async build(config: Partial<PWAManifest>): Promise<PWAManifest> {
    return {
      name: config.name || 'Driver App',
      short_name: config.short_name || 'App',
      description: config.description || 'Built with Driver AI',
      start_url: config.start_url || '/',
      display: config.display || 'standalone',
      theme_color: config.theme_color || '#3b82f6',
      background_color: config.background_color || '#ffffff',
      icons: config.icons || {}
    };
  }
}

/**
 * Generates service workers for PWA functionality
 */
class ServiceWorkerGenerator {
  generate(config: {
    cacheName: string;
    precacheFiles: string[];
    offlineStrategy: 'cache-first' | 'network-first' | 'cache-only';
  }): string {
    return `
// Generated Service Worker for Driver App
const CACHE_NAME = '${config.cacheName}';
const PRECACHE_FILES = ${JSON.stringify(config.precacheFiles)};

// Install event - cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    ${this.getFetchStrategy(config.offlineStrategy)}
  );
});

// Optional: Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // Handle background sync operations
  console.log('Background sync triggered');
}
    `.trim();
  }

  private getFetchStrategy(strategy: string): string {
    switch (strategy) {
      case 'cache-first':
        return `
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
        `;
      
      case 'network-first':
        return `
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
        `;
      
      case 'cache-only':
        return `caches.match(event.request)`;
      
      default:
        return `fetch(event.request)`;
    }
  }
}