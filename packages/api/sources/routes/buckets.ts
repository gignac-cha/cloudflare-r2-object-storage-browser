import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ListBucketsCommand } from '@aws-sdk/client-s3';
import { r2Client } from '../r2-client.ts';
import { mapS3Error } from '../utils/errors.ts';
import { createSuccessResponse, createErrorResponse } from '../utils/response.ts';

export async function registerBucketRoutes(server: FastifyInstance) {
  server.get('/buckets', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const command = new ListBucketsCommand({});
      const response = await r2Client.send(command);

      const buckets = (response.Buckets ?? []).map((bucket) => ({
        name: bucket.Name,
        creationDate: bucket.CreationDate?.toISOString(),
      }));

      return createSuccessResponse(reply, 200, {
        buckets,
        count: response.Buckets?.length ?? 0,
      });
    } catch (error) {
      const appError = mapS3Error(error, {});
      return createErrorResponse(
        reply,
        appError.statusCode,
        appError.code,
        appError.message,
        appError.details
      );
    }
  });
}
