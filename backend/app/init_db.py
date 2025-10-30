import asyncio
from sqlalchemy import text

# 절대 import로 변경 (python app/init_db.py 직접 실행 가능)
try:
    from .database import engine, Base
    from . import models
except ImportError:
    from app.database import engine, Base
    from app import models

async def create_tables():
    """데이터베이스 테이블 생성"""
    async with engine.begin() as conn:
        # 모든 테이블 생성
        await conn.run_sync(Base.metadata.create_all)
        
        # 마이그레이션: sessions 테이블에 problems 컬럼 추가 (없으면)
        try:
            # SQLite에서 컬럼 존재 확인
            result = await conn.execute(text("PRAGMA table_info(sessions)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'problems' not in columns:
                await conn.execute(text("ALTER TABLE sessions ADD COLUMN problems JSON"))
                print("[MIGRATION] sessions 테이블에 'problems' 컬럼 추가됨")
            
            # student_names 컬럼 마이그레이션
            if 'student_names' not in columns:
                await conn.execute(text("ALTER TABLE sessions ADD COLUMN student_names JSON"))
                print("[MIGRATION] sessions 테이블에 'student_names' 컬럼 추가됨")
        except Exception as e:
            print(f"[WARNING] 마이그레이션 오류 (무시 가능): {e}")
        
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

