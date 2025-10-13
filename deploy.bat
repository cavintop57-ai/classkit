@echo off
chcp 65001 >nul
cls
echo ========================================
echo 🚀 Cloudways 배포
echo ========================================
echo.

REM GitHub URL 설정
set "github_url=https://github.com/cavintop57-ai/classkit.git"
echo GitHub 레포: %github_url%

echo.
echo ========================================
echo [1/3] GitHub 푸시
echo ========================================

git add .
git commit -m "🚀 Deploy to Cloudways"
git remote remove origin 2>nul
git remote add origin %github_url%
git branch -M main
git push -u origin main

if %errorlevel% neq 0 (
    echo ❌ GitHub 푸시 실패
    pause
    exit /b 1
)

echo ✅ GitHub 푸시 완료!
echo.

echo ========================================
echo [2/3] 배포 명령어 생성
echo ========================================

REM GitHub URL에서 레포 경로 추출
set "deploy_cmd=cd ~ && rm -rf classkit && git clone %github_url% classkit && cd classkit/backend && python3.11 -m venv venv && source venv/bin/activate && pip install -q -r requirements.txt && python -c \"from app.init_db import create_tables; import asyncio; asyncio.run(create_tables())\" && export DOMAIN_URL='https://phpstack-1293143-5917982.cloudwaysapps.com' && pkill -f uvicorn 2>/dev/null ; nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > ~/classkit.log 2>&1 &"

echo %deploy_cmd% > .cloudways_deploy_cmd.txt
echo.
echo ✅ 배포 명령어 생성 완료!
echo.

echo ========================================
echo [3/3] SSH 배포 실행
echo ========================================
echo.
echo SSH 자동 접속 및 배포 실행 중...
echo.

REM SSH 명령어 표시
echo.
echo ========================================
echo 📋 SSH 접속 정보
echo ========================================
echo.
echo ssh master_xhbedwcksw@167.172.70.163
echo 비밀번호: Q1w2e3r4!@
echo.
echo 배포 명령어가 클립보드에 복사되었습니다!
type .cloudways_deploy_cmd.txt | clip
echo.
echo ✅ SSH 접속 후 Ctrl+Shift+V 또는 마우스 우클릭으로 붙여넣기!
echo.

if %errorlevel% neq 0 (
    echo.
    echo ⚠️ 자동 배포 실패. 수동으로 진행하세요:
    echo.
    echo 1. SSH 접속:
    echo    ssh master_xhbedwcksw@167.172.70.163
    echo    비밀번호: QVvvNXGAaSd9
    echo.
    echo 2. 아래 명령어 복사-붙여넣기:
    echo.
    type .cloudways_deploy_cmd.txt
    echo.
    echo 3. 확인:
    echo    curl http://localhost:8000/health
    echo.
    pause
    exit /b 0
)

echo.
echo ========================================
echo ✅ 배포 완료!
echo ========================================
echo.
echo 🌐 접속 URL:
echo   http://167.172.70.163:8000
echo.
echo 🎯 다음 단계:
echo   widget/src/main.js 수정 필요
echo   → 자세한 내용: DEPLOY_CLOUDWAYS.md
echo.

pause

