@echo off
chcp 65001 >nul
cd backend
echo 🚀 백엔드 서버 시작 중...

REM OpenAI API 키는 환경변수로 설정하세요:
REM set OPENAI_API_KEY=your-api-key-here

python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

