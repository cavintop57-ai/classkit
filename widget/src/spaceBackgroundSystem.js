/**
 * 우주 배경 시스템 (Kenney Planets)
 * 별, 행성, 우주 먼지 효과로 멋진 우주 환경 생성
 * 
 * 레이어 구조:
 * 1. Deep Space (깊은 우주 그라디언트)
 * 2. Stars (별 - 반짝임 효과)
 * 3. Distant Planets (먼 행성 - 느리게 이동)
 * 4. Nebula (성운 효과)
 * 5. Near Planets (가까운 행성 - 빠르게 이동)
 * 6. Space Dust (우주 먼지 - 가장 빠르게)
 */

export class SpaceBackgroundSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // 행성 이미지
    this.planetImages = new Map();
    
    // 별 배열
    this.stars = [];
    
    // 행성 배열
    this.planets = [];
    
    // 우주 먼지
    this.spaceDust = [];
    
    // 시간
    this.time = 0;
    
    // 우주 배경 색상 (모드별)
    this.spaceColors = {
      break: { 
        deep: '#0a0e27',   // 어두운 파랑
        mid: '#1a1f3a',    // 중간 파랑
        near: '#2a2f4a'    // 밝은 파랑
      },
      class: { 
        deep: '#0d1117',   // 거의 검정
        mid: '#1f2937',    // 어두운 회색
        near: '#374151'    // 중간 회색
      },
      work: { 
        deep: '#000000',   // 완전 검정
        mid: '#1a1a1a',    // 진한 회색
        near: '#2d2d2d'    // 회색
      }
    };
    
    this.currentMode = 'break';
    
    console.log('🌌 우주 배경 시스템 초기화');
  }

  /**
   * 초기화
   */
  async initialize() {
    console.log('🚀 행성 이미지 로딩...');
    
    // 행성 이미지 로드 (10개)
    const loadPromises = [];
    for (let i = 0; i < 10; i++) {
      const planetNum = String(i).padStart(2, '0');
      loadPromises.push(
        this.loadImage(`./assets/space/planets/planet${planetNum}.png`, `planet${i}`)
      );
    }
    
    await Promise.all(loadPromises);
    
    // 배경 요소 초기화
    this.initializeStars();
    this.initializePlanets();
    this.initializeSpaceDust();
    
    console.log('✅ 우주 배경 로딩 완료!');
  }

  /**
   * 이미지 로드
   */
  loadImage(src, key) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.planetImages.set(key, img);
        resolve();
      };
      img.onerror = () => {
        console.warn(`⚠️ 이미지 로딩 실패: ${src}`);
        resolve(); // 에러가 나도 계속 진행
      };
      img.src = src;
    });
  }

  /**
   * 별 초기화 (200-300개)
   */
  initializeStars() {
    const starCount = 200 + Math.floor(Math.random() * 100);
    
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: 0.5 + Math.random() * 2,
        brightness: Math.random(),
        twinkleSpeed: 0.01 + Math.random() * 0.02,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
    
    console.log(`⭐ ${starCount}개의 별 생성`);
  }

  /**
   * 행성 초기화 (3-5개) - 크기 조절로 겹치지 않도록
   */
  initializePlanets() {
    const planetCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < planetCount; i++) {
      const planetId = Math.floor(Math.random() * 10);
      const isDistant = Math.random() > 0.3; // 70%는 먼 행성, 30%는 가까운 행성
      
      this.planets.push({
        planetId,
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        // 크기를 더 작게 조절 (0.15-0.35)
        scale: isDistant ? 0.15 + Math.random() * 0.15 : 0.25 + Math.random() * 0.15,
        speed: isDistant ? 0.05 + Math.random() * 0.1 : 0.15 + Math.random() * 0.2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.005,
        // 투명도도 조절
        opacity: isDistant ? 0.3 + Math.random() * 0.2 : 0.5 + Math.random() * 0.3,
        isDistant
      });
    }
    
    console.log(`🪐 ${planetCount}개의 행성 생성 (크기 최적화)`);
  }

  /**
   * 우주 먼지 초기화 (50-80개)
   */
  initializeSpaceDust() {
    const dustCount = 50 + Math.floor(Math.random() * 30);
    
    for (let i = 0; i < dustCount; i++) {
      this.spaceDust.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: 1 + Math.random() * 3,
        speed: 0.3 + Math.random() * 0.7,
        opacity: 0.2 + Math.random() * 0.4
      });
    }
    
    console.log(`✨ ${dustCount}개의 우주 먼지 생성`);
  }

  /**
   * 모드 변경
   */
  setMode(mode) {
    this.currentMode = mode;
    console.log(`🌌 우주 배경 모드: ${mode}`);
  }

  /**
   * 업데이트
   */
  update() {
    this.time += 0.016; // ~60fps
    
    // 별 반짝임 업데이트
    this.stars.forEach(star => {
      star.twinklePhase += star.twinkleSpeed;
    });
    
    // 행성 회전 및 이동
    this.planets.forEach(planet => {
      planet.rotation += planet.rotationSpeed;
      planet.x += planet.speed;
      
      // 화면 밖으로 나가면 반대편에서 다시 등장
      if (planet.x > this.canvas.width + 200) {
        planet.x = -200;
        planet.y = Math.random() * this.canvas.height;
      }
    });
    
    // 우주 먼지 이동
    this.spaceDust.forEach(dust => {
      dust.x += dust.speed;
      
      if (dust.x > this.canvas.width) {
        dust.x = 0;
        dust.y = Math.random() * this.canvas.height;
      }
    });
  }

  /**
   * 그리기
   */
  draw() {
    // 1. 깊은 우주 그라디언트
    this.drawDeepSpace();
    
    // 2. 별 (반짝임)
    this.drawStars();
    
    // 3. 먼 행성
    this.drawDistantPlanets();
    
    // 4. 성운 효과 (옵션)
    this.drawNebula();
    
    // 5. 가까운 행성
    this.drawNearPlanets();
    
    // 6. 우주 먼지
    this.drawSpaceDust();
  }

  /**
   * 깊은 우주 그라디언트
   */
  drawDeepSpace() {
    const colors = this.spaceColors[this.currentMode];
    
    // 방사형 그라디언트 (중앙이 더 밝음)
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2, 
      this.canvas.height / 2, 
      0,
      this.canvas.width / 2, 
      this.canvas.height / 2, 
      Math.max(this.canvas.width, this.canvas.height)
    );
    
    gradient.addColorStop(0, colors.mid);
    gradient.addColorStop(0.5, colors.deep);
    gradient.addColorStop(1, colors.deep);
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 별 그리기
   */
  drawStars() {
    this.ctx.save();
    
    this.stars.forEach(star => {
      // 반짝임 계산
      const brightness = 0.3 + Math.sin(star.twinklePhase) * 0.7;
      const alpha = star.brightness * brightness;
      
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 큰 별은 십자 광선 추가
      if (star.size > 1.5) {
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
        this.ctx.lineWidth = 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(star.x - star.size * 2, star.y);
        this.ctx.lineTo(star.x + star.size * 2, star.y);
        this.ctx.moveTo(star.x, star.y - star.size * 2);
        this.ctx.lineTo(star.x, star.y + star.size * 2);
        this.ctx.stroke();
      }
    });
    
    this.ctx.restore();
  }

  /**
   * 먼 행성 그리기
   */
  drawDistantPlanets() {
    this.ctx.save();
    
    const distantPlanets = this.planets.filter(p => p.isDistant);
    
    distantPlanets.forEach(planet => {
      const img = this.planetImages.get(`planet${planet.planetId}`);
      if (!img) return;
      
      const width = img.width * planet.scale;
      const height = img.height * planet.scale;
      
      this.ctx.globalAlpha = planet.opacity * 0.6; // 더 흐릿하게
      
      this.ctx.save();
      this.ctx.translate(planet.x, planet.y);
      this.ctx.rotate(planet.rotation);
      this.ctx.drawImage(img, -width/2, -height/2, width, height);
      this.ctx.restore();
    });
    
    this.ctx.restore();
  }

  /**
   * 성운 효과
   */
  drawNebula() {
    // 간단한 성운 효과 (반투명 원형 그라디언트)
    if (this.currentMode === 'break') {
      this.ctx.save();
      this.ctx.globalAlpha = 0.15;
      
      const nebula1 = this.ctx.createRadialGradient(
        this.canvas.width * 0.3,
        this.canvas.height * 0.3,
        0,
        this.canvas.width * 0.3,
        this.canvas.height * 0.3,
        this.canvas.width * 0.4
      );
      
      nebula1.addColorStop(0, '#8B5CF6');
      nebula1.addColorStop(0.5, '#6366F1');
      nebula1.addColorStop(1, 'transparent');
      
      this.ctx.fillStyle = nebula1;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.restore();
    }
  }

  /**
   * 가까운 행성 그리기
   */
  drawNearPlanets() {
    this.ctx.save();
    
    const nearPlanets = this.planets.filter(p => !p.isDistant);
    
    nearPlanets.forEach(planet => {
      const img = this.planetImages.get(`planet${planet.planetId}`);
      if (!img) return;
      
      const width = img.width * planet.scale;
      const height = img.height * planet.scale;
      
      this.ctx.globalAlpha = planet.opacity;
      
      this.ctx.save();
      this.ctx.translate(planet.x, planet.y);
      this.ctx.rotate(planet.rotation);
      this.ctx.drawImage(img, -width/2, -height/2, width, height);
      this.ctx.restore();
    });
    
    this.ctx.restore();
  }

  /**
   * 우주 먼지 그리기
   */
  drawSpaceDust() {
    this.ctx.save();
    
    this.spaceDust.forEach(dust => {
      this.ctx.globalAlpha = dust.opacity;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(dust.x, dust.y, dust.size, 1);
    });
    
    this.ctx.restore();
  }

  /**
   * 리사이즈
   */
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    
    // 별 위치 재조정
    this.stars.forEach(star => {
      if (star.x > width) star.x = Math.random() * width;
      if (star.y > height) star.y = Math.random() * height;
    });
    
    // 행성 위치 재조정
    this.planets.forEach(planet => {
      if (planet.x > width) planet.x = Math.random() * width;
      if (planet.y > height) planet.y = Math.random() * height;
    });
    
    // 우주 먼지 재조정
    this.spaceDust.forEach(dust => {
      if (dust.x > width) dust.x = Math.random() * width;
      if (dust.y > height) dust.y = Math.random() * height;
    });
  }
}

