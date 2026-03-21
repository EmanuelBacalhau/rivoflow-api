import { ApplicationError } from '@application/errors/application/application-error';
import { ErrorCode } from '@application/errors/error-code';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { s3Client } from '@infra/clients/s3Client';
import KSUID from 'ksuid';
import { Injectable } from 'src/kernel/decorators/injectable';
import { AppConfig } from 'src/shared/config/app.config';

function s3Error(action: string, error: unknown): never {
  const message = error instanceof Error ? error.message : 'Unknown S3 error';
  throw new ApplicationError(ErrorCode.EXTERNAL_SERVICE_ERROR, `Failed to ${action}: ${message}`);
}

@Injectable()
export class FileStorageGateway {
  constructor(private readonly appConfig: AppConfig) {}

  public generateKeyFile(params: FileStorageGateway.GenerateFileKeyParams): string {
    const filename = `${params.accountId}/${params.flowId}/${KSUID.randomSync().string}.${params.extension}`;
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
      s3Error('create presigned upload URL', error);
    }
  }

  public generateCdnUrl(key: string): string {
    return `https://${this.appConfig.aws.cdnDomainName}/${key}`;
  }

  public async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.appConfig.aws.bucketName,
      Key: key,
    });

    try {
      await s3Client.send(command);
    } catch (error) {
      s3Error('delete file from storage', error);
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
      s3Error('retrieve file from storage', error);
    }
  }

  public async uploadFile(params: FileStorageGateway.UploadFileParams): Promise<string> {
    const key = this.generateKeyFile({
      extension: params.extension,
      accountId: params.accountId,
      flowId: params.flowId,
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
      s3Error('upload file to storage', error);
    }

    return key;
  }

  public async deleteFiles(keys: string[]): Promise<void> {
    const keyForDeletion = keys.map((key) => ({
      Key: key,
    }));

    const command = new DeleteObjectsCommand({
      Bucket: this.appConfig.aws.bucketName,
      Delete: {
        Objects: keyForDeletion,
        Quiet: true,
      },
    });

    try {
      await s3Client.send(command);
    } catch (error) {
      s3Error('delete files from storage', error);
    }
  }

  public async transformS3KeyToBase64(key: string): Promise<string> {
    const file = await this.getFile(key);
    const base64 = Buffer.from(file).toString('base64');
    return base64;
  }
}

export namespace FileStorageGateway {
  export type GenerateFileKeyParams = {
    extension: string;
    accountId: string;
    flowId: string;
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
    accountId: string;
    flowId: string;
  };
}
