from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime, timedelta
import random
import string
from ..database import get_db
from ..models import Session as SessionModel, Class as ClassModel, School as SchoolModel

router = APIRouter(prefix="/sessions", tags=["sessions"])

class SessionCreate(BaseModel):
    class_id: str | None = None  # 없으면 자동 생성

class SessionResponse(BaseModel):
    id: str
    code: str
    class_id: str
    started_at: datetime
    expires_at: datetime
    qr_url: str

def generate_session_code() -> str:
    """6자리 세션 코드 생성 (알파벳 1자리 + 숫자 5자리)"""
    # 알파벳 1자리 (영대문자, 혼동 방지를 위해 0, O, I, 1 제외)
    letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    letter = random.choice(letters)
    
    # 숫자 5자리 (0, 1 제외하여 혼동 방지)
    digits = '23456789'
    numbers = ''.join(random.choices(digits, k=5))
    
    return letter + numbers

@router.post("", response_model=SessionResponse)
async def create_session(
    data: SessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """새 세션 생성"""
    
    # 1️⃣ 학급 행 확보 (없으면 자동 생성)
    class_row = None
    
    if data.class_id:
        # class_id가 제공되었으면 해당 클래스 조회
        result = await db.execute(
            select(ClassModel).where(ClassModel.id == data.class_id)
        )
        class_row = result.scalar_one_or_none()
    
    if not class_row:
        # 클래스가 없으면 기본 학교 & 클래스 자동 생성
        
        # 기본 학교 확인/생성
        result = await db.execute(
            select(SchoolModel).where(SchoolModel.name == "Default School")
        )
        default_school = result.scalar_one_or_none()
        
        if not default_school:
            default_school = SchoolModel(name="Default School")
            db.add(default_school)
            await db.commit()
            await db.refresh(default_school)
            print("✅ Default School 자동 생성")
        
        # 기본 클래스 생성
        class_row = ClassModel(
            school_id=default_school.id,
            grade="3",
            name="Default Class"
        )
        db.add(class_row)
        await db.commit()
        await db.refresh(class_row)
        print("✅ Default Class 자동 생성")
    
    # 2️⃣ 세션 코드 중복 피하기
    max_attempts = 10
    for _ in range(max_attempts):
        code = generate_session_code()
        
        # 중복 체크
        result = await db.execute(
            select(SessionModel).where(
                SessionModel.code == code,
                SessionModel.ended_at.is_(None)
            )
        )
        if not result.scalar_one_or_none():
            break
    else:
        raise HTTPException(status_code=500, detail="세션 코드 생성 실패")
    
    # 3️⃣ 세션 생성
    expires_at = datetime.now() + timedelta(hours=4)  # 4시간 유효
    session = SessionModel(
        class_id=class_row.id,
        code=code,
        expires_at=expires_at
    )
    
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    print(f"✅ 세션 생성 완료: {session.code}")
    
    return SessionResponse(
        id=str(session.id),
        code=session.code,
        class_id=str(session.class_id),
        started_at=session.started_at,
        expires_at=session.expires_at,
        qr_url=f"http://localhost:8000/{session.code}"  # 로컬 테스트용
    )

@router.get("/{code}")
async def get_session(code: str, db: AsyncSession = Depends(get_db)):
    """세션 코드 검증"""
    
    result = await db.execute(
        select(SessionModel).where(
            SessionModel.code == code,
            SessionModel.ended_at.is_(None),
            SessionModel.expires_at > datetime.now()
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다")
    
    return {
        "id": str(session.id),
        "code": session.code,
        "valid": True,
        "expires_at": session.expires_at
    }

