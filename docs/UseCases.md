# 교실 위젯 Use‑Case 목록 (MVP)

| ID | Use‑Case | Actor | 기본 흐름 |
|----|----------|-------|-----------|
| UC‑1 | 위젯 자동 실행 | 교사 PC | OS 부팅 → 위젯 EXE 자동 실행 → 전체화면 진입 |
| UC‑2 | 세션 코드 발행 | 위젯 | 실행 시 REST `POST /sessions` → 6자리 코드 수신·표시 → QR 생성 |
| UC‑3 | 문제 정답 제출 | 학생 | QR 접속 → 닉네임·반 입력 → 문제 정답 입력 → `POST /messages` |
| UC‑4 | 메시지 방송 | 서버 | 정답 OK → DB 저장 → `broadcast.newMessage` WebSocket 이벤트 송신 |
| UC‑5 | 아바타 표시 | 위젯 | 이벤트 수신 → 해당 학생 아바타 좌표 찾기 → 말풍선 + fade 애니메이션 |
| UC‑6 | 업무 모드 전환 | 교사 | F1 키 ↔ 버튼 클릭 → 학생 레이어·광고 toggle, 타이머 확대 |
| UC‑7 | 학습 카드 넘기기 | 교사 | ←/→ 화살표 → 카드 인덱스 ±1 → 내용 페이드 인 |
| UC‑8 | 세션 초기화 | 교사 | Control+R → `/sessions/reset` 호출 → 새 코드·QR 표시 |
| UC‑9 | 로그 수집 | 서버 | 모든 REST / WS 이벤트를 `logs` 테이블에 저장 (IP, UA, ts) |

> **예외 흐름**
> * UC‑3‑E1 정답 오답 → `403` 응답 + 힌트 전송 (PWA 팝업)  
> * UC‑4‑E1 금칙어 포함 → `status=moderation` → 교사 승인 대기 |
