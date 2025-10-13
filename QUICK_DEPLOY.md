# ⚡ Railway 빠른 배포 (5분 완성)

## 🎯 단계별 진행

### ✅ 1단계: GitHub 레포 생성 (1분)

1. https://github.com/new 접속
2. Repository name: `classkit`
3. **Create repository** 클릭
4. 생성된 URL 복사 (예: `https://github.com/YOUR_USERNAME/classkit.git`)

---

### ✅ 2단계: 코드 푸시 (1분)

아래 명령어를 터미널에서 실행:

```bash
# Git 초기 설정 (처음 한 번만)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# 파일 추가
git add .

# 커밋
git commit -m "🚀 Initial commit"

# GitHub에 푸시 (YOUR_USERNAME을 실제 아이디로 변경!)
git remote add origin https://github.com/YOUR_USERNAME/classkit.git
git branch -M main
git push -u origin main
```

---

### ✅ 3단계: Railway 배포 (2분)

1. https://railway.app 접속 후 로그인
2. **Dashboard** → **New Project**
3. **Deploy from GitHub repo** 선택
4. `classkit` 레포지토리 선택
5. **Deploy Now** 클릭

**환경 변수 설정 (자동으로 됨)**:
- PORT: Railway가 자동 설정
- PYTHON_VERSION: `runtime.txt`에서 자동 감지

---

### ✅ 4단계: URL 확인 (1분)

1. **Settings** → **Domains** 클릭
2. **Generate Domain** 클릭
3. 생성된 URL 복사 (예: `classkit-production.up.railway.app`)

---

### ✅ 5단계: 위젯 연결

`widget/src/main.js` 파일에서 아래 부분 찾아서 수정:

```javascript
// 변경 전:
const API_BASE = 'http://localhost:8000/api';
const WS_BASE = 'ws://localhost:8000';

// 변경 후 (YOUR_URL을 Railway URL로 변경):
const API_BASE = 'https://YOUR_URL/api';
const WS_BASE = 'wss://YOUR_URL';
```

**예시**:
```javascript
const API_BASE = 'https://classkit-production.up.railway.app/api';
const WS_BASE = 'wss://classkit-production.up.railway.app';
```

---

## 🎉 완료!

### 테스트:

1. **모바일 앱**: `https://YOUR_URL` 접속
2. **위젯 실행**:
   ```bash
   cd widget
   npm run dev
   ```
3. **세션 생성** → QR 코드 확인
4. **모바일에서 참여** → 메시지 전송 테스트

---

## 🔄 업데이트하려면

코드 수정 후:
```bash
git add .
git commit -m "✨ 기능 추가"
git push
```

Railway가 자동으로 재배포!

---

## 🆘 문제 발생 시

### 빌드 실패
Railway **Deployments** → 실패한 배포 클릭 → 로그 확인

### 자주 발생하는 문제:
1. **requirements.txt 없음** → 이미 생성됨 ✅
2. **PORT 환경 변수** → Railway가 자동 설정 ✅
3. **Python 버전** → `runtime.txt`에 명시됨 ✅

### 데이터베이스 오류
Railway 콘솔:
```bash
cd backend
python -c "from app.init_db import create_tables; import asyncio; asyncio.run(create_tables())"
```

---

**모든 준비 완료! 🚀**

`DEPLOY.md`에서 더 자세한 정보를 확인하세요.

