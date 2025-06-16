import type { 
  SignedApp, 
  XcodeProject, 
  OTADeployment 
} from '@/types';

/**
 * Over-The-Air Deployment System for iOS apps
 */
export class OTADeployer {
  private cdnBaseUrl = 'https://cdn.driver.dev';

  /**
   * Deploy a signed iOS app for OTA installation
   */
  async deployForOTA(
    signedApp: SignedApp,
    project: XcodeProject
  ): Promise<OTADeployment> {
    try {
      // Upload IPA to CDN
      const ipaUrl = await this.uploadFile(
        signedApp.ipa.content,
        `apps/${project.id}/${project.version}.ipa`,
        {
          contentType: 'application/octet-stream',
          cacheControl: 'max-age=31536000' // 1 year
        }
      );

      // Upload manifest
      const manifestUrl = await this.uploadFile(
        Buffer.from(signedApp.manifest),
        `apps/${project.id}/manifest.plist`,
        {
          contentType: 'application/xml',
          cacheControl: 'max-age=300' // 5 minutes
        }
      );

      // Generate install URL
      const installUrl = `itms-services://?action=download-manifest&url=${encodeURIComponent(manifestUrl)}`;

      // Generate QR code
      const qrCode = await this.generateQRCode(installUrl);

      // Create landing page
      const landingPage = this.createLandingPage({
        app: project,
        installUrl,
        requirements: this.getRequirements(project),
        qrCode
      });

      const landingUrl = await this.uploadFile(
        Buffer.from(landingPage),
        `apps/${project.id}/install.html`,
        {
          contentType: 'text/html',
          cacheControl: 'max-age=300' // 5 minutes
        }
      );

      return {
        installUrl,
        landingUrl,
        manifestUrl,
        ipaUrl,
        qrCode,
        expiresAt: this.calculateExpiry(project.signingInfo)
      };

    } catch (error) {
      console.error('OTA deployment failed:', error);
      throw new Error(`Failed to deploy app for OTA installation: ${error}`);
    }
  }

  /**
   * Upload file to CDN
   */
  private async uploadFile(
    content: ArrayBuffer | Buffer,
    path: string,
    options: {
      contentType: string;
      cacheControl: string;
    }
  ): Promise<string> {
    // In a real implementation, this would upload to:
    // - AWS S3
    // - Cloudflare R2
    // - Google Cloud Storage
    // - Azure Blob Storage
    
    // Simulate upload
    return new Promise((resolve) => {
      setTimeout(() => {
        const url = `${this.cdnBaseUrl}/${path}`;
        const size = content instanceof ArrayBuffer ? content.byteLength : content.length;
        console.log(`Uploaded file to: ${url}`, {
          size,
          contentType: options.contentType
        });
        resolve(url);
      }, 100);
    });
  }

  /**
   * Generate QR code for the install URL
   */
  private async generateQRCode(_url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Create a canvas to render the QR code
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Set canvas size
        canvas.width = 200;
        canvas.height = 200;

        // Generate QR code using a simple pattern (in real implementation, use proper QR library)
        // For now, return a data URL for a simple QR-like pattern
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 200, 200);
        ctx.fillStyle = '#ffffff';
        
        // Create a simple pattern
        for (let i = 0; i < 20; i++) {
          for (let j = 0; j < 20; j++) {
            if ((i + j) % 2 === 0) {
              ctx.fillRect(i * 10, j * 10, 10, 10);
            }
          }
        }

        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create the installation landing page
   */
  private createLandingPage(options: {
    app: XcodeProject;
    installUrl: string;
    requirements: string[];
    qrCode: string;
  }): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Install ${options.app.name}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .container {
            max-width: 400px;
            width: 100%;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
        }

        .app-icon {
            width: 120px;
            height: 120px;
            border-radius: 27px;
            margin: 0 auto 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            background: #3b82f6;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 60px;
        }

        h1 {
            font-size: 28px;
            margin: 0 0 10px;
            color: #1a1a1a;
        }

        .version {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
        }

        .install-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 18px 40px;
            border-radius: 30px;
            text-decoration: none;
            font-size: 18px;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            margin-bottom: 30px;
        }

        .install-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .install-button:active {
            transform: translateY(0);
        }

        .qr-section {
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 15px;
        }

        .qr-code {
            width: 160px;
            height: 160px;
            margin: 0 auto 15px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .qr-code img {
            width: 140px;
            height: 140px;
        }

        .qr-text {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }

        .requirements {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            text-align: left;
        }

        .requirements h3 {
            font-size: 16px;
            margin: 0 0 15px;
            color: #1a1a1a;
        }

        .requirements ul {
            margin: 0;
            padding: 0;
            list-style: none;
        }

        .requirements li {
            font-size: 14px;
            color: #666;
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }

        .requirements li:before {
            content: "•";
            color: #3b82f6;
            font-weight: bold;
            position: absolute;
            left: 0;
        }

        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 10px;
            padding: 15px;
            margin-top: 20px;
            font-size: 14px;
            color: #856404;
        }

        @media (max-width: 480px) {
            .container {
                padding: 30px 20px;
                margin: 10px;
            }
            
            .app-icon {
                width: 100px;
                height: 100px;
                font-size: 50px;
            }
            
            h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="app-icon">📱</div>
        <h1>${options.app.name}</h1>
        <p class="version">Version ${options.app.version}</p>
        
        <button onclick="installApp()" class="install-button">
            Install on iOS Device
        </button>
        
        <div class="qr-section">
            <p class="qr-text">Or scan with your iPhone camera:</p>
            <div class="qr-code">
                <img src="${options.qrCode}" alt="QR Code">
            </div>
            <p style="font-size: 12px; color: #999;">Point your camera at the QR code to install</p>
        </div>

        <div class="requirements">
            <h3>Requirements:</h3>
            <ul>
                ${options.requirements.map(req => `<li>${req}</li>`).join('')}
            </ul>
        </div>

        <div class="warning">
            <strong>Note:</strong> This app is not distributed through the App Store. 
            You may need to trust the developer certificate in Settings > General > 
            VPN & Device Management after installation.
        </div>
    </div>

    <script>
        function installApp() {
            // Check if we're on iOS
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            
            if (!isIOS) {
                alert('This installation method only works on iOS devices. Please open this page on your iPhone or iPad.');
                return;
            }
            
            // Redirect to install URL
            window.location.href = '${options.installUrl}';
        }

        // Auto-detect device and show appropriate message
        window.addEventListener('load', function() {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const button = document.querySelector('.install-button');
            
            if (!isIOS) {
                button.style.background = '#ccc';
                button.style.cursor = 'not-allowed';
                button.textContent = 'iOS Device Required';
            }
        });
    </script>
</body>
</html>`;
  }

  /**
   * Get installation requirements
   */
  private getRequirements(project: XcodeProject): string[] {
    const requirements = [
      `iOS ${this.extractiOSVersion(project.infoPlist)} or later`,
      'Device must be registered with Apple ID',
      'Internet connection required for installation'
    ];

    if (project.signingInfo.certificate.type === 'personal') {
      requirements.push('Certificate expires in 7 days - reinstall required');
    }

    return requirements;
  }

  /**
   * Extract iOS version from Info.plist
   */
  private extractiOSVersion(infoPlist: string): string {
    const versionMatch = infoPlist.match(/<key>UIMinimumOSVersion<\/key>\s*<string>([^<]+)<\/string>/);
    return versionMatch ? versionMatch[1] : '12.0';
  }

  /**
   * Calculate when the deployment expires
   */
  private calculateExpiry(signingInfo: any): Date {
    // Deployment expires when certificate expires
    const certExpiry = new Date(signingInfo.certificate.expiresAt);
    const profileExpiry = new Date(signingInfo.profile.expiresAt);
    
    // Return the earlier of the two
    return certExpiry < profileExpiry ? certExpiry : profileExpiry;
  }

  /**
   * Check if deployment is still valid
   */
  isDeploymentValid(deployment: OTADeployment): boolean {
    return new Date() < new Date(deployment.expiresAt);
  }

  /**
   * Get deployment status
   */
  getDeploymentStatus(deployment: OTADeployment): {
    isValid: boolean;
    expiresInDays: number;
    needsRenewal: boolean;
  } {
    const now = new Date();
    const expiry = new Date(deployment.expiresAt);
    const timeDiff = expiry.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return {
      isValid: daysDiff > 0,
      expiresInDays: daysDiff,
      needsRenewal: daysDiff <= 3 // Renew if expiring within 3 days
    };
  }
}