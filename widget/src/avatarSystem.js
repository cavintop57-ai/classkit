/**
 * 고급 아바타 시스템 (Kenney Mini-Characters 기반)
 * 
 * 특징:
 * - 실제 Kenney 에셋 사용 (전문 디자이너 퀄리티)
 * - 레이어 기반 시스템 (캐릭터 + 액세서리)
 * - 커스터마이징 가능 (학생이 편집 가능)
 * - 경량화 (PNG 프리로드)
 * - 4프레임 걷기 애니메이션
 */

// 캐릭터 타입 정의
export const CHARACTER_TYPES = {
  MALE: ['male-a', 'male-b', 'male-c', 'male-d', 'male-e', 'male-f'],
  FEMALE: ['female-a', 'female-b', 'female-c', 'female-d', 'female-e', 'female-f']
};

// 액세서리 타입 정의
export const ACCESSORY_TYPES = {
  GLASSES: 'aid-glasses',
  SUNGLASSES: 'aid-sunglasses',
  MASK: 'aid-mask',
  HEARING_AID: 'aid_hearing',
  NONE: null
};

// 이미지 캐시
const imageCache = new Map();

/**
 * 이미지 프리로드
 * @param {string[]} imagePaths - 로드할 이미지 경로들
 * @returns {Promise<void>}
 */
export async function preloadImages(imagePaths) {
  const promises = imagePaths.map(path => {
    return new Promise((resolve, reject) => {
      if (imageCache.has(path)) {
        resolve(imageCache.get(path));
        return;
      }

      const img = new Image();
      img.onload = () => {
        imageCache.set(path, img);
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`Failed to load: ${path}`);
        resolve(null);
      };
      img.src = path;
    });
  });

  await Promise.all(promises);
}

/**
 * 아바타 구성 클래스
 */
export class AvatarConfig {
  constructor(options = {}) {
    this.gender = options.gender || 'male';
    this.characterType = options.characterType || 'male-a';
    this.accessory = options.accessory || null;
    this.scale = options.scale || 1.0;
    this.name = options.name || 'Student';
  }

  /**
   * 시드 기반 랜덤 생성
   */
  static fromSeed(seed, name = 'Student') {
    const hash = hashString(seed);
    const gender = (hash & 1) === 0 ? 'male' : 'female';
    const types = CHARACTER_TYPES[gender.toUpperCase()];
    const characterType = types[hash % types.length];
    
    // 액세서리는 30% 확률
    const accessories = Object.values(ACCESSORY_TYPES);
    const accessory = ((hash >> 8) % 10) < 3 
      ? accessories[(hash >> 16) % (accessories.length - 1)]
      : null;

    return new AvatarConfig({
      gender,
      characterType,
      accessory,
      name
    });
  }

  /**
   * JSON으로 직렬화
   */
  toJSON() {
    return {
      gender: this.gender,
      characterType: this.characterType,
      accessory: this.accessory,
      scale: this.scale,
      name: this.name
    };
  }

  /**
   * JSON에서 복원
   */
  static fromJSON(json) {
    return new AvatarConfig(json);
  }
}

/**
 * 문자열 해시 함수
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * 고급 아바타 렌더러
 */
export class AvatarRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.avatars = [];
    this.frameCounter = 0;
    
    // 렌더링 설정
    this.baseSize = 64; // Kenney 캐릭터 기본 크기
    this.boundaryLeft = 50;
    this.boundaryRight = canvas.width - 50;
    this.boundaryTop = Math.floor(canvas.height * 0.35);
    this.boundaryBottom = Math.floor(canvas.height * 0.85);
    
    // 선생님 아바타
    this.teacherAvatar = {
      id: 'teacher',
      config: new AvatarConfig({
        gender: 'male',
        characterType: 'male-a',
        accessory: 'aid-glasses',
        scale: 1.5,
        name: '선생님'
      }),
      x: canvas.width / 2,
      y: canvas.height / 2,
      frame: 0,
      message: null,
      messageVisible: false
    };

    console.log('✅ Kenney Mini-Characters 아바타 시스템 초기화');
  }

  /**
   * 모든 필요한 이미지 프리로드
   */
  async initialize() {
    const imagePaths = [];
    
    // 모든 캐릭터 타입
    [...CHARACTER_TYPES.MALE, ...CHARACTER_TYPES.FEMALE].forEach(type => {
      imagePaths.push(`/assets/characters/character-${type}.png`);
    });
    
    // 액세서리
    Object.values(ACCESSORY_TYPES).forEach(accessory => {
      if (accessory) {
        imagePaths.push(`/assets/characters/${accessory}.png`);
      }
    });

    await preloadImages(imagePaths);
    console.log('✅ 캐릭터 이미지 로드 완료');
  }

  /**
   * 학생 아바타 추가
   */
  addAvatar(studentId, name) {
    const seed = `${name}-${studentId}`;
    const config = AvatarConfig.fromSeed(seed, name);
    
    const avatar = {
      id: `student-${studentId}`,
      config: config,
      x: this.boundaryLeft + Math.random() * (this.boundaryRight - this.boundaryLeft),
      y: this.boundaryTop + Math.random() * (this.boundaryBottom - this.boundaryTop),
      targetX: 0,
      targetY: 0,
      speed: 0.5 + Math.random() * 0.5,
      frame: 0,
      direction: Math.random() < 0.5 ? 1 : -1,
      speechBubble: null
    };

    // 초기 타겟 설정
    this.setRandomTarget(avatar);
    
    this.avatars.push(avatar);
    return avatar;
  }

  /**
   * 랜덤 타겟 위치 설정
   */
  setRandomTarget(avatar) {
    avatar.targetX = this.boundaryLeft + Math.random() * (this.boundaryRight - this.boundaryLeft);
    avatar.targetY = this.boundaryTop + Math.random() * (this.boundaryBottom - this.boundaryTop);
  }

  /**
   * 아바타 업데이트 (12 FPS)
   */
  update() {
    this.frameCounter++;

    // 학생 아바타 업데이트
    this.avatars.forEach(avatar => {
      const dx = avatar.targetX - avatar.x;
      const dy = avatar.targetY - avatar.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 타겟에 가까워지면 새 타겟 설정
      if (distance < 5) {
        this.setRandomTarget(avatar);
      } else {
        // 타겟을 향해 이동
        avatar.x += (dx / distance) * avatar.speed;
        avatar.y += (dy / distance) * avatar.speed;
        
        // 방향 설정 (좌우 반전)
        avatar.direction = dx > 0 ? 1 : -1;
      }

      // 애니메이션 프레임 (0~3)
      avatar.frame = (this.frameCounter >> 2) & 3; // 4프레임마다 변경
    });

    // 선생님 위치 업데이트
    this.teacherAvatar.x = this.canvas.width / 2;
    this.teacherAvatar.y = this.canvas.height / 2;
    this.teacherAvatar.frame = (this.frameCounter >> 3) & 3; // 더 느리게
  }

  /**
   * 아바타 그리기
   */
  draw() {
    // 학생 아바타들
    this.avatars.forEach(avatar => {
      this.drawAvatar(avatar);
    });

    // 선생님 아바타
    this.drawAvatar(this.teacherAvatar);
  }

  /**
   * 개별 아바타 그리기
   */
  drawAvatar(avatar) {
    const { config, x, y, frame, direction } = avatar;
    const size = this.baseSize * config.scale;

    this.ctx.save();
    
    // 중심점을 아바타 하단으로 설정
    const centerX = x;
    const centerY = y;

    // 좌우 반전
    if (direction < 0) {
      this.ctx.translate(centerX, centerY);
      this.ctx.scale(-1, 1);
      this.ctx.translate(-centerX, -centerY);
    }

    // 걷기 애니메이션 (상하 바운스)
    const bounce = frame === 1 || frame === 3 ? -2 : 0;

    // 캐릭터 이미지
    const charPath = `/assets/characters/character-${config.characterType}.png`;
    const charImg = imageCache.get(charPath);
    
    if (charImg) {
      this.ctx.imageSmoothingEnabled = false; // 픽셀 아트 선명하게
      this.ctx.drawImage(
        charImg,
        centerX - size / 2,
        centerY - size + bounce,
        size,
        size
      );
    }

    // 액세서리
    if (config.accessory) {
      const accPath = `/assets/characters/${config.accessory}.png`;
      const accImg = imageCache.get(accPath);
      
      if (accImg) {
        this.ctx.drawImage(
          accImg,
          centerX - size / 2,
          centerY - size + bounce,
          size,
          size
        );
      }
    }

    this.ctx.restore();

    // 이름 표시
    this.drawName(avatar);

    // 말풍선
    if (avatar.speechBubble) {
      this.drawSpeechBubble(avatar);
    }
  }

  /**
   * 이름 표시
   */
  drawName(avatar) {
    const { config, x, y } = avatar;
    const size = this.baseSize * config.scale;

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.lineWidth = 3;
    this.ctx.font = avatar.id === 'teacher' 
      ? 'bold 14px "Pretendard", sans-serif'
      : 'bold 11px "Pretendard", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';

    const nameY = y + 5;
    this.ctx.strokeText(config.name, x, nameY);
    this.ctx.fillText(config.name, x, nameY);
    this.ctx.restore();
  }

  /**
   * 말풍선 그리기
   */
  drawSpeechBubble(avatar) {
    if (!avatar.speechBubble) return;

    const { message } = avatar.speechBubble;
    const size = this.baseSize * avatar.config.scale;
    const bubbleX = avatar.x;
    const bubbleY = avatar.y - size - 10;

    this.ctx.save();
    
    // 말풍선 배경
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.lineWidth = 2;
    
    const padding = 8;
    const fontSize = 12;
    this.ctx.font = `${fontSize}px "Pretendard", sans-serif`;
    const textWidth = this.ctx.measureText(message).width;
    const bubbleWidth = textWidth + padding * 2;
    const bubbleHeight = fontSize + padding * 2;
    
    const bx = bubbleX - bubbleWidth / 2;
    const by = bubbleY - bubbleHeight;

    // 둥근 사각형
    this.ctx.beginPath();
    this.ctx.roundRect(bx, by, bubbleWidth, bubbleHeight, 8);
    this.ctx.fill();
    this.ctx.stroke();

    // 꼬리
    this.ctx.beginPath();
    this.ctx.moveTo(bubbleX, bubbleY);
    this.ctx.lineTo(bubbleX - 8, by + bubbleHeight);
    this.ctx.lineTo(bubbleX + 8, by + bubbleHeight);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // 텍스트
    this.ctx.fillStyle = '#000000';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(message, bubbleX, by + bubbleHeight / 2);

    this.ctx.restore();
  }

  /**
   * 말풍선 추가
   */
  addSpeechBubble(avatarId, message, duration = 5000) {
    const avatar = avatarId === 'teacher' 
      ? this.teacherAvatar
      : this.avatars.find(a => a.id === avatarId);

    if (!avatar) return;

    avatar.speechBubble = {
      message,
      duration,
      startTime: Date.now()
    };

    // 자동 제거
    setTimeout(() => {
      if (avatar.speechBubble?.startTime === avatar.speechBubble?.startTime) {
        avatar.speechBubble = null;
      }
    }, duration);
  }

  /**
   * 선생님 성별 설정
   */
  setTeacherGender(gender) {
    const types = CHARACTER_TYPES[gender.toUpperCase()];
    this.teacherAvatar.config.gender = gender;
    this.teacherAvatar.config.characterType = types[0];
    console.log(`👨‍🏫 선생님 성별: ${gender}`);
  }

  /**
   * 모든 아바타 제거
   */
  clear() {
    this.avatars = [];
  }

  /**
   * 특정 아바타 제거
   */
  removeAvatar(avatarId) {
    this.avatars = this.avatars.filter(a => a.id !== avatarId);
  }
}

