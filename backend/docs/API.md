# Agentis Backend API Documentation

## Base URL

```
http://localhost:3001/api
```

## Authentication

All endpoints (except `/api/health`) require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Error Response Format

All error responses follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [] // Optional, present for validation errors
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `NOT_FOUND` | 404 | Resource or route not found |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Endpoints

### Health Check

```
GET /api/health
```

Returns server health status. No authentication required.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-20T07:00:00.000Z"
}
```

---

### Agent Status

```
GET /api/agents/status
```

Returns the current status of all configured agents. Designed for lightweight polling.

**Response Time:** < 200ms

**Response:**
```json
{
  "agents": [
    {
      "id": "team-backend-dev",
      "name": "Backend Developer",
      "role": "backend-dev",
      "status": "active",
      "lastActivity": "2026-05-20T07:30:00.000Z",
      "updatedAt": "2026-05-20T07:30:00.000Z"
    }
  ]
}
```

**Agent Status Values:**

| Status | Description |
|--------|-------------|
| `active` | Agent heartbeat received within last 30 seconds |
| `idle` | No heartbeat for 30s–2min |
| `error` | No heartbeat for more than 2 minutes |

---

### Workflow History

```
GET /api/workflows
```

Returns a paginated list of workflows with search and filter capabilities.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | `""` | Search by title, ID, or description (case-insensitive) |
| `status` | string | `"all"` | Filter by status: `running`, `completed`, `failed`, `all` |
| `page` | integer | `1` | Page number (min: 1) |
| `limit` | integer | `20` | Items per page (min: 1, max: 100) |

**Response:**
```json
{
  "workflows": [
    {
      "id": "wf_001",
      "title": "Sidebar Navigation Feature",
      "status": "running",
      "createdAt": "2026-05-20T06:50:00.000Z",
      "updatedAt": "2026-05-20T07:30:00.000Z"
    }
  ],
  "total": 10,
  "page": 1,
  "hasMore": true
}
```

**Sorting:** Results are always sorted by `createdAt` descending (most recent first).

**Examples:**

```bash
# Get all workflows, first page
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/workflows

# Search workflows
curl -H "Authorization: Bearer <token>" "http://localhost:3001/api/workflows?search=sidebar"

# Filter by status with pagination
curl -H "Authorization: Bearer <token>" "http://localhost:3001/api/workflows?status=running&page=1&limit=5"

# Combined search and filter
curl -H "Authorization: Bearer <token>" "http://localhost:3001/api/workflows?search=api&status=completed&limit=10"
```

---

## Validation Errors

When request parameters fail validation, a `400` response is returned with details:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "status",
        "message": "Status must be one of: running, completed, failed, all",
        "value": "invalid"
      }
    ]
  }
}
```

---

## Rate Limiting

The agent status endpoint is designed for polling at intervals of 5-10 seconds.
Rate limiting will be enforced in production (TBD: specific limits).

---

## Future Enhancements

- WebSocket support for real-time agent status updates
- Workflow detail endpoint (`GET /api/workflows/:id`)
- Agent heartbeat endpoint (`POST /api/agents/:id/heartbeat`)
- Database-backed persistence (PostgreSQL)
- Full-text search with database indexing
