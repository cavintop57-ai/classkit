# 🚀 우리반 위젯 - 배포 및 수익화 가이드

## 📦 EXE 파일 배포 방법

### 1. 준비 사항

#### 필수 도구
```bash
# Node.js 설치 확인
node --version  # v18 이상 권장
npm --version   # v9 이상 권장
```

#### 의존성 설치
```bash
cd widget
npm install
```

### 2. EXE 파일 빌드

#### 방법 1: NSIS 설치 프로그램 (권장)
```bash
cd widget
npm run build:win
```

**생성 파일:**
- `widget/release/우리반 위젯 Setup 0.4.0.exe` - 설치 프로그램
- 사용자가 실행하면 자동으로 설치되고 바탕화면 바로가기 생성

#### 방법 2: Portable 버전
```bash
cd widget
npm run electron:build
```

**생성 파일:**
- `widget/release/우리반 위젯 0.4.0.exe` - 설치 없이 실행 가능
- USB에 담아서 바로 실행 가능

### 3. GitHub Release로 배포

#### 3.1 GitHub Release 생성
```bash
# 1. Git에 커밋
git add .
git commit -m "Release v0.4.0"
git tag v0.4.0
git push origin main --tags

# 2. GitHub에서 Release 생성
# https://github.com/cavintop57-ai/classkit/releases/new
```

#### 3.2 자동 배포 설정 (GitHub Actions)

`.github/workflows/release.yml` 파일 생성:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: windows-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd widget
          npm install
      
      - name: Build
        run: |
          cd widget
          npm run build:win
      
      - name: Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            widget/release/*.exe
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

#### 3.3 사용자 다운로드 방법
```
https://github.com/cavintop57-ai/classkit/releases/latest
```

---

## 💰 수익화 전략

### ✅ 가능한 수익화 방법

#### 1. 🎯 **프리미엄 모델 (추천)**

**무료 버전:**
- 기본 기능 (아바타, 메시지, QR 코드)
- 3개 기본 문제
- 최대 15명 학생

**유료 버전 (월 9,900원 또는 연 99,000원):**
- ✅ 무제한 학생
- ✅ 커스텀 문제 무제한
- ✅ 클라우드 동기화
- ✅ 다중 클래스 관리
- ✅ 학습 분석 리포트
- ✅ AI 자동 문제 생성
- ✅ 우선 기술 지원

**구현 방법:**
```javascript
// main.js에 추가
const licenseKey = localStorage.getItem('licenseKey');

async function validateLicense(key) {
  const response = await fetch('https://your-api.com/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key })
  });
  return response.json();
}

// 기능 제한
if (!isPremium) {
  if (studentCount > 15) {
    alert('무료 버전은 최대 15명까지 지원합니다. 프리미엄으로 업그레이드하세요!');
    return;
  }
}
```

#### 2. 🏫 **학교 라이선스**

**단위 학교 라이선스 (연 500,000원):**
- 전교생 무제한 사용
- 교사 계정 무제한
- 전용 기술 지원
- 맞춤 기능 개발

**교육청 단위 (협의):**
- 관할 학교 모두 사용
- 중앙 관리 시스템
- 온프레미스 배포 옵션

#### 3. 🎓 **교육 기관 파트너십**

- 교육청/교육지원청과 MOU 체결
- 에듀테크 박람회 참가
- 교사 연수 프로그램 제공
- 교육부 승인 SW 등록

#### 4. 📱 **부가 서비스**

**학생 앱 프리미엄 (월 2,900원):**
- 집에서도 문제 풀기
- 학습 진도 분석
- 부모 모니터링
- 성적 추이 그래프

**클라우드 백업 (월 4,900원):**
- 자동 백업
- 여러 컴퓨터 동기화
- 데이터 복구 보장

#### 5. 🛍️ **콘텐츠 마켓플레이스**

- 교사들이 만든 문제 세트 판매
- 플랫폼 수수료 30%
- 인기 콘텐츠 큐레이션
- 과목별/학년별 카테고리

---

## 💳 결제 연동

### 1. 국내 PG사 연동

#### 토스페이먼츠 (추천)
```javascript
// 결제 요청
const tossPayments = TossPayments('클라이언트_키');

await tossPayments.requestPayment('카드', {
  amount: 9900,
  orderId: 'order_' + Date.now(),
  orderName: '우리반 위젯 프리미엄 - 1개월',
  customerName: '홍길동',
  successUrl: 'https://your-site.com/success',
  failUrl: 'https://your-site.com/fail',
});
```

#### 네이버페이, 카카오페이 지원
```javascript
// 간편결제 옵션
methods: ['card', 'naverpay', 'kakaopay', 'tosspay']
```

### 2. 구독 관리 시스템

**필요한 백엔드 API:**
```python
# FastAPI 예시
from fastapi import FastAPI, HTTPException
from datetime import datetime, timedelta

app = FastAPI()

@app.post("/api/subscribe")
async def subscribe(license_key: str, payment_id: str):
    # 결제 검증
    # 라이선스 키 발급
    # DB에 저장
    return {
        "license_key": license_key,
        "expires_at": datetime.now() + timedelta(days=30)
    }

@app.get("/api/validate/{license_key}")
async def validate(license_key: str):
    # DB에서 확인
    # 만료일 체크
    return {"is_valid": True, "expires_at": "2024-12-31"}
```

---

## 📊 수익 예상 (월간 기준)

### 시나리오 1: 초기 단계 (출시 3개월)
```
개인 사용자: 50명 × 9,900원 = 495,000원
학교 라이선스: 2개교 × 41,667원 = 83,334원
-------------------------------------------
월 매출: 약 578,000원
```

### 시나리오 2: 성장 단계 (6개월~1년)
```
개인 사용자: 500명 × 9,900원 = 4,950,000원
학교 라이선스: 20개교 × 41,667원 = 833,340원
콘텐츠 판매 수수료: 500,000원
-------------------------------------------
월 매출: 약 6,283,000원
```

### 시나리오 3: 안정화 단계 (2년 이상)
```
개인 사용자: 2,000명 × 9,900원 = 19,800,000원
학교 라이선스: 100개교 × 41,667원 = 4,166,700원
콘텐츠 판매 수수료: 2,000,000원
광고 수익: 500,000원
-------------------------------------------
월 매출: 약 26,466,700원
```

---

## 🎨 마케팅 전략

### 1. 무료 체험판
- 7일 무료 체험
- 신용카드 등록 불필요
- 체험 종료 전 알림

### 2. 교사 커뮤니티
- 선생님들의 사용 후기
- 수업 사례 공유
- 문제 세트 공유

### 3. 교육청 제안
- 무상 시범 운영 (1개월)
- 교사 연수 무료 제공
- 성과 리포트 제공

### 4. SNS/블로그 마케팅
- 유튜브 사용 가이드
- 인스타그램 수업 사례
- 교육 블로그 기고

---

## ⚖️ 라이선스 및 법률

### 1. 오픈소스 vs 상용

**현재 (오픈소스):**
```
장점: 빠른 확산, 교사 커뮤니티 형성
단점: 직접적인 수익화 어려움
```

**제안: 이중 라이선스**
```
- 무료 버전: MIT License (오픈소스)
- 프리미엄 버전: Proprietary License (상용)
```

### 2. 개인정보보호법 준수

**필수 사항:**
- 개인정보 처리방침 작성
- 학생 데이터 암호화
- 로컬 저장 (클라우드 선택)
- 부모 동의 절차 (14세 미만)

### 3. 소프트웨어 등록

**SW 진흥법:**
- 한국저작권위원회 SW 등록
- 특허 출원 (선택)
- 상표 등록 (우리반 위젯™)

---

## 🛠️ 기술적 보호 조치

### 1. 라이선스 검증

```javascript
// electron/main.js
const Store = require('electron-store');
const store = new Store();

async function checkLicense() {
  const licenseKey = store.get('licenseKey');
  
  if (!licenseKey) {
    return { tier: 'free' };
  }
  
  try {
    const response = await fetch('https://api.classkit.kr/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: licenseKey })
    });
    
    const data = await response.json();
    
    if (data.isValid) {
      return { tier: 'premium', expiresAt: data.expiresAt };
    }
  } catch (error) {
    console.error('라이선스 검증 실패:', error);
  }
  
  return { tier: 'free' };
}
```

### 2. 코드 난독화

```bash
npm install javascript-obfuscator --save-dev
```

```javascript
// obfuscate.js
const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');

const code = fs.readFileSync('dist/assets/index.js', 'utf8');
const obfuscated = JavaScriptObfuscator.obfuscate(code, {
  compact: true,
  controlFlowFlattening: true
});

fs.writeFileSync('dist/assets/index.js', obfuscated.getObfuscatedCode());
```

### 3. 자동 업데이트

```javascript
// electron/main.js
const { autoUpdater } = require('electron-updater');

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: '업데이트 가능',
    message: '새 버전이 있습니다. 다운로드하시겠습니까?',
    buttons: ['네', '나중에']
  });
});
```

---

## 📞 지원 및 문의

### 고객 지원 체계

**무료 사용자:**
- 이메일 지원 (48시간 이내 응답)
- FAQ 문서
- 커뮤니티 포럼

**프리미엄 사용자:**
- 우선 이메일 지원 (24시간 이내)
- 1:1 원격 지원
- 전화 상담

**학교 라이선스:**
- 전담 매니저 배정
- 현장 방문 지원
- 맞춤 교육 제공

---

## 🎯 다음 단계

### 단기 (1~3개월)
1. ✅ EXE 파일 빌드 완료
2. ⬜ 무료 버전 GitHub Release
3. ⬜ 사용자 피드백 수집
4. ⬜ 웹사이트 구축

### 중기 (3~6개월)
1. ⬜ 프리미엄 기능 개발
2. ⬜ 결제 시스템 연동
3. ⬜ 마케팅 시작
4. ⬜ 교육청 제안서 발송

### 장기 (6개월~1년)
1. ⬜ 모바일 앱 출시
2. ⬜ AI 기능 고도화
3. ⬜ 해외 진출 (영어 버전)
4. ⬜ 시리즈 B 투자 유치

---

## 💡 성공 사례 참고

### 국내 에듀테크 성공 사례

**클래스카드 (Classcard):**
- 무료 + 프리미엄 모델
- 월 9,900원 구독
- 100만+ 사용자

**아이스크림 홈런:**
- 학교 라이선스 모델
- 전국 6,000개 학교
- 연매출 1,000억원+

**엘리스 (Elice):**
- B2B SaaS 모델
- 교육기관 대상
- 시리즈 B 200억 투자

---

## 📝 체크리스트

### 배포 전
- [ ] 버그 테스트 완료
- [ ] 사용자 매뉴얼 작성
- [ ] 개인정보 처리방침 작성
- [ ] 서비스 이용약관 작성
- [ ] 아이콘 및 로고 제작
- [ ] 웹사이트 구축

### 수익화 전
- [ ] 사업자 등록
- [ ] PG사 계약
- [ ] 라이선스 관리 시스템 구축
- [ ] 고객 지원 체계 마련
- [ ] 마케팅 자료 준비

---

**더 자세한 상담이 필요하시면 언제든 말씀해주세요!** 🚀

