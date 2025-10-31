import { Token } from '../types.js';

export interface MergeStats {
  totalExisting: number;
  totalNew: number;
  duplicatesSkipped: number;
  tokensUpdated: number;
  tokensAdded: number;
  conflicts: ConflictInfo[];
}

export interface ConflictInfo {
  objectId: string;
  symbol: string;
  conflictType: 'metadata' | 'verification' | 'tags';
  existingValue: any;
  newValue: any;
  resolution: 'kept_existing' | 'updated_to_new' | 'merged';
}

export interface MergeOptions {
  updateExistingMetadata: boolean;
  preserveVerificationStatus: boolean;
  mergeTags: boolean;
  updateTimestamps: boolean;
}

export class TokenMergeUtils {
  private static readonly DEFAULT_OPTIONS: MergeOptions = {
    updateExistingMetadata: true,
    preserveVerificationStatus: true,
    mergeTags: true,
    updateTimestamps: false
  };

  /**
   * Merge new tokens with existing tokens, handling duplicates intelligently
   */
  static mergeTokenLists(
    existingTokens: Token[],
    newTokens: Token[],
    options: Partial<MergeOptions> = {}
  ): { mergedTokens: Token[]; stats: MergeStats } {
    const mergeOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    const stats: MergeStats = {
      totalExisting: existingTokens.length,
      totalNew: newTokens.length,
      duplicatesSkipped: 0,
      tokensUpdated: 0,
      tokensAdded: 0,
      conflicts: []
    };

    // Create a map of existing tokens by objectId for efficient lookup
    const existingTokenMap = new Map<string, Token>();
    existingTokens.forEach(token => {
      existingTokenMap.set(token.objectId, token);
    });

    const mergedTokens: Token[] = [...existingTokens];
    const processedObjectIds = new Set<string>();

    // Process each new token
    for (const newToken of newTokens) {
      if (processedObjectIds.has(newToken.objectId)) {
        // Skip if we've already processed this objectId in the new tokens
        continue;
      }
      processedObjectIds.add(newToken.objectId);

      const existingToken = existingTokenMap.get(newToken.objectId);

      if (existingToken) {
        // Handle duplicate - merge or skip
        const mergeResult = this.mergeTokens(existingToken, newToken, mergeOptions);
        
        if (mergeResult.wasUpdated) {
          // Update the token in the merged list
          const index = mergedTokens.findIndex(t => t.objectId === newToken.objectId);
          if (index !== -1) {
            mergedTokens[index] = mergeResult.mergedToken;
            stats.tokensUpdated++;
          }
        } else {
          stats.duplicatesSkipped++;
        }

        // Record conflicts
        stats.conflicts.push(...mergeResult.conflicts);

      } else {
        // New token - add it
        mergedTokens.push(newToken);
        stats.tokensAdded++;
      }
    }

    return { mergedTokens, stats };
  }

  /**
   * Merge two tokens with the same objectId
   */
  private static mergeTokens(
    existingToken: Token,
    newToken: Token,
    options: MergeOptions
  ): { mergedToken: Token; wasUpdated: boolean; conflicts: ConflictInfo[] } {
    const conflicts: ConflictInfo[] = [];
    let wasUpdated = false;
    const mergedToken: Token = { ...existingToken };

    // Handle verification status
    if (existingToken.verified !== newToken.verified) {
      conflicts.push({
        objectId: existingToken.objectId,
        symbol: existingToken.symbol,
        conflictType: 'verification',
        existingValue: existingToken.verified,
        newValue: newToken.verified,
        resolution: options.preserveVerificationStatus ? 'kept_existing' : 'updated_to_new'
      });

      if (!options.preserveVerificationStatus) {
        mergedToken.verified = newToken.verified;
        mergedToken.verifiedBy = newToken.verifiedBy;
        wasUpdated = true;
      }
    }

    // Handle metadata updates
    if (options.updateExistingMetadata) {
      const metadataFields = ['name', 'symbol', 'decimals', 'logoURI'] as const;
      
      for (const field of metadataFields) {
        if (existingToken[field] !== newToken[field] && newToken[field] !== undefined) {
          if (this.shouldUpdateField(existingToken[field], newToken[field])) {
            conflicts.push({
              objectId: existingToken.objectId,
              symbol: existingToken.symbol,
              conflictType: 'metadata',
              existingValue: existingToken[field],
              newValue: newToken[field],
              resolution: 'updated_to_new'
            });

            (mergedToken as any)[field] = newToken[field];
            wasUpdated = true;
          }
        }
      }
    }

    // Handle tags merging
    if (options.mergeTags && newToken.tags) {
      const existingTags = new Set(existingToken.tags || []);
      const newTags = newToken.tags.filter((tag: any) => !existingTags.has(tag));
      
      if (newTags.length > 0) {
        mergedToken.tags = [...(existingToken.tags || []), ...newTags];
        wasUpdated = true;
      }
    }

    // Handle extensions merging
    if (newToken.extensions) {
      const mergedExtensions = { ...existingToken.extensions };
      let extensionsUpdated = false;

      for (const [key, value] of Object.entries(newToken.extensions)) {
        if (value !== undefined && value !== null) {
          const existingValue = mergedExtensions[key];
          
          if (this.shouldUpdateField(existingValue, value)) {
            mergedExtensions[key] = value;
            extensionsUpdated = true;
          }
        }
      }

      if (extensionsUpdated) {
        mergedToken.extensions = mergedExtensions;
        wasUpdated = true;
      }
    }

    // Update timestamp if requested and token was updated
    if (options.updateTimestamps && wasUpdated) {
      mergedToken.addedAt = new Date().toISOString();
    }

    return { mergedToken, wasUpdated, conflicts };
  }

  /**
   * Determine if a field should be updated based on value quality
   */
  private static shouldUpdateField(existingValue: any, newValue: any): boolean {
    // If existing is empty/null/undefined and new has value
    if (!existingValue && newValue) {
      return true;
    }

    // If both have values, prefer newer non-empty values
    if (existingValue && newValue) {
      // For strings, prefer non-empty over empty
      if (typeof existingValue === 'string' && typeof newValue === 'string') {
        return newValue.length > existingValue.length;
      }
      
      // For numbers, prefer positive over zero/negative
      if (typeof existingValue === 'number' && typeof newValue === 'number') {
        return newValue > existingValue;
      }
      
      // For objects, prefer objects with more properties
      if (typeof existingValue === 'object' && typeof newValue === 'object') {
        return Object.keys(newValue).length > Object.keys(existingValue).length;
      }
    }

    return false;
  }

  /**
   * Remove duplicate tokens from a list (keeping the first occurrence)
   */
  static deduplicateTokens(tokens: Token[]): { uniqueTokens: Token[]; duplicatesRemoved: number } {
    const seen = new Set<string>();
    const uniqueTokens: Token[] = [];
    let duplicatesRemoved = 0;

    for (const token of tokens) {
      if (!seen.has(token.objectId)) {
        seen.add(token.objectId);
        uniqueTokens.push(token);
      } else {
        duplicatesRemoved++;
      }
    }

    return { uniqueTokens, duplicatesRemoved };
  }

  /**
   * Find potential duplicate tokens based on symbol similarity
   */
  static findPotentialDuplicates(tokens: Token[]): Array<{ symbol: string; tokens: Token[] }> {
    const symbolGroups = new Map<string, Token[]>();

    // Group by symbol (case-insensitive)
    for (const token of tokens) {
      const normalizedSymbol = token.symbol.toLowerCase();
      if (!symbolGroups.has(normalizedSymbol)) {
        symbolGroups.set(normalizedSymbol, []);
      }
      symbolGroups.get(normalizedSymbol)!.push(token);
    }

    // Return groups with more than one token
    return Array.from(symbolGroups.entries())
      .filter(([_, tokens]) => tokens.length > 1)
      .map(([symbol, tokens]) => ({ symbol, tokens }));
  }

  /**
   * Validate token list for common issues
   */
  static validateTokenList(tokens: Token[]): {
    isValid: boolean;
    issues: string[];
    duplicateObjectIds: string[];
    duplicateSymbols: Array<{ symbol: string; count: number }>;
  } {
    const issues: string[] = [];
    const objectIdCounts = new Map<string, number>();
    const symbolCounts = new Map<string, number>();

    // Check each token
    for (const token of tokens) {
      // Count objectIds
      objectIdCounts.set(token.objectId, (objectIdCounts.get(token.objectId) || 0) + 1);
      
      // Count symbols
      const normalizedSymbol = token.symbol.toLowerCase();
      symbolCounts.set(normalizedSymbol, (symbolCounts.get(normalizedSymbol) || 0) + 1);

      // Basic validation
      if (!token.name || token.name.trim().length === 0) {
        issues.push(`Token ${token.objectId} has empty name`);
      }
      
      if (!token.symbol || token.symbol.trim().length === 0) {
        issues.push(`Token ${token.objectId} has empty symbol`);
      }
      
      if (token.decimals < 0 || token.decimals > 18) {
        issues.push(`Token ${token.symbol} has invalid decimals: ${token.decimals}`);
      }
      
      if (!token.objectId.includes('::')) {
        issues.push(`Token ${token.symbol} has invalid objectId format: ${token.objectId}`);
      }
    }

    // Find duplicates
    const duplicateObjectIds = Array.from(objectIdCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([objectId, _]) => objectId);

    const duplicateSymbols = Array.from(symbolCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([symbol, count]) => ({ symbol, count }));

    if (duplicateObjectIds.length > 0) {
      issues.push(`Found ${duplicateObjectIds.length} duplicate objectIds`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      duplicateObjectIds,
      duplicateSymbols
    };
  }

  /**
   * Sort tokens by priority (verified first, then by trading volume, then alphabetically)
   */
  static sortTokensByPriority(tokens: Token[]): Token[] {
    return [...tokens].sort((a, b) => {
      // Verified tokens first
      if (a.verified !== b.verified) {
        return a.verified ? -1 : 1;
      }

      // Then by trading volume (if available)
      const volumeA = (a.extensions?.volume24h as number) || 0;
      const volumeB = (b.extensions?.volume24h as number) || 0;
      if (volumeA !== volumeB) {
        return volumeB - volumeA;
      }

      // Then by market cap (if available)
      const marketCapA = (a.extensions?.marketCap as number) || 0;
      const marketCapB = (b.extensions?.marketCap as number) || 0;
      if (marketCapA !== marketCapB) {
        return marketCapB - marketCapA;
      }

      // Finally alphabetically by symbol
      return a.symbol.localeCompare(b.symbol);
    });
  }
}