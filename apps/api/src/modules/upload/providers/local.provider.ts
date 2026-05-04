import { Injectable, Logger } from '@nestjs/common';
import { StorageProvider } from './storage-provider.interface';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly baseDir = './uploads';
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
    // Get the API URL from env, or default to localhost
    this.apiUrl = this.configService.get('NEXT_PUBLIC_API_URL', 'http://localhost:3001');
  }

  async getPresignedPutUrl(key: string, mimeType: string, expiresIn: number): Promise<string> {
    // Local storage mock PUT URL
    return `${this.apiUrl}/api/v1/uploads/local-mock?key=${encodeURIComponent(key)}`;
  }

  async getPresignedGetUrl(key: string, expiresIn: number): Promise<string> {
    return `${this.apiUrl}/api/v1/uploads/local-mock?key=${encodeURIComponent(key)}`;
  }

  async objectExists(key: string): Promise<boolean> {
    return fs.existsSync(path.join(this.baseDir, key));
  }

  async deleteObject(key: string): Promise<void> {
    const fullPath = path.join(this.baseDir, key);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  async getObject(key: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, key);
    return fs.readFileSync(fullPath);
  }

  async putObject(key: string, body: Buffer, mimeType: string): Promise<void> {
    const fullPath = path.join(this.baseDir, key);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, body);
  }
}
