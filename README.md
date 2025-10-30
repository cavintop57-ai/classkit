# 🏫 우리반 위젯 (ClassKit Widget)

초등학교 선생님을 위한 전자칠판 위젯 + 학생용 모바일 앱

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Release](https://img.shields.io/github/v/release/cavintop57-ai/classkit)](https://github.com/cavintop57-ai/classkit/releases)
[![Downloads](https://img.shields.io/github/downloads/cavintop57-ai/classkit/total)](https://github.com/cavintop57-ai/classkit/releases)

## 📥 다운로드

### Windows 사용자 (권장)
**[최신 버전 다운로드 (EXE)](https://github.com/cavintop57-ai/classkit/releases/latest)**

1. `우리반 위젯 Setup.exe` - 설치 프로그램 (권장)
2. `우리반 위젯.exe` - 설치 없이 실행 (포터블)

### 개발자용
아래 "빠른 시작" 참고

## 🚀 빠른 시작

### 1️⃣ 백엔드 서버 실행

**방법 1: 배치 파일 사용 (권장)**
```
start_backend.bat 더블클릭
```

**방법 2: 수동 실행**
```bash
cd backend
python -m uvicorn app.main:app --reload
```

**확인**: 브라우저에서 http://localhost:8000/health 접속
```json
{"status": "healthy", "database": "connected"}
```

### 2️⃣ 위젯 실행

**방법 1: 배치 파일 사용 (권장)**
```
start_widget.bat 더블클릭
```

**방법 2: 수동 실행**
```bash
cd widget
npm run dev
```

**확인**: 브라우저에서 http://localhost:5173 접속

### 3️⃣ 확인

위젯 화면 우측 상단:
- 🏷️ **우리반 코드**: A23456 (6자리 코드 표시)
- 📱 **QR 코드**: 표시됨

## 📱 모바일 앱 (학생용)

모바일에서 QR 코드를 스캔하거나, 직접 코드를 입력하세요:

```
http://localhost:8000/A23456
```

## ✅ 주요 기능

### 🌌 Kenney Planets 우주 배경 시스템
- ✅ **우주 환경**: 깊은 우주 그라디언트, 별, 행성, 성운
- ✅ **200-300개 반짝이는 별**: 자연스러운 반짝임 효과
- ✅ **3-5개 행성**: 다양한 크기와 회전 속도
- ✅ **우주 먼지**: 50-80개 먼지 파티클로 입체감
- ✅ **모드별 분위기**: Break(파랑 우주), Class(어두운 우주), Work(검정 우주)
- ✅ **자동 애니메이션**: 별 반짝임, 행성 회전, 먼지 이동

### 👾 Among Us 스타일 아바타 시스템
- ✅ **귀여운 우주인**: Among Us의 상징적인 캡슐 모양 캐릭터
- ✅ **12가지 색상**: Red, Blue, Green, Pink, Orange, Yellow, Black, White, Purple, Brown, Cyan, Lime
- ✅ **프로시저럴 생성**: Canvas 2D로 실시간 렌더링 (이미지 불필요)
- ✅ **우주에서 자유롭게 날아다님**: 화면 전체 영역을 떠다니는 캐릭터
- ✅ **떠다니는 효과**: 부드러운 파동 효과로 우주 부유감 표현
- ✅ **다리 애니메이션**: 2프레임 왕복 걷기 애니메이션
- ✅ **특별한 선생님**: 금색 캐릭터 + 왕관 착용
- ✅ **초경량**: 이미지 로딩 없이 Canvas로 직접 그리기

### 🐛 세션/QR 코드 생성 완벽 작동
- ✅ CORS 설정 추가
- ✅ 외래키 문제 해결 (학교/반 자동 생성)
- ✅ startup 이벤트로 DB 자동 초기화
- ✅ class_id optional 처리

### 📱 모바일 UI 완벽 개선
- ✅ 헤더 제거 (깔끔한 화면)
- ✅ "세션 코드" → "우리반 코드"
- ✅ 네모 칸에 직접 입력 (6개 슬롯)
- ✅ 버튼 색상 변경 (빨강-주황 그라디언트)
- ✅ 자동 포커스, 자동 다음 칸 이동
- ✅ 모바일 키보드 최적화
- ✅ 붙여넣기 지원

## 🔍 문제 해결

### 문제: 세션 코드가 "연결 중..."으로 표시

**원인**: 백엔드가 실행되지 않음

**해결**: `start_backend.bat` 실행

### 문제: CORS 에러

**해결**: 이미 수정됨 (backend/app/main.py)

### 문제: DB 오류

**해결**: DB 삭제 후 재시작
```bash
cd backend
rm classkit.db
python -m uvicorn app.main:app --reload
```

## 📂 프로젝트 구조

```
classkit/
├── backend/           # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py   # CORS, startup 이벤트
│   │   ├── routes/
│   │   │   └── sessions.py  # 학교/반 자동 생성 로직
│   │   └── init_db.py
│   └── classkit.db   # SQLite DB (자동 생성)
├── widget/           # 전자칠판 위젯
│   ├── src/
│   │   ├── main.js        # 12 FPS 제어
│   │   └── avatarRenderer.js  # 스프라이트 시트 렌더러
│   └── index.html
├── mobile/           # 학생용 PWA
│   ├── index.html    # 헤더 제거, 코드 칸 입력
│   ├── app.js        # 코드 슬롯 로직
│   └── style.css     # 버튼 색상 변경
├── start_backend.bat # 백엔드 시작 스크립트
└── start_widget.bat  # 위젯 시작 스크립트
```

## 🎮 기능

### Break 모드 (쉬는시간) 🎮
- 아바타가 걸어다님 (12 FPS)
- 랜덤 말풍선 표시
- 타이머 실행

### Class 모드 (수업시간) 📚
- 아바타 정지 (그리기만)
- 학습 카드 표시
- 타이머 확대

### Work 모드 (업무) 💼
- 모든 렌더링 중지
- 에너지 절약

## 🛠️ 개발 환경

- **Python**: 3.9+
- **Node.js**: 18+
- **데이터베이스**: SQLite (별도 설치 불필요)

## 📄 문서

- [스프라이트 시트 가이드](widget/SPRITE_SHEET_GUIDE.md)
- [테스트 가이드](TEST_SESSION.md)
- [설정 가이드](SETUP_GUIDE.md)
- [API 문서](docs/API.md)
- [PRD](docs/PRD.md)

## 🎉 완료!

모든 수정이 완료되었습니다. 이제 배치 파일을 실행하면 바로 사용할 수 있습니다!

1. `start_backend.bat` 실행
2. `start_widget.bat` 실행  
3. 브라우저에서 http://localhost:5173 접속
4. 우리반 코드 & QR 코드 확인!
