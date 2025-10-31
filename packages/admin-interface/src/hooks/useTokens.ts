import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tokenApiService } from '../services/tokenApi';
import type { Token } from '@polar/shared/types/token';

export const useTokens = () => {
  const queryClient = useQueryClient();

  // Query for all verified tokens (BlockBerry)
  const {
    data: verifiedTokens,
    isLoading: isLoadingVerified,
    error: verifiedError,
    refetch: refetchVerified
  } = useQuery({
    queryKey: ['tokens', 'verified'],
    queryFn: async () => {
      const result = await tokenApiService.getVerifiedTokens();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Query for Polar verified tokens (with checkmark)
  const {
    data: polarVerifiedTokens,
    isLoading: isLoadingPolar,
    error: polarError,
    refetch: refetchPolar
  } = useQuery({
    queryKey: ['tokens', 'polar-verified'],
    queryFn: async () => {
      const result = await tokenApiService.getPolarVerifiedTokens();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Query for strict tokens (most trusted)
  const {
    data: strictTokens,
    isLoading: isLoadingStrict,
    error: strictError,
    refetch: refetchStrict
  } = useQuery({
    queryKey: ['tokens', 'strict'],
    queryFn: async () => {
      const result = await tokenApiService.getStrictTokens();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Query for token statistics
  const {
    data: tokenStats,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['tokens', 'stats'],
    queryFn: async () => {
      const result = await tokenApiService.getTokenStats();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || { totalVerified: 0, polarVerified: 0, strictTokens: 0 };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });

  // Helper function to check if a token is Polar verified
  const isPolarVerified = (coinType: string): boolean => {
    return polarVerifiedTokens?.some(token => token.coinType === coinType) || false;
  };

  // Helper function to check if a token is in strict list
  const isStrictToken = (coinType: string): boolean => {
    return strictTokens?.some(token => token.coinType === coinType) || false;
  };

  // Helper function to get token verification status
  const getTokenVerificationStatus = (coinType: string) => {
    const isStrict = isStrictToken(coinType);
    const isPolar = isPolarVerified(coinType);

    if (isStrict) return 'strict';
    if (isPolar) return 'polar';
    return 'verified';
  };

  // Helper function to get candidate tokens (verified but not polar/strict)
  const getCandidateTokens = (): Token[] => {
    if (!verifiedTokens || !polarVerifiedTokens || !strictTokens) return [];

    const polarCoinTypes = new Set(polarVerifiedTokens.map(t => t.coinType).filter(Boolean));
    const strictCoinTypes = new Set(strictTokens.map(t => t.coinType).filter(Boolean));

    return verifiedTokens.filter(token =>
      token.coinType && !polarCoinTypes.has(token.coinType) && !strictCoinTypes.has(token.coinType)
    );
  };

  // Refresh all token data
  const refreshAllTokens = async () => {
    await Promise.all([
      refetchVerified(),
      refetchPolar(),
      refetchStrict(),
      refetchStats()
    ]);
  };

  // Invalidate and refetch specific token lists
  const invalidateTokens = (type?: 'verified' | 'polar' | 'strict' | 'stats') => {
    if (type) {
      queryClient.invalidateQueries({ queryKey: ['tokens', type] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
    }
  };

  return {
    // Data
    verifiedTokens: verifiedTokens || [],
    polarVerifiedTokens: polarVerifiedTokens || [],
    strictTokens: strictTokens || [],
    candidateTokens: getCandidateTokens(),
    tokenStats: tokenStats || { totalVerified: 0, polarVerified: 0, strictTokens: 0 },

    // Loading states
    isLoading: isLoadingVerified || isLoadingPolar || isLoadingStrict,
    isLoadingVerified,
    isLoadingPolar,
    isLoadingStrict,
    isLoadingStats,

    // Errors
    error: verifiedError || polarError || strictError || statsError,
    verifiedError,
    polarError,
    strictError,
    statsError,

    // Helper functions
    isPolarVerified,
    isStrictToken,
    getTokenVerificationStatus,

    // Actions
    refreshAllTokens,
    invalidateTokens,
    refetchVerified,
    refetchPolar,
    refetchStrict,
    refetchStats
  };
};