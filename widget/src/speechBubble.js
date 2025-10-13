// widget/src/speechBubble.js

// 기본 상수 (학생 아바타 48px 기준)
const BASE_AVATAR_SIZE = 48;
const BUBBLE_PADDING = 12;
const BUBBLE_MAX_WIDTH = 200; // 기본 너비
const BUBBLE_FONT_SIZE = 14; // 기본 폰트 크기
const BUBBLE_LINE_HEIGHT = 18; // 기본 줄 높이
const BUBBLE_LIFETIME = 10000; // 10초 후 자동 사라짐
const BUBBLE_TAIL_SIZE = 8; // 기본 꼬리 크기

export class SpeechBubble {
  constructor(content, avatarX, avatarY, avatarSize, ctx = null) {
    this.content = content;
    this.avatarX = avatarX;
    this.avatarY = avatarY;
    this.avatarSize = avatarSize;
    this.createdAt = Date.now();
    this.alpha = 1.0; // 투명도 (페이드아웃 효과)
    this.ctx = ctx; // Canvas context 저장
    
    // 아바타 크기에 따른 비례 계산
    const scale = avatarSize / BASE_AVATAR_SIZE;
    this.fontSize = Math.max(10, Math.round(BUBBLE_FONT_SIZE * scale));
    this.lineHeight = Math.max(14, Math.round(BUBBLE_LINE_HEIGHT * scale));
    this.padding = Math.max(8, Math.round(BUBBLE_PADDING * scale));
    this.tailSize = Math.max(4, Math.round(BUBBLE_TAIL_SIZE * scale));
    this.maxWidth = Math.max(150, Math.round(BUBBLE_MAX_WIDTH * scale * 1.5)); // 더 넓게
    
    // 텍스트를 줄바꿈 처리
    this.lines = this.wrapText(content, this.maxWidth);
    
    // 말풍선 크기 계산
    this.width = this.calculateWidth();
    this.height = this.lines.length * this.lineHeight + this.padding * 2;
    
    // 말풍선 위치 (아바타 위 중앙)
    this.x = avatarX + avatarSize / 2 - this.width / 2;
    this.y = avatarY - this.height - this.tailSize - 5;
  }
  
  wrapText(text, maxWidth) {
    if (!this.ctx) {
      // Canvas context가 없으면 기본 로직 사용
      return [text];
    }
    
    // Canvas measureText를 사용한 정확한 줄바꿈
    this.ctx.save();
    this.ctx.font = `${this.fontSize}px Pretendard, sans-serif`;
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = this.ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    this.ctx.restore();
    return lines.length > 0 ? lines : [text];
  }
  
  calculateWidth() {
    if (!this.ctx) {
      // Canvas context가 없으면 대략적 계산
      let maxWidth = 0;
      for (const line of this.lines) {
        const width = line.length * (this.fontSize * 0.6);
        if (width > maxWidth) {
          maxWidth = width;
        }
      }
      return maxWidth + this.padding * 2;
    }
    
    // Canvas measureText를 사용한 정확한 너비 계산
    this.ctx.save();
    this.ctx.font = `${this.fontSize}px Pretendard, sans-serif`;
    
    let maxWidth = 0;
    for (const line of this.lines) {
      const metrics = this.ctx.measureText(line);
      if (metrics.width > maxWidth) {
        maxWidth = metrics.width;
      }
    }
    
    this.ctx.restore();
    return maxWidth + this.padding * 2;
  }
  
  update(avatarX, avatarY) {
    // 아바타가 움직이면 말풍선도 따라 이동
    const deltaX = avatarX - this.avatarX;
    const deltaY = avatarY - this.avatarY;
    
    this.x += deltaX;
    this.y += deltaY;
    this.avatarX = avatarX;
    this.avatarY = avatarY;
    
    // 시간 경과에 따라 페이드아웃
    const elapsed = Date.now() - this.createdAt;
    if (elapsed > BUBBLE_LIFETIME - 1000) {
      // 마지막 1초 동안 페이드아웃
      this.alpha = Math.max(0, 1 - (elapsed - (BUBBLE_LIFETIME - 1000)) / 1000);
    }
  }
  
  isExpired() {
    return Date.now() - this.createdAt > BUBBLE_LIFETIME;
  }
  
  draw(ctx) {
    if (this.alpha <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = this.alpha;
    
    // 말풍선 배경
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    
    // 둥근 사각형 그리기 (동적 반지름)
    const radius = Math.max(4, Math.round(8 * (this.avatarSize / BASE_AVATAR_SIZE)));
    ctx.beginPath();
    ctx.moveTo(this.x + radius, this.y);
    ctx.lineTo(this.x + this.width - radius, this.y);
    ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
    ctx.lineTo(this.x + this.width, this.y + this.height - radius);
    ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
    ctx.lineTo(this.x + radius, this.y + this.height);
    ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
    ctx.lineTo(this.x, this.y + radius);
    ctx.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    // 말풍선 꼬리 (삼각형)
    const tailX = this.x + this.width / 2;
    const tailY = this.y + this.height;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(tailX - this.tailSize, tailY + this.tailSize);
    ctx.lineTo(tailX + this.tailSize, tailY + this.tailSize);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#333333';
    ctx.stroke();
    
    // 텍스트 그리기
    ctx.fillStyle = '#333333';
    ctx.font = `${this.fontSize}px Pretendard, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    for (let i = 0; i < this.lines.length; i++) {
      ctx.fillText(
        this.lines[i],
        this.x + this.padding,
        this.y + this.padding + i * this.lineHeight
      );
    }
    
    ctx.restore();
  }
}

