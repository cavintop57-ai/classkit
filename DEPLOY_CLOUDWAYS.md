# 🚀 ClassKit Cloudways 배포 가이드

## 📋 준비사항
- ✅ Cloudways 서버 (이미 운용 중)
- ✅ SSH 접속 정보
- ✅ Git 설치됨

---

## 🔧 1단계: 서버 준비 (5분)

### 1. Cloudways 대시보드 접속

1. https://platform.cloudways.com 로그인
2. **Servers** → 사용 중인 서버 선택
3. **Access Details** 확인:
   - Public IP
   - Username (보통 `master_xxx`)
   - SSH 포트 (보통 22)

### 2. SSH 키 등록 (선택사항)

**Master Credentials** → **SSH Public Key** → 키 추가

---

## 📦 2단계: 애플리케이션 생성

### 방법 A: Cloudways Application (권장)

1. **Applications** → **Add Application**
2. 설정:
   ```
   Name: ClassKit
   Application: Custom
   Server: (사용 중인 서버 선택)
   ```
3. **Add Application** 클릭

### 방법 B: SSH로 직접 설치

```bash
# SSH 접속
ssh master_xxx@YOUR_SERVER_IP

# Python 3.11 설치 확인
python3 --version

# 없으면 설치
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip -y
```

---

## 📁 3단계: 코드 배포

### SSH 접속 후:

```bash
# 1. 애플리케이션 디렉터리로 이동
cd /home/master_xxx/applications/classkit/public_html

# 2. Git 클론 (GitHub에서 레포 URL 복사)
git clone https://github.com/YOUR_USERNAME/classkit.git .

# 3. 백엔드 디렉터리로 이동
cd backend

# 4. 가상환경 생성
python3.11 -m venv venv

# 5. 가상환경 활성화
source venv/bin/activate

# 6. 패키지 설치
pip install -r requirements.txt

# 7. 데이터베이스 초기화
python -c "from app.init_db import create_tables; import asyncio; asyncio.run(create_tables())"
```

---

## 🔄 4단계: Supervisor 설정 (자동 실행)

### 1. Supervisor 설정 파일 생성

SSH에서:

```bash
# Supervisor 설정 디렉터리로 이동
cd /home/master_xxx/applications/classkit/conf/supervisor

# 설정 파일 생성
nano classkit.conf
```

### 2. 아래 내용 붙여넣기:

```ini
[program:classkit]
command=/home/master_xxx/applications/classkit/public_html/backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
directory=/home/master_xxx/applications/classkit/public_html/backend
user=master_xxx
autostart=true
autorestart=true
stderr_logfile=/home/master_xxx/applications/classkit/logs/classkit.err.log
stdout_logfile=/home/master_xxx/applications/classkit/logs/classkit.out.log
environment=PATH="/home/master_xxx/applications/classkit/public_html/backend/venv/bin"
```

**저장**: `Ctrl + O` → `Enter` → `Ctrl + X`

### 3. Supervisor 재시작

```bash
# Supervisor 업데이트
sudo supervisorctl reread
sudo supervisorctl update

# ClassKit 시작
sudo supervisorctl start classkit

# 상태 확인
sudo supervisorctl status classkit
```

---

## 🌐 5단계: Nginx 설정 (도메인 연결)

### 1. Nginx 설정 파일 수정

```bash
cd /home/master_xxx/applications/classkit/conf/nginx
nano classkit.conf
```

### 2. 아래 내용으로 수정:

```nginx
server {
    listen 80;
    server_name classkit.yourdomain.com;  # 실제 도메인으로 변경!

    # 모바일 정적 파일
    location /mobile/ {
        alias /home/master_xxx/applications/classkit/public_html/mobile/;
        try_files $uri $uri/ =404;
    }

    # API & WebSocket
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Nginx 재시작

```bash
sudo nginx -t  # 설정 테스트
sudo systemctl reload nginx
```

---

## 🔒 6단계: SSL 인증서 (HTTPS)

### Cloudways 대시보드에서:

1. **SSL Certificate** → **Let's Encrypt**
2. **Email** 입력
3. **Install Certificate** 클릭

또는 SSH에서:

```bash
sudo certbot --nginx -d classkit.yourdomain.com
```

---

## 🎯 7단계: 위젯 설정

`widget/src/main.js` 파일:

```javascript
// Cloudways 도메인으로 변경
const API_BASE = 'https://classkit.yourdomain.com/api';
const WS_BASE = 'wss://classkit.yourdomain.com';
```

---

## 🔄 업데이트 배포

### SSH로 접속 후:

```bash
cd /home/master_xxx/applications/classkit/public_html

# Git pull
git pull origin main

# 서비스 재시작
sudo supervisorctl restart classkit
```

---

## 🐛 트러블슈팅

### 서비스 상태 확인
```bash
sudo supervisorctl status classkit
```

### 로그 확인
```bash
# 에러 로그
tail -f /home/master_xxx/applications/classkit/logs/classkit.err.log

# 일반 로그
tail -f /home/master_xxx/applications/classkit/logs/classkit.out.log
```

### 서비스 재시작
```bash
sudo supervisorctl restart classkit
```

### Python 프로세스 확인
```bash
ps aux | grep uvicorn
netstat -tlnp | grep 8000
```

---

## 📊 성능 최적화

### 1. Workers 증가 (접속자 많을 때)

Supervisor 설정에서:
```ini
command=/home/.../venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 2. PostgreSQL 사용 (추천)

Cloudways 대시보드:
- **Add Service** → **PostgreSQL**
- 환경 변수 설정:
  ```bash
  export DATABASE_URL="postgresql://user:pass@localhost/classkit"
  ```

---

## ✅ 배포 완료 체크리스트

- [ ] SSH 접속 확인
- [ ] Git 클론 완료
- [ ] Python 가상환경 생성
- [ ] 패키지 설치
- [ ] DB 초기화
- [ ] Supervisor 설정
- [ ] Supervisor 시작 확인
- [ ] Nginx 설정
- [ ] SSL 인증서 설치
- [ ] 도메인 접속 테스트
- [ ] 위젯 URL 업데이트
- [ ] 모바일-위젯 연동 테스트

---

## 🎉 Cloudways 장점 (기존 서버 있을 때)

- ✅ **추가 비용 0원**
- ✅ **Railway보다 빠름**
- ✅ **완전한 제어**
- ✅ **상용급 안정성**
- ✅ **자동 백업**
- ✅ **모니터링 포함**

---

**이미 Cloudways 쓰고 계시면 훨씬 좋습니다!** 🚀

위 가이드 따라서 배포하시면 됩니다!

