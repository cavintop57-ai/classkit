# UI Style Guide

## 색상 토큰

| Token | Value | Usage |
|-------|-------|-------|
| `--color-chalkboard` | #0d4632 | 칠판 배경 |
| `--color-chalk` | #f5f5dc | 텍스트·선 강조 |
| `--color-accent` | #ffcf00 | 버튼·타이머 |
| `--color-shadow` | rgba(0,0,0,0.3) | 그림자 (일반 모드) |

## 타이포그래피

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--font-body` | 'Pretendard', sans-serif | 국문 본문 |
| `--font-mono` | 'Fira Code', monospace | 영단어 카드, 코드 |
| `--font-size-base` | 16px | 기본 크기 |
| `--font-size-large` | 24px | 제목 |
| `--font-size-huge` | 48px | 타이머 |

## 아바타 규격

### 스프라이트 시트
- **크기**: 각 16×16 px
- **레이아웃**: 8×8 그리드 (총 64개 아바타)
- **파일 형식**: WebP (PNG 대비 50% 용량 절감)
- **애니메이션**: 4-frame walk cycle (선택사항, 일반 모드에만 적용)

```
avatars-sprite.webp (128x128px)
┌────┬────┬────┬────┬────┬────┬────┬────┐
│ 0  │ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │ 7  │
├────┼────┼────┼────┼────┼────┼────┼────┤
│ 8  │ 9  │ 10 │ 11 │ 12 │ 13 │ 14 │ 15 │
└────┴────┴────┴────┴────┴────┴────┴────┘
```

### CSS 구현

```css
.avatar {
  width: 32px;
  height: 32px;
  background-image: url('/assets/avatars-sprite.webp');
  background-size: 256px 256px; /* 128px → 256px (2배 확대) */
  image-rendering: pixelated; /* 도트 그래픽 선명하게 */
  will-change: transform, opacity;
  transform: translateZ(0); /* GPU 가속 */
}

.avatar[data-id="0"] {
  background-position: 0 0;
}

.avatar[data-id="1"] {
  background-position: -32px 0;
}
```

## 애니메이션

### 일반 모드 (60 FPS)

```css
[data-performance-mode="high"] .speech-bubble {
  animation: bubble-appear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  backdrop-filter: blur(10px); /* 반투명 배경 블러 */
}

@keyframes bubble-appear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

[data-performance-mode="high"] .avatar {
  animation: float 2s ease-in-out infinite;
  filter: drop-shadow(0 2px 4px var(--color-shadow));
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
```

### 저사양 모드 (30 FPS)

```css
[data-performance-mode="low"] .speech-bubble {
  animation: bubble-simple 0.2s ease;
  backdrop-filter: none; /* 블러 제거 (CPU 부하 큼) */
  background: rgba(255, 255, 255, 0.95); /* 불투명 배경 */
}

@keyframes bubble-simple {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

[data-performance-mode="low"] .avatar {
  animation: none; /* 부유 애니메이션 제거 */
  filter: none; /* 그림자 제거 */
}
```

### 애니메이션 이징

| 용도 | 함수 | 설명 |
|------|------|------|
| 말풍선 등장 | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 탄성 효과 (일반 모드) |
| 말풍선 퇴장 | `ease-out` | 부드러운 종료 |
| 카드 전환 | `ease-in-out` | 자연스러운 전환 |
| 단순 페이드 | `ease` | 저사양 모드 |

## 레이아웃

### 화면 구성 (1920×1080 기준)

```
┌──────────────────────────────────────────┐
│  학습 카드 (중앙 상단)                        │
│  [영단어 / 속담 / 문제]                       │
│                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐      │
│  │아바타1 │  │아바타2 │  │아바타3 │      │
│  │말풍선  │  │말풍선  │  │말풍선  │      │
│  └────────┘  └────────┘  └────────┘      │
│                                          │
│  ┌──────────┐                    ⏱ 00:00│
│  │ QR 코드   │                    타이머  │
│  │ 123456   │                           │
│  └──────────┘                           │
└──────────────────────────────────────────┘
```

### 업무 모드

```
┌──────────────────────────────────────────┐
│                                          │
│                                          │
│         ⏱ 45:00                          │
│         [타이머 확대]                      │
│                                          │
│                                          │
│         [학습 카드 선택사항]               │
│                                          │
│                                          │
└──────────────────────────────────────────┘
```

## 반응형 처리

**위젯은 고정 전체화면이므로 반응형 불필요**  
**모바일 PWA만 반응형 적용:**

```css
/* Mobile PWA (mobile.css) */
@media (max-width: 480px) {
  .form-container {
    padding: 16px;
  }
  
  .avatar-selector {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .submit-button {
    font-size: 18px;
    padding: 16px;
  }
}
```

## 접근성

### 키보드 네비게이션
- `Tab`: 다음 항목
- `Enter`: 선택/제출
- `←/→`: 학습 카드 전환
- `F1`: 업무 모드 토글
- `Ctrl+R`: 세션 초기화

### 대비율
- 텍스트: 최소 4.5:1 (WCAG AA)
- 버튼: 최소 3:1 (WCAG AA)

```css
/* 고대비 모드 지원 */
@media (prefers-contrast: high) {
  .speech-bubble {
    border: 2px solid #000;
    background: #fff;
    color: #000;
  }
}
```

## 성능 최적화 규칙

### ✅ 권장

```css
/* GPU 가속 속성 사용 */
.element {
  transform: translate3d(0, 0, 0);
  opacity: 0.9;
  will-change: transform, opacity;
}

/* 레이어 분리 */
.layer {
  transform: translateZ(0);
}

/* 하드웨어 가속 애니메이션 */
@keyframes move {
  from { transform: translateX(0); }
  to { transform: translateX(100px); }
}
```

### ❌ 비권장

```css
/* CPU 렌더링 속성 */
.element {
  left: 100px; /* ❌ layout thrashing */
  top: 100px;
  width: calc(100% - 50px); /* ❌ 매 프레임 재계산 */
}

/* 무거운 효과 */
.element {
  box-shadow: 0 0 50px rgba(0,0,0,0.5); /* ❌ CPU 부하 */
  filter: blur(20px) brightness(1.5); /* ❌ 매우 무거움 */
}
```

## 컴포넌트 라이브러리

### 말풍선

```html
<div class="speech-bubble" data-avatar="3">
  <div class="bubble-content">안녕하세요!</div>
  <div class="bubble-tail"></div>
</div>
```

```css
.speech-bubble {
  position: absolute;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  font-size: 14px;
  max-width: 200px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  word-wrap: break-word;
}

.bubble-tail {
  position: absolute;
  bottom: -8px;
  left: 20px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(255, 255, 255, 0.95);
}
```

### 학습 카드

```html
<div class="learning-card" data-type="vocabulary">
  <div class="card-front">
    <h2 class="word">diligent</h2>
    <p class="pronunciation">/ˈdɪlɪdʒənt/</p>
  </div>
  <div class="card-back">
    <p class="meaning">부지런한, 성실한</p>
    <p class="example">She is a diligent student.</p>
  </div>
</div>
```

```css
.learning-card {
  width: 400px;
  height: 300px;
  background: var(--color-chalk);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.learning-card.flipped {
  transform: rotateY(180deg);
}
```

## 에셋 최적화

### 이미지 포맷

| 용도 | 포맷 | 설정 |
|------|------|------|
| 아바타 스프라이트 | WebP | Quality 80 |
| QR 코드 | SVG | - |
| 아이콘 | SVG | - |
| 배경 텍스처 | WebP | Quality 70 |

### 폰트 최적화

```css
@font-face {
  font-family: 'Pretendard';
  src: url('/fonts/Pretendard-subset.woff2') format('woff2');
  font-display: swap;
  unicode-range: U+AC00-D7AF, U+0020-007E; /* 한글 + 영문 */
}
```

**서브셋팅:**
```bash
# pyftsubset으로 필요한 글자만 추출
pyftsubset Pretendard.ttf \
  --output-file=Pretendard-subset.woff2 \
  --flavor=woff2 \
  --unicodes=U+AC00-D7AF,U+0020-007E
```

## 다크 모드 (향후)

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-chalkboard: #1a1a1a;
    --color-chalk: #e0e0e0;
    --color-accent: #ffd700;
  }
}
```

## 디자인 에셋 파일

```
assets/
├── avatars-sprite.webp      # 128x128px, 64 avatars
├── avatars-sprite@2x.webp   # 256x256px (Retina)
├── fonts/
│   ├── Pretendard-subset.woff2
│   └── FiraCode-subset.woff2
├── icons/
│   ├── timer.svg
│   ├── settings.svg
│   └── refresh.svg
└── textures/
    └── chalkboard-bg.webp   # 1920x1080px
```

* **Performance Tip**: 애니메이션은 `transition: opacity 0.4s ease-out` 정도의 CSS 전환을 기본으로 하고, requestAnimationFrame 루프는 최소화한다.
