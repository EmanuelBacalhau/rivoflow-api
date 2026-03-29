import { Injectable } from 'src/kernel/decorators/injectable';
import { FileStorageGateway } from '../aws/file-storage.gateway';

const MAX_FAL_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FAL_DIMENSION = 3850; // fal.ai max dimension

@Injectable()
export class FalFileResolver {
  constructor(private readonly fileStorageGateway: FileStorageGateway) {}

  async resolve(key: string): Promise<string> {
    const cdnUrl = this.fileStorageGateway.generateCdnUrl(key);

    const isImage = /\.(png|jpe?g|webp|gif|tiff?)$/i.test(key);
    if (!isImage) return cdnUrl;

    const fileResponse = await fetch(cdnUrl);
    if (!fileResponse.ok) throw new Error(`Failed to download file: HTTP ${fileResponse.status}`);
    const buffer = Buffer.from(await fileResponse.arrayBuffer());

    const sharp = (await import('sharp')).default;

    const metadata = await sharp(buffer).metadata();
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;
    const needsResize =
      buffer.length > MAX_FAL_SIZE || width > MAX_FAL_DIMENSION || height > MAX_FAL_DIMENSION;

    if (!needsResize) return cdnUrl;

    const resized = await sharp(buffer)
      .resize({
        width: MAX_FAL_DIMENSION,
        height: MAX_FAL_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
      })
      .toBuffer();

    const resizedKey = await this.fileStorageGateway.uploadFile({
      buffer: resized,
      extension: 'jpg',
      contentType: 'image/jpeg',
      accountId: `tmp/${key.split('/')[0]}`,
      flowId: key.split('/')[1],
    });

    return this.fileStorageGateway.generateCdnUrl(resizedKey);
  }
}
