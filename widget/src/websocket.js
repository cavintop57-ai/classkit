/**
 * WebSocket 연결 관리
 * 학생들의 메시지를 실시간으로 받아옵니다
 */

export class WebSocketManager {
  constructor(sessionCode, avatarRenderer) {
    this.sessionCode = sessionCode;
    this.avatarRenderer = avatarRenderer;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  connect() {
    try {
      const wsUrl = `ws://localhost:8000/ws/${this.sessionCode}`;
      console.log('🔌 WebSocket 연결 시도:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket 연결 성공!');
        this.reconnectAttempts = 0;
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
      // 새 메시지 도착
      const { nickname, content, avatar_id } = data.payload;
      
      console.log(`💬 ${nickname}: ${content}`);
      
      // 해당 아바타에 말풍선 표시
      if (avatar_id !== undefined && avatar_id !== null) {
        this.avatarRenderer.addSpeechBubble(avatar_id, content, 5000);
      }
      
      // 전체 공지로도 표시 (옵션)
      this.showNotification(nickname, content);
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
    
    // 5초 후 제거
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
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

  disconnect() {
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

