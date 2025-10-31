// Utility functions for managing admin database
// In production, this would be replaced with actual database operations

import type { AdminUser } from '../services/adminAuth';

export interface NewAdminData {
    walletAddress: string;
    username: string;
    email: string;
    role: 'super-admin' | 'admin' | 'moderator';
    permissions: string[];
}

/**
 * Admin setup information (for authorized team members only)
 */
export const ADMIN_SETUP_INSTRUCTIONS = `
# Admin Access Management

Admin access is restricted to authorized PolarDEX team members only.

## For Core Team Members:
- Admin wallet addresses are managed through secure environment variables
- Contact the technical team for admin access setup
- Never commit sensitive wallet addresses to public repositories

## Security Notes:
- All admin access is invitation-only
- Each admin must sign a message to prove wallet ownership
- Admins can be deactivated by the core team
- Regular access audits are performed
`;

/**
 * Validate SUI wallet address format
 */
export const isValidSuiAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
};

/**
 * Generate new admin ID
 */
export const generateAdminId = (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `admin-${timestamp}-${random}`;
};

/**
 * Create new admin object
 */
export const createNewAdmin = (data: NewAdminData): AdminUser => {
    if (!isValidSuiAddress(data.walletAddress)) {
        throw new Error('Invalid SUI wallet address format');
    }

    return {
        id: generateAdminId(),
        walletAddress: data.walletAddress,
        username: data.username,
        email: data.email,
        role: data.role,
        permissions: data.permissions,
        createdAt: new Date().toISOString(),
        isActive: true
    };
};

/**
 * Print setup instructions to console
 */
export const printSetupInstructions = () => {
    console.log(ADMIN_SETUP_INSTRUCTIONS);
};