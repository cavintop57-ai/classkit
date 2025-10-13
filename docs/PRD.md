# 교실 전자칠판 위젯 ‑ PRD
**버전**: 0.4  **작성일**: 2025-10-12  **수정일**: 2025-10-12

## 1. 개요
로컬 PC에서 자동 실행되는 전자칠판 '교실 위젯'과 외부 클라우드 백엔드를 결합하여, 학습 콘텐츠(영단어·속담·오늘의 문제) 표시 + 학생 참여(아바타·말풍선)를 지원한다.
QR 코드로 모바일 페이지에 접속한 학생은 '오늘의 문제' 정답을 입력해야 메시지를 남길 수 있다.

## 2. 목표
* 쉬는 시간 틈새 학습 ↑
* 학습 참여 동기 부여(퀴즈+칭찬)
* 교사 업무 편의(원‑클릭 모드 전환)
* **저사양 PC에서도 안정적 동작** (Pentium J4205급 지원)

## 3. 대상 사용자
| 구분 | 주요 요구 |
|------|-----------|
| 교사 | 자동 실행, 모드 전환(F1/F2), 문제·타이머 제어 |
| 학생 | QR 접속, 아바타 설정, 메시지 전송 |
| 관리자(선택) | 학교·반 관리, 금칙어 관리, 통계 조회 |

## 4. 기능 요구사항 (MVP)

### 4.1 핵심 기능
1. **세션 코드** 자동 발행(8자리 영숫자)·화면 표시  
2. **학습 카드** 순환: 영단어/속담/문제  
3. **문제 정답 검증** 후에만 메시지 전송 허용  
4. **도트 아바타 + 걷기 애니메이션** (Break 모드, 12 FPS)
5. **말풍선** 메시지 표시 (동시 최대 5개)  
6. **QR 코드** 자동 갱신(세션 변경 시)  
7. **광고(NPA)** 모바일 페이지 하단 배치  
8. **자동 실행 & 자동 업데이트** (Windows)
9. **저사양 모드**: 성능 자동 감지 및 애니메이션 품질 조절

### 4.2 모드 시스템 ⭐ (v0.4 신규)

교실 상황에 맞춰 3가지 모드를 전환하여 성능과 집중도를 최적화합니다.

| 모드 | 상황 | 활성 레이어 | 성능 전략 |
|------|------|-------------|-----------|
| **Break<br>(쉬는시간)** | 학생 참여형<br>학습·놀거리 | • 학습 카드 슬라이드<br>• QR + 세션 코드<br>• **아바타 걷기** (12 FPS)<br>• 말풍선<br>• 타이머<br>• 광고 | `requestAnimationFrame` @ 12 FPS |
| **Class<br>(수업시간)** | 수업 진행 중<br>주의 집중 | • 타이머/**스톱워치** (확대)<br>• 학습 카드 (정지)<br>• QR 숨김<br>• 아바타·말풍선 숨김 | Render Loop 파킹, Timer only |
| **Work<br>(업무/화면보호)** | 수업 외 시간<br>에너지 절감 | • 모든 학생 레이어 off<br>• Timer (선택사항)<br>• 광고·QR 모두 off | Render Loop 종료 (`cancelAnimationFrame`) |

**모드 전환:**
- `F1` 키: Break ↔ Class 토글
- `F2` 키: Class ↔ Work 토글
- 트레이 아이콘 클릭 → "Mode" 메뉴
- 모드 변경 시 300ms fade transition

**기본 시작 모드:** Break

## 5. 비기능 요구사항
| 항목 | 목표 |
|------|------|
| 성능 (Break) | 아바타 걷기 12 FPS, CPU < 8% idle @ Pentium J4205 |
| 성능 (Class) | Render loop 정지, CPU < 3% idle |
| 성능 (Work) | 모든 애니메이션 off, CPU < 2% idle |
| 메모리 | 사용량 < 200 MB (Electron 기본 포함) |
| 보안 | HTTPS, 세션코드 TTL 30 min, XSS 필터, Rate limiting |
| 가용성 | 백엔드 Uptime ≥ 99 % |
| 개인정보 | Login 불필요, 닉네임·반 정보만 수집, 메시지 30일 후 자동 삭제 |
| 확장성 | 동시 활성 세션 100개, 세션당 최대 50명 지원 |

## 6. 시스템 아키텍처
```
[Electron 위젯] ⇆ (WebSocket) ⇆ [FastAPI Server] ⇆ [PostgreSQL]
                             ⇡ REST              ⇅
                     [Mobile PWA / QR]        [Redis]
```

**기술 스택:**
- **Frontend**: Electron 18+ + Vite + React/Vue
- **Backend**: FastAPI (Python 3.10+) + uvicorn
- **Database**: PostgreSQL 16
- **Cache**: Redis 7 (WebSocket 세션 관리)
- **Reverse Proxy**: Caddy 2

## 7. 저사양 PC 대응 전략

### 7.1 모드별 성능 최적화
- **Break 모드**: 12 FPS로 제한된 아바타 걷기, GPU 가속
- **Class 모드**: 렌더링 루프 정지, 타이머만 업데이트 (1초 interval)
- **Work 모드**: 모든 애니메이션 중단, 메모리 최소화

### 7.2 아바타 걷기 구현
- Sprite sheet 4 frames (down/right 방향만)
- Canvas 2D 렌더링 (12 FPS cap)
- Break 모드에서만 활성화
- 예상 CPU: < 8% @ i3-6100U

### 7.3 추가 최적화
- **Hardware Acceleration** 활성화 (GPU 가속)
- **말풍선 동시 표시 제한**: 최대 5개, FIFO 방식 자동 제거
- **메모리 관리**: V8 힙 200MB 제한, 주기적 정리
- **렌더링 최적화**: CSS `transform` + `will-change` (GPU 레이어)

### 7.4 저사양 모드 자동 전환
```
조건: CPU > 20% 또는 메모리 > 180MB 지속 시
동작:
- 아바타 걷기 비활성화
- 복잡한 효과 제거 (그림자, blur)
- 말풍선 fade 단순화
```

> 상세 가이드: `PerformanceOptimization.md` 참조

## 8. 성공 지표
* 참여 학생 비율 ≥ 70 %
* 평균 일 메시지 수 ≥ 3 건/인
* 서버 오류율 < 0.1 %
* **Break 모드 CPU < 8%** (Pentium J4205 idle)
* **Class 모드 CPU < 3%**
* **Work 모드 CPU < 2%**
* **위젯 메모리 < 200 MB**
* **아바타 걷기 ≥ 12 FPS**

## 9. 개발 일정 (현실적 조정)
| 주차 | 마일스톤 |
|------|-----------|
| 1 | UI 와이어프레임 · Electron 기본 구조 + 모드 시스템 PoC |
| 2 | WebSocket · 세션 코드(8자리) · 학습 카드 |
| 3 | 모바일 PWA · 정답 검증 · Rate limiting |
| 4 | 아바타 걷기 애니메이션 (12 FPS) · GPU 가속 최적화 |
| 5 | 3가지 모드 구현 · 말풍선 시스템 |
| 6 | **저사양 PC 실제 테스트 · 성능 튜닝** |
| 7 | 광고 삽입 · 자동 업데이트 · 배포 준비 |

**총 예상 기간: 7주** (풀타임 개발자 1명 기준)

## 10. 위험 관리
| 위험 요소 | 확률 | 영향 | 대응 방안 |
|----------|------|------|-----------|
| 저사양 PC 성능 미달 | 중 | 상 | 주차 1 PoC로 조기 검증, 모드 시스템으로 부하 제어 |
| 아바타 걷기 CPU 부하 | 중 | 중 | 12 FPS cap, Canvas 2D 최적화, Break 모드만 활성 |
| 동시 접속자 폭증 | 하 | 중 | Redis Pub/Sub, Load balancer 준비 |
| 세션 코드 충돌 | 하 | 중 | 8자리 영숫자 (2.8조 경우의 수) |
| 금칙어 필터 우회 | 중 | 중 | 한글 자모 분리 감지, 교사 승인 |
| 광고 정책 위반 | 하 | 상 | NPA 모드 강제, COPPA 준수 |

## 11. 모드 전환 Use Cases

| ID | Use‑Case | Trigger | 결과 |
|----|----------|---------|-------|
| UC‑10 | Break→Class 모드 전환 | 교사 F1 | Render loop pause, QR hide, Timer expand |
| UC‑11 | Class→Work 모드 전환 | 교사 F2 | Render loop cancel, 모든 학생 레이어 off |
| UC‑12 | Work→Break 모드 전환 | 교사 F1 or F2 | New session code if >30min, render loop resume |

## 12. 기술적 제약사항 및 해결책
| 제약사항 | 해결책 |
|----------|--------|
| Electron 기본 메모리 150MB | V8 힙 제한, 이미지 최적화 |
| Pentium J4205 낮은 성능 | 모드 시스템, 12 FPS 제한, GPU 가속 |
| 아바타 걷기 CPU 부하 | Break 모드만 활성, Canvas 최적화 |
| WebSocket 50+ 동시 연결 | Redis Pub/Sub 구조 |
| 세션 코드 6자리 충돌 | 8자리 영숫자 확장 |

## 13. 필수 사전 작업
- [ ] Pentium J4205급 테스트 PC 확보
- [ ] 주차 1에 모드 시스템 PoC 구현 (CPU/메모리 측정)
- [ ] Canvas 2D 아바타 걷기 프로토타입 (12 FPS 검증)
- [ ] Chrome DevTools Performance 프로파일링 학습
- [ ] Redis 설치 및 테스트

## 부록: 참조 문서
- `PerformanceOptimization.md`: 성능 최적화 상세 가이드
- `DevSetup.md`: 개발 환경 및 테스트 방법
- `StyleGuide.md`: GPU 가속 CSS 규칙
- `ERD.md`: 데이터베이스 인덱스 최적화
- `API.md`: Rate limiting 및 보안 정책
- `updated_mode_docs/ModeSpecs.md`: 모드 시스템 상세 명세
