from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# DB 파일 경로를 data 폴더로 설정
BASE_DIR = Path(__file__).parent.parent  # backend/
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)  # data 폴더 자동 생성
DB_PATH = DATA_DIR / "classkit.db"

# 기본값: SQLite (PostgreSQL 설치 불필요)
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DB_PATH}")

# SQL 로그 출력 제어
SQL_ECHO = os.getenv("SQL_ECHO", "false").lower() == "true"

# Async engine (SQLite는 pool 옵션 불필요)
if "sqlite" in DATABASE_URL:
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

