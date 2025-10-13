# 🎉 ClassKit Railway 배포 시작!

## ✅ 현재 상태
- [x] Git 저장소 초기화 완료
- [x] 모든 파일 커밋 완료 (434개 파일)
- [x] Railway 배포 설정 파일 준비 완료
  - `backend/requirements.txt`
  - `backend/Procfile`
  - `backend/runtime.txt`
  - `railway.json`
  - `.gitignore`

---

## 🚀 다음 3단계만 하면 끝!

### 1️⃣ GitHub 레포 생성 (1분)

1. https://github.com/new 접속
2. Repository name: **`classkit`**
3. **Create repository** 클릭
4. 생성된 URL 복사 예: `https://github.com/YOUR_USERNAME/classkit.git`

---

### 2️⃣ GitHub에 푸시 (1분)

아래 명령어를 **하나씩** 터미널에 입력:

```bash
# 1. GitHub 레포 연결 (YOUR_USERNAME을 실제 아이디로 변경!)
git remote add origin https://github.com/YOUR_USERNAME/classkit.git

# 2. 브랜치 이름 변경
git branch -M main

# 3. 푸시!
git push -u origin main
```

---

### 3️⃣ Railway 배포 (2분)

1. https://railway.app 접속 → 로그인 (GitHub 계정 사용)
2. **Dashboard** → **New Project** 클릭
3. **Deploy from GitHub repo** 선택
4. **`classkit`** 레포지토리 클릭
5. **Deploy Now** 클릭

**대시보드에서 확인**:
- Buildlogs: 빌드 진행 상황
- Deploy Logs: 서버 시작 로그
- Settings → Domains → **Generate Domain** 클릭

---

## 🌐 배포 완료 후

### Railway URL 확인
예시: `classkit-production.up.railway.app`

### 위젯에 URL 설정

`widget/src/main.js` 파일 열기:

**10-11번째 줄을 찾아서 수정:**

```javascript
// 변경 전:
const API_BASE = 'http://localhost:8000/api';
const WS_BASE = 'ws://localhost:8000';

// 변경 후 (YOUR_URL을 실제 Railway URL로!):
const API_BASE = 'https://classkit-production.up.railway.app/api';
const WS_BASE = 'wss://classkit-production.up.railway.app';
```

### 위젯 실행

```bash
cd widget
npm run dev
```

브라우저: http://localhost:5173

---

## 🎯 테스트

1. **위젯에서**: 세션 생성 → QR코드 확인
2. **모바일로**: Railway URL 접속 → 코드 입력
3. **문제 풀고**: 메시지 전송
4. **위젯에서**: 메시지 확인! ✅

---

## 📚 더 자세한 정보

- **빠른 가이드**: `QUICK_DEPLOY.md`
- **전체 가이드**: `DEPLOY.md`
- **문제 해결**: `DEPLOY.md` 트러블슈팅 섹션

---

## 🆘 도움말

### 빌드 실패 시
Railway **Deployments** → 실패한 배포 클릭 → Build Logs 확인

### 흔한 오류들
| 오류 | 해결 |
|------|------|
| ModuleNotFoundError | `requirements.txt` 확인 (✅ 이미 생성됨) |
| PORT 오류 | Railway가 자동 설정 (✅ 설정됨) |
| DB 오류 | 자동 초기화됨 (✅ `startup_event`) |

---

**배포 성공을 기원합니다! 🎉**

문제 생기면 언제든 물어보세요!

