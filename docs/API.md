# API Specification (MVP)

**Version**: 0.2  
**Base URL**: `https://widget.school.kr/api`  
**Protocol**: HTTPS only

---

## Authentication

* **Student & Teacher Widget**: Anonymous via session code
* **Admin Console**: OAuth 2.0 (future, not MVP)
* **Rate Limiting**: Enabled per endpoint (see details below)

---

## REST Endpoints

### Sessions

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| POST | `/sessions` | Create new session (widget) | 30/min/IP |
| POST | `/sessions/reset` | Regenerate session code | 10/min/IP |
| GET | `/sessions/{code}` | Validate session code | 60/min/IP |
| GET | `/sessions/{code}/stats` | Get session statistics | 30/min/IP |

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
  "code": "AB12CD34",
  "class_id": "a1b2c3d4-...",
  "started_at": "2025-10-12T09:00:00Z",
  "expires_at": "2025-10-12T09:30:00Z",
  "qr_url": "https://widget.school.kr/AB12CD34"
}
```

**Errors:**
- `400`: Invalid class_id format
- `404`: Class not found
- `500`: Server error

---

### Messages

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| POST | `/messages` | Student message | 5/min/IP |
| GET | `/messages?session_code={code}` | Get recent messages | 30/min/IP |

#### POST /messages
**Request:**
```json
{
  "code": "AB12CD34",
  "nickname": "지민",
  "avatar_id": 4,
  "content": "오늘 수업 기대돼요!",
  "answer_token": "verified-token-here"
}
```

**Validation Rules:**
- `nickname`: 1-20자, 한글/영문/숫자, 특수문자 제외(-, _ 허용)
- `avatar_id`: 1-64
- `content`: 1-200자
- `answer_token`: JWT (정답 검증 후 발급)

**Response (201):**
```json
{
  "id": "message-uuid",
  "nickname": "지민",
  "avatar_id": 4,
  "content": "오늘 수업 기대돼요!",
  "created_at": "2025-10-12T09:15:30Z"
}
```

**Errors:**
- `400`: Validation error (invalid input)
- `403`: Answer not verified
- `404`: Session not found
- `429`: Rate limit exceeded (5 messages/min)

---

### Problems

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| GET | `/problems/next` | Get next quiz item | 20/min/IP |
| POST | `/problems/check` | Answer verification | 10/min/IP |

#### GET /problems/next
**Query Parameters:**
- `grade` (optional): `1-1`, `1-2`, ..., `6-2`
- `difficulty` (optional): 1-5 (default: 3)
- `type` (optional): `vocabulary`, `proverb`, `math`

**Response (200):**
```json
{
  "id": "problem-uuid",
  "type": "vocabulary",
  "question": "Fill in the blank: read ______ loudly.",
  "hint": "It means 'clearly' in Korean (명확하게)",
  "difficulty": 3
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
  "message": "정답입니다!",
  "expires_at": "2025-10-12T09:20:00Z"
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

## WebSocket Channels

**URL**: `wss://widget.school.kr/ws/{session_code}`  
**Protocol**: WebSocket (RFC 6455)

### Connection Limits
- Max 50 connections per session
- Connection timeout: 30 minutes
- Auto-reconnect recommended

### Events (Server → Client)

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{session_id, user_count}` | Connection established |
| `newMessage` | `{nickname, avatar_id, content, timestamp}` | New message broadcast |
| `statsUpdate` | `{message_count, correct_rate}` | Statistics update |
| `sessionEnded` | `{reason}` | Session closed |

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

---

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful request |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input format |
| 403 | Forbidden | Answer not verified |
| 404 | Not Found | Session/resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_SESSION` | Session not found or expired | 404 |
| `ANSWER_NOT_VERIFIED` | Answer verification required | 403 |
| `BANNED_WORD` | Content contains banned word | 403 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `SESSION_FULL` | Max 50 users reached | 403 |
| `VALIDATION_ERROR` | Input validation failed | 400 |

---

## Rate Limiting

### Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /messages` | 5 requests | 1 minute |
| `POST /problems/check` | 10 requests | 1 minute |
| `GET /problems/next` | 20 requests | 1 minute |
| `POST /sessions` | 30 requests | 1 minute |
| `GET /sessions/*` | 60 requests | 1 minute |
| WebSocket connection | 5 connections | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1697097600
```

### Rate Limit Exceeded Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "너무 많은 요청입니다. 잠시 후 다시 시도해주세요.",
    "retry_after": 45
  }
}
```

**Status**: 429 Too Many Requests

---

## Security

### Input Validation

**Nickname:**
- Length: 1-20 characters
- Allowed: 한글, 영문, 숫자, -, _
- Regex: `^[가-힣a-zA-Z0-9_-]{1,20}$`

**Content:**
- Length: 1-200 characters
- XSS filtering: HTML tags stripped
- Banned words: Auto-checked

**Session Code:**
- Format: 8 alphanumeric characters (uppercase)
- Example: `AB12CD34`
- Regex: `^[A-Z0-9]{8}$`

### XSS Protection

All user input is sanitized:
```python
import html
content = html.escape(user_input)
```

### CORS Policy

```http
Access-Control-Allow-Origin: https://widget.school.kr
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 3600
```

### HTTPS Only

All HTTP requests are redirected to HTTPS.

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Response Time (P95) | < 100ms | REST endpoints |
| WebSocket Latency | < 50ms | Message broadcast |
| Database Query | < 20ms | With proper indexes |
| Throughput | 100 req/s | Per instance |

### Optimization Strategies

1. **Caching**: Redis for session data (TTL: 30 min)
2. **Database**: Indexes on all foreign keys + query patterns
3. **Connection Pooling**: Max 100 PostgreSQL connections
4. **WebSocket**: Message batching for multiple recipients

---

## Testing

### cURL Examples

**Create Session:**
```bash
curl -X POST https://widget.school.kr/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"class_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"}'
```

**Send Message:**
```bash
curl -X POST https://widget.school.kr/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "code": "AB12CD34",
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

---

## Monitoring

### Health Check

**GET** `/health`

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

---

## Changelog

### v0.2 (2025-10-12)
- ✅ Extended session code to 8 characters
- ✅ Added rate limiting specifications
- ✅ Added error codes and status codes
- ✅ Added input validation rules
- ✅ Added performance targets
- ✅ Added session statistics endpoint

### v0.1 (2025-10-12)
- Initial API specification
