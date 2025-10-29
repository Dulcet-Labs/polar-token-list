import { Token } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface FileOperationResult {
  success: boolean;
  error?: string;
  data?: Token[];
}

export class TokenFileOperations {
  private tokensFilePath: string;
  private backupFilePath: string;
  private tempFilePath: string;

  constructor(tokensFilePath?: string) {
    this.tokensFilePath = tokensFilePath || path.join(process.cwd(), 'data', 'tokens.json');
    this.backupFilePath = this.tokensFilePath.replace('.json', '.backup.json');
    this.tempFilePath = this.tokensFilePath.replace('.json', '.tmp.json');
  }

  /**
   * Load existing tokens from file with error handling
   */
  async loadTokens(): Promise<FileOperationResult> {
    try {
      if (!fs.existsSync(this.tokensFilePath)) {
        console.log('No existing tokens file found, starting with empty list');
        return { success: true, data: [] };
      }

      const fileContent = fs.readFileSync(this.tokensFilePath, 'utf-8');
      
      // Validate JSON format
      let tokens: unknown;
      try {
        tokens = JSON.parse(fileContent);
      } catch (parseError) {
        return {
          success: false,
          error: `Invalid JSON format in tokens file: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        };
      }

      // Validate that it's an array of tokens
      if (!Array.isArray(tokens)) {
        return {
          success: false,
          error: 'Tokens file does not contain an array'
        };
      }

      // Basic validation of token structure
      const validTokens = tokens.filter(this.isValidTokenStructure);
      
      if (validTokens.length !== tokens.length) {
        console.warn(`Warning: Filtered out ${tokens.length - validTokens.length} invalid tokens from file`);
      }

      console.log(`✓ Loaded ${validTokens.length} tokens from ${this.tokensFilePath}`);
      return { success: true, data: validTokens as Token[] };

    } catch (error) {
      return {
        success: false,
        error: `Error loading tokens: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Save tokens to file with atomic operations
   */
  async saveTokens(tokens: Token[]): Promise<FileOperationResult> {
    try {
      // Validate input
      if (!Array.isArray(tokens)) {
        return {
          success: false,
          error: 'Tokens must be an array'
        };
      }

      // Validate each token
      const validTokens = tokens.filter(this.isValidTokenStructure);
      if (validTokens.length !== tokens.length) {
        console.warn(`Warning: Filtered out ${tokens.length - validTokens.length} invalid tokens before saving`);
      }

      // Ensure data directory exists
      const dataDir = path.dirname(this.tokensFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Atomic write: write to temp file first, then rename
      const jsonContent = JSON.stringify(validTokens, null, 2);
      fs.writeFileSync(this.tempFilePath, jsonContent, 'utf-8');

      // Verify the temp file was written correctly
      const verifyContent = fs.readFileSync(this.tempFilePath, 'utf-8');
      try {
        const parsedContent = JSON.parse(verifyContent);
        if (!Array.isArray(parsedContent) || parsedContent.length !== validTokens.length) {
          throw new Error('Verification failed: temp file content mismatch');
        }
      } catch (verifyError) {
        fs.unlinkSync(this.tempFilePath); // Clean up temp file
        return {
          success: false,
          error: `File verification failed: ${verifyError instanceof Error ? verifyError.message : String(verifyError)}`
        };
      }

      // Atomic rename
      fs.renameSync(this.tempFilePath, this.tokensFilePath);

      console.log(`✓ Saved ${validTokens.length} tokens to ${this.tokensFilePath}`);
      return { success: true, data: validTokens };

    } catch (error) {
      // Clean up temp file if it exists
      if (fs.existsSync(this.tempFilePath)) {
        try {
          fs.unlinkSync(this.tempFilePath);
        } catch (cleanupError) {
          console.error('Failed to clean up temp file:', cleanupError);
        }
      }

      return {
        success: false,
        error: `Failed to save tokens: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Create backup of existing tokens file
   */
  async createBackup(): Promise<FileOperationResult> {
    try {
      if (!fs.existsSync(this.tokensFilePath)) {
        console.log('No tokens file to backup');
        return { success: true };
      }

      // Create backup with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const timestampedBackupPath = this.backupFilePath.replace('.backup.json', `.backup.${timestamp}.json`);

      fs.copyFileSync(this.tokensFilePath, this.backupFilePath);
      fs.copyFileSync(this.tokensFilePath, timestampedBackupPath);

      console.log(`✓ Created backup at ${this.backupFilePath}`);
      console.log(`✓ Created timestamped backup at ${timestampedBackupPath}`);

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: `Failed to create backup: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Restore from backup in case of failure
   */
  async restoreFromBackup(): Promise<FileOperationResult> {
    try {
      if (!fs.existsSync(this.backupFilePath)) {
        return {
          success: false,
          error: 'No backup file found to restore from'
        };
      }

      fs.copyFileSync(this.backupFilePath, this.tokensFilePath);
      console.log('✓ Restored from backup due to error');

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: `Failed to restore from backup: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Validate file integrity using checksums
   */
  async validateFileIntegrity(): Promise<FileOperationResult> {
    try {
      if (!fs.existsSync(this.tokensFilePath)) {
        return { success: true }; // No file to validate
      }

      const fileContent = fs.readFileSync(this.tokensFilePath, 'utf-8');
      
      // Check if it's valid JSON
      try {
        const tokens = JSON.parse(fileContent);
        if (!Array.isArray(tokens)) {
          return {
            success: false,
            error: 'File does not contain a valid token array'
          };
        }

        // Validate token structures
        const validTokens = tokens.filter(this.isValidTokenStructure);
        if (validTokens.length !== tokens.length) {
          return {
            success: false,
            error: `File contains ${tokens.length - validTokens.length} invalid tokens`
          };
        }

        console.log(`✓ File integrity validated: ${validTokens.length} valid tokens`);
        return { success: true, data: validTokens };

      } catch (parseError) {
        return {
          success: false,
          error: `File contains invalid JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        };
      }

    } catch (error) {
      return {
        success: false,
        error: `Error validating file integrity: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats(): Promise<{ exists: boolean; size?: number; tokenCount?: number; lastModified?: Date }> {
    try {
      if (!fs.existsSync(this.tokensFilePath)) {
        return { exists: false };
      }

      const stats = fs.statSync(this.tokensFilePath);
      const fileContent = fs.readFileSync(this.tokensFilePath, 'utf-8');
      
      let tokenCount = 0;
      try {
        const tokens = JSON.parse(fileContent);
        if (Array.isArray(tokens)) {
          tokenCount = tokens.length;
        }
      } catch {
        // Ignore parse errors for stats
      }

      return {
        exists: true,
        size: stats.size,
        tokenCount,
        lastModified: stats.mtime
      };

    } catch (error) {
      console.error('Error getting file stats:', error);
      return { exists: false };
    }
  }

  /**
   * Clean up temporary and old backup files
   */
  async cleanup(): Promise<void> {
    try {
      // Remove temp file if it exists
      if (fs.existsSync(this.tempFilePath)) {
        fs.unlinkSync(this.tempFilePath);
        console.log('✓ Cleaned up temporary file');
      }

      // Remove old timestamped backups (keep only last 5)
      const dataDir = path.dirname(this.tokensFilePath);
      const backupPattern = path.basename(this.backupFilePath).replace('.backup.json', '.backup.');
      
      const files = fs.readdirSync(dataDir)
        .filter(file => file.startsWith(backupPattern) && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(dataDir, file),
          mtime: fs.statSync(path.join(dataDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Keep only the 5 most recent backups
      const filesToDelete = files.slice(5);
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`✓ Cleaned up old backup: ${file.name}`);
      }

    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Basic validation of token structure
   */
  private isValidTokenStructure(token: any): token is Token {
    return (
      typeof token === 'object' &&
      token !== null &&
      typeof token.name === 'string' &&
      typeof token.symbol === 'string' &&
      typeof token.decimals === 'number' &&
      typeof token.objectId === 'string' &&
      typeof token.verified === 'boolean' &&
      typeof token.addedAt === 'string' &&
      token.name.length > 0 &&
      token.symbol.length > 0 &&
      token.objectId.length > 0 &&
      token.decimals >= 0
    );
  }
}