#!/bin/bash

# Render.com 시작 스크립트

echo "🚀 ClassKit Backend 시작..."

# 데이터베이스 초기화
python -c "from app.database import init_db; init_db()"

# Uvicorn 서버 시작
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

