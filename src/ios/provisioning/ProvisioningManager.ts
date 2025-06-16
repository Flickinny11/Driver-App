import type { 
  AppleAccount, 
  SigningCertificate, 
  ProvisioningProfile,
  SigningInfo
} from '@/types';
import { SecureVault } from '../security/SecureVault';

/**
 * Provisioning Profile Management for iOS app deployment
 */
export class ProvisioningManager {
  private vault: SecureVault;

  constructor(vault: SecureVault) {
    this.vault = vault;
  }

  /**
   * Create a provisioning profile for an app
   */
  async createProvisioningProfile(
    account: AppleAccount,
    appId: string,
    certificate: SigningCertificate
  ): Promise<ProvisioningProfile> {
    const bundleId = this.generateBundleId(appId);

    if (account.isDeveloperAccount && certificate.type !== 'personal') {
      return await this.createDeveloperProfile(account, bundleId, certificate);
    } else {
      return await this.createPersonalProfile(bundleId, certificate);
    }
  }

  /**
   * Get all provisioning profiles for an account
   */
  async getProfiles(account: AppleAccount): Promise<ProvisioningProfile[]> {
    try {
      const profiles = await this.vault.retrieve(`profiles-${account.id}`);
      return profiles || [];
    } catch (error) {
      console.error('Failed to retrieve profiles:', error);
      return [];
    }
  }

  /**
   * Get a specific provisioning profile
   */
  async getProfile(profileId: string): Promise<ProvisioningProfile | null> {
    try {
      return await this.vault.retrieve(`profile-${profileId}`);
    } catch (error) {
      console.error('Failed to retrieve profile:', error);
      return null;
    }
  }

  /**
   * Create signing info for an app
   */
  async createSigningInfo(
    account: AppleAccount,
    appId: string,
    certificate: SigningCertificate
  ): Promise<SigningInfo> {
    const profile = await this.createProvisioningProfile(account, appId, certificate);
    
    return {
      bundleId: profile.bundleId,
      teamId: account.teamId || 'Personal Team',
      certificate,
      profile
    };
  }

  /**
   * Generate a unique bundle identifier
   */
  private generateBundleId(appId: string): string {
    // Sanitize app ID for bundle identifier
    const sanitized = appId
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
    
    return `com.driver.${sanitized}.${Date.now().toString(36)}`;
  }

  /**
   * Create a developer provisioning profile using App Store Connect API
   */
  private async createDeveloperProfile(
    account: AppleAccount,
    bundleId: string,
    certificate: SigningCertificate
  ): Promise<ProvisioningProfile> {
    // First, register the App ID
    const appIdResponse = await this.registerAppId(bundleId, account);
    
    // Get registered devices
    const devices = await this.getRegisteredDevices(account);
    
    // Create the provisioning profile
    const profileType = devices.length > 0 ? 'ad-hoc' : 'distribution';
    
    const profile: ProvisioningProfile = {
      id: `profile-${Date.now()}`,
      name: `Driver Profile ${bundleId}`,
      bundleId,
      content: await this.generateProfileContent({
        bundleId,
        certificate,
        devices,
        type: profileType as 'ad-hoc' | 'distribution'
      }),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      devices,
      type: profileType as 'ad-hoc' | 'distribution'
    };

    // Store the profile
    await this.storeProfile(account, profile);

    return profile;
  }

  /**
   * Create a personal provisioning profile (wildcard)
   */
  private async createPersonalProfile(
    bundleId: string,
    certificate: SigningCertificate
  ): Promise<ProvisioningProfile> {
    // Personal profiles use wildcard bundle ID
    const wildcardBundleId = 'com.driver.personal.*';
    
    const profile: ProvisioningProfile = {
      id: `personal-profile-${Date.now()}`,
      name: 'Personal Team Provisioning Profile',
      bundleId: wildcardBundleId,
      content: await this.generateProfileContent({
        bundleId: wildcardBundleId,
        certificate,
        devices: ['*'], // All devices
        type: 'development'
      }),
      expiresAt: certificate.expiresAt, // Same as certificate
      devices: ['*'],
      type: 'development'
    };

    return profile;
  }

  /**
   * Register an App ID with Apple
   */
  private async registerAppId(
    bundleId: string,
    account: AppleAccount
  ): Promise<any> {
    // In a real implementation, this would use App Store Connect API
    // POST /v1/bundleIds
    
    console.log(`Registering App ID: ${bundleId} for team: ${account.teamId}`);
    
    return {
      id: `appid-${Date.now()}`,
      attributes: {
        identifier: bundleId,
        name: `Driver App ${bundleId}`,
        platform: 'IOS'
      }
    };
  }

  /**
   * Get registered devices for the developer account
   */
  private async getRegisteredDevices(account: AppleAccount): Promise<string[]> {
    // In a real implementation, this would fetch from App Store Connect API
    // GET /v1/devices
    
    // Mock implementation - return some test devices
    if (import.meta.env.DEV) {
      return [
        '12345678-1234567890ABCDEF', // Test iPhone
        '87654321-FEDCBA0987654321'  // Test iPad
      ];
    }
    
    return [];
  }

  /**
   * Generate provisioning profile content
   */
  private async generateProfileContent(config: {
    bundleId: string;
    certificate: SigningCertificate;
    devices: string[];
    type: string;
  }): Promise<string> {
    // In a real implementation, this would generate a proper
    // .mobileprovision file content (binary plist format)
    
    const profileData = {
      UUID: this.generateUUID(),
      Name: `Driver Profile ${config.bundleId}`,
      TeamName: 'Driver Development Team',
      TeamIdentifier: ['TEAM123456'],
      AppIDName: `Driver App ${config.bundleId}`,
      ApplicationIdentifierPrefix: ['TEAM123456'],
      CreationDate: new Date(),
      ExpirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      Entitlements: {
        'application-identifier': `TEAM123456.${config.bundleId}`,
        'team-identifier': 'TEAM123456',
        'keychain-access-groups': [`TEAM123456.${config.bundleId}`],
        'get-task-allow': config.type === 'development'
      },
      ProvisionedDevices: config.devices.filter(d => d !== '*'),
      DeveloperCertificates: [
        this.base64Encode(config.certificate.serialNumber)
      ],
      Version: 1
    };

    // In reality, this would be encoded as a binary plist
    // For demo purposes, we'll use base64 encoded JSON
    return btoa(JSON.stringify(profileData, null, 2));
  }

  /**
   * Store a provisioning profile
   */
  private async storeProfile(
    account: AppleAccount,
    profile: ProvisioningProfile
  ): Promise<void> {
    // Store individual profile
    await this.vault.store(`profile-${profile.id}`, profile);
    
    // Update account's profiles list
    try {
      let profiles = await this.vault.retrieve(`profiles-${account.id}`) || [];
      
      // Remove any existing profile with the same ID
      profiles = profiles.filter((p: ProvisioningProfile) => p.id !== profile.id);
      
      // Add the new profile
      profiles.push(profile);
      
      // Store updated list
      await this.vault.store(`profiles-${account.id}`, profiles);
    } catch (error) {
      console.error('Failed to update account profiles:', error);
    }
  }

  /**
   * Generate a UUID for the provisioning profile
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }).toUpperCase();
  }

  /**
   * Base64 encode a string
   */
  private base64Encode(str: string): string {
    return btoa(str);
  }

  /**
   * Check if a profile is expired or needs renewal
   */
  checkProfileStatus(profile: ProvisioningProfile): {
    isExpired: boolean;
    expiresInDays: number;
    needsRenewal: boolean;
  } {
    const now = new Date();
    const expiry = new Date(profile.expiresAt);
    const timeDiff = expiry.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return {
      isExpired: daysDiff <= 0,
      expiresInDays: daysDiff,
      needsRenewal: daysDiff <= 30 // Renew if expiring within 30 days
    };
  }

  /**
   * Remove a provisioning profile
   */
  async removeProfile(profileId: string): Promise<void> {
    await this.vault.remove(`profile-${profileId}`);
  }
}