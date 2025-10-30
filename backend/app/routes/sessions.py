from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import random
import string
import os
from ..database import get_db
from ..models import Session as SessionModel, Class as ClassModel, School as SchoolModel

router = APIRouter(prefix="/sessions", tags=["sessions"])

class SessionCreate(BaseModel):
    class_id: Optional[str] = None  # 없으면 자동 생성
    code: Optional[str] = None  # 커스텀 세션 코드 (교사 로그인용)
    problems: Optional[List[Dict[str, Any]]] = None  # 세션에 사용할 문제 3개
    student_names: Optional[List[str]] = None  # 학생 명단 (검증용)

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
    
    # 2️⃣ 세션 코드 생성 또는 사용
    if data.code:
        # 커스텀 세션 코드 사용 (교사 로그인)
        code = data.code
        print(f"📌 커스텀 세션 코드 사용: {code}")
        
        # 중복 체크 (활성 세션만)
        result = await db.execute(
            select(SessionModel).where(
                SessionModel.code == code,
                SessionModel.ended_at.is_(None)
            )
        )
        existing_session = result.scalar_one_or_none()
        
        if existing_session:
            # 기존 세션이 있으면 만료 시간 연장 및 문제 업데이트
            existing_session.expires_at = datetime.now() + timedelta(hours=4)
            if data.problems:
                existing_session.problems = data.problems
                print(f"📚 세션 문제 업데이트: {len(data.problems)}개")
            if data.student_names:
                existing_session.student_names = data.student_names
                print(f"👥 세션 학생명단 업데이트: {len(data.student_names)}명")
            await db.commit()
            await db.refresh(existing_session)
            print(f"♻️ 기존 세션 재사용 (만료 시간 연장): {code}")
            
            # 환경변수에서 도메인 가져오기 (로컬 개발 환경 자동 감지)
            domain = os.getenv('DOMAIN_URL')
            if not domain:
                # 로컬 개발 환경: localhost 사용
                domain = 'http://localhost:5173'
                print(f"🏠 로컬 개발 모드: {domain}")
            
            # QR URL: 모바일 페이지 경로 (학생용)
            mobile_url = f"{domain}/mobile/?code={existing_session.code}"
            
            return SessionResponse(
                id=str(existing_session.id),
                code=existing_session.code,
                class_id=str(existing_session.class_id),
                started_at=existing_session.started_at,
                expires_at=existing_session.expires_at,
                qr_url=mobile_url
            )
    else:
        # 랜덤 세션 코드 생성
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
        problems=data.problems if data.problems else None,
        student_names=data.student_names if data.student_names else None,
        expires_at=expires_at
    )
    
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    if data.problems:
        print(f"✅ 세션 생성 완료 (문제 {len(data.problems)}개 포함): {session.code}")
    else:
        print(f"✅ 세션 생성 완료: {session.code}")
    
    # 환경변수에서 도메인 가져오기 (로컬 개발 환경 자동 감지)
    domain = os.getenv('DOMAIN_URL')
    if not domain:
        # 로컬 개발 환경: localhost 사용
        domain = 'http://localhost:5173'
        print(f"🏠 로컬 개발 모드: {domain}")
    
    # QR URL: 모바일 페이지 경로 (학생용)
    mobile_url = f"{domain}/mobile/?code={session.code}"
    
    return SessionResponse(
        id=str(session.id),
        code=session.code,
        class_id=str(session.class_id),
        started_at=session.started_at,
        expires_at=session.expires_at,
        qr_url=mobile_url
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

