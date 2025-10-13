@echo off
chcp 65001 >nul
cd backend
echo 🚀 백엔드 서버 시작 중...
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

