@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 Cloudways 파일 업로드 & 배포
echo ========================================
echo.

set /p github_url="GitHub 레포 URL: "
if "%github_url%"=="" (
    echo ❌ GitHub URL이 필요합니다!
    pause
    exit /b 1
)

echo.
echo [1/4] GitHub 푸시 중...
git add .
git commit -m "🚀 Deploy to Cloudways"
git remote remove origin 2>nul
git remote add origin %github_url%
git branch -M main
git push -u origin main

echo.
echo [2/4] 배포 스크립트 생성 중...

REM 간단한 배포 스크립트 생성
(
echo #!/bin/bash
echo set -e
echo.
echo # 설정
echo APP_DIR="/home/master_xxx/applications/classkit"
echo REPO="%github_url%"
echo.
echo echo "🚀 ClassKit 배포 중..."
echo.
echo # 1. 디렉터리 생성
echo mkdir -p ${APP_DIR}/public_html ${APP_DIR}/logs
echo.
echo # 2. 코드 다운로드
echo cd ${APP_DIR}/public_html
echo if [ -d .git ]; then
echo   git pull origin main
echo else
echo   git clone ${REPO} .
echo fi
echo.
echo # 3. Python 설정
echo cd backend
echo python3.11 -m venv venv
echo source venv/bin/activate
echo pip install -q -r requirements.txt
echo.
echo # 4. DB 초기화
echo python -c "from app.init_db import create_tables; import asyncio; asyncio.run(create_tables(^)^)"
echo.
echo # 5. Supervisor 설정 파일 생성
echo sudo bash -c "cat ^> /etc/supervisor/conf.d/classkit.conf ^<^< 'SUPEOF'
echo [program:classkit]
echo command=${APP_DIR}/public_html/backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
echo directory=${APP_DIR}/public_html/backend
echo user=master_xxx
echo autostart=true
echo autorestart=true
echo stderr_logfile=${APP_DIR}/logs/error.log
echo stdout_logfile=${APP_DIR}/logs/access.log
echo SUPEOF
echo "
echo.
echo # 6. 서비스 시작
echo sudo supervisorctl reread
echo sudo supervisorctl update
echo sudo supervisorctl restart classkit 2^>/dev/null ^|^| sudo supervisorctl start classkit
echo.
echo # 7. 결과 확인
echo echo "✅ 배포 완료!"
echo sudo supervisorctl status classkit
echo curl -s http://localhost:8000/health
) > deploy_to_server.sh

echo ✅ 스크립트 생성: deploy_to_server.sh
echo.

echo [3/4] 서버에 업로드 중...
echo.
echo SCP로 파일 업로드...
scp deploy_to_server.sh master_xxx@167.172.70.163:~/classkit_deploy.sh

if %errorlevel% neq 0 (
    echo.
    echo ⚠️ SCP 실패. 수동으로 진행하세요:
    echo.
    echo 1. deploy_to_server.sh 파일 열기
    echo 2. 내용 전체 복사
    echo 3. SSH 접속: ssh master_xxx@167.172.70.163
    echo 4. nano classkit_deploy.sh
    echo 5. 붙여넣기
    echo 6. Ctrl+O, Enter, Ctrl+X
    echo 7. bash classkit_deploy.sh
    echo.
    pause
    exit /b 0
)

echo.
echo [4/4] SSH 접속 및 실행...
echo.
echo 아래 명령어 2개만 실행하세요:
echo.
echo ========================================
echo chmod +x ~/classkit_deploy.sh
echo bash ~/classkit_deploy.sh
echo ========================================
echo.

REM SSH 자동 접속 시도
ssh master_xxx@167.172.70.163

pause

