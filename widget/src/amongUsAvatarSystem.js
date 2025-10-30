/**
 * Among Us 스타일 아바타 시스템
 * 우주 배경에서 자유롭게 날아다니는 어몽어스 캐릭터
 */

export class AmongUsAvatarRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.avatars = [];
        this.teacherAvatar = null;
        this.speechBubbleManager = new SpeechBubbleManager();
        
        // 어몽어스 12가지 색상
        this.colors = [
            { name: 'red', primary: '#C51111', shadow: '#7A0838' },
            { name: 'blue', primary: '#132ED1', shadow: '#09158E' },
            { name: 'green', primary: '#117F2D', shadow: '#0A4D1E' },
            { name: 'pink', primary: '#ED54BA', shadow: '#A8137B' },
            { name: 'orange', primary: '#EF7D0E', shadow: '#B33E15' },
            { name: 'yellow', primary: '#F5F557', shadow: '#C0C02C' },
            { name: 'black', primary: '#3F474E', shadow: '#1E1F26' },
            { name: 'white', primary: '#D6E0F0', shadow: '#8394BF' },
            { name: 'purple', primary: '#6B2FBB', shadow: '#3B177C' },
            { name: 'brown', primary: '#71491E', shadow: '#5E370C' },
            { name: 'cyan', primary: '#38FEDC', shadow: '#24A77E' },
            { name: 'lime', primary: '#50EF39', shadow: '#15A742' }
        ];
        
        console.log('👾 Among Us 아바타 시스템 초기화');
    }

    async initialize() {
        console.log('🚀 Among Us 캐릭터 생성 준비 완료');
        // 프로시저럴 생성이므로 이미지 로딩 불필요
        return Promise.resolve();
    }

    addAvatar(id, name) {
        // 색상 랜덤 선택
        const colorIndex = id % this.colors.length;
        const color = this.colors[colorIndex];
        
        // 안전 영역 계산 (카드 영역 제외)
        const safeLeft = 280;  // QR 카드 + 여유
        const safeRight = this.canvas.width - 280;  // 학습 카드 영역
        const safeTop = 140;  // 상단 버튼들 + 여유
        const safeBottom = this.canvas.height - 120;  // 하단 여유
        
        // 우주에서 자유롭게 날아다님 (안전 영역 내)
        const avatar = {
            id,
            name,
            color,
            x: Math.random() * (safeRight - safeLeft) + safeLeft,
            y: Math.random() * (safeBottom - safeTop) + safeTop,
            targetX: Math.random() * (safeRight - safeLeft) + safeLeft,
            targetY: Math.random() * (safeBottom - safeTop) + safeTop,
            dir: Math.random() < 0.5 ? 1 : -1, // 1: 오른쪽, -1: 왼쪽
            speed: 0.8 + Math.random() * 1.5,
            floatOffset: Math.random() * Math.PI * 2,
            floatSpeed: 0.02 + Math.random() * 0.02,
            legFrame: 0,
            legTime: 0,
            speechBubble: null,
            scale: 1.0,
            isDead: false,
            // 랜덤 행동 추가
            isMoving: true,
            idleTime: 0,
            idleDuration: 0,
            nextIdleCheck: 2000 + Math.random() * 3000 // 2-5초 후 휴식 확인
        };
        
        this.avatars.push(avatar);
        return avatar;
    }

    update() {
        const currentTime = Date.now();
        
        // 아바타 업데이트
        for (const avatar of this.avatars) {
            if (!avatar.isDead) {
                this.updateAvatarMovement(avatar);
                this.updateAvatarAnimation(avatar, currentTime);
            }
            this.updateSpeechBubble(avatar, currentTime);
        }
        
        // 선생님 업데이트
        if (this.teacherAvatar) {
            this.teacherAvatar.floatOffset += 0.015;
            this.teacherAvatar.bounceOffset = Math.sin(this.teacherAvatar.floatOffset) * 8;
            this.updateSpeechBubble(this.teacherAvatar, currentTime);
        }
    }

    updateAvatarMovement(avatar) {
        const currentTime = Date.now();
        
        // 안전 영역 계산
        const safeLeft = 280;
        const safeRight = this.canvas.width - 280;
        const safeTop = 140;
        const safeBottom = this.canvas.height - 120;
        
        // 휴식 상태 체크
        if (!avatar.isMoving) {
            avatar.idleTime += 16; // ~60fps
            if (avatar.idleTime >= avatar.idleDuration) {
                // 다시 움직이기 시작
                avatar.isMoving = true;
                avatar.idleTime = 0;
                avatar.nextIdleCheck = currentTime + 2000 + Math.random() * 3000;
                
                // 새 목표 설정 (안전 영역 내)
                avatar.targetX = Math.random() * (safeRight - safeLeft) + safeLeft;
                avatar.targetY = Math.random() * (safeBottom - safeTop) + safeTop;
            }
            
            // 떠다니는 효과는 계속
            avatar.floatOffset += avatar.floatSpeed;
            return;
        }
        
        // 랜덤 휴식 체크 (20% 확률로 멈춤)
        if (currentTime > avatar.nextIdleCheck && Math.random() < 0.2) {
            avatar.isMoving = false;
            avatar.idleDuration = 1000 + Math.random() * 2000; // 1-3초 휴식
            avatar.idleTime = 0;
            return;
        }
        
        // 목표 지점으로 이동
        const dx = avatar.targetX - avatar.x;
        const dy = avatar.targetY - avatar.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            avatar.x += (dx / distance) * avatar.speed;
            avatar.y += (dy / distance) * avatar.speed;
            
            // 방향 업데이트
            avatar.dir = dx > 0 ? 1 : -1;
        } else {
            // 새 목표 설정 - 안전 영역 내
            avatar.targetX = Math.random() * (safeRight - safeLeft) + safeLeft;
            avatar.targetY = Math.random() * (safeBottom - safeTop) + safeTop;
        }
        
        // 안전 영역 경계 체크 (카드 영역 제외)
        if (avatar.x < safeLeft) avatar.x = safeLeft;
        if (avatar.x > safeRight) avatar.x = safeRight;
        if (avatar.y < safeTop) avatar.y = safeTop;
        if (avatar.y > safeBottom) avatar.y = safeBottom;
        
        // 우주에서 떠다니는 효과
        avatar.floatOffset += avatar.floatSpeed;
    }

    updateAvatarAnimation(avatar, currentTime) {
        // 다리 애니메이션 (움직일 때만)
        if (avatar.isMoving) {
            avatar.legTime += 16;
            if (avatar.legTime >= 150) {
                avatar.legTime = 0;
                avatar.legFrame = (avatar.legFrame + 1) % 2; // 2프레임 왕복
            }
        } else {
            // 멈춰있을 때는 기본 자세
            avatar.legFrame = 0;
        }
    }

    updateSpeechBubble(avatar, currentTime) {
        if (avatar.speechBubble && avatar.speechBubble.endTime < currentTime) {
            avatar.speechBubble = null;
        }
    }

    draw() {
        // 모든 아바타 그리기
        for (const avatar of this.avatars) {
            this.drawAvatar(avatar);
        }
        
        // 선생님 그리기
        if (this.teacherAvatar) {
            this.drawTeacherAvatar();
        }
    }

    drawAvatar(avatar) {
        const x = avatar.x;
        const y = avatar.y + Math.sin(avatar.floatOffset) * 5; // 떠다니는 효과
        const scale = avatar.scale;
        
        this.ctx.save();
        
        // 좌우 반전
        if (avatar.dir < 0) {
            this.ctx.scale(-1, 1);
            this.ctx.translate(-x * 2, 0);
        }
        
        // Among Us 캐릭터 그리기
        this.drawAmongUsCharacter(x, y, avatar.color, avatar.legFrame, scale, avatar.isDead);
        
        this.ctx.restore();
        
        // 이름 표시
        this.drawName(avatar.name, x, y - 50);
        
        // 말풍선
        if (avatar.speechBubble) {
            this.drawSpeechBubble(avatar.speechBubble, x, y - 60);
        }
    }

    drawAmongUsCharacter(x, y, color, legFrame, scale, isDead) {
        if (isDead) {
            this.drawDeadBody(x, y, color, scale);
            return;
        }
        
        const baseSize = 40 * scale;
        
        this.ctx.save();
        
        // 1. 몸통 (둥근 캡슐 모양)
        this.ctx.fillStyle = color.primary;
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, baseSize * 0.6, baseSize * 0.8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 2. 그림자 (오른쪽 하단)
        this.ctx.fillStyle = color.shadow;
        this.ctx.beginPath();
        this.ctx.ellipse(x + baseSize * 0.15, y + baseSize * 0.2, baseSize * 0.5, baseSize * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 3. 배낭 (뒤쪽)
        this.ctx.fillStyle = color.shadow;
        this.ctx.beginPath();
        this.ctx.roundRect(x - baseSize * 0.7, y - baseSize * 0.1, baseSize * 0.35, baseSize * 0.5, baseSize * 0.1);
        this.ctx.fill();
        
        // 4. 바이저 (유리창)
        this.ctx.fillStyle = '#a6d5e3';
        this.ctx.strokeStyle = '#7fb9c9';
        this.ctx.lineWidth = 2 * scale;
        this.ctx.beginPath();
        this.ctx.ellipse(x + baseSize * 0.2, y - baseSize * 0.15, baseSize * 0.45, baseSize * 0.35, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 5. 바이저 반사광
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.ellipse(x + baseSize * 0.15, y - baseSize * 0.25, baseSize * 0.15, baseSize * 0.1, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 6. 다리 (2개, 애니메이션)
        this.ctx.fillStyle = color.primary;
        const legOffset = legFrame === 0 ? 0 : 3 * scale;
        
        // 왼쪽 다리
        this.ctx.beginPath();
        this.ctx.roundRect(
            x - baseSize * 0.25, 
            y + baseSize * 0.6 + legOffset, 
            baseSize * 0.3, 
            baseSize * 0.25, 
            baseSize * 0.15
        );
        this.ctx.fill();
        
        // 오른쪽 다리
        this.ctx.beginPath();
        this.ctx.roundRect(
            x + baseSize * 0.05, 
            y + baseSize * 0.6 - legOffset, 
            baseSize * 0.3, 
            baseSize * 0.25, 
            baseSize * 0.15
        );
        this.ctx.fill();
        
        // 7. 다리 그림자
        this.ctx.fillStyle = color.shadow;
        this.ctx.globalAlpha = 0.5;
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + baseSize * 0.75, baseSize * 0.4, baseSize * 0.1, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawDeadBody(x, y, color, scale) {
        const baseSize = 40 * scale;
        
        this.ctx.save();
        
        // 죽은 몸 (옆으로 누운 모습)
        this.ctx.fillStyle = color.primary;
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, baseSize * 0.8, baseSize * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 뼈 튀어나온 모습
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.moveTo(x - baseSize * 0.3, y - baseSize * 0.2);
        this.ctx.lineTo(x - baseSize * 0.5, y - baseSize * 0.4);
        this.ctx.lineTo(x - baseSize * 0.4, y - baseSize * 0.1);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawName(name, x, y) {
        this.ctx.save();
        
        // 배경
        const textWidth = this.ctx.measureText(name).width || name.length * 8;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x - textWidth/2 - 8, y - 18, textWidth + 16, 20);
        
        // 텍스트
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(name, x, y - 8);
        
        this.ctx.restore();
    }

    /**
     * 텍스트를 최대 폭에 맞게 여러 줄로 나누기 (한글/영어 자동 처리)
     */
    wrapText(text, maxWidth, fontSize) {
        // undefined 또는 null 체크
        if (!text) {
            return [''];
        }
        
        this.ctx.font = `bold ${fontSize}px Arial`;
        
        const lines = [];
        let currentLine = '';
        
        // 공백으로 먼저 나누기 (영어 단어 단위)
        const words = text.split(' ');
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = this.ctx.measureText(testLine);
            
            if (metrics.width > maxWidth) {
                if (currentLine) {
                    // 현재 줄 저장
                    lines.push(currentLine);
                    currentLine = word;
                    
                    // 단어 자체가 너무 긴 경우 (한글 등)
                    const wordMetrics = this.ctx.measureText(word);
                    if (wordMetrics.width > maxWidth) {
                        // 글자 단위로 나누기
                        let charLine = '';
                        for (let j = 0; j < word.length; j++) {
                            const testChar = charLine + word[j];
                            const charMetrics = this.ctx.measureText(testChar);
                            
                            if (charMetrics.width > maxWidth && charLine) {
                                lines.push(charLine);
                                charLine = word[j];
                            } else {
                                charLine = testChar;
                            }
                        }
                        currentLine = charLine;
                    }
                } else {
                    // 첫 단어가 너무 긴 경우
                    let charLine = '';
                    for (let j = 0; j < word.length; j++) {
                        const testChar = charLine + word[j];
                        const charMetrics = this.ctx.measureText(testChar);
                        
                        if (charMetrics.width > maxWidth && charLine) {
                            lines.push(charLine);
                            charLine = word[j];
                        } else {
                            charLine = testChar;
                        }
                    }
                    currentLine = charLine;
                }
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.length > 0 ? lines : [text];
    }

    drawSpeechBubble(bubble, x, y, isTeacher = false) {
        this.ctx.save();
        
        // 선생님 말풍선은 더 크게
        const fontSize = isTeacher ? 20 : 14;
        const padding = isTeacher ? 30 : 20;
        const lineHeight = isTeacher ? 28 : 20;
        const maxWidth = isTeacher ? 250 : 200; // 최대 폭 설정 (300 → 250)
        
        // 텍스트를 여러 줄로 나누기
        const lines = this.wrapText(bubble.text, maxWidth, fontSize);
        
        // 실제 텍스트 너비 측정 (각 줄의 최대 너비 계산)
        this.ctx.font = `bold ${fontSize}px Arial`;
        let actualMaxWidth = 0;
        lines.forEach(line => {
            const lineWidth = this.ctx.measureText(line).width;
            if (lineWidth > actualMaxWidth) {
                actualMaxWidth = lineWidth;
            }
        });
        
        // 말풍선 크기 계산 (실제 텍스트 너비에 비례, 최소 너비 보장)
        let bubbleWidth;
        if (isTeacher) {
            // 교사용: 고정 너비 사용
            bubbleWidth = Math.min(maxWidth + padding * 2, 270);
        } else {
            // 학생용: 실제 텍스트 너비에 비례, 여백 최소화
            const minWidth = 100; // 최소 너비
            const calculatedWidth = actualMaxWidth + padding * 2;
            bubbleWidth = Math.max(minWidth, Math.min(calculatedWidth, 400)); // 최대 400px
        }
        
        const bubbleHeight = lines.length * lineHeight + padding * 1.5;
        const bubbleX = x - bubbleWidth/2;
        const bubbleY = y - bubbleHeight - 10;
        
        // 말풍선 배경 (선생님은 금색 테두리)
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = isTeacher ? '#FFD700' : '#333';
        this.ctx.lineWidth = isTeacher ? 4 : 2;
        this.ctx.beginPath();
        this.ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, isTeacher ? 15 : 8);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 선생님 말풍선 배경 하이라이트
        if (isTeacher) {
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
            this.ctx.beginPath();
            this.ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 15);
            this.ctx.fill();
        }
        
        // 말풍선 꼬리
        const tailSize = isTeacher ? 12 : 8;
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = isTeacher ? '#FFD700' : '#333';
        this.ctx.lineWidth = isTeacher ? 4 : 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - 10);
        this.ctx.lineTo(x - tailSize, bubbleY + bubbleHeight);
        this.ctx.lineTo(x + tailSize, bubbleY + bubbleHeight);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // 여러 줄 텍스트 렌더링
        this.ctx.fillStyle = isTeacher ? '#1a1a1a' : '#333';
        this.ctx.font = `bold ${fontSize}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const startY = bubbleY + padding;
        lines.forEach((line, index) => {
            this.ctx.fillText(line, x, startY + index * lineHeight);
        });
        
        this.ctx.restore();
    }

    drawTeacherAvatar() {
        if (!this.teacherAvatar) return;
        
        // 선생님 위치: QR 코드 카드 위 (좌측 하단)
        const x = 140; // QR 코드 카드 중앙 (left 40px + width 200px / 2)
        const y = this.canvas.height - 355 + this.teacherAvatar.bounceOffset; // 위로 200px 추가 이동
        const scale = 1.8; // 선생님 크기 약간 축소 (2.0 → 1.8)
        
        // 선생님용 특별 색상 (금색)
        const teacherColor = {
            name: 'teacher',
            primary: '#FFD700',
            shadow: '#FFA500'
        };
        
        this.drawAmongUsCharacter(x, y, teacherColor, 0, scale, false);
        
        // 선생님 표시 (왕관) - 크기에 맞춰 조정 (머리 위에 자연스럽게)
        const baseSize = 40 * scale;
        this.drawCrown(x, y - baseSize * 0.7);
        
        // 이름 (아바타 머리 위에 자연스럽게)
        this.drawName('선생님', x, y - baseSize * 1.0);
        
        // 메시지 (더 위쪽에 표시, 선생님 전용 스타일)
        if (this.teacherAvatar.speechBubble) {
            this.drawSpeechBubble(this.teacherAvatar.speechBubble, x, y - 105, true); // isTeacher = true
        }
    }

    drawCrown(x, y) {
        this.ctx.save();
        this.ctx.fillStyle = '#FFD700';
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 2;
        
        // 왕관 그리기
        this.ctx.beginPath();
        this.ctx.moveTo(x - 20, y);
        this.ctx.lineTo(x - 15, y - 12);
        this.ctx.lineTo(x - 10, y - 5);
        this.ctx.lineTo(x, y - 15);
        this.ctx.lineTo(x + 10, y - 5);
        this.ctx.lineTo(x + 15, y - 12);
        this.ctx.lineTo(x + 20, y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // 보석들
        this.ctx.fillStyle = '#FF1744';
        for (let i = -1; i <= 1; i++) {
            this.ctx.beginPath();
            this.ctx.arc(x + i * 10, y - (i === 0 ? 12 : 8), 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    // 선생님 설정
    setTeacher(message = null) {
        this.teacherAvatar = {
            speechBubble: message ? {
                text: message,
                endTime: Date.now() + 600000 // 10분
            } : null,
            bounceOffset: 0,
            floatOffset: 0
        };
    }

    // 학생 이름 설정
    setStudentNames(names) {
        for (let i = 0; i < Math.min(names.length, this.avatars.length); i++) {
            this.avatars[i].name = names[i];
        }
    }

    // 아바타 색상 변경
    updateAvatarColor(avatarIndex, colorId) {
        const avatar = this.avatars[avatarIndex];
        if (avatar && colorId >= 1 && colorId <= this.colors.length) {
            const colorIndex = (colorId - 1) % this.colors.length;
            avatar.color = this.colors[colorIndex];
            console.log(`🎨 아바타 색상 변경: ${avatar.name} → ${avatar.color.name}`);
        }
    }

    // 말풍선 추가
    addSpeechBubble(avatarId, text, duration = 3000) {
        const avatar = this.avatars.find(a => a.id === avatarId);
        if (avatar) {
            avatar.speechBubble = {
                text,
                endTime: Date.now() + duration
            };
        }
    }

    // 아바타 제거
    killAvatar(avatarId) {
        const avatar = this.avatars.find(a => a.id === avatarId);
        if (avatar) {
            avatar.isDead = true;
        }
    }

    // 모든 아바타 제거
    clearAllAvatars() {
        this.avatars = [];
        this.teacherAvatar = null;
    }

    // 캔버스 정리
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

class SpeechBubbleManager {
    constructor() {
        this.bubbles = [];
    }

    addBubble(x, y, text, duration = 3000) {
        this.bubbles.push({
            x, y, text,
            startTime: Date.now(),
            endTime: Date.now() + duration
        });
    }

    update() {
        const currentTime = Date.now();
        this.bubbles = this.bubbles.filter(bubble => bubble.endTime > currentTime);
    }

    draw(ctx) {
        for (const bubble of this.bubbles) {
            // 말풍선 그리기 로직
        }
    }
}

