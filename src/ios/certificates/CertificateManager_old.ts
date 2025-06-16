import type { 
  AppleAccount, 
  SigningCertificate, 
  CertificateType 
} from '@/types';
import { SecureVault } from '../security/SecureVault';

/**
 * Certificate Management System for iOS app signing
 */
export class CertificateManager {
  private vault: SecureVault;

  constructor(vault: SecureVault) {
    this.vault = vault;
  }

  /**
   * Create a new signing certificate
   */
  async createSigningCertificate(
    account: AppleAccount,
    type: CertificateType
  ): Promise<SigningCertificate> {
    try {
      if (account.isDeveloperAccount && type !== 'personal') {
        return await this.createDeveloperCertificate(account, type);
      } else {
        return await this.createPersonalSigningCertificate(account);
      }
    } catch (error) {
      console.error('Failed to create signing certificate:', error);
      throw new Error(`Failed to create ${type} certificate: ${error}`);
    }
  }

  /**
   * Get all certificates for an account
   */
  async getCertificates(account: AppleAccount): Promise<SigningCertificate[]> {
    try {
      const certificates = await this.vault.retrieve(`certificates-${account.id}`);
      return certificates || [];
    } catch (error) {
      console.error('Failed to retrieve certificates:', error);
      return [];
    }
  }

  /**
   * Get a specific certificate by ID
   */
  async getCertificate(certId: string): Promise<SigningCertificate | null> {
    try {
      return await this.vault.retrieve(`cert-${certId}`);
    } catch (error) {
      console.error('Failed to retrieve certificate:', error);
      return null;
    }
  }

  /**
   * Remove a certificate
   */
  async removeCertificate(certId: string): Promise<void> {
    await this.vault.remove(`cert-${certId}`);
  }

  /**
   * Check if a certificate is expired or needs renewal
   */
  checkCertificateStatus(certificate: SigningCertificate): {
    isExpired: boolean;
    expiresInDays: number;
    needsRenewal: boolean;
  } {
    const now = new Date();
    const expiry = new Date(certificate.expiresAt);
    const timeDiff = expiry.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return {
      isExpired: daysDiff <= 0,
      expiresInDays: daysDiff,
      needsRenewal: daysDiff <= 7 // Renew if expiring within 7 days
    };
  }

  /**
   * Renew a personal signing certificate
   */
  async renewPersonalCertificate(
    account: AppleAccount,
    oldCertId: string
  ): Promise<SigningCertificate> {
    // Remove old certificate
    await this.removeCertificate(oldCertId);
    
    // Create new personal certificate
    return await this.createPersonalSigningCertificate(account);
  }

  /**
   * Create a developer certificate using App Store Connect API
   */
  private async createDeveloperCertificate(
    account: AppleAccount,
    type: CertificateType
  ): Promise<SigningCertificate> {
    // Generate private key
    const privateKey = await this.generatePrivateKey();
    
    // Create Certificate Signing Request (CSR)
    const csr = await this.createCSR(privateKey, account);
    
    // In a real implementation, this would use App Store Connect API
    const certificate = await this.submitCSRToApple(csr, type, account);
    
    // Store certificate and private key securely
    const certId = `cert-${certificate.id}`;
    await this.vault.store(certId, {
      certificate,
      privateKey: await this.exportPrivateKey(privateKey),
      type: 'developer'
    });

    // Update account certificates list
    await this.updateAccountCertificates(account, certificate);

    return certificate;
  }

  /**
   * Create a personal signing certificate (7-day expiry)
   */
  private async createPersonalSigningCertificate(
    account: AppleAccount
  ): Promise<SigningCertificate> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

    const certificate: SigningCertificate = {
      id: `personal-cert-${Date.now()}`,
      name: `${account.name} (Personal Team)`,
      serialNumber: this.generateSerialNumber(),
      type: 'personal',
      expiresAt,
      canRenew: true,
      isActive: true
    };

    // Generate private key for personal signing
    const privateKey = await this.generatePrivateKey();
    
    // Create self-signed certificate
    const certData = await this.createSelfSignedCertificate(privateKey, account);
    
    // Store certificate securely
    const certId = `cert-${certificate.id}`;
    await this.vault.store(certId, {
      certificate,
      privateKey: await this.exportPrivateKey(privateKey),
      certData,
      type: 'personal'
    });

    // Schedule auto-renewal
    this.scheduleRenewal(certificate, account);

    // Update account certificates list
    await this.updateAccountCertificates(account, certificate);

    return certificate;
  }

  /**
   * Generate a private key for certificate signing
   */
  private async generatePrivateKey(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
      {
        name: 'RSA-PSS',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify']
    );
  }

  /**
   * Create a Certificate Signing Request (CSR)
   */
  private async createCSR(privateKey: CryptoKeyPair, account: AppleAccount): Promise<string> {
    // In a real implementation, this would create a proper PKCS#10 CSR
    // For now, we'll return a mock CSR
    
    const publicKey = await this.exportPublicKey(privateKey.publicKey);
    
    return btoa(JSON.stringify({
      commonName: account.email,
      organizationalUnit: 'iPhone Developer',
      organization: account.teamName || 'Personal Team',
      country: 'US',
      publicKey
    }));
  }

  /**
   * Submit CSR to Apple and get certificate
   */
  private async submitCSRToApple(
    _csr: string, 
    type: CertificateType, 
    _account: AppleAccount
  ): Promise<SigningCertificate> {
    // In a real implementation, this would use App Store Connect API
    // POST /v1/certificates with the CSR
    
    // Mock implementation
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year expiry

    return {
      id: `developer-cert-${Date.now()}`,
      name: `${type} Certificate`,
      serialNumber: this.generateSerialNumber(),
      type,
      expiresAt,
      canRenew: false,
      isActive: true
    };
  }

  /**
   * Create a self-signed certificate for personal signing
   */
  private async createSelfSignedCertificate(
    privateKey: CryptoKeyPair,
    account: AppleAccount
  ): Promise<string> {
    // In a real implementation, this would create a proper X.509 certificate
    // For now, we'll return a mock certificate
    
    const publicKey = await this.exportPublicKey(privateKey.publicKey);
    
    return btoa(JSON.stringify({
      subject: {
        commonName: `${account.name} (Personal Team)`,
        organizationalUnit: 'iPhone Developer',
        organization: 'Personal Team',
        country: 'US'
      },
      publicKey,
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
  }

  /**
   * Export private key for storage
   */
  private async exportPrivateKey(privateKey: CryptoKeyPair): Promise<string> {
    const exported = await crypto.subtle.exportKey('pkcs8', privateKey.privateKey);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  /**
   * Export public key
   */
  private async exportPublicKey(publicKey: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('spki', publicKey);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  /**
   * Generate a certificate serial number
   */
  private generateSerialNumber(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  /**
   * Schedule automatic renewal for personal certificates
   */
  private scheduleRenewal(certificate: SigningCertificate, account: AppleAccount): void {
    if (certificate.type !== 'personal') return;

    const renewTime = new Date(certificate.expiresAt);
    renewTime.setDate(renewTime.getDate() - 1); // Renew 1 day before expiry

    const timeUntilRenewal = renewTime.getTime() - Date.now();

    if (timeUntilRenewal > 0) {
      setTimeout(async () => {
        try {
          console.log(`Auto-renewing certificate ${certificate.id}`);
          await this.renewPersonalCertificate(account, certificate.id);
          
          // Notify user
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Certificate Renewed', {
              body: 'Your personal signing certificate has been automatically renewed.',
              icon: '/favicon.ico'
            });
          }
        } catch (error) {
          console.error('Failed to auto-renew certificate:', error);
        }
      }, timeUntilRenewal);
    }
  }

  /**
   * Update account's certificates list
   */
  private async updateAccountCertificates(
    account: AppleAccount,
    newCertificate: SigningCertificate
  ): Promise<void> {
    try {
      let certificates = await this.vault.retrieve(`certificates-${account.id}`) || [];
      
      // Remove any existing certificate with the same ID
      certificates = certificates.filter((cert: SigningCertificate) => cert.id !== newCertificate.id);
      
      // Add the new certificate
      certificates.push(newCertificate);
      
      // Store updated list
      await this.vault.store(`certificates-${account.id}`, certificates);
    } catch (error) {
      console.error('Failed to update account certificates:', error);
    }
  }
}