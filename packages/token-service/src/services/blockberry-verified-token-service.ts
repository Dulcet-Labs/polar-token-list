import { BlockBerryAPI } from '../discovery/blockberry-api.js';
import { Token } from '../types.js';
import { TokenFileOperations } from '../utils/token-file-operations.js';
import { TokenMergeUtils, MergeStats } from '../utils/token-merge-utils.js';
import { TokenValidation } from '../utils/token-validation.js';

export interface ImportStats {
  totalFetched: number;
  totalProcessed: number;
  duplicatesSkipped: number;
  tokensUpdated: number;
  tokensAdded: number;
  tokensEnriched: number;
  validationErrors: number;
  validationWarnings: number;
  averageQualityScore: number;
  errors: number;
  errorDetails: string[];
  mergeStats?: MergeStats;
}

export class BlockBerryVerifiedTokenService {
  private blockberryApi: BlockBerryAPI;
  private fileOps: TokenFileOperations;

  constructor(apiKey?: string, tokensFilePath?: string) {
    this.blockberryApi = new BlockBerryAPI(apiKey);
    this.fileOps = new TokenFileOperations(tokensFilePath);
  }

  /**
   * Main entry point for importing all verified tokens from BlockBerry as candidates
   */
  async importVerifiedTokensAsCandidates(): Promise<ImportStats> {
    console.log('=== BlockBerry Verified Token Import (as Candidates) ===\n');

    const stats: ImportStats = {
      totalFetched: 0,
      totalProcessed: 0,
      duplicatesSkipped: 0,
      tokensUpdated: 0,
      tokensAdded: 0,
      tokensEnriched: 0,
      validationErrors: 0,
      validationWarnings: 0,
      averageQualityScore: 0,
      errors: 0,
      errorDetails: []
    };

    try {
      // Step 1: Create backup of existing tokens
      const backupResult = await this.fileOps.createBackup();
      if (!backupResult.success) {
        console.warn(`Backup failed: ${backupResult.error}`);
      }

      // Step 2: Load existing tokens
      const loadResult = await this.fileOps.loadTokens();
      if (!loadResult.success) {
        throw new Error(`Failed to load existing tokens: ${loadResult.error}`);
      }
      const existingTokens = loadResult.data || [];
      console.log(`Loaded ${existingTokens.length} existing tokens`);

      // Step 3: Fetch all verified tokens from BlockBerry as candidates
      console.log('Fetching all verified tokens from BlockBerry as candidates...');
      const candidateTokens = await this.fetchVerifiedTokensFromBlockBerry(stats);

      if (candidateTokens.length === 0) {
        console.log('❌ No tokens fetched from BlockBerry');
        return stats;
      }

      // Step 4: Validate and process the candidate tokens
      const validatedTokens = await this.validateTokenBatch(candidateTokens, stats);

      // Step 5: Merge with existing tokens (deduplication)
      const mergeResult = TokenMergeUtils.mergeTokenLists(existingTokens, validatedTokens, {
        updateExistingMetadata: true,
        preserveVerificationStatus: true, // Don't auto-verify existing tokens
        mergeTags: true,
        updateTimestamps: false
      });

      const mergedTokens = mergeResult.mergedTokens;
      stats.mergeStats = mergeResult.stats;
      stats.duplicatesSkipped = mergeResult.stats.duplicatesSkipped;
      stats.tokensUpdated = mergeResult.stats.tokensUpdated;
      stats.tokensAdded = mergeResult.stats.tokensAdded;

      // Step 6: Save updated token list
      const saveResult = await this.fileOps.saveTokens(mergedTokens);
      if (!saveResult.success) {
        throw new Error(`Failed to save tokens: ${saveResult.error}`);
      }

      // Step 7: Report final statistics
      this.reportFinalStats(stats, mergedTokens.length, mergedTokens);

      return stats;

    } catch (error) {
      console.error('Import process failed:', error);
      stats.errors++;
      stats.errorDetails.push(`Import process failed: ${error instanceof Error ? error.message : String(error)}`);
      
      // Attempt to restore from backup
      const restoreResult = await this.fileOps.restoreFromBackup();
      if (!restoreResult.success) {
        console.error(`Failed to restore from backup: ${restoreResult.error}`);
      }
      throw error;
    }
  }

  /**
   * Fetch all verified tokens from BlockBerry API as candidates
   */
  private async fetchVerifiedTokensFromBlockBerry(stats: ImportStats): Promise<Token[]> {
    try {
      const candidateTokens = await this.blockberryApi.getAllVerifiedTokensAsCandidates();
      stats.totalFetched = candidateTokens.length;
      
      console.log(`✓ Fetched ${candidateTokens.length} verified tokens as candidates from BlockBerry`);
      return candidateTokens;

    } catch (error) {
      console.error('Failed to fetch tokens from BlockBerry:', error);
      stats.errors++;
      stats.errorDetails.push(`API fetch failed: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Validate and enrich a batch of candidate tokens
   */
  private async validateTokenBatch(candidateTokens: Token[], stats: ImportStats): Promise<Token[]> {
    console.log(`Validating and enriching ${candidateTokens.length} candidate tokens...`);

    // Batch validate all tokens
    const batchValidation = TokenValidation.validateTokenBatch(candidateTokens);
    
    stats.validationErrors += batchValidation.invalidTokens.length;
    stats.averageQualityScore = batchValidation.summary.averageScore;

    // Log validation summary
    console.log(`Validation Summary:`);
    console.log(`- Valid tokens: ${batchValidation.summary.valid}`);
    console.log(`- Invalid tokens: ${batchValidation.summary.invalid}`);
    console.log(`- Average quality score: ${batchValidation.summary.averageScore}`);

    // Log invalid tokens
    if (batchValidation.invalidTokens.length > 0) {
      console.log('\nInvalid tokens found:');
      batchValidation.invalidTokens.slice(0, 5).forEach(({ token, validation }) => {
        console.log(`- ${token.symbol}: ${validation.errors.join(', ')}`);
        stats.errorDetails.push(`Invalid token ${token.symbol}: ${validation.errors.join(', ')}`);
      });
      
      if (batchValidation.invalidTokens.length > 5) {
        console.log(`... and ${batchValidation.invalidTokens.length - 5} more invalid tokens`);
      }
    }

    // Enrich valid tokens
    const enrichedTokens: Token[] = [];
    let totalWarnings = 0;

    for (const token of batchValidation.validTokens) {
      try {
        const enrichment = TokenValidation.enrichToken(token);
        enrichedTokens.push(enrichment.enrichedToken);
        
        if (enrichment.enrichments.length > 0) {
          stats.tokensEnriched++;
        }
        
        totalWarnings += enrichment.warnings.length;
        stats.totalProcessed++;

      } catch (error) {
        console.error(`Error enriching token ${token.symbol}:`, error);
        stats.errors++;
        stats.errorDetails.push(`Enrichment error for ${token.symbol}: ${error instanceof Error ? error.message : String(error)}`);
        
        // Still include the token even if enrichment fails
        enrichedTokens.push(token);
        stats.totalProcessed++;
      }
    }

    stats.validationWarnings = totalWarnings;

    console.log(`✓ Processed ${enrichedTokens.length} tokens (${stats.tokensEnriched} enriched)`);
    
    if (totalWarnings > 0) {
      console.log(`⚠ Found ${totalWarnings} validation warnings`);
    }

    return enrichedTokens;
  }









  /**
   * Report final statistics
   */
  private reportFinalStats(stats: ImportStats, totalTokens: number, mergedTokens: Token[]): void {
    console.log('\n=== Import Complete ===');
    console.log(`Total tokens fetched from BlockBerry: ${stats.totalFetched}`);
    console.log(`Total tokens processed: ${stats.totalProcessed}`);
    console.log(`New tokens added: ${stats.tokensAdded}`);
    console.log(`Existing tokens updated: ${stats.tokensUpdated}`);
    console.log(`Tokens enriched: ${stats.tokensEnriched}`);
    console.log(`Duplicates skipped: ${stats.duplicatesSkipped}`);
    console.log(`Final token count in list: ${totalTokens}`);

    // Quality metrics
    console.log('\n=== Quality Metrics ===');
    console.log(`Average quality score: ${stats.averageQualityScore}/100`);
    console.log(`Validation errors: ${stats.validationErrors}`);
    console.log(`Validation warnings: ${stats.validationWarnings}`);
    console.log(`Processing errors: ${stats.errors}`);

    // Report merge conflicts if any
    if (stats.mergeStats && stats.mergeStats.conflicts.length > 0) {
      console.log(`\nMerge conflicts resolved: ${stats.mergeStats.conflicts.length}`);
      
      // Show first few conflicts as examples
      const conflictsToShow = stats.mergeStats.conflicts.slice(0, 3);
      conflictsToShow.forEach((conflict, index) => {
        console.log(`${index + 1}. ${conflict.symbol} (${conflict.conflictType}): ${conflict.resolution}`);
      });
      
      if (stats.mergeStats.conflicts.length > 3) {
        console.log(`... and ${stats.mergeStats.conflicts.length - 3} more conflicts`);
      }
    }

    // Final validation report
    const validation = TokenMergeUtils.validateTokenList(mergedTokens);
    if (!validation.isValid) {
      console.log('\n⚠ Final token list validation found issues:');
      validation.issues.slice(0, 5).forEach(issue => console.log(`- ${issue}`));
      
      if (validation.duplicateObjectIds.length > 0) {
        console.log(`\nDuplicate objectIds found: ${validation.duplicateObjectIds.length}`);
      }
    } else {
      console.log('\n✓ Final token list validation passed');
    }

    // Quality distribution
    const qualityScores = mergedTokens
      .map(token => (token.extensions?.qualityScore as number) || 0)
      .filter(score => score > 0);
    
    if (qualityScores.length > 0) {
      const highQuality = qualityScores.filter(score => score >= 80).length;
      const mediumQuality = qualityScores.filter(score => score >= 60 && score < 80).length;
      const lowQuality = qualityScores.filter(score => score < 60).length;
      
      console.log('\n=== Quality Distribution ===');
      console.log(`High quality (80-100): ${highQuality} tokens`);
      console.log(`Medium quality (60-79): ${mediumQuality} tokens`);
      console.log(`Low quality (<60): ${lowQuality} tokens`);
    }

    if (stats.errors > 0 || stats.validationErrors > 0) {
      console.log('\n=== Error Details ===');
      stats.errorDetails.slice(0, 10).forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      
      if (stats.errorDetails.length > 10) {
        console.log(`... and ${stats.errorDetails.length - 10} more errors`);
      }
    }

    console.log('\n=== Next Steps ===');
    console.log('1. Review the candidate tokens in data/tokens.json');
    console.log('2. Focus on high-quality tokens (score >= 80) for verification');
    console.log('3. Manually verify tokens you want to add to data/verified-tokens.json');
    console.log('4. Set verified: true and verifiedBy: "polar-admin" for approved tokens');
    console.log('5. Run yarn generate to create the final token lists');
    
    if (stats.averageQualityScore < 70) {
      console.log('\n⚠ Note: Average quality score is below 70. Consider reviewing data sources.');
    }
  }
}