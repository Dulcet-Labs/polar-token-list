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
 * Instructions for adding new admins to the system
 */
export const ADMIN_SETUP_INSTRUCTIONS = `
# How to Add New Admin Wallet Addresses

## Method 1: Edit the JSON file directly
1. Open: packages/admin-interface/src/data/admins.json
2. Add a new admin object to the "admins" array:

{
  "id": "admin-003",
  "walletAddress": "YOUR_SUI_WALLET_ADDRESS_HERE",
  "username": "your-username",
  "email": "your-email@polardex.com",
  "role": "admin",
  "permissions": ["token-management"],
  "createdAt": "2024-01-01T00:00:00Z",
  "isActive": true
}

## Method 2: Use environment variables (recommended for production)
1. Create/edit: packages/admin-interface/.env.local
2. Add: VITE_ADMIN_WALLET_ADDRESSES=address1,address2,address3
3. Add: VITE_ADMIN_USERNAMES=username1,username2,username3

## Getting Your SUI Wallet Address:
1. Install Sui Wallet extension
2. Create/import your wallet
3. Copy your wallet address (starts with 0x, 64 characters long)
4. Add it to the admin database

## Testing the Setup:
1. Add your wallet address to admins.json
2. Start the app: yarn dev
3. Connect with your wallet
4. Sign the authentication message
5. You should be logged into the admin dashboard

## Security Notes:
- Never commit real wallet addresses to public repositories
- Use environment variables for production
- Each admin must sign a message to prove wallet ownership
- Admins can be deactivated by setting "isActive": false
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