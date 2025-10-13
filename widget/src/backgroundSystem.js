/**
 * 배경 시스템 (Kenney Background Elements Redux)
 * Parallax 스크롤링 효과로 입체감 있는 배경
 * 
 * 레이어 구조:
 * 1. Sky (하늘 그라디언트)
 * 2. Clouds (구름 - 느리게 이동)
 * 3. Mountains (산 - 중간 속도)
 * 4. Hills (언덕 - 중간 속도)
 * 5. Trees (나무 - 빠르게)
 * 6. Ground (땅 - 가장 빠르게)
 */

export class BackgroundSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // 레이어 설정
    this.layers = {
      sky: { enabled: true, speed: 0 },
      clouds: { enabled: true, speed: 0.1, elements: [] },
      mountains: { enabled: true, speed: 0.3, y: 0 },
      hills: { enabled: true, speed: 0.5, y: 0 },
      trees: { enabled: true, speed: 0.8, elements: [] },
      ground: { enabled: true, speed: 1.0, y: 0 }
    };
    
    // 이미지 캐시
    this.images = new Map();
    
    // 시간 기반 애니메이션
    this.time = 0;
    
    // 배경 색상 (모드별)
    this.skyColors = {
      break: { top: '#87CEEB', bottom: '#E0F6FF' },  // 밝은 파랑
      class: { top: '#B0E0E6', bottom: '#F0F8FF' },  // 차분한 파랑
      work: { top: '#4A5568', bottom: '#718096' }    // 회색
    };
    
    this.currentMode = 'break';
    
    console.log('🌄 배경 시스템 초기화');
  }

  /**
   * 이미지 프리로드
   */
  async initialize() {
    const imagesToLoad = [
      // 배경 레이어
      { key: 'backgroundForest', path: '/assets/backgrounds/backgroundColorForest.png' },
      { key: 'backgroundGrass', path: '/assets/backgrounds/backgroundColorGrass.png' },
      { key: 'mountains', path: '/assets/backgrounds/Elements/mountains.png' },
      { key: 'hills', path: '/assets/backgrounds/Elements/hills.png' },
      { key: 'cloudLayer1', path: '/assets/backgrounds/Elements/cloudLayer1.png' },
      { key: 'cloudLayer2', path: '/assets/backgrounds/Elements/cloudLayer2.png' },
      
      // 개별 요소
      { key: 'cloud1', path: '/assets/background-elements/cloud1.png' },
      { key: 'cloud2', path: '/assets/background-elements/cloud2.png' },
      { key: 'cloud3', path: '/assets/background-elements/cloud3.png' },
      { key: 'tree', path: '/assets/background-elements/tree.png' },
      { key: 'treeSmall1', path: '/assets/background-elements/treeSmall_green1.png' },
      { key: 'treeSmall2', path: '/assets/background-elements/treeSmall_green2.png' },
      { key: 'bush1', path: '/assets/background-elements/bush1.png' },
      { key: 'bush2', path: '/assets/background-elements/bush2.png' }
    ];

    const promises = imagesToLoad.map(({ key, path }) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.images.set(key, img);
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load: ${path}`);
          resolve();
        };
        img.src = path;
      });
    });

    await Promise.all(promises);
    
    // 초기 요소 배치
    this.initializeElements();
    
    console.log('✅ 배경 이미지 로드 완료');
  }

  /**
   * 배경 요소 초기화
   */
  initializeElements() {
    // 구름 배치 (3~5개)
    const cloudCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < cloudCount; i++) {
      this.layers.clouds.elements.push({
        type: `cloud${1 + (i % 3)}`,
        x: Math.random() * this.canvas.width,
        y: 50 + Math.random() * 150,
        speed: 0.1 + Math.random() * 0.1,
        scale: 0.5 + Math.random() * 0.5
      });
    }

    // 나무 배치 (10~15개) - 더 많이 배치
    const treeCount = 10 + Math.floor(Math.random() * 6);
    for (let i = 0; i < treeCount; i++) {
      const isSmall = Math.random() > 0.4; // 작은 나무 비율 증가
      const treeTypes = ['tree', 'treeSmall1', 'treeSmall2', 'bush1', 'bush2'];
      const type = treeTypes[Math.floor(Math.random() * treeTypes.length)];
      
      this.layers.trees.elements.push({
        type,
        x: Math.random() * (this.canvas.width + 200) - 100, // 화면 밖에서도 배치
        y: this.canvas.height - 250 - Math.random() * 100, // 다양한 높이
        speed: 0.8 + Math.random() * 0.2,
        scale: type.includes('Small') ? 0.4 + Math.random() * 0.4 : 
               type.includes('bush') ? 0.3 + Math.random() * 0.3 :
               0.6 + Math.random() * 0.4
      });
    }
    
    // 추가 장식 요소들
    this.initializeDecorations();
  }
  
  /**
   * 장식 요소 초기화 (꽃, 돌, 기타)
   */
  initializeDecorations() {
    // 땅에 작은 장식 요소들 추가
    const decorationCount = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < decorationCount; i++) {
      this.layers.trees.elements.push({
        type: 'bush1', // 작은 수풀
        x: Math.random() * (this.canvas.width + 100),
        y: this.canvas.height - 120 - Math.random() * 30,
        speed: 1.0 + Math.random() * 0.3,
        scale: 0.2 + Math.random() * 0.2
      });
    }
  }

  /**
   * 모드 변경
   */
  setMode(mode) {
    this.currentMode = mode;
  }

  /**
   * 업데이트 (애니메이션)
   */
  update() {
    this.time += 0.016; // ~60fps 기준

    // 구름 이동
    this.layers.clouds.elements.forEach(cloud => {
      cloud.x += cloud.speed;
      if (cloud.x > this.canvas.width + 200) {
        cloud.x = -200;
        cloud.y = 50 + Math.random() * 150;
      }
    });
  }

  /**
   * 배경 그리기
   */
  draw() {
    const { width, height } = this.canvas;

    // 1. 하늘 그라디언트
    this.drawSky();

    // 2. 구름 레이어
    if (this.layers.clouds.enabled) {
      this.drawClouds();
    }

    // 3. 산 (멀리)
    if (this.layers.mountains.enabled) {
      this.drawMountains();
    }

    // 4. 언덕 (중간)
    if (this.layers.hills.enabled) {
      this.drawHills();
    }

    // 5. 나무 (가까이)
    if (this.layers.trees.enabled) {
      this.drawTrees();
    }

    // 6. 땅 (가장 가까이)
    if (this.layers.ground.enabled) {
      this.drawGround();
    }
  }

  /**
   * 하늘 그라디언트
   */
  drawSky() {
    const colors = this.skyColors[this.currentMode];
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.6);
    gradient.addColorStop(0, colors.top);
    gradient.addColorStop(1, colors.bottom);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 구름 그리기
   */
  drawClouds() {
    this.ctx.save();
    this.ctx.globalAlpha = 0.8;

    this.layers.clouds.elements.forEach(cloud => {
      const img = this.images.get(cloud.type);
      if (!img) return;

      const width = img.width * cloud.scale;
      const height = img.height * cloud.scale;

      this.ctx.drawImage(img, cloud.x, cloud.y, width, height);
    });

    this.ctx.restore();
  }

  /**
   * 산 그리기 (실루엣)
   */
  drawMountains() {
    const img = this.images.get('mountains');
    if (!img) return;

    this.ctx.save();
    this.ctx.globalAlpha = 0.3;

    const y = this.canvas.height * 0.4;
    const scale = this.canvas.height / img.height * 0.6;
    const width = img.width * scale;
    const height = img.height * scale;

    // 반복해서 그리기 (seamless)
    for (let x = 0; x < this.canvas.width + width; x += width) {
      this.ctx.drawImage(img, x, y, width, height);
    }

    this.ctx.restore();
  }

  /**
   * 언덕 그리기
   */
  drawHills() {
    const img = this.images.get('hills');
    if (!img) return;

    this.ctx.save();
    this.ctx.globalAlpha = 0.5;

    const y = this.canvas.height * 0.6;
    const scale = this.canvas.height / img.height * 0.5;
    const width = img.width * scale;
    const height = img.height * scale;

    for (let x = 0; x < this.canvas.width + width; x += width) {
      this.ctx.drawImage(img, x, y, width, height);
    }

    this.ctx.restore();
  }

  /**
   * 나무 그리기
   */
  drawTrees() {
    // 깊이순 정렬 (y값 기준)
    const sorted = [...this.layers.trees.elements].sort((a, b) => a.y - b.y);

    sorted.forEach(tree => {
      const img = this.images.get(tree.type);
      if (!img) return;

      const width = img.width * tree.scale;
      const height = img.height * tree.scale;

      this.ctx.save();
      this.ctx.globalAlpha = 0.7;
      this.ctx.drawImage(img, tree.x, tree.y, width, height);
      this.ctx.restore();
    });
  }

  /**
   * 땅 그리기 (단색)
   */
  drawGround() {
    const groundY = this.canvas.height * 0.75;
    
    // 그라디언트 (위에서 아래로)
    const gradient = this.ctx.createLinearGradient(0, groundY, 0, this.canvas.height);
    
    if (this.currentMode === 'work') {
      gradient.addColorStop(0, '#A0AEC0');
      gradient.addColorStop(1, '#718096');
    } else {
      gradient.addColorStop(0, '#90C695');  // 연한 초록
      gradient.addColorStop(1, '#6BA36C');  // 진한 초록
    }

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, groundY, this.canvas.width, this.canvas.height - groundY);
  }

  /**
   * 레이어 토글
   */
  toggleLayer(layerName) {
    if (this.layers[layerName]) {
      this.layers[layerName].enabled = !this.layers[layerName].enabled;
    }
  }

  /**
   * 리사이즈
   */
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    
    // 요소 위치 재조정
    this.layers.clouds.elements.forEach(cloud => {
      if (cloud.x > width) cloud.x = Math.random() * width;
      if (cloud.y > height * 0.3) cloud.y = Math.random() * height * 0.3;
    });
    
    this.layers.trees.elements.forEach(tree => {
      if (tree.x > width) tree.x = Math.random() * width;
      tree.y = height - 200 - Math.random() * 50;
    });
  }
}

