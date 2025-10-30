// Admin configuration
export interface AdminConfig {
  address: string;
  username?: string;
  role?: 'super-admin' | 'admin' | 'moderator';
}

// Get admin addresses from environment variables or fallback to config
const getAdminAddressesFromEnv = (): string[] => {
  const envAddresses = import.meta.env.VITE_ADMIN_WALLET_ADDRESSES;
  if (envAddresses) {
    return envAddresses.split(',').map((addr: string) => addr.trim());
  }
  return [];
};

const getAdminUsernamesFromEnv = (): string[] => {
  const envUsernames = import.meta.env.VITE_ADMIN_USERNAMES;
  if (envUsernames) {
    return envUsernames.split(',').map((name: string) => name.trim());
  }
  return [];
};

// Fallback admin configuration (for development)
const fallbackAdmins: AdminConfig[] = [
  {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    username: 'dev-admin',
    role: 'super-admin'
  }
  // Add more fallback admins here if needed
];

// Main admin configuration
export const getAdminConfig = (): AdminConfig[] => {
  const envAddresses = getAdminAddressesFromEnv();
  const envUsernames = getAdminUsernamesFromEnv();
  
  if (envAddresses.length > 0) {
    // Use environment variables
    return envAddresses.map((address, index) => ({
      address,
      username: envUsernames[index] || `admin-${index + 1}`,
      role: index === 0 ? 'super-admin' : 'admin' as const
    }));
  }
  
  // Fallback to hardcoded config for development
  return fallbackAdmins;
};

// Helper functions
export const isAuthorizedAdmin = (address: string): boolean => {
  const admins = getAdminConfig();
  return admins.some(admin => admin.address.toLowerCase() === address.toLowerCase());
};

export const getAdminInfo = (address: string): AdminConfig | null => {
  const admins = getAdminConfig();
  return admins.find(admin => admin.address.toLowerCase() === address.toLowerCase()) || null;
};

export const getAllAuthorizedAddresses = (): string[] => {
  return getAdminConfig().map(admin => admin.address);
};