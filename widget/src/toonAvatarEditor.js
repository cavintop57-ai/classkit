/**
 * Toon Characters 아바타 편집기 UI
 * 학생들이 자신의 Toon 캐릭터를 선택할 수 있는 인터페이스
 */

export class ToonAvatarEditor {
  constructor(onSave) {
    this.onSave = onSave;
    this.currentConfig = null;
    this.previewCanvas = null;
    this.createUI();
  }

  /**
   * UI 생성
   */
  createUI() {
    // 모달 생성
    const modal = document.createElement('div');
    modal.id = 'toon-avatar-editor-modal';
    modal.className = 'toon-avatar-editor-modal';
    modal.innerHTML = `
      <div class="toon-avatar-editor-container">
        <div class="toon-avatar-editor-header">
          <h2>🎭 내 캐릭터 선택</h2>
          <button class="close-btn" id="toon-avatar-editor-close">✕</button>
        </div>
        
        <div class="toon-avatar-editor-content">
          <!-- 왼쪽: 프리뷰 -->
          <div class="toon-avatar-editor-preview">
            <canvas id="toon-avatar-preview-canvas" width="256" height="256"></canvas>
            <div class="preview-info">
              <p id="toon-preview-name">학생</p>
              <p id="toon-preview-type">Male Person</p>
            </div>
          </div>
          
          <!-- 오른쪽: 캐릭터 선택 -->
          <div class="toon-avatar-editor-options">
            <!-- 캐릭터 타입 선택 -->
            <div class="option-group">
              <label>캐릭터 타입</label>
              <div class="character-grid">
                <button class="character-btn" data-type="male-person">
                  <div class="character-preview male-person"></div>
                  <span>남자 학생</span>
                </button>
                <button class="character-btn" data-type="female-person">
                  <div class="character-preview female-person"></div>
                  <span>여자 학생</span>
                </button>
                <button class="character-btn" data-type="male-adventurer">
                  <div class="character-preview male-adventurer"></div>
                  <span>남자 모험가</span>
                </button>
                <button class="character-btn" data-type="female-adventurer">
                  <div class="character-preview female-adventurer"></div>
                  <span>여자 모험가</span>
                </button>
              </div>
            </div>
            
            <!-- 이름 입력 -->
            <div class="option-group">
              <label>이름</label>
              <input type="text" id="toon-avatar-name" placeholder="내 이름을 입력하세요" maxlength="10">
            </div>
            
            <!-- 애니메이션 프리뷰 -->
            <div class="option-group">
              <label>걷기 애니메이션</label>
              <div class="animation-preview">
                <button class="anim-btn" id="play-walk-animation">▶️ 걷기 보기</button>
                <div class="anim-info">
                  <span id="current-frame">프레임: 0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="toon-avatar-editor-footer">
          <button class="save-btn" id="toon-save-avatar">💾 저장하기</button>
          <button class="cancel-btn" id="toon-cancel-avatar">❌ 취소</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 프리뷰 캔버스 설정
    this.previewCanvas = document.getElementById('toon-avatar-preview-canvas');
    this.previewCtx = this.previewCanvas.getContext('2d');
    
    // 이벤트 리스너 설정
    this.setupEventListeners();
    
    // 기본 설정
    this.currentConfig = {
      characterType: 'male-person',
      name: '학생'
    };
    
    this.updatePreview();
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 캐릭터 선택
    document.querySelectorAll('.character-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.type;
        this.selectCharacter(type);
      });
    });
    
    // 이름 입력
    const nameInput = document.getElementById('toon-avatar-name');
    nameInput.addEventListener('input', (e) => {
      this.currentConfig.name = e.target.value || '학생';
      this.updatePreview();
    });
    
    // 애니메이션 재생
    document.getElementById('play-walk-animation').addEventListener('click', () => {
      this.playWalkAnimation();
    });
    
    // 저장/취소
    document.getElementById('toon-save-avatar').addEventListener('click', () => {
      this.saveAvatar();
    });
    
    document.getElementById('toon-cancel-avatar').addEventListener('click', () => {
      this.close();
    });
    
    // 모달 닫기
    document.getElementById('toon-avatar-editor-close').addEventListener('click', () => {
      this.close();
    });
    
    // 배경 클릭으로 닫기
    document.getElementById('toon-avatar-editor-modal').addEventListener('click', (e) => {
      if (e.target.id === 'toon-avatar-editor-modal') {
        this.close();
      }
    });
  }

  /**
   * 캐릭터 선택
   */
  selectCharacter(type) {
    this.currentConfig.characterType = type;
    
    // 버튼 활성화 상태 업데이트
    document.querySelectorAll('.character-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('selected');
    
    this.updatePreview();
  }

  /**
   * 프리뷰 업데이트
   */
  updatePreview() {
    if (!this.previewCanvas) return;
    
    // 캔버스 클리어
    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    
    // 배경 그리기
    this.drawPreviewBackground();
    
    // 캐릭터 그리기
    this.drawPreviewCharacter();
    
    // 정보 업데이트
    document.getElementById('toon-preview-name').textContent = this.currentConfig.name;
    document.getElementById('toon-preview-type').textContent = this.getCharacterDisplayName(this.currentConfig.characterType);
  }

  /**
   * 프리뷰 배경 그리기
   */
  drawPreviewBackground() {
    // 그라디언트 배경
    const gradient = this.previewCtx.createLinearGradient(0, 0, 0, this.previewCanvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    
    this.previewCtx.fillStyle = gradient;
    this.previewCtx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    
    // 땅
    const groundY = this.previewCanvas.height * 0.8;
    this.previewCtx.fillStyle = '#90C695';
    this.previewCtx.fillRect(0, groundY, this.previewCanvas.width, this.previewCanvas.height - groundY);
  }

  /**
   * 프리뷰 캐릭터 그리기
   */
  drawPreviewCharacter() {
    // 간단한 캐릭터 실루엣 그리기 (실제 이미지 대신)
    const centerX = this.previewCanvas.width / 2;
    const groundY = this.previewCanvas.height * 0.8;
    const charY = groundY - 80;
    
    this.previewCtx.save();
    
    // 캐릭터 색상 설정
    const colors = this.getCharacterColors(this.currentConfig.characterType);
    
    // 몸
    this.previewCtx.fillStyle = colors.body;
    this.previewCtx.fillRect(centerX - 15, charY, 30, 40);
    
    // 머리
    this.previewCtx.fillStyle = colors.head;
    this.previewCtx.beginPath();
    this.previewCtx.arc(centerX, charY - 10, 12, 0, Math.PI * 2);
    this.previewCtx.fill();
    
    // 팔
    this.previewCtx.fillStyle = colors.arms;
    this.previewCtx.fillRect(centerX - 20, charY + 5, 8, 25);
    this.previewCtx.fillRect(centerX + 12, charY + 5, 8, 25);
    
    // 다리
    this.previewCtx.fillStyle = colors.legs;
    this.previewCtx.fillRect(centerX - 12, charY + 35, 8, 25);
    this.previewCtx.fillRect(centerX + 4, charY + 35, 8, 25);
    
    this.previewCtx.restore();
  }

  /**
   * 캐릭터 색상 가져오기
   */
  getCharacterColors(type) {
    const colorSets = {
      'male-person': {
        body: '#4A90E2',
        head: '#F4C2A1',
        arms: '#F4C2A1',
        legs: '#2C5282'
      },
      'female-person': {
        body: '#E91E63',
        head: '#F4C2A1',
        arms: '#F4C2A1',
        legs: '#9C27B0'
      },
      'male-adventurer': {
        body: '#8B4513',
        head: '#F4C2A1',
        arms: '#F4C2A1',
        legs: '#654321'
      },
      'female-adventurer': {
        body: '#2E7D32',
        head: '#F4C2A1',
        arms: '#F4C2A1',
        legs: '#1B5E20'
      }
    };
    
    return colorSets[type] || colorSets['male-person'];
  }

  /**
   * 걷기 애니메이션 재생
   */
  playWalkAnimation() {
    let frame = 0;
    const maxFrames = 8;
    const animInterval = setInterval(() => {
      // 여기서 실제 걷기 애니메이션을 그릴 수 있습니다
      document.getElementById('current-frame').textContent = `프레임: ${frame}`;
      frame = (frame + 1) % maxFrames;
    }, 100);
    
    // 2초 후 정지
    setTimeout(() => {
      clearInterval(animInterval);
      document.getElementById('current-frame').textContent = '프레임: 0';
    }, 2000);
  }

  /**
   * 캐릭터 표시 이름 가져오기
   */
  getCharacterDisplayName(type) {
    const names = {
      'male-person': '남자 학생',
      'female-person': '여자 학생',
      'male-adventurer': '남자 모험가',
      'female-adventurer': '여자 모험가'
    };
    
    return names[type] || '알 수 없음';
  }

  /**
   * 아바타 저장
   */
  saveAvatar() {
    if (this.onSave) {
      this.onSave({
        characterType: this.currentConfig.characterType,
        name: this.currentConfig.name
      });
    }
    this.close();
  }

  /**
   * 편집기 열기
   */
  open(config = null) {
    if (config) {
      this.currentConfig = { ...config };
    }
    
    document.getElementById('toon-avatar-name').value = this.currentConfig.name;
    this.selectCharacter(this.currentConfig.characterType);
    this.updatePreview();
    
    document.getElementById('toon-avatar-editor-modal').style.display = 'flex';
  }

  /**
   * 편집기 닫기
   */
  close() {
    document.getElementById('toon-avatar-editor-modal').style.display = 'none';
  }

  /**
   * JSON으로 내보내기
   */
  toJSON() {
    return {
      characterType: this.currentConfig.characterType,
      name: this.currentConfig.name
    };
  }
}
