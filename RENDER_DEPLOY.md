# 🚀 Render.com 배포 가이드

## 📋 준비사항

1. **GitHub 레포지토리**: https://github.com/cavintop57-ai/classkit
2. **Render.com 계정**: https://render.com (무료)

---

## 🎯 배포 순서

### 1️⃣ **백엔드 배포 (FastAPI)**

1. **Render.com 로그인** → **Dashboard**

2. **"New +" 클릭** → **"Web Service"** 선택

3. **GitHub 연결**:
   - "Connect GitHub" 클릭
   - `cavintop57-ai/classkit` 레포지토리 선택

4. **설정 입력**:
   ```
   Name: classkit-backend
   Region: Singapore (가장 가까운 지역)
   Branch: main
   Root Directory: backend
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

5. **Plan 선택**: **Free** (무료)

6. **Environment Variables 추가**:
   ```
   OPENAI_API_KEY = (여기에 OpenAI API 키 입력)
   ```

7. **"Create Web Service"** 클릭

8. **배포 완료 대기** (5-10분)
   - 로그에서 "Application startup complete" 확인
   - URL 복사 (예: `https://classkit-backend.onrender.com`)

---

### 2️⃣ **프론트엔드 배포 (Static Site)**

1. **Dashboard** → **"New +" 클릭** → **"Static Site"** 선택

2. **GitHub 연결**: 같은 레포지토리 선택

3. **설정 입력**:
   ```
   Name: classkit-frontend
   Branch: main
   Root Directory: widget
   Build Command: npm install && npm run build
   Publish Directory: widget/dist
   ```

4. **Environment Variables 추가**:
   ```
   VITE_API_URL = https://classkit-backend.onrender.com/api
   VITE_WS_URL = wss://classkit-backend.onrender.com
   ```

5. **"Create Static Site"** 클릭

6. **배포 완료 대기** (3-5분)
   - URL 복사 (예: `https://classkit-frontend.onrender.com`)

---

### 3️⃣ **백엔드 환경변수 업데이트**

백엔드 배포 완료 후:

1. **Backend Service** → **Environment** 탭

2. **환경변수 추가**:
   ```
   DOMAIN_URL = https://classkit-frontend.onrender.com
   ```

3. **"Save Changes"** → 자동 재배포

---

## ✅ **배포 확인**

1. **프론트엔드 접속**:
   - `https://classkit-frontend.onrender.com`
   - 로그인 페이지 확인

2. **백엔드 API 테스트**:
   ```bash
   curl https://classkit-backend.onrender.com/api/sessions
   ```

3. **WebSocket 테스트**:
   - 위젯 로그인 → QR 코드 생성
   - 학생 페이지 접속 → 메시지 전송
   - 교사 위젯에서 메시지 수신 확인

---

## 🔧 **문제 해결**

### 백엔드 500 에러

**로그 확인**:
- Render Dashboard → Backend Service → Logs
- 데이터베이스 연결 에러 확인

**해결**:
```bash
# Render.com이 자동으로 PostgreSQL 제공
# DATABASE_URL 환경변수 자동 생성됨
```

### 프론트엔드 API 연결 실패

**원인**: CORS 에러 또는 API URL 잘못됨

**해결**:
1. 백엔드 로그에서 `allow_origins` 확인
2. 프론트엔드 환경변수 `VITE_API_URL` 확인

### WebSocket 연결 실패

**원인**: Render.com 무료 플랜 제약 (15분 비활성 시 sleep)

**해결**:
- Render.com의 무료 플랜은 15분 비활성 시 sleep 모드
- 첫 요청 시 재시작 (30초 소요)
- 또는 유료 플랜 사용 ($7/월)

---

## 💰 **비용**

- **Free Plan**: 무료
  - 750시간/월 실행
  - 15분 비활성 시 sleep
  - 512MB RAM
  - **WebSocket 지원 ✅**

- **Starter Plan**: $7/월
  - 항상 실행
  - 1GB RAM
  - **추천** (실제 운영용)

---

## 🔄 **자동 배포**

GitHub에 푸시하면 **자동으로 Render.com에 배포**됩니다!

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render가 자동으로 감지하고 재배포합니다.

---

## 📱 **모바일 접속**

학생들은 다음 URL로 접속:
```
https://classkit-frontend.onrender.com/mobile/?code=S61101
```

QR 코드가 자동으로 위 URL을 생성합니다.

---

## 🎉 **완료!**

이제 전 세계 어디서나 접속 가능합니다! 🌍

