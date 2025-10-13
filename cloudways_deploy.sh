#!/bin/bash

# ClassKit Cloudways 자동 배포 스크립트
# 사용법: bash cloudways_deploy.sh

set -e  # 에러 발생 시 중단

echo "========================================="
echo "🚀 ClassKit Cloudways 배포 시작"
echo "========================================="
echo ""

# 변수 설정
APP_NAME="classkit"
APP_DIR="/home/master_xhbedwcksw/applications/${APP_NAME}"
GITHUB_REPO="https://github.com/YOUR_USERNAME/classkit.git"  # TODO: 실제 레포로 변경!

echo "📁 애플리케이션 디렉터리 생성..."
mkdir -p ${APP_DIR}/{public_html,logs,conf/supervisor,conf/nginx}

echo ""
echo "📥 Git 클론..."
cd ${APP_DIR}/public_html
if [ -d ".git" ]; then
    echo "이미 Git 저장소 존재. Pull 실행..."
    git pull origin main
else
    git clone ${GITHUB_REPO} .
fi

echo ""
echo "🐍 Python 가상환경 설정..."
cd backend
python3.11 -m venv venv
source venv/bin/activate

echo ""
echo "📦 패키지 설치..."
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "🗄️ 데이터베이스 초기화..."
python -c "from app.init_db import create_tables; import asyncio; asyncio.run(create_tables())"

echo ""
echo "⚙️ Supervisor 설정..."
cat > ${APP_DIR}/conf/supervisor/classkit.conf << 'EOF'
[program:classkit]
command=/home/master_xhbedwcksw/applications/classkit/public_html/backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
directory=/home/master_xhbedwcksw/applications/classkit/public_html/backend
user=master_xhbedwcksw
autostart=true
autorestart=true
stderr_logfile=/home/master_xhbedwcksw/applications/classkit/logs/classkit.err.log
stdout_logfile=/home/master_xhbedwcksw/applications/classkit/logs/classkit.out.log
environment=PATH="/home/master_xhbedwcksw/applications/classkit/public_html/backend/venv/bin"
EOF

echo ""
echo "🔄 Supervisor 재시작..."
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start classkit

echo ""
echo "📊 서비스 상태 확인..."
sudo supervisorctl status classkit

echo ""
echo "========================================="
echo "✅ 배포 완료!"
echo "========================================="
echo ""
echo "📝 다음 단계:"
echo "1. Nginx 설정: 아래 내용을 Cloudways 대시보드에서 설정"
echo "2. SSL 인증서: Let's Encrypt 활성화"
echo "3. 위젯 설정: widget/src/main.js에서 URL 업데이트"
echo ""
echo "🔗 접속 정보:"
echo "API: http://167.172.70.163:8000"
echo "Health: http://167.172.70.163:8000/health"
echo "모바일: http://167.172.70.163:8000"
echo ""
echo "📋 로그 확인:"
echo "tail -f ${APP_DIR}/logs/classkit.err.log"
echo ""

