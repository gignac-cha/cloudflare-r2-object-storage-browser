/**
 * Object Operations Routes
 *
 * Implements R2 object operations:
 * - List objects with pagination and folder navigation
 * - Get object metadata (HEAD)
 * - Download objects with streaming support
 * - Upload objects with streaming support
 * - Delete single object
 * - Batch delete multiple objects (up to 1000 per request)
 * - Delete folder (all objects with prefix, paginated batches)
 * - Search objects by name
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type {
  BucketParams,
  ObjectParams,
  ListObjectsQuery,
  SearchQuery,
  DownloadQuery,
  FolderDeleteQuery,
  PresignedUrlQuery,
  BatchDeleteBody,
  S3Object,
  SearchResult,
  StorageClass,
} from '../types/api.ts';
import {
  ListObjectsV2Command,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client } from '../r2-client.ts';
import { mapS3Error, createMissingQueryError, createMissingParamError, createInvalidParamError, createInvalidKeyError } from '../utils/errors.ts';
import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
} from '../utils/response.ts';

// ============================================================================
// Route Registration
// ============================================================================

export async function registerObjectRoutes(server: FastifyInstance) {
  // List objects in bucket with pagination
  server.get<{
    Params: BucketParams;
    Querystring: ListObjectsQuery;
  }>('/buckets/:bucket/objects', listObjectsHandler);

  // Get object metadata (no body)
  server.head<{
    Params: ObjectParams;
  }>('/buckets/:bucket/objects/*', headObjectHandler);

  // Download object with streaming
  server.get<{
    Params: ObjectParams;
    Querystring: DownloadQuery;
  }>('/buckets/:bucket/objects/*', getObjectHandler);

  // Upload object with streaming
  server.put<{
    Params: ObjectParams;
  }>('/buckets/:bucket/objects/*', putObjectHandler);

  // Delete object
  server.delete<{
    Params: ObjectParams;
  }>('/buckets/:bucket/objects/*', deleteObjectHandler);

  // Batch delete multiple objects
  server.delete<{
    Params: BucketParams;
    Body: BatchDeleteBody;
  }>('/buckets/:bucket/objects/batch', batchDeleteObjectsHandler);

  // Delete folder (all objects with prefix)
  server.delete<{
    Params: BucketParams;
    Querystring: FolderDeleteQuery;
  }>('/buckets/:bucket/folders', deleteFolderHandler);

  // Search objects by name
  server.get<{
    Params: BucketParams;
    Querystring: SearchQuery;
  }>('/buckets/:bucket/search', searchObjectsHandler);

  // Generate presigned URL for object
  server.get<{
    Params: ObjectParams;
    Querystring: PresignedUrlQuery;
  }>('/buckets/:bucket/objects/*/presigned-url', getPresignedUrlHandler);
}

// ============================================================================
// Route Handlers
// ============================================================================

/**
 * List objects in bucket with pagination and folder support
 * GET /buckets/:bucket/objects
 */
async function listObjectsHandler(
  request: FastifyRequest<{
    Params: BucketParams;
    Querystring: ListObjectsQuery;
  }>,
  reply: FastifyReply
) {
  try {
    const { bucket } = request.params;
    const {
      prefix,
      delimiter,
      maxKeys,
      continuationToken,
      modifiedAfter,
      modifiedBefore,
      minSize,
      maxSize,
    } = request.query;

    // Validate bucket name
    if (!bucket) {
      throw createMissingParamError('bucket');
    }

    // Call R2 ListObjectsV2
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix ?? undefined,
      Delimiter: delimiter ?? '/',
      MaxKeys: maxKeys ?? 1000,
      ContinuationToken: continuationToken ?? undefined,
    });

    const response = await r2Client.send(command);

    // Map S3 objects to API format
    let objects: S3Object[] = (response.Contents ?? []).map((obj) => ({
      key: obj.Key ?? '',
      size: obj.Size ?? 0,
      lastModified: obj.LastModified?.toISOString() ?? '',
      etag: obj.ETag ?? '',
      storageClass: (obj.StorageClass ?? 'STANDARD') as StorageClass,
    }));

    // Apply client-side filters (modifiedAfter, modifiedBefore, minSize, maxSize)
    if (modifiedAfter) {
      const afterDate = new Date(modifiedAfter);
      objects = objects.filter(
        (obj) => new Date(obj.lastModified) > afterDate
      );
    }

    if (modifiedBefore) {
      const beforeDate = new Date(modifiedBefore);
      objects = objects.filter(
        (obj) => new Date(obj.lastModified) < beforeDate
      );
    }

    if (minSize !== undefined) {
      objects = objects.filter((obj) => obj.size >= minSize);
    }

    if (maxSize !== undefined) {
      objects = objects.filter((obj) => obj.size <= maxSize);
    }

    // Extract folders from commonPrefixes
    const folders = (response.CommonPrefixes ?? [])
      .map((cp) => cp.Prefix)
      .filter((p): p is string => p !== undefined);

    // Build pagination info
    const pagination = {
      isTruncated: response.IsTruncated ?? false,
      maxKeys: response.MaxKeys ?? 1000,
      keyCount: objects.length,
      prefix: response.Prefix,
      delimiter: response.Delimiter,
      continuationToken: response.ContinuationToken,
      nextContinuationToken: response.NextContinuationToken,
      commonPrefixes: folders,
    };

    // Return response with objects and folders structure
    reply.status(200);
    return {
      status: 'ok' as const,
      data: {
        objects,
        folders,
        pagination,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    };
  } catch (error) {
    const appError = mapS3Error(error, {
      bucketName: request.params.bucket,
    });
    return createErrorResponse(
      reply,
      appError.statusCode,
      appError.code,
      appError.message,
      appError.details
    );
  }
}

/**
 * Get object metadata without downloading content
 * HEAD /buckets/:bucket/objects/*
 */
async function headObjectHandler(
  request: FastifyRequest<{
    Params: ObjectParams;
  }>,
  reply: FastifyReply
) {
  try {
    const { bucket } = request.params;
    const key = extractObjectKey(request.url);

    if (!bucket) {
      throw createMissingParamError('bucket');
    }
    if (!key) {
      throw createMissingParamError('key');
    }

    // Call R2 HeadObject
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await r2Client.send(command);

    // Set response headers (no body for HEAD)
    reply.status(200);
    reply.header('Content-Type', response.ContentType ?? 'application/octet-stream');
    reply.header('Content-Length', String(response.ContentLength ?? 0));
    reply.header(
      'Last-Modified',
      response.LastModified?.toUTCString() ?? ''
    );
    reply.header('ETag', response.ETag ?? '');
    reply.header('Accept-Ranges', 'bytes');
    reply.header(
      'X-Amz-Storage-Class',
      response.StorageClass ?? 'STANDARD'
    );

    return reply.send();
  } catch (error) {
    const { bucket } = request.params;
    const key = extractObjectKey(request.url);
    const appError = mapS3Error(error, {
      bucketName: bucket,
      objectKey: key,
    });
    return createErrorResponse(
      reply,
      appError.statusCode,
      appError.code,
      appError.message,
      appError.details
    );
  }
}

/**
 * Download object with streaming support
 * GET /buckets/:bucket/objects/*
 */
async function getObjectHandler(
  request: FastifyRequest<{
    Params: ObjectParams;
    Querystring: DownloadQuery;
  }>,
  reply: FastifyReply
) {
  try {
    const { bucket } = request.params;
    const key = extractObjectKey(request.url);
    const { range } = request.query;

    if (!bucket) {
      throw createMissingParamError('bucket');
    }
    if (!key) {
      throw createMissingParamError('key');
    }

    // Call R2 GetObject
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      Range: range ?? undefined,
    });

    const response = await r2Client.send(command);

    // Determine filename from key
    const filename = key.split('/').pop() ?? 'download';

    // Set response headers
    reply.status(range ? 206 : 200);
    reply.header('Content-Type', response.ContentType ?? 'application/octet-stream');
    reply.header('Content-Length', String(response.ContentLength ?? 0));
    reply.header(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(filename)}"`
    );
    reply.header(
      'Last-Modified',
      response.LastModified?.toUTCString() ?? ''
    );
    reply.header('ETag', response.ETag ?? '');
    reply.header('Accept-Ranges', 'bytes');
    reply.header(
      'X-Amz-Storage-Class',
      response.StorageClass ?? 'STANDARD'
    );

    if (range && response.ContentRange) {
      reply.header('Content-Range', response.ContentRange);
    }

    // Stream the body
    // AWS SDK v3 returns a readable stream in Body
    if (response.Body) {
      return reply.send(response.Body);
    }

    // Fallback if no body
    return reply.status(500).send({ error: 'No content in response' });
  } catch (error) {
    const { bucket } = request.params;
    const key = extractObjectKey(request.url);
    const appError = mapS3Error(error, {
      bucketName: bucket,
      objectKey: key,
    });
    return createErrorResponse(
      reply,
      appError.statusCode,
      appError.code,
      appError.message,
      appError.details
    );
  }
}

/**
 * Upload object with streaming support
 * PUT /buckets/:bucket/objects/*
 */
async function putObjectHandler(
  request: FastifyRequest<{
    Params: ObjectParams;
  }>,
  reply: FastifyReply
) {
  try {
    const { bucket } = request.params;
    const key = extractObjectKey(request.url);

    if (!bucket) {
      throw createMissingParamError('bucket');
    }
    if (!key) {
      throw createMissingParamError('key');
    }

    // Validate object key
    if (key.length === 0) {
      throw createInvalidKeyError(key, 'Object key cannot be empty');
    }

    // Get Content-Type from headers
    const contentType =
      request.headers['content-type'] ?? 'application/octet-stream';
    const contentLength = request.headers['content-length'];

    // Call R2 PutObject with streaming body
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: request.raw, // Stream request body directly
      ContentType: contentType,
      ContentLength: contentLength ? Number(contentLength) : undefined,
    });

    const response = await r2Client.send(command);

    // Get object metadata to return full info
    const headCommand = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const metadata = await r2Client.send(headCommand);

    return createSuccessResponse(reply, 201, {
      key,
      etag: response.ETag ?? '',
      size: metadata.ContentLength ?? 0,
      contentType: metadata.ContentType ?? contentType,
      lastModified: metadata.LastModified?.toISOString() ?? new Date().toISOString(),
    });
  } catch (error) {
    const { bucket } = request.params;
    const key = extractObjectKey(request.url);
    const appError = mapS3Error(error, {
      bucketName: bucket,
      objectKey: key,
    });
    return createErrorResponse(
      reply,
      appError.statusCode,
      appError.code,
      appError.message,
      appError.details
    );
  }
}

/**
 * Delete object from bucket
 * DELETE /buckets/:bucket/objects/*
 */
async function deleteObjectHandler(
  request: FastifyRequest<{
    Params: ObjectParams;
  }>,
  reply: FastifyReply
) {
  try {
    const { bucket } = request.params;
    const key = extractObjectKey(request.url);

    if (!bucket) {
      throw createMissingParamError('bucket');
    }
    if (!key) {
      throw createMissingParamError('key');
    }

    // Call R2 DeleteObject
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await r2Client.send(command);

    return createSuccessResponse(reply, 200, {
      key,
      deleted: true,
    });
  } catch (error) {
    const { bucket } = request.params;
    const key = extractObjectKey(request.url);
    const appError = mapS3Error(error, {
      bucketName: bucket,
      objectKey: key,
    });
    return createErrorResponse(
      reply,
      appError.statusCode,
      appError.code,
      appError.message,
      appError.details
    );
  }
}

/**
 * Batch delete multiple objects from bucket
 * DELETE /buckets/:bucket/objects/batch
 * Body: { keys: string[] }
 */
async function batchDeleteObjectsHandler(
  request: FastifyRequest<{
    Params: BucketParams;
    Body: BatchDeleteBody;
  }>,
  reply: FastifyReply
) {
  try {
    const { bucket } = request.params;
    const { keys } = request.body;

    // Validate bucket name
    if (!bucket) {
      throw createMissingParamError('bucket');
    }

    // Validate keys array
    if (!keys || !Array.isArray(keys)) {
      throw createInvalidParamError('keys', 'array of strings', keys);
    }

    if (keys.length === 0) {
      throw createInvalidParamError('keys', 'non-empty array', keys);
    }

    if (keys.length > 1000) {
      throw createInvalidParamError(
        'keys',
        'array with max 1000 items',
        `${keys.length} items`
      );
    }

    // Validate each key is a non-empty string
    for (const key of keys) {
      if (typeof key !== 'string' || key.length === 0) {
        throw createInvalidKeyError(key, 'Object key must be a non-empty string');
      }
    }

    request.log.info(`Batch deleting ${keys.length} objects from bucket: ${bucket}`);

    // Call R2 DeleteObjects
    const command = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: false, // Return results for all objects
      },
    });

    const response = await r2Client.send(command);

    // Process results
    const deleted = (response.Deleted ?? []).map((obj) => obj.Key ?? '').filter((k) => k !== '');
    const errors = (response.Errors ?? []).map((err) => ({
      key: err.Key ?? '',
      code: err.Code ?? 'UnknownError',
      message: err.Message ?? 'Unknown error occurred',
    }));

    request.log.info(`Batch delete completed: ${deleted.length} deleted, ${errors.length} errors`);

    return createSuccessResponse(reply, 200, {
      deletedCount: deleted.length,
      deleted,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const { bucket } = request.params;
    request.log.error({ error }, 'Batch delete failed');
    const appError = mapS3Error(error, {
      bucketName: bucket,
    });
    return createErrorResponse(
      reply,
      appError.statusCode,
      appError.code,
      appError.message,
      appError.details
    );
  }
}

/**
 * Delete folder (all objects with prefix)
 * DELETE /buckets/:bucket/folders?prefix=path/to/folder/
 */
async function deleteFolderHandler(
  request: FastifyRequest<{
    Params: BucketParams;
    Querystring: FolderDeleteQuery;
  }>,
  reply: FastifyReply
) {
  try {
    const { bucket } = request.params;
    const { prefix } = request.query;

    // Validate bucket name
    if (!bucket) {
      throw createMissingParamError('bucket');
    }

    // Validate prefix
    if (!prefix) {
      throw createMissingQueryError();
    }

    if (typeof prefix !== 'string' || prefix.length === 0) {
      throw createInvalidParamError('prefix', 'non-empty string', prefix);
    }

    request.log.info(`Deleting folder with prefix: ${prefix} from bucket: ${bucket}`);

    let totalDeleted = 0;
    let batchCount = 0;
    let continuationToken: string | undefined;

    // List and delete objects in batches
    do {
      // List objects with prefix
      const listCommand = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: 1000, // Maximum batch size
        ContinuationToken: continuationToken,
      });

      const listResponse = await r2Client.send(listCommand);
      const objects = listResponse.Contents ?? [];

      if (objects.length === 0) {
        break; // No more objects to delete
      }

      request.log.info(`Found ${objects.length} objects in batch ${batchCount + 1}`);

      // Delete batch of objects
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: objects.map((obj) => ({ Key: obj.Key ?? '' })),
          Quiet: false,
        },
      });

      const deleteResponse = await r2Client.send(deleteCommand);
      const deleted = deleteResponse.Deleted ?? [];
      const errors = deleteResponse.Errors ?? [];

      totalDeleted += deleted.length;
      batchCount++;

      if (errors.length > 0) {
        request.log.warn(`Batch ${batchCount} had ${errors.length} errors`);
        // Log first few errors for debugging
        errors.slice(0, 3).forEach((err) => {
          request.log.warn(`Delete error: ${err.Key} - ${err.Code}: ${err.Message}`);
        });
      }

      request.log.info(`Batch ${batchCount} complete: ${deleted.length} deleted`);

      // Check if there are more objects to delete
      continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);

    request.log.info(`Folder delete completed: ${totalDeleted} total objects deleted in ${batchCount} batches`);

    return createSuccessResponse(reply, 200, {
      prefix,
      totalDeleted,
      batchCount,
    });
  } catch (error) {
    const { bucket } = request.params;
    const { prefix } = request.query;
    request.log.error({ error }, 'Folder delete failed');
    const appError = mapS3Error(error, {
      bucketName: bucket,
      objectKey: prefix,
    });
    return createErrorResponse(
      reply,
      appError.statusCode,
      appError.code,
      appError.message,
      appError.details
    );
  }
}

/**
 * Search objects by name (client-side filtering)
 * GET /buckets/:bucket/search
 */
async function searchObjectsHandler(
  request: FastifyRequest<{
    Params: BucketParams;
    Querystring: SearchQuery;
  }>,
  reply: FastifyReply
) {
  const startTime = Date.now();

  try {
    const { bucket } = request.params;
    const { q, prefix, maxKeys, continuationToken } = request.query;

    // Validate required query parameter
    if (!q) {
      throw createMissingQueryError();
    }

    if (!bucket) {
      throw createMissingParamError('bucket');
    }

    // List all objects with optional prefix filter
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix ?? undefined,
      MaxKeys: 1000, // Fetch more to search through
      ContinuationToken: continuationToken ?? undefined,
    });

    const response = await r2Client.send(command);

    // Map to S3Object format
    const allObjects: S3Object[] = (response.Contents ?? []).map((obj) => ({
      key: obj.Key ?? '',
      size: obj.Size ?? 0,
      lastModified: obj.LastModified?.toISOString() ?? '',
      etag: obj.ETag ?? '',
      storageClass: (obj.StorageClass ?? 'STANDARD') as StorageClass,
    }));

    // Filter by search query (case-insensitive substring match)
    const query = q.toLowerCase();
    const matches: SearchResult[] = allObjects
      .filter((obj) => {
        const filename = obj.key.split('/').pop() ?? '';
        const filenameMatch = filename.toLowerCase().includes(query);
        const pathMatch = obj.key.toLowerCase().includes(query);
        return filenameMatch || pathMatch;
      })
      .map((obj) => {
        const filename = obj.key.split('/').pop() ?? '';
        const filenameMatch = filename.toLowerCase().includes(query);
        return {
          ...obj,
          matchType: (filenameMatch ? 'filename' : 'path') as 'filename' | 'path',
        };
      });

    // Apply maxKeys limit to search results
    const limitedMatches =
      maxKeys !== undefined ? matches.slice(0, maxKeys) : matches.slice(0, 100);

    // Calculate search time
    const searchTime = (Date.now() - startTime) / 1000;

    // Build response
    const searchMeta = {
      query: q,
      prefix,
      totalMatches: matches.length,
      searchTime,
    };

    const pagination = {
      isTruncated: response.IsTruncated ?? false,
      maxKeys: maxKeys ?? 100,
      keyCount: limitedMatches.length,
      nextContinuationToken: response.NextContinuationToken,
    };

    reply.status(200);
    return {
      status: 'ok' as const,
      data: limitedMatches,
      searchMeta,
      pagination,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    };
  } catch (error) {
    const { bucket } = request.params;
    const appError = mapS3Error(error, {
      bucketName: bucket,
    });
    return createErrorResponse(
      reply,
      appError.statusCode,
      appError.code,
      appError.message,
      appError.details
    );
  }
}

/**
 * Generate presigned URL for object download
 * GET /buckets/:bucket/objects/{key}/presigned-url
 */
async function getPresignedUrlHandler(
  request: FastifyRequest<{
    Params: ObjectParams;
    Querystring: PresignedUrlQuery;
  }>,
  reply: FastifyReply
) {
  try {
    const { bucket } = request.params;
    const key = extractObjectKey(request.url);
    const { expiresIn = 3600 } = request.query;

    if (!bucket) {
      throw createMissingParamError('bucket');
    }
    if (!key) {
      throw createMissingParamError('key');
    }

    // Validate expiresIn (max 7 days = 604800 seconds)
    if (expiresIn < 1 || expiresIn > 604800) {
      throw createInvalidParamError(
        'expiresIn',
        'number between 1 and 604800',
        expiresIn
      );
    }

    // Create GetObjectCommand for presigned URL
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    // Generate presigned URL
    const url = await getSignedUrl(r2Client, command, {
      expiresIn,
    });

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    return createSuccessResponse(reply, 200, {
      key,
      url,
      expiresIn,
      expiresAt,
    });
  } catch (error) {
    const { bucket } = request.params;
    const key = extractObjectKey(request.url);
    const appError = mapS3Error(error, {
      bucketName: bucket,
      objectKey: key,
    });
    return createErrorResponse(
      reply,
      appError.statusCode,
      appError.code,
      appError.message,
      appError.details
    );
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract object key from URL path
 * Handles wildcard routes like /buckets/:bucket/objects/*
 * @param url - Request URL
 * @returns Decoded object key
 */
function extractObjectKey(url: string): string {
  // URL format: /buckets/{bucket}/objects/{key}
  // Extract everything after /objects/
  // Handle both normal object paths and presigned-url paths
  const match = url.match(/\/objects\/(.+?)(?:\/presigned-url)?(?:\?|$)/);
  if (!match) {
    return '';
  }

  // Decode URL-encoded key
  const encodedKey = match[1];
  return decodeURIComponent(encodedKey);
}
