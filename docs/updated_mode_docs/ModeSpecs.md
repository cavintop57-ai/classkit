# Mode Specification

| Mode | Purpose | Active Layers / Features | Performance Strategy |
|------|---------|-------------------------|----------------------|
| **Break (쉬는시간)** | 학생 참여형, 학습·놀거리 표출 | • 학습 카드 슬라이드<br>• QR/세션 코드<br>• **아바타 걷기** (Canvas 2D, 12 FPS cap)<br>• 말풍선 메시지<br>• 모바일 참여 허용 | Render Loop 활성 (`requestAnimationFrame` @ 12 FPS) |
| **Class (수업시간)** | 수업 진행 중, 주의 집중 | • 카운트다운/스톱워치<br>• 학습 카드 *정지* (선택)<br>• QR 숨김<br>• 아바타 층 **Pause** (no draw) | Render Loop 파킹, Timer only |
| **Work (업무)** | 수업/쉬는시간 외, 화면 보호 | • 모든 학생 관련 레이어 숨김<br>• Timer optional<br>• 광고·QR 모두 Off | Render Loop 종료 (`cancelAnimationFrame`) |

### 모드 전환 UX
* *F1* — Break ↔ Class  
* *F2* — Class ↔ Work  
* UI 아이콘 (좌측 상단) 클릭 전환도 제공  
* 모드 변경 시 300 ms fade transition

### 아바타 걷기 구현
* Sprite sheet 4 frames (down/right 방향만)  
* `tick` 함수에서 `if (mode==="break") { walkStep++ }`  
* CPU < 8 % (i3‑6100U 기준) 예상
