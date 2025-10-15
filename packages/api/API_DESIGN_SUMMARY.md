# API Design Summary

**Document**: API Routes Specification v1.0.0
**Date**: 2025-10-14
**Status**: Ready for Implementation

---

## Overview

This document provides a high-level summary of the API architecture design for the Cloudflare R2 Object Storage Browser. The complete specification is in `API_ROUTES_SPEC.md`.

---

## Key Design Decisions

### 1. RESTful Resource-Oriented Architecture

**Decision**: Use RESTful conventions with resource-based URLs.

**Rationale**:
- Intuitive and predictable for developers
- Follows industry best practices
- Aligns with S3 API conventions
- Easy to extend and maintain

**Example**:
```
GET    /buckets/{bucket}/objects/{key}    # Download object
PUT    /buckets/{bucket}/objects/{key}    # Upload object
DELETE /buckets/{bucket}/objects/{key}    # Delete object
```

### 2. Consistent Response Envelope

**Decision**: All responses use a standard envelope structure.

**Format**:
```json
{
  "status": "ok" | "error",
  "data": { /* resource data */ },
  "error": { /* error details */ },
  "meta": {
    "timestamp": "ISO 8601",
    "requestId": "UUID v4"
  }
}
```

**Rationale**:
- Predictable response structure
- Easy to parse in frontend
- Supports error tracking with request IDs
- Allows future metadata additions without breaking changes

### 3. S3-Compatible Pagination

**Decision**: Use cursor-based pagination matching S3 API.

**Parameters**:
- `maxKeys`: Items per page (default: 1000)
- `continuationToken`: Cursor from previous response
- `nextContinuationToken`: Cursor for next page
- `isTruncated`: Boolean indicating more results

**Rationale**:
- Consistent with R2's underlying S3 API
- Handles large datasets efficiently
- Prevents issues with changing data during pagination
- Standard pattern familiar to S3 developers

### 4. Hierarchical Resource Structure

**Decision**: Nest objects under buckets in URL structure.

**Structure**:
```
/buckets/{bucket}/objects/{key}
/buckets/{bucket}/search
```

**Rationale**:
- Reflects actual R2 hierarchy (buckets contain objects)
- Clear resource relationships
- Enables bucket-scoped operations
- Supports future bucket-level features

### 5. Error Code Categorization

**Decision**: Use namespaced error codes with prefixes.

**Categories**:
- `AUTH_*`: Authentication errors (1xxx)
- `BUCKET_*`, `OBJECT_*`: Resource errors (2xxx)
- `VALIDATION_*`: Input validation errors (3xxx)
- `R2_*`: External service errors (4xxx)
- `INTERNAL_*`, `SERVICE_*`: Server errors (5xxx)

**Rationale**:
- Easy to categorize and handle errors
- Clear distinction between client and server errors
- Supports logging and monitoring
- Machine-readable for automated error handling

### 6. Streaming for File Operations

**Decision**: Use Node.js streams for upload/download.

**Implementation**:
- Upload: Stream request body directly to R2
- Download: Stream R2 response directly to client
- No intermediate file buffering

**Rationale**:
- Memory-efficient (handles GB-sized files)
- Better performance (no wait for full upload)
- Lower server resource usage
- Supports partial downloads (range requests)

### 7. Search Implementation Strategy

**Decision**: Phase 1 uses client-side filtering, Phase 2+ server-side.

**Phase 1**:
1. Fetch all objects with `ListObjectsV2`
2. Filter results by substring match in API
3. Return paginated results

**Future Optimization**:
- Streaming search for large buckets
- Prefix-based optimization
- Metadata indexing

**Rationale**:
- Quick implementation for MVP
- No additional infrastructure needed
- Works well for small-to-medium buckets
- Clear upgrade path for large-scale use

---

## API Endpoints Summary

### Implemented (Existing)

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| `GET` | `/health` | Health check | Implemented |
| `GET` | `/buckets` | List buckets | Implemented |

### To Implement (Phase 1 - NOW)

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| `GET` | `/buckets/{bucket}/objects` | List objects | High |
| `HEAD` | `/buckets/{bucket}/objects/{key}` | Get metadata | Medium |
| `GET` | `/buckets/{bucket}/objects/{key}` | Download object | High |
| `PUT` | `/buckets/{bucket}/objects/{key}` | Upload object | High |
| `DELETE` | `/buckets/{bucket}/objects/{key}` | Delete object | High |
| `GET` | `/buckets/{bucket}/search` | Search objects | Medium |

### Deferred (Phase 2+ - LATER)

- Multipart upload (for files > 5GB)
- Presigned URLs (shareable links)
- Copy/move operations
- Batch operations
- Bucket management (create/delete)
- Analytics and stats

---

## HTTP Status Code Strategy

### Success Responses (2xx)

| Code | Usage |
|------|-------|
| `200 OK` | Successful GET, HEAD, DELETE |
| `201 Created` | Successful PUT (upload) |
| `206 Partial Content` | Range request (partial download) |

### Client Errors (4xx)

| Code | Usage |
|------|-------|
| `400 Bad Request` | Invalid request format, validation error |
| `401 Unauthorized` | Invalid R2 credentials |
| `403 Forbidden` | Insufficient permissions |
| `404 Not Found` | Bucket or object doesn't exist |
| `413 Payload Too Large` | File too large for PUT |
| `416 Range Not Satisfiable` | Invalid range request |
| `429 Too Many Requests` | Rate limit exceeded |

### Server Errors (5xx)

| Code | Usage |
|------|-------|
| `500 Internal Server Error` | Unexpected server error |
| `502 Bad Gateway` | R2 service error |
| `503 Service Unavailable` | Server temporarily unavailable |
| `504 Gateway Timeout` | R2 timeout |

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Goal**: Set up type system and utilities

**Tasks**:
1. Create TypeScript type definitions (`types/api.ts`, `types/s3.ts`, `types/errors.ts`)
2. Implement error mapping utility (`utils/errors.ts`)
3. Implement response helpers (`utils/response.ts`)
4. Implement input validation (`utils/validation.ts`)
5. Write unit tests for utilities

**Deliverables**:
- Reusable type definitions
- Error handling framework
- Response formatting utilities
- Input validation helpers

### Phase 2: Object Operations (Week 2)

**Goal**: Implement core object endpoints

**Tasks**:
1. Create `routes/objects.ts` file
2. Implement `GET /buckets/{bucket}/objects` (list with pagination)
3. Implement `HEAD /buckets/{bucket}/objects/{key}` (metadata)
4. Implement `GET /buckets/{bucket}/objects/{key}` (download with streaming)
5. Implement `PUT /buckets/{bucket}/objects/{key}` (upload with streaming)
6. Implement `DELETE /buckets/{bucket}/objects/{key}` (delete)
7. Write integration tests for all endpoints

**Deliverables**:
- Working object listing with folder navigation
- File upload/download functionality
- File deletion capability
- Comprehensive test coverage

### Phase 3: Search & Polish (Week 3)

**Goal**: Add search and refine existing endpoints

**Tasks**:
1. Implement `GET /buckets/{bucket}/search` (search functionality)
2. Add query parameter filtering (date range, size range)
3. Update bucket routes to use new response format
4. Add request ID generation middleware
5. Add CORS middleware
6. Enhance logging and error messages
7. Write integration tests for search

**Deliverables**:
- Working search functionality
- Advanced filtering options
- Consistent API responses across all endpoints
- Production-ready error handling

### Phase 4: Testing & Documentation (Week 4)

**Goal**: Comprehensive testing and documentation

**Tasks**:
1. Integration testing with real R2 bucket
2. Load testing with large datasets (10,000+ objects)
3. Edge case testing (empty buckets, special characters)
4. Error scenario testing (network failures, invalid credentials)
5. Performance optimization
6. API documentation updates
7. Frontend integration testing

**Deliverables**:
- Test coverage > 80%
- Verified performance benchmarks
- Complete API documentation
- Ready for production deployment

---

## Technical Specifications

### Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify 5.x
- **Language**: TypeScript 5.x
- **S3 SDK**: @aws-sdk/client-s3
- **Build Tool**: esbuild

### Performance Targets

- **Object Listing**: < 500ms for 1,000 objects
- **File Upload**: Full bandwidth utilization (10+ MB/s)
- **File Download**: Full bandwidth utilization (10+ MB/s)
- **Search**: < 1 second for 10,000 objects
- **API Response Time**: < 100ms (excluding R2 latency)

### Code Quality Standards

**Required**:
- TypeScript strict mode enabled
- All imports use `.ts` extensions
- Use `??` for defaults (never `||`)
- Use `type` imports for types
- Error handling in all routes
- Input validation for all parameters
- Request ID in all responses
- Proper HTTP status codes

**Recommended**:
- JSDoc comments for public APIs
- Unit tests for utilities (>80% coverage)
- Integration tests for endpoints
- ESLint configured
- Prettier for formatting

---

## Frontend Integration Guide

### API Client Usage

**Example: List Objects**
```typescript
// Frontend (Swift/macOS)
let url = URL(string: "http://localhost:\(port)/buckets/my-bucket/objects?prefix=photos/&maxKeys=100")!
let (data, response) = try await URLSession.shared.data(from: url)

struct ListObjectsResponse: Codable {
    let status: String
    let data: [S3Object]
    let pagination: Pagination
    let meta: Meta
}

let result = try JSONDecoder().decode(ListObjectsResponse.self, from: data)
```

**Example: Upload Object**
```typescript
// Frontend (Swift/macOS)
let url = URL(string: "http://localhost:\(port)/buckets/my-bucket/objects/\(encodedKey)")!
var request = URLRequest(url: url)
request.httpMethod = "PUT"
request.setValue("application/pdf", forHTTPHeaderField: "Content-Type")
request.httpBody = fileData

let (data, response) = try await URLSession.shared.data(for: request)
```

**Example: Download Object**
```typescript
// Frontend (Swift/macOS)
let url = URL(string: "http://localhost:\(port)/buckets/my-bucket/objects/\(encodedKey)")!
let (localURL, response) = try await URLSession.shared.download(from: url)
try FileManager.default.moveItem(at: localURL, to: destinationURL)
```

### Error Handling

```swift
// Frontend error handling pattern
do {
    let result = try await apiClient.listObjects(bucket: "my-bucket")
    // Handle success
} catch APIError.notFound(let message) {
    // Show "Bucket not found" alert
} catch APIError.unauthorized {
    // Show "Invalid credentials" alert and prompt for settings
} catch APIError.networkError {
    // Show "Network error" alert with retry option
} catch {
    // Show generic error message
    print("Unexpected error: \(error)")
}
```

### Caching Strategy

**Frontend Cache**:
- Cache folder listings for 5 minutes (TTL)
- Invalidate cache on mutations (upload, delete)
- Cache key: `{accountId}:{bucketName}:{prefix}`
- Max cache entries: 100 folders (LRU eviction)

**Integration**:
1. Before API call, check cache
2. If cache hit and not stale, return cached data
3. If cache miss or stale, fetch from API
4. Store result in cache with timestamp
5. On mutation, invalidate related cache entries

---

## Security Considerations

### Authentication

**Current (Phase 1)**:
- R2 credentials in environment variables
- No user authentication (localhost only)
- Single account per API instance

**Future (Phase 2+)**:
- Multi-account support via request headers
- API key authentication
- Per-user credential management

### Input Validation

**Required Validations**:
- Bucket name: Alphanumeric, hyphens, 3-63 chars
- Object key: Not empty, max 1024 chars, no path traversal
- Query params: Type checking, range validation
- File size: Max 5GB for PUT

### Path Traversal Prevention

```typescript
// Validate object keys to prevent path traversal
function validateObjectKey(key: string): boolean {
  // Prevent path traversal attacks
  if (key.includes('..') || key.includes('\\')) {
    return false;
  }

  // Must not be empty
  if (!key || key.trim() === '') {
    return false;
  }

  // Max length check
  if (key.length > 1024) {
    return false;
  }

  return true;
}
```

### CORS Configuration

**Development**:
```typescript
// Allow localhost only
server.register(cors, {
  origin: ['http://localhost:*', 'http://127.0.0.1:*'],
  methods: ['GET', 'HEAD', 'PUT', 'DELETE'],
  credentials: true,
});
```

**Production**:
- Restrict to macOS app only (no web access)
- Use custom URL scheme if needed
- Consider HTTP authentication

---

## Monitoring & Debugging

### Logging Strategy

**Request Logging**:
```
[INFO] GET /buckets/my-bucket/objects?prefix=photos/ - 200 OK (324ms) [requestId: abc-123]
```

**Error Logging**:
```
[ERROR] GET /buckets/invalid/objects - 404 Not Found (12ms) [requestId: xyz-789]
  Error: NoSuchBucket: The specified bucket does not exist
  Bucket: invalid
```

**Performance Logging**:
```
[PERF] R2 ListObjectsV2 - 287ms [requestId: abc-123]
[PERF] Response formatting - 3ms [requestId: abc-123]
```

### Metrics to Track

**API Metrics**:
- Request count per endpoint
- Response time percentiles (p50, p95, p99)
- Error rate by error code
- Requests per second

**R2 Metrics**:
- R2 API call count
- R2 response time
- R2 error rate
- Bandwidth usage (upload/download)

### Debug Mode

**Enable Debug Logging**:
```bash
# Environment variable
DEBUG=true npm run dev

# Logs all R2 API calls and responses
[DEBUG] R2 Request: ListObjectsV2 { Bucket: 'my-bucket', Prefix: 'photos/' }
[DEBUG] R2 Response: { KeyCount: 42, IsTruncated: false }
```

---

## Migration Path from Phase 1 to Phase 2+

### Breaking Changes Policy

**Version Strategy**:
- Phase 1: Implicit v1 (no version in URL)
- Phase 2: Add `/v2/` prefix for breaking changes
- Maintain v1 for 12 months after v2 release

**Non-Breaking Additions**:
- New query parameters (backward compatible)
- New response fields (ignored by old clients)
- New endpoints (don't affect existing routes)

**Breaking Changes Require New Version**:
- Changing response envelope structure
- Removing response fields
- Changing error codes
- Changing URL patterns

### Deprecation Process

1. **Announce**: 6 months before deprecation
2. **Warning**: Add `X-API-Deprecated` header to old endpoint
3. **Migrate**: Update documentation and provide migration guide
4. **Remove**: After 12 months, remove old version

---

## FAQ

### Q: Why not use GraphQL?

**A**: RESTful design is simpler for this use case:
- File upload/download works better with REST
- Fewer dependencies and complexity
- More aligned with S3 API patterns
- Easier for frontend team to integrate

### Q: Why cursor-based pagination instead of offset-based?

**A**: Cursor-based is more reliable:
- Consistent results even if data changes
- Better performance with large datasets
- Matches S3 API behavior (no conversion needed)
- Prevents duplicate/missing items during pagination

### Q: Why not implement batch operations in Phase 1?

**A**: Focus on MVP functionality first:
- Batch operations add complexity
- Can be built on top of single operations
- Lower priority than core features
- Can be added without breaking changes

### Q: How do we handle very large buckets (1M+ objects)?

**A**: Current design handles this:
- Pagination prevents loading all objects at once
- Prefix filtering narrows search scope
- Frontend cache reduces redundant API calls
- Future: Consider server-side search indexing

### Q: What about multipart upload for large files?

**A**: Deferred to Phase 2+:
- Phase 1: PUT supports up to 5GB (sufficient for most use cases)
- Phase 2: Add multipart upload for 5GB+ files
- Implementation matches S3 multipart API
- Non-breaking addition (new endpoints)

---

## Next Steps

### Immediate Actions

1. **Review**: Have team review this design document
2. **Approve**: Get sign-off from stakeholders
3. **Assign**: Allocate to `typescript-backend` and `r2-specialist` agents
4. **Kickoff**: Begin Phase 1 implementation

### Development Process

1. **Branch**: Create feature branch `feature/api-object-operations`
2. **Implement**: Follow implementation roadmap (Phase 1-4)
3. **Test**: Write tests alongside implementation
4. **Review**: Code review after each phase
5. **Integrate**: Merge to main after Phase 4 complete

### Success Criteria

**Phase 1 Complete When**:
- All endpoints implemented and tested
- Integration tests passing
- Frontend can list, upload, download, delete objects
- Error handling working correctly
- Performance targets met

**Ready for Production When**:
- All tests passing (>80% coverage)
- Documentation complete
- Security review passed
- Load testing successful
- Frontend integration verified

---

## Resources

### Documentation

- **Full Specification**: `API_ROUTES_SPEC.md`
- **PRD**: `/Users/cha/projects/cloudflare-r2-object-storage-browser/PRD.md`
- **Code Guidelines**: `CLAUDE.md`

### External References

- [Fastify Documentation](https://fastify.dev/)
- [AWS SDK S3 Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [Cloudflare R2 API](https://developers.cloudflare.com/r2/api/s3/api/)
- [REST API Best Practices](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)

### Team Contacts

- **API Architect**: Design and architecture decisions
- **typescript-backend**: Implementation of API routes
- **r2-specialist**: R2-specific integration and optimization
- **code-reviewer**: Code quality and best practices

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-14
**Status**: Approved - Ready for Implementation
