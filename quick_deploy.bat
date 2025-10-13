@echo off
chcp 65001 >nul
cls
echo ========================================
echo ⚡ Cloudways 초간단 배포
echo ========================================
echo.
echo 서버: master_xhbedwcksw@167.172.70.163
echo.

set /p github_url="GitHub 레포 URL (예: https://github.com/username/classkit.git): "
if "%github_url%"=="" (
    echo ❌ GitHub URL을 입력해주세요!
    pause
    exit /b 1
)

echo.
echo ========================================
echo [1/2] GitHub 푸시 중...
echo ========================================
git add .
git commit -m "🚀 Deploy %date% %time%"
git remote remove origin 2>nul
git remote add origin %github_url%
git branch -M main
git push -u origin main

if %errorlevel% neq 0 (
    echo ❌ 푸시 실패
    pause
    exit /b 1
)

echo.
echo ✅ GitHub 푸시 완료!
echo.

echo ========================================
echo [2/2] SSH 배포 명령어 생성
echo ========================================
echo.

REM 원라이너 명령어 생성 (타임아웃 방지)
set "DEPLOY_CMD=cd ~ && mkdir -p classkit && cd classkit && git clone %github_url% . 2>/dev/null || git pull && cd backend && python3.11 -m venv venv && source venv/bin/activate && pip install -q -r requirements.txt && python -c \"from app.init_db import create_tables; import asyncio; asyncio.run(create_tables())\" && pkill -f uvicorn ; nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > ~/classkit.log 2>&1 &"

echo %DEPLOY_CMD% > ssh_oneliner.txt

echo ✅ 배포 명령어 생성 완료!
echo.

echo ========================================
echo 📋 다음 단계 (2분이면 끝!)
echo ========================================
echo.
echo 1. SSH 접속:
echo.
echo    ssh master_xhbedwcksw@167.172.70.163
echo.
echo    비밀번호: QVvvNXGAaSd9
echo.
echo.
echo 2. 아래 명령어 전체 복사 → SSH에 붙여넣기 (한 번에!):
echo.
echo ========================================
type ssh_oneliner.txt
echo ========================================
echo.
echo ✅ 위 명령어가 클립보드에 복사됩니다...
type ssh_oneliner.txt | clip
echo.
echo 3. SSH 창에서 마우스 우클릭 (붙여넣기)
echo.
echo 4. 완료 후 확인:
echo    curl http://localhost:8000/health
echo.
echo ========================================
echo 🌐 접속 URL
echo ========================================
echo.
echo 모바일: http://167.172.70.163:8000
echo API: http://167.172.70.163:8000/api
echo Health: http://167.172.70.163:8000/health
echo.
echo ========================================
echo 🎯 위젯 설정
echo ========================================
echo.
echo widget/src/main.js 파일 수정:
echo.
echo const API_BASE = 'http://167.172.70.163:8000/api';
echo const WS_BASE = 'ws://167.172.70.163:8000';
echo.
echo ========================================
echo.

pause

REM SSH 자동 실행 옵션
set /p run_ssh="SSH 자동 접속할까요? (y/n): "
if /i "%run_ssh%"=="y" (
    echo.
    echo SSH 접속 중... 비밀번호 입력 후 Ctrl+Shift+V 또는 우클릭으로 붙여넣기!
    echo.
    ssh master_xhbedwcksw@167.172.70.163
)

