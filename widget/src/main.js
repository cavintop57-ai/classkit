// Import
import { AmongUsAvatarRenderer } from './amongUsAvatarSystem.js';
import { LearningCard } from './learningCard.js';
import { SpaceBackgroundSystem } from './spaceBackgroundSystem.js';
import { WebSocketManager } from './websocket.js';

// 로그인 체크 (페이지 로드 시 즉시 실행)
(function checkLogin() {
  const loginData = localStorage.getItem('teacherLoginData');
  
  if (!loginData) {
    // 로그인 정보가 없으면 로그인 페이지로 이동
    window.location.href = 'login.html';
    return;
  }
  
  try {
    const data = JSON.parse(loginData);
    
    // 세션 코드가 없으면 로그인 페이지로
    if (!data.sessionCode || !data.teacherName) {
      localStorage.removeItem('teacherLoginData');
      window.location.href = 'login.html';
      return;
    }
    
    // 교사 이름 표시 (UI 삭제됨 - 주석 처리)
    // const teacherNameEl = document.getElementById('teacher-name');
    // if (teacherNameEl) {
    //   teacherNameEl.textContent = data.teacherName;
    // }
    
    console.log('✅ 로그인 확인:', data.teacherName, data.sessionCode);
  } catch (error) {
    console.error('❌ 로그인 데이터 파싱 오류:', error);
    localStorage.removeItem('teacherLoginData');
    window.location.href = 'login.html';
  }
})();

// 모드 관리
let currentMode = 'break'; // 'break' | 'class' | 'work'

const modeNames = {
  break: 'Break 모드 (쉬는시간)',
  class: 'Class 모드 (수업시간)',
  work: 'Work 모드 (업무)'
};

function setMode(newMode) {
  console.log(`Mode: ${currentMode} → ${newMode}`);
  
  const previousMode = currentMode;
  
  // 전환 애니메이션
  document.body.dataset.modeChanging = 'true';
  
  // 타이머 오버레이 닫기 (수업시간 모드가 아닌 경우)
  const timerCard = document.getElementById('timer-card');
  const timerBtn = document.getElementById('btn-timer');
  if (timerCard && newMode !== 'class') {
    timerCard.classList.remove('show', 'overlay');
    if (timerBtn) {
      timerBtn.classList.remove('active');
    }
  }
  
  setTimeout(() => {
    currentMode = newMode;
    document.body.dataset.mode = newMode;
    
    // 배경 시스템 모드 변경
    backgroundSystem.setMode(newMode);
    
    // 버튼 활성화 상태 업데이트
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // 업무 모드는 별도 버튼, 쉬는시간/수업시간은 통합 버튼
    if (newMode === 'work') {
      document.getElementById('btn-work').classList.add('active');
    } else {
      // 쉬는시간/수업시간 모드 토글 버튼
      const btnClassMode = document.getElementById('btn-classmode');
      if (btnClassMode) {
        btnClassMode.classList.add('active');
        // 버튼 텍스트와 이모지 업데이트
        if (newMode === 'break') {
          btnClassMode.querySelector('.mode-emoji').textContent = '🎮';
          btnClassMode.querySelector('.mode-name').textContent = '쉬는시간';
        } else if (newMode === 'class') {
          btnClassMode.querySelector('.mode-emoji').textContent = '📚';
          btnClassMode.querySelector('.mode-name').textContent = '수업시간';
        }
      }
    }
    
    document.body.dataset.modeChanging = 'false';
    
    // 수업시간 모드로 전환 시 타이머 자동 시작
    if (newMode === 'class' && !isTimerRunning) {
      startTimer();
    }
    
    // 수업시간 모드에서 나갈 때 타이머 일시정지
    if (previousMode === 'class' && newMode !== 'class' && isTimerRunning) {
      pauseTimer();
    }
    
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
    // 업무 모드 전환
    if (currentMode === 'class') {
      setMode('work');
    } else if (currentMode === 'work') {
      setMode('class');
    } else {
      setMode('work');
    }
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
  const timeString = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  
  // 타이머 카드 업데이트
  document.getElementById('timer').textContent = timeString;
  
  // 배경 타이머 디스플레이 업데이트
  const cosmicTimer = document.getElementById('cosmic-timer-display');
  if (cosmicTimer) {
    cosmicTimer.textContent = timeString;
  }
}

function startTimer() {
  if (isTimerRunning) return;
  
  isTimerRunning = true;
  const btn = document.getElementById('timer-start-btn');
  btn.classList.add('running');
  btn.querySelector('.timer-btn-icon').textContent = '⏸️';
  btn.querySelector('.timer-btn-text').textContent = '일시정지';
  
  // 상단 타이머 버튼 텍스트 변경
  const topTimerBtn = document.getElementById('btn-timer');
  if (topTimerBtn) {
    topTimerBtn.querySelector('.mode-emoji').textContent = '🛑';
    topTimerBtn.querySelector('.mode-name').textContent = '종료';
  }
  
  // 우주 테마 활성화
  document.body.classList.add('timer-cosmic-mode');
  console.log('🌌 우주 테마 활성화');
  
  timerInterval = setInterval(() => {
    if (totalSeconds > 0) {
      totalSeconds--;
      updateTimerDisplay();
      
      // 타이머 색상 변경 (3분 이하면 노란색, 1분 이하면 빨간색)
      const timerDisplay = document.getElementById('timer');
      const cosmicTimer = document.getElementById('cosmic-timer-display');
      
      if (totalSeconds <= 60) {
        timerDisplay.style.color = '#F44336'; // 빨간색
        cosmicTimer.classList.add('danger');
        cosmicTimer.classList.remove('warning');
      } else if (totalSeconds <= 180) {
        timerDisplay.style.color = '#FFA726'; // 주황색
        cosmicTimer.classList.add('warning');
        cosmicTimer.classList.remove('danger');
      } else {
        cosmicTimer.classList.remove('warning', 'danger');
      }
    } else {
      // 타이머 종료
      clearInterval(timerInterval);
      isTimerRunning = false;
      btn.classList.remove('running');
      btn.querySelector('.timer-btn-icon').textContent = '🔄';
      btn.querySelector('.timer-btn-text').textContent = '다시 시작';
      
      // 우주 테마 비활성화
      document.body.classList.remove('timer-cosmic-mode');
      
      // 배경 타이머 색상 초기화
      const cosmicTimer = document.getElementById('cosmic-timer-display');
      cosmicTimer.classList.remove('warning', 'danger');
      
      console.log('🌌 우주 테마 비활성화');
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
  
  // 상단 타이머 버튼 텍스트 복원
  const topTimerBtn = document.getElementById('btn-timer');
  if (topTimerBtn) {
    topTimerBtn.querySelector('.mode-emoji').textContent = '⏱️';
    topTimerBtn.querySelector('.mode-name').textContent = '타이머';
  }
  
  // 우주 테마 비활성화
  document.body.classList.remove('timer-cosmic-mode');
  console.log('🌌 우주 테마 비활성화 (일시정지)');
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
  
  // 배경 타이머 색상 초기화
  const cosmicTimer = document.getElementById('cosmic-timer-display');
  cosmicTimer.classList.remove('warning', 'danger');
  
  // 상단 타이머 버튼 텍스트 복원
  const topTimerBtn = document.getElementById('btn-timer');
  if (topTimerBtn) {
    topTimerBtn.querySelector('.mode-emoji').textContent = '⏱️';
    topTimerBtn.querySelector('.mode-name').textContent = '타이머';
  }
  
  // 우주 테마 비활성화 (pauseTimer에서도 호출되지만 명시적으로)
  document.body.classList.remove('timer-cosmic-mode');
  console.log('🌌 우주 테마 비활성화 (초기화)');
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
  
  // 아바타는 loadClassData()에서 로드됨 (초기화 섹션 참조)
})();

// 초기 문제 로드 (3개 모두 표시 - 위젯용)
const initialProblems = [
  {
    id: 'sample-1',
    word: 'happy',
    meaning: '행복한, 기쁜',
    example: 'I am happy today.',
    example_ko: '나는 오늘 행복해요.',
    type: 'vocabulary',
    difficulty: 2,
    grade: '5-1',
    // 학생용 문제 데이터
    student_question: 'happy의 뜻은?',
    student_answer: '행복한',
    student_hint: '기쁜 마음을 나타내는 단어'
  },
  {
    id: 'sample-2',
    question: '속담: 티끌 모아 태산',
    hint: '작은 것이 모이면 큰 것이 됨',
    type: 'proverb',
    difficulty: 2,
    grade: '5-1',
    // 학생용 문제 데이터
    student_question: '티끌 모아 _____ (빈칸에 들어갈 말은?)',
    student_answer: '태산',
    student_hint: '작은 것이 모여 큰 것을 이룸'
  },
  {
    id: 'sample-3',
    word: '끈기',
    meaning: '어려운 일을 포기하지 않고 계속하는 마음',
    example: '끈기 있게 노력하면 반드시 성공할 수 있다.',
    type: 'vocab',
    difficulty: 2,
    grade: '5-1',
    // 학생용 문제 데이터
    student_question: '어려운 일을 포기하지 않고 계속하는 마음',
    student_answer: '끈기',
    student_hint: '인내심과 관련된 단어'
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

// API 설정 (환경 자동 감지)
const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = isLocalDevelopment 
  ? 'http://localhost:8000/api'
  : 'https://phpstack-1293143-5917982.cloudwaysapps.com/api';
const WS_BASE = isLocalDevelopment
  ? 'ws://localhost:8000'
  : 'wss://phpstack-1293143-5917982.cloudwaysapps.com';

console.log(`🌐 환경: ${isLocalDevelopment ? '로컬 개발' : '프로덕션'}`);
console.log(`📡 API: ${API_BASE}`);
console.log(`🔌 WebSocket: ${WS_BASE}`);

// 세션 관리
let currentSession = null;
let wsManager = null;

/**
 * localStorage에서 세션 불러오기
 */
function loadSession() {
  try {
    const savedSession = localStorage.getItem('currentSession');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      console.log('📂 저장된 세션 발견:', session.code);
      return session;
    }
  } catch (error) {
    console.error('❌ 세션 로드 오류:', error);
  }
  return null;
}

/**
 * localStorage에 세션 저장
 */
function saveSession(session) {
  try {
    localStorage.setItem('currentSession', JSON.stringify(session));
    console.log('💾 세션 저장:', session.code);
  } catch (error) {
    console.error('❌ 세션 저장 오류:', error);
  }
}

/**
 * 세션 검증 (만료 확인)
 */
async function validateSession(session) {
  try {
    const response = await fetch(`${API_BASE}/sessions/${session.code}`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 세션 유효:', session.code);
      return true;
    }
  } catch (error) {
    console.error('❌ 세션 검증 오류:', error);
  }
  return false;
}

/**
 * 세션 초기화 (교사 로그인 정보 기반)
 */
async function initSession() {
  // 교사 로그인 정보에서 세션 코드 가져오기
  const loginData = JSON.parse(localStorage.getItem('teacherLoginData'));
  const teacherSessionCode = loginData.sessionCode;
  
  console.log('🔑 교사 세션 코드:', teacherSessionCode);
  
  // 1. 저장된 세션 확인
  const savedSession = loadSession();
  
  // 2. 저장된 세션이 있고, 교사의 세션 코드와 일치하는지 확인
  if (savedSession && savedSession.code === teacherSessionCode) {
    // 3. 세션 유효성 검증
    const isValid = await validateSession(savedSession);
    
    if (isValid) {
      // 유효한 세션 재사용
      currentSession = savedSession;
      console.log('♻️ 기존 세션 재사용:', savedSession.code);
      
      // UI 업데이트
      // document.getElementById('session-code').textContent = savedSession.code; // UI 삭제됨
      updateQRCode(savedSession.qr_url);
      
      // WebSocket 연결
      connectWebSocket(savedSession.code);
      
      return savedSession;
    } else {
      console.log('⚠️ 저장된 세션이 만료됨, 새 세션 생성');
      localStorage.removeItem('currentSession');
    }
  }
  
  // 4. 교사의 세션 코드로 새 세션 생성
  return await createSessionWithCode(teacherSessionCode);
}

/**
 * 교사의 세션 코드로 세션 생성
 */
async function createSessionWithCode(sessionCode) {
  try {
    // 백엔드에서 해당 세션 코드로 세션 생성 요청
    const savedClassData = loadClassData();
    
    // 현재 표시된 문제 3개를 학생용 형식으로 변환
    const currentProblems = learningCard.problems.map(p => ({
      id: p.id,
      type: p.type,
      // 학생용 문제 데이터 사용 (있으면), 없으면 기본값
      question: p.student_question || p.question || p.word,
      answer: p.student_answer || p.answer || p.meaning,
      hint: p.student_hint || p.hint,
      difficulty: p.difficulty,
      grade: p.grade
    }));
    
    // 학생 명단 추출
    let studentNames = null;
    if (savedClassData?.studentNames) {
      const names = savedClassData.studentNames.split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);
      if (names.length > 0) {
        studentNames = names;
      }
    }
    
    const requestBody = {
      code: sessionCode,
      problems: currentProblems,
      ...(savedClassData?.classId && { class_id: savedClassData.classId }),
      ...(studentNames && { student_names: studentNames })
    };
    
    console.log('📚 세션 생성 (문제 포함):', currentProblems.length, '개');
    if (studentNames) {
      console.log('👥 세션 생성 (학생명단 포함):', studentNames.length, '명');
    }
    
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
    
    // 세션 저장
    saveSession(session);
    
    console.log('✅ 교사 세션 생성:', session.code);
    
    // UI 업데이트
    // document.getElementById('session-code').textContent = session.code; // UI 삭제됨
    
    // QR 코드 생성 및 표시
    updateQRCode(session.qr_url);
    
    // WebSocket 연결
    connectWebSocket(session.code);
    
    return session;
  } catch (error) {
    console.error('❌ 세션 생성 오류:', error);
    console.log('📴 로컬 모드로 전환합니다...');
    
    // 로컬 모드: 교사 세션 코드 사용
    currentSession = {
      id: 'local',
      code: sessionCode,
      qr_url: `로컬 모드 (오프라인)`,
      is_local: true
    };
    
    // UI 업데이트
    // document.getElementById('session-code').textContent = sessionCode; // UI 삭제됨
    document.getElementById('qr-url').textContent = '로컬 모드 (오프라인)';
    document.getElementById('qr-code').innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">📴<br>오프라인 모드</div>';
    
    console.log('✅ 로컬 세션 생성:', sessionCode);
    
    // WebSocket 연결 시도하지 않음 (로컬 모드)
    return currentSession;
  }
}

/**
 * 새 세션 생성 (로컬 모드 폴백 지원) - 레거시
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
    
    // 세션 저장
    saveSession(session);
    
    console.log('✅ 온라인 세션 생성:', session.code);
    
    // UI 업데이트
    // document.getElementById('session-code').textContent = session.code; // UI 삭제됨
    
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
    // document.getElementById('session-code').textContent = localSessionCode; // UI 삭제됨
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
 * 교사 키 생성 (학교명 + 교사명)
 */
function getTeacherKey() {
  try {
    const loginData = JSON.parse(localStorage.getItem('teacherLoginData'));
    if (loginData && loginData.schoolName && loginData.teacherName) {
      // 안전한 키 생성 (특수문자 제거)
      const key = `${loginData.schoolName}_${loginData.teacherName}`.replace(/[^a-zA-Z0-9가-힣_]/g, '');
      return key;
    }
  } catch (error) {
    console.error('❌ 교사 키 생성 오류:', error);
  }
  return 'default'; // 기본값 (로그인 정보 없을 때)
}

/**
 * localStorage에서 우리반 데이터 불러오기 (교사별)
 */
function loadClassData() {
  try {
    const teacherKey = getTeacherKey();
    const storageKey = `classData_${teacherKey}`;
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      const classData = JSON.parse(savedData);
      console.log(`📂 [${teacherKey}] 저장된 우리반 정보 불러오기:`, classData);
      
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
      console.log(`📭 [${teacherKey}] 저장된 우리반 정보 없음`);
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
  // 기존 학생 아바타 제거 (선생님은 유지)
  avatarRenderer.avatars = [];
  
  // 선생님 메시지 설정
  if (classData.todayMessage && classData.todayMessage.trim()) {
    avatarRenderer.setTeacher(classData.todayMessage.trim());
    console.log('👨‍🏫 교사 메시지 설정:', classData.todayMessage.trim());
  } else {
    // 메시지가 없으면 기본 메시지
    avatarRenderer.setTeacher('우주 탐험을 시작합니다!');
  }
  
  // 학생 이름으로 아바타 생성
  if (classData.studentNames) {
    const names = classData.studentNames.split('\n').filter(name => name.trim());
    if (names.length > 0) {
      // 아바타 생성 (최대 12개)
      names.slice(0, 12).forEach((name, index) => {
        avatarRenderer.addAvatar(index, name);
      });
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
  
  wsManager = new WebSocketManager(sessionCode, avatarRenderer, WS_BASE, API_BASE);
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
const btnClassMode = document.getElementById('btn-classmode');
btnClassMode.addEventListener('click', () => {
  const currentMode = document.body.getAttribute('data-mode');
  if (currentMode === 'break') {
    setMode('class');
  } else {
    setMode('break');
  }
});

document.getElementById('btn-work').addEventListener('click', () => {
  const currentMode = document.body.getAttribute('data-mode');
  if (currentMode === 'work') {
    // 업무 모드에서 다시 클릭하면 쉬는시간 모드로
    setMode('break');
  } else {
    setMode('work');
  }
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
    // 교사별 localStorage 데이터 삭제
    const teacherKey = getTeacherKey();
    const storageKey = `classData_${teacherKey}`;
    const timetableKey = `timetable_${teacherKey}`;
    localStorage.removeItem(storageKey);
    localStorage.removeItem(timetableKey);
    console.log(`🗑️ [${teacherKey}] 우리반 정보 초기화 완료`);
    
    // 폼 초기값으로 리셋 (로그인한 교사의 학교 이름 유지)
    const loginData = JSON.parse(localStorage.getItem('teacherLoginData'));
    document.getElementById('school-name').value = loginData?.schoolName || '서울초등학교';
    document.getElementById('grade').value = '3';
    document.getElementById('class-number').value = '2';
    document.getElementById('student-count').value = '25';
    document.getElementById('student-names').value = '김철수\n이영희\n박민수\n정수현\n최지훈';
    document.getElementById('today-message').value = '오늘도 화이팅! 💪';
    
    // 시간표 입력 폼 초기화
    const days = ['mon', 'tue', 'wed', 'thu', 'fri'];
    days.forEach(day => {
      for (let period = 1; period <= 6; period++) {
        const input = document.getElementById(`${day}-${period}`);
        if (input) {
          input.value = '';
        }
      }
    });
    
    // 시간표 위젯 업데이트
    updateTimetableWidget();
    
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
  
  // 교사별 localStorage에 저장
  try {
    const teacherKey = getTeacherKey();
    const storageKey = `classData_${teacherKey}`;
    localStorage.setItem(storageKey, JSON.stringify(classData));
    console.log(`✅ [${teacherKey}] localStorage에 저장 완료`);
  } catch (error) {
    console.error('❌ localStorage 저장 오류:', error);
  }
  
  // 화면 업데이트
  applyClassData(classData);
  
  // 시간표 저장
  saveTimetable();
  
  // 시간표 위젯 업데이트
  updateTimetableWidget();
  
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

// 우리반 코드 모달 (UI 삭제됨 - 주석 처리)
// const codeModal = document.getElementById('code-modal');
// const sessionCodeBtn = document.getElementById('session-code-btn');
// const codeModalClose = document.getElementById('code-modal-close');
// const modalSessionCode = document.getElementById('modal-session-code');
// const copyCodeBtn = document.getElementById('copy-code-btn');
// const closeCodeBtn = document.getElementById('close-code-btn');

// sessionCodeBtn.addEventListener('click', () => {
//   // 현재 세션 코드를 모달에 복사
//   const currentCode = document.getElementById('session-code').textContent;
//   modalSessionCode.textContent = currentCode;
//   
//   codeModal.classList.add('active');
//   document.body.style.overflow = 'hidden';
// });

// codeModalClose.addEventListener('click', () => {
//   codeModal.classList.remove('active');
//   document.body.style.overflow = '';
// });

// closeCodeBtn.addEventListener('click', () => {
//   codeModal.classList.remove('active');
//   document.body.style.overflow = '';
// });

// copyCodeBtn.addEventListener('click', async () => {
//   const code = modalSessionCode.textContent;
//   try {
//     await navigator.clipboard.writeText(code);
//     copyCodeBtn.textContent = '✅ 복사됨!';
//     copyCodeBtn.style.background = '#45A049';
//     setTimeout(() => {
//       copyCodeBtn.textContent = '📋 복사하기';
//       copyCodeBtn.style.background = '#4CAF50';
//     }, 2000);
//   } catch (err) {
//     console.error('복사 실패:', err);
//     copyCodeBtn.textContent = '❌ 실패';
//     setTimeout(() => {
//       copyCodeBtn.textContent = '📋 복사하기';
//     }, 2000);
//   }
// });

// 코드 모달 외부 클릭 시 닫기 (UI 삭제됨 - 주석 처리)
// codeModal.addEventListener('click', (e) => {
//   if (e.target === codeModal) {
//     codeModal.classList.remove('active');
//     document.body.style.overflow = '';
//   }
// });

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

// 로그아웃 버튼 이벤트
document.getElementById('btn-logout').addEventListener('click', () => {
  const confirmed = confirm('로그아웃 하시겠습니까?\n\n현재 세션이 종료되고 다음 사용자가 접속할 수 있습니다.');
  
  if (confirmed) {
    // 1. 로그인 정보 삭제
    localStorage.removeItem('teacherLoginData');
    
    // 2. 세션 정보 삭제
    localStorage.removeItem('currentSession');
    
    // 3. 우리반 정보는 유지 (필요시 삭제 가능)
    // localStorage.removeItem('classData');
    
    console.log('🚪 로그아웃 완료');
    
    // 4. 로그인 페이지로 이동
    window.location.href = 'login.html';
  }
});

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

// localStorage에서 우리반 정보 불러오기 및 적용
const savedClassData = loadClassData();

if (savedClassData && (savedClassData.studentNames || savedClassData.todayMessage)) {
  // 저장된 데이터가 있으면 적용
  console.log('✅ 저장된 우리반 데이터 적용');
  applyClassData(savedClassData);
} else {
  // 저장된 데이터가 없으면 기본 테스트 아바타 생성
  console.log('📝 기본 테스트 아바타 생성');
  avatarRenderer.addAvatar(0, '테스트1');
  avatarRenderer.addAvatar(1, '테스트2');
  avatarRenderer.addAvatar(2, '테스트3');
  avatarRenderer.setTeacher('우주 탐험을 시작합니다!');
}

// 리사이즈 핸들러
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  backgroundSystem.resize(canvas.width, canvas.height);
});

// 즉시 렌더링 시작 (문제 카드 표시를 위해)
startRenderLoop();

// 세션 초기화 (기존 세션 재사용 또는 새로 생성)
initSession().then(() => {
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

// ========================================
// 스톱워치 기능
// ========================================
const stopwatchDisplay = document.getElementById('stopwatch');
const stopwatchStartBtn = document.getElementById('stopwatch-start-btn');
const stopwatchResetBtn = document.getElementById('stopwatch-reset-btn');
const stopwatchLapBtn = document.getElementById('stopwatch-lap-btn');
const stopwatchLaps = document.getElementById('stopwatch-laps');

let stopwatchInterval = null;
let stopwatchTime = 0;
let stopwatchRunning = false;
let lapCounter = 1;

function updateStopwatchDisplay() {
  const minutes = Math.floor(stopwatchTime / 6000);
  const seconds = Math.floor((stopwatchTime % 6000) / 100);
  const centiseconds = stopwatchTime % 100;
  
  stopwatchDisplay.textContent = 
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

stopwatchStartBtn.addEventListener('click', () => {
  if (!stopwatchRunning) {
    // 시작
    stopwatchRunning = true;
    stopwatchStartBtn.querySelector('.stopwatch-btn-text').textContent = '일시정지';
    stopwatchStartBtn.querySelector('.stopwatch-btn-icon').textContent = '⏸️';
    
    stopwatchInterval = setInterval(() => {
      stopwatchTime++;
      updateStopwatchDisplay();
    }, 10);
  } else {
    // 일시정지
    stopwatchRunning = false;
    stopwatchStartBtn.querySelector('.stopwatch-btn-text').textContent = '시작';
    stopwatchStartBtn.querySelector('.stopwatch-btn-icon').textContent = '▶️';
    clearInterval(stopwatchInterval);
  }
});

stopwatchResetBtn.addEventListener('click', () => {
  stopwatchRunning = false;
  stopwatchTime = 0;
  lapCounter = 1;
  clearInterval(stopwatchInterval);
  updateStopwatchDisplay();
  stopwatchStartBtn.querySelector('.stopwatch-btn-text').textContent = '시작';
  stopwatchStartBtn.querySelector('.stopwatch-btn-icon').textContent = '▶️';
  stopwatchLaps.innerHTML = '';
});

stopwatchLapBtn.addEventListener('click', () => {
  if (stopwatchRunning) {
    const lapItem = document.createElement('div');
    lapItem.className = 'stopwatch-lap-item';
    lapItem.textContent = `랩 ${lapCounter}: ${stopwatchDisplay.textContent}`;
    stopwatchLaps.insertBefore(lapItem, stopwatchLaps.firstChild);
    lapCounter++;
  }
});

// ========================================
// 판서 도구 기능
// ========================================
const boardCanvas = document.getElementById('board-canvas');
const boardCtx = boardCanvas ? boardCanvas.getContext('2d') : null;

if (boardCanvas && boardCtx) {
  // 캔버스 크기 설정
  function resizeBoardCanvas() {
    const rect = boardCanvas.getBoundingClientRect();
    boardCanvas.width = rect.width;
    boardCanvas.height = rect.height;
    
    // 배경색 설정
    boardCtx.fillStyle = '#2C3E50';
    boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
  }
  
  // 초기 크기 설정
  resizeBoardCanvas();
  
  // 그리기 상태
  let isDrawing = false;
  let currentTool = 'pen';
  let currentColor = '#ffffff';
  let currentSize = 3;
  let lastX = 0;
  let lastY = 0;
  
  // 도구 버튼
  const penBtn = document.getElementById('pen-btn');
  const eraserBtn = document.getElementById('eraser-btn');
  const colorPicker = document.getElementById('color-picker');
  const sizeSlider = document.getElementById('size-slider');
  const clearBtn = document.getElementById('clear-btn');
  const saveBtn = document.getElementById('save-btn');
  
  // 도구 선택
  penBtn.addEventListener('click', () => {
    currentTool = 'pen';
    penBtn.classList.add('active');
    eraserBtn.classList.remove('active');
  });
  
  eraserBtn.addEventListener('click', () => {
    currentTool = 'eraser';
    eraserBtn.classList.add('active');
    penBtn.classList.remove('active');
  });
  
  colorPicker.addEventListener('change', (e) => {
    currentColor = e.target.value;
    currentTool = 'pen';
    penBtn.classList.add('active');
    eraserBtn.classList.remove('active');
  });
  
  sizeSlider.addEventListener('input', (e) => {
    currentSize = parseInt(e.target.value);
  });
  
  clearBtn.addEventListener('click', () => {
    if (confirm('판서 내용을 모두 지우시겠습니까?')) {
      boardCtx.fillStyle = '#2C3E50';
      boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
    }
  });
  
  saveBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `판서_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = boardCanvas.toDataURL();
    link.click();
  });
  
  // 그리기 함수
  function draw(x, y) {
    if (!isDrawing) return;
    
    boardCtx.beginPath();
    boardCtx.moveTo(lastX, lastY);
    boardCtx.lineTo(x, y);
    boardCtx.strokeStyle = currentTool === 'eraser' ? '#2C3E50' : currentColor;
    boardCtx.lineWidth = currentTool === 'eraser' ? currentSize * 3 : currentSize;
    boardCtx.lineCap = 'round';
    boardCtx.lineJoin = 'round';
    boardCtx.stroke();
    
    lastX = x;
    lastY = y;
  }
  
  // 마우스 이벤트
  boardCanvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const rect = boardCanvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
  });
  
  boardCanvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const rect = boardCanvas.getBoundingClientRect();
    draw(e.clientX - rect.left, e.clientY - rect.top);
  });
  
  boardCanvas.addEventListener('mouseup', () => {
    isDrawing = false;
  });
  
  boardCanvas.addEventListener('mouseleave', () => {
    isDrawing = false;
  });
  
  // 터치 이벤트
  boardCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDrawing = true;
    const rect = boardCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    lastX = touch.clientX - rect.left;
    lastY = touch.clientY - rect.top;
  });
  
  boardCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const rect = boardCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    draw(touch.clientX - rect.left, touch.clientY - rect.top);
  });
  
  boardCanvas.addEventListener('touchend', () => {
    isDrawing = false;
  });
  
  // 윈도우 리사이즈 시 캔버스 크기 조정
  window.addEventListener('resize', () => {
    if (document.body.getAttribute('data-mode') === 'class') {
      resizeBoardCanvas();
    }
  });
  
  // 초기 도구 설정
  penBtn.classList.add('active');
}

console.log('✅ 스톱워치 & 판서 도구 초기화 완료');

// ========================================
// 시간표 기능
// ========================================

// 시간표 데이터 저장
function saveTimetable() {
  const teacherKey = getTeacherKey();
  const timetableKey = `timetable_${teacherKey}`;
  
  const timetable = {};
  const days = ['mon', 'tue', 'wed', 'thu', 'fri'];
  
  days.forEach(day => {
    timetable[day] = [];
    for (let period = 1; period <= 6; period++) {
      const input = document.getElementById(`${day}-${period}`);
      if (input) {
        timetable[day].push(input.value.trim());
      }
    }
  });
  
  localStorage.setItem(timetableKey, JSON.stringify(timetable));
  console.log('✅ 시간표 저장 완료');
}

// 시간표 데이터 로드
function loadTimetable() {
  const teacherKey = getTeacherKey();
  const timetableKey = `timetable_${teacherKey}`;
  
  const saved = localStorage.getItem(timetableKey);
  if (!saved) return null;
  
  try {
    const timetable = JSON.parse(saved);
    
    // 입력 폼에 데이터 채우기
    const days = ['mon', 'tue', 'wed', 'thu', 'fri'];
    days.forEach(day => {
      if (timetable[day]) {
        timetable[day].forEach((subject, index) => {
          const input = document.getElementById(`${day}-${index + 1}`);
          if (input) {
            input.value = subject;
          }
        });
      }
    });
    
    console.log('✅ 시간표 로드 완료');
    return timetable;
  } catch (error) {
    console.error('❌ 시간표 로드 오류:', error);
    return null;
  }
}

// 현재 요일과 교시 계산
function getCurrentPeriod() {
  const now = new Date();
  const day = now.getDay(); // 0(일) ~ 6(토)
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // 주말은 null 반환
  if (day === 0 || day === 6) {
    return null;
  }
  
  // 요일 변환 (1:월 ~ 5:금)
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayName = dayNames[day];
  const dayKorean = ['일', '월', '화', '수', '목', '금', '토'][day];
  
  // 교시 계산 (대략적인 시간)
  // 1교시: 09:00-09:40
  // 2교시: 09:50-10:30
  // 3교시: 10:40-11:20
  // 4교시: 11:30-12:10
  // 점심: 12:10-13:10
  // 5교시: 13:10-13:50
  // 6교시: 14:00-14:40
  
  let period = 0;
  const timeInMinutes = hour * 60 + minute;
  
  if (timeInMinutes >= 540 && timeInMinutes < 580) period = 1; // 09:00-09:40
  else if (timeInMinutes >= 590 && timeInMinutes < 630) period = 2; // 09:50-10:30
  else if (timeInMinutes >= 640 && timeInMinutes < 680) period = 3; // 10:40-11:20
  else if (timeInMinutes >= 690 && timeInMinutes < 730) period = 4; // 11:30-12:10
  else if (timeInMinutes >= 790 && timeInMinutes < 830) period = 5; // 13:10-13:50
  else if (timeInMinutes >= 840 && timeInMinutes < 880) period = 6; // 14:00-14:40
  
  return {
    day: dayName,
    dayKorean: dayKorean,
    period: period
  };
}

// 시간표 위젯 업데이트
function updateTimetableWidget() {
  const timetableBody = document.getElementById('timetable-body');
  const timetableDate = document.getElementById('timetable-date');
  
  if (!timetableBody || !timetableDate) return;
  
  const teacherKey = getTeacherKey();
  const timetableKey = `timetable_${teacherKey}`;
  const saved = localStorage.getItem(timetableKey);
  
  if (!saved) {
    timetableBody.innerHTML = '<div class="timetable-empty">시간표를 등록해주세요</div>';
    return;
  }
  
  try {
    const timetable = JSON.parse(saved);
    const current = getCurrentPeriod();
    
    if (!current) {
      timetableBody.innerHTML = '<div class="timetable-empty">주말입니다 🎉</div>';
      timetableDate.textContent = '주말';
      return;
    }
    
    const daySchedule = timetable[current.day];
    
    if (!daySchedule || daySchedule.every(s => !s)) {
      timetableBody.innerHTML = '<div class="timetable-empty">시간표를 등록해주세요</div>';
      return;
    }
    
    // 요일 표시
    timetableDate.textContent = `${current.dayKorean}요일`;
    
    // 시간표 표시
    let html = '';
    daySchedule.forEach((subject, index) => {
      if (subject) {
        const periodNum = index + 1;
        const isCurrent = periodNum === current.period;
        html += `
          <div class="timetable-period ${isCurrent ? 'current' : ''}">
            <span class="period-number">${periodNum}교시</span>
            <span class="period-subject">${subject}</span>
          </div>
        `;
      }
    });
    
    if (html) {
      timetableBody.innerHTML = html;
    } else {
      timetableBody.innerHTML = '<div class="timetable-empty">시간표를 등록해주세요</div>';
    }
    
  } catch (error) {
    console.error('❌ 시간표 표시 오류:', error);
    timetableBody.innerHTML = '<div class="timetable-empty">오류가 발생했습니다</div>';
  }
}

// 초기 시간표 로드 및 위젯 업데이트
loadTimetable();
updateTimetableWidget();

// 1분마다 시간표 위젯 업데이트
setInterval(updateTimetableWidget, 60000);

console.log('✅ 시간표 기능 초기화 완료');

// ========================================
// 타이머 토글 기능
// ========================================
const timerBtn = document.getElementById('btn-timer');
const timerCard = document.getElementById('timer-card');

if (timerBtn && timerCard) {
  timerBtn.addEventListener('click', () => {
    // 현재 모드 확인
    const currentMode = document.body.getAttribute('data-mode');
    
    // 타이머가 실행 중이면 종료
    if (isTimerRunning) {
      pauseTimer();
      return;
    }
    
    // 수업시간 모드가 아닐 때만 타이머 카드 토글 가능
    if (currentMode !== 'class') {
      // 타이머가 보이는지 확인
      if (timerCard.classList.contains('show')) {
        // 숨기기
        timerCard.classList.remove('show', 'overlay');
        timerBtn.classList.remove('active');
      } else {
        // 보이기 (반투명 오버레이)
        timerCard.classList.add('show', 'overlay');
        timerBtn.classList.add('active');
      }
    }
  });
}

console.log('✅ 타이머 토글 기능 초기화 완료');
