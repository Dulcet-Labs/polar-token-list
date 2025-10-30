import React, { useState, useMemo } from 'react';
import { Search, CheckCircle, Shield, Lock, ExternalLink, TrendingUp } from 'lucide-react';
import { useTokens } from '../../hooks/useTokens';
import { useTokenOperations } from '../../hooks/useTokenOperations';
import type { Token } from '@polar/shared/types/token';

interface TokenListProps {
    view: 'candidates' | 'polar-verified' | 'strict';
}

const TokenList: React.FC<TokenListProps> = ({ view }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<'name' | 'symbol' | 'marketCap' | 'volume24h'>('marketCap');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const {
        candidateTokens,
        strictTokens,
        isLoading,
        error,
        isPolarVerified,
        getTokenVerificationStatus
    } = useTokens();

    const {
        addToPolarVerified,
        addToStrictList,
        bulkAddToPolarVerified,
        isLoading: isOperationLoading
    } = useTokenOperations();

    // Get tokens based on current view
    const tokens = useMemo(() => {
        switch (view) {
            case 'candidates':
                return candidateTokens;
            case 'polar-verified':
                return candidateTokens.filter(token => isPolarVerified(token.coinType || ''));
            case 'strict':
                return strictTokens;
            default:
                return candidateTokens;
        }
    }, [view, candidateTokens, strictTokens, isPolarVerified]);

    // Filter and sort tokens
    const filteredAndSortedTokens = useMemo(() => {
        let filtered = tokens.filter(token =>
            token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Sort tokens
        filtered.sort((a, b) => {
            let aValue: number | string;
            let bValue: number | string;

            switch (sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'symbol':
                    aValue = a.symbol.toLowerCase();
                    bValue = b.symbol.toLowerCase();
                    break;
                case 'marketCap':
                    aValue = a.extensions?.marketCap || 0;
                    bValue = b.extensions?.marketCap || 0;
                    break;
                case 'volume24h':
                    aValue = a.extensions?.volume24h || 0;
                    bValue = b.extensions?.volume24h || 0;
                    break;
                default:
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            }

            return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
        });

        return filtered;
    }, [tokens, searchTerm, sortBy, sortOrder]);

    const handleTokenSelect = (coinType: string) => {
        setSelectedTokens(prev =>
            prev.includes(coinType)
                ? prev.filter(id => id !== coinType)
                : [...prev, coinType]
        );
    };

    const handleSelectAll = () => {
        if (selectedTokens.length === filteredAndSortedTokens.length) {
            setSelectedTokens([]);
        } else {
            setSelectedTokens(filteredAndSortedTokens.map(token => token.coinType || ''));
        }
    };

    const handlePromoteToPolar = async (token: Token) => {
        await addToPolarVerified.mutateAsync({
            name: token.name,
            symbol: token.symbol,
            coinType: token.coinType || '',
            reason: 'Promoted by admin'
        });
    };

    const handlePromoteToStrict = async (token: Token) => {
        await addToStrictList.mutateAsync(token);
    };

    const handleBulkPromoteToPolar = async () => {
        const tokensToPromote = filteredAndSortedTokens
            .filter(token => selectedTokens.includes(token.coinType || ''))
            .map(token => ({
                name: token.name,
                symbol: token.symbol,
                coinType: token.coinType || '',
                reason: 'Bulk promoted by admin'
            }));

        await bulkAddToPolarVerified.mutateAsync(tokensToPromote);
        setSelectedTokens([]);
    };

    const formatNumber = (num: number | undefined): string => {
        if (!num) return '--';
        if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
        if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
        return `$${num.toFixed(2)}`;
    };

    const getVerificationBadge = (token: Token) => {
        const status = getTokenVerificationStatus(token.coinType || '');

        switch (status) {
            case 'strict':
                return <div title="Strict Token"><Lock className="w-4 h-4 text-purple-600" /></div>;
            case 'polar':
                return <div title="Polar Verified"><Shield className="w-4 h-4 text-blue-600" /></div>;
            default:
                return <div title="BlockBerry Verified"><CheckCircle className="w-4 h-4 text-green-600" /></div>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading tokens...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">Error loading tokens: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {view === 'candidates' && 'Candidate Tokens'}
                        {view === 'polar-verified' && 'Polar Verified Tokens'}
                        {view === 'strict' && 'Strict Token List'}
                    </h2>
                    <p className="text-gray-600">
                        {filteredAndSortedTokens.length} tokens found
                    </p>
                </div>

                {/* Bulk Actions */}
                {selectedTokens.length > 0 && view === 'candidates' && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                            {selectedTokens.length} selected
                        </span>
                        <button
                            onClick={handleBulkPromoteToPolar}
                            disabled={isOperationLoading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Add to Polar Verified
                        </button>
                    </div>
                )}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search tokens..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="marketCap">Market Cap</option>
                    <option value="volume24h">24h Volume</option>
                    <option value="name">Name</option>
                    <option value="symbol">Symbol</option>
                </select>

                <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
            </div>

            {/* Select All */}
            {view === 'candidates' && filteredAndSortedTokens.length > 0 && (
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={selectedTokens.length === filteredAndSortedTokens.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm text-gray-600">
                        Select all ({filteredAndSortedTokens.length} tokens)
                    </label>
                </div>
            )}

            {/* Token List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {view === 'candidates' && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Select
                                    </th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Token
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Market Cap
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    24h Volume
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price Change
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAndSortedTokens.map((token) => (
                                <tr key={token.coinType} className="hover:bg-gray-50">
                                    {view === 'candidates' && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedTokens.includes(token.coinType || '')}
                                                onChange={() => handleTokenSelect(token.coinType || '')}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {token.logoURI && (
                                                <img
                                                    src={token.logoURI}
                                                    alt={token.symbol}
                                                    className="w-8 h-8 rounded-full mr-3"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            )}
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                    {token.name}
                                                    {getVerificationBadge(token)}
                                                </div>
                                                <div className="text-sm text-gray-500">{token.symbol}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatNumber(token.extensions?.marketCap)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatNumber(token.extensions?.volume24h)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`flex items-center gap-1 ${(token.extensions?.priceChange24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            <TrendingUp className="w-3 h-3" />
                                            {token.extensions?.priceChange24h?.toFixed(2) || '--'}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {token.verifiedBy || 'BlockBerry'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        {view === 'candidates' && (
                                            <>
                                                <button
                                                    onClick={() => handlePromoteToPolar(token)}
                                                    disabled={isOperationLoading}
                                                    className="text-blue-600 hover:text-blue-900 disabled:text-blue-400"
                                                >
                                                    Add to Polar
                                                </button>
                                                <button
                                                    onClick={() => handlePromoteToStrict(token)}
                                                    disabled={isOperationLoading}
                                                    className="text-purple-600 hover:text-purple-900 disabled:text-purple-400"
                                                >
                                                    Add to Strict
                                                </button>
                                            </>
                                        )}
                                        <button className="text-gray-600 hover:text-gray-900">
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {filteredAndSortedTokens.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500">No tokens found matching your criteria.</p>
                </div>
            )}
        </div>
    );
};

export default TokenList;