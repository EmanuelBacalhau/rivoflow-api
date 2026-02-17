import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ExternalServiceError } from '@application/errors/application/external-service.error';
import { s3Client } from '@infra/clients/s3Client';
import KSUID from 'ksuid';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';

@Injectable()
export class FileStorageGateway {
  constructor(private readonly appConfig: AppConfig) {}

  public generateKeyFile(params: FileStorageGateway.GenerateFileKeyParams): string {
    const filename = `${KSUID.randomSync().string}.${params.extension}`;
    return filename;
  }

  public async createPresignedPost(
    params: FileStorageGateway.CreatePresignedPostParams,
  ): Promise<FileStorageGateway.CreatePresignedPostResult> {
    const { file } = params;

    try {
      const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: this.appConfig.aws.bucketName,
        Key: file.key,
        Expires: 3600,
        Conditions: [
          {
            bucket: this.appConfig.aws.bucketName,
          },
          [
            'eq',
            '$key',
            file.key,
          ],
          [
            'eq',
            '$Content-Type',
            file.type,
          ],
          [
            'content-length-range',
            file.size,
            file.size,
          ],
        ],
      });

      const uploadSignature = Buffer.from(
        JSON.stringify({
          url,
          fields: {
            ...fields,
            'Content-Type': file.type,
          },
        }),
      ).toString('base64');

      return {
        uploadSignature,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown S3 error';
      throw new ExternalServiceError(`Failed to create presigned upload URL: ${message}`);
    }
  }

  public async generateGetPresignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.appConfig.aws.bucketName,
      Key: key,
    });
    // TODO: mudar para cdn
    const ONE_HOUR_IN_SECONDS = 3600;

    try {
      const presigned = await getSignedUrl(s3Client, command, {
        expiresIn: ONE_HOUR_IN_SECONDS,
      });

      return presigned;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown S3 error';
      throw new ExternalServiceError(`Failed to generate presigned download URL: ${message}`);
    }
  }

  public async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.appConfig.aws.bucketName,
      Key: key,
    });

    try {
      await s3Client.send(command);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown S3 error';
      throw new ExternalServiceError(`Failed to delete file from storage: ${message}`);
    }
  }

  public async getFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.appConfig.aws.bucketName,
      Key: key,
    });

    try {
      const response = await s3Client.send(command);
      const stream = response.Body as ReadableStream;
      const chunks: Uint8Array[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown S3 error';
      throw new ExternalServiceError(`Failed to retrieve file from storage: ${message}`);
    }
  }

  public async uploadFile(params: FileStorageGateway.UploadFileParams): Promise<string> {
    const key = this.generateKeyFile({
      extension: params.extension,
    });

    const command = new PutObjectCommand({
      Bucket: this.appConfig.aws.bucketName,
      Key: key,
      Body: params.buffer,
      ContentType: params.contentType,
    });

    try {
      await s3Client.send(command);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown S3 error';
      throw new ExternalServiceError(`Failed to upload file to storage: ${message}`);
    }

    return key;
  }
}

export namespace FileStorageGateway {
  export type GenerateFileKeyParams = {
    extension: string;
  };

  export type CreatePresignedPostParams = {
    file: {
      key: string;
      size: number;
      type: string;
    };
  };

  export type CreatePresignedPostResult = {
    uploadSignature: string;
  };

  export type UploadFileParams = {
    buffer: Buffer;
    extension: string;
    contentType: string;
  };
}
