import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

const TOKEN_SERVICE_PATH = path.resolve(process.cwd(), '../token-service/data');

export class FileHandler {
    static readTokenFile(filename: string) {
        const filePath = path.join(TOKEN_SERVICE_PATH, filename);
        if (!existsSync(filePath)) {
            throw new Error(`File ${filename} not found`);
        }
        const content = readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    }

    static writeTokenFile(filename: string, data: any) {
        const filePath = path.join(TOKEN_SERVICE_PATH, filename);
        writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }

    static getVerifiedTokens() {
        return this.readTokenFile('verified-tokens.json');
    }

    static getPolarVerifiedTokens() {
        return this.readTokenFile('polar-verified.json');
    }

    static getStrictTokens() {
        return this.readTokenFile('strict-tokens.json');
    }

    static updatePolarVerifiedTokens(tokens: any[]) {
        this.writeTokenFile('polar-verified.json', tokens);
    }

    static updateStrictTokens(tokens: any[]) {
        this.writeTokenFile('strict-tokens.json', tokens);
    }
}