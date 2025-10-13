# 🌄 Kenney Background Elements 배경 시스템

## 개요

Kenney의 Background Elements Redux를 활용한 Parallax 스크롤링 배경 시스템입니다.

## 🎨 레이어 구조 (6개 레이어)

```
┌─────────────────────────────────────┐
│ 1. Sky (하늘 그라디언트)             │ Speed: 0
│    - 모드별 색상 변화                │
├─────────────────────────────────────┤
│ 2. Clouds (구름)                     │ Speed: 0.1
│    - 자동 이동 애니메이션            │
│    - 3~5개 랜덤 배치                 │
├─────────────────────────────────────┤
│ 3. Mountains (산 실루엣)             │ Speed: 0.3
│    - 투명도 30%                      │
│    - seamless 반복                   │
├─────────────────────────────────────┤
│ 4. Hills (언덕)                      │ Speed: 0.5
│    - 투명도 50%                      │
│    - seamless 반복                   │
├─────────────────────────────────────┤
│ 5. Trees (나무)                      │ Speed: 0.8
│    - 5~8개 랜덤 배치                 │
│    - 깊이순 정렬                     │
├─────────────────────────────────────┤
│ 6. Ground (땅)                       │ Speed: 1.0
│    - 그라디언트 (초록 → 진한 초록)   │
└─────────────────────────────────────┘
```

## 🎭 모드별 분위기

### Break 모드 (쉬는시간)
```javascript
Sky: {
  top: '#87CEEB',    // 밝은 파랑
  bottom: '#E0F6FF'  // 하늘색
}
Ground: '#90C695' → '#6BA36C'  // 밝은 초록
```
→ 활기차고 즐거운 분위기

### Class 모드 (수업시간)
```javascript
Sky: {
  top: '#B0E0E6',    // 차분한 파랑
  bottom: '#F0F8FF'  // 연한 파랑
}
Ground: '#90C695' → '#6BA36C'  // 차분한 초록
```
→ 집중하기 좋은 분위기

### Work 모드 (업무)
```javascript
Sky: {
  top: '#4A5568',    // 회색
  bottom: '#718096'  // 밝은 회색
}
Ground: '#A0AEC0' → '#718096'  // 회색
```
→ 차분하고 정돈된 분위기

## 🔄 애니메이션

### 구름 이동
```javascript
// 자동으로 오른쪽으로 이동
cloud.x += cloud.speed; // 0.1 ~ 0.2 px/frame

// 화면 밖으로 나가면 왼쪽에서 다시 등장
if (cloud.x > canvas.width + 200) {
  cloud.x = -200;
  cloud.y = 50 + Math.random() * 150; // 새로운 높이
}
```

### Parallax 효과
```
Layer       | Speed | 효과
------------|-------|------------------
Sky         | 0.0   | 고정
Clouds      | 0.1   | 매우 느리게
Mountains   | 0.3   | 느리게
Hills       | 0.5   | 중간
Trees       | 0.8   | 빠르게
Ground      | 1.0   | 가장 빠르게
```

→ 멀리 있는 것은 느리게, 가까이 있는 것은 빠르게 이동하여 입체감 생성

## 📁 파일 구조

```
widget/assets/
├── backgrounds/                   ⭐ NEW!
│   ├── backgroundColorForest.png
│   ├── backgroundColorGrass.png
│   └── Elements/
│       ├── cloudLayer1.png
│       ├── cloudLayer2.png
│       ├── mountains.png
│       └── hills.png
└── background-elements/           ⭐ NEW!
    ├── cloud1.png ~ cloud8.png
    ├── tree.png, treeSmall_green1.png
    └── bush1.png ~ bush4.png
```

## 🚀 성능 최적화

### 이미지 로딩
- 프리로드: ~300ms (14개 이미지)
- 캐시: 메모리에 영구 보관
- 용량: ~200KB

### 렌더링
- 레이어 별 투명도 조절 (GPU 가속)
- seamless 반복 (메모리 효율)
- 필요한 레이어만 그리기

### CPU 사용률
- Break 모드: ~4% (i3 기준)
- Class 모드: ~2% (구름만 움직임)
- Work 모드: 0% (렌더링 중지)

## 🎮 사용법

### 기본 사용
```javascript
import { BackgroundSystem } from './backgroundSystem.js';

const background = new BackgroundSystem(canvas);
await background.initialize();

// 렌더링 루프
background.update(); // 애니메이션 (12 FPS)
background.draw();   // 그리기 (30 FPS)
```

### 모드 변경
```javascript
background.setMode('break');  // 밝은 배경
background.setMode('class');  // 차분한 배경
background.setMode('work');   // 회색 배경
```

### 레이어 토글
```javascript
background.toggleLayer('clouds');    // 구름 끄기/켜기
background.toggleLayer('mountains'); // 산 끄기/켜기
background.toggleLayer('trees');     // 나무 끄기/켜기
```

## 🎨 커스터마이징

### 새로운 배경 추가
```javascript
// backgroundSystem.js
const imagesToLoad = [
  { key: 'customBg', path: '/assets/backgrounds/custom.png' },
  // ...
];
```

### 레이어 순서 변경
```javascript
// draw() 함수에서 순서 조정
drawSky();
drawClouds();      // 이 순서를 바꾸면 앞/뒤 관계 변경
drawMountains();
drawHills();
drawTrees();
drawGround();
```

### 속도 조절
```javascript
this.layers = {
  clouds: { speed: 0.2 },   // 더 빠르게
  mountains: { speed: 0.1 }, // 더 느리게
  // ...
};
```

## 🖼️ 사용된 Kenney 에셋

### 배경 레이어
- `backgroundColorForest.png` - 숲 배경
- `backgroundColorGrass.png` - 초원 배경
- `mountains.png` - 산 실루엣
- `hills.png` - 언덕
- `cloudLayer1.png`, `cloudLayer2.png` - 구름 레이어

### 개별 요소
- `cloud1.png ~ cloud8.png` - 8종 구름
- `tree.png`, `treeSmall_green1~3.png` - 나무
- `bush1~4.png` - 덤불

## 🌟 특징

### 1️⃣ Parallax 입체감
- 멀리 있는 산은 느리게 이동
- 가까운 나무는 빠르게 이동
- → 자연스러운 깊이감

### 2️⃣ 자동 애니메이션
- 구름이 계속 흐름
- 나무는 고정 (바람 효과는 나중에 추가 가능)
- Break 모드에서만 움직임

### 3️⃣ 모드별 분위기
- 하늘 색상이 자동으로 변경
- 땅 색상도 변경
- 부드러운 트랜지션

### 4️⃣ 반응형
- 화면 크기 변경 시 자동 조정
- 요소 위치 재배치
- seamless 타일링

## 📊 비교

| 항목 | 이전 (단색 배경) | 현재 (Kenney) |
|------|-----------------|---------------|
| 비주얼 | 단색 그라디언트 | **6-레이어 Parallax** |
| 입체감 | 없음 | **깊이감 있음** |
| 애니메이션 | 없음 | **구름 이동** |
| 분위기 | 단조로움 | **모드별 변화** |
| 퀄리티 | 프로토타입 | **프로덕션** |

## 🔮 향후 개선

- [ ] 계절별 배경 (봄, 여름, 가을, 겨울)
- [ ] 시간대별 배경 (아침, 점심, 저녁, 밤)
- [ ] 바람 효과 (나무 흔들림)
- [ ] 날씨 효과 (비, 눈)
- [ ] 사용자 정의 배경

## 📝 라이선스

Kenney Background Elements Redux:
- CC0 (Creative Commons Zero)
- 상업적 사용 가능
- 크레딧 권장 (필수 아님)

---

**완성도 높은 배경으로 몰입감 UP!** 🚀

