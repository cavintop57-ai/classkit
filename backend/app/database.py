from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# DB 파일 경로를 data 폴더로 설정
BASE_DIR = Path(__file__).parent.parent  # backend/
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)  # data 폴더 자동 생성
DB_PATH = DATA_DIR / "classkit.db"

# 기본값: SQLite (PostgreSQL 설치 불필요)
# 환경변수로 강제 설정 가능: DATABASE_URL=postgresql+asyncpg://...
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DB_PATH}")

# SQL 로그 출력 제어
SQL_ECHO = os.getenv("SQL_ECHO", "false").lower() == "true"

# SQLite 모듈 누락 시 PostgreSQL으로 자동 전환
try:
    import sqlite3
    SQLITE_AVAILABLE = True
except ImportError:
    SQLITE_AVAILABLE = False
    print("⚠️ SQLite3 모듈이 없습니다. PostgreSQL로 전환합니다.")
    # Cloudways 서버의 PostgreSQL 연결 정보 (환경변수 설정 필요)
    DEFAULT_PG_URL = "postgresql+asyncpg://root:password@localhost:5432/classkit"
    if "postgresql" not in DATABASE_URL:
        DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_PG_URL)
        print(f"📝 PostgreSQL URL 사용: {DATABASE_URL.split('@')[0]}@***")

# Async engine (SQLite는 pool 옵션 불필요)
if "sqlite" in DATABASE_URL and SQLITE_AVAILABLE:
    engine = create_async_engine(
        DATABASE_URL,
        echo=SQL_ECHO  # .env로 제어 (기본: False)
    )
else:
    engine = create_async_engine(
        DATABASE_URL,
        echo=SQL_ECHO,
        pool_size=20,
        max_overflow=10,
        pool_pre_ping=True
    )

# Async session
async_session = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

Base = declarative_base()

# Dependency
async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

