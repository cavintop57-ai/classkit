# ⚡ Cloudways 3분 배포

## 🎯 준비물
- ✅ Cloudways 서버: `167.172.70.163`
- ✅ 접속 정보 저장됨
- ✅ GitHub 계정

---

## 🚀 배포 순서

### 1️⃣ GitHub 레포 생성 (1분)

1. https://github.com/new
2. Repository name: **`classkit`**
3. **Public** 선택 (또는 Private + Token)
4. **Create repository**
5. URL 복사: `https://github.com/YOUR_USERNAME/classkit.git`

---

### 2️⃣ 배치파일 실행 (1분)

#### 💡 **초간단 방법 (추천):**

```cmd
ssh_deploy_cloudways.bat
```

**실행하면:**
1. GitHub URL 입력
2. 배포 스크립트 자동 생성
3. **클립보드에 자동 복사됨!** ✅

#### 또는 수동:

```cmd
push_to_github.bat
```

---

### 3️⃣ SSH 배포 (1분)

#### A. PuTTY 사용:

1. **Host**: `167.172.70.163`
2. **Port**: `22`
3. **Username**: `master_xxx`
4. **Password**: `QVvvNXGAaSd9`
5. 접속 후 → **마우스 우클릭** (자동 붙여넣기)

#### B. PowerShell/CMD:

```bash
ssh master_xxx@167.172.70.163
```
비밀번호 입력 후 → **마우스 우클릭** (붙여넣기)

---

## ✅ 배포 완료 후

### 위젯 설정

`widget/src/main.js` (10-11번째 줄):

```javascript
// 변경 전:
const API_BASE = 'http://localhost:8000/api';
const WS_BASE = 'ws://localhost:8000';

// 변경 후:
const API_BASE = 'http://167.172.70.163:8000/api';
const WS_BASE = 'ws://167.172.70.163:8000';
```

### 위젯 실행:

```bash
cd widget
npm run dev
```

브라우저: http://localhost:5173

---

## 🌐 접속 URL

| 서비스 | URL |
|--------|-----|
| **모바일 앱** | http://167.172.70.163:8000 |
| **API** | http://167.172.70.163:8000/api |
| **Health** | http://167.172.70.163:8000/health |
| **위젯** | http://localhost:5173 (로컬) |

---

## 🔒 도메인 & SSL (선택)

### Cloudways 대시보드:

1. **Domain Management** → 도메인 추가
2. **SSL Certificate** → **Let's Encrypt** 활성화

**그 후:**
```javascript
// widget/src/main.js
const API_BASE = 'https://classkit.yourdomain.com/api';
const WS_BASE = 'wss://classkit.yourdomain.com';
```

---

## 🔄 업데이트

### 로컬에서 수정 후:

```bash
git add .
git commit -m "✨ 기능 추가"
git push
```

### SSH에서:

```bash
ssh master_xxx@167.172.70.163
cd ~/applications/classkit/public_html
git pull origin main
sudo supervisorctl restart classkit
```

---

## 📊 모니터링

### SSH 접속 후:

```bash
# 서비스 상태
sudo supervisorctl status classkit

# 에러 로그
tail -f ~/applications/classkit/logs/classkit.err.log

# 일반 로그
tail -f ~/applications/classkit/logs/classkit.out.log

# Health check
curl http://localhost:8000/health
```

---

## 🐛 문제 해결

### 서비스 시작 안됨:
```bash
sudo supervisorctl restart classkit
sudo supervisorctl tail -f classkit stderr
```

### 포트 충돌:
```bash
sudo netstat -tlnp | grep 8000
sudo kill -9 [PID]
sudo supervisorctl restart classkit
```

### Python 오류:
```bash
cd ~/applications/classkit/public_html/backend
source venv/bin/activate
python -c "from app.main import app; print('OK')"
```

---

## 🎉 완료!

**배포 파일들:**
- ✅ `ssh_deploy_cloudways.bat` - 원클릭 배포
- ✅ `push_to_github.bat` - GitHub 푸시만
- ✅ `deploy_cloudways.bat` - 상세 배포
- ✅ `DEPLOY_CLOUDWAYS.md` - 전체 가이드
- ✅ `CLOUDWAYS_QUICK_START.md` - 빠른 가이드

**지금 바로 시작:**
```cmd
ssh_deploy_cloudways.bat
```

**즐거운 배포 되세요! 🚀**

