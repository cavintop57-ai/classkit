@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 ClassKit Cloudways 배포
echo ========================================
echo.

echo [1/5] GitHub 레포 확인...
echo.
set /p github_url="GitHub 레포 URL 입력 (예: https://github.com/username/classkit.git): "
echo.

echo [2/5] Git 푸시 준비...
git add .
echo.

set /p commit_msg="커밋 메시지 (엔터 시 기본값): "
if "%commit_msg%"=="" set commit_msg=🚀 Deploy to Cloudways

git commit -m "%commit_msg%"
echo.

echo [3/5] GitHub에 푸시...
git remote remove origin 2>nul
git remote add origin %github_url%
git branch -M main
git push -u origin main
echo.

echo ========================================
echo ✅ GitHub 푸시 완료!
echo ========================================
echo.

echo [4/5] 배포 스크립트 생성 중...
echo.

REM 임시 배포 스크립트 생성
(
echo #!/bin/bash
echo set -e
echo echo "🚀 ClassKit 배포 시작..."
echo echo ""
echo.
echo # 변수 설정
echo APP_DIR="/home/master_xxx/applications/classkit"
echo GITHUB_REPO="%github_url%"
echo.
echo # 디렉터리 생성
echo echo "📁 디렉터리 생성..."
echo mkdir -p ${APP_DIR}/{public_html,logs,conf/supervisor,conf/nginx}
echo.
echo # Git 클론
echo echo "📥 코드 다운로드..."
echo cd ${APP_DIR}/public_html
echo if [ -d ".git" ]; then
echo   git pull origin main
echo else
echo   git clone ${GITHUB_REPO} .
echo fi
echo.
echo # 가상환경 설정
echo echo "🐍 Python 가상환경..."
echo cd backend
echo python3.11 -m venv venv
echo source venv/bin/activate
echo.
echo # 패키지 설치
echo echo "📦 패키지 설치..."
echo pip install --upgrade pip
echo pip install -r requirements.txt
echo.
echo # DB 초기화
echo echo "🗄️ 데이터베이스 초기화..."
echo python -c "from app.init_db import create_tables; import asyncio; asyncio.run(create_tables(^)"
echo.
echo # Supervisor 설정
echo echo "⚙️ Supervisor 설정..."
echo cat ^> ${APP_DIR}/conf/supervisor/classkit.conf ^<^< 'EOFSUPER'
echo [program:classkit]
echo command=/home/master_xxx/applications/classkit/public_html/backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
echo directory=/home/master_xxx/applications/classkit/public_html/backend
echo user=master_xxx
echo autostart=true
echo autorestart=true
echo stderr_logfile=/home/master_xxx/applications/classkit/logs/classkit.err.log
echo stdout_logfile=/home/master_xxx/applications/classkit/logs/classkit.out.log
echo environment=PATH="/home/master_xxx/applications/classkit/public_html/backend/venv/bin"
echo EOFSUPER
echo.
echo # Supervisor 시작
echo echo "🔄 서비스 시작..."
echo sudo supervisorctl reread
echo sudo supervisorctl update
echo sudo supervisorctl restart classkit
echo.
echo # 상태 확인
echo echo "📊 서비스 상태:"
echo sudo supervisorctl status classkit
echo.
echo # Health check
echo echo "🏥 Health Check:"
echo curl http://localhost:8000/health
echo.
echo echo "✅ 배포 완료!"
echo echo "🔗 접속: http://167.172.70.163:8000"
) > cloudways_auto_deploy.sh

echo 배포 스크립트 생성 완료: cloudways_auto_deploy.sh
echo.

echo [5/5] SSH 접속 안내...
echo.
echo ========================================
echo 📝 다음 단계
echo ========================================
echo.
echo 1. SSH 접속:
echo    ssh master_xxx@167.172.70.163
echo    비밀번호: QVvvNXGAaSd9
echo.
echo 2. 배포 스크립트 실행:
echo    # 스크립트 업로드 방법 선택
echo.
echo    방법 A - 직접 입력:
echo      nano deploy.sh
echo      (cloudways_auto_deploy.sh 내용 복사-붙여넣기)
echo      Ctrl+O, Enter, Ctrl+X
echo      chmod +x deploy.sh
echo      bash deploy.sh
echo.
echo    방법 B - SCP로 업로드:
echo      scp cloudways_auto_deploy.sh master_xxx@167.172.70.163:~/deploy.sh
echo      ssh master_xxx@167.172.70.163
echo      chmod +x deploy.sh
echo      bash deploy.sh
echo.
echo 3. 완료 후 위젯 설정:
echo    widget/src/main.js 에서:
echo    const API_BASE = 'http://167.172.70.163:8000/api';
echo    const WS_BASE = 'ws://167.172.70.163:8000';
echo.
echo ========================================
echo.

pause

