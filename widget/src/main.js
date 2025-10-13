// Import
import { AmongUsAvatarRenderer } from './amongUsAvatarSystem.js';
import { LearningCard } from './learningCard.js';
import { SpaceBackgroundSystem } from './spaceBackgroundSystem.js';
import { WebSocketManager } from './websocket.js';

// 모드 관리
let currentMode = 'break'; // 'break' | 'class' | 'work'

const modeNames = {
  break: 'Break 모드 (쉬는시간)',
  class: 'Class 모드 (수업시간)',
  work: 'Work 모드 (업무)'
};

function setMode(newMode) {
  console.log(`Mode: ${currentMode} → ${newMode}`);
  
  // 전환 애니메이션
  document.body.dataset.modeChanging = 'true';
  
  setTimeout(() => {
    currentMode = newMode;
    document.body.dataset.mode = newMode;
    
    // 배경 시스템 모드 변경
    backgroundSystem.setMode(newMode);
    
    // 버튼 활성화 상태 업데이트
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.getElementById(`btn-${newMode}`).classList.add('active');
    
    document.body.dataset.modeChanging = 'false';
    
    // 렌더링 루프 제어
    if (newMode === 'work') {
      stopRenderLoop();
    } else {
      startRenderLoop(); // break와 class 모드 모두 렌더링
    }
  }, 300);
}

function toggleMode(type) {
  if (type === 'break-class') {
    setMode(currentMode === 'break' ? 'class' : 'break');
  } else if (type === 'class-work') {
    setMode(currentMode === 'class' ? 'work' : 'class');
  }
}

// Electron 단축키 이벤트 수신
if (window.electron) {
  window.electron.onToggleMode(toggleMode);
}

// 타이머 (10분 카운트다운)
let totalSeconds = 600; // 10분 = 600초
let timerInterval = null;
let isTimerRunning = false;

function updateTimerDisplay() {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  document.getElementById('timer').textContent = 
    `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function startTimer() {
  if (isTimerRunning) return;
  
  isTimerRunning = true;
  const btn = document.getElementById('timer-start-btn');
  btn.classList.add('running');
  btn.querySelector('.timer-btn-icon').textContent = '⏸️';
  btn.querySelector('.timer-btn-text').textContent = '일시정지';
  
  timerInterval = setInterval(() => {
    if (totalSeconds > 0) {
      totalSeconds--;
      updateTimerDisplay();
      
      // 타이머 색상 변경 (3분 이하면 노란색, 1분 이하면 빨간색)
      const timerDisplay = document.getElementById('timer');
      if (totalSeconds <= 60) {
        timerDisplay.style.color = '#F44336'; // 빨간색
      } else if (totalSeconds <= 180) {
        timerDisplay.style.color = '#FFA726'; // 주황색
      }
    } else {
      // 타이머 종료
      clearInterval(timerInterval);
      isTimerRunning = false;
      btn.classList.remove('running');
      btn.querySelector('.timer-btn-icon').textContent = '🔄';
      btn.querySelector('.timer-btn-text').textContent = '다시 시작';
      console.log('⏰ 타이머 종료!');
    }
  }, 1000);
}

function pauseTimer() {
  if (!isTimerRunning) return;
  
  isTimerRunning = false;
  clearInterval(timerInterval);
  const btn = document.getElementById('timer-start-btn');
  btn.classList.remove('running');
  btn.querySelector('.timer-btn-icon').textContent = '▶️';
  btn.querySelector('.timer-btn-text').textContent = '계속하기';
}

function resetTimer() {
  pauseTimer();
  totalSeconds = 600; // 10분으로 리셋
  updateTimerDisplay();
  const btn = document.getElementById('timer-start-btn');
  btn.querySelector('.timer-btn-icon').textContent = '▶️';
  btn.querySelector('.timer-btn-text').textContent = '시작하기';
  
  // 색상 초기화
  document.getElementById('timer').style.color = '#333333';
}

function toggleTimer() {
  if (totalSeconds === 0) {
    // 종료된 상태면 리셋
    resetTimer();
  } else if (isTimerRunning) {
    // 실행 중이면 일시정지
    pauseTimer();
  } else {
    // 일시정지 상태면 시작
    startTimer();
  }
}

// 초기 타이머 표시
updateTimerDisplay();

// Canvas 설정
const canvas = document.getElementById('avatar-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 배경 시스템 (우주 배경)
const backgroundSystem = new SpaceBackgroundSystem(canvas);

// 아바타 렌더러 (Among Us)
const avatarRenderer = new AmongUsAvatarRenderer(canvas);

// 학습 카드
const learningCard = new LearningCard(canvas);

// 이미지 프리로드 (비동기)
(async () => {
  // 배경과 아바타 동시 로드
  await Promise.all([
    backgroundSystem.initialize(),
    avatarRenderer.initialize()
  ]);
  
  console.log('✅ 우주 배경 로드 완료 (Among Us 스타일)');
  
  // 테스트용 아바타 추가 (Among Us)
  avatarRenderer.addAvatar(0, '김철수');
  avatarRenderer.addAvatar(1, '이영희');
  avatarRenderer.addAvatar(2, '박민준');
  avatarRenderer.addAvatar(3, '최서연');
  avatarRenderer.addAvatar(4, '정도윤');
  avatarRenderer.addAvatar(5, '한소영');
  avatarRenderer.addAvatar(6, '윤태호');
  avatarRenderer.addAvatar(7, '임다은');
  
  // 선생님 설정 (금색 Among Us)
  avatarRenderer.setTeacher('우주 탐험을 시작합니다! 🚀');
})();

// 초기 문제 로드 (3개 모두 표시)
const initialProblems = [
  {
    id: '1',
    word: 'clearly',
    meaning: '명확하게, 똑똑하게',
    example: 'Please speak clearly so everyone can hear you.',
    example_ko: '모든 사람이 들을 수 있도록 명확하게 말해주세요.',
    type: 'vocabulary',
    difficulty: 3,
    grade: '5-1'
  },
  {
    id: '2',
    question: '속담: 티끌 모아 ______',
    hint: '작은 것이 모여 큰 것을 이룸',
    type: 'proverb',
    difficulty: 2,
    grade: '5-1'
  },
  {
    id: '3',
    word: '끈기',
    meaning: '어려운 일을 포기하지 않고 계속하는 마음',
    example: '끈기 있게 노력하면 반드시 성공할 수 있다.',
    type: 'vocab',
    difficulty: 2,
    grade: '5-1'
  },
];

// 3개 문제 모두 표시 (즉시 실행)
console.log('📚 문제 로드 시작');
learningCard.setProblems(initialProblems);
console.log('📚 문제 로드 완료:', learningCard.problems);

// 렌더링 루프 (저사양 최적화)
let animationId = null;
let lastAvatarUpdate = 0;
let lastRenderTime = 0;

const AVATAR_FPS = 12;                    // 아바타 업데이트: 12 FPS (저사양 최적화)
const RENDER_FPS = 30;                    // 화면 렌더링: 30 FPS (부드러움 유지)
const AVATAR_INTERVAL = 1000 / AVATAR_FPS; // ~83ms
const RENDER_INTERVAL = 1000 / RENDER_FPS; // ~33ms

function renderLoop(currentTime) {
  // 항상 다음 프레임 요청 (루프 유지)
  animationId = requestAnimationFrame(renderLoop);
  
  // work 모드에서는 아무것도 렌더링하지 않음
  if (currentMode === 'work') {
    return;
  }
  
  // 렌더링 FPS 제어 (30 FPS)
  if (currentTime - lastRenderTime < RENDER_INTERVAL) {
    return;
  }
  lastRenderTime = currentTime;
  
  // 1️⃣ 배경 그리기 (레이어 시스템)
  backgroundSystem.draw();
  
  // 2️⃣ break 모드에서만 배경 & 아바타 업데이트 (12 FPS)
  if (currentMode === 'break' && currentTime - lastAvatarUpdate >= AVATAR_INTERVAL) {
    lastAvatarUpdate = currentTime;
    backgroundSystem.update(); // 구름 이동
    avatarRenderer.update();
  }
  
  // 3️⃣ 아바타 그리기 (break와 class 모드 모두)
  if (currentMode === 'break' || currentMode === 'class') {
    avatarRenderer.draw();
  }
  
  // 4️⃣ 학습 카드 (break와 class 모드 모두)
  learningCard.update();
  learningCard.draw();
}

function startRenderLoop() {
  if (!animationId) {
    lastAvatarUpdate = performance.now();
    lastRenderTime = performance.now();
    animationId = requestAnimationFrame(renderLoop);
  }
}

function stopRenderLoop() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

// API 설정
const API_BASE = 'http://localhost:8000/api';
const WS_BASE = 'ws://localhost:8000';

// 세션 관리
let currentSession = null;
let wsManager = null;

/**
 * 새 세션 생성 (로컬 모드 폴백 지원)
 */
async function createSession() {
  try {
    // 우리반 관리에서 저장한 classId 가져오기 (있으면 사용, 없으면 백엔드가 자동 생성)
    const savedClassData = loadClassData();
    const requestBody = savedClassData?.classId 
      ? { class_id: savedClassData.classId }
      : {};  // class_id 생략 → 백엔드가 자동으로 학급 생성
    
    const response = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`세션 생성 실패: ${response.status}`);
    }
    
    const session = await response.json();
    currentSession = session;
    
    console.log('✅ 온라인 세션 생성:', session.code);
    
    // UI 업데이트
    document.getElementById('session-code').textContent = session.code;
    
    // QR 코드 생성 및 표시
    updateQRCode(session.qr_url);
    
    // WebSocket 연결
    connectWebSocket(session.code);
    
    return session;
  } catch (error) {
    console.error('❌ 세션 생성 오류:', error);
    console.log('📴 로컬 모드로 전환합니다...');
    
    // 로컬 모드: 랜덤 세션 코드 생성
    const localSessionCode = generateLocalSessionCode();
    currentSession = {
      id: 'local',
      code: localSessionCode,
      qr_url: `로컬 모드 (오프라인)`,
      is_local: true
    };
    
    // UI 업데이트
    document.getElementById('session-code').textContent = localSessionCode;
    document.getElementById('qr-url').textContent = '로컬 모드 (오프라인)';
    document.getElementById('qr-code').innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">📴<br>오프라인 모드</div>';
    
    console.log('✅ 로컬 세션 생성:', localSessionCode);
    
    // WebSocket 연결 시도하지 않음 (로컬 모드)
    return currentSession;
  }
}

/**
 * 로컬 세션 코드 생성
 */
function generateLocalSessionCode() {
  // 알파벳 1자리 + 숫자 5자리 형식
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  
  const letter = letters[Math.floor(Math.random() * letters.length)];
  let numbers = '';
  for (let i = 0; i < 5; i++) {
    numbers += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return letter + numbers;
}

/**
 * localStorage에서 우리반 데이터 불러오기
 */
function loadClassData() {
  try {
    const savedData = localStorage.getItem('classData');
    if (savedData) {
      const classData = JSON.parse(savedData);
      console.log('📂 저장된 우리반 정보 불러오기:', classData);
      
      // 폼에 데이터 채우기
      document.getElementById('school-name').value = classData.schoolName || '';
      document.getElementById('grade').value = classData.grade || '3';
      document.getElementById('class-number').value = classData.classNumber || '1';
      document.getElementById('student-count').value = classData.studentCount || '25';
      document.getElementById('student-names').value = classData.studentNames || '';
      document.getElementById('today-message').value = classData.todayMessage || '';
      
      // 화면 업데이트
      applyClassData(classData);
      
      return classData;
    } else {
      console.log('📭 저장된 우리반 정보 없음');
      return null;
    }
  } catch (error) {
    console.error('❌ localStorage 로드 오류:', error);
    return null;
  }
}

/**
 * 우리반 데이터를 화면에 적용
 */
function applyClassData(classData) {
  // 선생님 메시지 설정
  if (classData.todayMessage && classData.todayMessage.trim()) {
    avatarRenderer.setTeacher(classData.todayMessage.trim());
  }
  
  // 학생 이름 설정 및 아바타 생성
  if (classData.studentNames) {
    const names = classData.studentNames.split('\n').filter(name => name.trim());
    if (names.length > 0) {
      avatarRenderer.setStudentNames(names);
      console.log('👥 학생 아바타 생성:', names.length, '명');
    }
  }
  
  console.log('✅ 우리반 데이터 적용 완료');
}

/**
 * QR 코드 업데이트 (Google Charts API 사용)
 */
function updateQRCode(url) {
  const qrCodeDiv = document.getElementById('qr-code');
  const qrUrlDiv = document.getElementById('qr-url');
  
  // QR 코드 이미지 생성 (Google Charts API)
  const qrImageUrl = `https://chart.googleapis.com/chart?cht=qr&chs=168x168&chl=${encodeURIComponent(url)}`;
  
  qrCodeDiv.innerHTML = `<img src="${qrImageUrl}" alt="QR Code" />`;
  qrUrlDiv.textContent = url;
  
  console.log('📱 QR 코드 생성:', url);
}

/**
 * WebSocket 연결
 */
function connectWebSocket(sessionCode) {
  if (wsManager) {
    wsManager.disconnect();
  }
  
  const wsUrl = `${WS_BASE}/ws/${sessionCode}`;
  console.log('🔌 WebSocket 연결 중:', wsUrl);
  
  wsManager = new WebSocketManager(sessionCode, avatarRenderer);
  wsManager.connect();
  
  // 연결되면 즉시 문제 로드
  setTimeout(() => {
    loadProblems();
  }, 1000);
}

/**
 * 백엔드에서 문제 가져오기 (로컬 모드 폴백)
 */
async function loadProblems() {
  // 로컬 모드면 기본 문제 사용
  if (currentSession && currentSession.is_local) {
    console.log('📴 로컬 모드: 기본 문제 사용');
    learningCard.setProblems(initialProblems);
    return;
  }
  
  try {
    // 우리반 관리에서 설정한 학년 가져오기 (없으면 기본값)
    const gradeInput = document.getElementById('grade');
    const grade = gradeInput ? gradeInput.value : '3';
    
    console.log(`📚 문제 로드 중... (학년: ${grade})`);
    
    // 3가지 타입의 문제를 각각 가져오기
    const problemTypes = ['vocabulary', 'proverb', 'vocab'];
    const problems = [];
    
    for (const type of problemTypes) {
      try {
        const response = await fetch(`${API_BASE}/problems/next?grade=${grade}&type=${type}&difficulty=3`);
        
        if (response.ok) {
          const problem = await response.json();
          problems.push(problem);
          console.log(`  ✅ ${type} 문제 로드 완료`);
        } else {
          console.warn(`  ⚠️ ${type} 문제 로드 실패, 기본 문제 사용`);
          problems.push(getDefaultProblem(type, grade));
        }
      } catch (error) {
        console.error(`  ❌ ${type} 문제 로드 오류:`, error);
        problems.push(getDefaultProblem(type, grade));
      }
    }
    
    // 문제 카드에 표시
    learningCard.setProblems(problems);
    console.log('📚 문제 로드 완료:', problems.length, '개');
    
  } catch (error) {
    console.error('❌ 문제 로드 오류:', error);
    // 기본 문제 사용
    learningCard.setProblems(initialProblems);
  }
}

/**
 * 기본 문제 반환 (백엔드 연결 실패 시)
 */
function getDefaultProblem(type, grade) {
  const defaults = {
    vocabulary: {
      id: 'default-vocab',
      word: 'happy',
      meaning: '행복한',
      example: 'I am happy today.',
      example_ko: '나는 오늘 행복해요.',
      type: 'vocabulary',
      difficulty: 2,
      grade: grade
    },
    proverb: {
      id: 'default-proverb',
      question: '속담: 티끌 모아 ______',
      answer: '태산',
      hint: '작은 것도 모으면',
      type: 'proverb',
      difficulty: 2,
      grade: grade
    },
    vocab: {
      id: 'default-vocab-kr',
      word: '끈기',
      meaning: '어려운 일을 포기하지 않고 계속하는 마음',
      example: '끈기 있게 노력하면 반드시 성공할 수 있다.',
      type: 'vocab',
      difficulty: 2,
      grade: grade
    }
  };
  
  return defaults[type] || defaults.vocabulary;
}

// 버튼 클릭 이벤트
document.getElementById('btn-break').addEventListener('click', () => {
  setMode('break');
});

document.getElementById('btn-class').addEventListener('click', () => {
  setMode('class');
});

document.getElementById('btn-work').addEventListener('click', () => {
  setMode('work');
});

// 우리반 관리 모달
const manageModal = document.getElementById('manage-modal');
const manageBtn = document.getElementById('btn-manage');
const saveBtn = document.getElementById('save-class');
const cancelBtn = document.getElementById('cancel-class');
const resetBtn = document.getElementById('reset-class');

manageBtn.addEventListener('click', () => {
  manageModal.classList.add('active');
  document.body.style.overflow = 'hidden';
});

cancelBtn.addEventListener('click', () => {
  manageModal.classList.remove('active');
  document.body.style.overflow = '';
});

resetBtn.addEventListener('click', () => {
  // 확인 대화상자
  const confirmed = confirm('정말로 우리반 정보를 초기화하시겠습니까?\n\n모든 저장된 데이터(학교이름, 학년, 반, 학생이름 등)가 삭제됩니다.');
  
  if (confirmed) {
    // localStorage 데이터 삭제
    localStorage.removeItem('classData');
    console.log('🗑️ 우리반 정보 초기화 완료');
    
    // 폼 초기값으로 리셋
    document.getElementById('school-name').value = '서울초등학교';
    document.getElementById('grade').value = '3';
    document.getElementById('class-number').value = '2';
    document.getElementById('student-count').value = '25';
    document.getElementById('student-names').value = '김철수\n이영희\n박민수\n정수현\n최지훈';
    document.getElementById('today-message').value = '오늘도 화이팅! 💪';
    
    // 아바타 초기화
    avatarRenderer.clearAllAvatars();
    avatarRenderer.addAvatar(0, '테스트1');
    avatarRenderer.addAvatar(1, '테스트2');
    avatarRenderer.addAvatar(2, '테스트3');
    
    // 선생님 메시지 초기화
    avatarRenderer.setTeacher('오늘도 화이팅! 💪');
    
    alert('우리반 정보가 초기화되었습니다.');
  }
});

saveBtn.addEventListener('click', () => {
  const schoolName = document.getElementById('school-name').value;
  const grade = document.getElementById('grade').value;
  const classNumber = document.getElementById('class-number').value;
  const studentCount = document.getElementById('student-count').value;
  const studentNames = document.getElementById('student-names').value;
  const todayMessage = document.getElementById('today-message').value;
  
  if (!schoolName || !grade || !classNumber || !studentCount) {
    alert('학교이름, 학년, 반, 학생 수를 모두 입력해주세요.');
    return;
  }
  
  const classData = {
    schoolName, 
    grade, 
    classNumber,
    studentCount, 
    studentNames, 
    todayMessage,
    savedAt: new Date().toISOString()
  };
  
  console.log('💾 우리반 정보 저장:', classData);
  
  // localStorage에 저장
  try {
    localStorage.setItem('classData', JSON.stringify(classData));
    console.log('✅ localStorage에 저장 완료');
  } catch (error) {
    console.error('❌ localStorage 저장 오류:', error);
  }
  
  // 화면 업데이트
  applyClassData(classData);
  
  alert('우리반 정보가 저장되었습니다!');
  
  manageModal.classList.remove('active');
  document.body.style.overflow = '';
});

// 모달 외부 클릭 시 닫기
manageModal.addEventListener('click', (e) => {
  if (e.target === manageModal) {
    manageModal.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// 우리반 코드 모달
const codeModal = document.getElementById('code-modal');
const sessionCodeBtn = document.getElementById('session-code-btn');
const codeModalClose = document.getElementById('code-modal-close');
const modalSessionCode = document.getElementById('modal-session-code');
const copyCodeBtn = document.getElementById('copy-code-btn');
const closeCodeBtn = document.getElementById('close-code-btn');

sessionCodeBtn.addEventListener('click', () => {
  // 현재 세션 코드를 모달에 복사
  const currentCode = document.getElementById('session-code').textContent;
  modalSessionCode.textContent = currentCode;
  
  codeModal.classList.add('active');
  document.body.style.overflow = 'hidden';
});

codeModalClose.addEventListener('click', () => {
  codeModal.classList.remove('active');
  document.body.style.overflow = '';
});

closeCodeBtn.addEventListener('click', () => {
  codeModal.classList.remove('active');
  document.body.style.overflow = '';
});

copyCodeBtn.addEventListener('click', async () => {
  const code = modalSessionCode.textContent;
  try {
    await navigator.clipboard.writeText(code);
    copyCodeBtn.textContent = '✅ 복사됨!';
    copyCodeBtn.style.background = '#45A049';
    setTimeout(() => {
      copyCodeBtn.textContent = '📋 복사하기';
      copyCodeBtn.style.background = '#4CAF50';
    }, 2000);
  } catch (err) {
    console.error('복사 실패:', err);
    copyCodeBtn.textContent = '❌ 실패';
    setTimeout(() => {
      copyCodeBtn.textContent = '📋 복사하기';
    }, 2000);
  }
});

// 코드 모달 외부 클릭 시 닫기
codeModal.addEventListener('click', (e) => {
  if (e.target === codeModal) {
    codeModal.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// 카드 모달 이벤트
const cardModal = document.getElementById('card-modal');
const closeCardBtn = document.getElementById('close-card-btn');

closeCardBtn.addEventListener('click', () => {
  cardModal.classList.remove('active');
  document.body.style.overflow = '';
});

// 카드 모달 외부 클릭 시 닫기
cardModal.addEventListener('click', (e) => {
  if (e.target === cardModal) {
    cardModal.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// 전체화면 토글
let isFullscreen = false;

function toggleFullscreen() {
  if (!isFullscreen) {
    // 전체화면 진입
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }
  } else {
    // 전체화면 종료
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}

// 전체화면 상태 변경 감지
document.addEventListener('fullscreenchange', () => {
  isFullscreen = !!document.fullscreenElement;
  const btn = document.getElementById('btn-fullscreen');
  if (isFullscreen) {
    btn.classList.add('active');
    btn.querySelector('.fullscreen-emoji').textContent = '⛶'; // 축소 아이콘
    console.log('🖥️ 전체화면 모드 활성화');
  } else {
    btn.classList.remove('active');
    btn.querySelector('.fullscreen-emoji').textContent = '⛶'; // 확대 아이콘
    console.log('🖥️ 전체화면 모드 종료');
  }
});

// webkit (Safari, Chrome) 지원
document.addEventListener('webkitfullscreenchange', () => {
  isFullscreen = !!document.webkitFullscreenElement;
  const btn = document.getElementById('btn-fullscreen');
  if (isFullscreen) {
    btn.classList.add('active');
  } else {
    btn.classList.remove('active');
  }
});

document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);

// 타이머 버튼 이벤트
document.getElementById('timer-start-btn').addEventListener('click', toggleTimer);
document.getElementById('timer-reset-btn').addEventListener('click', resetTimer);

// 타이머 증감 버튼 이벤트
document.getElementById('timer-increase').addEventListener('click', () => {
  if (!isTimerRunning) {
    totalSeconds += 60; // 1분 추가
    if (totalSeconds > 3600) totalSeconds = 3600; // 최대 60분
    updateTimerDisplay();
  }
});

document.getElementById('timer-decrease').addEventListener('click', () => {
  if (!isTimerRunning) {
    totalSeconds -= 60; // 1분 감소
    if (totalSeconds < 60) totalSeconds = 60; // 최소 1분
    updateTimerDisplay();
  }
});

// 초기화
console.log('🚀 교실 위젯 v0.4.0 시작');

// localStorage에서 우리반 정보 불러오기
const savedClassData = loadClassData();

// 저장된 데이터가 없으면 기본 테스트 아바타 생성
if (!savedClassData || !savedClassData.studentNames) {
  console.log('📝 기본 테스트 아바타 생성');
  avatarRenderer.addAvatar(0, '테스트1');
  avatarRenderer.addAvatar(1, '테스트2');
  avatarRenderer.addAvatar(2, '테스트3');
}

// 리사이즈 핸들러
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  backgroundSystem.resize(canvas.width, canvas.height);
});

// 즉시 렌더링 시작 (문제 카드 표시를 위해)
startRenderLoop();

// 세션 생성 및 WebSocket 연결 (비동기)
createSession().then(() => {
  // 세션 생성 후 문제 로드
  // WebSocket onopen에서도 loadProblems()를 호출하지만,
  // 로컬 모드일 경우를 위해 여기서도 호출
  if (currentSession && currentSession.is_local) {
    loadProblems();
  }
});

// 개발용: 키보드 단축키 (Electron 없을 때)
if (!window.electron) {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F1') {
      e.preventDefault();
      toggleMode('break-class');
    } else if (e.key === 'F2') {
      e.preventDefault();
      toggleMode('class-work');
    } else if (e.key === 'p' || e.key === 'P') {
      // 테스트: 다음 문제로 변경
      e.preventDefault();
      testShowProblem();
    } else if (e.key === 'F11') {
      // 전체화면 토글
      e.preventDefault();
      toggleFullscreen();
    }
  });
}

// 개발용: 테스트 메시지 전송
function testSendMessage() {
  const testMessages = [
    '안녕하세요!',
    '오늘 날씨 좋아요',
    '문제 풀었어요!',
    '재미있어요~',
    'clearly가 정답인가요?',
    '티끌 모아 태산!',
  ];
  
  const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];
  const randomAvatar = Math.floor(Math.random() * 8);
  const randomNickname = `학생${Math.floor(Math.random() * 30) + 1}`;
  
  // 직접 말풍선 표시 (WebSocket 없이)
  avatarRenderer.addAvatar(randomAvatar, randomNickname);
  avatarRenderer.showMessage(randomAvatar, randomMessage);
  
  console.log(`🧪 테스트 메시지: ${randomNickname} - "${randomMessage}"`);
}

// 개발용: 테스트 문제 출제
function testShowProblem() {
  const testProblems = [
    {
      id: '1',
      question: 'Fill in the blank: read ______ loudly.',
      hint: "It means '명확하게'",
      type: 'vocabulary',
      difficulty: 3,
      grade: '5-1'
    },
    {
      id: '2',
      question: '속담: 티끌 모아 ______',
      hint: '작은 것이 모여 큰 것을 이룸',
      type: 'proverb',
      difficulty: 2,
      grade: '5-1'
    },
    {
      id: '3',
      question: '12 곱하기 8은?',
      hint: '구구단',
      type: 'math',
      difficulty: 2,
      grade: '5-1'
    },
  ];
  
  const randomProblem = testProblems[Math.floor(Math.random() * testProblems.length)];
  learningCard.showProblem(randomProblem);
  
  console.log(`🧪 테스트 문제: [${randomProblem.type}] ${randomProblem.question}`);
}
