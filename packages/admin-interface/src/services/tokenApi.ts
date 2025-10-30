import type { Token } from '@polar/shared/types/token';

interface PolarVerifiedToken {
    name: string;
    symbol: string;
    coinType: string;
    verifiedBy: 'polar';
    verifiedAt: string;
    reason?: string;
}

interface TokenApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

class TokenApiService {
    private baseUrl = '/api/tokens'; // This would be your backend API



    /**
     * Get all verified tokens from BlockBerry
     */
    async getVerifiedTokens(): Promise<TokenApiResponse<Token[]>> {
        try {
            const response = await fetch('/packages/token-service/data/verified-tokens.json');
            if (!response.ok) {
                throw new Error('Failed to fetch verified tokens');
            }
            const tokens: Token[] = await response.json();

            return {
                success: true,
                data: tokens
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch verified tokens'
            };
        }
    }

    /**
     * Get Polar-verified tokens (tokens with Polar checkmark)
     */
    async getPolarVerifiedTokens(): Promise<TokenApiResponse<PolarVerifiedToken[]>> {
        try {
            const response = await fetch('/packages/token-service/data/polar-verified.json');
            if (!response.ok) {
                throw new Error('Failed to fetch polar verified tokens');
            }
            const tokens: PolarVerifiedToken[] = await response.json();

            return {
                success: true,
                data: tokens
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch polar verified tokens'
            };
        }
    }

    /**
     * Get strict tokens (most trusted token list)
     */
    async getStrictTokens(): Promise<TokenApiResponse<Token[]>> {
        try {
            const response = await fetch('/packages/token-service/data/strict-tokens.json');
            if (!response.ok) {
                throw new Error('Failed to fetch strict tokens');
            }
            const tokens: Token[] = await response.json();

            return {
                success: true,
                data: tokens
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch strict tokens'
            };
        }
    }

    /**
     * Add token to Polar verified list (gives Polar checkmark)
     */
    async addToPolarVerified(token: {
        name: string;
        symbol: string;
        coinType: string;
        reason?: string;
    }): Promise<TokenApiResponse<PolarVerifiedToken>> {
        try {
            const polarToken: PolarVerifiedToken = {
                ...token,
                verifiedBy: 'polar',
                verifiedAt: new Date().toISOString()
            };

            // In a real implementation, this would call your backend API
            const response = await fetch(`${this.baseUrl}/polar-verified`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(polarToken)
            });

            if (!response.ok) {
                throw new Error('Failed to add token to polar verified list');
            }

            return {
                success: true,
                data: polarToken
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to add token to polar verified list'
            };
        }
    }

    /**
     * Remove token from Polar verified list
     */
    async removeFromPolarVerified(coinType: string): Promise<TokenApiResponse<boolean>> {
        try {
            const response = await fetch(`${this.baseUrl}/polar-verified/${encodeURIComponent(coinType)}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to remove token from polar verified list');
            }

            return {
                success: true,
                data: true
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to remove token from polar verified list'
            };
        }
    }

    /**
     * Add token to strict list (most trusted)
     */
    async addToStrictList(token: Token): Promise<TokenApiResponse<Token>> {
        try {
            const response = await fetch(`${this.baseUrl}/strict-tokens`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(token)
            });

            if (!response.ok) {
                throw new Error('Failed to add token to strict list');
            }

            return {
                success: true,
                data: token
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to add token to strict list'
            };
        }
    }

    /**
     * Remove token from strict list
     */
    async removeFromStrictList(coinType: string): Promise<TokenApiResponse<boolean>> {
        try {
            const response = await fetch(`${this.baseUrl}/strict-tokens/${encodeURIComponent(coinType)}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to remove token from strict list');
            }

            return {
                success: true,
                data: true
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to remove token from strict list'
            };
        }
    }

    /**
     * Get token statistics
     */
    async getTokenStats(): Promise<TokenApiResponse<{
        totalVerified: number;
        polarVerified: number;
        strictTokens: number;
    }>> {
        try {
            const [verified, polar, strict] = await Promise.all([
                this.getVerifiedTokens(),
                this.getPolarVerifiedTokens(),
                this.getStrictTokens()
            ]);

            if (!verified.success || !polar.success || !strict.success) {
                throw new Error('Failed to fetch token statistics');
            }

            return {
                success: true,
                data: {
                    totalVerified: verified.data?.length || 0,
                    polarVerified: polar.data?.length || 0,
                    strictTokens: strict.data?.length || 0
                }
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to fetch token statistics'
            };
        }
    }
}

export const tokenApiService = new TokenApiService();