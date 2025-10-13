# ⚡ 지금 바로 배포! (3분)

## 🔑 서버 정보
```
SSH: master_xhbedwcksw@167.172.70.163
비밀번호: QVvvNXGAaSd9
```

---

## 🚀 가장 쉬운 방법 (타임아웃 걱정 없음!)

### 1️⃣ GitHub 레포 생성

https://github.com/new
- 이름: `classkit`
- Public 선택
- **Create repository**

URL 복사: `https://github.com/YOUR_USERNAME/classkit.git`

---

### 2️⃣ 배치파일 실행

```cmd
quick_deploy.bat
```

**실행하면:**
1. GitHub URL 입력받음
2. 자동으로 GitHub에 푸시
3. **원라이너 명령어**를 클립보드에 복사
4. SSH 접속 안내

---

### 3️⃣ SSH 접속 & 배포

#### SSH 접속:
```bash
ssh master_xhbedwcksw@167.172.70.163
```
비밀번호: `QVvvNXGAaSd9`

#### 배포 명령어 붙여넣기:

**클립보드에 복사된 명령어를 붙여넣기:**
- **PowerShell/CMD**: `마우스 우클릭` 또는 `Shift + Insert`
- **Windows Terminal**: `Ctrl + Shift + V` 또는 `우클릭`
- **PuTTY**: `마우스 우클릭` (자동 붙여넣기)

**또는 수동으로 `ONELINER_DEPLOY.txt` 파일 열어서 복사**

---

## 🎯 원라이너 명령어 (전체 복사!)

```bash
cd ~ && mkdir -p classkit && cd classkit && git clone https://github.com/YOUR_USERNAME/classkit.git . && cd backend && python3.11 -m venv venv && source venv/bin/activate && pip install -q -r requirements.txt && python -c "from app.init_db import create_tables; import asyncio; asyncio.run(create_tables())" && nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > ~/classkit.log 2>&1 &
```

**(YOUR_USERNAME을 실제 GitHub 아이디로 변경!)**

---

## ✅ 배포 확인

SSH에서:
```bash
# 프로세스 확인
ps aux | grep uvicorn

# Health check
curl http://localhost:8000/health
```

예상 결과:
```json
{"status":"healthy","version":"0.4.0","database":"connected"}
```

---

## 🌐 접속 URL

| 서비스 | URL |
|--------|-----|
| 모바일 앱 | http://167.172.70.163:8000 |
| API | http://167.172.70.163:8000/api |
| Health | http://167.172.70.163:8000/health |

---

## 🎯 위젯 설정

`widget/src/main.js` (10-11번째 줄):

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

## 🔄 업데이트 (나중에)

SSH 접속 후:
```bash
cd ~/classkit && git pull && pkill -f uvicorn && cd backend && source venv/bin/activate && nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > ~/classkit.log 2>&1 &
```

---

## 🐛 문제 해결

### 타임아웃 계속 발생:
```bash
# Screen 사용 (세션 유지)
screen -S classkit
# (명령어 실행)
# Ctrl+A, D (detach)
```

### 로그 확인:
```bash
tail -f ~/classkit.log
```

### 서비스 중지:
```bash
pkill -f uvicorn
```

---

## 📋 배포 파일 정리

**추천 순서:**
1. ⭐ `quick_deploy.bat` - 원클릭 배포
2. 📄 `ONELINER_DEPLOY.txt` - 원라이너 명령어
3. 📄 `manual_deploy_steps.txt` - 단계별 명령어

**지금 바로:**
```cmd
quick_deploy.bat
```

실행하세요! 🚀

