# Deployment Guide

**Version**: 0.2  
**Updated**: 2025-10-12

---

## Docker Compose (Backend)

### docker-compose.yml

```yaml
version: "3.9"
services:
  api:
    build: ./backend
    restart: always
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/widget
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - ENVIRONMENT=production
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
    networks:
      - backend

  db:
    image: postgres:16-alpine
    restart: always
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=widget
    command: >
      postgres
      -c max_connections=100
      -c shared_buffers=256MB
      -c effective_cache_size=1GB
      -c work_mem=16MB
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend

  redis:
    image: redis:7-alpine
    restart: always
    command: >
      redis-server
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --save 900 1
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - backend

  caddy:
    image: caddy:2-alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - api
    networks:
      - backend

volumes:
  pgdata:
  redis_data:
  caddy_data:
  caddy_config:

networks:
  backend:
    driver: bridge
```

### Caddyfile

```caddyfile
widget.school.kr {
    # API reverse proxy
    reverse_proxy /api/* api:8000
    reverse_proxy /ws/* api:8000
    
    # WebSocket 설정
    @websockets {
        header Connection *Upgrade*
        header Upgrade websocket
    }
    reverse_proxy @websockets api:8000
    
    # Rate limiting (Caddy plugin)
    rate_limit {
        zone dynamic {
            key {remote_host}
            events 100
            window 1m
        }
    }
    
    # 보안 헤더
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        Strict-Transport-Security "max-age=31536000"
        -Server
    }
    
    # 압축
    encode gzip
    
    # 로그
    log {
        output file /var/log/caddy/access.log
        format json
    }
}
```

### 환경 변수 (.env)

```bash
# .env.production
DB_PASSWORD=your_secure_password_here
SECRET_KEY=your_secret_key_min_32_chars
ENVIRONMENT=production
```

---

## Electron 빌드 & 배포

### package.json

```json
{
  "name": "class-widget",
  "version": "0.4.0",
  "main": "electron/main.js",
  "build": {
    "appId": "kr.school.widget",
    "productName": "교실 위젯",
    "win": {
      "target": ["nsis"],
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "runAfterFinish": true
    },
    "publish": {
      "provider": "generic",
      "url": "https://cdn.widget.school.kr/releases/"
    },
    "files": [
      "electron/**/*",
      "dist/**/*",
      "assets/**/*",
      "package.json"
    ]
  },
  "scripts": {
    "build:win": "vite build && electron-builder --win --x64"
  }
}
```

### 빌드 명령어

```bash
cd widget
npm run build:win
# outputs: dist/교실 위젯 Setup 0.4.0.exe
```

### 자동 업데이트

```javascript
// electron/updater.js
const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');

autoUpdater.autoDownload = false;

function checkForUpdates(mainWindow) {
  autoUpdater.checkForUpdates();
  
  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '업데이트 가능',
      message: `새 버전 ${info.version}이 있습니다. 다운로드하시겠습니까?`,
      buttons: ['다운로드', '나중에']
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });
  
  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '업데이트 준비 완료',
      message: '재시작하시겠습니까?',
      buttons: ['재시작', '나중에']
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
}

module.exports = { checkForUpdates };
```

---

## 프로덕션 최적화 ⭐

### FastAPI 설정

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.gzip import GZIPMiddleware
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="Class Widget API",
    docs_url=None,  # Swagger UI 비활성화
    redoc_url=None,
    openapi_url=None
)

# GZIP 압축
app.add_middleware(GZIPMiddleware, minimum_size=1000)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://widget.school.kr"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    max_age=3600
)

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        workers=4,  # CPU 코어 수
        loop="uvloop",  # 성능 향상
        http="httptools",
        log_level="warning"
    )
```

### Electron 프로덕션 설정

```javascript
// electron/main.js
const isDev = process.env.NODE_ENV === 'development';

if (!isDev) {
  // DevTools 비활성화
  app.commandLine.appendSwitch('disable-dev-tools');
}

// 성능 플래그
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=200');

const mainWindow = new BrowserWindow({
  width: 1920,
  height: 1080,
  fullscreen: true,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    backgroundThrottling: false // 백그라운드에서도 타이머 유지
  }
});

// 프로덕션: 컴파일된 파일 로드
if (isDev) {
  mainWindow.loadURL('http://localhost:5173');
} else {
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}
```

---

## 백업 전략

### 데이터베이스 백업

```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/var/backups/classkit"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/widget_$DATE.sql"

mkdir -p $BACKUP_DIR

# PostgreSQL 백업
docker compose exec -T db pg_dump -U postgres widget > $BACKUP_FILE

# 압축
gzip $BACKUP_FILE

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "백업 완료: $BACKUP_FILE.gz"
```

**Cron 설정 (매일 새벽 2시):**
```bash
0 2 * * * /opt/classkit/scripts/backup.sh
```

---

## 모니터링

### Health Check

```python
# backend/app/routes/health.py
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "0.4.0"
    }
```

### 로그 모니터링

```bash
# 실시간 로그 확인
docker compose logs -f api

# 에러만 필터링
docker compose logs api | grep ERROR

# 최근 100줄
docker compose logs --tail 100 api
```

---

## 배포 스크립트

### deploy.sh

```bash
#!/bin/bash
set -e

echo "🚀 교실 위젯 배포 시작..."

# 1. 최신 코드
git pull origin main

# 2. 환경 변수 확인
if [ ! -f .env.production ]; then
    echo "❌ .env.production 파일이 없습니다."
    exit 1
fi

# 3. 백업
echo "📦 데이터베이스 백업 중..."
./scripts/backup.sh

# 4. Docker 빌드
echo "🔨 Docker 이미지 빌드 중..."
docker compose build --no-cache api

# 5. 재시작
echo "🔄 서비스 재시작 중..."
docker compose up -d --force-recreate api

# 6. 헬스 체크
echo "🏥 헬스 체크 중..."
sleep 5
for i in {1..10}; do
    if curl -f http://localhost:8000/health; then
        echo "✅ 배포 성공!"
        exit 0
    fi
    echo "대기 중... ($i/10)"
    sleep 3
done

echo "❌ 헬스 체크 실패"
docker compose logs api --tail 50
exit 1
```

---

## 배포 체크리스트

### 백엔드
- [ ] `.env.production` 파일 생성
- [ ] Docker Compose 설정 확인
- [ ] 데이터베이스 마이그레이션 실행
- [ ] 백업 스크립트 설정
- [ ] HTTPS 인증서 확인
- [ ] Rate limiting 테스트
- [ ] Health check 확인

### Electron 위젯
- [ ] 버전 번호 업데이트
- [ ] 프로덕션 빌드 테스트
- [ ] 자동 업데이트 기능 테스트
- [ ] 저사양 PC 실제 테스트
- [ ] 모드 전환 기능 확인
- [ ] 아바타 걷기 12 FPS 확인

### 성능
- [ ] Break 모드 CPU < 8%
- [ ] Class 모드 CPU < 3%
- [ ] Work 모드 CPU < 2%
- [ ] 메모리 < 200 MB
- [ ] 30분 연속 동작 테스트

---

## 롤백 절차

```bash
# 1. 이전 버전으로 롤백
docker compose down
docker compose up -d

# 2. 데이터베이스 복구 (필요 시)
gunzip backup_YYYYMMDD_HHMMSS.sql.gz
docker compose exec -T db psql -U postgres widget < backup_YYYYMMDD_HHMMSS.sql

# 3. 확인
curl https://widget.school.kr/api/health
```

---

## 예상 비용 (월)

| 항목 | 사양 | 비용 |
|------|------|------|
| VPS | 2 vCPU, 4GB RAM | ₩30,000 |
| 도메인 | .kr | ₩15,000/년 |
| CDN (Electron 배포) | GitHub Releases | 무료 |
| **합계** | | **약 ₩30,000/월** |

---

## Changelog

### v0.2 (2025-10-12)
- ✅ Docker Compose health check 추가
- ✅ PostgreSQL 성능 튜닝
- ✅ Redis 캐싱 전략
- ✅ 프로덕션 최적화 설정
- ✅ 백업 스크립트
- ✅ 배포 스크립트

### v0.1 (2025-10-12)
- Initial deployment guide
