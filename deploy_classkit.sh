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

# 2. 가상환경 준비 및 패키지 설치
echo "[2/5] Python 패키지 설치 (venv)..."
cd "$APP_DIR/backend"
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
source venv/bin/activate
python -m pip install -q --upgrade pip
python -m pip install -q -r requirements.txt
echo "✅ 패키지 설치 완료 (venv)"
echo ""

# 3. DB 초기화 (이미 있으면 건너뛰기)
echo "[3/5] 데이터베이스 확인..."
if [ ! -f "data/classkit.db" ]; then
  echo "   DB 파일이 없음, 초기화 시도..."
  python -m app.init_db 2>/dev/null || echo "   ⚠️ DB 초기화 실패 (건너뜀)"
else
  echo "   ✅ 기존 DB 파일 사용"
fi
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

# 환경변수 설정
export DOMAIN_URL=https://phpstack-1293143-5917982.cloudwaysapps.com

# MySQL 환경변수 (Cloudways에서 제공)
# ~/.my.cnf 에서 자동으로 읽거나 직접 설정
if [ -f ~/.my.cnf ]; then
  echo "✅ MySQL 설정 파일 발견: ~/.my.cnf"
  export DB_HOST=$(grep -oP '(?<=host=).+' ~/.my.cnf | head -1)
  export DB_USER=$(grep -oP '(?<=user=).+' ~/.my.cnf | head -1)
  export DB_PASSWORD=$(grep -oP '(?<=password=).+' ~/.my.cnf | head -1)
  export DB_NAME=${DB_NAME:-classkit}
  echo "✅ MySQL 연결 정보 로드 완료"
else
  echo "⚠️ ~/.my.cnf 없음. 환경변수를 직접 설정하세요."
  echo "  export DB_HOST=localhost"
  echo "  export DB_USER=root"
  echo "  export DB_PASSWORD=your_password"
  echo "  export DB_NAME=classkit"
fi

nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > ~/classkit.log 2>&1 &
disown
echo "✅ 서버 시작됨 (PID: $!)"
echo "✅ 환경변수: DOMAIN_URL=$DOMAIN_URL"
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

