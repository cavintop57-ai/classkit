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

---

## 저사양 PC 테스트 환경 ⭐

### 권장 테스트 기기
- **최소 사양**: Pentium J4205 (4C/4T, 1.5-2.6 GHz), 4GB RAM
- **중급 사양**: Core i3-6100U (2C/4T, 2.3 GHz), 8GB RAM
- **권장 사양**: Core i5 8세대 이상, 8GB RAM

### 가상 환경에서 저사양 시뮬레이션

```bash
# VirtualBox 설정
- CPU: 2 cores (cap at 50%)
- RAM: 2GB
- Graphics: VMSVGA, 128MB VRAM
- Windows 10 64-bit
```

---

## 성능 프로파일링

### Chrome DevTools Performance

```bash
# Electron 실행 (로깅 활성화)
npm run dev -- --enable-logging

# 브라우저에서 F12 → Performance 탭
# 1. Record 시작
# 2. 1분간 정상 사용 (모든 모드 전환)
# 3. 중지 → 분석
```

**목표 지표:**
- Scripting: < 10%
- Rendering: < 30%
- Painting: < 20%
- **Idle: > 40%**

### FPS 측정

```javascript
// widget/src/utils/fpsMonitor.js
class FPSMonitor {
  constructor() {
    this.fps = 0;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.startMonitoring();
  }
  
  startMonitoring() {
    const measure = () => {
      this.frameCount++;
      const now = performance.now();
      
      if (now >= this.lastTime + 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastTime = now;
        
        console.log(`FPS: ${this.fps}`);
        
        // 12 FPS 미만 경고
        if (this.fps < 12) {
          console.warn('⚠️ FPS too low!');
        }
      }
      
      requestAnimationFrame(measure);
    };
    
    requestAnimationFrame(measure);
  }
}

// 사용
const fpsMonitor = new FPSMonitor();
```

---

## Electron 최적화 설정

### electron/main.js

```javascript
const { app, BrowserWindow } = require('electron');

// GPU 가속 활성화
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

// 저사양 PC용 추가 설정
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=200');

const mainWindow = new BrowserWindow({
  width: 1920,
  height: 1080,
  fullscreen: true,
  frame: false,
  webPreferences: {
    hardwareAcceleration: true,
    enableRemoteModule: false,
    contextIsolation: true,
    nodeIntegration: false,
    preload: path.join(__dirname, 'preload.js')
  },
  show: false // 초기 로딩 깜빡임 방지
});

// 준비되면 표시
mainWindow.once('ready-to-show', () => {
  mainWindow.show();
});
```

---

## 모드 시스템 구현 ⭐

### 모드 상태 관리

```javascript
// widget/src/stores/modeStore.js
import { create } from 'zustand';

const useModeStore = create((set, get) => ({
  mode: 'break', // 'break' | 'class' | 'work'
  
  setMode: (newMode) => {
    const oldMode = get().mode;
    console.log(`Mode: ${oldMode} → ${newMode}`);
    
    // 모드 전환 애니메이션
    document.body.dataset.modeChanging = 'true';
    
    setTimeout(() => {
      set({ mode: newMode });
      document.body.dataset.mode = newMode;
      document.body.dataset.modeChanging = 'false';
      
      // 렌더링 루프 제어
      if (newMode === 'work') {
        cancelAnimationFrame(window.renderLoop);
      } else if (oldMode === 'work') {
        startRenderLoop();
      }
    }, 150); // fade 중간 지점
  },
  
  toggleBreakClass: () => {
    const current = get().mode;
    get().setMode(current === 'break' ? 'class' : 'break');
  },
  
  toggleClassWork: () => {
    const current = get().mode;
    get().setMode(current === 'class' ? 'work' : 'class');
  }
}));

export default useModeStore;
```

### 렌더링 루프 제어

```javascript
// widget/src/renderer/renderLoop.js
let animationId = null;
let lastTime = 0;
const TARGET_FPS = 12; // Break 모드 타겟
const FRAME_INTERVAL = 1000 / TARGET_FPS;

function renderLoop(currentTime) {
  // 모드 확인
  const mode = document.body.dataset.mode;
  
  // Work 모드는 렌더링 안 함
  if (mode === 'work') {
    return;
  }
  
  // Class 모드는 타이머만
  if (mode === 'class') {
    updateTimer();
    animationId = requestAnimationFrame(renderLoop);
    return;
  }
  
  // Break 모드: 12 FPS 제한
  if (currentTime - lastTime >= FRAME_INTERVAL) {
    lastTime = currentTime;
    
    // 아바타 걷기 업데이트
    updateAvatarWalking();
    
    // 말풍선 업데이트
    updateSpeechBubbles();
    
    // 학습 카드 업데이트
    updateLearningCard();
  }
  
  animationId = requestAnimationFrame(renderLoop);
}

export function startRenderLoop() {
  if (!animationId) {
    lastTime = performance.now();
    animationId = requestAnimationFrame(renderLoop);
  }
}

export function stopRenderLoop() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

// 전역 저장
window.renderLoop = animationId;
```

---

## 아바타 걷기 구현

### Canvas 렌더러

```javascript
// widget/src/components/AvatarCanvas.js
class AvatarCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.spriteImage = new Image();
    this.spriteImage.src = '/assets/avatars-sprite.png';
    
    this.avatars = []; // {id, avatarId, x, y, frame}
    this.frameCounter = 0;
  }
  
  addAvatar(avatarId, x, y) {
    this.avatars.push({
      id: Date.now(),
      avatarId,
      x,
      y,
      frame: 0
    });
  }
  
  update() {
    const mode = document.body.dataset.mode;
    
    // Break 모드에서만 걷기
    if (mode === 'break') {
      this.frameCounter++;
      
      // 5 ticks = 1 frame (12 FPS @ 60 FPS loop)
      if (this.frameCounter >= 5) {
        this.frameCounter = 0;
        
        this.avatars.forEach(avatar => {
          avatar.frame = (avatar.frame + 1) % 4;
          
          // 랜덤 워킹
          avatar.x += (Math.random() - 0.5) * 2;
          avatar.y += (Math.random() - 0.5) * 2;
          
          // 경계 체크
          avatar.x = Math.max(0, Math.min(this.canvas.width - 32, avatar.x));
          avatar.y = Math.max(0, Math.min(this.canvas.height - 32, avatar.y));
        });
      }
    }
  }
  
  draw() {
    // 캔버스 클리어
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 모든 아바타 그리기
    this.avatars.forEach(avatar => {
      const spriteX = ((avatar.avatarId % 8) * 16) + (avatar.frame * 16);
      const spriteY = Math.floor(avatar.avatarId / 8) * 16;
      
      this.ctx.drawImage(
        this.spriteImage,
        spriteX, spriteY, 16, 16,
        avatar.x, avatar.y, 32, 32
      );
    });
  }
}
```

---

## 성능 모니터링 스크립트

### CPU/메모리 측정 (Windows)

```bash
# scripts/monitor_performance.ps1
$processName = "classkit"

while ($true) {
    $process = Get-Process $processName -ErrorAction SilentlyContinue
    
    if ($process) {
        $cpu = $process.CPU
        $mem = [math]::Round($process.WorkingSet64 / 1MB, 2)
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        
        Write-Host "$timestamp | CPU: $cpu% | Memory: ${mem}MB"
        
        # CSV 저장
        "$timestamp,$cpu,$mem" | Out-File -Append performance_log.csv
    }
    
    Start-Sleep -Seconds 5
}
```

---

## 백엔드 최적화

### Redis 설정

```python
# backend/app/dependencies.py
import redis.asyncio as redis

redis_client = redis.Redis(
    host='localhost',
    port=6379,
    decode_responses=True,
    max_connections=50,
    socket_keepalive=True
)

# WebSocket 세션 저장
async def store_session(code: str, data: dict):
    await redis_client.setex(
        f"session:{code}", 
        1800,  # 30분 TTL
        json.dumps(data)
    )
```

### Rate Limiting

```python
# backend/app/middleware.py
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, HTTPException

limiter = Limiter(key_func=get_remote_address)

@app.post("/messages")
@limiter.limit("5/minute")
async def create_message(request: Request, ...):
    ...

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"error": "RATE_LIMIT_EXCEEDED", "retry_after": 60}
    )
```

---

## 데이터베이스 최적화

### 인덱스 생성

```sql
-- backend/migrations/001_indexes.sql

-- 세션 코드 조회 (가장 빈번)
CREATE UNIQUE INDEX idx_session_code_active 
ON sessions(code) WHERE ended_at IS NULL;

-- 메시지 조회 (세션별 최근순)
CREATE INDEX idx_messages_session_time 
ON messages(session_id, created_at DESC);

-- 문제 조회 (학년, 난이도별)
CREATE INDEX idx_problems_grade_difficulty 
ON problems(grade, difficulty);
```

---

## 트러블슈팅

### 문제: CPU 사용률 높음

**진단:**
```javascript
// Chrome DevTools → Performance
// 1분 녹화 후 확인
// - Rendering 시간이 긴 경우: GPU 가속 미활성화
// - Scripting 시간이 긴 경우: 무한 루프 또는 과다 계산
```

**해결:**
1. GPU 가속 확인: `chrome://gpu`에서 "Graphics Feature Status" 체크
2. FPS 제한 확인: 12 FPS로 제한되어 있는지
3. 모드 확인: Work 모드에서는 렌더링 루프 중단되는지

### 문제: 메모리 누수

**진단:**
```javascript
// Chrome DevTools → Memory
// Heap snapshot 3회 촬영 (1분 간격)
// Detached DOM nodes 증가 여부 확인
```

**해결:**
```javascript
// 컴포넌트 정리
useEffect(() => {
  const ws = new WebSocket(WS_URL);
  const timerId = setInterval(update, 1000);
  
  return () => {
    ws.close();
    clearInterval(timerId);
    // DOM 참조 제거
    avatarRefs.current = [];
  };
}, []);
```

---

## 배포 전 체크리스트

### 성능 테스트
- [ ] Pentium J4205급 PC에서 실제 테스트
- [ ] Break 모드 CPU < 8%
- [ ] Class 모드 CPU < 3%
- [ ] Work 모드 CPU < 2%
- [ ] 메모리 사용량 < 200 MB
- [ ] 아바타 걷기 12 FPS 유지
- [ ] 30분 연속 동작 (메모리 누수 확인)

### 기능 테스트
- [ ] 모드 전환 (F1, F2) 정상 동작
- [ ] 아바타 걷기 Break 모드만 활성화
- [ ] 말풍선 최대 5개 제한
- [ ] WebSocket 재연결 자동화
- [ ] 학생 50명 동시 접속 테스트

### 최적화 확인
- [ ] Hardware acceleration 활성화
- [ ] GPU 레이어 생성 확인 (DevTools Layers)
- [ ] 데이터베이스 인덱스 적용
- [ ] Redis 캐싱 동작
- [ ] Rate limiting 동작

---

## 참고 자료

- Electron Performance: https://www.electronjs.org/docs/latest/tutorial/performance
- Chrome DevTools: https://developer.chrome.com/docs/devtools/
- Canvas Optimization: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
