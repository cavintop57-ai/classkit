from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# SQL 로그 출력 제어
SQL_ECHO = os.getenv("SQL_ECHO", "false").lower() == "true"

# 데이터베이스 URL 설정
# 우선순위: 환경변수 > Cloudways MySQL > SQLite (로컬 개발용)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Cloudways MySQL 자동 감지
    mysql_host = os.getenv("DB_HOST", "localhost")
    mysql_user = os.getenv("DB_USER", "root")
    mysql_password = os.getenv("DB_PASSWORD", "")
    mysql_database = os.getenv("DB_NAME", "classkit")
    
    # MySQL 연결 시도 (Cloudways 기본)
    if mysql_password:
        DATABASE_URL = f"mysql+aiomysql://{mysql_user}:{mysql_password}@{mysql_host}/{mysql_database}"
        print(f"✅ MySQL 사용: {mysql_user}@{mysql_host}/{mysql_database}")
    else:
        # 로컬 개발 환경: SQLite 폴백
        BASE_DIR = Path(__file__).parent.parent
        DATA_DIR = BASE_DIR / "data"
        DATA_DIR.mkdir(exist_ok=True)
        DB_PATH = DATA_DIR / "classkit.db"
        DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"
        print(f"⚠️ 로컬 개발 모드: SQLite 사용 ({DB_PATH})")

# Async engine 생성
if "sqlite" in DATABASE_URL:
    # SQLite (로컬 개발)
    engine = create_async_engine(
        DATABASE_URL,
        echo=SQL_ECHO
    )
else:
    # MySQL/PostgreSQL (프로덕션)
    engine = create_async_engine(
        DATABASE_URL,
        echo=SQL_ECHO,
        pool_size=20,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=3600
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

