import React from 'react';
import { BarChart3, List, DollarSign, LogOut, User, ChevronRight } from 'lucide-react';
import type { AdminUser } from '../services/adminAuth';
import PolarLogo from '../assets/PolarLogo.svg';

interface DashboardProps {
    walletAddress: string;
    adminUser?: AdminUser | null;
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ walletAddress, adminUser, onLogout }) => {
    const dashboardCards = [
        {
            title: 'Dex Metrics',
            description: 'View trading volume, liquidity, and market analytics',
            icon: BarChart3,
            color: 'from-blue-500 to-blue-600',
            comingSoon: true
        },
        {
            title: 'Token List',
            description: 'Manage token verification and candidate approvals',
            icon: List,
            color: 'from-green-500 to-green-600',
            comingSoon: false
        },
        {
            title: 'Revenue',
            description: 'Track platform revenue and fee collection',
            icon: DollarSign,
            color: 'from-purple-500 to-purple-600',
            comingSoon: true
        }
    ];

    const handleCardClick = (cardTitle: string) => {
        if (cardTitle === 'Token List') {
            // Navigate to token list management
            console.log('Navigate to token list');
        } else {
            console.log(`${cardTitle} - Coming soon`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <img src={PolarLogo} alt="Polar Logo" className="w-8 h-8" />
                            <h1 className="text-xl font-semibold text-gray-900">PolarDEX Admin</h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <User className="w-4 h-4" />
                                <div className="flex flex-col">
                                    <span className="font-medium">{adminUser?.username || 'Admin'}</span>
                                    <span className="font-mono text-xs">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                                </div>
                            </div>
                            {adminUser?.role && (
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    {adminUser.role}
                                </span>
                            )}
                            <button
                                onClick={onLogout}
                                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Welcome back, {adminUser?.username || 'Admin'}!
                    </h2>
                    <p className="text-gray-600">Manage your PolarDEX platform from here</p>
                </div>

                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardCards.map((card) => {
                        const IconComponent = card.icon;
                        return (
                            <div
                                key={card.title}
                                onClick={() => handleCardClick(card.title)}
                                className={`relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${card.comingSoon ? 'opacity-75' : ''
                                    }`}
                            >
                                {card.comingSoon && (
                                    <div className="absolute top-4 right-4">
                                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                            Coming Soon
                                        </span>
                                    </div>
                                )}

                                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${card.color} mb-4`}>
                                    <IconComponent className="w-6 h-6 text-white" />
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
                                <p className="text-gray-600 text-sm">{card.description}</p>

                                <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                                    <span>{card.comingSoon ? 'Coming Soon' : 'Open'}</span>
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Stats */}
                <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">--</div>
                            <div className="text-sm text-gray-600">Pending Tokens</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">--</div>
                            <div className="text-sm text-gray-600">Verified Tokens</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">--</div>
                            <div className="text-sm text-gray-600">Total Volume</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;