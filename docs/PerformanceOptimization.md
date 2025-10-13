# 성능 최적화 가이드

## 목표 성능 지표

| 항목 | 목표값 | 측정 방법 |
|------|--------|-----------|
| CPU 사용률 (idle) | < 5% | Task Manager |
| CPU 사용률 (활성) | < 15% | Chrome DevTools Performance |
| 메모리 사용량 | < 200 MB | Process Explorer |
| 애니메이션 FPS | ≥ 30 FPS | DevTools Performance Monitor |
| 초기 로딩 시간 | < 3초 | Performance API |
| WebSocket 응답 시간 | < 100ms | Network 탭 |

**기준 테스트 환경:** Pentium J4205 (4C/4T 1.5GHz), 4GB RAM, Windows 10

---

## 1. 렌더링 최적화

### 1.1 GPU 가속 활성화

**Electron 설정:**
```javascript
// electron/main.js
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

const win = new BrowserWindow({
  webPreferences: {
    hardwareAcceleration: true,
  }
});
```

**CSS 최적화:**
```css
/* GPU 가속이 적용되는 속성만 사용 */
.avatar {
  /* ✅ 권장: GPU 가속됨 */
  transform: translate3d(0, 0, 0);
  opacity: 1;
  
  /* ❌ 비권장: CPU 렌더링 */
  /* left: 100px; */
  /* top: 100px; */
}

/* will-change로 최적화 힌트 제공 */
.speech-bubble {
  will-change: transform, opacity;
  transform: translateZ(0); /* 강제 레이어 생성 */
}
```

### 1.2 애니메이션 프레임 제어

```javascript
// utils/animation.js
class PerformanceAwareAnimator {
  constructor() {
    this.targetFPS = this.detectTargetFPS();
    this.frameInterval = 1000 / this.targetFPS;
    this.lastFrameTime = 0;
  }
  
  detectTargetFPS() {
    const cores = navigator.hardwareConcurrency || 2;
    const memory = navigator.deviceMemory || 2;
    
    // 저사양 감지
    if (cores <= 4 && memory <= 4) {
      return 30; // 30 FPS
    }
    return 60; // 60 FPS
  }
  
  animate(callback) {
    const animateFrame = (currentTime) => {
      if (currentTime - this.lastFrameTime >= this.frameInterval) {
        this.lastFrameTime = currentTime;
        callback(currentTime);
      }
      requestAnimationFrame(animateFrame);
    };
    
    requestAnimationFrame(animateFrame);
  }
}

// 사용 예시
const animator = new PerformanceAwareAnimator();
animator.animate((time) => {
  updateAvatars();
  updateSpeechBubbles();
});
```

### 1.3 말풍선 동시 표시 제한

```javascript
// components/SpeechBubbleManager.js
class SpeechBubbleManager {
  constructor(maxBubbles = 5) {
    this.maxBubbles = maxBubbles;
    this.activeBubbles = [];
  }
  
  addBubble(message) {
    // 최대 개수 초과 시 가장 오래된 것 제거
    if (this.activeBubbles.length >= this.maxBubbles) {
      const oldest = this.activeBubbles.shift();
      this.fadeOutBubble(oldest);
    }
    
    const bubble = this.createBubble(message);
    this.activeBubbles.push(bubble);
    
    // 5초 후 자동 제거
    setTimeout(() => {
      this.removeBubble(bubble);
    }, 5000);
  }
  
  fadeOutBubble(bubble) {
    bubble.style.transition = 'opacity 0.3s ease';
    bubble.style.opacity = '0';
    
    setTimeout(() => {
      bubble.remove();
    }, 300);
  }
}
```

---

## 2. 메모리 관리

### 2.1 V8 힙 메모리 제한

```javascript
// electron/main.js
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=200');
app.commandLine.appendSwitch('js-flags', '--optimize-for-size');
```

### 2.2 이미지 최적화

```javascript
// utils/imageOptimizer.js

// 스프라이트 시트 사용
const avatarSprite = new Image();
avatarSprite.src = 'avatars-sprite.png'; // 모든 아바타를 하나의 이미지로

// Canvas에 그리기 (개별 이미지 로드보다 메모리 효율적)
function drawAvatar(ctx, avatarId, x, y) {
  const spriteX = (avatarId % 8) * 16;
  const spriteY = Math.floor(avatarId / 8) * 16;
  
  ctx.drawImage(
    avatarSprite,
    spriteX, spriteY, 16, 16,  // 소스 영역
    x, y, 32, 32               // 대상 영역
  );
}
```

**이미지 압축:**
```bash
# PNG 최적화
pngquant --quality=65-80 --ext .png --force avatars/*.png

# WebP 변환 (50% 용량 절감)
cwebp -q 80 avatar1.png -o avatar1.webp
```

### 2.3 주기적 메모리 정리

```javascript
// utils/memoryManager.js
class MemoryManager {
  constructor() {
    this.startCleanupInterval();
  }
  
  startCleanupInterval() {
    // 30분마다 메모리 정리
    setInterval(() => {
      this.cleanup();
    }, 1800000);
  }
  
  cleanup() {
    // WebSocket 재연결 (연결 풀 정리)
    if (window.ws && window.ws.readyState === WebSocket.OPEN) {
      window.ws.close();
      window.ws = null;
      reconnectWebSocket();
    }
    
    // DOM 캐시 정리
    clearDOMCache();
    
    // 이미지 캐시 정리 (사용하지 않는 이미지)
    clearUnusedImages();
    
    // 강제 가비지 컬렉션 (개발 모드에서만)
    if (process.env.NODE_ENV === 'development' && global.gc) {
      global.gc();
    }
  }
}
```

---

## 3. 네트워크 최적화

### 3.1 WebSocket 메시지 압축

```python
# backend/app/websocket.py
from fastapi import WebSocket
import zlib
import json

async def send_compressed(websocket: WebSocket, data: dict):
    json_data = json.dumps(data)
    
    # 100 bytes 이상만 압축
    if len(json_data) > 100:
        compressed = zlib.compress(json_data.encode())
        await websocket.send_bytes(compressed)
    else:
        await websocket.send_text(json_data)
```

```javascript
// frontend/utils/websocket.js
function decompressMessage(data) {
  if (data instanceof ArrayBuffer) {
    // 압축된 데이터
    const decompressed = pako.inflate(new Uint8Array(data), { to: 'string' });
    return JSON.parse(decompressed);
  }
  // 일반 JSON
  return JSON.parse(data);
}
```

### 3.2 메시지 배치 처리

```javascript
// utils/messageBatcher.js
class MessageBatcher {
  constructor(flushInterval = 200) {
    this.queue = [];
    this.timer = null;
    this.flushInterval = flushInterval;
  }
  
  addMessage(message) {
    this.queue.push(message);
    
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flush();
      }, this.flushInterval);
    }
  }
  
  flush() {
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0);
    this.processMessages(batch);
    
    this.timer = null;
  }
  
  processMessages(messages) {
    // 한번에 DOM 업데이트
    const fragment = document.createDocumentFragment();
    
    messages.forEach(msg => {
      const bubble = createSpeechBubble(msg);
      fragment.appendChild(bubble);
    });
    
    document.getElementById('bubble-container').appendChild(fragment);
  }
}
```

---

## 4. 저사양 모드 구현

### 4.1 자동 감지 및 전환

```javascript
// utils/performanceMonitor.js
class PerformanceMonitor {
  constructor() {
    this.samples = [];
    this.maxSamples = 10;
    this.checkInterval = 5000; // 5초마다 체크
    this.mode = 'high';
    
    this.startMonitoring();
  }
  
  startMonitoring() {
    setInterval(() => {
      this.checkPerformance();
    }, this.checkInterval);
  }
  
  async checkPerformance() {
    // Chrome Performance API 사용
    if (!performance.memory) return;
    
    const cpuUsage = await this.estimateCPUUsage();
    const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
    
    this.samples.push({ cpu: cpuUsage, memory: memoryUsage });
    
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
    
    // 평균 계산
    const avgCPU = this.samples.reduce((sum, s) => sum + s.cpu, 0) / this.samples.length;
    const avgMemory = this.samples.reduce((sum, s) => sum + s.memory, 0) / this.samples.length;
    
    // 자동 모드 전환
    if (avgCPU > 20 || avgMemory > 180) {
      this.switchToLowMode();
    } else if (avgCPU < 10 && avgMemory < 150 && this.mode === 'low') {
      this.switchToHighMode();
    }
  }
  
  estimateCPUUsage() {
    return new Promise(resolve => {
      const start = performance.now();
      let iterations = 0;
      
      // 10ms 동안 반복문 실행
      while (performance.now() - start < 10) {
        iterations++;
      }
      
      // CPU가 빠를수록 iterations가 높음
      // 기준값 대비 비율로 CPU 사용률 추정
      const baseline = 1000000; // Pentium J4205 기준
      const usage = Math.min(100, 100 - (iterations / baseline * 100));
      
      resolve(usage);
    });
  }
  
  switchToLowMode() {
    if (this.mode === 'low') return;
    
    console.log('저사양 모드로 전환');
    this.mode = 'low';
    document.documentElement.dataset.performanceMode = 'low';
    
    // 이벤트 발행
    window.dispatchEvent(new CustomEvent('performance-mode-change', { 
      detail: { mode: 'low' } 
    }));
  }
  
  switchToHighMode() {
    if (this.mode === 'high') return;
    
    console.log('일반 모드로 전환');
    this.mode = 'high';
    document.documentElement.dataset.performanceMode = 'high';
    
    window.dispatchEvent(new CustomEvent('performance-mode-change', { 
      detail: { mode: 'high' } 
    }));
  }
}

// 전역 인스턴스
const perfMonitor = new PerformanceMonitor();
```

### 4.2 저사양 모드 CSS

```css
/* styles/performance-modes.css */

/* 일반 모드 */
[data-performance-mode="high"] .avatar {
  animation: float 2s ease-in-out infinite;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

[data-performance-mode="high"] .speech-bubble {
  animation: bubble-appear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  backdrop-filter: blur(10px);
}

/* 저사양 모드: 애니메이션 간소화 */
[data-performance-mode="low"] .avatar {
  animation: none; /* 부유 애니메이션 제거 */
  filter: none; /* 그림자 제거 */
}

[data-performance-mode="low"] .speech-bubble {
  animation: bubble-appear-simple 0.2s ease; /* 단순 애니메이션 */
  backdrop-filter: none; /* blur 제거 (CPU 부하 큼) */
  background: rgba(255, 255, 255, 0.95); /* 불투명 배경 */
}

@keyframes bubble-appear-simple {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
```

---

## 5. 백엔드 최적화

### 5.1 데이터베이스 쿼리 최적화

```python
# backend/app/crud.py
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def get_session_with_messages(db: AsyncSession, code: str):
    # ❌ N+1 쿼리 문제
    # session = await db.get(Session, code)
    # messages = await db.execute(select(Message).where(Message.session_id == session.id))
    
    # ✅ Eager loading으로 한번에 조회
    result = await db.execute(
        select(Session)
        .options(selectinload(Session.messages))
        .where(Session.code == code)
        .where(Session.ended_at.is_(None))
    )
    return result.scalar_one_or_none()
```

### 5.2 Redis 캐싱

```python
# backend/app/cache.py
import redis.asyncio as redis
import json
from functools import wraps

redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

def cached(ttl: int = 300):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 캐시 키 생성
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # 캐시 확인
            cached_value = await redis_client.get(cache_key)
            if cached_value:
                return json.loads(cached_value)
            
            # 함수 실행
            result = await func(*args, **kwargs)
            
            # 캐시 저장
            await redis_client.setex(cache_key, ttl, json.dumps(result))
            
            return result
        return wrapper
    return decorator

# 사용 예시
@cached(ttl=600)
async def get_problems_by_grade(grade: str):
    return await db.execute(select(Problem).where(Problem.grade == grade))
```

### 5.3 WebSocket 연결 풀 관리

```python
# backend/app/websocket_manager.py
from typing import Dict, Set
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.max_connections_per_session = 50
    
    async def connect(self, websocket: WebSocket, session_code: str):
        await websocket.accept()
        
        if session_code not in self.active_connections:
            self.active_connections[session_code] = set()
        
        # 연결 수 제한
        if len(self.active_connections[session_code]) >= self.max_connections_per_session:
            await websocket.send_json({"error": "Session full"})
            await websocket.close()
            return False
        
        self.active_connections[session_code].add(websocket)
        return True
    
    async def broadcast(self, session_code: str, message: dict):
        if session_code not in self.active_connections:
            return
        
        # 비동기 병렬 전송
        tasks = [
            ws.send_json(message) 
            for ws in self.active_connections[session_code]
        ]
        await asyncio.gather(*tasks, return_exceptions=True)
```

---

## 6. 측정 및 모니터링

### 6.1 성능 메트릭 수집

```javascript
// utils/metrics.js
class PerformanceMetrics {
  constructor() {
    this.metrics = {
      fps: [],
      memory: [],
      cpu: [],
      wsLatency: []
    };
    
    this.startCollection();
  }
  
  startCollection() {
    // FPS 측정
    let lastTime = performance.now();
    let frames = 0;
    
    const measureFPS = () => {
      frames++;
      const now = performance.now();
      
      if (now >= lastTime + 1000) {
        this.metrics.fps.push(frames);
        frames = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(measureFPS);
    };
    requestAnimationFrame(measureFPS);
    
    // 메모리 측정 (1분마다)
    setInterval(() => {
      if (performance.memory) {
        const mb = performance.memory.usedJSHeapSize / 1024 / 1024;
        this.metrics.memory.push(mb);
      }
    }, 60000);
  }
  
  getReport() {
    return {
      avgFPS: this.avg(this.metrics.fps),
      avgMemory: this.avg(this.metrics.memory),
      p95Latency: this.percentile(this.metrics.wsLatency, 95)
    };
  }
  
  avg(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  
  percentile(arr, p) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p / 100) - 1;
    return sorted[index];
  }
}
```

### 6.2 자동 성능 보고

```javascript
// 10분마다 서버로 성능 지표 전송
setInterval(() => {
  const report = perfMetrics.getReport();
  
  fetch('/api/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      device_info: {
        cores: navigator.hardwareConcurrency,
        memory: navigator.deviceMemory,
        platform: navigator.platform
      },
      metrics: report
    })
  });
}, 600000);
```

---

## 7. 체크리스트

### 개발 단계
- [ ] Hardware acceleration 활성화 확인
- [ ] DevTools Performance 프로파일링 실행
- [ ] 메모리 누수 테스트 (30분 연속 실행)
- [ ] 저사양 모드 자동 전환 테스트

### 배포 전
- [ ] 실제 Pentium J4205 PC에서 테스트
- [ ] CPU < 15% 확인
- [ ] Memory < 200 MB 확인
- [ ] 학생 50명 동시 접속 테스트
- [ ] 애니메이션 30 FPS 이상 유지 확인

### 모니터링
- [ ] 성능 메트릭 수집 대시보드 구축
- [ ] 알림 설정 (CPU > 25%, Memory > 250 MB)
- [ ] 사용자 피드백 수집 (느림/버벅임 신고)

