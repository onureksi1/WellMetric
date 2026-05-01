export interface StorageProvider {
  getPresignedPutUrl(
    key: string,
    mimeType: string,
    expiresIn: number,
  ): Promise<string>;
  
  getPresignedGetUrl(
    key: string,
    expiresIn: number,
  ): Promise<string>;
  
  objectExists(key: string): Promise<boolean>;
  
  deleteObject(key: string): Promise<void>;
  
  getObject(key: string): Promise<Buffer>;
  
  putObject(
    key: string,
    body: Buffer,
    mimeType: string,
  ): Promise<void>;
}
