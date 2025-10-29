import { Token } from '../types.js';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    score: number; // Quality score 0-100
}

export interface EnrichmentResult {
    enrichedToken: Token;
    enrichments: string[];
    warnings: string[];
}

export class TokenValidation {

    /**
     * Comprehensive token validation with quality scoring
     */
    static validateToken(token: Token): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        let score = 100;

        // Required field validation
        if (!token.name || typeof token.name !== 'string') {
            errors.push('Token name is required and must be a string');
            score -= 20;
        } else if (token.name.trim().length === 0) {
            errors.push('Token name cannot be empty');
            score -= 20;
        } else if (token.name.length > 100) {
            warnings.push('Token name is unusually long (>100 characters)');
            score -= 5;
        }

        if (!token.symbol || typeof token.symbol !== 'string') {
            errors.push('Token symbol is required and must be a string');
            score -= 20;
        } else if (token.symbol.trim().length === 0) {
            errors.push('Token symbol cannot be empty');
            score -= 20;
        } else if (token.symbol.length > 20) {
            warnings.push('Token symbol is unusually long (>20 characters)');
            score -= 5;
        } else if (!/^[A-Z0-9]+$/i.test(token.symbol)) {
            warnings.push('Token symbol contains non-alphanumeric characters');
            score -= 3;
        }

        if (typeof token.decimals !== 'number') {
            errors.push('Token decimals must be a number');
            score -= 15;
        } else if (token.decimals < 0 || token.decimals > 18) {
            errors.push('Token decimals must be between 0 and 18');
            score -= 15;
        } else if (!Number.isInteger(token.decimals)) {
            errors.push('Token decimals must be an integer');
            score -= 10;
        }

        if (!token.objectId || typeof token.objectId !== 'string') {
            errors.push('Token objectId is required and must be a string');
            score -= 25;
        } else if (!this.isValidSuiObjectId(token.objectId)) {
            errors.push('Token objectId is not a valid SUI object ID format');
            score -= 25;
        }

        if (typeof token.verified !== 'boolean') {
            errors.push('Token verified field must be a boolean');
            score -= 10;
        }

        if (!token.addedAt || typeof token.addedAt !== 'string') {
            errors.push('Token addedAt is required and must be a string');
            score -= 5;
        } else if (!this.isValidISODate(token.addedAt)) {
            errors.push('Token addedAt must be a valid ISO date string');
            score -= 5;
        }

        // Optional field validation
        if (token.logoURI && !this.isValidUrl(token.logoURI)) {
            warnings.push('Token logoURI is not a valid URL');
            score -= 3;
        }

        if (token.verifiedBy && typeof token.verifiedBy !== 'string') {
            warnings.push('Token verifiedBy should be a string');
            score -= 2;
        }

        // Tags validation
        if (token.tags) {
            if (!Array.isArray(token.tags)) {
                warnings.push('Token tags should be an array');
                score -= 3;
            } else {
                const invalidTags = token.tags.filter(tag => typeof tag !== 'string');
                if (invalidTags.length > 0) {
                    warnings.push('All token tags should be strings');
                    score -= 2;
                }

                const duplicateTags = token.tags.filter((tag, index) => token.tags!.indexOf(tag) !== index);
                if (duplicateTags.length > 0) {
                    warnings.push('Token has duplicate tags');
                    score -= 1;
                }
            }
        }

        // Extensions validation
        if (token.extensions) {
            if (typeof token.extensions !== 'object' || token.extensions === null) {
                warnings.push('Token extensions should be an object');
                score -= 3;
            } else {
                // Validate common extension fields
                this.validateExtensions(token.extensions, warnings);
            }
        }

        // Quality bonuses
        if (token.logoURI && this.isValidUrl(token.logoURI)) {
            score += 5;
        }

        if (token.extensions?.website && this.isValidUrl(token.extensions.website as string)) {
            score += 3;
        }

        if (token.extensions?.description && (token.extensions.description as string).length > 10) {
            score += 2;
        }

        // Ensure score is within bounds
        score = Math.max(0, Math.min(100, score));

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            score
        };
    }

    /**
     * Enrich token data with additional metadata and corrections
     */
    static enrichToken(token: Token): EnrichmentResult {
        const enrichedToken: Token = { ...token };
        const enrichments: string[] = [];
        const warnings: string[] = [];

        // Normalize symbol to uppercase
        if (token.symbol && token.symbol !== token.symbol.toUpperCase()) {
            enrichedToken.symbol = token.symbol.toUpperCase();
            enrichments.push('Normalized symbol to uppercase');
        }

        // Trim whitespace from string fields
        const stringFields = ['name', 'symbol', 'logoURI', 'verifiedBy'] as const;
        for (const field of stringFields) {
            if (token[field] && typeof token[field] === 'string') {
                const trimmed = (token[field] as string).trim();
                if (trimmed !== token[field]) {
                    (enrichedToken as any)[field] = trimmed;
                    enrichments.push(`Trimmed whitespace from ${field}`);
                }
            }
        }

        // Ensure tags are unique and sorted
        if (token.tags && Array.isArray(token.tags)) {
            const uniqueTags = [...new Set(token.tags.filter(tag => typeof tag === 'string'))];
            uniqueTags.sort();

            if (uniqueTags.length !== token.tags.length || !this.arraysEqual(uniqueTags, token.tags)) {
                enrichedToken.tags = uniqueTags;
                enrichments.push('Deduplicated and sorted tags');
            }
        }

        // Enrich extensions
        if (token.extensions) {
            const enrichedExtensions = this.enrichExtensions(token.extensions);
            if (JSON.stringify(enrichedExtensions) !== JSON.stringify(token.extensions)) {
                enrichedToken.extensions = enrichedExtensions;
                enrichments.push('Enhanced extensions data');
            }
        }

        // Add quality score to extensions
        const validation = this.validateToken(enrichedToken);
        if (!enrichedToken.extensions) {
            enrichedToken.extensions = {};
        }
        enrichedToken.extensions.qualityScore = validation.score;
        enrichments.push(`Added quality score: ${validation.score}`);

        // Add enrichment timestamp
        enrichedToken.extensions.lastEnriched = new Date().toISOString();
        enrichments.push('Added enrichment timestamp');

        return {
            enrichedToken,
            enrichments,
            warnings
        };
    }

    /**
     * Batch validate multiple tokens
     */
    static validateTokenBatch(tokens: Token[]): {
        validTokens: Token[];
        invalidTokens: Array<{ token: Token; validation: ValidationResult }>;
        summary: {
            total: number;
            valid: number;
            invalid: number;
            averageScore: number;
        };
    } {
        const validTokens: Token[] = [];
        const invalidTokens: Array<{ token: Token; validation: ValidationResult }> = [];
        let totalScore = 0;

        for (const token of tokens) {
            const validation = this.validateToken(token);
            totalScore += validation.score;

            if (validation.isValid) {
                validTokens.push(token);
            } else {
                invalidTokens.push({ token, validation });
            }
        }

        return {
            validTokens,
            invalidTokens,
            summary: {
                total: tokens.length,
                valid: validTokens.length,
                invalid: invalidTokens.length,
                averageScore: tokens.length > 0 ? Math.round(totalScore / tokens.length) : 0
            }
        };
    }

    /**
     * Validate SUI object ID format
     */
    private static isValidSuiObjectId(objectId: string): boolean {
        // SUI object IDs should contain :: separators and be properly formatted
        if (!objectId.includes('::')) {
            return false;
        }

        const parts = objectId.split('::');
        if (parts.length < 3) {
            return false;
        }

        // First part should be a hex address (0x followed by hex chars)
        const address = parts[0];
        if (!address.startsWith('0x') || address.length < 3) {
            return false;
        }

        // Check if hex characters are valid
        const hexPart = address.slice(2);
        if (!/^[0-9a-fA-F]+$/.test(hexPart)) {
            return false;
        }

        return true;
    }

    /**
     * Validate ISO date string
     */
    private static isValidISODate(dateString: string): boolean {
        try {
            const date = new Date(dateString);
            return date.toISOString() === dateString;
        } catch {
            return false;
        }
    }

    /**
     * Validate URL format
     */
    private static isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate extensions object
     */
    private static validateExtensions(extensions: Record<string, unknown>, warnings: string[]): void {
        // Validate website URL
        if (extensions.website && typeof extensions.website === 'string') {
            if (!this.isValidUrl(extensions.website)) {
                warnings.push('Extension website is not a valid URL');
            }
        }

        // Validate numeric fields
        const numericFields = ['marketCap', 'price', 'volume24h', 'holders', 'transactions'];
        for (const field of numericFields) {
            if (extensions[field] !== undefined) {
                const value = extensions[field];
                if (typeof value !== 'number' || value < 0) {
                    warnings.push(`Extension ${field} should be a positive number`);
                }
            }
        }

        // Validate description length
        if (extensions.description && typeof extensions.description === 'string') {
            if (extensions.description.length > 1000) {
                warnings.push('Extension description is very long (>1000 characters)');
            }
        }
    }

    /**
     * Enrich extensions with additional data
     */
    private static enrichExtensions(extensions: Record<string, unknown>): Record<string, unknown> {
        const enriched = { ...extensions };

        // Normalize website URL
        if (enriched.website && typeof enriched.website === 'string') {
            let website = enriched.website.trim();
            if (website && !website.startsWith('http://') && !website.startsWith('https://')) {
                website = 'https://' + website;
            }
            enriched.website = website;
        }

        // Round numeric values to reasonable precision
        const numericFields = ['marketCap', 'price', 'volume24h'];
        for (const field of numericFields) {
            if (typeof enriched[field] === 'number') {
                enriched[field] = Math.round((enriched[field] as number) * 100) / 100;
            }
        }

        // Ensure integer fields are integers
        const integerFields = ['holders', 'transactions', 'decimals'];
        for (const field of integerFields) {
            if (typeof enriched[field] === 'number') {
                enriched[field] = Math.round(enriched[field] as number);
            }
        }

        return enriched;
    }

    /**
     * Check if two arrays are equal
     */
    private static arraysEqual(a: any[], b: any[]): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    /**
     * Get validation rules summary
     */
    static getValidationRules(): string[] {
        return [
            'Token name: Required, non-empty string, max 100 characters',
            'Token symbol: Required, non-empty string, max 20 characters, alphanumeric preferred',
            'Token decimals: Required integer between 0 and 18',
            'Token objectId: Required, valid SUI object ID format (contains ::)',
            'Token verified: Required boolean',
            'Token addedAt: Required, valid ISO date string',
            'Token logoURI: Optional, must be valid URL if provided',
            'Token tags: Optional array of unique strings',
            'Token extensions: Optional object with validated fields',
            'Quality scoring: Based on completeness and data quality (0-100)'
        ];
    }
}