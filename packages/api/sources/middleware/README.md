# Middleware Documentation

Comprehensive error handling and request logging middleware for the Fastify API server.

---

## Overview

The middleware layer provides:

1. **Global Error Handling** - Catches all unhandled errors and returns consistent responses
2. **Request Logging** - Tracks all requests with unique IDs and sanitized data
3. **Response Tracking** - Monitors response times and status codes
4. **Security** - Never logs credentials or sensitive data

---

## Middleware Components

### 1. Request Logger (`request-logger.ts`)

**Purpose**: Add request IDs, log incoming requests, and track response times.

**Features**:
- Generates UUID v4 for each request
- Logs incoming requests with sanitized data
- Tracks request processing time
- Logs responses with status codes
- Sanitizes sensitive headers and query parameters

**Usage**:
```typescript
import { registerRequestLogger } from './middleware/request-logger.ts';

registerRequestLogger(server);
```

**Request ID Access**:
```typescript
import { getRequestId } from './middleware/request-logger.ts';

const requestId = getRequestId(request);
// Use in error responses, logs, etc.
```

**Log Output Example**:
```json
{
  "level": "info",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "url": "/buckets/my-bucket/objects?prefix=photos/",
  "params": {},
  "query": { "prefix": "photos/" },
  "headers": {
    "user-agent": "Mozilla/5.0...",
    "authorization": "[REDACTED]"
  },
  "ip": "::1",
  "msg": "Incoming request"
}
```

**Sanitization Rules**:

Sensitive data is automatically redacted:
- **Headers**: `authorization`, `cookie`, `x-api-key`, etc.
- **Query Params**: `token`, `apiKey`, `password`, `credentials`, etc.
- **URLs**: Sensitive query parameters replaced with `[REDACTED]`

---

### 2. Error Handler (`error-handler.ts`)

**Purpose**: Catch all unhandled errors and return consistent error responses.

**Features**:
- Catches all error types (AppError, S3Error, generic Error, etc.)
- Maps S3/R2 errors to application error codes
- Handles Fastify validation errors
- Logs errors with full context and stack traces
- Returns safe error responses to clients

**Usage**:
```typescript
import { registerErrorHandler } from './middleware/error-handler.ts';

// Must be registered AFTER routes
registerErrorHandler(server);
```

**Error Flow**:

```
Route throws error
    ↓
Error handler catches
    ↓
Log error (with stack trace)
    ↓
Determine error type
    ↓
├─ AppError → Use code/message
├─ S3Error → Map to AppError
├─ Fastify Error → Map to validation error
└─ Generic Error → Internal server error
    ↓
Return consistent error response
```

**Error Response Format**:
```json
{
  "status": "error",
  "error": {
    "code": "BUCKET_NOT_FOUND",
    "message": "Bucket 'my-bucket' does not exist",
    "details": {
      "bucketName": "my-bucket"
    }
  },
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## Middleware Registration Order

**Critical**: Middleware must be registered in this specific order:

```typescript
export async function createApp() {
  const server = fastify({ logger: true });

  // 1. Request logger FIRST
  registerRequestLogger(server);

  // 2. Routes in the middle
  await registerHealthRoutes(server);
  await registerBucketRoutes(server);
  await registerObjectRoutes(server);

  // 3. Error handler LAST
  registerErrorHandler(server);

  return server;
}
```

**Why this order?**

1. **Request Logger First**: Ensures every request gets a unique ID before any processing
2. **Routes in Middle**: Normal request handling
3. **Error Handler Last**: Catches all errors from routes and previous middleware

---

## Error Handling Strategy

### Error Classification

**By Recoverability:**
- **Recoverable**: Validation errors, not found (user can fix)
- **Partially Recoverable**: Auth errors, permissions (user action needed)
- **Fatal**: R2 service errors, internal errors (retry or contact support)

**By Source:**
- **Client Errors (4xx)**: Invalid input, missing resources
- **Server Errors (5xx)**: R2 failures, unexpected bugs
- **Network Errors**: Timeouts, connection failures

### Error Types

#### 1. AppError (Custom Application Errors)

```typescript
import { AppError } from '../utils/errors.ts';

throw new AppError(
  'BUCKET_NOT_FOUND',
  'Bucket does not exist',
  404,
  { bucketName: 'my-bucket' }
);
```

#### 2. S3/R2 Errors

Automatically mapped to AppError:

```typescript
// S3 throws: NoSuchBucket
// Mapped to: BUCKET_NOT_FOUND (404)

// S3 throws: InvalidAccessKeyId
// Mapped to: AUTH_INVALID_CREDENTIALS (401)

// S3 throws: AccessDenied
// Mapped to: AUTH_PERMISSION_DENIED (403)
```

#### 3. Fastify Validation Errors

```typescript
// Fastify throws: FST_ERR_VALIDATION
// Mapped to: VALIDATION_INVALID_PARAM (400)

// Fastify throws: FST_ERR_CTP_BODY_TOO_LARGE
// Mapped to: VALIDATION_FILE_TOO_LARGE (413)
```

---

## Logging Best Practices

### What to Log

**DO LOG:**
- Request method, URL, params (sanitized)
- Response status codes and timing
- Error messages and codes
- Request IDs for correlation
- User agents for debugging

**DO NOT LOG:**
- Authorization tokens or API keys
- Passwords or credentials
- Cookie values
- Personal identifiable information (PII)
- Full file contents

### Log Levels

```typescript
// INFO: Normal operations
request.log.info({ ... }, 'Incoming request');

// WARN: Client errors (4xx)
request.log.warn({ statusCode: 404 }, 'Response client error');

// ERROR: Server errors (5xx)
request.log.error({ error, stack }, 'Request error');
```

### Log Correlation

Use request IDs to correlate logs across requests:

```bash
# Find all logs for a specific request
grep "550e8400-e29b-41d4-a716-446655440000" server.log
```

---

## Security Considerations

### Sensitive Data Protection

The middleware automatically sanitizes:

1. **Headers**: Authorization, cookies, API keys
2. **Query Parameters**: Tokens, credentials, passwords
3. **URLs**: Sensitive query params replaced with `[REDACTED]`

### Example Sanitization

**Before Sanitization:**
```json
{
  "headers": {
    "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "cookie": "session=abc123; token=xyz789"
  },
  "query": {
    "apiKey": "sk-1234567890",
    "prefix": "photos/"
  }
}
```

**After Sanitization:**
```json
{
  "headers": {
    "authorization": "[REDACTED]",
    "cookie": "[REDACTED]"
  },
  "query": {
    "apiKey": "[REDACTED]",
    "prefix": "photos/"
  }
}
```

---

## Testing Error Handling

### Manual Testing

**Test 404 Errors:**
```bash
curl http://localhost:3000/buckets/non-existent/objects
```

**Test Validation Errors:**
```bash
curl http://localhost:3000/buckets/my-bucket/search
# Missing 'q' parameter
```

**Test Server Errors:**
```bash
# Set invalid R2 credentials
export R2_ACCESS_KEY_ID="invalid"
curl http://localhost:3000/buckets
```

### Integration Tests

```typescript
import { test } from 'node:test';
import { createApp } from '../application.ts';

test('Error handler catches AppError', async (t) => {
  const app = await createApp();

  const response = await app.inject({
    method: 'GET',
    url: '/buckets/non-existent/objects',
  });

  t.equal(response.statusCode, 404);
  const body = response.json();
  t.equal(body.status, 'error');
  t.equal(body.error.code, 'BUCKET_NOT_FOUND');
});
```

---

## Monitoring and Alerting

### Key Metrics to Track

1. **Error Rate**: Percentage of 5xx responses
2. **Response Time**: p50, p95, p99 latencies
3. **Request Volume**: Requests per second
4. **Error Types**: Distribution of error codes

### Alert Thresholds

- **High Error Rate**: >5% of requests return 5xx
- **Slow Requests**: p95 latency >2s
- **Auth Failures**: >10 auth errors per minute
- **R2 Errors**: Any R2_SERVICE_ERROR or R2_TIMEOUT

### Log Analysis

```bash
# Count errors by type
grep "error" server.log | jq '.error.code' | sort | uniq -c

# Find slow requests (>1s)
grep "Response" server.log | jq 'select(.responseTime > 1000)'

# Track error trends
grep "error" server.log | jq -r '.meta.timestamp' | cut -d'T' -f1 | sort | uniq -c
```

---

## Troubleshooting

### Common Issues

#### 1. Errors Not Caught

**Symptom**: Unhandled promise rejection
**Cause**: Error thrown in async context without proper error handler
**Solution**: Ensure error handler is registered after routes

```typescript
// ❌ WRONG ORDER
registerErrorHandler(server);
await registerRoutes(server);

// ✅ CORRECT ORDER
await registerRoutes(server);
registerErrorHandler(server);
```

#### 2. Request ID Missing

**Symptom**: Logs show `requestId: "unknown"`
**Cause**: Request logger not registered first
**Solution**: Ensure request logger is registered before routes

```typescript
// ✅ CORRECT
registerRequestLogger(server);
await registerRoutes(server);
```

#### 3. Sensitive Data in Logs

**Symptom**: Authorization headers or API keys visible in logs
**Cause**: Custom logging bypassing sanitization
**Solution**: Use request logger utilities, never log raw headers

```typescript
// ❌ WRONG
console.log(request.headers);

// ✅ CORRECT
request.log.info({ headers: sanitizeHeaders(request.headers) });
```

---

## Future Enhancements

Potential improvements for future iterations:

1. **Circuit Breaker**: Stop requests to failing R2 service
2. **Rate Limiting**: Throttle requests per IP/user
3. **Request Replay**: Store failed requests for retry
4. **Error Aggregation**: Group similar errors for analysis
5. **Performance Tracing**: Distributed tracing integration
6. **Custom Error Pages**: User-friendly error HTML responses

---

## References

- [Fastify Error Handling](https://fastify.dev/docs/latest/Reference/Errors/)
- [Fastify Hooks](https://fastify.dev/docs/latest/Reference/Hooks/)
- [Fastify Logging](https://fastify.dev/docs/latest/Reference/Logging/)
- [API Routes Specification](../../API_ROUTES_SPEC.md)
- [Error Utilities](../utils/errors.ts)
- [Response Utilities](../utils/response.ts)
