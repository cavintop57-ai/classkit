@echo off
chcp 65001 >nul
echo ========================================
echo 📤 GitHub 푸시
echo ========================================
echo.

REM GitHub URL 입력
set /p github_url="GitHub 레포 URL: "
if "%github_url%"=="" (
    echo.
    echo ❌ GitHub URL을 입력해주세요!
    echo 예: https://github.com/username/classkit.git
    echo.
    pause
    exit /b 1
)

echo.
echo Git 상태 확인 중...
git status

echo.
echo 모든 파일 추가 중...
git add .

echo.
set /p commit_msg="커밋 메시지 (엔터 시 기본값): "
if "%commit_msg%"=="" set commit_msg=🚀 Update ClassKit

echo.
echo 커밋 생성 중...
git commit -m "%commit_msg%"

echo.
echo GitHub 연결 중...
git remote remove origin 2>nul
git remote add origin %github_url%

echo.
echo GitHub 푸시 중...
git branch -M main
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo ❌ 푸시 실패
    echo ========================================
    echo.
    echo 가능한 원인:
    echo 1. GitHub 레포가 비공개이고 인증이 필요함
    echo 2. URL이 잘못됨
    echo 3. 인터넷 연결 문제
    echo.
    echo GitHub Personal Access Token 필요 시:
    echo https://github.com/settings/tokens
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ GitHub 푸시 완료!
echo ========================================
echo.
echo 레포 URL: %github_url%
echo.
echo 📝 다음 단계:
echo 1. SSH 접속: ssh master_xxx@167.172.70.163
echo 2. 배포 스크립트 실행 (CLOUDWAYS_QUICK_START.md 참고)
echo.

pause

