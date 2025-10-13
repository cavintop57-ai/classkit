/**
 * Kenney Toon Characters 1 아바타 시스템
 * 4종류 × 8개 걷기 애니메이션 = 32가지 조합
 */

export class ToonAvatarRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.characterImages = new Map();
        this.avatars = [];
        this.teacherAvatar = null;
        this.speechBubbleManager = new SpeechBubbleManager();
        
        // 캐릭터 타입 정의
        this.characterTypes = [
            'male-person',
            'female-person', 
            'male-adventurer',
            'female-adventurer'
        ];
        
        // 걷기 애니메이션 프레임 (8프레임)
        this.walkFrames = [0, 1, 2, 3, 4, 5, 6, 7];
        
        // 렌더링 설정
        this.avatarScale = 1.5; // 캐릭터 크기
        // 우주 배경이므로 groundY 제약 없음 (자유롭게 날아다님)
    }

    async initialize() {
        console.log('🎭 Toon Characters 로딩 시작...');
        
        try {
            // 각 캐릭터 타입별로 걷기 애니메이션 로드
            const loadPromises = [];
            
            for (const characterType of this.characterTypes) {
                for (const frame of this.walkFrames) {
                    const imageName = `character_${characterType.replace('-', '')}_walk${frame}.png`;
                    const imagePath = `./assets/toon-characters/${characterType}/${imageName}`;
                    
                    const loadPromise = this.loadImage(imagePath, `${characterType}_walk${frame}`);
                    loadPromises.push(loadPromise);
                }
            }
            
            await Promise.all(loadPromises);
            console.log('✅ Toon Characters 로딩 완료!');
            
        } catch (error) {
            console.error('❌ Toon Characters 로딩 실패:', error);
        }
    }

    loadImage(src, key) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.characterImages.set(key, img);
                resolve();
            };
            img.onerror = () => {
                console.warn(`⚠️ 이미지 로딩 실패: ${src}`);
                reject(new Error(`Failed to load ${src}`));
            };
            img.src = src;
        });
    }

    addAvatar(id, name) {
        // 캐릭터 타입 랜덤 선택
        const characterType = this.characterTypes[Math.floor(Math.random() * this.characterTypes.length)];
        
        // 우주에서 자유롭게 날아다님 - 화면 전체 영역
        const avatar = {
            id,
            name,
            characterType,
            x: Math.random() * (this.canvas.width - 100) + 50,
            y: Math.random() * (this.canvas.height - 100) + 50, // 화면 전체 Y 범위
            targetX: Math.random() * (this.canvas.width - 100) + 50,
            targetY: Math.random() * (this.canvas.height - 100) + 50, // 화면 전체 Y 범위
            dir: Math.random() < 0.5 ? 1 : -1, // 1: 오른쪽, -1: 왼쪽
            frame: 0,
            frameTime: 0,
            speed: 1 + Math.random() * 2, // 1-3 픽셀/프레임
            bounceOffset: 0,
            floatOffset: Math.random() * Math.PI * 2, // 떠다니는 효과용
            speechBubble: null,
            isMoving: true
        };
        
        this.avatars.push(avatar);
        return avatar;
    }

    update() {
        const currentTime = Date.now();
        
        // 학생 아바타 업데이트
        for (const avatar of this.avatars) {
            this.updateAvatarMovement(avatar);
            this.updateAvatarAnimation(avatar, currentTime);
            this.updateSpeechBubble(avatar, currentTime);
        }
        
        // 선생님 아바타 업데이트
        if (this.teacherAvatar) {
            this.updateTeacherAvatar(currentTime);
        }
    }

    updateAvatarMovement(avatar) {
        if (!avatar.isMoving) return;
        
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
            // 새 목표 설정 - 우주에서 자유롭게 날아다님
            avatar.targetX = Math.random() * (this.canvas.width - 100) + 50;
            avatar.targetY = Math.random() * (this.canvas.height - 100) + 50;
        }
        
        // 화면 경계 체크
        if (avatar.x < 50) avatar.x = 50;
        if (avatar.x > this.canvas.width - 50) avatar.x = this.canvas.width - 50;
        if (avatar.y < 50) avatar.y = 50;
        if (avatar.y > this.canvas.height - 50) avatar.y = this.canvas.height - 50;
        
        // 우주에서 떠다니는 효과 (부드러운 파동)
        avatar.floatOffset += 0.02;
        avatar.bounceOffset = Math.sin(avatar.floatOffset) * 5;
    }

    updateAvatarAnimation(avatar, currentTime) {
        if (avatar.isMoving) {
            avatar.frameTime += 16; // 60fps 기준
            if (avatar.frameTime >= 100) { // 10fps 애니메이션
                avatar.frameTime = 0;
                avatar.frame = (avatar.frame + 1) % this.walkFrames.length;
            }
        } else {
            avatar.frame = 0; // 정지 시 첫 번째 프레임
        }
    }

    updateSpeechBubble(avatar, currentTime) {
        if (avatar.speechBubble && avatar.speechBubble.endTime < currentTime) {
            avatar.speechBubble = null;
        }
    }

    updateTeacherAvatar(currentTime) {
        if (this.teacherAvatar) {
            this.teacherAvatar.bounceOffset = Math.sin(currentTime * 0.005) * 2;
        }
    }

    draw() {
        // 모든 아바타 그리기
        for (const avatar of this.avatars) {
            this.drawAvatar(avatar);
        }
        
        // 선생님 아바타 그리기
        if (this.teacherAvatar) {
            this.drawTeacherAvatar();
        }
    }

    drawAvatar(avatar) {
        const key = `${avatar.characterType}_walk${avatar.frame}`;
        const img = this.characterImages.get(key);
        
        if (!img) return;
        
        const x = avatar.x;
        const y = avatar.y + avatar.bounceOffset;
        const width = img.width * this.avatarScale;
        const height = img.height * this.avatarScale;
        
        // 캐릭터 그리기 (방향에 따라 뒤집기)
        this.ctx.save();
        if (avatar.dir < 0) {
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(img, -x - width, y, width, height);
        } else {
            this.ctx.drawImage(img, x, y, width, height);
        }
        this.ctx.restore();
        
        // 이름 표시
        this.drawName(avatar.name, x, y - 10);
        
        // 말풍선 표시
        if (avatar.speechBubble) {
            this.drawSpeechBubble(avatar.speechBubble, x, y - 20);
        }
    }

    drawName(name, x, y) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x - name.length * 4, y - 20, name.length * 8, 15);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(name, x, y - 8);
        this.ctx.restore();
    }

    drawSpeechBubble(bubble, x, y) {
        this.ctx.save();
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        
        const bubbleWidth = bubble.text.length * 8 + 20;
        const bubbleHeight = 30;
        
        // 말풍선 그리기
        this.ctx.fillRect(x - bubbleWidth/2, y - bubbleHeight, bubbleWidth, bubbleHeight);
        this.ctx.strokeRect(x - bubbleWidth/2, y - bubbleHeight, bubbleWidth, bubbleHeight);
        
        // 말풍선 꼬리
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x - 10, y - 10);
        this.ctx.lineTo(x + 10, y - 10);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // 텍스트
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(bubble.text, x, y - bubbleHeight/2 + 5);
        this.ctx.restore();
    }

    drawTeacherAvatar() {
        if (!this.teacherAvatar) return;
        
        // 선생님은 더 큰 캐릭터로 표시 (우주 중앙 상단)
        const teacherScale = this.avatarScale * 1.2;
        const x = this.canvas.width / 2;
        const y = this.canvas.height * 0.2 + this.teacherAvatar.bounceOffset; // 화면 상단 20% 위치
        
        // 선생님 캐릭터 그리기 (첫 번째 캐릭터 사용)
        const key = 'male-person_walk0';
        const img = this.characterImages.get(key);
        
        if (img) {
            const width = img.width * teacherScale;
            const height = img.height * teacherScale;
            this.ctx.drawImage(img, x - width/2, y, width, height);
        }
        
        // 선생님 이름
        this.drawName('선생님', x, y - 10);
        
        // 선생님 메시지
        if (this.teacherAvatar.message) {
            this.drawSpeechBubble({
                text: this.teacherAvatar.message,
                endTime: Date.now() + 3000
            }, x, y - 20);
        }
    }

    // 선생님 설정
    setTeacher(message = null) {
        this.teacherAvatar = {
            message,
            bounceOffset: 0
        };
    }

    // 학생 이름 설정
    setStudentNames(names) {
        for (let i = 0; i < Math.min(names.length, this.avatars.length); i++) {
            this.avatars[i].name = names[i];
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
