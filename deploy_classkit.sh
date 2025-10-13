#!/usr/bin/env bash
set -e

echo "========================================"
echo "🚀 ClassKit 자동 배포"
echo "========================================"
echo ""

APP_DIR="$HOME/classkit"
REPO="https://github.com/cavintop57-ai/classkit.git"

# 1. 소스 업데이트
echo "[1/5] 소스 코드 업데이트..."
cd "$APP_DIR"
git pull origin main
echo "✅ Git pull 완료"
echo ""

# 2. 패키지 설치
echo "[2/5] Python 패키지 설치..."
python3 -m pip install --user -q -r backend/requirements.txt
echo "✅ 패키지 설치 완료"
echo ""

# 3. DB 초기화
echo "[3/5] 데이터베이스 초기화..."
cd "$APP_DIR/backend"
python3 -m app.init_db
echo "✅ DB 초기화 완료"
echo ""

# 4. 기존 프로세스 종료
echo "[4/5] 기존 서버 종료..."
pkill -f "uvicorn app.main:app" || true
sleep 1
echo "✅ 기존 프로세스 종료"
echo ""

# 5. 서버 재시작
echo "[5/5] 서버 재시작..."
cd "$APP_DIR/backend"
nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > ~/classkit.log 2>&1 &
disown
echo "✅ 서버 시작됨 (PID: $!)"
echo ""

# 확인
echo "========================================"
echo "⏳ 서버 기동 대기 중..."
echo "========================================"
sleep 3

echo ""
echo "🔍 Health Check..."
curl -s http://localhost:8000/health
echo ""
echo ""

echo "========================================"
echo "✅ 배포 완료!"
echo "========================================"
echo ""
echo "🌐 URL: http://167.172.70.163:8000"
echo "📊 로그: tail -f ~/classkit.log"
echo "📋 상태: ps aux | grep uvicorn"
echo ""

