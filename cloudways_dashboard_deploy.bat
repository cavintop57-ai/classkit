@echo off
chcp 65001 >nul
echo ========================================
echo 🎯 Cloudways 대시보드 배포 (가장 쉬움!)
echo ========================================
echo.
echo SSH 타임아웃 문제를 피해서 대시보드로 배포합니다!
echo.

REM 설정 파일 읽기
if exist cloudways_config.txt (
    for /f "tokens=1,2 delims==" %%a in (cloudways_config.txt) do (
        if "%%a"=="CLOUDWAYS_USER" set CLOUDWAYS_USER=%%b
        if "%%a"=="CLOUDWAYS_IP" set CLOUDWAYS_IP=%%b
    )
) else (
    set /p CLOUDWAYS_USER="Cloudways Username: "
    set CLOUDWAYS_IP=167.172.70.163
)

echo.
echo [1/2] GitHub에 푸시...
echo.

set /p github_url="GitHub 레포 URL: "
if "%github_url%"=="" (
    echo ❌ GitHub URL이 필요합니다!
    pause
    exit /b 1
)

git add .
git commit -m "🚀 Deploy to Cloudways"
git remote remove origin 2>nul
git remote add origin %github_url%
git branch -M main
git push -u origin main

if %errorlevel% neq 0 (
    echo ❌ Git 푸시 실패
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ GitHub 푸시 완료!
echo ========================================
echo.

echo [2/2] Cloudways 대시보드 배포 가이드
echo.
echo ========================================
echo 📋 대시보드에서 하세요:
echo ========================================
echo.
echo 1. https://platform.cloudways.com 로그인
echo.
echo 2. Applications 메뉴
echo.
echo 3. "Add Application" 클릭
echo    - Name: ClassKit
echo    - Application: Custom PHP
echo    - Project Name: classkit
echo.
echo 4. "Deployment Via Git" 클릭
echo    - Git Remote Address: %github_url%
echo    - Branch Name: main
echo    - Deploy 클릭!
echo.
echo 5. Application Settings
echo    - "Application Settings" 탭
echo    - Run Command 추가:
echo.
echo      cd backend
echo      python3.11 -m venv venv
echo      source venv/bin/activate
echo      pip install -r requirements.txt
echo      python -c "from app.init_db import create_tables; import asyncio; asyncio.run(create_tables())"
echo      nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 ^&
echo.
echo ========================================
echo.
echo 또는 SSH 빠른 명령어 (타임아웃 대비):
echo.
echo SSH 접속:
echo   ssh %CLOUDWAYS_USER%@%CLOUDWAYS_IP%
echo.
echo 원라이너 명령어 (전체 복사 후 한 번에 붙여넣기):
echo.

REM 원라이너 명령어 생성
(
echo cd ~ ^&^& git clone %github_url% classkit ^&^& cd classkit/backend ^&^& python3.11 -m venv venv ^&^& source venv/bin/activate ^&^& pip install -r requirements.txt ^&^& python -c "from app.init_db import create_tables; import asyncio; asyncio.run(create_tables(^)^)" ^&^& nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 ^> ~/classkit.log 2^>^&1 ^&
) > oneliner_deploy.txt

type oneliner_deploy.txt
echo.

echo ✅ 명령어가 oneliner_deploy.txt에 저장됨
echo    → 이 파일 열어서 전체 복사 → SSH에 붙여넣기
echo.

echo ========================================
echo 🌐 배포 후 확인
echo ========================================
echo.
echo 접속 URL: http://%CLOUDWAYS_IP%:8000
echo Health: http://%CLOUDWAYS_IP%:8000/health
echo 모바일: http://%CLOUDWAYS_IP%:8000
echo.
echo widget/src/main.js 수정:
echo   const API_BASE = 'http://%CLOUDWAYS_IP%:8000/api';
echo   const WS_BASE = 'ws://%CLOUDWAYS_IP%:8000';
echo.

pause

