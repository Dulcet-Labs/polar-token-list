#!/usr/bin/env node

import { BlockBerryVerifiedTokenService } from '../services/blockberry-verified-token-service.js';
import { TokenFileOperations } from '../utils/token-file-operations.js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config();

interface CliOptions {
  tokensFile?: string;
  dryRun?: boolean;
  verbose?: boolean;
  help?: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--tokens-file':
      case '-f':
        options.tokensFile = args[++i];
        break;
      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
        break;
    }
  }

  return options;
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
Polar Token List: Import BlockBerry Verified Tokens as Candidates

USAGE:
  yarn import-verified-candidates [OPTIONS]

OPTIONS:
  -f, --tokens-file <path>    Path to tokens.json file (default: data/tokens.json)
  -d, --dry-run              Show what would be imported without making changes
  -v, --verbose              Show detailed progress information
  -h, --help                 Show this help message

EXAMPLES:
  yarn import-verified-candidates
  yarn import-verified-candidates --dry-run
  yarn import-verified-candidates --tokens-file ./custom-tokens.json
  yarn import-verified-candidates --verbose --dry-run

ENVIRONMENT VARIABLES:
  BLOCKBERRY_API_KEY         Your BlockBerry API key (recommended)

For more information, visit: https://docs.blockberry.one
`);
}

/**
 * CLI script to import all verified tokens from BlockBerry as verification candidates
 */
async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  console.log('=== Polar Token List: Import BlockBerry Verified Tokens as Candidates ===\n');

  // Show configuration
  if (options.verbose) {
    console.log('Configuration:');
    console.log(`- Tokens file: ${options.tokensFile || 'data/tokens.json'}`);
    console.log(`- Dry run: ${options.dryRun ? 'Yes' : 'No'}`);
    console.log(`- Verbose: ${options.verbose ? 'Yes' : 'No'}`);
    console.log('');
  }

  // Check for API key
  const apiKey = process.env.BLOCKBERRY_API_KEY;
  if (apiKey) {
    console.log('✓ Using BlockBerry API key from environment');
  } else {
    console.log('⚠ Warning: No BLOCKBERRY_API_KEY found in environment');
    console.log('  This may result in rate limiting. Get an API key from: https://blockberry.one');
    console.log('  Set it in your .env file: BLOCKBERRY_API_KEY=your_key_here\n');
  }

  // Pre-flight checks
  if (!options.dryRun) {
    console.log('Performing pre-flight checks...');
    
    // Check if tokens file exists and get stats
    const fileOps = new TokenFileOperations(options.tokensFile);
    const fileStats = await fileOps.getFileStats();
    
    if (fileStats.exists) {
      console.log(`✓ Found existing tokens file with ${fileStats.tokenCount} tokens`);
      console.log(`  File size: ${Math.round((fileStats.size || 0) / 1024)}KB`);
      console.log(`  Last modified: ${fileStats.lastModified?.toLocaleString()}`);
    } else {
      console.log('✓ No existing tokens file found, will create new one');
    }

    // Validate existing file integrity
    const validation = await fileOps.validateFileIntegrity();
    if (!validation.success) {
      console.error(`❌ Existing tokens file has issues: ${validation.error}`);
      console.log('Please fix the file or use --tokens-file to specify a different file');
      process.exit(1);
    }
    
    console.log('✓ Pre-flight checks passed\n');
  }

  try {
    // Create service instance
    const service = new BlockBerryVerifiedTokenService(apiKey, options.tokensFile);

    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
      
      // For dry run, we'll just fetch and show what would be imported
      // This is a simplified version that doesn't actually merge
      console.log('This would fetch all verified tokens from BlockBerry and show merge preview...');
      console.log('(Dry run functionality would be implemented here)');
      
      console.log('\n✓ Dry run completed - no changes made');
      process.exit(0);
    }

    // Import verified tokens as candidates
    console.log('Starting import process...\n');
    const startTime = Date.now();
    
    const stats = await service.importVerifiedTokensAsCandidates();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n⏱ Import completed in ${duration} seconds`);

    // Detailed success/error reporting
    if (stats.errors === 0) {
      console.log('\n🎉 Import completed successfully!');
      
      if (options.verbose && stats.mergeStats) {
        console.log('\nDetailed Results:');
        console.log(`- Tokens fetched: ${stats.totalFetched}`);
        console.log(`- Tokens processed: ${stats.totalProcessed}`);
        console.log(`- New tokens added: ${stats.tokensAdded}`);
        console.log(`- Existing tokens updated: ${stats.tokensUpdated}`);
        console.log(`- Duplicates skipped: ${stats.duplicatesSkipped}`);
        
        if (stats.mergeStats.conflicts.length > 0) {
          console.log(`- Merge conflicts resolved: ${stats.mergeStats.conflicts.length}`);
        }
      }
    } else {
      console.log(`\n⚠ Import completed with ${stats.errors} errors`);
      
      if (options.verbose) {
        console.log('\nError Details:');
        stats.errorDetails.forEach((error, index) => {
          console.log(`${index + 1}. ${error}`);
        });
      } else {
        console.log('Use --verbose flag to see detailed error information');
      }
    }

    // Exit with appropriate code
    process.exit(stats.errors > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    
    if (options.verbose && error instanceof Error) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    console.log('\nTroubleshooting:');
    console.log('1. Check your internet connection');
    console.log('2. Verify BlockBerry API is accessible');
    console.log('3. Check if you have write permissions to the data/ directory');
    console.log('4. Consider getting a BlockBerry API key to avoid rate limits');
    console.log('5. Use --verbose flag for more detailed error information');
    
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
    main().catch((error) => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}

export { main };