# 👾 Among Us 스타일 아바타 시스템

## 🚀 개요

**Among Us**의 상징적인 캡슐 모양 우주인 캐릭터를 Canvas 2D로 프로시저럴하게 생성합니다!

## ✨ 주요 특징

### 1. **12가지 색상**
- 🔴 Red (빨강)
- 🔵 Blue (파랑)
- 🟢 Green (초록)
- 🩷 Pink (분홍)
- 🟠 Orange (주황)
- 🟡 Yellow (노랑)
- ⚫ Black (검정)
- ⚪ White (하양)
- 🟣 Purple (보라)
- 🟤 Brown (갈색)
- 🔵 Cyan (청록)
- 🟢 Lime (연두)

### 2. **프로시저럴 렌더링**
- ✅ 이미지 파일 불필요
- ✅ Canvas 2D로 실시간 그리기
- ✅ 초경량 (0KB 추가 용량)
- ✅ 무한 확장 가능

### 3. **Among Us 특징 재현**

#### 몸통
```javascript
// 둥근 캡슐 모양
ctx.ellipse(x, y, width * 0.6, height * 0.8);
```

#### 바이저 (유리창)
```javascript
// 반투명 하늘색 타원
ctx.fillStyle = '#a6d5e3';
ctx.ellipse(x + offset, y - offset, width * 0.45, height * 0.35);
```

#### 배낭
```javascript
// 뒤쪽 작은 사각형
ctx.roundRect(x - offset, y, width, height, radius);
```

#### 다리
```javascript
// 2개의 둥근 다리 (애니메이션)
// 왼쪽 다리 ↑ / 오른쪽 다리 ↓ (프레임 0)
// 왼쪽 다리 ↓ / 오른쪽 다리 ↑ (프레임 1)
```

### 4. **우주에서 날아다니기**

#### 자유로운 이동
```javascript
// 화면 전체 영역을 목표로 설정
targetX: Math.random() * canvas.width
targetY: Math.random() * canvas.height
```

#### 떠다니는 효과
```javascript
// sin 파동으로 부드러운 부유감
y += Math.sin(floatOffset) * 5
floatOffset += 0.02
```

#### 다양한 속도
```javascript
speed: 0.8 ~ 2.3 픽셀/프레임
```

### 5. **특별한 선생님 캐릭터**

#### 금색 Among Us
```javascript
color: {
  primary: '#FFD700',  // 금색
  shadow: '#FFA500'    // 오렌지 그림자
}
```

#### 왕관 착용
```javascript
// 7개의 점이 있는 왕관
// 빨간 보석 장식
```

#### 더 큰 크기
```javascript
scale: 1.5 (학생은 1.0)
```

## 🎨 렌더링 순서

```
7. 이름 텍스트
6. 말풍선 (있는 경우)
5. 다리 그림자
4. 다리 (2개, 애니메이션)
3. 바이저 반사광
2. 바이저 (유리창)
1. 배낭 (뒤쪽)
0. 몸통 + 그림자
```

## 📐 크기 및 비율

### 캐릭터 크기
```javascript
baseSize: 40px
width: baseSize * 0.6 = 24px
height: baseSize * 0.8 = 32px
```

### 바이저
```javascript
width: baseSize * 0.45 = 18px
height: baseSize * 0.35 = 14px
offset: baseSize * 0.2 (오른쪽 위)
```

### 다리
```javascript
width: baseSize * 0.3 = 12px
height: baseSize * 0.25 = 10px
간격: baseSize * 0.3 = 12px
```

## 🎮 애니메이션

### 걷기 애니메이션 (2프레임)
```javascript
Frame 0: 왼쪽 다리 ↑, 오른쪽 다리 ↓
Frame 1: 왼쪽 다리 ↓, 오른쪽 다리 ↑
Speed: 150ms/프레임
```

### 떠다니는 애니메이션
```javascript
sin(floatOffset) * 5px
floatSpeed: 0.02 ~ 0.04
```

## 🎯 우주 배경과의 완벽한 조화

### 시각적 조화
- 우주 배경의 어두운 색상 → Among Us의 밝은 색상이 돋보임
- 반짝이는 별 → 움직이는 우주인
- 회전하는 행성 → 날아다니는 캐릭터

### 테마 일관성
- 🌌 우주 배경 + 👾 우주인 캐릭터 = 완벽한 조합
- 우주선 안이 아닌 우주 공간에서 자유롭게 활동
- 학생들이 우주 탐험가가 된 느낌

## 🔧 성능

### 초경량 시스템
```javascript
이미지 로딩: 0개
메모리 사용: 최소
렌더링: Canvas 2D Path (매우 빠름)
확장성: 무제한
```

### 최적화 포인트
1. **간단한 도형**: 타원, 사각형만 사용
2. **캐싱 불필요**: 매번 그려도 빠름
3. **색상만 변경**: 12가지 색상 = 12가지 캐릭터
4. **애니메이션**: 2프레임만으로 충분

## 🎨 색상 선택 전략

### 학생 ID 기반
```javascript
colorIndex = studentId % 12
```
- 같은 학생 = 항상 같은 색상
- 12명마다 색상 순환
- 쉽게 구별 가능

### 색상별 특징
- **Red**: 리더십, 활발함
- **Blue**: 차분함, 신뢰
- **Green**: 성장, 자연
- **Pink**: 친근함, 귀여움
- **Orange**: 열정, 에너지
- **Yellow**: 밝음, 긍정
- **Black**: 카리스마, 멋짐
- **White**: 순수, 깔끔
- **Purple**: 창의력, 독특함
- **Brown**: 안정감, 든든함
- **Cyan**: 시원함, 신선함
- **Lime**: 활력, 생기

## 🎭 선생님 캐릭터

### 금색 우주인
- 특별한 금색 (`#FFD700`)
- 오렌지 그림자 (`#FFA500`)
- 1.5배 큰 크기

### 왕관
- 7개의 뾰족한 점
- 빨간 보석 3개
- 리더십과 권위 표현

### 중앙 상단 배치
- 화면 중앙 상단 (15% 위치)
- 우주 탐험대의 리더
- 학생들을 이끄는 모습

## 🎊 완성!

이제 우리반 위젯에서:

1. 🌌 **아름다운 우주 배경**
   - 반짝이는 별 200-300개
   - 회전하는 행성 3-5개
   - 흐르는 우주 먼지 50-80개

2. 👾 **귀여운 Among Us 캐릭터**
   - 12가지 색상의 우주인
   - 우주를 자유롭게 날아다님
   - 다리 애니메이션 + 떠다니는 효과

3. 👑 **금색 선생님**
   - 왕관을 쓴 금색 우주인
   - 중앙 상단에서 학생들을 지켜봄
   - 응원 메시지 표시

을 볼 수 있습니다!

**학생들의 반응**: "우와! 우리가 우주에서 공부하는 거야?!" 🚀✨

