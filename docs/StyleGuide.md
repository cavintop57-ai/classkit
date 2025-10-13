# UI Style Guide

**Version**: 0.4  
**Updated**: 2025-10-12

## 색상 토큰

| Token | Value | Usage |
|-------|-------|-------|
| `--color-chalkboard` | #0d4632 | 칠판 배경 |
| `--color-chalk` | #f5f5dc | 텍스트·선 강조 |
| `--color-accent` | #ffcf00 | 버튼·타이머 |
| `--color-shadow` | rgba(0,0,0,0.3) | 그림자 (Break 모드) |
| `--font-body` | 'Pretendard', sans-serif | 국문 본문 |
| `--font-mono` | 'Fira Code', monospace | 영단어 카드 |

---

## 아바타 규격 ⭐

### 스프라이트 시트
- **크기**: 각 16×16 px
- **레이아웃**: 8×8 그리드 (총 64개 아바타)
- **파일 형식**: PNG (WebP는 Canvas 2D 호환성 문제로 제외)
- **걷기 애니메이션**: 4-frame sprite (down/right 방향만)

```
avatars-sprite.png (128x128px)
┌────┬────┬────┬────┬────┬────┬────┬────┐
│ 0  │ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │ 7  │
├────┼────┼────┼────┼────┼────┼────┼────┤
│ 8  │ 9  │ 10 │ 11 │ 12 │ 13 │ 14 │ 15 │
│...  │...  │...  │...  │...  │...  │...  │...  │
└────┴────┴────┴────┴────┴────┴────┴────┘

각 아바타당 4 프레임:
Frame 0: 정지
Frame 1: 왼발
Frame 2: 정지
Frame 3: 오른발
```

### Canvas 구현 (아바타 걷기)

```javascript
// avatarRenderer.js
class AvatarRenderer {
  constructor(canvas) {
    this.ctx = canvas.getContext('2d');
    this.spriteImage = new Image();
    this.spriteImage.src = '/assets/avatars-sprite.png';
    this.frameIndex = 0;
    this.tickCount = 0;
    this.ticksPerFrame = 5; // 12 FPS @ 60 FPS loop
  }
  
  drawAvatar(avatarId, x, y, mode) {
    // Break 모드에서만 걷기 애니메이션
    if (mode === 'break') {
      this.tickCount++;
      if (this.tickCount > this.ticksPerFrame) {
        this.tickCount = 0;
        this.frameIndex = (this.frameIndex + 1) % 4;
      }
    } else {
      this.frameIndex = 0; // 정지 프레임
    }
    
    const spriteX = ((avatarId % 8) * 16) + (this.frameIndex * 16);
    const spriteY = Math.floor(avatarId / 8) * 16;
    
    this.ctx.drawImage(
      this.spriteImage,
      spriteX, spriteY, 16, 16,  // 소스
      x, y, 32, 32               // 대상 (2배 확대)
    );
  }
}
```

---

## 모드별 애니메이션 규칙 ⭐

### Break 모드 (쉬는시간)

```css
[data-mode="break"] .avatar {
  /* GPU 가속 필수 */
  will-change: transform;
  transform: translateZ(0);
  
  /* 부유 애니메이션 */
  animation: float 3s ease-in-out infinite;
}

[data-mode="break"] .speech-bubble {
  animation: bubble-appear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  backdrop-filter: blur(10px); /* 반투명 배경 */
  box-shadow: 0 2px 8px var(--color-shadow);
}

@keyframes float {
  0%, 100% { transform: translateY(0) translateZ(0); }
  50% { transform: translateY(-5px) translateZ(0); }
}

@keyframes bubble-appear {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```

### Class 모드 (수업시간)

```css
[data-mode="class"] .avatar,
[data-mode="class"] .speech-bubble,
[data-mode="class"] .qr-code {
  /* 완전히 숨김 */
  display: none !important;
}

[data-mode="class"] .timer {
  /* 타이머 확대 */
  font-size: 96px;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

[data-mode="class"] .learning-card {
  /* 학습 카드 정지 (선택사항) */
  animation-play-state: paused;
}
```

### Work 모드 (업무)

```css
[data-mode="work"] .avatar,
[data-mode="work"] .speech-bubble,
[data-mode="work"] .qr-code,
[data-mode="work"] .learning-card,
[data-mode="work"] .ad {
  /* 모든 학생 관련 레이어 숨김 */
  display: none !important;
}

[data-mode="work"] body {
  /* 거의 빈 화면 */
  background: var(--color-chalkboard);
}

[data-mode="work"] .timer {
  /* Timer는 선택사항 */
  font-size: 48px;
  opacity: 0.5;
}
```

---

## GPU 가속 최적화 규칙 ⭐

### ✅ 권장 속성 (GPU 가속됨)

```css
/* Transform: translate, scale, rotate */
.element {
  transform: translate3d(0, 0, 0);
  /* 또는 */
  transform: translateX(100px) translateZ(0);
}

/* Opacity */
.element {
  opacity: 0.9;
}

/* Will-change 힌트 */
.avatar, .speech-bubble {
  will-change: transform, opacity;
}

/* 강제 레이어 생성 */
.layer {
  transform: translateZ(0);
  /* 또는 */
  backface-visibility: hidden;
}
```

### ❌ 비권장 속성 (CPU 렌더링)

```css
/* Layout 속성 (reflow 발생) */
.bad {
  left: 100px;      /* ❌ */
  top: 100px;       /* ❌ */
  width: 200px;     /* ❌ */
  height: 200px;    /* ❌ */
}

/* Paint 속성 (repaint 발생) */
.bad {
  background: red;              /* ❌ */
  box-shadow: 0 0 50px black;  /* ❌ (매우 무거움) */
  border-radius: 50%;          /* △ (간단한 것은 OK) */
}

/* Filter (CPU 부하 큼) */
.bad {
  filter: blur(20px);           /* ❌ */
  filter: brightness(1.5);      /* ❌ */
}
```

---

## 말풍선 컴포넌트

### HTML 구조
```html
<div class="speech-bubble" data-avatar="3">
  <div class="bubble-content">안녕하세요!</div>
  <div class="bubble-tail"></div>
</div>
```

### CSS 스타일
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
  
  /* GPU 가속 */
  will-change: transform, opacity;
  transform: translateZ(0);
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

/* 최대 5개 제한 구현 */
.speech-bubble:nth-child(n+6) {
  animation: fade-out 0.3s ease forwards;
}

@keyframes fade-out {
  to { opacity: 0; transform: scale(0.8) translateZ(0); }
}
```

---

## 학습 카드

### HTML 구조
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

### CSS 스타일
```css
.learning-card {
  width: 400px;
  height: 300px;
  background: var(--color-chalk);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  
  /* 3D 변환 */
  transform-style: preserve-3d;
  transition: transform 0.6s;
  
  /* GPU 가속 */
  will-change: transform;
  transform: translateZ(0);
}

.learning-card.flipped {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  backface-visibility: hidden;
}

.card-back {
  transform: rotateY(180deg);
}
```

---

## 모드 전환 트랜지션

```css
/* 300ms fade transition */
[data-mode] {
  transition: opacity 0.3s ease;
}

/* 모드 변경 애니메이션 */
@keyframes mode-transition {
  0% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 1; }
}

body[data-mode-changing] {
  animation: mode-transition 0.6s ease;
}
```

---

## 타이머 스타일

### Break 모드
```css
[data-mode="break"] .timer {
  position: fixed;
  top: 20px;
  right: 20px;
  font-size: 48px;
  color: var(--color-accent);
  font-family: var(--font-mono);
}
```

### Class 모드 (확대)
```css
[data-mode="class"] .timer {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 96px;
  font-weight: bold;
  color: var(--color-accent);
  text-shadow: 0 4px 8px rgba(0,0,0,0.3);
}
```

---

## 성능 체크리스트

### CSS 작성 시
- [ ] `transform` 사용 (`left/top` 대신)
- [ ] `will-change` 힌트 추가
- [ ] `translateZ(0)` 또는 `transform: translate3d()`
- [ ] `box-shadow` 최소화 (blur 값 작게)
- [ ] `filter: blur()` 사용 금지 (저사양 모드)
- [ ] `backdrop-filter` Break 모드만 사용

### 애니메이션 작성 시
- [ ] `requestAnimationFrame` 사용
- [ ] FPS 제한 (Break: 12 FPS)
- [ ] 동시 애니메이션 수 제한 (말풍선 5개)
- [ ] Class/Work 모드에서 비활성화

---

## 디버깅 도구

### Chrome DevTools 활용

```javascript
// FPS 측정
let fps = 0;
let lastTime = performance.now();

function measureFPS() {
  const now = performance.now();
  fps = 1000 / (now - lastTime);
  lastTime = now;
  console.log(`FPS: ${fps.toFixed(1)}`);
  requestAnimationFrame(measureFPS);
}

// 레이어 확인
// DevTools → More tools → Layers
// 녹색 = GPU 가속됨
```

### 성능 프로파일링

1. DevTools → Performance 탭
2. Record 시작
3. 1분간 정상 사용
4. 분석:
   - Scripting < 10%
   - Rendering < 30%
   - Painting < 20%
   - **Idle > 40%**

---

## 에셋 최적화

### 이미지 포맷

| 용도 | 포맷 | 설정 |
|------|------|------|
| 아바타 스프라이트 | PNG | 8-bit palette |
| QR 코드 | SVG | - |
| 아이콘 | SVG | - |
| 배경 텍스처 | PNG | 압축 |

### 아바타 스프라이트 최적화

```bash
# PNG 최적화 (무손실)
pngquant --quality=80-95 avatars-sprite.png

# 또는 ImageMagick
convert avatars-sprite.png -colors 256 -depth 8 avatars-sprite-optimized.png
```

---

## 폰트 최적화

```css
@font-face {
  font-family: 'Pretendard';
  src: url('/fonts/Pretendard-subset.woff2') format('woff2');
  font-display: swap;
  /* 한글 + 영문만 포함 (서브셋팅) */
  unicode-range: U+AC00-D7AF, U+0020-007E;
}
```

**서브셋팅 예시:**
```bash
pyftsubset Pretendard.ttf \
  --output-file=Pretendard-subset.woff2 \
  --flavor=woff2 \
  --unicodes=U+AC00-D7AF,U+0020-007E
```

---

## Changelog

### v0.4 (2025-10-12)
- ✅ 모드별 애니메이션 규칙 추가 (Break/Class/Work)
- ✅ 아바타 걷기 Canvas 구현 가이드
- ✅ GPU 가속 최적화 규칙 상세화
- ✅ 성능 체크리스트 추가
- ✅ 모드 전환 트랜지션 스타일

### v0.1 (2025-10-12)
- Initial style guide
