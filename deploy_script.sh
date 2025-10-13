#!/bin/bash
set -e
echo "🚀 ClassKit 배포 시작..."
APP_DIR="/home/master_xxx/applications/classkit"
REPO="https://github.com/cavintop57-ai/classkit"

# 디렉터리 생성
mkdir -p ${APP_DIR}/{public_html,logs,conf/supervisor,conf/nginx}

# Git 클론/업데이트
cd ${APP_DIR}/public_html
if [ -d ".git" ]; then
  echo "📥 코드 업데이트..."
  git pull origin main
else
  echo "📥 코드 다운로드..."
  git clone ${REPO} .
fi

# Python 환경
cd backend
if [ ! -d "venv" ]; then
  echo "🐍 가상환경 생성..."
  python3.11 -m venv venv
fi
source venv/bin/activate

# 패키지 설치
echo "📦 패키지 설치..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# DB 초기화
python -c "from app.init_db import create_tables; import asyncio; asyncio.run(create_tables(^)^)"

# Supervisor 설정
echo "⚙️ Supervisor 설정..."
sudo tee ${APP_DIR}/conf/supervisor/classkit.conf > /dev/null << 'EOF'
[program:classkit]
command=/home/master_xxx/applications/classkit/public_html/backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
directory=/home/master_xxx/applications/classkit/public_html/backend
user=master_xxx
autostart=true
autorestart=true
stderr_logfile=/home/master_xxx/applications/classkit/logs/classkit.err.log
stdout_logfile=/home/master_xxx/applications/classkit/logs/classkit.out.log
EOF

# Supervisor 재시작
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl restart classkit 2>/dev/null || sudo supervisorctl start classkit

# 상태 확인
echo ""
echo "=========================================="
echo "✅ 배포 완료!"
echo "=========================================="
sudo supervisorctl status classkit
echo ""
curl -s http://localhost:8000/health || echo "⚠️ Health check 대기 중..."
echo ""
echo "🔗 접속: http://167.172.70.163:8000"
