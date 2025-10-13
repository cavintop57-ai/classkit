@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 Cloudways SSH 배포 도우미
echo ========================================
echo.

set /p github_url="GitHub 레포 URL: "
if "%github_url%"=="" (
    echo ❌ GitHub URL이 필요합니다!
    pause
    exit /b 1
)

echo.
echo ========================================
echo 📋 배포 명령어 생성 중...
echo ========================================
echo.

REM 배포 명령어 생성
(
echo #!/bin/bash
echo set -e
echo echo "🚀 ClassKit 배포 시작..."
echo APP_DIR="/home/master_xxx/applications/classkit"
echo REPO="%github_url%"
echo.
echo # 디렉터리 생성
echo mkdir -p ${APP_DIR}/{public_html,logs,conf/supervisor,conf/nginx}
echo.
echo # Git 클론/업데이트
echo cd ${APP_DIR}/public_html
echo if [ -d ".git" ]; then
echo   echo "📥 코드 업데이트..."
echo   git pull origin main
echo else
echo   echo "📥 코드 다운로드..."
echo   git clone ${REPO} .
echo fi
echo.
echo # Python 환경
echo cd backend
echo if [ ! -d "venv" ]; then
echo   echo "🐍 가상환경 생성..."
echo   python3.11 -m venv venv
echo fi
echo source venv/bin/activate
echo.
echo # 패키지 설치
echo echo "📦 패키지 설치..."
echo pip install -q --upgrade pip
echo pip install -q -r requirements.txt
echo.
echo # DB 초기화
echo echo "🗄️ DB 초기화..."
echo python -c "from app.init_db import create_tables; import asyncio; asyncio.run(create_tables(^)^)"
echo.
echo # Supervisor 설정
echo echo "⚙️ Supervisor 설정..."
echo sudo tee ${APP_DIR}/conf/supervisor/classkit.conf ^> /dev/null ^<^< 'EOF'
echo [program:classkit]
echo command=/home/master_xxx/applications/classkit/public_html/backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
echo directory=/home/master_xxx/applications/classkit/public_html/backend
echo user=master_xxx
echo autostart=true
echo autorestart=true
echo stderr_logfile=/home/master_xxx/applications/classkit/logs/classkit.err.log
echo stdout_logfile=/home/master_xxx/applications/classkit/logs/classkit.out.log
echo EOF
echo.
echo # Supervisor 재시작
echo echo "🔄 서비스 시작..."
echo sudo supervisorctl reread
echo sudo supervisorctl update
echo sudo supervisorctl restart classkit 2^>/dev/null ^|^| sudo supervisorctl start classkit
echo.
echo # 상태 확인
echo echo ""
echo echo "=========================================="
echo echo "✅ 배포 완료!"
echo echo "=========================================="
echo sudo supervisorctl status classkit
echo echo ""
echo curl -s http://localhost:8000/health ^|^| echo "⚠️ Health check 대기 중..."
echo echo ""
echo echo "🔗 접속: http://167.172.70.163:8000"
) > deploy_script.sh

echo ✅ 배포 스크립트 생성: deploy_script.sh
echo.

echo ========================================
echo 📋 복사해서 SSH에 붙여넣으세요
echo ========================================
echo.
echo 1단계: SSH 접속
echo    ssh master_xxx@167.172.70.163
echo    비밀번호: QVvvNXGAaSd9
echo.
echo 2단계: 아래 명령어 복사-붙여넣기
echo ----------------------------------------
type deploy_script.sh
echo ----------------------------------------
echo.

REM 클립보드에 복사 시도
type deploy_script.sh | clip
echo ✅ 클립보드에 복사되었습니다!
echo SSH 접속 후 마우스 우클릭으로 붙여넣기 하세요!
echo.

echo 3단계: 위젯 설정
echo    widget/src/main.js 수정:
echo    const API_BASE = 'http://167.172.70.163:8000/api';
echo    const WS_BASE = 'ws://167.172.70.163:8000';
echo.

pause

