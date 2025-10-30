/**
 * 모바일 PWA - 학생용 앱
 */

// 환경에 따라 API 주소 자동 설정
const getApiBase = () => {
  const hostname = window.location.hostname;
  
  // 로컬 개발 환경
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }
  
  // 프로덕션 환경 (현재 도메인 사용)
  return `${window.location.protocol}//${window.location.host}/api`;
};

const API_BASE = getApiBase();
console.log('🌐 API Base:', API_BASE);

// 상태 관리
let sessionCode = null;
let currentProblem = null;
let answerToken = null;
let selectedAvatarId = 1;

// 화면 전환
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.add('hidden');
  });
  document.getElementById(screenId).classList.remove('hidden');
}

// URL에서 세션 코드 가져오기
function getSessionCodeFromURL() {
  // 1. URL 파라미터에서 확인 (QR 코드 경로: /mobile/?code=A12345)
  const urlParams = new URLSearchParams(window.location.search);
  const codeParam = urlParams.get('code');
  if (codeParam && /^[A-Z][0-9]{5}$/.test(codeParam)) {
    return codeParam;
  }
  
  // 2. 경로에서 확인 (레거시 경로: /A12345)
  const path = window.location.pathname;
  const match = path.match(/\/([A-Z][0-9]{5})/);
  return match ? match[1] : null;
}

// 초기화
window.addEventListener('DOMContentLoaded', () => {
  console.log('📱 모바일 앱 시작');
  
  // URL에서 세션 코드 확인
  const urlSessionCode = getSessionCodeFromURL();
  if (urlSessionCode) {
    fillCodeSlots(urlSessionCode);
  }
  
  // 아바타 선택 UI 생성
  createAvatarPicker();
  
  // 이벤트 리스너
  setupEventListeners();
  
  // 코드 슬롯 입력 이벤트
  setupCodeSlotInputs();
});

/**
 * 아바타 선택 UI 생성
 */
function createAvatarPicker() {
  const picker = document.getElementById('avatar-picker');
  const colors = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚪', '⚫'];
  
  colors.forEach((color, index) => {
    const option = document.createElement('div');
    option.className = 'avatar-option';
    option.textContent = color;
    option.dataset.avatarId = index + 1;
    
    if (index === 0) {
      option.classList.add('selected');
      selectedAvatarId = 1;
    }
    
    option.addEventListener('click', () => {
      document.querySelectorAll('.avatar-option').forEach(o => {
        o.classList.remove('selected');
      });
      option.classList.add('selected');
      selectedAvatarId = index + 1;
    });
    
    picker.appendChild(option);
  });
}

/**
 * 코드 슬롯 입력 이벤트 설정
 */
function setupCodeSlotInputs() {
  const slots = document.querySelectorAll('.code-slot-input');
  
  slots.forEach((slot, index) => {
    // 입력 타입 설정 (모바일 키보드 최적화)
    if (index === 0) {
      slot.setAttribute('type', 'text');
      slot.setAttribute('inputmode', 'text');
      slot.setAttribute('pattern', '[A-Za-z]');
    } else {
      slot.setAttribute('type', 'tel'); // 숫자 키보드
      slot.setAttribute('inputmode', 'numeric');
      slot.setAttribute('pattern', '[0-9]');
    }
    
    // 입력 이벤트
    slot.addEventListener('input', (e) => {
      let value = e.target.value.toUpperCase();
      
      // 첫 번째 칸: 알파벳만 허용
      if (index === 0) {
        value = value.replace(/[^A-Z]/g, '');
        e.target.value = value.slice(0, 1); // 1글자만
      } else {
        // 나머지 칸: 숫자만 허용
        value = value.replace(/[^0-9]/g, '');
        e.target.value = value.slice(0, 1); // 1글자만
      }
      
      // 입력되면 다음 칸으로 자동 이동
      if (e.target.value && index < 5) {
        setTimeout(() => {
          slots[index + 1].focus();
        }, 50);
      }
    });
    
    // 키다운 이벤트 (키보드 입력 처리)
    slot.addEventListener('keydown', (e) => {
      // Backspace: 이전 칸으로 이동
      if (e.key === 'Backspace') {
        if (!e.target.value && index > 0) {
          e.preventDefault();
          slots[index - 1].focus();
          slots[index - 1].select();
        }
      }
      
      // Enter: 입장하기
      if (e.key === 'Enter') {
        e.preventDefault();
        joinSession();
      }
      
      // 좌우 화살표로 이동
      if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        slots[index - 1].focus();
        slots[index - 1].select();
      }
      if (e.key === 'ArrowRight' && index < 5) {
        e.preventDefault();
        slots[index + 1].focus();
        slots[index + 1].select();
      }
      
      // 숫자/알파벳 입력 시 기존 값 자동 교체
      const isLetter = /^[a-zA-Z]$/.test(e.key);
      const isNumber = /^[0-9]$/.test(e.key);
      
      if ((index === 0 && isLetter) || (index > 0 && isNumber)) {
        if (e.target.value) {
          e.target.value = ''; // 기존 값 지우고 새 값 입력
        }
      }
    });
    
    // 붙여넣기 지원
    slot.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedText = (e.clipboardData || window.clipboardData).getData('text').toUpperCase().trim();
      
      if (/^[A-Z][0-9]{5}$/.test(pastedText)) {
        fillCodeSlots(pastedText);
        setTimeout(() => {
          slots[5].focus();
        }, 100);
      }
    });
    
    // 포커스 시 전체 선택
    slot.addEventListener('focus', (e) => {
      setTimeout(() => {
        e.target.select();
      }, 50);
    });
    
    // 터치 최적화 (모바일)
    slot.addEventListener('touchstart', (e) => {
      e.target.focus();
    });
  });
  
  // 첫 번째 칸에 자동 포커스 (약간 지연)
  setTimeout(() => {
    slots[0].focus();
  }, 300);
}

/**
 * 코드 슬롯 채우기
 */
function fillCodeSlots(code) {
  const slots = document.querySelectorAll('.code-slot-input');
  const codeStr = code.trim().toUpperCase();
  
  slots.forEach((slot, index) => {
    slot.value = index < codeStr.length ? codeStr[index] : '';
  });
}

/**
 * 코드 슬롯에서 값 가져오기
 */
function getCodeFromSlots() {
  const slots = document.querySelectorAll('.code-slot-input');
  return Array.from(slots).map(slot => slot.value).join('');
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  // 세션 입장
  document.getElementById('join-session-btn').addEventListener('click', joinSession);
  
  // 정답 제출
  document.getElementById('submit-answer-btn').addEventListener('click', submitAnswer);
  
  // 엔터 키로 정답 제출
  document.getElementById('answer-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitAnswer();
    }
  });
  
  // 메시지 전송
  document.getElementById('send-message-btn').addEventListener('click', sendMessage);
  
  // 다시 메시지 보내기
  document.getElementById('send-another-btn').addEventListener('click', () => {
    showScreen('message-screen');
    document.getElementById('message-input').value = '';
    document.getElementById('char-count').textContent = '0';
  });
  
  // 메시지 글자 수 카운터
  document.getElementById('message-input').addEventListener('input', (e) => {
    document.getElementById('char-count').textContent = e.target.value.length;
  });
}

/**
 * 세션 입장
 */
async function joinSession() {
  const code = getCodeFromSlots();
  
  if (code.length !== 6) {
    showResult('result-message', '6자리 코드를 입력해주세요 (알파벳 1자 + 숫자 5자)', 'error');
    return;
  }
  
  // 형식 검증: 알파벳 1자리 + 숫자 5자리
  if (!/^[A-Z][0-9]{5}$/.test(code)) {
    showResult('result-message', '코드 형식이 올바르지 않습니다 (알파벳 1자 + 숫자 5자)', 'error');
    return;
  }
  
  const btn = document.getElementById('join-session-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading"></span> 입장 중...';
  
  try {
    // 세션 검증
    const response = await fetch(`${API_BASE}/sessions/${code}`);
    
    if (!response.ok) {
      throw new Error('세션을 찾을 수 없습니다');
    }
    
    const session = await response.json();
    sessionCode = code;
    
    console.log('✅ 세션 입장:', session);
    
    // 문제 로드
    await loadProblem();
    
    // 문제 화면으로 이동
    showScreen('problem-screen');
    
  } catch (error) {
    console.error('❌ 세션 입장 오류:', error);
    showResult('result-message', error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '입장하기 🚀';
  }
}

/**
 * 문제 로드
 */
// 샘플 문제 데이터
const SAMPLE_PROBLEMS = [
  {
    id: 'sample-1',
    type: 'vocabulary',
    difficulty: 3,
    question: 'happy의 반대말은?',
    answer: 'sad',
    hint: '슬프다는 뜻의 단어입니다'
  },
  {
    id: 'sample-2',
    type: 'proverb',
    difficulty: 3,
    question: '천 리 길도 한 걸음부터',
    answer: '시작이 반',
    hint: '무슨 일이든 시작하는 것이 중요합니다'
  },
  {
    id: 'sample-3',
    type: 'vocab',
    difficulty: 3,
    question: '매우 기쁘고 즐거운 마음',
    answer: '환희',
    hint: '두 글자 한자어입니다'
  },
  {
    id: 'sample-4',
    type: 'vocabulary',
    difficulty: 2,
    question: 'apple은 무슨 뜻일까요?',
    answer: '사과',
    hint: '빨간색 과일입니다'
  },
  {
    id: 'sample-5',
    type: 'proverb',
    difficulty: 2,
    question: '백지장도 맞들면 낫다',
    answer: '협동',
    hint: '여럿이 함께하면 쉽습니다'
  }
];

async function loadProblem() {
  try {
    // API에서 문제 가져오기 시도
    const types = ['vocabulary', 'proverb', 'vocab'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const response = await fetch(`${API_BASE}/problems/next?type=${type}&difficulty=3`);
    
    if (!response.ok) {
      throw new Error('문제를 불러올 수 없습니다');
    }
    
    const problem = await response.json();
    currentProblem = problem;
    
    console.log('📚 문제 로드 (API):', problem);
    displayProblem(problem);
    
  } catch (error) {
    console.warn('⚠️ API 문제 로드 실패, 샘플 문제 사용:', error);
    
    // 샘플 문제 중 랜덤 선택
    const randomProblem = SAMPLE_PROBLEMS[Math.floor(Math.random() * SAMPLE_PROBLEMS.length)];
    currentProblem = randomProblem;
    
    console.log('📚 문제 로드 (샘플):', randomProblem);
    displayProblem(randomProblem);
  }
}

function displayProblem(problem) {
  // UI 업데이트
  const typeNames = {
    vocabulary: '영어낱말',
    proverb: '속담',
    vocab: '어휘력'
  };
  
  document.getElementById('problem-type').textContent = typeNames[problem.type] || '문제';
  document.getElementById('problem-difficulty').textContent = '★'.repeat(problem.difficulty) + '☆'.repeat(5 - problem.difficulty);
  document.getElementById('problem-question').textContent = problem.question;
  
  // 힌트가 있으면 표시
  if (problem.hint) {
    document.getElementById('problem-hint').textContent = `💡 힌트: ${problem.hint}`;
  } else {
    document.getElementById('problem-hint').textContent = '';
  }
}

/**
 * 정답 제출
 */
async function submitAnswer() {
  const input = document.getElementById('answer-input');
  const answer = input.value.trim();
  
  if (!answer) {
    showResult('result-message', '정답을 입력해주세요', 'error');
    return;
  }
  
  if (!currentProblem) {
    showResult('result-message', '문제를 먼저 불러와주세요', 'error');
    return;
  }
  
  const btn = document.getElementById('submit-answer-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading"></span> 확인 중...';
  
  try {
    // 샘플 문제인 경우 로컬에서 정답 체크
    if (currentProblem.id && currentProblem.id.startsWith('sample-')) {
      console.log('📝 샘플 문제 로컬 체크:', { answer, correct: currentProblem.answer });
      
      const isCorrect = answer.toLowerCase() === currentProblem.answer.toLowerCase();
      
      if (isCorrect) {
        // 정답!
        console.log('✅ 정답! (샘플 문제)');
        showResult('result-message', '🎉 정답입니다!', 'success');
        
        // 정답 토큰 발급 (샘플용)
        answerToken = 'sample-token-' + Date.now();
        
        // 1.5초 후 메시지 화면으로 이동
        setTimeout(() => {
          input.value = '';
          showScreen('message-screen');
        }, 1500);
      } else {
        // 오답
        showResult('result-message', `❌ 틀렸습니다. 정답: "${currentProblem.answer}"`, 'error');
        input.value = '';
        input.focus();
      }
      
      btn.disabled = false;
      btn.innerHTML = '정답 제출 ✏️';
      return;
    }
    
    // API를 통한 정답 체크
    const response = await fetch(`${API_BASE}/problems/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problem_id: currentProblem.id,
        answer: answer,
        session_code: sessionCode
      })
    });
    
    if (!response.ok) {
      throw new Error('정답 확인 중 오류가 발생했습니다');
    }
    
    const result = await response.json();
    
    if (result.correct) {
      // 정답!
      answerToken = result.answer_token;
      console.log('✅ 정답! 토큰 발급:', answerToken);
      
      // 메시지 화면으로 이동
      setTimeout(() => {
        showScreen('message-screen');
      }, 1000);
      
      showResult('result-message', '🎉 ' + result.message, 'success');
    } else {
      // 오답
      showResult('result-message', '❌ ' + result.message, 'error');
      input.value = '';
      input.focus();
    }
    
  } catch (error) {
    console.error('❌ 정답 제출 오류:', error);
    showResult('result-message', error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '정답 제출 ✏️';
  }
}

/**
 * 메시지 전송
 */
async function sendMessage() {
  const nicknameInput = document.getElementById('nickname-input');
  const messageInput = document.getElementById('message-input');
  
  const nickname = nicknameInput.value.trim();
  const content = messageInput.value.trim();
  
  if (!nickname) {
    showResult('message-result', '닉네임을 입력해주세요', 'error');
    return;
  }
  
  if (!content) {
    showResult('message-result', '메시지를 입력해주세요', 'error');
    return;
  }
  
  if (!answerToken) {
    showResult('message-result', '정답을 먼저 맞혀야 합니다', 'error');
    return;
  }
  
  const btn = document.getElementById('send-message-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading"></span> 전송 중...';
  
  try {
    // 샘플 모드인 경우 (answerToken이 'sample-token-'으로 시작)
    if (answerToken && answerToken.startsWith('sample-token-')) {
      console.log('📝 샘플 모드 메시지 전송 (로컬):', { nickname, content });
      
      // 위젯 WebSocket에 직접 메시지 전송 시도 (샘플 모드 시뮬레이션)
      try {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
        const ws = new WebSocket(`${wsProtocol}//${wsHost}/ws/${sessionCode}`);
        ws.onopen = () => {
          const messageData = {
            event: 'newMessage',
            payload: {
              nickname: nickname,
              avatar_id: selectedAvatarId,
              content: content,
              timestamp: new Date().toISOString()
            }
          };
          ws.send(JSON.stringify(messageData));
          console.log('📤 위젯으로 메시지 전송:', messageData);
          
          // 잠시 후 연결 종료
          setTimeout(() => ws.close(), 500);
        };
      } catch (wsError) {
        console.warn('⚠️ WebSocket 전송 실패 (위젯이 연결되지 않음):', wsError);
      }
      
      // 로컬에서 바로 성공 처리
      showResult('message-result', '✅ 메시지가 전송되었습니다!', 'success');
      
      // 1초 후 완료 화면으로
      setTimeout(() => {
        showScreen('success-screen');
        
        // 메시지 필드 초기화
        messageInput.value = '';
      }, 1000);
      
      btn.disabled = false;
      btn.innerHTML = '메시지 보내기 💌';
      return;
    }
    
    // API를 통한 메시지 전송
    const response = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: sessionCode,
        nickname: nickname,
        avatar_id: selectedAvatarId,
        content: content,
        answer_token: answerToken
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '메시지 전송 실패');
    }
    
    const result = await response.json();
    console.log('✅ 메시지 전송 완료:', result);
    
    // 완료 화면으로 이동
    showScreen('success-screen');
    
  } catch (error) {
    console.error('❌ 메시지 전송 오류:', error);
    showResult('message-result', error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '메시지 보내기 💌';
  }
}

/**
 * 결과 메시지 표시
 */
function showResult(elementId, message, type) {
  const element = document.getElementById(elementId);
  element.textContent = message;
  element.className = `result-message show ${type}`;
  
  // 3초 후 자동 숨김
  setTimeout(() => {
    element.classList.remove('show');
  }, 3000);
}

