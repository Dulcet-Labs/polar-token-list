import * as fs from 'fs';
import * as path from 'path';

export interface FileOperationResult<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Safely write data to a file using atomic operations
 */
export const safeFileWrite = async <T>(filePath: string, data: T): Promise<FileOperationResult> => {
  try {
    const tempPath = filePath + '.tmp';
    const jsonContent = JSON.stringify(data, null, 2);
    
    // Write to temp file first
    fs.writeFileSync(tempPath, jsonContent, 'utf-8');
    
    // Verify the temp file
    const verifyContent = fs.readFileSync(tempPath, 'utf-8');
    JSON.parse(verifyContent); // Throws if invalid JSON
    
    // Atomic rename
    fs.renameSync(tempPath, filePath);
    
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

/**
 * Safely read JSON data from a file
 */
export const safeFileRead = async <T>(filePath: string): Promise<FileOperationResult<T>> => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: true, data: undefined };
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content) as T;
    
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

/**
 * Create a backup of a file
 */
export const createBackup = async (filePath: string): Promise<FileOperationResult> => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: true };
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = filePath.replace(/\.json$/, `.backup.${timestamp}.json`);
    
    fs.copyFileSync(filePath, backupPath);
    
    return { success: true, data: backupPath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

/**
 * Ensure directory exists
 */
export const ensureDirectory = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Get file stats
 */
export const getFileStats = (filePath: string) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { exists: false };
    }
    
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      size: stats.size,
      lastModified: stats.mtime,
    };
  } catch {
    return { exists: false };
  }
};