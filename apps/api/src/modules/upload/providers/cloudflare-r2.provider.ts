import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider } from './storage-provider.interface';
import { SettingsService } from '../../settings/settings.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CloudflareR2Provider implements StorageProvider {
  constructor(private readonly settingsService: SettingsService) {}

  private async getClient(): Promise<{ client: S3Client; bucket: string }> {
    const settings = await this.settingsService.getSettings();
    const accessKey = await this.settingsService.getDecryptedApiKey('storage_access_key');
    const secretKey = await this.settingsService.getDecryptedApiKey('storage_secret_key');

    const client = new S3Client({
      region: 'auto',
      endpoint: settings.storage_endpoint || '',
      credentials: {
        accessKeyId: accessKey || '',
        secretAccessKey: secretKey || '',
      },
    });

    return { client, bucket: settings.storage_bucket || '' };
  }

  async getPresignedPutUrl(key: string, mimeType: string, expiresIn: number): Promise<string> {
    const { client, bucket } = await this.getClient();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: mimeType,
    });
    return getSignedUrl(client, command, { expiresIn });
  }

  async getPresignedGetUrl(key: string, expiresIn: number): Promise<string> {
    const { client, bucket } = await this.getClient();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    return getSignedUrl(client, command, { expiresIn });
  }

  async objectExists(key: string): Promise<boolean> {
    const { client, bucket } = await this.getClient();
    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteObject(key: string): Promise<void> {
    const { client, bucket } = await this.getClient();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  async getObject(key: string): Promise<Buffer> {
    const { client, bucket } = await this.getClient();
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const byteArray = await response.Body?.transformToByteArray();
    return Buffer.from(byteArray || []);
  }

  async putObject(key: string, body: Buffer, mimeType: string): Promise<void> {
    const { client, bucket } = await this.getClient();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: mimeType,
      }),
    );
  }
}
