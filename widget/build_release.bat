@echo off
chcp 65001 >nul
echo ========================================
echo 우리반 위젯 - EXE 빌드 스크립트
echo ========================================
echo.

echo [1/4] 의존성 확인 중...
call npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js가 설치되어 있지 않습니다.
    echo    https://nodejs.org 에서 다운로드하세요.
    pause
    exit /b 1
)
echo ✅ Node.js 확인 완료
echo.

echo [2/4] 의존성 설치 중...
call npm install
if errorlevel 1 (
    echo ❌ 의존성 설치 실패
    pause
    exit /b 1
)
echo ✅ 의존성 설치 완료
echo.

echo [3/4] 프로젝트 빌드 중...
call npm run build
if errorlevel 1 (
    echo ❌ 빌드 실패
    pause
    exit /b 1
)
echo ✅ 빌드 완료
echo.

echo [4/4] EXE 파일 생성 중...
call npm run electron:build
if errorlevel 1 (
    echo ❌ EXE 생성 실패
    pause
    exit /b 1
)
echo ✅ EXE 생성 완료
echo.

echo ========================================
echo 🎉 빌드 성공!
echo ========================================
echo.
echo 📦 생성된 파일:
echo    release\우리반 위젯 Setup 0.4.0.exe (설치 프로그램)
echo    release\우리반 위젯 0.4.0.exe (포터블 버전)
echo.
echo 💡 다음 단계:
echo    1. release 폴더의 EXE 파일을 테스트하세요
echo    2. GitHub Release에 업로드하세요
echo    3. 사용자에게 배포하세요
echo.
pause

