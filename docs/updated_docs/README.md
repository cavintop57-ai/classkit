# Class Widget Documentation Pack
Generated: 2025-10-12 | Updated: 2025-10-12 (v0.2)

## Included Files
| File | Purpose |
|------|---------|
| PRD.md | Product Requirements Document (v0.2) - **저사양 PC 대응 추가** |
| UseCases.md | MVP Use‑Case List |
| IA.md | Information Architecture & Site Map |
| ERD.md | Database Entity–Relationship Diagram |
| API.md | REST & WebSocket API Specification |
| UIWireframes.md | Screen & Component Wireframe Notes |
| StyleGuide.md | UI Style & Branding Guidelines - **성능 최적화 규칙 추가** |
| DevSetup.md | Local Development Setup - **성능 프로파일링 가이드 추가** |
| PerformanceOptimization.md | **NEW** 성능 최적화 종합 가이드 |
| Deployment.md | Docker & Cloud Deployment Guide - **프로덕션 설정 강화** |

> Tip: Open these Markdown files in **Cursor** or any IDE that supports Mermaid for live diagram previews.

---

## 📋 문서 개요

### 1. 기획 문서
- **PRD.md**: 제품 요구사항, 기능 명세, 성능 목표
- **UseCases.md**: 9가지 주요 사용 시나리오
- **IA.md**: 페이지 구조 및 사용자 플로우

### 2. 기술 설계
- **ERD.md**: 데이터베이스 스키마 (6개 테이블)
- **API.md**: REST/WebSocket 엔드포인트 명세
- **StyleGuide.md**: UI 디자인 시스템

### 3. 개발 가이드
- **DevSetup.md**: 로컬 환경 설정 및 개발 도구
- **PerformanceOptimization.md**: 🆕 저사양 PC 최적화 전략
- **Deployment.md**: Docker 배포 및 Electron 빌드

### 4. 디자인
- **UIWireframes.md**: 화면 구성 및 레이아웃

---

## 🚀 빠른 시작

### 1. 문서 읽는 순서 (처음 시작하는 경우)

```
PRD.md (전체 이해)
  ↓
UseCases.md (기능 파악)
  ↓
ERD.md + API.md (데이터/API 구조)
  ↓
DevSetup.md (개발 환경 구축)
  ↓
PerformanceOptimization.md (성능 최적화)
  ↓
Deployment.md (배포)
```

### 2. 역할별 필독 문서

**👨‍💼 기획자/PM:**
- PRD.md
- UseCases.md
- IA.md
- UIWireframes.md

**👨‍💻 백엔드 개발자:**
- PRD.md (섹션 5-6)
- ERD.md
- API.md
- DevSetup.md (백엔드 섹션)
- Deployment.md

**👩‍💻 프론트엔드 개발자:**
- PRD.md (섹션 4-5)
- StyleGuide.md
- UIWireframes.md
- DevSetup.md (Electron 섹션)
- PerformanceOptimization.md ⭐

**🎨 디자이너:**
- StyleGuide.md
- UIWireframes.md
- PerformanceOptimization.md (섹션 1-2)

**🔧 DevOps:**
- Deployment.md
- DevSetup.md (모니터링 섹션)

---

## 🎯 주요 변경사항 (v0.2)

### 성능 최적화 추가
- ✅ 저사양 PC 대응 전략 수립
- ✅ CPU/메모리 목표 수치 하향 조정
- ✅ 저사양 모드 자동 전환 메커니즘
- ✅ 애니메이션 프레임 제어 가이드
- ✅ GPU 가속 활성화 방법

### 보안 강화
- ✅ Rate limiting 추가
- ✅ 개인정보 보관 기간 명시 (30일)
- ✅ CORS 정책 구체화

### 배포 개선
- ✅ Docker Compose health check 추가
- ✅ PostgreSQL 성능 튜닝 설정
- ✅ Redis 캐싱 전략
- ✅ 자동 백업 스크립트

---

## 📊 기술 스택 요약

### Frontend (위젯)
- **추천**: Electron 18+ (호환성 우수)
- **대안**: Tauri (저사양 최적화 시)
- **빌드**: Vite + React/Vue
- **상태 관리**: Zustand/Pinia
- **WebSocket**: native WebSocket API

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **ASGI Server**: uvicorn + uvloop
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Reverse Proxy**: Caddy 2

### Deployment
- **컨테이너**: Docker + Docker Compose
- **SSL**: Caddy 자동 인증서
- **모니터링**: Grafana + Loki (선택)
- **에러 추적**: Sentry (선택)

---

## 🔍 핵심 성능 지표

| 항목 | 목표 | 측정 기준 |
|------|------|-----------|
| **위젯 CPU** | < 15% | Pentium J4205 기준 |
| **위젯 메모리** | < 200 MB | Electron 프로세스 |
| **애니메이션 FPS** | ≥ 30 FPS | 저사양 모드 |
| **백엔드 응답** | < 100ms | P95 레이턴시 |
| **WebSocket 지연** | < 50ms | 메시지 전달 시간 |
| **Uptime** | ≥ 99% | 월간 가용성 |

---

## ⚠️ 주의사항

### 필수 요구사항
1. **테스트 환경**: 저사양 PC에서 반드시 실제 테스트 필요
2. **코드 서명**: Windows SmartScreen 경고 방지 위해 권장 ($400/년)
3. **Rate Limiting**: DoS 공격 방지 필수
4. **백업**: 데이터베이스 일일 백업 설정

### 알려진 제약사항
- Electron은 최소 150 MB 메모리 사용 (Chromium 엔진)
- WebSocket 동시 연결 50개 이상 시 Redis Pub/Sub 필수
- 세션 코드 8자리로 확장 권장 (6자리는 충돌 위험)

---

## 🛠️ 개발 로드맵

### Phase 1: MVP (4주)
- [ ] Electron 기본 구조 + WebSocket 연결
- [ ] FastAPI 서버 + PostgreSQL 스키마
- [ ] 세션 코드 발행 및 QR 생성
- [ ] 기본 메시지 전송/수신
- [ ] 업무 모드 토글

### Phase 2: 최적화 (4주)
- [ ] 저사양 모드 자동 감지
- [ ] 애니메이션 최적화
- [ ] 정답 검증 시스템
- [ ] 학습 카드 UI
- [ ] 금칙어 필터링

### Phase 3: 배포 (2주)
- [ ] Docker Compose 설정
- [ ] Electron 자동 업데이트
- [ ] 코드 서명
- [ ] 모니터링 대시보드
- [ ] 프로덕션 테스트

**총 예상 기간: 10주** (풀타임 개발자 1명 기준)

---

## 📞 지원 및 피드백

### 문서 개선 제안
- 이슈 등록: GitHub Issues
- 직접 수정: Pull Request 환영

### 기술 문의
- 백엔드: `backend/README.md` 참조
- 프론트엔드: `widget/README.md` 참조
- 성능 이슈: `PerformanceOptimization.md` 참조

---

## 📚 추가 리소스

### 외부 문서
- [Electron 공식 문서](https://www.electronjs.org/docs)
- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [PostgreSQL 성능 튜닝](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Web Performance Best Practices](https://web.dev/performance/)

### 참고 프로젝트
- Electron 저사양 최적화: [Tauri](https://tauri.app/)
- WebSocket 확장성: [Socket.IO](https://socket.io/)
- 실시간 대시보드: [Grafana](https://grafana.com/)

---

## 📄 라이선스

이 문서는 교육용 목적으로 작성되었습니다.  
실제 프로젝트 코드는 별도의 라이선스를 적용하세요.

**문서 버전**: 0.2  
**최종 수정**: 2025-10-12  
**작성자**: ClassKit Team
