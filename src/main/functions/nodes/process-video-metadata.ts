import 'reflect-metadata';
import { S3Event } from 'aws-lambda';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { parseBuffer } from 'music-metadata';
import { db } from '@infra/database/drizzle/db';
import { fileNodeData } from '@infra/database/drizzle/schema';
import { eq } from 'drizzle-orm';

const s3 = new S3Client({});

export const handler = async (event: S3Event): Promise<void> => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    if (!key.endsWith('.mp4') && !key.endsWith('.webm') && !key.endsWith('.mov')) {
      continue;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      const response = await s3.send(command);

      if (!response.Body) continue;

      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      const metadata = await parseBuffer(buffer, {
        mimeType: 'video/mp4',
      });
      const duration = metadata.format.duration;

      if (!duration || duration <= 0) {
        console.warn(`Could not extract duration for key: ${key}`);
        continue;
      }

      await db
        .update(fileNodeData)
        .set({
          duration,
        })
        .where(eq(fileNodeData.key, key));

      console.info(`Updated duration for key ${key}: ${duration}s`);
    } catch (error) {
      console.error(`Error processing video metadata for key ${key}:`, error);
    }
  }
};
