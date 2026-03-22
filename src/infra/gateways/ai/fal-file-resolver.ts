import { fal } from '@fal-ai/client';
import { FileStorageGateway } from '../aws/file-storage.gateway';
import { Injectable } from 'src/kernel/decorators/injectable';

const MAX_FAL_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class FalFileResolver {
  constructor(private readonly fileStorageGateway: FileStorageGateway) {}

  async resolve(key: string): Promise<string> {
    const cdnUrl = this.fileStorageGateway.generateCdnUrl(key);
    const response = await fetch(cdnUrl, { method: 'HEAD' });
    const contentLength = Number(response.headers.get('content-length') ?? 0);

    if (contentLength > 0 && contentLength <= MAX_FAL_SIZE) {
      return cdnUrl;
    }

    const fileResponse = await fetch(cdnUrl);
    if (!fileResponse.ok) throw new Error(`Failed to download file: HTTP ${fileResponse.status}`);
    const arrayBuffer = await fileResponse.arrayBuffer();
    return fal.storage.upload(new Blob([new Uint8Array(arrayBuffer)]));
  }
}
