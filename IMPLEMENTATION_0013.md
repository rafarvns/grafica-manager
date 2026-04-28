# Spec 0013: Automatic Order Webhook Reception — Implementation Report

> **Status**: `completed` · **Date**: 2026-04-28

## Summary

Implemented generic webhook infrastructure with HMAC validation, asynchronous processing, deduplication, and manual management (retry/dismiss). This provides a reusable foundation for receiving and processing webhooks from multiple e-commerce platforms with Shopee as the MVP.

---

## Backend Implementation

### Domain Layer

#### 1. WebhookEvent Entity
**File**: `packages/backend/src/domain/entities/WebhookEvent.ts`

Generic domain entity representing any received webhook event.

**Attributes**:
- `id: string` — UUID, generated on creation
- `platform: WebhookPlatform` — Platform identifier ('shopee')
- `platformOrderId: string` — Platform-specific order ID for deduplication
- `payload: any` — Original webhook data (deep-copied for immutability)
- `rawPayload: string` — Original JSON string for HMAC validation
- `status: WebhookStatus` — pending | processing | processed | error | discarded
- `retryCount: number` — Count of failed attempts (0-3)
- `lastError: string | null` — Last error message
- `discardReason: string | null` — Reason if manually dismissed
- `createdAt: Date` — Event creation timestamp
- `updatedAt: Date` — Last state change timestamp

**Methods**:
- `static create(input)` — Factory with validation
  - Validates platform is supported
  - Requires non-empty platformOrderId
- `getId(): string` — Get webhook ID
- `markAsProcessing()` — Transition: pending/error → processing
- `markAsProcessed()` — Transition: processing → processed
- `markAsError(message)` — Transition: processing → error, increments retryCount
- `markAsDiscarded(reason)` — Transition: any → discarded
- `canRetry(): boolean` — Returns true if status is 'error' AND retryCount < 3
- `getNextRetryDelay(): number` — Returns backoff delay [30s, 5min, 30min]
- `getDeduplicationKey(): string` — Returns "{platform}:{platformOrderId}"

**State Machine**:
```
pending → processing → processed
   ↓          ↓
   └→ discarded
   └→ error ←┘
        ↓
     canRetry()
```

**Immutability**: Payload is deep-copied via JSON.parse(JSON.stringify()) to prevent mutations.

**Tests**: 15 tests, all passing ✓

---

### Application Layer

#### 1. ReceiveWebhookUseCase
**File**: `packages/backend/src/application/use-cases/ReceiveWebhookUseCase.ts`

Fast webhook receiver: validates HMAC, checks deduplication, saves event, enqueues job, returns 202 immediately.

**Input**:
```typescript
{
  platform: string;           // 'shopee'
  data: any;                  // Parsed webhook payload
  signature: string;          // HMAC-SHA256 signature
  rawPayload: string;         // Original JSON for HMAC verification
}
```

**Output**:
```typescript
{
  status: 'accepted' | 'duplicate';
  httpStatus: 202;
}
```

**Processing Steps**:
1. Validate HMAC using rawPayload and signature (throw on invalid)
2. Extract platformOrderId from data.order_id
3. Check for duplicate by deduplication key (platform:orderId)
4. If duplicate with status 'processed': return { status: 'duplicate', httpStatus: 202 }
5. Create WebhookEvent entity
6. Save to repository for audit trail
7. Enqueue job 'process-webhook' with webhookId, platform, data
8. Return { status: 'accepted', httpStatus: 202 } immediately

**Idempotency**: Same webhook received multiple times:
- First: creates event, enqueues job, returns 202
- Subsequent: detects processed status, returns 202 without reprocessing

**Security**:
- HMAC validation mandatory before any processing
- Security warning logged for invalid signatures (console.warn)
- Validates raw payload string against signature

**Tests**: 12 tests, all passing ✓

---

#### 2. ProcessWebhookJobUseCase
**File**: `packages/backend/src/application/use-cases/ProcessWebhookJobUseCase.ts`

Asynchronous job handler for webhook processing. Called by Bull queue after ReceiveWebhookUseCase enqueues.

**Input**:
```typescript
{
  webhookId: string;          // Webhook ID to process
  platform: string;           // Platform type
  platformOrderId: string;    // Platform order ID
  data: any;                  // Original webhook data
}
```

**Processing**:
1. Validate handler exists for platform (fail fast)
2. Load webhook event from repository
3. Mark webhook as 'processing'
4. Call platform-specific handler
5. On success: mark as 'processed'
6. On error: mark as 'error', save webhook, rethrow for Bull to retry
7. Save updated webhook to repository

**Retry Behavior**:
- Error is rethrown so Bull queue handles retry logic
- Bull checks webhook.canRetry() to respect max 3 attempts
- Webhook records error state for manual review

**Tests**: 10 tests, all passing ✓

---

#### 3. ListWebhooksUseCase
**File**: `packages/backend/src/application/use-cases/ListWebhooksUseCase.ts`

List webhooks with filtering and pagination.

**Input**:
```typescript
{
  platform?: string;          // Filter by platform
  status?: WebhookStatus;     // Filter by status
  limit?: number;             // Default: 20
  offset?: number;            // Default: 0
}
```

**Output**:
```typescript
{
  items: WebhookEventOutput[];
  total: number;
  limit: number;
  offset: number;
}
```

**Features**:
- Filter by platform and/or status
- Pagination with default limit of 20
- Returns total count for pagination UI

**Tests**: 7 tests, all passing ✓

---

#### 4. GetWebhookUseCase
**File**: `packages/backend/src/application/use-cases/GetWebhookUseCase.ts`

Get webhook details by ID.

**Input**: `{ webhookId: string }`

**Output**: `WebhookEventOutput` with full event details including payload, error messages

**Features**:
- Returns detailed webhook information
- Throws 'Webhook not found' if ID doesn't exist
- Includes error details and discard reason

**Tests**: 4 tests, all passing ✓

---

#### 5. RetryWebhookUseCase
**File**: `packages/backend/src/application/use-cases/RetryWebhookUseCase.ts`

Manually retry a failed webhook.

**Input**: `{ webhookId: string }`

**Output**: `{ success: boolean; message: string }`

**Processing**:
1. Load webhook from repository
2. Check canRetry() — throws if max retries exceeded
3. Mark webhook as 'processing'
4. Enqueue job 'process-webhook'
5. Save webhook state
6. Return success response

**Error Handling**:
- Throws 'Webhook not found' if webhook doesn't exist
- Throws 'Max retries exceeded' if already failed 3 times

**Tests**: 6 tests, all passing ✓

---

#### 6. DismissWebhookUseCase
**File**: `packages/backend/src/application/use-cases/DismissWebhookUseCase.ts`

Manually dismiss a webhook (mark as discarded).

**Input**:
```typescript
{
  webhookId: string;
  reason: string;             // User-provided reason
}
```

**Output**: `{ success: boolean; message: string }`

**Processing**:
1. Load webhook from repository
2. Mark as 'discarded' with reason
3. Save webhook state
4. Return success response

**Use Cases**:
- Dismiss spam/invalid webhooks
- Acknowledge false alerts
- Prevent noisy webhooks from filling queue

**Tests**: 6 tests, all passing ✓

---

### DTOs

**File**: `packages/backend/src/application/dtos/WebhookDTO.ts`

```typescript
// Webhook reception endpoint
interface ReceiveWebhookInput {
  platform: string;
  data: any;
  signature: string;
  rawPayload: string;
}

interface ReceiveWebhookOutput {
  status: 'accepted' | 'duplicate';
  httpStatus: 202;
}

// Generic webhook event output
interface WebhookEventOutput {
  id: string;
  platform: string;
  platformOrderId: string;
  status: 'pending' | 'processing' | 'processed' | 'error' | 'discarded';
  retryCount: number;
  lastError?: string | null;
  discardReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Listing webhooks
interface ListWebhooksInput {
  platform?: string;
  status?: WebhookStatus;
  limit?: number;
  offset?: number;
}

interface ListWebhooksOutput {
  items: WebhookEventOutput[];
  total: number;
  limit: number;
  offset: number;
}

// Management operations
interface RetryWebhookInput { webhookId: string; }
interface RetryWebhookOutput { success: boolean; message: string; }

interface DismissWebhookInput { webhookId: string; reason: string; }
interface DismissWebhookOutput { success: boolean; message: string; }
```

---

## Integration Interfaces

### Repository Interface

#### IWebhookRepository
```typescript
interface IWebhookRepository {
  findById(id: string): Promise<WebhookEvent | null>;
  findByDeduplicationKey(key: string): Promise<WebhookEvent | null>;
  save(event: WebhookEvent): Promise<void>;
  list(filters: { platform?: string; status?: string; limit: number; offset: number }): Promise<WebhookEvent[]>;
  count(filters: { platform?: string; status?: string }): Promise<number>;
}
```

### Job Queue Interface
```typescript
interface IJobQueue {
  add(jobName: string, data: any): Promise<{ id: string }>;
}
```

### Platform Handler Interface
```typescript
type PlatformHandler = (input: {
  webhookId: string;
  platformOrderId: string;
  data: any;
}) => Promise<void>;
```

---

## Test Coverage

### Unit Tests: 60 tests, all passing ✓

1. **WebhookEvent.spec.ts** (15 tests)
   - Entity creation and validation
   - Status transitions (pending → processing → processed/error/discarded)
   - Retry logic with max 3 attempts
   - Backoff delay calculation [30s, 5min, 30min]
   - Deduplication key generation
   - Payload immutability

2. **ReceiveWebhookUseCase.spec.ts** (12 tests)
   - HMAC validation (accept/reject)
   - Webhook deduplication (detect processed duplicates)
   - 202 immediate response
   - Async job enqueuing
   - Payload persistence
   - Security logging

3. **ProcessWebhookJobUseCase.spec.ts** (10 tests)
   - Job handler loading and processing
   - Status transitions during processing
   - Platform-specific handler delegation
   - Error handling and retry logic
   - Failed webhook state persistence

4. **ListWebhooksUseCase.spec.ts** (7 tests)
   - Listing all webhooks
   - Filtering by platform and status
   - Pagination with limit/offset
   - Total count calculation

5. **GetWebhookUseCase.spec.ts** (4 tests)
   - Retrieve webhook details
   - Error information
   - Payload access

6. **RetryWebhookUseCase.spec.ts** (6 tests)
   - Manual retry enqueuing
   - Max retries validation
   - Status transitions

7. **DismissWebhookUseCase.spec.ts** (6 tests)
   - Mark as discarded with reason
   - State persistence

---

## Architectural Decisions

### 1. Generic Webhook Infrastructure
**Decision**: Use single WebhookEvent entity for all platforms instead of platform-specific entities.

**Rationale**: 
- Reduces code duplication for future platforms
- Single repository and database table
- Platform-specific logic delegated to handlers

---

### 2. Fast 202 Response Pattern
**Decision**: Webhook receiver returns 202 immediately; processing happens asynchronously.

**Rationale**:
- Avoids timeout on webhook endpoint
- Complies with HTTP 202 Accepted semantics
- Decouples receipt from processing
- Respects e-commerce platform timeout constraints (typically 5-30 seconds)

---

### 3. Immutable Payload Storage
**Decision**: Store both parsed payload and raw JSON string; payload is deep-copied.

**Rationale**:
- Raw payload needed for HMAC re-verification
- Deep copy prevents accidental mutations
- Enables audit trail and replay capability

---

### 4. Exponential Backoff
**Decision**: Hardcoded retry delays [30s, 5min, 30min] in WebhookEvent entity.

**Rationale**:
- Balances retry aggression with resource usage
- Prevents thundering herd after API outages
- Max 3 retries = ~37 minutes total wait
- Soft limit allows manual retries via UI

---

### 5. Handler Delegation Pattern
**Decision**: ProcessWebhookJobUseCase receives map of platform-specific handlers.

**Rationale**:
- No circular dependencies (ProcessWebhook doesn't import Shopee use cases)
- Easy to add new platforms (register handler in composition root)
- Testable (mock handlers in unit tests)

---

### 6. Deduplication by Composite Key
**Decision**: Use "{platform}:{platformOrderId}" as deduplication key.

**Rationale**:
- Unique per platform and order
- Extracts naturally from webhook data (order_id)
- Prevents reprocessing same order twice
- Enables idempotent webhooks (send 3 times = process once)

---

## Security Features

### 1. HMAC Validation (RNF2)
- All webhooks validated with HMAC-SHA256 before processing
- Token stored in .env only
- Security warnings logged for invalid signatures
- Returns error before any database writes

### 2. Payload Immutability (RNF3)
- Original JSON stored for audit trail
- Parsed payload deep-copied to prevent mutations
- Enables webhook replay for debugging

### 3. Idempotency (RNF1)
- Deduplication by composite key (platform:orderId)
- Same webhook N times = same result as 1 time
- Webhook events stored for audit trail

### 4. Async Processing (RNF4)
- Webhook returns 202 immediately
- Job processing happens asynchronously via Bull queue
- No blocking operations in receiver

### 5. Retry Logic (RNF5)
- Max 3 retries with exponential backoff
- Failed webhooks marked for manual review
- canRetry() prevents infinite loops
- Manual retry endpoint for users

### 6. Manual Webhook Management
- List webhooks with filtering
- Get webhook details and error messages
- Retry failed webhooks manually
- Dismiss invalid/spam webhooks

---

## Database Considerations

### Tables Required

#### `webhook_events` (NEW)
- `id` (UUID, PK)
- `platform` (enum: 'shopee')
- `platformOrderId` (string, unique composite index with platform)
- `payload` (JSON)
- `rawPayload` (TEXT)
- `status` (enum: pending, processing, processed, error, discarded)
- `retryCount` (int, 0-3)
- `lastError` (text, nullable)
- `discardReason` (text, nullable)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Indices**:
- PRIMARY KEY: `id`
- UNIQUE: `(platform, platformOrderId)` — for deduplication key lookup
- INDEX: `status` — for listing/filtering by status
- INDEX: `createdAt` — for time-range queries

---

## Files Created (11 total)

### Domain Layer (1)
- `src/domain/entities/WebhookEvent.ts`

### Application Layer (8)
- `src/application/use-cases/ReceiveWebhookUseCase.ts`
- `src/application/use-cases/ProcessWebhookJobUseCase.ts`
- `src/application/use-cases/ListWebhooksUseCase.ts`
- `src/application/use-cases/GetWebhookUseCase.ts`
- `src/application/use-cases/RetryWebhookUseCase.ts`
- `src/application/use-cases/DismissWebhookUseCase.ts`
- `src/application/dtos/WebhookDTO.ts`

### Tests (7)
- `tests/unit/domain/entities/WebhookEvent.spec.ts` (15 tests)
- `tests/unit/application/use-cases/ReceiveWebhookUseCase.spec.ts` (12 tests)
- `tests/unit/application/use-cases/ProcessWebhookJobUseCase.spec.ts` (10 tests)
- `tests/unit/application/use-cases/ListWebhooksUseCase.spec.ts` (7 tests)
- `tests/unit/application/use-cases/GetWebhookUseCase.spec.ts` (4 tests)
- `tests/unit/application/use-cases/RetryWebhookUseCase.spec.ts` (6 tests)
- `tests/unit/application/use-cases/DismissWebhookUseCase.spec.ts` (6 tests)

---

## Test Execution

```bash
# Run all Spec 0013 unit tests
pnpm vitest run \
  tests/unit/domain/entities/WebhookEvent.spec.ts \
  tests/unit/application/use-cases/ReceiveWebhookUseCase.spec.ts \
  tests/unit/application/use-cases/ProcessWebhookJobUseCase.spec.ts \
  tests/unit/application/use-cases/ListWebhooksUseCase.spec.ts \
  tests/unit/application/use-cases/GetWebhookUseCase.spec.ts \
  tests/unit/application/use-cases/RetryWebhookUseCase.spec.ts \
  tests/unit/application/use-cases/DismissWebhookUseCase.spec.ts
```

**Results**: 60/60 tests passing ✓

---

## Pending Implementation

### 1. Infrastructure
- Prisma WebhookEvent model and migrations
- WebhookEventRepository Prisma implementation
- Bull + Redis queue setup
- Job handler registration (composition root)
- Shopee API adapter for platform handler

### 2. HTTP Controllers
- `POST /api/webhooks/orders` — ReceiveWebhookUseCase
- `GET /api/webhooks` — ListWebhooksUseCase
- `GET /api/webhooks/:id` — GetWebhookUseCase
- `POST /api/webhooks/:id/retry` — RetryWebhookUseCase
- `POST /api/webhooks/:id/dismiss` — DismissWebhookUseCase

### 3. Integration Tests
- Test webhook → DB → job queue flow
- Test deduplication with duplicate webhooks
- Test retry logic with failing handlers
- Test error state with max retries

### 4. E2E Tests
- Frontend webhook list page
- Retry failed webhook from UI
- Dismiss spam webhook from UI
- View webhook error details

### 5. API Documentation
- OpenAPI spec in `sdd-docs/api/webhooks.yaml`
- Endpoint descriptions
- Request/response examples

---

## Next Steps

1. Create Prisma model for WebhookEvent table
2. Implement WebhookEventRepository adapter
3. Setup Bull queue and job handlers
4. Create Shopee API adapter for platform handler
5. Create HTTP controllers for all endpoints
6. Create integration tests with real database
7. Create E2E tests from frontend
8. Write OpenAPI documentation

---

## References

- Bull job queue: https://github.com/OptimalBits/bull
- Redis documentation: https://redis.io/docs/
- HMAC-SHA256 Node.js crypto: https://nodejs.org/api/crypto.html
- HTTP Status Code 202 Accepted: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/202
