@echo off
echo ========================================
echo Railway 배포 준비
echo ========================================
echo.

echo [1/3] Git 상태 확인...
git status

echo.
echo [2/3] 모든 파일 추가...
git add .

echo.
echo [3/3] 커밋 생성...
set /p commit_msg="커밋 메시지 입력 (엔터 시 기본값): "
if "%commit_msg%"=="" set commit_msg=🚀 Update ClassKit

git commit -m "%commit_msg%"

echo.
echo ========================================
echo ✅ 준비 완료!
echo ========================================
echo.
echo 다음 단계:
echo 1. GitHub에 새 레포지토리 생성
echo 2. 아래 명령어로 GitHub에 푸시:
echo.
echo    git remote add origin https://github.com/YOUR_USERNAME/classkit.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. Railway 대시보드에서 GitHub 레포 연결
echo.
echo 자세한 내용은 DEPLOY.md 참고!
echo.

pause

