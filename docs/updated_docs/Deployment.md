# Deployment Guide

## 개요

교실 위젯 시스템은 두 가지 배포 대상이 있습니다:
1. **백엔드 서버**: 클라우드 VPS/컨테이너 (Docker)
2. **Electron 위젯**: 교사 PC에 자동 설치/업데이트

---

## 백엔드 배포 (Docker Compose)

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
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 512M
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
      - POSTGRES_USER=postgres
    command: >
      postgres
      -c max_connections=100
      -c shared_buffers=256MB
      -c effective_cache_size=1GB
      -c maintenance_work_mem=64MB
      -c checkpoint_completion_target=0.9
      -c wal_buffers=16MB
      -c default_statistics_target=100
      -c random_page_cost=1.1
      -c work_mem=4MB
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
      --save 300 10
      --save 60 10000
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
      - "443:443/udp" # HTTP/3
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
    # 기본 reverse proxy
    reverse_proxy /api/* api:8000
    reverse_proxy /ws/* api:8000
    
    # WebSocket 설정
    @websockets {
        header Connection *Upgrade*
        header Upgrade websocket
    }
    reverse_proxy @websockets api:8000
    
    # Rate limiting
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
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        -Server
    }
    
    # 압축
    encode gzip zstd
    
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
SENTRY_DSN=https://...  # 에러 추적 (선택)
```

### 배포 스크립트 (deploy.sh)

```bash
#!/bin/bash
set -e

echo "🚀 교실 위젯 백엔드 배포 시작..."

# 1. 최신 코드 가져오기
git pull origin main

# 2. 환경 변수 확인
if [ ! -f .env.production ]; then
    echo "❌ .env.production 파일이 없습니다."
    exit 1
fi

# 3. 데이터베이스 백업
echo "📦 데이터베이스 백업 중..."
docker compose exec -T db pg_dump -U postgres widget > backup_$(date +%Y%m%d_%H%M%S).sql

# 4. 컨테이너 빌드 및 재시작
echo "🔨 Docker 이미지 빌드 중..."
docker compose build --no-cache api

echo "🔄 서비스 재시작 중..."
docker compose up -d --force-recreate api

# 5. 헬스 체크
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

echo "❌ 헬스 체크 실패. 로그를 확인하세요."
docker compose logs api --tail 50
exit 1
```

---

## Electron 위젯 배포

### 1. 빌드 설정 (electron-builder)

```json
{
  "name": "class-widget",
  "version": "0.2.0",
  "main": "electron/main.js",
  "build": {
    "appId": "kr.school.widget",
    "productName": "교실 위젯",
    "win": {
      "target": ["nsis"],
      "icon": "assets/icon.ico",
      "requestedExecutionLevel": "asInvoker",
      "artifactName": "${productName}-Setup-${version}.${ext}"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "runAfterFinish": true,
      "installerIcon": "assets/installer.ico",
      "uninstallerIcon": "assets/uninstaller.ico",
      "license": "LICENSE.txt"
    },
    "publish": {
      "provider": "generic",
      "url": "https://cdn.widget.school.kr/releases/"
    },
    "directories": {
      "output": "dist",
      "buildResources": "assets"
    },
    "files": [
      "electron/**/*",
      "dist/**/*",
      "package.json"
    ],
    "compression": "maximum"
  },
  "scripts": {
    "build:win": "vite build && electron-builder --win --x64",
    "build:win32": "vite build && electron-builder --win --ia32"
  }
}
```

### 2. 자동 업데이트 구현

```javascript
// electron/updater.js
const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');

// 로그 활성화
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

// 자동 다운로드 비활성화 (사용자 확인 후 다운로드)
autoUpdater.autoDownload = false;

// 업데이트 확인
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
  
  autoUpdater.on('update-not-available', () => {
    console.log('최신 버전입니다.');
  });
  
  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('download-progress', progress.percent);
  });
  
  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '업데이트 준비 완료',
      message: '업데이트가 다운로드되었습니다. 지금 재시작하시겠습니까?',
      buttons: ['재시작', '나중에']
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });
}

module.exports = { checkForUpdates };
```

### 3. Windows 자동 실행 설정

```javascript
// electron/autoLaunch.js
const AutoLaunch = require('auto-launch');

const widgetAutoLauncher = new AutoLaunch({
  name: '교실 위젯',
  path: process.execPath,
  isHidden: false // 시작 시 창 표시
});

async function enableAutoLaunch() {
  const isEnabled = await widgetAutoLauncher.isEnabled();
  
  if (!isEnabled) {
    await widgetAutoLauncher.enable();
    console.log('자동 실행 활성화됨');
  }
}

async function disableAutoLaunch() {
  await widgetAutoLauncher.disable();
  console.log('자동 실행 비활성화됨');
}

module.exports = { enableAutoLaunch, disableAutoLaunch };
```

### 4. 코드 서명 (선택, 권장)

Windows Defender SmartScreen 경고를 피하려면 EV 코드 서명 인증서 필요

```bash
# 인증서 발급 후 (DigiCert, Sectigo 등)
# electron-builder가 자동으로 서명

# package.json에 추가
{
  "build": {
    "win": {
      "certificateFile": "cert.pfx",
      "certificatePassword": "${CERT_PASSWORD}",
      "signingHashAlgorithms": ["sha256"],
      "signDlls": true
    }
  }
}
```

**비용:** 약 $400-600/년

### 5. CDN 배포 (GitHub Releases 또는 S3)

#### Option A: GitHub Releases (무료)

```bash
# GitHub token 설정
export GH_TOKEN=your_github_token

# 빌드 및 자동 릴리스
npm run build:win
npx electron-builder --win --publish always
```

#### Option B: AWS S3 + CloudFront

```bash
# S3 버킷 생성
aws s3 mb s3://widget-releases

# CORS 설정
cat > cors.json << EOF
{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"]
  }]
}
EOF

aws s3api put-bucket-cors --bucket widget-releases --cors-configuration file://cors.json

# 빌드 파일 업로드
aws s3 sync dist/ s3://widget-releases/releases/ --acl public-read

# latest.yml 업데이트 (electron-updater 메타데이터)
aws s3 cp dist/latest.yml s3://widget-releases/releases/latest.yml --acl public-read
```

---

## 성능 최적화 배포 설정

### 1. FastAPI 프로덕션 설정

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.gzip import GZIPMiddleware
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="Class Widget API",
    docs_url=None,  # Swagger UI 비활성화 (프로덕션)
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
        workers=4,  # CPU 코어 수에 맞춤
        loop="uvloop",  # 성능 향상
        http="httptools",
        log_level="warning"
    )
```

### 2. Electron 프로덕션 최적화

```javascript
// electron/main.js
const isDev = process.env.NODE_ENV === 'development';

// 프로덕션에서는 DevTools 비활성화
if (!isDev) {
  app.commandLine.appendSwitch('disable-dev-tools');
}

// 성능 플래그
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=200');

const mainWindow = new BrowserWindow({
  width: 1920,
  height: 1080,
  fullscreen: true,
  frame: false,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    enableRemoteModule: false,
    preload: path.join(__dirname, 'preload.js'),
    backgroundThrottling: false // 백그라운드에서도 60 FPS 유지
  }
});

// 프로덕션에서는 컴파일된 파일 로드
if (isDev) {
  mainWindow.loadURL('http://localhost:5173');
} else {
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}
```

---

## 모니터링 및 로그

### 1. 백엔드 로그 (Loki + Grafana)

```yaml
# docker-compose.monitoring.yml
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml
      - loki_data:/loki

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  loki_data:
  grafana_data:
```

### 2. 에러 추적 (Sentry)

```python
# backend/app/main.py
import sentry_sdk

if os.getenv('ENVIRONMENT') == 'production':
    sentry_sdk.init(
        dsn=os.getenv('SENTRY_DSN'),
        traces_sample_rate=0.1,
        profiles_sample_rate=0.1,
    )
```

```javascript
// widget/src/main.js
import * as Sentry from '@sentry/electron';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://...@sentry.io/...',
    tracesSampleRate: 0.1,
  });
}
```

---

## 백업 및 복구

### 데이터베이스 자동 백업

```bash
# scripts/backup.sh
#!/bin/bash

BACKUP_DIR="/var/backups/widget"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/widget_$DATE.sql"

mkdir -p $BACKUP_DIR

# PostgreSQL 백업
docker compose exec -T db pg_dump -U postgres widget > $BACKUP_FILE

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

# S3 업로드 (선택)
aws s3 cp $BACKUP_FILE s3://widget-backups/

echo "백업 완료: $BACKUP_FILE"
```

**Cron 설정 (매일 새벽 2시):**
```bash
crontab -e
# 추가
0 2 * * * /opt/class-widget/scripts/backup.sh
```

---

## 배포 체크리스트

### 백엔드
- [ ] `.env.production` 파일 생성 및 보안 키 설정
- [ ] Docker Compose 설정 확인
- [ ] 데이터베이스 마이그레이션 실행
- [ ] 백업 스크립트 설정
- [ ] HTTPS 인증서 자동 갱신 확인 (Caddy)
- [ ] Rate limiting 테스트
- [ ] Health check 엔드포인트 확인

### Electron 위젯
- [ ] 버전 번호 업데이트 (`package.json`)
- [ ] 프로덕션 빌드 테스트
- [ ] 자동 업데이트 기능 테스트
- [ ] 코드 서명 (선택)
- [ ] CDN 업로드 및 접근 확인
- [ ] 저사양 PC 실제 테스트
- [ ] 자동 실행 기능 확인

### 모니터링
- [ ] Sentry 에러 추적 설정
- [ ] Grafana 대시보드 구성
- [ ] 알림 설정 (Slack, Email)

---

## 롤백 절차

```bash
# 1. 이전 버전 컨테이너로 롤백
docker compose down
docker compose up -d --scale api=0
docker compose up -d api@previous_version

# 2. 데이터베이스 복구 (필요 시)
docker compose exec -T db psql -U postgres widget < backup_YYYYMMDD_HHMMSS.sql

# 3. 확인
curl https://widget.school.kr/api/health
```

---

## 예상 비용 (월)

| 항목 | 사양 | 비용 |
|------|------|------|
| VPS (DigitalOcean, Vultr) | 2 vCPU, 4GB RAM | ₩30,000 |
| 관리형 PostgreSQL (선택) | 1GB | ₩50,000 |
| CDN (CloudFront) | 100GB 전송 | ₩10,000 |
| 도메인 | .kr | ₩15,000/년 |
| 코드 서명 인증서 (선택) | EV 인증서 | ₩500,000/년 |
| **합계** | | **약 ₩90,000/월** |

**비용 절감 팁:**
- GitHub Releases 사용 시 CDN 비용 무료
- Self-hosted PostgreSQL로 관리형 DB 비용 절약
- Let's Encrypt 무료 SSL 인증서 (Caddy 자동)
