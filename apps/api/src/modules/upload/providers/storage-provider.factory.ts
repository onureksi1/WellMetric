import { Injectable } from '@nestjs/common';
import { SettingsService } from '../../settings/settings.service';
import { CloudflareR2Provider } from './cloudflare-r2.provider';
import { S3Provider } from './s3.provider';
import { MinioProvider } from './minio.provider';
import { LocalStorageProvider } from './local.provider';
import { StorageProvider } from './storage-provider.interface';

@Injectable()
export class StorageProviderFactory {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly r2Provider: CloudflareR2Provider,
    private readonly s3Provider: S3Provider,
    private readonly minioProvider: MinioProvider,
    private readonly localProvider: LocalStorageProvider,
  ) {}

  async getProvider(): Promise<{ provider: StorageProvider; config: any }> {
    const storageInfo = await this.settingsService.getDecryptedStorageConfig();
    let providerName = storageInfo?.provider;

    // Fallback to local if in development or if provider is cloud but config is empty
    const isDev = process.env.NODE_ENV === 'development';
    const hasConfig = storageInfo?.config && Object.keys(storageInfo.config).length > 0;

    if (!providerName || (providerName !== 'local' && !hasConfig && isDev)) {
      providerName = 'local';
    }
 
    let provider: StorageProvider;
    switch (providerName) {
      case 'cloudflare_r2':
        provider = this.r2Provider;
        break;
      case 'aws_s3':
        provider = this.s3Provider;
        break;
      case 'minio':
        provider = this.minioProvider;
        break;
      case 'local':
        provider = this.localProvider;
        break;
      default:
        provider = this.localProvider;
    }

    return { provider, config: storageInfo?.config || {} };
  }
}
