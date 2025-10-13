/**
 * 아바타 편집기 UI
 * 학생들이 자신의 아바타를 커스터마이징할 수 있는 인터페이스
 */

import { CHARACTER_TYPES, ACCESSORY_TYPES, AvatarConfig } from './avatarSystem.js';

export class AvatarEditor {
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
    modal.id = 'avatar-editor-modal';
    modal.className = 'avatar-editor-modal';
    modal.innerHTML = `
      <div class="avatar-editor-container">
        <div class="avatar-editor-header">
          <h2>🎨 내 아바타 꾸미기</h2>
          <button class="close-btn" id="avatar-editor-close">✕</button>
        </div>
        
        <div class="avatar-editor-content">
          <!-- 왼쪽: 프리뷰 -->
          <div class="avatar-editor-preview">
            <canvas id="avatar-preview-canvas" width="256" height="256"></canvas>
            <div class="preview-info">
              <p id="preview-name">학생</p>
            </div>
          </div>
          
          <!-- 오른쪽: 옵션 -->
          <div class="avatar-editor-options">
            <!-- 성별 선택 -->
            <div class="option-group">
              <label>성별</label>
              <div class="option-buttons">
                <button class="option-btn" data-option="gender" data-value="male">
                  👨 남자
                </button>
                <button class="option-btn" data-option="gender" data-value="female">
                  👩 여자
                </button>
              </div>
            </div>
            
            <!-- 캐릭터 타입 선택 -->
            <div class="option-group">
              <label>캐릭터 스타일</label>
              <div class="option-grid" id="character-type-grid">
                <!-- 동적으로 생성됨 -->
              </div>
            </div>
            
            <!-- 액세서리 선택 -->
            <div class="option-group">
              <label>액세서리</label>
              <div class="option-grid" id="accessory-grid">
                <button class="option-btn accessory-btn" data-option="accessory" data-value="null">
                  ❌ 없음
                </button>
                <button class="option-btn accessory-btn" data-option="accessory" data-value="aid-glasses">
                  👓 안경
                </button>
                <button class="option-btn accessory-btn" data-option="accessory" data-value="aid-sunglasses">
                  🕶️ 선글라스
                </button>
                <button class="option-btn accessory-btn" data-option="accessory" data-value="aid-mask">
                  😷 마스크
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="avatar-editor-footer">
          <button class="btn-secondary" id="avatar-editor-cancel">취소</button>
          <button class="btn-primary" id="avatar-editor-save">💾 저장하기</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 이벤트 리스너
    this.setupEventListeners();
    
    // 프리뷰 캔버스
    this.previewCanvas = document.getElementById('avatar-preview-canvas');
    this.previewCtx = this.previewCanvas.getContext('2d');
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    const modal = document.getElementById('avatar-editor-modal');
    
    // 닫기
    document.getElementById('avatar-editor-close').addEventListener('click', () => {
      this.close();
    });
    
    document.getElementById('avatar-editor-cancel').addEventListener('click', () => {
      this.close();
    });
    
    // 저장
    document.getElementById('avatar-editor-save').addEventListener('click', () => {
      if (this.onSave && this.currentConfig) {
        this.onSave(this.currentConfig);
      }
      this.close();
    });
    
    // 옵션 버튼 클릭
    modal.addEventListener('click', (e) => {
      const btn = e.target.closest('.option-btn');
      if (!btn) return;
      
      const option = btn.dataset.option;
      const value = btn.dataset.value;
      
      if (option === 'gender') {
        this.setGender(value);
      } else if (option === 'character') {
        this.setCharacterType(value);
      } else if (option === 'accessory') {
        this.setAccessory(value === 'null' ? null : value);
      }
      
      // 활성화 표시
      btn.parentElement.querySelectorAll('.option-btn').forEach(b => {
        b.classList.remove('active');
      });
      btn.classList.add('active');
    });
  }

  /**
   * 에디터 열기
   */
  open(config) {
    this.currentConfig = config || new AvatarConfig();
    const modal = document.getElementById('avatar-editor-modal');
    modal.classList.add('active');
    
    this.updateUI();
    this.updatePreview();
  }

  /**
   * 에디터 닫기
   */
  close() {
    const modal = document.getElementById('avatar-editor-modal');
    modal.classList.remove('active');
  }

  /**
   * UI 업데이트
   */
  updateUI() {
    // 성별 버튼
    document.querySelectorAll('[data-option="gender"]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === this.currentConfig.gender);
    });
    
    // 캐릭터 타입 그리드 생성
    const grid = document.getElementById('character-type-grid');
    grid.innerHTML = '';
    
    const types = CHARACTER_TYPES[this.currentConfig.gender.toUpperCase()];
    types.forEach((type, index) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn character-btn';
      btn.dataset.option = 'character';
      btn.dataset.value = type;
      btn.textContent = `스타일 ${index + 1}`;
      if (type === this.currentConfig.characterType) {
        btn.classList.add('active');
      }
      grid.appendChild(btn);
    });
    
    // 액세서리 버튼
    document.querySelectorAll('[data-option="accessory"]').forEach(btn => {
      const value = btn.dataset.value === 'null' ? null : btn.dataset.value;
      btn.classList.toggle('active', value === this.currentConfig.accessory);
    });
    
    // 이름 표시
    document.getElementById('preview-name').textContent = this.currentConfig.name;
  }

  /**
   * 프리뷰 업데이트
   */
  async updatePreview() {
    this.previewCtx.clearRect(0, 0, 256, 256);
    
    // 배경
    this.previewCtx.fillStyle = '#f5f5f5';
    this.previewCtx.fillRect(0, 0, 256, 256);
    
    // 캐릭터 이미지 로드 및 표시
    const charPath = `/assets/characters/character-${this.currentConfig.characterType}.png`;
    const charImg = new Image();
    charImg.src = charPath;
    
    await new Promise((resolve) => {
      charImg.onload = () => {
        // 중앙에 크게 표시
        this.previewCtx.drawImage(charImg, 64, 64, 128, 128);
        
        // 액세서리
        if (this.currentConfig.accessory) {
          const accPath = `/assets/characters/${this.currentConfig.accessory}.png`;
          const accImg = new Image();
          accImg.src = accPath;
          accImg.onload = () => {
            this.previewCtx.drawImage(accImg, 64, 64, 128, 128);
            resolve();
          };
          accImg.onerror = () => resolve();
        } else {
          resolve();
        }
      };
      charImg.onerror = () => resolve();
    });
  }

  /**
   * 성별 설정
   */
  setGender(gender) {
    this.currentConfig.gender = gender;
    const types = CHARACTER_TYPES[gender.toUpperCase()];
    this.currentConfig.characterType = types[0]; // 첫 번째 타입으로 자동 변경
    this.updateUI();
    this.updatePreview();
  }

  /**
   * 캐릭터 타입 설정
   */
  setCharacterType(type) {
    this.currentConfig.characterType = type;
    this.updatePreview();
  }

  /**
   * 액세서리 설정
   */
  setAccessory(accessory) {
    this.currentConfig.accessory = accessory;
    this.updatePreview();
  }
}

