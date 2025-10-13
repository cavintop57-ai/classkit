import asyncio
from sqlalchemy import text
from .database import engine, Base
from . import models  # models를 import해야 Base.metadata에 테이블 정보가 등록됨

async def create_tables():
    """데이터베이스 테이블 생성"""
    async with engine.begin() as conn:
        # 모든 테이블 생성
        await conn.run_sync(Base.metadata.create_all)
        
        # 인덱스 생성 (ERD.md 참조)
        await conn.execute(text("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_session_code_active 
            ON sessions(code) WHERE ended_at IS NULL
        """))
        
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_messages_session_time 
            ON messages(session_id, created_at DESC)
        """))
        
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_problems_grade_difficulty 
            ON problems(grade, difficulty, type)
        """))
        
        print("[OK] 테이블 및 인덱스 생성 완료")
        print("[INFO] 학교/반은 세션 생성 시 자동으로 생성됩니다")

async def drop_tables():
    """모든 테이블 삭제 (개발용)"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        print("[OK] 테이블 삭제 완료")

if __name__ == "__main__":
    print("데이터베이스 초기화 중...")
    asyncio.run(create_tables())

