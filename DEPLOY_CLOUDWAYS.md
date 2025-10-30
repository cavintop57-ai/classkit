# 🚀 Cloudways 배포 가이드

## 🔑 서버 정보
```
SSH: master_xhbedwcksw@167.172.70.163
비밀번호: Q1w2e3r4!@
GitHub: https://github.com/cavintop57-ai/classkit.git
서버 IP: 167.172.70.163
```

---

## ⚡ 빠른 배포 (3분)

### 1️⃣ GitHub 레포 확인
✅ 이미 생성됨: https://github.com/cavintop57-ai/classkit

---

### 2️⃣ 로컬에서 배치파일 실행

```cmd
deploy.bat
```

자동으로:
- GitHub 푸시: https://github.com/cavintop57-ai/classkit.git
- SSH 배포 명령어 클립보드 복사

---

### 3️⃣ 배포 완료!

자동으로:
1. ✅ GitHub 푸시
2. ✅ SSH 접속
3. ✅ 서버 배포
4. ✅ 서비스 시작

---

## 🌐 접속 URL

| 서비스 | URL |
|--------|-----|
| **모바일 앱** | https://phpstack-1293143-5917982.cloudwaysapps.com |
| **API** | https://phpstack-1293143-5917982.cloudwaysapps.com/api |
| **Health Check** | https://phpstack-1293143-5917982.cloudwaysapps.com/health |

---

## 🎯 위젯 설정

`widget/src/main.js` 파일 (10-11번째 줄):

```javascript
const API_BASE = 'https://phpstack-1293143-5917982.cloudwaysapps.com/api';
const WS_BASE = 'wss://phpstack-1293143-5917982.cloudwaysapps.com';
```

위젯 실행:
```bash
cd widget
npm run dev
```

---

## 🔄 업데이트

코드 수정 후:
```cmd
update.bat
```

자동으로 GitHub 푸시 → 서버 업데이트 → 재시작!

---

## 📊 서버 관리

### 로그 확인:
```bash
ssh master_xhbedwcksw@167.172.70.163
tail -f ~/classkit.log
```

### 서비스 재시작:
```bash
pkill -f uvicorn
cd ~/classkit/backend && source venv/bin/activate && nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > ~/classkit.log 2>&1 &
```

---

## ⚙️ 환경변수 설정

QR 코드가 올바른 도메인을 사용하려면 환경변수를 설정하세요:

```bash
# SSH 접속
ssh master_xhbedwcksw@167.172.70.163

# 환경변수 설정
export DOMAIN_URL=https://phpstack-1293143-5917982.cloudwaysapps.com

# 서버 재시작
pkill -f uvicorn
cd ~/classkit/backend && source venv/bin/activate && nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > ~/classkit.log 2>&1 &
```

**또는** 서버 시작 스크립트에 추가:
```bash
cd ~/classkit/backend
source venv/bin/activate
export DOMAIN_URL=https://phpstack-1293143-5917982.cloudwaysapps.com
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > ~/classkit.log 2>&1 &
```

---

## 🐛 문제 해결

### Health check 실패:
```bash
# 프로세스 확인
ps aux | grep uvicorn

# 로그 확인
tail -100 ~/classkit.log

# 포트 확인
netstat -tlnp | grep 8000
```

### Git clone 실패 (Private 레포):
→ Public으로 변경하거나
→ `deploy.bat` 실행 시 GitHub Username/Token 입력

### QR 코드가 잘못된 도메인 표시:
→ 환경변수 `DOMAIN_URL` 설정 확인
→ 서버 재시작 후 테스트

---

**간단하죠? `deploy.bat` 실행하세요!** 🚀

