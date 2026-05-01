import { Module, Global } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { StorageProviderFactory } from './providers/storage-provider.factory';
import { S3Provider } from './providers/s3.provider';
import { CloudflareR2Provider } from './providers/cloudflare-r2.provider';
import { MinioProvider } from './providers/minio.provider';
import { LocalStorageProvider } from './providers/local.provider';
import { SettingsModule } from '../settings/settings.module';
import { AuditModule } from '../audit/audit.module';

@Global()
@Module({
  imports: [SettingsModule, AuditModule],
  controllers: [UploadController],
  providers: [
    UploadService,
    StorageProviderFactory,
    S3Provider,
    CloudflareR2Provider,
    MinioProvider,
    LocalStorageProvider,
  ],
  exports: [UploadService],
})
export class UploadModule {}
