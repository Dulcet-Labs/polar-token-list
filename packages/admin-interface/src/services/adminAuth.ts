
export interface AdminUser {
  id: string;
  walletAddress: string;
  username: string;
  email: string;
  role: 'super-admin' | 'admin' | 'moderator';
  permissions: string[];
  createdAt: string;
  isActive: boolean;
}

export interface AuthenticationResult {
  success: boolean;
  admin?: AdminUser;
  error?: string;
}

class AdminAuthService {
  private admins: AdminUser[] = [];
  private adminsLoaded = false;

  /**
   * Ensure admins are loaded
   */
  private async ensureAdminsLoaded(): Promise<void> {
    if (!this.adminsLoaded) {
      this.admins = await this.loadAdmins();
      this.adminsLoaded = true;
    }
  }

  /**
   * Load admins from environment variables or fallback to JSON file
   */
  private async loadAdmins(): Promise<AdminUser[]> {
    // Try to load from environment variables first
    const envAddresses = import.meta.env.VITE_ADMIN_WALLET_ADDRESSES;
    const envUsernames = import.meta.env.VITE_ADMIN_USERNAMES;
    const envEmails = import.meta.env.VITE_ADMIN_EMAILS;
    const envRoles = import.meta.env.VITE_ADMIN_ROLES;

    if (envAddresses) {
      const addresses = envAddresses.split(',').map((addr: string) => addr.trim());
      const usernames = envUsernames ? envUsernames.split(',').map((name: string) => name.trim()) : [];
      const emails = envEmails ? envEmails.split(',').map((email: string) => email.trim()) : [];
      const roles = envRoles ? envRoles.split(',').map((role: string) => role.trim()) : [];

      return addresses.map((address: string, index: number) => ({
        id: `env-admin-${index + 1}`,
        walletAddress: address,
        username: usernames[index] || `Admin${index + 1}`,
        email: emails[index] || '',
        role: (roles[index] as 'super-admin' | 'admin' | 'moderator') || 'admin',
        permissions: ['token-management', 'revenue-view', 'dex-metrics'],
        createdAt: new Date().toISOString(),
        isActive: true
      }));
    }

    // Fallback to JSON file for development
    try {
      const adminsData = await import('../data/admins.json');
      return adminsData.default.admins as AdminUser[];
    } catch (error) {
      console.warn('Could not load admins.json, using empty admin list');
      return [];
    }
  }

  /**
   * Check if wallet address is authorized
   */
  async isAuthorizedWallet(address: string): Promise<boolean> {
    await this.ensureAdminsLoaded();
    return this.admins.some(
      admin => admin.walletAddress.toLowerCase() === address.toLowerCase() && admin.isActive
    );
  }

  /**
   * Get admin info by wallet address
   */
  async getAdminByWallet(address: string): Promise<AdminUser | null> {
    await this.ensureAdminsLoaded();
    return this.admins.find(
      admin => admin.walletAddress.toLowerCase() === address.toLowerCase() && admin.isActive
    ) || null;
  }

  /**
   * Generate authentication message for signing
   */
  generateAuthMessage(walletAddress: string): string {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 15);

    return `PolarDEX Admin Authentication

Wallet: ${walletAddress}
Timestamp: ${timestamp}
Nonce: ${nonce}

By signing this message, you confirm that you own this wallet and are authorized to access the PolarDEX admin panel.

This request will not trigger any blockchain transaction or cost any gas fees.`;
  }

  /**
   * Authenticate admin with wallet signature
   */
  async authenticateAdmin(
    walletAddress: string,
    signMessage: (message: Uint8Array) => Promise<{ signature: string }>
  ): Promise<AuthenticationResult> {
    try {
      // Check if wallet is authorized
      if (!(await this.isAuthorizedWallet(walletAddress))) {
        return {
          success: false,
          error: 'Wallet address not authorized for admin access'
        };
      }

      // Generate message to sign
      const message = this.generateAuthMessage(walletAddress);
      const messageBytes = new TextEncoder().encode(message);

      // Request signature from wallet
      const { signature } = await signMessage(messageBytes);

      // In a real implementation, you would verify the signature here
      // For now, we'll assume the signature is valid if we get one
      if (!signature) {
        return {
          success: false,
          error: 'Failed to get wallet signature'
        };
      }

      // Get admin info
      const admin = await this.getAdminByWallet(walletAddress);
      if (!admin) {
        return {
          success: false,
          error: 'Admin not found'
        };
      }

      return {
        success: true,
        admin
      };

    } catch (error: any) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: error.message || 'Authentication failed'
      };
    }
  }



  /**
   * Get all authorized addresses
   */
  async getAllAuthorizedAddresses(): Promise<string[]> {
    await this.ensureAdminsLoaded();
    return this.admins
      .filter(admin => admin.isActive)
      .map(admin => admin.walletAddress);
  }

  /**
   * Check if admin has specific permission
   */
  hasPermission(admin: AdminUser, permission: string): boolean {
    return admin.permissions.includes(permission) || admin.role === 'super-admin';
  }
}

export const adminAuthService = new AdminAuthService();