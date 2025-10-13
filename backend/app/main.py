from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import text
from .database import engine
from .routes import websocket, sessions, messages, problems
from .init_db import create_tables
from pathlib import Path

app = FastAPI(title="Class Widget API")

# CORS 설정 (위젯에서 API 호출 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 중에는 모든 origin 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 시작 시 DB 초기화
@app.on_event("startup")
async def startup_event():
    print("🚀 서버 시작 중...")
    try:
        await create_tables()
        print("✅ 데이터베이스 초기화 완료")
    except Exception as e:
        print(f"⚠️ 데이터베이스 초기화 경고: {e}")

# 라우터 등록
app.include_router(websocket.router)
app.include_router(sessions.router, prefix="/api")
app.include_router(messages.router, prefix="/api")
app.include_router(problems.router, prefix="/api")

# Health check 엔드포인트 (최우선)
@app.get("/health")
async def health_check():
    try:
        # DB 연결 확인
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {
            "status": "healthy", 
            "version": "0.4.0",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "version": "0.4.0",
            "database": "disconnected",
            "error": str(e)
        }

# 위젯(교사용) 정적 파일 서빙
widget_path = Path(__file__).parent.parent.parent / "widget"
if widget_path.exists():
    # /widget 경로에도 마운트 (하위 호환성)
    app.mount("/widget", StaticFiles(directory=str(widget_path), html=True), name="widget_legacy")

# 모바일 PWA 정적 파일 서빙 (학생용)
mobile_path = Path(__file__).parent.parent.parent / "mobile"
if mobile_path.exists():
    # 모바일 앱 정적 파일 마운트
    app.mount("/mobile", StaticFiles(directory=str(mobile_path), html=True), name="mobile")
    
    @app.get("/{session_code}")
    async def serve_mobile(session_code: str):
        """세션 코드로 모바일 페이지 접속"""
        if len(session_code) == 6 and session_code[0].isalpha() and session_code[1:].isdigit():
            return FileResponse(mobile_path / "index.html", media_type="text/html")
        # API 경로가 아니면 404
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")

# 루트 경로를 위젯(교사용)으로 마운트 - 반드시 마지막에!
if widget_path.exists():
    app.mount("/", StaticFiles(directory=str(widget_path), html=True), name="widget")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

