from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# 기본값: SQLite (PostgreSQL 설치 불필요)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./classkit.db")

# Async engine (SQLite는 pool 옵션 불필요)
if "sqlite" in DATABASE_URL:
    engine = create_async_engine(
        DATABASE_URL,
        echo=True  # 개발 중 SQL 로그 출력
    )
else:
    engine = create_async_engine(
        DATABASE_URL,
        echo=True,
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

