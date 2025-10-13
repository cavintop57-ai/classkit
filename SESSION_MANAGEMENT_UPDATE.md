# 🔧 세션 관리 및 도메인 주소 개선 완료

## ✅ 해결된 문제

### 1️⃣ 도메인 주소 문제
**AS-IS**: 첫 페이지의 학생 접속 주소에 `localhost`로 시작하는 주소가 표시됨  
**TO-BE**: 실제 도메인 주소(`https://phpstack-1293143-5917982.cloudwaysapps.com`)가 자동으로 표시됨

### 2️⃣ 세션 지속성 문제
**AS-IS**: 프로그램에 접속할 때마다 새로운 세션 코드가 임의로 생성됨  
**TO-BE**: 같은 브라우저에서 접속하면 기존 세션이 유지되고 재사용됨 (로그인 개념 구현)

---

## 🔄 주요 변경사항

### 1. Backend (Python/FastAPI)

#### `backend/app/routes/sessions.py`
- 환경변수 `DOMAIN_URL`에서 도메인 주소를 동적으로 가져옴
- 로컬 개발: `http://localhost:8000`
- 프로덕션: `https://phpstack-1293143-5917982.cloudwaysapps.com`

```python
# 환경변수에서 도메인 가져오기 (기본값: localhost)
domain = os.getenv('DOMAIN_URL', 'http://localhost:8000')

return SessionResponse(
    # ...
    qr_url=f"{domain}/{session.code}"
)
```

### 2. Widget (교사용, JavaScript)

#### `widget/src/main.js`
- **세션 지속성 구현**:
  - `localStorage`에 세션 정보 저장
  - 저장된 세션 검증 후 재사용
  - 만료되었거나 없으면 새로 생성

```javascript
// 새로운 함수들:
- loadSession()      // localStorage에서 세션 불러오기
- saveSession()      // localStorage에 세션 저장
- validateSession()  // 세션 유효성 검증 (API 호출)
- initSession()      // 세션 초기화 (재사용 또는 새로 생성)
```

#### `widget/src/websocket.js`
- WebSocket URL을 동적으로 설정 (하드코딩 제거)
- 생성자에 `wsBase` 파라미터 추가

```javascript
constructor(sessionCode, avatarRenderer, wsBase = 'ws://localhost:8000')
```

### 3. Mobile (학생용 PWA, JavaScript)

#### `mobile/app.js`
- **자동 도메인 감지**:
  - 로컬 개발: `http://localhost:8000/api`
  - 프로덕션: 현재 도메인 자동 사용

```javascript
const getApiBase = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }
  
  return `${window.location.protocol}//${window.location.host}/api`;
};
```

- **WebSocket도 동적 설정**:
```javascript
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsHost = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
const ws = new WebSocket(`${wsProtocol}//${wsHost}/ws/${sessionCode}`);
```

### 4. Deployment (배포 스크립트)

#### `deploy.bat`
- 배포 시 환경변수 `DOMAIN_URL` 자동 설정

```bash
export DOMAIN_URL='https://phpstack-1293143-5917982.cloudwaysapps.com'
```

---

## 🚀 사용 방법

### 1. 로컬 개발
```bash
# 위젯 실행
cd widget
npm run dev

# 백엔드 실행
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

- 위젯: http://localhost:5173
- 모바일: http://localhost:8000/X12345 (세션 코드)

### 2. 프로덕션 배포
```bash
# 자동 배포 (환경변수 포함)
deploy.bat
```

배포 후:
- 위젯: https://phpstack-1293143-5917982.cloudwaysapps.com
- 모바일: https://phpstack-1293143-5917982.cloudwaysapps.com/X12345

---

## 📱 동작 방식

### 세션 지속성 흐름:

1. **첫 접속**:
   ```
   위젯 실행 → initSession() 호출
   → localStorage 확인 (없음)
   → 새 세션 생성 (예: X12345)
   → localStorage에 저장
   → QR 코드 표시: https://phpstack-1293143-5917982.cloudwaysapps.com/X12345
   ```

2. **재접속** (브라우저 닫았다가 다시 열기):
   ```
   위젯 실행 → initSession() 호출
   → localStorage에서 세션 발견 (X12345)
   → API로 세션 유효성 검증
   → 유효하면 재사용 ✅
   → 같은 코드(X12345) 계속 사용
   ```

3. **세션 만료**:
   ```
   위젯 실행 → initSession() 호출
   → localStorage에서 세션 발견 (X12345)
   → API로 세션 유효성 검증
   → 만료됨 (4시간 경과) ❌
   → localStorage 삭제
   → 새 세션 생성 (예: Y67890)
   ```

### 도메인 자동 감지:

1. **모바일 앱이 도메인 감지**:
   ```javascript
   // localhost에서 접속
   API: http://localhost:8000/api
   WS:  ws://localhost:8000/ws/X12345
   
   // 프로덕션에서 접속
   API: https://phpstack-1293143-5917982.cloudwaysapps.com/api
   WS:  wss://phpstack-1293143-5917982.cloudwaysapps.com/ws/X12345
   ```

2. **백엔드가 환경변수 사용**:
   ```python
   # 로컬 개발
   DOMAIN_URL = "http://localhost:8000"
   QR URL = "http://localhost:8000/X12345"
   
   # 프로덕션 (deploy.bat가 자동 설정)
   DOMAIN_URL = "https://phpstack-1293143-5917982.cloudwaysapps.com"
   QR URL = "https://phpstack-1293143-5917982.cloudwaysapps.com/X12345"
   ```

---

## ✨ 기대 효과

### 1. **세션 지속성**
- ✅ 교사가 위젯을 닫았다가 다시 열어도 **같은 세션 코드 유지**
- ✅ 학생들이 QR 코드를 다시 스캔할 필요 없음
- ✅ 수업 중 컴퓨터 재시작해도 4시간 이내면 세션 유지

### 2. **도메인 자동 관리**
- ✅ 로컬/프로덕션 환경에서 자동으로 올바른 주소 사용
- ✅ QR 코드에 실제 접속 가능한 주소 표시
- ✅ 환경변수로 중앙 관리 (유지보수 용이)

### 3. **사용자 경험 개선**
- ✅ 교사: 한 번만 세션 생성하면 계속 사용 가능
- ✅ 학생: 항상 올바른 주소로 접속
- ✅ 관리자: 환경별 설정 자동화

---

## 🧪 테스트 방법

### 1. 세션 지속성 테스트
```bash
# 1. 위젯 실행
cd widget && npm run dev

# 2. 브라우저 개발자 도구 > Application > Local Storage
#    → currentSession 확인 (세션 코드 저장됨)

# 3. 브라우저 탭 닫기

# 4. 다시 위젯 열기
#    → 같은 세션 코드 표시됨 ✅

# 5. localStorage 삭제 (수동)
#    → 새로운 세션 생성됨 ✅
```

### 2. 도메인 자동 감지 테스트
```bash
# 로컬 테스트
1. http://localhost:8000/X12345 접속
2. 개발자 도구 콘솔 확인
   → "🌐 API Base: http://localhost:8000/api" 출력됨 ✅

# 프로덕션 테스트 (배포 후)
1. https://phpstack-1293143-5917982.cloudwaysapps.com/X12345 접속
2. 개발자 도구 콘솔 확인
   → "🌐 API Base: https://phpstack-1293143-5917982.cloudwaysapps.com/api" 출력됨 ✅
```

---

## 📋 체크리스트

배포 전 확인사항:
- [x] Backend: 환경변수 DOMAIN_URL 사용
- [x] Widget: 세션 localStorage 저장/불러오기
- [x] Widget: WebSocket URL 동적 설정
- [x] Mobile: API/WS 자동 도메인 감지
- [x] Deployment: 환경변수 자동 설정

---

## 🔍 문제 해결

### 세션이 계속 새로 생성되는 경우
1. 브라우저 개발자 도구 > Application > Local Storage 확인
2. `currentSession` 키가 있는지 확인
3. 콘솔에서 "📂 저장된 세션 발견" 메시지 확인
4. localStorage가 차단되었는지 확인 (시크릿 모드 등)

### QR 코드에 localhost가 표시되는 경우
1. 서버에서 환경변수 확인:
   ```bash
   echo $DOMAIN_URL
   ```
2. deploy.bat가 제대로 실행되었는지 확인
3. 서버 재시작:
   ```bash
   pkill -f uvicorn
   # deploy.bat 다시 실행
   ```

### WebSocket 연결 실패
1. 프로토콜 확인:
   - HTTP → `ws://`
   - HTTPS → `wss://`
2. 콘솔 로그 확인: "🔌 WebSocket 연결 시도: ..."
3. 방화벽/프록시 설정 확인

---

**이제 교사가 위젯을 한 번만 열면 같은 세션이 계속 유지됩니다!** 🎉

