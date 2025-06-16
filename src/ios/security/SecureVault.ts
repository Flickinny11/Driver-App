/**
 * Secure storage vault for iOS credentials and certificates
 */
export class SecureVault {
  private crypto = window.crypto;
  private masterKey: CryptoKey | null = null;
  private storage: Storage;

  constructor() {
    this.storage = localStorage; // In production, use IndexedDB
  }

  /**
   * Initialize the vault with a master password
   */
  async initialize(password: string): Promise<void> {
    const encoder = new TextEncoder();
    const keyMaterial = await this.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const salt = this.crypto.getRandomValues(new Uint8Array(16));
    
    this.masterKey = await this.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Store salt for future use
    this.storage.setItem('vault-salt', Array.from(salt).join(','));
  }

  /**
   * Store encrypted data in the vault
   */
  async store(key: string, data: any): Promise<void> {
    if (!this.masterKey) throw new Error('Vault not initialized');
    
    const plaintext = JSON.stringify(data);
    const iv = this.crypto.getRandomValues(new Uint8Array(12));
    
    const ciphertext = await this.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.masterKey,
      new TextEncoder().encode(plaintext)
    );

    const encryptedData = {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(ciphertext))
    };

    this.storage.setItem(`vault-${key}`, JSON.stringify(encryptedData));
  }

  /**
   * Retrieve and decrypt data from the vault
   */
  async retrieve(key: string): Promise<any> {
    if (!this.masterKey) throw new Error('Vault not initialized');
    
    const storedData = this.storage.getItem(`vault-${key}`);
    if (!storedData) return null;

    const encryptedData = JSON.parse(storedData);
    const iv = new Uint8Array(encryptedData.iv);
    const ciphertext = new Uint8Array(encryptedData.data);

    const decrypted = await this.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.masterKey,
      ciphertext
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  }

  /**
   * Remove data from the vault
   */
  async remove(key: string): Promise<void> {
    this.storage.removeItem(`vault-${key}`);
  }

  /**
   * Check if the vault contains a key
   */
  has(key: string): boolean {
    return this.storage.getItem(`vault-${key}`) !== null;
  }

  /**
   * Clear all vault data
   */
  async clear(): Promise<void> {
    const keys = Object.keys(this.storage).filter(key => key.startsWith('vault-'));
    keys.forEach(key => this.storage.removeItem(key));
    this.masterKey = null;
  }
}