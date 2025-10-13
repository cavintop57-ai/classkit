# API Specification (MVP)

**Version**: 0.2  
**Base URL**: `https://widget.school.kr/api`  
**Protocol**: HTTPS only

---

## Authentication

* **Student & Teacher Widget**: Anonymous token via session code
* **Admin Console**: OAuth 2.0 (future, not MVP)
* **Rate Limiting**: 10 requests/minute per IP (adjustable per endpoint)

---

## REST Endpoints

### Sessions

| Method | Path | Description | Auth | Body / Params |
|--------|------|-------------|------|---------------|
| POST | `/sessions` | Create new session (widget) | None | `{class_id: UUID}` |
| POST | `/sessions/reset` | Regenerate session code | Session | `{code: string}` |
| GET | `/sessions/{code}` | Validate session code | None | - |
| POST | `/sessions/{code}/end` | End session manually | Session | - |
| GET | `/sessions/{code}/stats` | Get session statistics | None | - |

#### POST /sessions
**Request:**
```json
{
  "class_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Response (201):**
```json
{
  "id": "session-uuid",
  "code": "ABC12345",
  "class_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "started_at": "2025-10-12T09:00:00Z",
  "expires_at": "2025-10-12T09:30:00Z",
  "qr_url": "https://widget.school.kr/ABC12345"
}
```

#### GET /sessions/{code}/stats
**Response (200):**
```json
{
  "code": "ABC12345",
  "active_users": 23,
  "total_messages": 47,
  "correct_answers": 18,
  "correct_rate": 78.3,
  "started_at": "2025-10-12T09:00:00Z"
}
```

---

### Messages

| Method | Path | Description | Auth | Rate Limit |
|--------|------|-------------|------|------------|
| POST | `/messages` | Student message | Session code | 5/min/IP |
| GET | `/messages?session_code={code}` | Get messages | None | 30/min/IP |
| DELETE | `/messages/{id}` | Delete message (teacher) | Session | 10/min/IP |
| PATCH | `/messages/{id}/moderate` | Approve/reject message | Session | 10/min/IP |

#### POST /messages
**Request:**
```json
{
  "code": "ABC12345",
  "nickname": "지민",
  "avatar_id": 4,
  "content": "오늘 수업 기대돼요!",
  "answer_token": "verified-answer-token"
}
```

**Response (201):**
```json
{
  "id": "message-uuid",
  "session_id": "session-uuid",
  "nickname": "지민",
  "avatar_id": 4,
  "content": "오늘 수업 기대돼요!",
  "created_at": "2025-10-12T09:15:30Z",
  "moderated": false
}
```

**Errors:**
- `400`: Invalid input (missing fields)
- `403`: Answer not verified or banned word detected
- `404`: Session not found
- `429`: Rate limit exceeded

---

### Problems

| Method | Path | Description | Auth | Body / Params |
|--------|------|-------------|------|---------------|
| GET | `/problems/next` | Get next quiz item | None | `?grade={grade}&difficulty={1-5}` |
| POST | `/problems/check` | Answer verification | None | `{problem_id: UUID, answer: string}` |
| GET | `/problems/{id}` | Get problem details | None | - |

#### GET /problems/next
**Query Parameters:**
- `grade` (optional): `1-1`, `1-2`, `2-1`, ... `6-2`
- `difficulty` (optional): 1-5 (default: 3)
- `type` (optional): `vocabulary`, `proverb`, `math`

**Response (200):**
```json
{
  "id": "problem-uuid",
  "type": "vocabulary",
  "question": "Fill in the blank: read ______ loudly.",
  "hint": "It means 'clearly' in Korean (명확하게)",
  "difficulty": 3,
  "grade": "5-1"
}
```

#### POST /problems/check
**Request:**
```json
{
  "problem_id": "problem-uuid",
  "answer": "clearly"
}
```

**Response (200 - Correct):**
```json
{
  "correct": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "정답입니다!"
}
```

**Response (200 - Incorrect):**
```json
{
  "correct": false,
  "hint": "Try again! It starts with 'C'.",
  "attempts_left": 2
}
```

---

### Avatars

| Method | Path | Description |
|--------|------|-------------|
| GET | `/avatars` | Get all available avatars |

**Response (200):**
```json
{
  "avatars": [
    {
      "id": 1,
      "name": "학생1",
      "sprite_position": { "x": 0, "y": 0 }
    },
    {
      "id": 2,
      "name": "학생2",
      "sprite_position": { "x": 16, "y": 0 }
    }
  ],
  "sprite_url": "https://cdn.widget.school.kr/avatars-sprite.webp"
}
```

---

### Health & Monitoring

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check endpoint |
| POST | `/metrics` | Submit client metrics |

#### GET /health
**Response (200):**
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "uptime": 345600,
  "version": "0.2.0"
}
```

#### POST /metrics
**Request:**
```json
{
  "device_info": {
    "cores": 4,
    "memory": 4,
    "platform": "Win32"
  },
  "metrics": {
    "avgFPS": 58.3,
    "avgMemory": 187.5,
    "p95Latency": 42
  }
}
```

**Response (201):**
```json
{
  "message": "Metrics received"
}
```

---

## WebSocket Channels

### Connection

**URL**: `wss://widget.school.kr/ws/{session_code}`  
**Protocol**: WebSocket (RFC 6455)

#### Connection Flow
```javascript
const ws = new WebSocket('wss://widget.school.kr/ws/ABC12345');

ws.onopen = () => {
  console.log('Connected');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleEvent(data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
  // Auto-reconnect after 5 seconds
  setTimeout(reconnect, 5000);
};
```

### Events (Server → Client)

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{session_id, active_users}` | Connection established |
| `newMessage` | `{nickname, avatar_id, content, timestamp}` | New student message |
| `statsUpdate` | `{correctRate, messageCount, activeUsers}` | Statistics update |
| `sessionEnded` | `{reason}` | Session closed by teacher |
| `userJoined` | `{nickname, avatar_id}` | Student joined session |

#### Example: newMessage
```json
{
  "event": "newMessage",
  "payload": {
    "nickname": "지민",
    "avatar_id": 4,
    "content": "재밌어요!",
    "timestamp": "2025-10-12T09:15:30Z"
  }
}
```

#### Example: statsUpdate
```json
{
  "event": "statsUpdate",
  "payload": {
    "activeUsers": 24,
    "messageCount": 48,
    "correctRate": 79.2
  }
}
```

### Events (Client → Server)

| Event | Payload | Description |
|-------|---------|-------------|
| `ping` | `{}` | Keep-alive ping |
| `typing` | `{nickname}` | User is typing (future) |

#### Example: ping
```json
{
  "event": "ping",
  "payload": {}
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful request |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 403 | Forbidden | Answer not verified |
| 404 | Not Found | Session/resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Maintenance mode |

### Error Response Format

```json
{
  "error": {
    "code": "ANSWER_NOT_VERIFIED",
    "message": "You must answer the question correctly first.",
    "details": {
      "problem_id": "problem-uuid",
      "attempts_left": 2
    }
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_SESSION` | Session code not found or expired |
| `ANSWER_NOT_VERIFIED` | Answer verification required |
| `BANNED_WORD` | Content contains banned word |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `SESSION_FULL` | Maximum 50 users reached |
| `VALIDATION_ERROR` | Input validation failed |

---

## Rate Limiting

### Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /messages` | 5 req | 1 min |
| `POST /problems/check` | 10 req | 1 min |
| `GET /problems/next` | 20 req | 1 min |
| `GET /sessions/*` | 30 req | 1 min |
| `WebSocket connections` | 5 connections | 1 min |

### Rate Limit Headers

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1697097600
```

### Exceeded Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retry_after": 45
  }
}
```

---

## Security

### Input Validation

**Nickname:**
- Length: 1-20 characters
- Allowed: 한글, 영문, 숫자
- Forbidden: 특수문자 (일부 제외: -, _)

**Content:**
- Length: 1-200 characters
- XSS filtering applied
- Banned words check

**Session Code:**
- Format: 8 alphanumeric characters (uppercase)
- Example: `ABC12345`

### CORS Policy

```http
Access-Control-Allow-Origin: https://widget.school.kr
Access-Control-Allow-Methods: GET, POST, DELETE, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 3600
```

### HTTPS Only

All endpoints require HTTPS. HTTP requests will be redirected to HTTPS.

---

## Pagination (Future)

For endpoints returning large datasets:

```http
GET /messages?session_code=ABC12345&page=2&limit=20
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Webhooks (Future)

Allow external services to receive events:

```http
POST https://your-server.com/webhook
Content-Type: application/json

{
  "event": "session.ended",
  "session_id": "session-uuid",
  "data": {...}
}
```

---

## API Versioning

**Current Version**: v1 (default)  
**Future**: `/api/v2/...` for breaking changes

---

## Testing

### cURL Examples

**Create Session:**
```bash
curl -X POST https://widget.school.kr/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"class_id": "a1b2c3d4-..."}'
```

**Send Message:**
```bash
curl -X POST https://widget.school.kr/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ABC12345",
    "nickname": "테스트",
    "avatar_id": 1,
    "content": "안녕하세요",
    "answer_token": "token..."
  }'
```

**Check Answer:**
```bash
curl -X POST https://widget.school.kr/api/problems/check \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": "problem-uuid",
    "answer": "clearly"
  }'
```

### Postman Collection

Import from: `https://widget.school.kr/api/postman-collection.json`

---

## Performance Considerations

### Response Times (Target)

| Endpoint | P50 | P95 | P99 |
|----------|-----|-----|-----|
| GET /sessions/{code} | 20ms | 50ms | 100ms |
| POST /messages | 30ms | 80ms | 150ms |
| WebSocket broadcast | 10ms | 30ms | 50ms |

### Optimization Strategies

1. **Caching**: Redis for session data (30 min TTL)
2. **Database Indexing**: All foreign keys + query patterns
3. **Connection Pooling**: Max 100 PostgreSQL connections
4. **WebSocket Compression**: zlib for messages > 100 bytes
5. **CDN**: Static assets served via CloudFront

---

## Changelog

### v0.2 (2025-10-12)
- ✅ Added `/sessions/{code}/stats` endpoint
- ✅ Added `/messages/{id}/moderate` endpoint
- ✅ Extended session code to 8 characters
- ✅ Added rate limiting specifications
- ✅ Added `answer_token` to message creation
- ✅ Added `/metrics` endpoint for client metrics

### v0.1 (2025-10-12)
- Initial API specification
