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
| **모바일 앱** | http://167.172.70.163:8000 |
| **API** | http://167.172.70.163:8000/api |
| **Health Check** | http://167.172.70.163:8000/health |

---

## 🎯 위젯 설정

`widget/src/main.js` 파일 (10-11번째 줄):

```javascript
const API_BASE = 'http://167.172.70.163:8000/api';
const WS_BASE = 'ws://167.172.70.163:8000';
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

---

**간단하죠? `deploy.bat` 실행하세요!** 🚀

