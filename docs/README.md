# Class Widget Documentation Pack

**Generated**: 2025-10-12  
**Updated**: 2025-10-12 (v0.4)

---

## 📋 Included Files

| File | Purpose | Status |
|------|---------|--------|
| PRD.md | Product Requirements Document (v0.4) - **모드 시스템 추가** | ✅ 완성 |
| UseCases.md | MVP Use‑Case List | ✅ 완성 |
| IA.md | Information Architecture & Site Map | ✅ 완성 |
| ERD.md | Database ERD (v0.2) - **성능 인덱스 추가** | ✅ 완성 |
| API.md | REST & WebSocket API (v0.2) - **Rate limiting 추가** | ✅ 완성 |
| UIWireframes.md | Screen & Component Wireframes | ✅ 완성 |
| StyleGuide.md | UI Style Guide (v0.4) - **모드별 스타일 추가** | ✅ 완성 |
| DevSetup.md | Development Setup - **저사양 PC 테스트 가이드** | ✅ 완성 |
| PerformanceOptimization.md | 성능 최적화 종합 가이드 | ✅ 완성 |
| Deployment.md | Deployment Guide (v0.2) | ✅ 완성 |

> **Tip**: Markdown 파일을 Mermaid 지원 에디터에서 열어보세요 (Cursor, VS Code 등)

---

## 🎯 v0.4 주요 변경사항

### 🆕 모드 시스템 도입

교실 상황에 맞춰 3가지 모드를 전환하여 **성능과 집중도를 최적화**합니다.

| 모드 | 상황 | 주요 특징 | 성능 목표 |
|------|------|-----------|-----------|
| **Break** | 쉬는시간 | 아바타 걷기(12 FPS), 말풍선, QR 코드 | CPU < 8% |
| **Class** | 수업시간 | 타이머/스톱워치만 표시, 렌더링 정지 | CPU < 3% |
| **Work** | 업무/화면보호 | 모든 레이어 off, 메모리 최소화 | CPU < 2% |

**전환 방법**: `F1` (Break ↔ Class), `F2` (Class ↔ Work)

### 🚀 성능 최적화

- ✅ **세션 코드 8자리로 확장** (충돌 방지)
- ✅ **아바타 걷기 12 FPS 제한** (Break 모드만)
- ✅ **말풍선 동시 5개 제한** (FIFO 자동 제거)
- ✅ **GPU 가속 활성화** (CSS transform + will-change)
- ✅ **메모리 200MB 제한** (V8 힙 제한)

### 🛡️ 보안 강화

- ✅ **Rate Limiting** 추가 (엔드포인트별)
- ✅ **XSS 필터링** 강화
- ✅ **개인정보 보호** (메시지 30일 자동 삭제)
- ✅ **금칙어 자동 검사**

### 📊 데이터베이스 최적화

- ✅ **Critical 인덱스** (세션 코드, 메시지 조회)
- ✅ **Connection Pooling** 설정
- ✅ **PostgreSQL 튜닝** 가이드
- ✅ **자동 백업 스크립트**

---

## 🚀 빠른 시작

### 1. 문서 읽는 순서 (처음 시작하는 경우)

```
PRD.md (v0.4 - 모드 시스템 이해)
  ↓
UseCases.md (기능 파악)
  ↓
ERD.md + API.md (데이터/API 구조)
  ↓
DevSetup.md (개발 환경 구축)
  ↓
StyleGuide.md (모드별 UI 규칙)
  ↓
PerformanceOptimization.md (성능 최적화)
  ↓
Deployment.md (배포)
```

### 2. 역할별 필독 문서

**👨‍💼 기획자/PM:**
- ✅ PRD.md (섹션 4.2 모드 시스템 필독)
- UseCases.md
- IA.md
- UIWireframes.md

**👨‍💻 백엔드 개발자:**
- PRD.md (섹션 5-6)
- ERD.md (성능 인덱스 필독)
- API.md (Rate limiting 필독)
- DevSetup.md (백엔드 섹션)
- Deployment.md

**👩‍💻 프론트엔드 개발자:**
- ✅ PRD.md (모드 시스템 필독)
- ✅ StyleGuide.md (모드별 CSS 규칙 필독)
- UIWireframes.md
- DevSetup.md (모드 구현 가이드)
- ✅ PerformanceOptimization.md ⭐

**🎨 디자이너:**
- StyleGuide.md (모드별 UI 변화)
- UIWireframes.md
- PRD.md (섹션 4.2)

**🔧 DevOps:**
- Deployment.md (Docker Compose 설정)
- ERD.md (인덱스 생성)
- DevSetup.md (모니터링)

---

## 📊 기술 스택

### Frontend (위젯)
- **Framework**: Electron 18+ + Vite + React/Vue
- **Canvas**: 2D Context (아바타 걷기)
- **상태 관리**: Zustand/Pinia
- **WebSocket**: Native WebSocket API

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **ASGI Server**: uvicorn + uvloop
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Reverse Proxy**: Caddy 2

### Deployment
- **컨테이너**: Docker + Docker Compose
- **SSL**: Caddy 자동 인증서
- **백업**: 일일 자동 백업 (pg_dump)
- **모니터링**: Health check API

---

## 🔍 핵심 성능 지표

| 항목 | 목표 | 측정 기준 |
|------|------|-----------|
| **Break 모드 CPU** | < 8% | Pentium J4205 idle |
| **Class 모드 CPU** | < 3% | 렌더링 루프 정지 |
| **Work 모드 CPU** | < 2% | 거의 빈 화면 |
| **위젯 메모리** | < 200 MB | Electron 프로세스 |
| **아바타 걷기 FPS** | ≥ 12 FPS | Break 모드 |
| **백엔드 응답** | < 100ms | P95 레이턴시 |
| **WebSocket 지연** | < 50ms | 메시지 전달 |
| **Uptime** | ≥ 99% | 월간 가용성 |

---

## ⚠️ 주의사항

### 필수 요구사항
1. **저사양 PC 테스트 필수**: Pentium J4205급에서 실제 테스트
2. **모드 시스템 이해**: 3가지 모드의 차이와 전환 방법
3. **GPU 가속 확인**: Chrome DevTools로 레이어 생성 확인
4. **성능 프로파일링**: 1주차부터 CPU/메모리 측정
5. **Rate Limiting 설정**: DoS 공격 방지 필수

### 알려진 제약사항
- Electron 기본 메모리 사용: 최소 150 MB (Chromium 엔진)
- WebSocket 동시 연결: 세션당 최대 50명
- 아바타 걷기: Break 모드에서만 활성화 (12 FPS 제한)
- Canvas 2D: PNG 스프라이트 사용 (WebP 호환성 문제)

---

## 🛠️ 개발 로드맵 (7주)

| 주차 | 마일스톤 | 주요 작업 |
|------|-----------|-----------|
| 1 | 기본 구조 + PoC | Electron 설정, 모드 시스템 프로토타입, 성능 PoC |
| 2 | 핵심 기능 | WebSocket, 세션 코드(8자리), 학습 카드 |
| 3 | 모바일 & 보안 | PWA, 정답 검증, Rate limiting |
| 4 | 아바타 걷기 | Canvas 렌더링, 12 FPS 최적화, GPU 가속 |
| 5 | 모드 구현 | 3가지 모드 완성, 렌더링 루프 제어 |
| 6 | **테스트 & 튜닝** | 저사양 PC 테스트, 성능 최적화 |
| 7 | 배포 준비 | 광고 삽입, 자동 업데이트, 배포 스크립트 |

**총 예상 기간**: 7주 (풀타임 개발자 1명 기준)

---

## 🎨 모드 시스템 상세

### Break 모드 (쉬는시간)
- **활성화**: 아바타 걷기, 말풍선, QR 코드, 학습 카드, 광고
- **렌더링**: 12 FPS Canvas 애니메이션
- **용도**: 학생 참여, 학습 콘텐츠 표시
- **전환**: `F1` → Class 모드

### Class 모드 (수업시간)
- **활성화**: 타이머/스톱워치 (확대), 학습 카드 (정지)
- **렌더링**: 렌더링 루프 정지, 타이머만 1초 interval
- **용도**: 수업 집중, 시간 관리
- **전환**: `F1` → Break, `F2` → Work

### Work 모드 (업무/화면보호)
- **활성화**: 거의 빈 화면 (Timer 선택사항)
- **렌더링**: 완전 중단 (`cancelAnimationFrame`)
- **용도**: 수업 외 시간, 에너지 절감
- **전환**: `F1` or `F2` → Break

---

## 📞 지원 및 피드백

### 문서 개선 제안
- 이슈 등록: GitHub Issues
- 직접 수정: Pull Request 환영

### 기술 문의
- 백엔드: `backend/README.md` 참조
- 프론트엔드: `widget/README.md` 참조
- 모드 시스템: `updated_mode_docs/ModeSpecs.md` 참조
- 성능 이슈: `PerformanceOptimization.md` 참조

---

## 📚 추가 리소스

### 외부 문서
- [Electron 공식 문서](https://www.electronjs.org/docs)
- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [Canvas 2D API](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
- [PostgreSQL 성능 튜닝](https://wiki.postgresql.org/wiki/Performance_Optimization)

### 참고 프로젝트
- Electron 저사양 최적화: [Tauri](https://tauri.app/)
- WebSocket 확장성: [Socket.IO](https://socket.io/)
- Canvas 최적화: [Konva.js](https://konvajs.org/)

---

## 🏆 성공을 위한 체크리스트

### Phase 1: 기획 (완료)
- [x] PRD 작성 (모드 시스템 포함)
- [x] API 명세 작성 (Rate limiting 포함)
- [x] ERD 설계 (성능 인덱스 포함)
- [x] StyleGuide 작성 (모드별 규칙)
- [x] 성능 최적화 전략 수립

### Phase 2: 개발 (진행 예정)
- [ ] Electron 기본 구조 + 모드 시스템 PoC
- [ ] 성능 측정 (Pentium J4205)
- [ ] 아바타 걷기 Canvas 구현
- [ ] WebSocket 실시간 통신
- [ ] 3가지 모드 완성

### Phase 3: 테스트 & 배포 (진행 예정)
- [ ] 저사양 PC 실제 테스트
- [ ] 성능 목표 달성 확인
- [ ] 자동 업데이트 구현
- [ ] Docker 배포 스크립트
- [ ] 프로덕션 배포

---

## 📄 라이선스

이 문서는 교육용 목적으로 작성되었습니다.  
실제 프로젝트 코드는 별도의 라이선스를 적용하세요.

**문서 버전**: 0.4  
**최종 수정**: 2025-10-12  
**작성자**: ClassKit Team

---

## 📝 Changelog

### v0.4 (2025-10-12) - **Major Update**
- ✅ **모드 시스템 추가** (Break/Class/Work)
- ✅ 아바타 걷기 12 FPS 구현 가이드
- ✅ 모드별 성능 목표 세분화
- ✅ 세션 코드 8자리로 확장
- ✅ Rate limiting 상세 명세
- ✅ 데이터베이스 인덱스 최적화
- ✅ GPU 가속 CSS 규칙
- ✅ 저사양 PC 테스트 가이드

### v0.2 (이전)
- 저사양 PC 대응 전략
- 성능 최적화 가이드
- 보안 강화

### v0.1 (초기)
- Initial documentation
