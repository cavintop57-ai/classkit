@echo off
chcp 65001 >nul
echo ========================================
echo 📋 Cloudways 서버 정보 확인
echo ========================================
echo.
echo SSH가 1분 후 끊긴다면:
echo - Cloudways 대시보드에서 정보 확인이 더 쉽습니다!
echo.
echo ========================================
echo 🔍 1단계: Cloudways 대시보드 확인
echo ========================================
echo.
echo 1. https://platform.cloudways.com 로그인
echo.
echo 2. Servers 메뉴 클릭
echo.
echo 3. 사용 중인 서버 선택
echo.
echo 4. "Master Credentials" 또는 "Access Details" 탭
echo.
echo 5. 아래 정보 확인:
echo    - Username (master_로 시작하는 실제 이름)
echo    - Public IP (167.172.70.163 맞는지 확인)
echo    - SSH Port (보통 22)
echo.
echo ========================================
echo 📝 확인된 정보를 아래에 입력:
echo ========================================
echo.

set /p real_username="실제 Username (예: master_abcd1234): "
set /p real_ip="서버 IP (엔터 시 167.172.70.163): "
if "%real_ip%"=="" set real_ip=167.172.70.163

set /p real_password="비밀번호 (엔터 시 기존 비번): "
if "%real_password%"=="" set real_password=QVvvNXGAaSd9

echo.
echo ========================================
echo ✅ 확인된 정보:
echo ========================================
echo Username: %real_username%
echo IP: %real_ip%
echo Password: %real_password%
echo.

REM 정보 저장
(
echo CLOUDWAYS_USER=%real_username%
echo CLOUDWAYS_IP=%real_ip%
echo CLOUDWAYS_PASS=%real_password%
) > cloudways_config.txt

echo ✅ 정보 저장됨: cloudways_config.txt
echo.

echo ========================================
echo 🔧 타임아웃 문제 해결
echo ========================================
echo.
echo SSH 1분 타임아웃 해결 방법:
echo.
echo 방법 A - Cloudways 대시보드 사용 (추천):
echo   → Application Manager에서 직접 Git 배포 가능!
echo.
echo 방법 B - SSH KeepAlive 설정:
echo.

set /p create_ssh_config="SSH 설정 파일 생성할까요? (y/n): "
if /i "%create_ssh_config%"=="y" (
    if not exist "%USERPROFILE%\.ssh" mkdir "%USERPROFILE%\.ssh"
    
    echo.
    echo Host cloudways > "%USERPROFILE%\.ssh\config"
    echo     HostName %real_ip% >> "%USERPROFILE%\.ssh\config"
    echo     User %real_username% >> "%USERPROFILE%\.ssh\config"
    echo     ServerAliveInterval 30 >> "%USERPROFILE%\.ssh\config"
    echo     ServerAliveCountMax 120 >> "%USERPROFILE%\.ssh\config"
    
    echo ✅ SSH 설정 생성: %USERPROFILE%\.ssh\config
    echo.
    echo 이제 이렇게 접속하세요:
    echo ssh cloudways
    echo.
)

echo.
echo ========================================
echo 📝 다음 단계
echo ========================================
echo.
echo 선택 1 - Cloudways 대시보드 사용 (가장 쉬움!):
echo   → cloudways_dashboard_deploy.bat 실행
echo.
echo 선택 2 - SSH 접속 재시도:
echo   → ssh %real_username%@%real_ip%
echo   → 타임아웃 방지로 빠르게 진행
echo.

pause

