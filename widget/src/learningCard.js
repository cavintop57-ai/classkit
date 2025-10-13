// widget/src/learningCard.js

const TYPE_COLORS = {
  vocabulary: '#4A90E2', // 파란색
  proverb: '#7ED321',    // 초록색
  vocab: '#F5A623'       // 주황색
};

const TYPE_NAMES = {
  vocabulary: '영어낱말',
  proverb: '속담',
  vocab: '어휘력'
};

export class LearningCard {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.problems = [null, null, null]; // 3개의 문제 (vocabulary, proverb, vocab)
    this.calendarData = null; // 달력 데이터
    this.calendarEvents = []; // 절기/이벤트 데이터
    this.isVisible = true; // 항상 표시
    this.alpha = 1;
    this.targetAlpha = 1;
    
    // 카드 클릭 이벤트
    this.setupClickEvents();
    
    // 카드 위치 및 크기
    this.cardWidth = 280;
    this.cardHeight = 120;
    this.cardGap = 20; // 카드 간격 (동일하게)
    
    // 카드들의 시작 위치 (화면 우측 상단, 모드 버튼 아래)
    this.startX = this.canvas.width - this.cardWidth - 40;
    this.startY = 80; // 모드 버튼 아래부터 시작
    
    // 떠다니는 애니메이션
    this.floatOffset = 0;
    this.floatSpeed = 0.02;
  }
  
  /**
   * 문제 표시 (타입별로 저장)
   */
  showProblem(problem) {
    const typeIndex = {
      'vocabulary': 0,
      'proverb': 1,
      'vocab': 2
    };
    
    const index = typeIndex[problem.type];
    if (index !== undefined) {
      this.problems[index] = problem;
      console.log(`📚 문제 ${index} 설정:`, problem.type, problem.question);
    } else {
      console.log(`❌ 알 수 없는 문제 타입: ${problem.type}`);
    }
  }
  
  /**
   * 여러 문제를 한번에 설정
   */
  setProblems(problems) {
    console.log('📚 문제 설정 시작:', problems);
    this.problems = [null, null, null]; // 초기화
    problems.forEach(problem => this.showProblem(problem));
    console.log('📚 문제 설정 완료:', this.problems);
  }
  
  /**
   * CSV 데이터 파싱
   */
  async loadCalendarEvents() {
    try {
      const response = await fetch('/data/calendar_events.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n');
      const events = [];
      
      // 첫 번째 줄(헤더) 제외하고 파싱
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const [month, day, season, event, description] = line.split(',');
          events.push({
            month: parseInt(month),
            day: parseInt(day),
            season: season.trim(),
            event: event.trim(),
            description: description.trim()
          });
        }
      }
      
      this.calendarEvents = events;
      console.log('📅 달력 이벤트 로드 완료:', events.length, '개');
    } catch (error) {
      console.error('❌ 달력 이벤트 로드 실패:', error);
      this.calendarEvents = [];
    }
  }

  /**
   * 오늘 날짜의 절기/이벤트 찾기
   */
  getTodayEvents() {
    if (!this.calendarData || !this.calendarEvents.length) return [];
    
    const todayEvents = this.calendarEvents.filter(event => 
      event.month === this.calendarData.month && 
      event.day === this.calendarData.date
    );
    
    return todayEvents;
  }

  /**
   * 달력 데이터 설정
   */
  setCalendar() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[today.getDay()];
    
    this.calendarData = {
      year,
      month,
      date,
      dayName,
      dateString: `${year}.${month.toString().padStart(2, '0')}.${date.toString().padStart(2, '0')}`
    };
  }
  
  /**
   * 업데이트 (떠다니는 애니메이션)
   */
  update() {
    // 달력 데이터가 없으면 설정
    if (!this.calendarData) {
      this.setCalendar();
    }
    
    // 절기/이벤트 데이터가 없으면 로드 (비동기지만 기다리지 않음)
    if (!this.calendarEvents.length) {
      this.loadCalendarEvents();
    }
    
    // 부드럽게 위아래로 떠다니기
    this.floatOffset = Math.sin(Date.now() * this.floatSpeed * 0.001) * 10;
    
    // 화면 크기 변경 시 위치 조정
    this.startX = this.canvas.width - this.cardWidth - 40;
  }
  
  /**
   * 카드 클릭 이벤트 설정
   */
  setupClickEvents() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // 달력 카드 클릭 확인
      const calendarY = this.startY + this.floatOffset;
      if (x >= this.startX && x <= this.startX + this.cardWidth &&
          y >= calendarY && y <= calendarY + this.cardHeight) {
        this.showCardModal('calendar', null);
        return;
      }
      
      // 문제 카드 클릭 확인
      this.problems.forEach((problem, index) => {
        if (problem) {
          const cardY = this.startY + (this.cardHeight + this.cardGap) * (index + 1) + this.floatOffset;
          if (x >= this.startX && x <= this.startX + this.cardWidth &&
              y >= cardY && y <= cardY + this.cardHeight) {
            this.showCardModal('problem', problem);
            return;
          }
        }
      });
    });
  }
  
  /**
   * 카드 모달 표시
   */
  showCardModal(type, data) {
    const modal = document.getElementById('card-modal');
    const title = document.getElementById('card-modal-title');
    const content = document.getElementById('card-modal-content');
    
    if (type === 'calendar') {
      title.textContent = '📅 오늘의 달력';
      const todayEvents = this.getTodayEvents();
      let html = `
        <h3>📅 ${this.calendarData?.dateString || '오늘'}</h3>
        <div class="calendar-info">
          <strong>${this.calendarData?.dayName || '요일'}</strong>
      `;
      
      if (todayEvents.length > 0) {
        todayEvents.forEach(event => {
          html += `
            <div style="margin: 10px 0;">
              <strong>${event.event}</strong><br>
              <span style="color: #666;">${event.description}</span>
            </div>
          `;
        });
      } else {
        html += `<div style="color: #666;">특별한 이벤트가 없습니다.</div>`;
      }
      
      html += '</div>';
      content.innerHTML = html;
    } else if (type === 'problem' && data) {
      const typeName = TYPE_NAMES[data.type] || data.type;
      title.textContent = `📚 ${typeName}`;
      
      let html = `<h3>${typeName}</h3>`;
      
      if (data.type === 'vocabulary' || data.type === 'vocab') {
        html += `
          <div class="word-section">
            <strong>단어:</strong> ${data.word || 'N/A'}
          </div>
          <div class="meaning-section">
            <strong>의미:</strong> ${data.meaning || 'N/A'}
          </div>
          <div class="example-section">
            <strong>예시 문장:</strong><br>
            ${data.example || 'N/A'}
            ${data.example_ko ? `<br><span style="color: #666;">(${data.example_ko})</span>` : ''}
          </div>
        `;
      } else if (data.type === 'proverb') {
        html += `
          <div class="word-section">
            <strong>문제:</strong> ${data.question || 'N/A'}
          </div>
          <div class="meaning-section">
            <strong>힌트:</strong> ${data.hint || 'N/A'}
          </div>
        `;
      }
      
      content.innerHTML = html;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  /**
   * 그리기 (달력 + 3개 카드)
   */
  draw() {
    this.ctx.save();
    
    console.log('🎨 학습 카드 그리기 시작, 문제 개수:', this.problems.filter(p => p).length);
    
    // 달력 카드 그리기 (첫 번째 카드로)
    if (this.calendarData) {
      this.drawCalendarCard(0); // index 0으로 전달
    }
    
    // 3개의 문제 카드를 순서대로 그리기 (index 1부터 시작)
    this.problems.forEach((problem, index) => {
      if (!problem) {
        console.log(`❌ 문제 ${index} 없음`);
        return;
      }
      
      console.log(`✅ 문제 ${index} 그리기:`, problem.type);
      
      const cardX = this.startX;
      const cardY = this.startY + (this.cardHeight + this.cardGap) * (index + 1) + this.floatOffset; // index + 1로 달력 다음부터
      const typeColor = TYPE_COLORS[problem.type] || '#999999';
      
      // 카드 배경 (그림자)
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      this.ctx.shadowBlur = 15;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 5;
      this.roundRect(cardX, cardY, this.cardWidth, this.cardHeight, 12);
      this.ctx.fill();
      
      // 그림자 리셋
      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;
      
      // 카드 배경
      this.ctx.fillStyle = '#FFFFFF';
      this.roundRect(cardX, cardY, this.cardWidth, this.cardHeight, 12);
      this.ctx.fill();
      
            // 타입 헤더
            this.ctx.fillStyle = typeColor;
            this.roundRect(cardX, cardY, this.cardWidth, 30, 12, true, false);
            this.ctx.fill();
            
            // 타입 이름
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 11px Pretendard, sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(TYPE_NAMES[problem.type], cardX + 12, cardY + 20);
            
            // 난이도 표시 (별)
            const stars = '★'.repeat(problem.difficulty) + '☆'.repeat(5 - problem.difficulty);
            this.ctx.font = '9px sans-serif';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(stars, cardX + this.cardWidth - 12, cardY + 20);
            
            // 내용 표시
            if (problem.type === 'vocabulary') {
              // 영어 낱말 카드
              this.ctx.fillStyle = '#333333';
              this.ctx.font = 'bold 16px Pretendard, sans-serif';
              this.ctx.textAlign = 'center';
              this.ctx.fillText(problem.word, cardX + this.cardWidth / 2, cardY + 50);
              
              this.ctx.fillStyle = '#666666';
              this.ctx.font = '12px Pretendard, sans-serif';
              this.ctx.fillText(problem.meaning, cardX + this.cardWidth / 2, cardY + 68);
              
              this.ctx.fillStyle = '#999999';
              this.ctx.font = '10px Pretendard, sans-serif';
              this.wrapText(
                problem.example,
                cardX + this.cardWidth / 2,
                cardY + 88,
                this.cardWidth - 24,
                12
              );
              
              this.ctx.fillStyle = '#CCCCCC';
              this.ctx.font = '9px Pretendard, sans-serif';
              this.wrapText(
                problem.example_ko,
                cardX + this.cardWidth / 2,
                cardY + 105,
                this.cardWidth - 24,
                10
              );
            } else if (problem.type === 'vocab') {
              // 어휘력 카드
              this.ctx.fillStyle = '#333333';
              this.ctx.font = 'bold 16px Pretendard, sans-serif';
              this.ctx.textAlign = 'center';
              this.ctx.fillText(problem.word, cardX + this.cardWidth / 2, cardY + 50);
              
              this.ctx.fillStyle = '#666666';
              this.ctx.font = '12px Pretendard, sans-serif';
              this.wrapText(
                problem.meaning,
                cardX + this.cardWidth / 2,
                cardY + 70,
                this.cardWidth - 24,
                14
              );
              
              this.ctx.fillStyle = '#999999';
              this.ctx.font = '10px Pretendard, sans-serif';
              this.wrapText(
                problem.example,
                cardX + this.cardWidth / 2,
                cardY + 95,
                this.cardWidth - 24,
                12
              );
            } else {
              // 속담 카드 (기존 방식)
              this.ctx.fillStyle = '#333333';
              this.ctx.font = 'bold 13px Pretendard, sans-serif';
              this.ctx.textAlign = 'center';
              this.wrapText(
                problem.question,
                cardX + this.cardWidth / 2,
                cardY + 55,
                this.cardWidth - 24,
                16
              );
              
              // 힌트 (있으면)
              if (problem.hint) {
                this.ctx.fillStyle = '#999999';
                this.ctx.font = '9px Pretendard, sans-serif';
                this.ctx.textAlign = 'center';
                this.wrapText(
                  `힌트: ${problem.hint}`,
                  cardX + this.cardWidth / 2,
                  cardY + 95,
                  this.cardWidth - 24,
                  12
                );
              }
            }
    });
    
    this.ctx.restore();
  }
  
  /**
   * 달력 카드 그리기 (문제 카드와 같은 형식)
   */
  drawCalendarCard(index) {
    const cardX = this.startX;
    const cardY = this.startY + (this.cardHeight + this.cardGap) * index + this.floatOffset; // 문제 카드와 같은 위치 계산
    const { year, month, date, dayName, dateString } = this.calendarData;
    const todayEvents = this.getTodayEvents(); // 오늘의 절기/이벤트
    
    // 카드 배경 (그림자)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 5;
    this.roundRect(cardX, cardY, this.cardWidth, this.cardHeight, 12);
    this.ctx.fill();
    
    // 그림자 리셋
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    
    // 카드 배경
    this.ctx.fillStyle = '#FFFFFF';
    this.roundRect(cardX, cardY, this.cardWidth, this.cardHeight, 12);
    this.ctx.fill();
    
    // 달력 헤더
    this.ctx.fillStyle = '#9C27B0';
    this.roundRect(cardX, cardY, this.cardWidth, 30, 12, true, false);
    this.ctx.fill();
    
    // 달력 제목
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 11px Pretendard, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('📅 오늘', cardX + 12, cardY + 20);
    
    // 절기/이벤트가 있으면 헤더에 표시
    if (todayEvents.length > 0) {
      const mainEvent = todayEvents[0];
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = 'bold 10px Pretendard, sans-serif';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(mainEvent.event, cardX + this.cardWidth - 12, cardY + 20);
    }
    
    // 날짜 정보 (왼쪽)
    this.ctx.fillStyle = '#333333';
    this.ctx.font = 'bold 16px Pretendard, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(date.toString(), cardX + 15, cardY + 50);
    
    // 요일 (날짜 아래)
    this.ctx.fillStyle = '#9C27B0';
    this.ctx.font = 'bold 12px Pretendard, sans-serif';
    this.ctx.fillText(dayName + '요일', cardX + 15, cardY + 65);
    
    // 년월 (오른쪽 위)
    this.ctx.fillStyle = '#666666';
    this.ctx.font = '10px Pretendard, sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`${year}년 ${month}월`, cardX + this.cardWidth - 15, cardY + 50);
    
    // 절기/이벤트 정보 (하단)
    if (todayEvents.length > 0) {
      const event = todayEvents[0];
      
      // 절기 배경
      this.ctx.fillStyle = '#E8F5E8';
      this.roundRect(cardX + 15, cardY + 75, this.cardWidth - 30, 35, 8);
      this.ctx.fill();
      
      // 절기 이름
      this.ctx.fillStyle = '#4CAF50';
      this.ctx.font = 'bold 11px Pretendard, sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`🌿 ${event.season}`, cardX + 20, cardY + 88);
      
      // 이벤트 설명
      this.ctx.fillStyle = '#666666';
      this.ctx.font = '9px Pretendard, sans-serif';
      this.wrapText(event.description, cardX + 20, cardY + 100, this.cardWidth - 40, 10);
    } else {
      // 이벤트가 없으면 전체 날짜 표시
      this.ctx.fillStyle = '#999999';
      this.ctx.font = '9px Pretendard, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(dateString, cardX + this.cardWidth / 2, cardY + 90);
    }
  }
  
  /**
   * 둥근 사각형 그리기
   */
  roundRect(x, y, width, height, radius, topOnly = false, bottomOnly = false) {
    this.ctx.beginPath();
    
    if (topOnly) {
      this.ctx.moveTo(x + radius, y);
      this.ctx.lineTo(x + width - radius, y);
      this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      this.ctx.lineTo(x + width, y + height);
      this.ctx.lineTo(x, y + height);
      this.ctx.lineTo(x, y + radius);
      this.ctx.quadraticCurveTo(x, y, x + radius, y);
    } else if (bottomOnly) {
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + width, y);
      this.ctx.lineTo(x + width, y + height - radius);
      this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      this.ctx.lineTo(x + radius, y + height);
      this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      this.ctx.lineTo(x, y);
    } else {
      this.ctx.moveTo(x + radius, y);
      this.ctx.lineTo(x + width - radius, y);
      this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      this.ctx.lineTo(x + width, y + height - radius);
      this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      this.ctx.lineTo(x + radius, y + height);
      this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      this.ctx.lineTo(x, y + radius);
      this.ctx.quadraticCurveTo(x, y, x + radius, y);
    }
    
    this.ctx.closePath();
  }
  
  /**
   * 텍스트 줄바꿈
   */
  wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let lineY = y;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && i > 0) {
        this.ctx.fillText(line, x, lineY);
        line = words[i] + ' ';
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    }
    
    this.ctx.fillText(line, x, lineY);
  }
}

