import { S3Client } from '@aws-sdk/client-s3';
import { options } from './options.ts';

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: options.r2.endpoint,
  credentials: {
    accessKeyId: options.r2.accessKeyId,
    secretAccessKey: options.r2.secretAccessKey,
  },
});
