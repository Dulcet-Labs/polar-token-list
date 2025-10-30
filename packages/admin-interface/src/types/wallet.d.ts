declare module '@mysten/wallet-adapter-react' {
  export function useWallet(): {
    connect: (walletName: string) => Promise<void>;
    connected: boolean;
    account: { address: string } | null;
    wallets: any[];
    disconnect: () => Promise<void>;
  };
  
  export const WalletProvider: React.FC<{ children: React.ReactNode }>;
}

declare module '@mysten/wallet-adapter-wallet-standard' {
  export const WalletStandardAdapterProvider: React.FC<{ children: React.ReactNode }>;
}