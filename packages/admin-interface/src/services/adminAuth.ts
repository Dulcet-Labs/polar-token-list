import { SuiClient } from '@mysten/sui.js/client';
import adminsData from '../data/admins.json';

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
  private admins: AdminUser[] = adminsData.admins;

  /**
   * Check if wallet address is authorized
   */
  isAuthorizedWallet(address: string): boolean {
    return this.admins.some(
      admin => admin.walletAddress.toLowerCase() === address.toLowerCase() && admin.isActive
    );
  }

  /**
   * Get admin info by wallet address
   */
  getAdminByWallet(address: string): AdminUser | null {
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
      if (!this.isAuthorizedWallet(walletAddress)) {
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
      const admin = this.getAdminByWallet(walletAddress);
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
   * Verify signature (placeholder for real implementation)
   */
  private async verifySignature(
    message: string,
    signature: string,
    walletAddress: string
  ): Promise<boolean> {
    // TODO: Implement actual signature verification using SUI SDK
    // This would involve:
    // 1. Recovering the public key from the signature
    // 2. Verifying the signature matches the message
    // 3. Confirming the public key corresponds to the wallet address
    
    // For now, return true if we have a signature
    return signature.length > 0;
  }

  /**
   * Get all authorized addresses
   */
  getAllAuthorizedAddresses(): string[] {
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