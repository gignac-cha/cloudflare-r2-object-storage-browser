# API Architecture Diagrams

**Visual guide to API architecture and data flow**

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         macOS Application                        │
│  ┌────────────┐  ┌──────────────┐  ┌───────────────────────┐   │
│  │  SwiftUI   │  │ URLSession   │  │  Cache (FileList)     │   │
│  │  Views     │→│  API Client  │→│  LRU (100 folders)    │   │
│  └────────────┘  └──────────────┘  └───────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/JSON
                           │ localhost:random-port
┌──────────────────────────▼──────────────────────────────────────┐
│                      Fastify API Server                          │
│  ┌────────────┐  ┌──────────────┐  ┌───────────────────────┐   │
│  │  Routes    │→│  Utilities   │→│  r2-client (S3Client) │   │
│  │  Handlers  │  │  (errors,    │  │  AWS SDK v3           │   │
│  │            │  │   response,  │  │                       │   │
│  │            │  │   validation)│  └───────────┬───────────┘   │
│  └────────────┘  └──────────────┘              │               │
└─────────────────────────────────────────────────┼───────────────┘
                                                  │ S3 API
                                                  │ HTTPS
┌─────────────────────────────────────────────────▼───────────────┐
│                    Cloudflare R2 Storage                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Bucket A │  │ Bucket B │  │ Bucket C │  │ Bucket D │        │
│  │          │  │          │  │          │  │          │        │
│  │ Objects  │  │ Objects  │  │ Objects  │  │ Objects  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Request Flow

### List Objects Request

```
macOS App                API Server              R2 Storage
    │                         │                       │
    │  GET /buckets/my-bucket/objects?prefix=photos/  │
    ├─────────────────────────>│                       │
    │                         │                       │
    │                         │  Validate params      │
    │                         │  ┌─────────────┐      │
    │                         │  │ prefix: ✓   │      │
    │                         │  │ maxKeys: ✓  │      │
    │                         │  └─────────────┘      │
    │                         │                       │
    │                         │  ListObjectsV2Command │
    │                         ├──────────────────────>│
    │                         │                       │
    │                         │  Query objects        │
    │                         │  Filter by prefix     │
    │                         │  ┌─────────────┐      │
    │                         │  │ List: 42    │      │
    │                         │  │ Prefixes: 2 │      │
    │                         │  └─────────────┘      │
    │                         │                       │
    │                         │ Response (S3 format)  │
    │                         │<──────────────────────┤
    │                         │                       │
    │                         │  Format response      │
    │                         │  ┌─────────────┐      │
    │                         │  │ data: []    │      │
    │                         │  │ pagination  │      │
    │                         │  │ meta        │      │
    │                         │  └─────────────┘      │
    │                         │                       │
    │  200 OK (JSON)          │                       │
    │<─────────────────────────┤                       │
    │                         │                       │
    │  Parse & Display        │                       │
    │  ┌─────────────┐        │                       │
    │  │ Cache result│        │                       │
    │  │ Update UI   │        │                       │
    │  └─────────────┘        │                       │
    │                         │                       │
```

### Upload Object Request

```
macOS App                API Server              R2 Storage
    │                         │                       │
    │  PUT /buckets/my-bucket/objects/doc.pdf         │
    │  Content-Type: application/pdf                  │
    │  Body: [stream]                                 │
    ├─────────────────────────>│                       │
    │                         │                       │
    │                         │  Validate request     │
    │                         │  ┌─────────────┐      │
    │                         │  │ bucket: ✓   │      │
    │                         │  │ key: ✓      │      │
    │                         │  │ size: ✓     │      │
    │                         │  └─────────────┘      │
    │                         │                       │
    │                         │  PutObjectCommand     │
    │                         │  Body: [stream]       │
    │                         ├──────────────────────>│
    │                         │                       │
    │         Stream upload (no intermediate buffer)  │
    │                         │ ═════════════════════>│
    │                         │                       │
    │                         │  Store object         │
    │                         │  Generate ETag        │
    │                         │  ┌─────────────┐      │
    │                         │  │ Stored: ✓   │      │
    │                         │  │ ETag: abc123│      │
    │                         │  └─────────────┘      │
    │                         │                       │
    │                         │ Response (ETag, etc)  │
    │                         │<──────────────────────┤
    │                         │                       │
    │                         │  Invalidate cache     │
    │                         │  ┌─────────────┐      │
    │                         │  │ Clear:      │      │
    │                         │  │ "photos/"   │      │
    │                         │  └─────────────┘      │
    │                         │                       │
    │  201 Created (JSON)     │                       │
    │  Location: /buckets/my-bucket/objects/doc.pdf   │
    │<─────────────────────────┤                       │
    │                         │                       │
    │  Update transfer UI     │                       │
    │  Invalidate local cache │                       │
    │                         │                       │
```

### Error Flow

```
macOS App                API Server              R2 Storage
    │                         │                       │
    │  GET /buckets/invalid-bucket/objects            │
    ├─────────────────────────>│                       │
    │                         │                       │
    │                         │  ListObjectsV2Command │
    │                         ├──────────────────────>│
    │                         │                       │
    │                         │  NoSuchBucket error   │
    │                         │<──────────────────────┤
    │                         │                       │
    │                         │  Map S3 error         │
    │                         │  ┌─────────────────┐  │
    │                         │  │ NoSuchBucket    │  │
    │                         │  │    ↓            │  │
    │                         │  │ BUCKET_NOT_FOUND│  │
    │                         │  └─────────────────┘  │
    │                         │                       │
    │                         │  Create error response│
    │                         │  ┌─────────────────┐  │
    │                         │  │ status: "error" │  │
    │                         │  │ code: BUCKET_…  │  │
    │                         │  │ message: "…"    │  │
    │                         │  │ requestId: uuid │  │
    │                         │  └─────────────────┘  │
    │                         │                       │
    │  404 Not Found (JSON)   │                       │
    │<─────────────────────────┤                       │
    │                         │                       │
    │  Show error alert       │                       │
    │  ┌────────────────────┐ │                       │
    │  │ Bucket not found   │ │                       │
    │  │ [OK]               │ │                       │
    │  └────────────────────┘ │                       │
    │                         │                       │
```

---

## Resource Hierarchy

```
                          Root (/)
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
     /health            /buckets          (future: /stats)
                             │
                    ┌────────┴────────┐
                    │                 │
          {bucketName}         {bucketName}
          "my-bucket"          "another-bucket"
                    │
        ┌───────────┼───────────┐
        │           │           │
    /objects    /search    (future: /settings)
        │
        │
  {objectKey}
  "photos/beach.jpg"
```

### URL Examples

```
/health
  → System health check

/buckets
  → List all buckets

/buckets/my-bucket/objects
  → List all objects in "my-bucket"

/buckets/my-bucket/objects?prefix=photos/
  → List objects in "photos" folder

/buckets/my-bucket/objects?prefix=photos/&delimiter=/
  → List objects and subfolders in "photos"

/buckets/my-bucket/objects/photos%2Fbeach.jpg
  → Get/upload/delete "photos/beach.jpg"

/buckets/my-bucket/search?q=report
  → Search for "report" in "my-bucket"
```

---

## Data Flow Diagrams

### Object Listing with Pagination

```
Request: GET /buckets/my-bucket/objects?maxKeys=2

┌─────────────────────────────────────────────────┐
│              First Request (Page 1)              │
└─────────────────────────────────────────────────┘

R2 Response:
┌──────────────────────────────────┐
│ Contents:                        │
│   - file1.txt                    │
│   - file2.txt                    │
│ IsTruncated: true                │
│ NextContinuationToken: "abc123"  │
└──────────────────────────────────┘
        │
        ▼
API Response:
┌──────────────────────────────────┐
│ status: "ok"                     │
│ data: [file1, file2]             │
│ pagination:                      │
│   isTruncated: true              │
│   nextContinuationToken: "abc123"│
└──────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│       Second Request (Page 2)                    │
└─────────────────────────────────────────────────┘

Request: GET /buckets/my-bucket/objects?maxKeys=2&continuationToken=abc123

R2 Response:
┌──────────────────────────────────┐
│ Contents:                        │
│   - file3.txt                    │
│   - file4.txt                    │
│ IsTruncated: false               │
│ NextContinuationToken: null      │
└──────────────────────────────────┘
        │
        ▼
API Response:
┌──────────────────────────────────┐
│ status: "ok"                     │
│ data: [file3, file4]             │
│ pagination:                      │
│   isTruncated: false             │
│   nextContinuationToken: null    │
└──────────────────────────────────┘
```

### Folder Navigation with Delimiter

```
Request: GET /buckets/my-bucket/objects?prefix=photos/&delimiter=/

R2 Storage Structure:
my-bucket/
  photos/
    beach.jpg          ← Object
    sunset.png         ← Object
    2024/              ← Prefix (folder)
      vacation.jpg
      trip.png
    2025/              ← Prefix (folder)
      summer.jpg

R2 Response:
┌────────────────────────────────┐
│ Contents:                      │
│   - photos/beach.jpg           │
│   - photos/sunset.png          │
│ CommonPrefixes:                │
│   - photos/2024/               │
│   - photos/2025/               │
└────────────────────────────────┘
        │
        ▼
API Response:
┌────────────────────────────────┐
│ status: "ok"                   │
│ data: [                        │
│   { key: "photos/beach.jpg" }  │
│   { key: "photos/sunset.png" } │
│ ]                              │
│ pagination:                    │
│   commonPrefixes: [            │
│     "photos/2024/",            │
│     "photos/2025/"             │
│   ]                            │
└────────────────────────────────┘
        │
        ▼
macOS UI Display:
┌────────────────────────────────┐
│ Photos                         │
│ ├─ 📁 2024/          (folder)  │
│ ├─ 📁 2025/          (folder)  │
│ ├─ 🖼️  beach.jpg     (file)    │
│ └─ 🖼️  sunset.png    (file)    │
└────────────────────────────────┘
```

### Search Implementation

```
Request: GET /buckets/my-bucket/search?q=report

┌─────────────────────────────────────────────────┐
│              API Server Logic                    │
└─────────────────────────────────────────────────┘

Step 1: Fetch all objects
┌──────────────────────────────────┐
│ ListObjectsV2Command({           │
│   Bucket: "my-bucket",           │
│   MaxKeys: 1000                  │
│ })                               │
└──────────────────────────────────┘
        │
        ▼
Step 2: Filter by query
┌──────────────────────────────────┐
│ All Objects:                     │
│   annual-report.pdf   ← MATCH    │
│   data.csv            ← no match │
│   quarterly-report.docx ← MATCH  │
│   image.jpg           ← no match │
│   Report_2024.pdf     ← MATCH    │
└──────────────────────────────────┘
        │
        ▼
Step 3: Format response
┌──────────────────────────────────┐
│ status: "ok"                     │
│ data: [                          │
│   { key: "annual-report.pdf" }   │
│   { key: "quarterly-report.docx"}│
│   { key: "Report_2024.pdf" }     │
│ ]                                │
│ searchMeta:                      │
│   query: "report"                │
│   totalMatches: 3                │
└──────────────────────────────────┘
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Error Handling Pipeline                   │
└─────────────────────────────────────────────────────────────┘

Route Handler
    │
    │  try {
    │    // API logic
    │  }
    ▼
┌──────────────┐
│  Exception   │
│  Thrown      │
└──────┬───────┘
       │
       │  catch (error)
       ▼
┌──────────────────────────┐
│  mapS3Error(error)       │
│  ┌────────────────────┐  │
│  │ NoSuchBucket       │  │
│  │   → BUCKET_NOT_…   │  │
│  │ InvalidAccessKey   │  │
│  │   → AUTH_INVALID…  │  │
│  │ ServiceUnavailable │  │
│  │   → R2_SERVICE_…   │  │
│  └────────────────────┘  │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────────┐
│  createErrorResponse()       │
│  ┌────────────────────────┐  │
│  │ status: "error"        │  │
│  │ error: {               │  │
│  │   code: ERROR_CODE     │  │
│  │   message: string      │  │
│  │   details: object      │  │
│  │ }                      │  │
│  │ meta: {                │  │
│  │   timestamp: ISO       │  │
│  │   requestId: UUID      │  │
│  │ }                      │  │
│  └────────────────────────┘  │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  HTTP Response               │
│  Status: 404/500/502/etc     │
│  Body: JSON error            │
└──────────────────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  macOS App Error Handler     │
│  ┌────────────────────────┐  │
│  │ Parse error.code       │  │
│  │ Display error.message  │  │
│  │ Log requestId          │  │
│  │ Show retry option      │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

---

## Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│              Frontend Cache Architecture                     │
└─────────────────────────────────────────────────────────────┘

Cache Structure:
┌─────────────────────────────────────────────────────────────┐
│ Key: "{accountId}:{bucketName}:{prefix}"                    │
│ Value: {                                                    │
│   objects: [...],                                           │
│   commonPrefixes: [...],                                    │
│   timestamp: Date,                                          │
│   ttl: 300 seconds                                          │
│ }                                                           │
│ Max Entries: 100 (LRU eviction)                             │
└─────────────────────────────────────────────────────────────┘

Request Flow with Cache:

User Action: Navigate to folder
        │
        ▼
┌──────────────────────┐
│ Check Cache          │
│ Key: "acc:buck:path" │
└──────┬───────────────┘
       │
       ├─── Cache Hit (age < 5min)
       │         │
       │         ▼
       │    ┌────────────────┐
       │    │ Return Cached  │
       │    │ Data           │
       │    └────────────────┘
       │         │
       │         ▼
       │    ┌────────────────┐
       │    │ Display UI     │
       │    │ (instant)      │
       │    └────────────────┘
       │
       └─── Cache Miss OR Expired
                 │
                 ▼
            ┌────────────────┐
            │ Fetch from API │
            └────────┬───────┘
                     │
                     ▼
            ┌────────────────┐
            │ Store in Cache │
            └────────┬───────┘
                     │
                     ▼
            ┌────────────────┐
            │ Display UI     │
            └────────────────┘

Cache Invalidation:

User Action: Upload/Delete/Rename
        │
        ▼
┌──────────────────────┐
│ Perform API Request  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Success?             │
└──────┬───────────────┘
       │
       ├─── Yes
       │     │
       │     ▼
       │  ┌─────────────────────┐
       │  │ Invalidate Cache    │
       │  │ - Current folder    │
       │  │ - Parent folder     │
       │  │ - All related paths │
       │  └─────────────────────┘
       │     │
       │     ▼
       │  ┌─────────────────────┐
       │  │ Refresh UI          │
       │  │ (fetch fresh data)  │
       │  └─────────────────────┘
       │
       └─── No (keep cache)
```

---

## Module Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                    Module Dependency Graph                   │
└─────────────────────────────────────────────────────────────┘

server.ts
    │
    └──> application.ts
            │
            ├──> routes/health.ts
            │       │
            │       └──> (no dependencies)
            │
            ├──> routes/buckets.ts
            │       │
            │       ├──> r2-client.ts
            │       │       │
            │       │       └──> options.ts
            │       │
            │       ├──> utils/response.ts
            │       │       │
            │       │       └──> types/api.ts
            │       │
            │       └──> utils/errors.ts
            │               │
            │               └──> types/errors.ts
            │
            └──> routes/objects.ts (NEW)
                    │
                    ├──> r2-client.ts
                    │
                    ├──> utils/response.ts
                    │
                    ├──> utils/errors.ts
                    │
                    ├──> utils/validation.ts (NEW)
                    │       │
                    │       └──> types/api.ts
                    │
                    └──> types/
                            ├──> api.ts
                            ├──> s3.ts
                            └──> errors.ts

Legend:
  ───> : imports/depends on
  NEW  : to be created in Phase 1
```

---

## Response Format Comparison

### Before (Current /buckets endpoint)

```json
{
  "status": "ok",
  "buckets": [...],
  "count": 2
}
```

### After (Standardized format)

```json
{
  "status": "ok",
  "data": [...],
  "meta": {
    "timestamp": "2025-10-14T04:00:00.000Z",
    "requestId": "abc-123"
  }
}
```

### Migration Plan

1. Create new response helpers in `utils/response.ts`
2. Implement new endpoints with standard format
3. Update existing `/buckets` endpoint to match
4. Update frontend to handle both formats (transition period)
5. Remove old format after frontend migration complete

---

## Performance Optimization Strategies

```
┌─────────────────────────────────────────────────────────────┐
│                   Performance Layers                         │
└─────────────────────────────────────────────────────────────┘

Layer 1: Frontend Cache (Fastest - 0ms)
┌──────────────────────────────┐
│ In-Memory Cache              │
│ TTL: 5 minutes               │
│ Hit Rate: ~70%               │
└──────────────────────────────┘
        │ Cache miss
        ▼
Layer 2: API Server (Fast - 10ms)
┌──────────────────────────────┐
│ Fastify Request Handler      │
│ - Input validation           │
│ - Response formatting        │
└──────────────────────────────┘
        │
        ▼
Layer 3: R2 API (Moderate - 50-200ms)
┌──────────────────────────────┐
│ Cloudflare R2 Storage        │
│ - List objects               │
│ - Get/Put/Delete             │
└──────────────────────────────┘

Optimization Techniques:

1. Pagination (reduces data transfer)
   ┌────────────────────────────┐
   │ Request: maxKeys=1000      │
   │ Instead of: all objects    │
   │ Benefit: 10x faster        │
   └────────────────────────────┘

2. Streaming (reduces memory usage)
   ┌────────────────────────────┐
   │ Stream upload/download     │
   │ Instead of: buffer in RAM  │
   │ Benefit: 100x less memory  │
   └────────────────────────────┘

3. Prefix Filtering (reduces scan)
   ┌────────────────────────────┐
   │ Prefix: "photos/"          │
   │ Instead of: scan all       │
   │ Benefit: 100x faster       │
   └────────────────────────────┘

4. Concurrent Requests (parallelism)
   ┌────────────────────────────┐
   │ 3 uploads in parallel      │
   │ Instead of: sequential     │
   │ Benefit: 3x faster total   │
   └────────────────────────────┘
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Architecture                     │
└─────────────────────────────────────────────────────────────┘

Layer 1: Network (Transport Security)
┌──────────────────────────────────┐
│ localhost only (127.0.0.1)       │
│ Random port (avoid conflicts)    │
│ No external access               │
└──────────────────────────────────┘
        │
        ▼
Layer 2: Input Validation
┌──────────────────────────────────┐
│ Validate all parameters:         │
│ - Bucket name format             │
│ - Object key sanitization        │
│ - Query param types/ranges       │
│ - File size limits               │
└──────────────────────────────────┘
        │
        ▼
Layer 3: Authentication
┌──────────────────────────────────┐
│ R2 Credentials:                  │
│ - Stored in .env (not in code)   │
│ - Never logged                   │
│ - Validated on startup           │
└──────────────────────────────────┘
        │
        ▼
Layer 4: Authorization
┌──────────────────────────────────┐
│ R2 IAM Permissions:              │
│ - Bucket-level access control    │
│ - Read/Write permissions         │
│ - Enforced by R2 (not API)       │
└──────────────────────────────────┘
        │
        ▼
Layer 5: Data Protection
┌──────────────────────────────────┐
│ - No sensitive data in logs      │
│ - Sanitized error messages       │
│ - Secure file handling           │
│ - Path traversal prevention      │
└──────────────────────────────────┘

Threat Model:

┌─────────────────────────────────────────────────────────┐
│ Threat: Path Traversal (e.g., "../../../etc/passwd")   │
│ Mitigation: Validate object keys, reject ".."           │
├─────────────────────────────────────────────────────────┤
│ Threat: Credential Exposure (logs, errors)              │
│ Mitigation: Never log credentials, sanitize errors      │
├─────────────────────────────────────────────────────────┤
│ Threat: File Overwrite (malicious uploads)              │
│ Mitigation: PUT is explicit (not automatic)             │
├─────────────────────────────────────────────────────────┤
│ Threat: Denial of Service (large uploads)               │
│ Mitigation: File size limits, rate limiting (future)    │
└─────────────────────────────────────────────────────────┘
```

---

## File Upload Flow (Detailed)

```
User drags file into macOS app
        │
        ▼
┌──────────────────────────────────┐
│ 1. File Selected                 │
│    - Path: ~/Downloads/doc.pdf   │
│    - Size: 2,048,576 bytes       │
│    - Type: application/pdf       │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 2. Generate Object Key           │
│    - Key: "uploads/doc.pdf"      │
│    - URL-encode: uploads%2F...   │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 3. Create Upload Task            │
│    - Add to transfer queue       │
│    - Status: "Pending"           │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 4. HTTP Request                  │
│    PUT /buckets/my-bucket/...    │
│    Content-Type: application/pdf │
│    Content-Length: 2048576       │
│    Body: [file stream]           │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 5. API Server Receives           │
│    - Validate bucket name        │
│    - Validate object key         │
│    - Check Content-Length        │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 6. Stream to R2                  │
│    - No buffering                │
│    - Direct pipe to R2           │
│    - Progress events             │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 7. R2 Stores Object              │
│    - Calculates MD5 (ETag)       │
│    - Stores metadata             │
│    - Returns ETag                │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 8. API Response                  │
│    201 Created                   │
│    { key, etag, size, ... }      │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 9. Frontend Updates              │
│    - Mark upload as complete     │
│    - Invalidate folder cache     │
│    - Refresh file list           │
│    - Show success notification   │
└──────────────────────────────────┘
```

---

## Complete API Testing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Testing Pyramid                          │
└─────────────────────────────────────────────────────────────┘

                    ╱╲
                   ╱  ╲
                  ╱ E2E╲               Few (5-10 tests)
                 ╱──────╲              Full system integration
                ╱────────╲
               ╱Integration╲           Medium (20-30 tests)
              ╱─────────────╲          API endpoint tests
             ╱───────────────╲
            ╱      Unit       ╲        Many (50+ tests)
           ╱───────────────────╲       Pure functions
          ╱─────────────────────╲


Unit Tests (utils/errors.test.ts):
┌──────────────────────────────────┐
│ ✓ mapS3Error - NoSuchBucket      │
│ ✓ mapS3Error - InvalidAccessKey  │
│ ✓ validateObjectKey - valid      │
│ ✓ validateObjectKey - invalid    │
│ ✓ formatResponse - success       │
│ ✓ formatResponse - error         │
└──────────────────────────────────┘

Integration Tests (routes/objects.test.ts):
┌──────────────────────────────────┐
│ ✓ GET /buckets/:bucket/objects   │
│ ✓ GET with pagination            │
│ ✓ GET with prefix filter         │
│ ✓ GET with 404 error             │
│ ✓ HEAD /buckets/:bucket/objects  │
│ ✓ PUT upload file                │
│ ✓ DELETE remove file             │
│ ✓ Search with query              │
└──────────────────────────────────┘

E2E Tests (full workflow):
┌──────────────────────────────────┐
│ ✓ Upload → List → Download       │
│ ✓ Create folder → Upload → List  │
│ ✓ Upload → Delete → List (404)   │
│ ✓ Search → Download → Delete     │
└──────────────────────────────────┘
```

---

**For complete details, see**:
- `API_ROUTES_SPEC.md` - Full endpoint documentation
- `API_DESIGN_SUMMARY.md` - Design decisions and roadmap
- `API_QUICK_REFERENCE.md` - Implementation cheat sheet
