# ⚡ Cloudways 초간단 배포 (10분 완성)

## 🔑 접속 정보
```
서버 IP: 167.172.70.163
사용자: master_xhbedwcksw
비밀번호: QVvvNXGAaSd9
```

---

## 🚀 배포 방법 (선택)

### 방법 A: 자동 스크립트 (가장 쉬움! 추천)

#### 1. GitHub 레포 생성 & 푸시
```bash
# 로컬에서:
git remote add origin https://github.com/YOUR_USERNAME/classkit.git
git branch -M main
git push -u origin main
```

#### 2. 스크립트 업로드 & 실행
```bash
# SSH 접속
ssh master_xhbedwcksw@167.172.70.163
# 비밀번호: QVvvNXGAaSd9

# 스크립트 복사 (로컬에서 cloudways_deploy.sh 내용 복사)
nano deploy.sh
# (붙여넣기 → Ctrl+O → Enter → Ctrl+X)

# 실행 권한 부여
chmod +x deploy.sh

# GitHub URL 수정
nano deploy.sh
# GITHUB_REPO 줄 수정 → Ctrl+O → Enter → Ctrl+X

# 실행!
bash deploy.sh
```

---

### 방법 B: 수동 명령어 (직접 제어)

```bash
# 1. SSH 접속
ssh master_xhbedwcksw@167.172.70.163

# 2. 디렉터리 생성
mkdir -p ~/applications/classkit/{public_html,logs}
cd ~/applications/classkit/public_html

# 3. Git 클론 (YOUR_USERNAME 변경!)
git clone https://github.com/YOUR_USERNAME/classkit.git .

# 4. 가상환경 & 패키지
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 5. DB 초기화
python -c "from app.init_db import create_tables; import asyncio; asyncio.run(create_tables())"

# 6. Supervisor 설정
sudo nano /etc/supervisor/conf.d/classkit.conf
```

**붙여넣기:**
```ini
[program:classkit]
command=/home/master_xhbedwcksw/applications/classkit/public_html/backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
directory=/home/master_xhbedwcksw/applications/classkit/public_html/backend
user=master_xhbedwcksw
autostart=true
autorestart=true
stderr_logfile=/home/master_xhbedwcksw/applications/classkit/logs/classkit.err.log
stdout_logfile=/home/master_xhbedwcksw/applications/classkit/logs/classkit.out.log
environment=PATH="/home/master_xhbedwcksw/applications/classkit/public_html/backend/venv/bin"
```

**저장 후:**
```bash
# 7. Supervisor 재시작
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start classkit

# 8. 상태 확인
sudo supervisorctl status classkit
```

---

## 🌐 Nginx 설정 (도메인 있을 때)

### Cloudways 대시보드에서:

1. **Applications** → **ClassKit** → **Access Details**
2. **Application URL** 확인 또는 커스텀 도메인 설정

### 또는 직접 설정:

```bash
nano ~/applications/classkit/conf/nginx/classkit.conf
```

**내용:**
```nginx
server {
    listen 80;
    server_name 167.172.70.163;  # 또는 실제 도메인

    location /mobile/ {
        alias /home/master_xxx/applications/classkit/public_html/mobile/;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 SSL 설정 (도메인 있을 때)

### Cloudways 대시보드:
**SSL Certificate** → **Let's Encrypt** → **Install**

---

## ✅ 테스트

### 1. Health Check
```bash
curl http://167.172.70.163:8000/health
```

예상 응답:
```json
{
  "status": "healthy",
  "version": "0.4.0",
  "database": "connected"
}
```

### 2. 모바일 접속
브라우저: `http://167.172.70.163:8000`

### 3. 위젯 설정

`widget/src/main.js`:
```javascript
const API_BASE = 'http://167.172.70.163:8000/api';
const WS_BASE = 'ws://167.172.70.163:8000';
```

**위젯 실행:**
```bash
cd widget
npm run dev
```

---

## 🔄 업데이트

```bash
ssh master_xhbedwcksw@167.172.70.163
cd ~/applications/classkit/public_html
git pull origin main
sudo supervisorctl restart classkit
```

---

## 📊 모니터링

### 로그 실시간 확인
```bash
# 에러
tail -f ~/applications/classkit/logs/classkit.err.log

# 일반
tail -f ~/applications/classkit/logs/classkit.out.log
```

### 서비스 상태
```bash
sudo supervisorctl status classkit
```

### 서비스 관리
```bash
sudo supervisorctl stop classkit    # 중지
sudo supervisorctl start classkit   # 시작
sudo supervisorctl restart classkit # 재시작
```

---

**Cloudways가 훨씬 좋은 선택입니다!** 🎉

바로 시작하시겠어요?

