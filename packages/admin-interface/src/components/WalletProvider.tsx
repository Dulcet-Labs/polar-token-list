import React from 'react';
import { WalletProvider as SuiWalletProvider } from '@mysten/wallet-adapter-react';
import { WalletStandardAdapterProvider } from '@mysten/wallet-adapter-wallet-standard';

interface WalletProviderProps {
  children: React.ReactNode;
}

const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  return (
    <WalletStandardAdapterProvider>
      <SuiWalletProvider>
        {children}
      </SuiWalletProvider>
    </WalletStandardAdapterProvider>
  );
};

export default WalletProvider;