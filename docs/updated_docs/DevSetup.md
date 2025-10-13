# Local Development Setup

```bash
# 1. clone repo
git clone https://github.com/your-org/class-widget.git
cd class-widget

# 2. backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# 3. frontend (Electron)
cd ../widget
npm install
npm run dev # Vite hot‑reload
```

*Requires Node >= 18, Python >= 3.10.*

## 성능 테스트 환경

### 권장 테스트 기기
- **최소 사양**: Pentium J4205 (4C/4T, 1.5-2.6 GHz), 4GB RAM
- **권장 사양**: Core i3 8세대 이상, 8GB RAM

### 성능 프로파일링

```bash
# Electron 성능 측정
cd widget
npm run dev -- --enable-logging

# Chrome DevTools로 CPU/메모리 프로파일링
# F12 → Performance 탭 → Record 시작
# 1분간 정상 사용 → 중지 → 분석
```

**목표 지표:**
- Scripting: < 10 %
- Rendering: < 30 %
- Painting: < 20 %
- Idle: > 40 %

## Electron 최적화 설정

### 1. Hardware Acceleration 활성화

```javascript
// widget/electron/main.js
const { app, BrowserWindow } = require('electron');

app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');
app.commandLine.appendSwitch('disable-gpu-vsync'); // 저사양용

const mainWindow = new BrowserWindow({
  webPreferences: {
    hardwareAcceleration: true,
    enableRemoteModule: false,
    contextIsolation: true,
  },
  show: false, // 초기 로딩 깜빡임 방지
});

mainWindow.once('ready-to-show', () => {
  mainWindow.show();
});
```

### 2. 메모리 제한 설정

```javascript
// V8 힙 메모리 제한 (200MB)
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=200');

// 주기적 메모리 정리
setInterval(() => {
  if (global.gc) {
    global.gc();
  }
}, 1800000); // 30분마다
```

### 3. 저사양 모드 자동 감지

```javascript
// widget/src/utils/performanceDetector.js
export function detectLowEndDevice() {
  const cpuCores = navigator.hardwareConcurrency || 2;
  const memoryGB = navigator.deviceMemory || 2;
  
  return cpuCores <= 4 && memoryGB <= 4;
}

export function adjustAnimationQuality(isLowEnd) {
  document.documentElement.dataset.performanceMode = 
    isLowEnd ? 'low' : 'high';
}
```

### 4. CSS 최적화

```css
/* widget/src/styles/animations.css */

/* GPU 가속 활성화 */
.avatar, .speech-bubble {
  will-change: transform, opacity;
  transform: translateZ(0); /* GPU 레이어 강제 생성 */
}

/* 저사양 모드: 애니메이션 간소화 */
[data-performance-mode="low"] .avatar {
  animation-duration: 0.6s; /* 0.4s → 0.6s */
}

[data-performance-mode="low"] .speech-bubble {
  transition: opacity 0.2s ease; /* 복잡한 애니메이션 제거 */
}
```

## Tauri 옵션 (저사양 PC용)

Electron보다 메모리 50% 절감, CPU 30% 절감 가능

```bash
# Tauri 프로젝트 전환
cd widget-tauri
npm install @tauri-apps/cli @tauri-apps/api

# 개발 서버 실행
npm run tauri dev

# 빌드
npm run tauri build
```

**Cargo.toml 최적화:**
```toml
[profile.release]
opt-level = "z"     # 크기 최적화
lto = true          # Link Time Optimization
codegen-units = 1   # 단일 코드 유닛
strip = true        # 디버그 심볼 제거
```

## 백엔드 최적화

### Redis 세션 관리

```python
# backend/app/dependencies.py
import redis.asyncio as redis

redis_client = redis.Redis(
    host='localhost',
    port=6379,
    decode_responses=True,
    max_connections=50
)

# WebSocket 연결 정보 저장
async def store_session(code: str, ws_id: str):
    await redis_client.setex(f"session:{code}", 1800, ws_id)
```

### Rate Limiting

```python
# backend/app/middleware.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/messages")
@limiter.limit("10/minute")
async def create_message(request: Request, ...):
    ...
```

## 데이터베이스 인덱스

```sql
-- backend/migrations/001_indexes.sql

-- 세션 코드 조회 최적화
CREATE UNIQUE INDEX idx_session_code_active 
ON sessions(code) WHERE ended_at IS NULL;

-- 메시지 조회 최적화 (최근순)
CREATE INDEX idx_messages_session_time 
ON messages(session_id, created_at DESC);

-- 로그 파티셔닝 (선택)
CREATE TABLE logs_partitioned (
  LIKE logs INCLUDING ALL
) PARTITION BY RANGE (created_at);
```

## 개발 도구

### 1. 성능 모니터링 스크립트

```bash
# scripts/monitor_performance.sh
#!/bin/bash

PID=$(pgrep -f "class-widget")

while true; do
  CPU=$(ps -p $PID -o %cpu | tail -1)
  MEM=$(ps -p $PID -o rss | tail -1)
  echo "$(date) | CPU: ${CPU}% | MEM: $((MEM/1024))MB"
  sleep 5
done
```

### 2. 자동 테스트

```bash
# package.json scripts
{
  "scripts": {
    "test:performance": "node scripts/performance-test.js",
    "test:memory-leak": "node --expose-gc scripts/memory-test.js"
  }
}
```

## 트러블슈팅

### 문제: CPU 사용률 20% 초과

**원인:**
- 과도한 DOM 조작
- 무한 루프 애니메이션
- WebSocket 과다 메시지

**해결:**
```javascript
// RequestAnimationFrame으로 제한
let lastFrameTime = 0;
const targetFPS = 30; // 저사양 모드
const frameInterval = 1000 / targetFPS;

function animate(currentTime) {
  if (currentTime - lastFrameTime < frameInterval) {
    requestAnimationFrame(animate);
    return;
  }
  lastFrameTime = currentTime;
  
  // 애니메이션 로직
  updateAvatars();
  requestAnimationFrame(animate);
}
```

### 문제: 메모리 누수

**원인:**
- WebSocket 이벤트 리스너 미제거
- 타이머 정리 누락

**해결:**
```javascript
// 컴포넌트 언마운트 시 정리
useEffect(() => {
  const ws = new WebSocket(WS_URL);
  const timerId = setInterval(update, 1000);
  
  return () => {
    ws.close();
    clearInterval(timerId);
  };
}, []);
```

## 배포 전 체크리스트

- [ ] 저사양 PC에서 실제 테스트 (Pentium J4205급)
- [ ] CPU 사용률 < 15% 확인
- [ ] 메모리 사용량 < 200 MB 확인
- [ ] 30분 연속 동작 테스트 (메모리 누수 확인)
- [ ] 학생 50명 동시 접속 부하 테스트
- [ ] Hardware acceleration 활성화 확인
- [ ] 자동 업데이트 기능 테스트


### Electron 저사양 옵션

개발·실행 시 크롬 플래그를 추가해 GPU 기능을 끄고 메모리 사용을 줄입니다.

```bash
ELECTRON_EXTRA_LAUNCH_ARGS="--disable-gpu --disable-background-timer-throttling" npm start
```
