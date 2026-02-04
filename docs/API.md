# API Documentation

## Content Generation

### POST /api/generate

Generates platform-specific content from source content using AI. Requires authentication.

**Request**

- **Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Body:**

| Field           | Type     | Required | Description                                      |
|----------------|----------|----------|--------------------------------------------------|
| projectId      | string   | Yes      | ID of the project (must belong to the user)      |
| platforms      | string[] | Yes      | Target platforms: `"linkedin"`, `"twitter"`, `"email"` |
| sourceContent  | string   | Yes      | Original content to repurpose (non-empty, within plan character limit) |
| options        | object   | No       | Optional: `temperature`, `maxTokens`, `model`    |

**Example request**

```json
{
  "projectId": "clx...",
  "platforms": ["linkedin", "twitter"],
  "sourceContent": "Your original content here..."
}
```

**Responses**

- **200 OK** — Generation completed. Body: `BulkGenerationResult`

```json
{
  "successful": [
    {
      "platform": "linkedin",
      "content": "Generated LinkedIn post...",
      "success": true,
      "metadata": { "model": "gpt-4-turbo", "temperature": 0.7, "maxTokens": 2000, "timestamp": "...", "success": true }
    }
  ],
  "failed": [],
  "totalRequested": 2
}
```

- **400 Bad Request** — Validation error
  - Missing fields: `{ "error": "Missing required fields: projectId, platforms, sourceContent" }`
  - Empty source: `{ "error": "Source content cannot be empty", "details": "..." }`
  - Over plan limit: `{ "error": "Source content exceeds plan limit", "details": "Maximum N characters allowed for your plan. Current: M." }`
  - Invalid platforms: `{ "error": "Invalid platforms: ..." }`

- **401 Unauthorized** — Not authenticated

- **404 Not Found** — Project not found or access denied

- **429 Too Many Requests** — Rate limit exceeded
  - Headers: `Retry-After: <seconds>`
  - Body: `{ "error": "Too many requests", "details": "Rate limit exceeded. Try again later." }`

- **500 Internal Server Error** — Server or AI error
  - Body: `{ "error": "Internal server error during content generation", "details": "..." }`

**Rate limiting:** 10 requests per minute per user (in-memory; per instance in serverless).

**Quota:** Generation is gated by project quota (`checkProjectQuota`). Source content length is limited by plan: `maxCharactersPerContent` (free: 1000, pro: 5000, enterprise: 10000).

---

## Output Content (Editor)

### GET /api/outputs/[id]

Returns a single output by ID. Requires authentication. The output must belong to a project owned by the current user.

**Request**

- **Method:** `GET`
- **Headers:** none required (session cookie for auth)
- **Params:** `id` — output ID (from URL)

**Responses**

- **200 OK** — Output object

```json
{
  "id": "out-1",
  "projectId": "proj-1",
  "platform": "linkedin",
  "content": "Current content...",
  "originalContent": "Original content or null",
  "isEdited": false,
  "generationMetadata": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

- **401 Unauthorized** — `{ "error": "Unauthorized" }`
- **404 Not Found** — `{ "error": "Output not found or access denied" }`
- **500 Internal Server Error** — `{ "error": "Internal server error", "details": "..." }`

---

### PATCH /api/outputs/[id]

Updates the content of an output. Requires authentication. Content is sanitized and validated against the platform character limit before saving. Counts against user quota and project history.

**Request**

- **Method:** `PATCH`
- **Headers:** `Content-Type: application/json`
- **Params:** `id` — output ID (from URL)
- **Body:**

| Field    | Type   | Required | Description                                      |
|----------|--------|----------|--------------------------------------------------|
| content  | string | Yes      | New content (sanitized on server; max length per platform) |

**Platform character limits:** linkedin 3000, twitter 280, email 10000.

**Responses**

- **200 OK** — Updated output object (same shape as GET response)

- **400 Bad Request**
  - Invalid body: `{ "error": "Invalid content", "details": "content must be a string" }`
  - Over platform limit: `{ "error": "Content exceeds platform limit", "details": "Maximum N characters for platform. Current: M." }`

- **401 Unauthorized** — `{ "error": "Unauthorized" }`
- **403 Forbidden** — Quota exceeded: `{ "error": "Quota exceeded", "details": "..." }`
- **404 Not Found** — `{ "error": "Output not found or access denied" }`
- **429 Too Many Requests** — Rate limit exceeded
  - Headers: `Retry-After: <seconds>`
  - Body: `{ "error": "Too many requests", "details": "...", "retryAfterSeconds": N }`
- **500 Internal Server Error** — `{ "error": "Internal server error", "details": "..." }`

**Rate limiting:** 30 output updates per minute per user (in-memory).

---

### POST /api/outputs/[id]/revert

Reverts an output to its original (pre-edit) content. Requires authentication. The output must have `originalContent` set (i.e. it was edited at least once).

**Request**

- **Method:** `POST`
- **Params:** `id` — output ID (from URL)
- **Body:** none

**Responses**

- **200 OK** — Reverted output object (same shape as GET)

- **400 Bad Request** — `{ "error": "No original content to revert to", "details": "..." }`
- **401 Unauthorized** — `{ "error": "Unauthorized" }`
- **404 Not Found** — `{ "error": "Output not found or access denied" }`
- **500 Internal Server Error** — `{ "error": "Internal server error", "details": "..." }`

---

## Projects API

### GET /api/projects

Lists projects for the authenticated user. Supports pagination and sorting.

**Rate limiting:** 60 requests per minute per user (shared with other projects endpoints). On exceed: **429 Too Many Requests** with `Retry-After` header and body `{ "error": "Too many requests", "details": "Rate limit exceeded. Try again later." }`.

### POST /api/projects

Creates a new project. Requires authentication and respects project quota.

**Rate limiting:** Same as GET (60 requests per minute per user). **429** with `Retry-After` when exceeded.

### GET /api/projects/[id], PATCH /api/projects/[id], DELETE /api/projects/[id]

Get, update, or delete a project by ID. Require authentication; project must belong to the user.

**Rate limiting:** Same as above (60 requests per minute per user). **429** with `Retry-After` when exceeded.

### POST /api/projects/bulk-delete

Deletes multiple projects at once. Body: `{ "projectIds": string[] }`.

**Rate limiting:** Same as above (60 requests per minute per user). **429** with `Retry-After` when exceeded.
