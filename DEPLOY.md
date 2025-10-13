# 🚀 ClassKit Railway 배포 가이드

## 📋 준비사항
- ✅ Railway 계정 (https://railway.app)
- ✅ GitHub 계정
- ✅ Git 설치

---

## 🔧 1단계: GitHub 레포지토리 생성

### 1. GitHub에서 새 레포지토리 만들기
```
이름: classkit
설명: 초등학교 교실용 전자칠판 위젯
Public 또는 Private 선택
```

### 2. 로컬에서 Git 초기화 및 푸시
```bash
# Git 초기화 (아직 안했다면)
git init

# 모든 파일 추가
git add .

# 커밋
git commit -m "🎉 Initial commit: ClassKit v0.4.0"

# GitHub 레포와 연결 (YOUR_USERNAME을 실제 GitHub 아이디로 변경)
git remote add origin https://github.com/YOUR_USERNAME/classkit.git

# 푸시
git branch -M main
git push -u origin main
```

---

## 🚂 2단계: Railway 배포

### 1. Railway 프로젝트 생성

1. https://railway.app 접속
2. **Dashboard** → **New Project** 클릭
3. **Deploy from GitHub repo** 선택
4. `classkit` 레포지토리 선택

### 2. 환경 변수 설정

Railway 프로젝트 → **Variables** 탭에서 추가:

```
PORT=8000
PYTHON_VERSION=3.11.6
DATABASE_URL=sqlite:///./classkit.db
```

### 3. 배포 확인

- Railway가 자동으로 빌드 시작
- **Deployments** 탭에서 진행 상황 확인
- 빌드 완료 후 **Settings** → **Domains**에서 URL 확인
  - 예: `classkit-production.up.railway.app`

---

## 🌐 3단계: 위젯 설정

### 위젯에서 백엔드 URL 설정

`widget/src/main.js` 파일 수정:

```javascript
// 배포된 백엔드 URL로 변경
const API_BASE = 'https://YOUR-APP.up.railway.app/api';
const WS_BASE = 'wss://YOUR-APP.up.railway.app';
```

예시:
```javascript
const API_BASE = 'https://classkit-production.up.railway.app/api';
const WS_BASE = 'wss://classkit-production.up.railway.app';
```

### 위젯 로컬 실행
```bash
cd widget
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

---

## 📱 4단계: 모바일 앱 접속

배포된 URL로 바로 접속 가능:
```
https://YOUR-APP.up.railway.app
```

또는 세션 코드로:
```
https://YOUR-APP.up.railway.app/A12345
```

---

## 🔄 업데이트 배포

코드 수정 후:
```bash
git add .
git commit -m "✨ 기능 추가/수정 내용"
git push
```

Railway가 자동으로 감지하고 재배포합니다!

---

## 🐛 트러블슈팅

### 빌드 실패 시
1. Railway 로그 확인: **Deployments** → 실패한 배포 클릭
2. `requirements.txt` 확인
3. Python 버전 확인

### 데이터베이스 초기화
Railway 콘솔에서:
```bash
cd backend
python -c "from app.init_db import create_tables; import asyncio; asyncio.run(create_tables())"
```

### WebSocket 연결 실패
- CORS 설정 확인
- WSS (보안 WebSocket) 사용 확인
- Railway 도메인이 HTTPS인지 확인

---

## 📊 Railway 무료 티어 제한

- ✅ **500시간/월** 실행 시간
- ✅ **512MB RAM**
- ✅ **1GB 디스크**
- ✅ **무제한 대역폭**

**💡 팁**: 학교 수업 시간만 사용하면 충분합니다!

---

## 🎯 다음 단계 (선택)

### PostgreSQL 추가 (추천)
Railway에서 **New** → **Database** → **PostgreSQL**

환경 변수 자동 설정됨:
```
DATABASE_URL=postgresql://...
```

`backend/app/database.py` 수정:
```python
import os
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./classkit.db")
```

### 커스텀 도메인
Railway **Settings** → **Domains** → **Custom Domain**

---

## ✅ 배포 완료 체크리스트

- [ ] GitHub 레포지토리 생성 및 푸시
- [ ] Railway 프로젝트 생성
- [ ] 환경 변수 설정
- [ ] 배포 성공 확인
- [ ] 위젯에서 백엔드 URL 업데이트
- [ ] 모바일 앱 접속 테스트
- [ ] 위젯-모바일 연동 테스트
- [ ] WebSocket 통신 테스트

---

## 🆘 도움이 필요하면

Railway 로그 확인:
```
Railway Dashboard → Deployments → Build Logs
Railway Dashboard → Deployments → Deploy Logs
```

**즐거운 수업 되세요! 🎉**

