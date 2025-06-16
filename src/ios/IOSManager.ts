import type { 
  AppleAccount, 
  FileMap, 
  OTADeployment,
  CertificateType
} from '@/types';
import { AppleAuthManager } from './auth/AppleAuthManager';
import { CertificateManager } from './certificates/CertificateManager';
import { ProvisioningManager } from './provisioning/ProvisioningManager';
import { XcodeProjectBuilder } from './build/XcodeProjectBuilder';
import { CloudSigner } from './signing/CloudSigner';
import { OTADeployer } from './deployment/OTADeployer';
import { SecureVault } from './security/SecureVault';

/**
 * Integrated iOS Manager that orchestrates the entire iOS app signing and deployment process
 */
export class IOSManager {
  private authManager: AppleAuthManager;
  private certificateManager: CertificateManager;
  private provisioningManager: ProvisioningManager;
  private projectBuilder: XcodeProjectBuilder;
  private cloudSigner: CloudSigner;
  private otaDeployer: OTADeployer;
  private vault: SecureVault;
  private initialized = false;

  constructor() {
    this.vault = new SecureVault();
    this.authManager = new AppleAuthManager();
    this.certificateManager = new CertificateManager(this.vault);
    this.provisioningManager = new ProvisioningManager(this.vault);
    this.projectBuilder = new XcodeProjectBuilder();
    this.cloudSigner = new CloudSigner();
    this.otaDeployer = new OTADeployer();
  }

  /**
   * Initialize the iOS Manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.authManager.initialize();
      this.initialized = true;
      console.log('iOS Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize iOS Manager:', error);
      throw error;
    }
  }

  /**
   * Connect Apple account
   */
  async connectAppleAccount(): Promise<AppleAccount> {
    await this.ensureInitialized();
    return await this.authManager.initiateAppleSignIn();
  }

  /**
   * Get current connected Apple account
   */
  getCurrentAccount(): AppleAccount | null {
    return this.authManager.getCurrentAccount();
  }

  /**
   * Disconnect Apple account
   */
  async disconnectAccount(): Promise<void> {
    await this.authManager.disconnect();
  }

  /**
   * Complete iOS app build, sign, and deployment process
   */
  async buildAndDeployiOSApp(
    app: {
      name: string;
      files: FileMap;
      icon?: string;
      url?: string;
    },
    options?: {
      certificateType?: CertificateType;
      onProgress?: (stage: string, progress: number) => void;
    }
  ): Promise<OTADeployment> {
    await this.ensureInitialized();

    const account = this.getCurrentAccount();
    if (!account) {
      throw new Error('Apple account not connected');
    }

    const onProgress = options?.onProgress || (() => {});

    try {
      // Step 1: Get or create signing certificate
      onProgress('Preparing certificate...', 10);
      const certificate = await this.getOrCreateCertificate(
        account,
        options?.certificateType || (account.isDeveloperAccount ? 'IOS_DEVELOPMENT' : 'personal')
      );

      // Step 2: Create provisioning profile
      onProgress('Creating provisioning profile...', 25);
      const signingInfo = await this.provisioningManager.createSigningInfo(
        account,
        app.name,
        certificate
      );

      // Step 3: Build Xcode project
      onProgress('Building Xcode project...', 40);
      const project = await this.projectBuilder.buildIOSApp(app, {
        signingIdentity: signingInfo.certificate.id,
        provisioningProfile: signingInfo.profile.id
      });

      // Step 4: Sign the app
      onProgress('Signing app...', 65);
      const signedApp = await this.cloudSigner.signApp(
        project,
        signingInfo.certificate,
        signingInfo.profile
      );

      // Step 5: Deploy for OTA installation
      onProgress('Deploying for installation...', 85);
      const deployment = await this.otaDeployer.deployForOTA(signedApp, project);

      onProgress('Deployment complete!', 100);
      return deployment;

    } catch (error) {
      console.error('iOS build and deployment failed:', error);
      throw new Error(`iOS deployment failed: ${error}`);
    }
  }

  /**
   * Get or create a signing certificate
   */
  private async getOrCreateCertificate(
    account: AppleAccount,
    type: CertificateType
  ) {
    // Check for existing valid certificates
    const certificates = await this.certificateManager.getCertificates(account);
    const validCert = certificates.find(cert => 
      cert.type === type && 
      cert.isActive &&
      !this.certificateManager.checkCertificateStatus(cert).isExpired
    );

    if (validCert) {
      console.log('Using existing certificate:', validCert.name);
      return validCert;
    }

    // Create new certificate
    console.log('Creating new certificate of type:', type);
    return await this.certificateManager.createSigningCertificate(account, type);
  }

  /**
   * Get certificates for the current account
   */
  async getCertificates() {
    const account = this.getCurrentAccount();
    if (!account) return [];

    return await this.certificateManager.getCertificates(account);
  }

  /**
   * Get provisioning profiles for the current account
   */
  async getProvisioningProfiles() {
    const account = this.getCurrentAccount();
    if (!account) return [];

    return await this.provisioningManager.getProfiles(account);
  }

  /**
   * Renew an expired personal certificate
   */
  async renewPersonalCertificate(certId: string) {
    const account = this.getCurrentAccount();
    if (!account) {
      throw new Error('No Apple account connected');
    }

    return await this.certificateManager.renewPersonalCertificate(account, certId);
  }

  /**
   * Check deployment status
   */
  checkDeploymentStatus(deployment: OTADeployment) {
    return this.otaDeployer.getDeploymentStatus(deployment);
  }

  /**
   * Get build status from cloud signer
   */
  getBuildStatus(buildId: string) {
    return this.cloudSigner.getBuildStatus(buildId);
  }

  /**
   * Check if account can sign apps
   */
  canSignApps(): boolean {
    const account = this.getCurrentAccount();
    return account?.canSignApps || false;
  }

  /**
   * Get account capabilities summary
   */
  getAccountCapabilities() {
    const account = this.getCurrentAccount();
    if (!account) {
      return {
        connected: false,
        canSign: false,
        accountType: null,
        certificateExpiry: null,
        limitations: []
      };
    }

    const limitations = [];
    
    if (!account.isDeveloperAccount) {
      limitations.push('7-day certificate expiry');
      limitations.push('Reinstallation required weekly');
      limitations.push('Development builds only');
    }

    return {
      connected: true,
      canSign: account.canSignApps,
      accountType: account.isDeveloperAccount ? 'developer' : 'personal',
      teamId: account.teamId,
      teamName: account.teamName,
      certificateCount: account.certificates?.length || 0,
      limitations
    };
  }

  /**
   * Setup automatic certificate renewal for personal accounts
   */
  async setupAutoRenewal() {
    const account = this.getCurrentAccount();
    if (!account || account.isDeveloperAccount) {
      return; // Only needed for personal accounts
    }

    // The CertificateManager already handles auto-renewal
    // This method is here for explicit setup if needed
    console.log('Auto-renewal is already configured for personal certificates');
  }

  /**
   * Clean up expired certificates and profiles
   */
  async cleanupExpiredCredentials() {
    const account = this.getCurrentAccount();
    if (!account) return;

    const certificates = await this.certificateManager.getCertificates(account);
    const profiles = await this.provisioningManager.getProfiles(account);

    // Remove expired certificates
    for (const cert of certificates) {
      const status = this.certificateManager.checkCertificateStatus(cert);
      if (status.isExpired) {
        await this.certificateManager.removeCertificate(cert.id);
        console.log('Removed expired certificate:', cert.name);
      }
    }

    // Remove expired profiles
    for (const profile of profiles) {
      const status = this.provisioningManager.checkProfileStatus(profile);
      if (status.isExpired) {
        await this.provisioningManager.removeProfile(profile.id);
        console.log('Removed expired profile:', profile.name);
      }
    }
  }

  /**
   * Ensure the manager is initialized
   */
  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get signing info for an app
   */
  async getSigningInfo(appName: string) {
    const account = this.getCurrentAccount();
    if (!account) {
      throw new Error('Apple account not connected');
    }

    const certificate = await this.getOrCreateCertificate(
      account,
      account.isDeveloperAccount ? 'IOS_DEVELOPMENT' : 'personal'
    );

    return await this.provisioningManager.createSigningInfo(
      account,
      appName,
      certificate
    );
  }

  /**
   * Validate that everything is ready for iOS signing
   */
  async validateSigningReadiness(): Promise<{
    ready: boolean;
    issues: string[];
    account?: AppleAccount;
  }> {
    const issues: string[] = [];
    const account = this.getCurrentAccount();

    if (!account) {
      issues.push('Apple account not connected');
      return { ready: false, issues };
    }

    if (!account.canSignApps) {
      issues.push('Account cannot sign apps');
    }

    const certificates = await this.certificateManager.getCertificates(account);
    const validCerts = certificates.filter(cert => {
      const status = this.certificateManager.checkCertificateStatus(cert);
      return cert.isActive && !status.isExpired;
    });

    if (validCerts.length === 0 && !account.isDeveloperAccount) {
      // Personal accounts can create certificates on demand
      console.log('No valid certificates found, but personal account can create them on demand');
    }

    return {
      ready: issues.length === 0,
      issues,
      account
    };
  }
}