@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 ClassKit Cloudways 원클릭 배포
echo ========================================
echo.
echo 서버: 167.172.70.163
echo.

REM GitHub URL 입력
set /p github_url="GitHub 레포 URL: "
if "%github_url%"=="" (
    echo ❌ GitHub URL이 필요합니다!
    pause
    exit /b 1
)

echo.
echo [1/3] GitHub 푸시 중...
git add .
git commit -m "🚀 Deploy to Cloudways %date% %time%"
git remote remove origin 2>nul
git remote add origin %github_url%
git branch -M main
git push -u origin main

if %errorlevel% neq 0 (
    echo ❌ Git 푸시 실패. GitHub 레포가 올바른지 확인하세요.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ GitHub 푸시 완료!
echo ========================================
echo.

echo [2/3] SSH 명령어 생성 중...
echo.

REM SSH 원라인 명령어 파일 생성
(
echo cd /tmp ^&^& cat ^> deploy_classkit.sh ^<^< 'DEPLOY_EOF'
echo #!/bin/bash
echo set -e
echo APP_DIR="/home/master_xxx/applications/classkit"
echo REPO="%github_url%"
echo mkdir -p ${APP_DIR}/{public_html,logs,conf/supervisor,conf/nginx}
echo cd ${APP_DIR}/public_html
echo if [ -d ".git" ]; then git pull origin main; else git clone ${REPO} .; fi
echo cd backend
echo python3.11 -m venv venv
echo source venv/bin/activate
echo pip install -q --upgrade pip
echo pip install -q -r requirements.txt
echo python -c "from app.init_db import create_tables; import asyncio; asyncio.run(create_tables(^)^)"
echo cat ^> ${APP_DIR}/conf/supervisor/classkit.conf ^<^< 'SUPEOF'
echo [program:classkit]
echo command=/home/master_xxx/applications/classkit/public_html/backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
echo directory=/home/master_xxx/applications/classkit/public_html/backend
echo user=master_xxx
echo autostart=true
echo autorestart=true
echo stderr_logfile=/home/master_xxx/applications/classkit/logs/classkit.err.log
echo stdout_logfile=/home/master_xxx/applications/classkit/logs/classkit.out.log
echo SUPEOF
echo sudo supervisorctl reread
echo sudo supervisorctl update
echo sudo supervisorctl restart classkit
echo sudo supervisorctl status classkit
echo curl -s http://localhost:8000/health
echo echo ""
echo echo "✅ 배포 완료! http://167.172.70.163:8000"
echo DEPLOY_EOF
echo chmod +x deploy_classkit.sh ^&^& bash deploy_classkit.sh
) > ssh_deploy_command.txt

echo 배포 명령어 생성 완료!
echo.

echo [3/3] SSH 접속 및 배포...
echo.
echo ========================================
echo 📝 SSH로 배포 실행
echo ========================================
echo.
echo 아래 명령어를 복사해서 실행하세요:
echo.
echo ssh master_xxx@167.172.70.163
echo.
echo SSH 접속 후, 아래 명령어 붙여넣기:
echo (ssh_deploy_command.txt 파일 내용을 확인하세요)
echo.
type ssh_deploy_command.txt
echo.
echo ========================================
echo.
echo 또는 원클릭 실행:
echo.

REM PuTTY/SSH 자동 실행 시도
echo ssh master_xxx@167.172.70.163
echo 비밀번호: QVvvNXGAaSd9
echo.
echo 접속 후 위 명령어 붙여넣기!
echo.

pause

REM 선택적으로 SSH 바로 실행
set /p auto_ssh="SSH 자동 접속하시겠습니까? (y/n): "
if /i "%auto_ssh%"=="y" (
    echo.
    echo SSH 접속 중...
    ssh master_xxx@167.172.70.163
)

