import React, { useState, useEffect } from 'react';
import { Wallet, Shield } from 'lucide-react';
import { useCurrentAccount, useConnectWallet, useDisconnectWallet, useWallets, useSignPersonalMessage } from '@mysten/dapp-kit';
import { adminAuthService } from '../services/adminAuth';
import type { AdminUser } from '../services/adminAuth';
import PolarLogo from '../assets/PolarLogo.svg';

interface AdminLoginProps {
    onLogin: (walletAddress: string, adminUser: AdminUser) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [authStep, setAuthStep] = useState<'connect' | 'sign' | 'complete'>('connect');

    // Use dApp Kit hooks for wallet functionality
    const currentAccount = useCurrentAccount();
    const wallets = useWallets();
    const { mutate: connectWallet, isPending: isConnecting } = useConnectWallet();
    const { mutate: disconnectWallet } = useDisconnectWallet();
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
    
    const connected = !!currentAccount;
    const account = currentAccount;

    const handleConnectWallet = async () => {
        setError(null);

        try {
            if (wallets.length === 0) {
                setError('No SUI wallet found. Please install Sui Wallet or another compatible wallet.');
                const shouldInstall = confirm('No SUI wallet found. Would you like to install Sui Wallet?');
                if (shouldInstall) {
                    window.open('https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil', '_blank');
                }
                return;
            }

            // Connect to the first available wallet
            connectWallet(
                { wallet: wallets[0] },
                {
                    onError: (error) => {
                        console.error('Failed to connect wallet:', error);
                        setError(error.message || 'Failed to connect wallet. Please try again.');
                    }
                }
            );

        } catch (error: any) {
            console.error('Failed to connect wallet:', error);
            setError(error.message || 'Failed to connect wallet. Please try again.');
        }
    };

    // Handle successful connection - move to signing step
    useEffect(() => {
        if (connected && account?.address && authStep === 'connect') {
            setAuthStep('sign');
        }
    }, [connected, account, authStep]);

    // Check if wallet is already connected on component mount
    useEffect(() => {
        if (connected && account?.address) {
            setAuthStep('sign');
        }
    }, []);

    const handleAuthentication = async () => {
        if (!account?.address) {
            setError('Wallet not properly connected');
            return;
        }

        setIsAuthenticating(true);
        setError(null);

        try {
            // Check if wallet is authorized first
            if (!adminAuthService.isAuthorizedWallet(account.address)) {
                setError('Wallet address not authorized for admin access');
                disconnectWallet();
                setAuthStep('connect');
                return;
            }

            // Use real wallet message signing
            const result = await adminAuthService.authenticateAdmin(
                account.address,
                async (message: Uint8Array) => {
                    const result = await signPersonalMessage({ message });
                    return { signature: result.signature };
                }
            );

            if (result.success && result.admin) {
                setAuthStep('complete');
                onLogin(account.address, result.admin);
            } else {
                setError(result.error || 'Authentication failed');
                disconnectWallet();
                setAuthStep('connect');
            }
        } catch (error: any) {
            console.error('Authentication error:', error);
            setError('Authentication failed. Please try again.');
            disconnectWallet();
            setAuthStep('connect');
        } finally {
            setIsAuthenticating(false);
        }
    };

    const getStepMessage = () => {
        switch (authStep) {
            case 'connect':
                return connected && account?.address 
                    ? 'Wallet connected! Click to authenticate and access the admin dashboard'
                    : 'Connect your authorized SUI wallet to access the admin dashboard';
            case 'sign':
                return 'Click to sign the authentication message and verify wallet ownership';
            case 'complete':
                return 'Authentication successful! Redirecting to dashboard...';
            default:
                return 'Connect your authorized SUI wallet to access the admin dashboard';
        }
    };

    const getButtonText = () => {
        if (isConnecting) return 'Connecting...';
        if (isAuthenticating) return 'Authenticating...';
        if (authStep === 'sign') return 'Sign Message to Authenticate';
        if (connected && account?.address) return 'Authenticate with Connected Wallet';
        return 'Connect SUI Wallet';
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-md border border-gray-100">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <img src={PolarLogo} alt="Polar Logo" className="w-16 h-16" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">PolarDEX Admin</h1>
                    <p className="text-gray-600">{getStepMessage()}</p>
                </div>

                <div className="space-y-6">
                    <button
                        onClick={authStep === 'connect' ? handleConnectWallet : handleAuthentication}
                        disabled={isConnecting || isAuthenticating}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-5 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        {authStep === 'sign' ? <Shield className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                        <span>{getButtonText()}</span>
                    </button>

                    {connected && account?.address && authStep === 'sign' && (
                        <button
                            onClick={() => {
                                disconnectWallet();
                                setAuthStep('connect');
                                setError(null);
                            }}
                            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200"
                        >
                            Use Different Wallet
                        </button>
                    )}

                    {connected && account?.address && (
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                            <p className="text-sm text-gray-600 mb-1">Connected Wallet:</p>
                            <p className="text-gray-900 font-mono text-sm break-all">{account.address}</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="text-center">
                        <p className="text-sm text-gray-500">
                            Only authorized wallet addresses can access the admin panel
                        </p>
                    </div>

                    {/* Debug info - remove in production */}
                    <div className="text-xs text-gray-400 text-center">
                        <p>Available wallets: {wallets.length}</p>
                        {wallets.length > 0 && (
                            <p>Found: {wallets.map(w => w.name).join(', ')}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;