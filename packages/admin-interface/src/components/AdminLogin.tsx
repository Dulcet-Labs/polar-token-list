import React, { useState, useEffect } from 'react';
import { Wallet, Shield } from 'lucide-react';
import { useWallet } from '@mysten/wallet-adapter-react';
import { adminAuthService } from '../services/adminAuth';
import type { AdminUser } from '../services/adminAuth';
import PolarLogo from '../assets/PolarLogo.svg';

interface AdminLoginProps {
    onLogin: (walletAddress: string, adminUser: AdminUser) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [authStep, setAuthStep] = useState<'connect' | 'sign' | 'complete'>('connect');

    // Use the official SUI wallet adapter hook
    const {
        wallets,
        connect,
        connected,
        account,
        disconnect
    } = useWallet();

    const handleConnectWallet = async () => {
        setIsConnecting(true);
        setError(null);

        try {
            // Find an installed wallet
            const installedWallet = wallets.find(wallet => wallet.readyState === 'Installed');

            if (!installedWallet) {
                setError('No SUI wallet found. Please install Sui Wallet or another compatible wallet.');
                const shouldInstall = confirm('No SUI wallet found. Would you like to install Sui Wallet?');
                if (shouldInstall) {
                    window.open('https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil', '_blank');
                }
                return;
            }

            // Connect to the wallet
            await connect(installedWallet.name);

        } catch (error: any) {
            console.error('Failed to connect wallet:', error);
            setError(error.message || 'Failed to connect wallet. Please try again.');
        } finally {
            setIsConnecting(false);
        }
    };

    // Handle successful connection - move to signing step
    useEffect(() => {
        if (connected && account?.address) {
            setAuthStep('sign');
            handleAuthentication();
        }
    }, [connected, account]);

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
                await disconnect();
                setAuthStep('connect');
                return;
            }

            // For now, we'll simulate message signing
            // In a real implementation, you would use the wallet's signMessage function
            const mockSignMessage = async (_message: Uint8Array) => {
                // This would be replaced with actual wallet signing
                return { signature: 'mock-signature-' + Date.now() };
            };

            // Authenticate with message signing
            const result = await adminAuthService.authenticateAdmin(
                account.address,
                mockSignMessage
            );

            if (result.success && result.admin) {
                setAuthStep('complete');
                onLogin(account.address, result.admin);
            } else {
                setError(result.error || 'Authentication failed');
                await disconnect();
                setAuthStep('connect');
            }
        } catch (error: any) {
            console.error('Authentication error:', error);
            setError('Authentication failed. Please try again.');
            await disconnect();
            setAuthStep('connect');
        } finally {
            setIsAuthenticating(false);
        }
    };

    const getStepMessage = () => {
        switch (authStep) {
            case 'connect':
                return 'Connect your authorized SUI wallet to access the admin dashboard';
            case 'sign':
                return 'Please sign the authentication message to verify wallet ownership';
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
                        <p>Installed: {wallets.filter(w => w.readyState === 'Installed').length}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;