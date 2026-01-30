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
