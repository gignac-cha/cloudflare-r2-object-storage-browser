# API Quick Reference Card

**Quick reference for implementing R2 Object Storage Browser API**

---

## Endpoints at a Glance

```
GET    /health                              # Health check
GET    /buckets                             # List buckets
GET    /buckets/{bucket}/objects            # List objects
HEAD   /buckets/{bucket}/objects/{key}      # Get metadata
GET    /buckets/{bucket}/objects/{key}      # Download object
PUT    /buckets/{bucket}/objects/{key}      # Upload object
DELETE /buckets/{bucket}/objects/{key}      # Delete object
GET    /buckets/{bucket}/search             # Search objects
```

---

## Response Envelope Template

```typescript
// Success
{
  "status": "ok",
  "data": { /* your data here */ },
  "meta": {
    "timestamp": new Date().toISOString(),
    "requestId": randomUUID()
  }
}

// Error
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { /* optional context */ }
  },
  "meta": {
    "timestamp": new Date().toISOString(),
    "requestId": randomUUID()
  }
}
```

---

## Error Codes Cheat Sheet

| Category | Prefix | HTTP | Example |
|----------|--------|------|---------|
| Auth | `AUTH_*` | 401/403 | `AUTH_INVALID_CREDENTIALS` |
| Resource | `BUCKET_*`, `OBJECT_*` | 404/409 | `BUCKET_NOT_FOUND` |
| Validation | `VALIDATION_*` | 400/413/416 | `VALIDATION_INVALID_KEY` |
| R2 Service | `R2_*` | 502/504 | `R2_SERVICE_ERROR` |
| Server | `INTERNAL_*` | 500/503 | `INTERNAL_SERVER_ERROR` |

---

## Status Code Decision Tree

```
Success?
├─ Yes → 200 OK (or 201 Created, 206 Partial)
└─ No → Client or Server?
   ├─ Client → 4xx (400, 401, 403, 404, 409, 413, 416, 429)
   └─ Server → 5xx (500, 502, 503, 504)
```

---

## Route Handler Template

```typescript
import type { FastifyInstance } from 'fastify';
import { r2Client } from '../r2-client.ts';
import { createSuccessResponse, createErrorResponse } from '../utils/response.ts';
import { mapS3Error } from '../utils/errors.ts';

export async function registerMyRoutes(server: FastifyInstance) {
  server.get<{
    Params: { bucket: string };
    Querystring: { prefix?: string };
  }>('/buckets/:bucket/objects', async (request, reply) => {
    try {
      const { bucket } = request.params;
      const { prefix } = request.query;

      // Validate
      if (!bucket) {
        return createErrorResponse(
          reply,
          400,
          'VALIDATION_INVALID_PARAM',
          'Bucket name is required'
        );
      }

      // Call R2
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix ?? '',
      });
      const response = await r2Client.send(command);

      // Format response
      return createSuccessResponse(reply, 200, {
        objects: (response.Contents ?? []).map(obj => ({
          key: obj.Key ?? '',
          size: obj.Size ?? 0,
          lastModified: obj.LastModified?.toISOString() ?? '',
        })),
      });
    } catch (error) {
      const apiError = mapS3Error(error);
      return createErrorResponse(
        reply,
        500,
        apiError.code,
        apiError.message,
        apiError.details
      );
    }
  });
}
```

---

## S3 Command Quick Reference

```typescript
import {
  ListObjectsV2Command,    // List objects
  HeadObjectCommand,        // Get metadata
  GetObjectCommand,         // Download
  PutObjectCommand,         // Upload
  DeleteObjectCommand,      // Delete
} from '@aws-sdk/client-s3';

// List objects
const list = new ListObjectsV2Command({
  Bucket: 'my-bucket',
  Prefix: 'folder/',
  Delimiter: '/',
  MaxKeys: 1000,
  ContinuationToken: 'token',
});

// Get metadata
const head = new HeadObjectCommand({
  Bucket: 'my-bucket',
  Key: 'folder/file.txt',
});

// Download
const get = new GetObjectCommand({
  Bucket: 'my-bucket',
  Key: 'folder/file.txt',
  Range: 'bytes=0-1023',    // Optional range
});

// Upload
const put = new PutObjectCommand({
  Bucket: 'my-bucket',
  Key: 'folder/file.txt',
  Body: stream,              // ReadableStream or Buffer
  ContentType: 'text/plain',
});

// Delete
const del = new DeleteObjectCommand({
  Bucket: 'my-bucket',
  Key: 'folder/file.txt',
});

// Execute
const response = await r2Client.send(command);
```

---

## Query Parameter Validation

```typescript
// List objects
interface ListObjectsQuery {
  prefix?: string;           // Optional, any string
  delimiter?: string;        // Optional, typically '/'
  maxKeys?: number;          // 1-1000, default 1000
  continuationToken?: string; // Opaque token from previous response
}

// Validation helper
function validateMaxKeys(maxKeys?: number): number {
  if (maxKeys === undefined) return 1000;
  return Math.max(1, Math.min(maxKeys, 1000));
}
```

---

## URL Encoding Rules

```typescript
// Object keys MUST be URL-encoded in path
const key = 'folder/file name.txt';
const encoded = encodeURIComponent(key);
// Result: 'folder%2Ffile%20name.txt'

// In route handler, Fastify decodes automatically
server.get('/buckets/:bucket/objects/:key', (request) => {
  const { key } = request.params;  // Already decoded
  // Use 'key' directly in S3 commands
});
```

---

## Streaming Upload/Download

```typescript
// Upload with streaming
server.put('/buckets/:bucket/objects/:key', async (request, reply) => {
  const command = new PutObjectCommand({
    Bucket: request.params.bucket,
    Key: request.params.key,
    Body: request.raw,  // Stream from request
    ContentType: request.headers['content-type'],
  });
  const response = await r2Client.send(command);
  return createSuccessResponse(reply, 201, { etag: response.ETag });
});

// Download with streaming
server.get('/buckets/:bucket/objects/:key', async (request, reply) => {
  const command = new GetObjectCommand({
    Bucket: request.params.bucket,
    Key: request.params.key,
  });
  const response = await r2Client.send(command);

  reply.header('Content-Type', response.ContentType);
  reply.header('Content-Length', response.ContentLength);
  reply.header('ETag', response.ETag);

  return reply.send(response.Body);  // Stream to client
});
```

---

## Testing Patterns

```typescript
// Unit test - error mapping
describe('mapS3Error', () => {
  it('maps NoSuchBucket to BUCKET_NOT_FOUND', () => {
    const error = new Error('NoSuchBucket');
    (error as any).name = 'NoSuchBucket';

    const result = mapS3Error(error);

    expect(result.code).toBe('BUCKET_NOT_FOUND');
    expect(result.message).toContain('does not exist');
  });
});

// Integration test - endpoint
describe('GET /buckets/:bucket/objects', () => {
  it('returns list of objects', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/buckets/test-bucket/objects',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe('ok');
    expect(Array.isArray(response.json().data)).toBe(true);
  });

  it('returns 404 for non-existent bucket', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/buckets/invalid/objects',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('BUCKET_NOT_FOUND');
  });
});
```

---

## Common Pitfalls to Avoid

### 1. Double URL Encoding
```typescript
// WRONG - double encoding
const key = encodeURIComponent(encodeURIComponent('folder/file.txt'));

// CORRECT - encode once
const key = encodeURIComponent('folder/file.txt');
```

### 2. Using || Instead of ??
```typescript
// WRONG - breaks for falsy values
const maxKeys = request.query.maxKeys || 1000;  // 0 becomes 1000

// CORRECT - only null/undefined fallback
const maxKeys = request.query.maxKeys ?? 1000;  // 0 stays 0
```

### 3. Missing .ts Extension
```typescript
// WRONG - no extension
import { utils } from './utils';

// CORRECT - always .ts
import { utils } from './utils.ts';
```

### 4. Not Using type Imports
```typescript
// WRONG - runtime import for type
import { FastifyInstance } from 'fastify';

// CORRECT - type-only import
import type { FastifyInstance } from 'fastify';
```

### 5. Loading Entire File into Memory
```typescript
// WRONG - loads entire file
const data = await readFile(path);
await r2Client.send(new PutObjectCommand({ Body: data }));

// CORRECT - stream it
const stream = createReadStream(path);
await r2Client.send(new PutObjectCommand({ Body: stream }));
```

### 6. Not Handling R2 Errors
```typescript
// WRONG - generic error
catch (error) {
  return { error: 'Something went wrong' };
}

// CORRECT - map S3 errors
catch (error) {
  const apiError = mapS3Error(error);
  return createErrorResponse(reply, 500, apiError.code, apiError.message);
}
```

---

## Performance Checklist

- [ ] Use streaming for uploads/downloads
- [ ] Paginate large object listings
- [ ] Implement request timeouts
- [ ] Cache headers for static resources
- [ ] Log R2 API latency
- [ ] Validate inputs before R2 calls
- [ ] Use compression for JSON responses
- [ ] Limit concurrent R2 requests

---

## Security Checklist

- [ ] Validate all path parameters
- [ ] Sanitize object keys (no path traversal)
- [ ] Check file size limits
- [ ] Never log credentials
- [ ] Use HTTPS only (localhost exception)
- [ ] Implement rate limiting
- [ ] Validate Content-Type headers
- [ ] Escape error messages

---

## Debugging Tips

### Enable Debug Logging
```bash
# Environment variable
DEBUG=fastify:* npm run dev

# Or in code
const server = fastify({ logger: { level: 'debug' } });
```

### Check R2 Credentials
```bash
# Test with AWS CLI
aws s3 ls s3://your-bucket \
  --endpoint-url=https://account-id.r2.cloudflarestorage.com \
  --profile=r2
```

### Inspect Request/Response
```typescript
server.addHook('onRequest', (request, reply, done) => {
  console.log(`[${request.id}] ${request.method} ${request.url}`);
  done();
});

server.addHook('onResponse', (request, reply, done) => {
  console.log(`[${request.id}] ${reply.statusCode} (${reply.elapsedTime}ms)`);
  done();
});
```

---

## Files to Create

```
packages/api/sources/
├── types/
│   ├── api.ts          # API response types
│   ├── s3.ts           # S3/R2 types
│   ├── errors.ts       # Error types
│   └── index.ts        # Type exports
├── utils/
│   ├── errors.ts       # Error mapping
│   ├── response.ts     # Response helpers
│   ├── validation.ts   # Input validation
│   └── index.ts        # Utility exports
└── routes/
    └── objects.ts      # Object operations
```

---

## Implementation Order

1. **Types** → Define all TypeScript interfaces
2. **Utils** → Build error mapping and response helpers
3. **Routes** → Implement endpoints one by one
4. **Tests** → Write tests for each endpoint
5. **Integration** → Register routes in application.ts
6. **Validation** → Add input validation
7. **Polish** → Improve error messages, logging

---

## Related Documentation

- **Full Spec**: `API_ROUTES_SPEC.md` (complete endpoint documentation)
- **Summary**: `API_DESIGN_SUMMARY.md` (design decisions and roadmap)
- **Guidelines**: `CLAUDE.md` (coding standards)
- **Requirements**: `../../PRD.md` (product requirements)

---

**Quick Start**: Read full spec → Create types → Build utils → Implement routes → Test
