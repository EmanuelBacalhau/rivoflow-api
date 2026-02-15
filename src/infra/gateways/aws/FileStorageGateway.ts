import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '@infra/clients/s3Client';
import KSUID from 'ksuid';
import { Injectable } from 'src/kernel/decorators/injectable';

@Injectable()
export class FileStorageGateway {
  public generateKeyFile(params: FileStorageGateway.GenerateFileKeyParams): string {
    const filename = `${KSUID.randomSync().string}.${params.extension}`;
    return filename;
  }

  public async createPresignedPost(
    params: FileStorageGateway.CreatePresignedPostParams,
  ): Promise<FileStorageGateway.CreatePresignedPostResult> {
    const { file } = params;

    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: process.env.ORION_FLOW_BUCKET!,
      Key: file.key,
      Expires: 3600,
      Conditions: [
        {
          bucket: process.env.ORION_FLOW_BUCKET!,
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
  }

  public async generateGetPresignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: process.env.ORION_FLOW_BUCKET!,
      Key: key,
    });
    const ONE_HOUR_IN_SECONDS = 3600;
    const presigned = await getSignedUrl(s3Client, command, {
      expiresIn: 1000, //
    });

    return presigned;
  }

  public async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: process.env.ORION_FLOW_BUCKET!,
      Key: key,
    });

    await s3Client.send(command);
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
}
