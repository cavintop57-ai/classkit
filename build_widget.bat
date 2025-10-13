@echo off
echo ========================================
echo 우리반 위젯 빌드 시작
echo ========================================
echo.

cd widget

echo [1/4] Vite 빌드 중...
call npm run build
if %errorlevel% neq 0 (
    echo 오류: Vite 빌드 실패
    pause
    exit /b 1
)

echo.
echo [2/4] 빌드 디렉터리 생성 중...
if not exist "build" mkdir build

echo.
echo [3/4] Electron Builder 빌드 중...
call npx electron-builder --win --x64
if %errorlevel% neq 0 (
    echo 오류: Electron 빌드 실패
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ 빌드 완료!
echo ========================================
echo.
echo 설치 파일 위치: widget\release\
echo.

explorer release

pause

