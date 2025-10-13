@echo off
chcp 65001 >nul
echo ========================================
echo 🔄 Cloudways 업데이트
echo ========================================
echo.

echo [1/2] GitHub 푸시...
git add .
set /p msg="커밋 메시지 (엔터=자동): "
if "%msg%"=="" set msg=✨ Update

git commit -m "%msg%"
git push

if %errorlevel% neq 0 (
    echo ❌ 푸시 실패
    pause
    exit /b 1
)

echo ✅ GitHub 푸시 완료!
echo.

echo [2/2] 서버 업데이트...
echo.
echo SSH 접속 정보:
echo   ssh master_xhbedwcksw@167.172.70.163
echo   비밀번호: Q1w2e3r4!@
echo.
echo 업데이트 명령어 (클립보드에 복사됨):
set "update_cmd=cd ~/classkit && git pull origin main && python3 -m pip install --user -r backend/requirements.txt && pkill -f uvicorn || true && cd ~/classkit/backend && nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > ~/classkit.log 2>&1 & disown && sleep 3 && curl http://localhost:8000/health"
echo %update_cmd% | clip
echo.
echo %update_cmd%
echo.

pause

