# API Implementation Checklist

**Track progress for Phase 1 implementation**

---

## Phase 1: Foundation

### Type Definitions

#### File: `sources/types/api.ts`
- [ ] Create `ApiResponse<T>` interface
- [ ] Create `ResponseMeta` interface
- [ ] Create `ApiError` interface
- [ ] Create `ErrorCode` type union
- [ ] Create `Pagination` interface
- [ ] Create `SearchMeta` interface
- [ ] Export all types

#### File: `sources/types/s3.ts`
- [ ] Create `S3Object` interface
- [ ] Create `Bucket` interface
- [ ] Create `StorageClass` type
- [ ] Create `ListObjectsQuery` interface
- [ ] Create `SearchQuery` interface
- [ ] Create `DownloadQuery` interface
- [ ] Export all types

#### File: `sources/types/errors.ts`
- [ ] Define all error code constants
- [ ] Create `ErrorCategory` enum
- [ ] Create error mapping types
- [ ] Export all types

#### File: `sources/types/index.ts`
- [ ] Re-export all types from `api.ts`
- [ ] Re-export all types from `s3.ts`
- [ ] Re-export all types from `errors.ts`

### Utility Functions

#### File: `sources/utils/response.ts`
- [ ] Implement `createSuccessResponse<T>()` helper
- [ ] Implement `createErrorResponse()` helper
- [ ] Implement `generateRequestId()` helper
- [ ] Add JSDoc comments
- [ ] Write unit tests

#### File: `sources/utils/errors.ts`
- [ ] Implement `mapS3Error()` function
- [ ] Map `NoSuchBucket` → `BUCKET_NOT_FOUND`
- [ ] Map `NoSuchKey` → `OBJECT_NOT_FOUND`
- [ ] Map `InvalidAccessKeyId` → `AUTH_INVALID_CREDENTIALS`
- [ ] Map `SignatureDoesNotMatch` → `AUTH_INVALID_CREDENTIALS`
- [ ] Map `AccessDenied` → `AUTH_PERMISSION_DENIED`
- [ ] Map `RequestTimeout` → `R2_TIMEOUT`
- [ ] Map `ServiceUnavailable` → `R2_SERVICE_ERROR`
- [ ] Add default case → `INTERNAL_SERVER_ERROR`
- [ ] Add JSDoc comments
- [ ] Write unit tests

#### File: `sources/utils/validation.ts`
- [ ] Implement `validateBucketName()` function
- [ ] Implement `validateObjectKey()` function
- [ ] Implement `validateMaxKeys()` function
- [ ] Implement `validateDateString()` function
- [ ] Implement `sanitizeObjectKey()` function (prevent path traversal)
- [ ] Add JSDoc comments
- [ ] Write unit tests

#### File: `sources/utils/index.ts`
- [ ] Re-export all utilities

---

## Phase 2: Object Operations

### Route Implementation

#### File: `sources/routes/objects.ts`

**Imports and Setup**
- [ ] Import required types from `../types/`
- [ ] Import `r2Client` from `../r2-client.ts`
- [ ] Import utilities from `../utils/`
- [ ] Import S3 commands from `@aws-sdk/client-s3`

**Endpoint: List Objects**
- [ ] Define route: `GET /buckets/:bucket/objects`
- [ ] Type route parameters and query string
- [ ] Extract `bucket`, `prefix`, `delimiter`, `maxKeys`, `continuationToken`
- [ ] Validate bucket name
- [ ] Validate and sanitize parameters
- [ ] Create `ListObjectsV2Command`
- [ ] Execute command via `r2Client.send()`
- [ ] Map R2 response to API format
- [ ] Handle `commonPrefixes` for folders
- [ ] Format pagination metadata
- [ ] Handle errors with `mapS3Error()`
- [ ] Return success response
- [ ] Write integration tests

**Endpoint: Get Object Metadata**
- [ ] Define route: `HEAD /buckets/:bucket/objects/:key`
- [ ] Type route parameters
- [ ] Extract and decode object key
- [ ] Validate bucket and key
- [ ] Create `HeadObjectCommand`
- [ ] Execute command via `r2Client.send()`
- [ ] Set response headers (Content-Type, Content-Length, ETag, Last-Modified)
- [ ] Handle 404 errors
- [ ] Return empty body (HEAD request)
- [ ] Write integration tests

**Endpoint: Download Object**
- [ ] Define route: `GET /buckets/:bucket/objects/:key`
- [ ] Type route parameters and query string
- [ ] Extract and decode object key
- [ ] Parse `range` query parameter (optional)
- [ ] Validate bucket and key
- [ ] Create `GetObjectCommand`
- [ ] Add `Range` header if range request
- [ ] Execute command via `r2Client.send()`
- [ ] Set response headers (Content-Type, Content-Disposition, ETag, etc.)
- [ ] Stream response body (no buffering)
- [ ] Handle 206 Partial Content for range requests
- [ ] Handle 416 Range Not Satisfiable
- [ ] Handle 404 errors
- [ ] Write integration tests

**Endpoint: Upload Object**
- [ ] Define route: `PUT /buckets/:bucket/objects/:key`
- [ ] Type route parameters
- [ ] Extract and decode object key
- [ ] Validate bucket and key
- [ ] Validate Content-Type header
- [ ] Validate Content-Length header
- [ ] Check file size limits (max 5GB)
- [ ] Create `PutObjectCommand`
- [ ] Stream request body to R2 (use `request.raw`)
- [ ] Execute command via `r2Client.send()`
- [ ] Extract ETag from response
- [ ] Return 201 Created with object metadata
- [ ] Add Location header
- [ ] Handle errors
- [ ] Write integration tests

**Endpoint: Delete Object**
- [ ] Define route: `DELETE /buckets/:bucket/objects/:key`
- [ ] Type route parameters
- [ ] Extract and decode object key
- [ ] Validate bucket and key
- [ ] Create `DeleteObjectCommand`
- [ ] Execute command via `r2Client.send()`
- [ ] Return 200 OK with confirmation
- [ ] Handle 404 gracefully (idempotent)
- [ ] Handle errors
- [ ] Write integration tests

**Endpoint: Search Objects**
- [ ] Define route: `GET /buckets/:bucket/search`
- [ ] Type route parameters and query string
- [ ] Extract `q` (required), `prefix`, `maxKeys`, `continuationToken`
- [ ] Validate search query
- [ ] Create `ListObjectsV2Command` with prefix filter
- [ ] Execute command via `r2Client.send()`
- [ ] Filter results by case-insensitive substring match
- [ ] Extract filename from key for matching
- [ ] Format search results
- [ ] Add `searchMeta` with query, totalMatches, searchTime
- [ ] Handle pagination
- [ ] Handle errors
- [ ] Write integration tests

**Export Function**
- [ ] Implement `registerObjectRoutes(server: FastifyInstance)`
- [ ] Register all routes
- [ ] Export function

---

## Phase 3: Integration & Polish

### Update Existing Routes

#### File: `sources/routes/buckets.ts`
- [ ] Update to use `createSuccessResponse()` helper
- [ ] Update to use `createErrorResponse()` helper
- [ ] Add request ID to responses
- [ ] Update response format to match standard envelope
- [ ] Keep backward compatibility (optional)

#### File: `sources/routes/health.ts`
- [ ] Update to use standard response format
- [ ] Add uptime tracking
- [ ] Add request ID

### Application Setup

#### File: `sources/application.ts`
- [ ] Import and register object routes
- [ ] Add CORS plugin for development
- [ ] Add request ID generation middleware
- [ ] Add request logging middleware
- [ ] Add response time logging
- [ ] Configure error handler

### Configuration

#### File: `sources/options.ts`
- [ ] Add upload size limit configuration
- [ ] Add timeout configuration
- [ ] Add CORS configuration
- [ ] Document all options

---

## Phase 4: Testing

### Unit Tests

#### File: `sources/utils/errors.test.ts`
- [ ] Test all S3 error mappings
- [ ] Test unknown error handling
- [ ] Test error detail extraction
- [ ] Verify error codes are correct
- [ ] Verify HTTP status codes

#### File: `sources/utils/response.test.ts`
- [ ] Test success response formatting
- [ ] Test error response formatting
- [ ] Test request ID generation
- [ ] Test timestamp format

#### File: `sources/utils/validation.test.ts`
- [ ] Test bucket name validation (valid cases)
- [ ] Test bucket name validation (invalid cases)
- [ ] Test object key validation (valid cases)
- [ ] Test object key validation (path traversal prevention)
- [ ] Test maxKeys validation (bounds checking)
- [ ] Test date string validation

### Integration Tests

#### File: `sources/routes/objects.test.ts`

**List Objects Tests**
- [ ] Test successful list with empty bucket
- [ ] Test list with objects
- [ ] Test list with prefix filter
- [ ] Test list with delimiter (folders)
- [ ] Test pagination with continuationToken
- [ ] Test maxKeys limit
- [ ] Test 404 for non-existent bucket
- [ ] Test error handling

**Get Metadata Tests**
- [ ] Test successful HEAD request
- [ ] Test headers are correct
- [ ] Test 404 for non-existent object
- [ ] Test 404 for non-existent bucket

**Download Object Tests**
- [ ] Test successful download
- [ ] Test Content-Type header
- [ ] Test Content-Disposition header
- [ ] Test range request (206 Partial Content)
- [ ] Test invalid range (416 Range Not Satisfiable)
- [ ] Test 404 for non-existent object
- [ ] Test streaming (no buffering)

**Upload Object Tests**
- [ ] Test successful upload
- [ ] Test 201 Created response
- [ ] Test Location header
- [ ] Test ETag returned
- [ ] Test Content-Type preservation
- [ ] Test large file upload (streaming)
- [ ] Test file size limit enforcement
- [ ] Test 404 for non-existent bucket
- [ ] Test invalid key rejection

**Delete Object Tests**
- [ ] Test successful deletion
- [ ] Test 200 OK response
- [ ] Test idempotent behavior (delete twice)
- [ ] Test 404 for non-existent bucket
- [ ] Test error handling

**Search Objects Tests**
- [ ] Test search with results
- [ ] Test case-insensitive matching
- [ ] Test search with no results
- [ ] Test search with prefix filter
- [ ] Test pagination
- [ ] Test 400 for missing query
- [ ] Test 404 for non-existent bucket

### End-to-End Tests

#### File: `sources/e2e/workflow.test.ts`
- [ ] Test full upload → list → download workflow
- [ ] Test create folder → upload → navigate workflow
- [ ] Test upload → delete → verify deleted workflow
- [ ] Test search → download → delete workflow
- [ ] Test error recovery (network failure simulation)

### Manual Testing

#### Checklist
- [ ] Start API server successfully
- [ ] List buckets via curl
- [ ] List objects via curl
- [ ] Upload file via curl
- [ ] Download file via curl
- [ ] Delete file via curl
- [ ] Search objects via curl
- [ ] Test with real R2 bucket
- [ ] Test with various file types
- [ ] Test with large files (>100MB)
- [ ] Test with special characters in keys
- [ ] Test error scenarios (invalid credentials, etc.)
- [ ] Test pagination with large datasets
- [ ] Verify CORS headers in browser

---

## Phase 5: Documentation

### Code Documentation

- [ ] Add JSDoc comments to all public functions
- [ ] Add JSDoc comments to all types/interfaces
- [ ] Add inline comments for complex logic
- [ ] Document error codes with examples

### API Documentation

#### File: `API_ROUTES_SPEC.md`
- [x] Complete endpoint documentation (already done)
- [ ] Add real examples from testing
- [ ] Update based on implementation feedback

#### File: `README.md` (in packages/api/)
- [ ] Create API package README
- [ ] Document installation
- [ ] Document configuration (.env setup)
- [ ] Document running the server
- [ ] Document testing
- [ ] Link to API_ROUTES_SPEC.md

### Examples

#### File: `examples/curl-examples.sh`
- [ ] Create curl examples for all endpoints
- [ ] Add comments explaining each example
- [ ] Include error scenario examples

#### File: `examples/typescript-client.ts`
- [ ] Create TypeScript client example
- [ ] Show type-safe API calls
- [ ] Demonstrate error handling

---

## Phase 6: Production Readiness

### Performance

- [ ] Benchmark object listing (10,000+ objects)
- [ ] Benchmark file upload (various sizes)
- [ ] Benchmark file download (various sizes)
- [ ] Benchmark search (large buckets)
- [ ] Profile memory usage
- [ ] Verify streaming works (no buffering)
- [ ] Test concurrent requests
- [ ] Optimize slow endpoints

### Security

- [ ] Review all input validation
- [ ] Test path traversal prevention
- [ ] Verify credentials are never logged
- [ ] Review error messages (no sensitive data)
- [ ] Test file size limits
- [ ] Review CORS configuration
- [ ] Test with malicious inputs
- [ ] Run security audit (npm audit)

### Reliability

- [ ] Test error recovery
- [ ] Test timeout handling
- [ ] Test retry logic (if applicable)
- [ ] Test graceful shutdown
- [ ] Test with network failures
- [ ] Test with R2 service errors
- [ ] Verify idempotent operations

### Monitoring

- [ ] Add request metrics logging
- [ ] Add error rate logging
- [ ] Add R2 latency logging
- [ ] Add response time logging
- [ ] Add memory usage logging
- [ ] Create debug mode
- [ ] Document logging format

### Deployment

- [ ] Document deployment process
- [ ] Create production .env template
- [ ] Document environment variables
- [ ] Test with production credentials
- [ ] Create health check monitoring
- [ ] Document troubleshooting guide

---

## Progress Summary

**Total Tasks**: ~170
**Completed**: 4 (documentation files)
**Remaining**: ~166

**Estimated Time**:
- Phase 1 (Foundation): 2-3 days
- Phase 2 (Object Operations): 3-4 days
- Phase 3 (Integration): 1-2 days
- Phase 4 (Testing): 2-3 days
- Phase 5 (Documentation): 1 day
- Phase 6 (Production): 1-2 days

**Total**: 10-15 days (2-3 weeks)

---

## Next Steps

1. **Review Design**: Team review of API_ROUTES_SPEC.md
2. **Get Approval**: Stakeholder sign-off
3. **Assign Work**: Allocate to typescript-backend and r2-specialist
4. **Start Phase 1**: Begin with type definitions
5. **Iterate**: Complete phases in order, testing as you go

---

## Notes

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/api-object-operations

# Commit after each phase
git add .
git commit -m "Phase 1: Type definitions and utilities"

# Push regularly
git push origin feature/api-object-operations

# Open PR after Phase 4 complete
# Merge after review and testing
```

### Testing Commands

```bash
# Run unit tests
pnpm test

# Run specific test file
pnpm test errors.test.ts

# Run with coverage
pnpm test --coverage

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Run all tests
pnpm test:all
```

### Debugging Commands

```bash
# Start server in debug mode
DEBUG=* pnpm dev

# Start with specific debug namespace
DEBUG=fastify:* pnpm dev

# Enable TypeScript source maps
node --enable-source-maps dist/server.js
```

---

## Success Criteria

**Phase 1 Complete When**:
- [ ] All type files created and exported
- [ ] All utility functions implemented
- [ ] Unit tests passing (>80% coverage)
- [ ] No TypeScript errors
- [ ] Code reviewed

**Phase 2 Complete When**:
- [ ] All 6 endpoints implemented
- [ ] Integration tests passing
- [ ] Manual testing successful
- [ ] No TypeScript errors
- [ ] Code reviewed

**Phase 3 Complete When**:
- [ ] All routes registered
- [ ] Middleware configured
- [ ] Existing routes updated
- [ ] All tests still passing
- [ ] Code reviewed

**Phase 4 Complete When**:
- [ ] Test coverage >80%
- [ ] All tests passing
- [ ] No flaky tests
- [ ] Performance benchmarks met
- [ ] Code reviewed

**Phase 5 Complete When**:
- [ ] All code documented
- [ ] README complete
- [ ] Examples working
- [ ] API spec updated
- [ ] Documentation reviewed

**Phase 6 Complete When**:
- [ ] All security checks passed
- [ ] Performance targets met
- [ ] Production testing complete
- [ ] Monitoring configured
- [ ] Ready for deployment

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-14
**Status**: Ready for Implementation
