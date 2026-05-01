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
    const providerName = storageInfo?.provider || 'cloudflare_r2';

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
        provider = this.r2Provider;
    }

    return { provider, config: storageInfo?.config || {} };
  }
}
