import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tokenApiService } from '../services/tokenApi';
import type { Token } from '@polar/shared/types/token';
import toast from 'react-hot-toast';

interface AddToPolarParams {
  name: string;
  symbol: string;
  coinType: string;
  reason?: string;
}

export const useTokenOperations = () => {
  const queryClient = useQueryClient();

  // Add token to Polar verified list (gives checkmark)
  const addToPolarVerified = useMutation({
    mutationFn: async (params: AddToPolarParams) => {
      const result = await tokenApiService.addToPolarVerified(params);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (__data, variables) => {
      // Invalidate and refetch token queries
      queryClient.invalidateQueries({ queryKey: ['tokens', 'polar-verified'] });
      queryClient.invalidateQueries({ queryKey: ['tokens', 'stats'] });

      toast.success(`${variables.symbol} added to Polar verified list! ✅`);
    },
    onError: (error: Error, variables) => {
      console.error('Error adding token to Polar verified:', error);
      toast.error(`Failed to add ${variables.symbol} to Polar verified: ${error.message}`);
    }
  });

  // Remove token from Polar verified list
  const removeFromPolarVerified = useMutation({
    mutationFn: async (coinType: string) => {
      const result = await tokenApiService.removeFromPolarVerified(coinType);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens', 'polar-verified'] });
      queryClient.invalidateQueries({ queryKey: ['tokens', 'stats'] });

      toast.success('Token removed from Polar verified list');
    },
    onError: (error: Error) => {
      console.error('Error removing token from Polar verified:', error);
      toast.error(`Failed to remove token: ${error.message}`);
    }
  });

  // Add token to strict list (most trusted)
  const addToStrictList = useMutation({
    mutationFn: async (token: Token) => {
      const result = await tokenApiService.addToStrictList(token);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tokens', 'strict'] });
      queryClient.invalidateQueries({ queryKey: ['tokens', 'stats'] });

      toast.success(`${variables.symbol} added to strict token list! 🔒`);
    },
    onError: (error: Error, variables) => {
      console.error('Error adding token to strict list:', error);
      toast.error(`Failed to add ${variables.symbol} to strict list: ${error.message}`);
    }
  });

  // Remove token from strict list
  const removeFromStrictList = useMutation({
    mutationFn: async (coinType: string) => {
      const result = await tokenApiService.removeFromStrictList(coinType);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens', 'strict'] });
      queryClient.invalidateQueries({ queryKey: ['tokens', 'stats'] });

      toast.success('Token removed from strict list');
    },
    onError: (error: Error) => {
      console.error('Error removing token from strict list:', error);
      toast.error(`Failed to remove token: ${error.message}`);
    }
  });

  // Bulk operations for multiple tokens
  const bulkAddToPolarVerified = useMutation({
    mutationFn: async (tokens: AddToPolarParams[]) => {
      const results = await Promise.allSettled(
        tokens.map(token => tokenApiService.addToPolarVerified(token))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return { successful, failed, total: tokens.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tokens', 'polar-verified'] });
      queryClient.invalidateQueries({ queryKey: ['tokens', 'stats'] });

      if (data.failed === 0) {
        toast.success(`Successfully added ${data.successful} tokens to Polar verified! ✅`);
      } else {
        toast.success(`Added ${data.successful} tokens. ${data.failed} failed.`);
      }
    },
    onError: (error: Error) => {
      console.error('Error in bulk add to Polar verified:', error);
      toast.error(`Bulk operation failed: ${error.message}`);
    }
  });

  const bulkAddToStrictList = useMutation({
    mutationFn: async (tokens: Token[]) => {
      const results = await Promise.allSettled(
        tokens.map(token => tokenApiService.addToStrictList(token))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return { successful, failed, total: tokens.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tokens', 'strict'] });
      queryClient.invalidateQueries({ queryKey: ['tokens', 'stats'] });

      if (data.failed === 0) {
        toast.success(`Successfully added ${data.successful} tokens to strict list! 🔒`);
      } else {
        toast.success(`Added ${data.successful} tokens. ${data.failed} failed.`);
      }
    },
    onError: (error: Error) => {
      console.error('Error in bulk add to strict list:', error);
      toast.error(`Bulk operation failed: ${error.message}`);
    }
  });

  // Helper function to promote token through the verification levels
  const promoteToken = async (token: Token, targetLevel: 'polar' | 'strict') => {
    try {
      if (targetLevel === 'polar') {
        await addToPolarVerified.mutateAsync({
          name: token.name,
          symbol: token.symbol,
          coinType: token.coinType || '',
          reason: 'Promoted by admin'
        });
      } else if (targetLevel === 'strict') {
        await addToStrictList.mutateAsync(token);
      }
    } catch (error) {
      console.error('Error promoting token:', error);
      throw error;
    }
  };

  return {
    // Single token operations
    addToPolarVerified,
    removeFromPolarVerified,
    addToStrictList,
    removeFromStrictList,

    // Bulk operations
    bulkAddToPolarVerified,
    bulkAddToStrictList,

    // Helper functions
    promoteToken,

    // Loading states
    isAddingToPolar: addToPolarVerified.isPending,
    isRemovingFromPolar: removeFromPolarVerified.isPending,
    isAddingToStrict: addToStrictList.isPending,
    isRemovingFromStrict: removeFromStrictList.isPending,
    isBulkAddingToPolar: bulkAddToPolarVerified.isPending,
    isBulkAddingToStrict: bulkAddToStrictList.isPending,

    // General loading state
    isLoading: addToPolarVerified.isPending ||
      removeFromPolarVerified.isPending ||
      addToStrictList.isPending ||
      removeFromStrictList.isPending ||
      bulkAddToPolarVerified.isPending ||
      bulkAddToStrictList.isPending
  };
};