/**
 * WebSocket 연결 관리
 * 학생들의 메시지를 실시간으로 받아옵니다
 */

export class WebSocketManager {
  constructor(sessionCode, avatarRenderer, wsBase = 'ws://localhost:8000', apiBase = 'http://localhost:8000/api') {
    this.sessionCode = sessionCode;
    this.avatarRenderer = avatarRenderer;
    this.wsBase = wsBase;
    this.apiBase = apiBase;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    
    // 자동 발화 타이머
    this.autoSpeechTimer = null;
    this.lastMessageTime = Date.now();
    this.AUTO_SPEECH_INTERVAL = 10000; // 10초
    this.MAX_INTERVAL = 10000; // 10초 (랜덤 범위 동일)
    this.activeAvatars = new Set(); // 현재 말풍선이 있는 아바타들
    this.currentSpeakerIndex = 0; // 현재 발화할 아바타 인덱스
  }

  connect() {
    try {
      const wsUrl = `${this.wsBase}/ws/${this.sessionCode}`;
      console.log('🔌 WebSocket 연결 시도:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket 연결 성공!');
        this.reconnectAttempts = 0;
        // 자동 발화 타이머 시작
        this.startAutoSpeech();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ 메시지 파싱 오류:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket 오류:', error);
      };
      
      this.ws.onclose = () => {
        console.log('🔌 WebSocket 연결 종료');
        this.attemptReconnect();
      };
      
    } catch (error) {
      console.error('❌ WebSocket 연결 실패:', error);
      this.attemptReconnect();
    }
  }

  handleMessage(data) {
    console.log('📨 WebSocket 메시지:', data);
    
    if (data.event === 'newMessage') {
      // 새 메시지 도착 시 자동 발화 타이머 리셋
      this.resetAutoSpeechTimer();
      
      // 새 메시지 도착
      const { nickname, content, avatar_id } = data.payload;
      
      console.log(`💬 ${nickname}: ${content}`);
      
      // 1. 먼저 닉네임으로 아바타 찾기
      let avatarIndex = this.findAvatarByNickname(nickname);
      
      if (avatarIndex !== -1) {
        // 닉네임으로 아바타를 찾은 경우
        console.log(`✅ 닉네임으로 아바타 찾음: ${nickname} → 인덱스 ${avatarIndex}`);
        
        // 학생이 선택한 색상으로 아바타 업데이트
        if (avatar_id !== undefined && avatar_id !== null) {
          this.avatarRenderer.updateAvatarColor(avatarIndex, avatar_id);
        }
        
        this.avatarRenderer.addSpeechBubble(avatarIndex, content, 600000); // 10분 = 600,000ms
      } else {
        // 닉네임으로 못 찾으면 avatar_id 사용 (학생이 직접 입력한 경우)
        console.log(`⚠️ 닉네임으로 아바타 못 찾음: ${nickname}, avatar_id 사용: ${avatar_id}`);
        
        if (avatar_id !== undefined && avatar_id !== null) {
          avatarIndex = avatar_id - 1; // 1-based를 0-based로 변환
          console.log(`📍 아바타 인덱스: ${avatar_id} → ${avatarIndex}`);
          
          // 아바타가 존재하면 말풍선 표시
          if (avatarIndex >= 0 && avatarIndex < this.avatarRenderer.avatars.length) {
            this.avatarRenderer.addSpeechBubble(avatarIndex, content, 600000); // 10분 = 600,000ms
          } else {
            // 아바타가 없으면 새로 추가 후 말풍선 표시
            console.log(`🆕 새 아바타 추가: ${avatarIndex} - ${nickname}`);
            this.avatarRenderer.addAvatar(avatarIndex, nickname);
            this.avatarRenderer.addSpeechBubble(avatarIndex, content, 600000); // 10분 = 600,000ms
          }
        }
      }
      
      // 전체 공지는 제거 (아바타 말풍선만 표시)
      // this.showNotification(nickname, content);
    }
    
    if (data.event === 'userJoined') {
      // 새 학생 입장
      const { nickname, avatar_id } = data.payload;
      console.log(`👋 ${nickname}님이 입장했습니다!`);
      
      // 아바타 추가
      if (avatar_id !== undefined) {
        this.avatarRenderer.addAvatar(avatar_id, nickname);
      }
    }
    
    if (data.event === 'statsUpdate') {
      // 통계 업데이트
      console.log('📊 통계 업데이트:', data.payload);
    }
  }

  /**
   * 닉네임으로 아바타 인덱스 찾기
   * @param {string} nickname 찾을 닉네임
   * @returns {number} 아바타 인덱스 (0-based), 못 찾으면 -1
   */
  findAvatarByNickname(nickname) {
    if (!this.avatarRenderer || !this.avatarRenderer.avatars) {
      return -1;
    }
    
    // 아바타 배열에서 nickname이 일치하는 것 찾기
    for (let i = 0; i < this.avatarRenderer.avatars.length; i++) {
      const avatar = this.avatarRenderer.avatars[i];
      if (avatar && avatar.name === nickname) {
        return i;
      }
    }
    
    return -1;
  }

  showNotification(nickname, content) {
    // 화면 상단에 알림 표시 (옵션)
    const notification = document.createElement('div');
    notification.className = 'ws-notification';
    notification.innerHTML = `
      <strong>${nickname}</strong>: ${content}
    `;
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: rgba(255, 255, 255, 0.95);
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
      max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // 10분 후 제거
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 600000); // 10분 = 600,000ms
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ WebSocket 재연결 포기 (최대 시도 횟수 초과)');
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`🔄 WebSocket 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  /**
   * 자동 발화 시작 (5초 고정)
   */
  startAutoSpeech() {
    if (this.autoSpeechTimer) {
      clearTimeout(this.autoSpeechTimer);
    }
    
    this.autoSpeechTimer = setTimeout(() => {
      this.generateAndShowSpeech();
    }, this.AUTO_SPEECH_INTERVAL);
    
    console.log(`⏰ 자동 발화 타이머 시작 (10초 후)`);
  }
  
  /**
   * 자동 발화 타이머 리셋
   */
  resetAutoSpeechTimer() {
    this.lastMessageTime = Date.now();
    this.startAutoSpeech();
  }
  
  /**
   * AI 발화 생성 및 표시 (말풍선 없는 아바타 한 명씩 순회)
   */
  async generateAndShowSpeech() {
    try {
      if (!this.avatarRenderer || !this.avatarRenderer.avatars || this.avatarRenderer.avatars.length === 0) {
        console.log('⚠️ 아바타가 없어서 발화 생성 건너뜀');
        this.startAutoSpeech();
        return;
      }
      
      console.log('🤖 AI 발화 생성 중...');
      
      // 카테고리 랜덤 선택 (확장된 카테고리)
      const categories = ['humor', 'proverb', 'encouragement', 'weather', 'quote', 'math', 'study'];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      // API 호출
      const response = await fetch(`${this.apiBase}/generate-speech?category=${category}`);
      
      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }
      
      const data = await response.json();
      const speechText = data.text;
      
      console.log(`💡 AI 발화 생성 (${category}): ${speechText}`);
      
      // 말풍선이 없는 아바타들 찾기
      const availableIndices = this.avatarRenderer.avatars
        .map((avatar, index) => index)
        .filter(index => !this.activeAvatars.has(index));
      
      // 모든 아바타가 말풍선이 있으면 모두 리셋
      if (availableIndices.length === 0) {
        this.activeAvatars.clear();
        // 처음부터 다시 시작
        this.currentSpeakerIndex = 0;
      }
      
      // 사용 가능한 아바타가 없으면 건너뜀
      if (availableIndices.length === 0) {
        console.log('⚠️ 발화할 아바타 없음, 다음 타이머 대기');
        this.startAutoSpeech();
        return;
      }
      
      // 다음 순서의 아바타 찾기
      let nextIndex = -1;
      for (let i = 0; i < availableIndices.length; i++) {
        const checkIndex = (this.currentSpeakerIndex + i) % availableIndices.length;
        const candidateIndex = availableIndices[checkIndex];
        if (!this.activeAvatars.has(candidateIndex)) {
          nextIndex = candidateIndex;
          this.currentSpeakerIndex = (checkIndex + 1) % availableIndices.length;
          break;
        }
      }
      
      // 발화할 아바타를 찾지 못하면 첫 번째 아바타
      if (nextIndex === -1) {
        nextIndex = availableIndices[0];
        this.currentSpeakerIndex = 1 % availableIndices.length;
      }
      
      const selectedAvatar = this.avatarRenderer.avatars[nextIndex];
      
      // 선택된 아바타가 발화
      this.activeAvatars.add(nextIndex);
      this.avatarRenderer.addSpeechBubble(nextIndex, speechText, 9000);
      console.log(`🎭 아바타 ${selectedAvatar.name}에 발화 표시`);
      
      // 9초 후 activeAvatars에서 제거
      setTimeout(() => {
        this.activeAvatars.delete(nextIndex);
      }, 9000);
      
      // 타이머 다시 시작
      this.startAutoSpeech();
      
    } catch (error) {
      console.error('❌ AI 발화 생성 실패:', error);
      
      // 실패 시 타이머만 재시작
      this.startAutoSpeech();
    }
  }
  
  disconnect() {
    // 자동 발화 타이머 정지
    if (this.autoSpeechTimer) {
      clearTimeout(this.autoSpeechTimer);
      this.autoSpeechTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ WebSocket 연결되지 않음');
    }
  }
}

