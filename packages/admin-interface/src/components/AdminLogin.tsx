import React, { useState } from 'react';
import { Wallet, Shield } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (walletAddress: string) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    
    try {
      // Simulate SUI wallet connection
      // In a real implementation, this would use @mysten/wallet-adapter-react
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock wallet address for demo
      const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
      setWalletAddress(mockAddress);
      
      // Check if wallet is authorized (mock check)
      const isAuthorized = await checkWalletAuthorization(mockAddress);
      
      if (isAuthorized) {
        onLogin(mockAddress);
      } else {
        alert('Wallet address not authorized for admin access');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const checkWalletAuthorization = async (address: string): Promise<boolean> => {
    // Mock authorization check
    // In real implementation, this would check against admin database
    const authorizedAddresses = [
      '0x1234567890abcdef1234567890abcdef12345678',
      // Add more authorized addresses
    ];
    
    return authorizedAddresses.includes(address);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="w-16 h-16 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">PolarDEX Admin</h1>
          <p className="text-blue-200">Connect your authorized SUI wallet to access the admin dashboard</p>
        </div>

        <div className="space-y-6">
          <button
            onClick={handleConnectWallet}
            disabled={isConnecting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-3"
          >
            <Wallet className="w-5 h-5" />
            <span>
              {isConnecting ? 'Connecting...' : 'Connect SUI Wallet'}
            </span>
          </button>

          {walletAddress && (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-sm text-blue-200 mb-1">Connected Wallet:</p>
              <p className="text-white font-mono text-sm break-all">{walletAddress}</p>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-blue-300">
              Only authorized wallet addresses can access the admin panel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;