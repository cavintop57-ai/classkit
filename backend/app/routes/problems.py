from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, Field
from datetime import datetime
import random
from ..database import get_db
from ..models import Problem as ProblemModel, Session as SessionModel
from ..utils.token import create_answer_token

router = APIRouter(prefix="/problems", tags=["problems"])

class ProblemCheck(BaseModel):
    problem_id: str
    answer: str
    session_code: str = Field(..., min_length=6, max_length=6)

@router.get("/next")
async def get_next_problem(
    code: str = None,  # 세션 코드 (6자리)
    grade: str = None,
    difficulty: int = 3,
    type: str = None,
    db: AsyncSession = Depends(get_db)
):
    """다음 문제 조회 (세션의 문제 중 랜덤 또는 DB에서 랜덤)"""
    
    # 세션 코드가 있으면 세션의 문제 중 랜덤으로 반환
    if code:
        result = await db.execute(
            select(SessionModel).where(
                SessionModel.code == code,
                SessionModel.ended_at.is_(None),
                SessionModel.expires_at > datetime.now()
            )
        )
        session = result.scalar_one_or_none()
        
        if session and session.problems:
            # 세션에 저장된 문제 중 랜덤으로 선택
            problem = random.choice(session.problems)
            print(f"📚 세션 문제 반환: {problem.get('id', 'sample')}")
            return problem
    
    # 세션 문제가 없으면 DB에서 랜덤으로 조회 (기존 로직)
    query = select(ProblemModel)
    
    # 필터링
    if grade:
        query = query.where(ProblemModel.grade == grade)
    if type:
        query = query.where(ProblemModel.type == type)
    if difficulty:
        query = query.where(ProblemModel.difficulty == difficulty)
    
    # 랜덤 정렬
    query = query.order_by(func.random()).limit(1)
    
    result = await db.execute(query)
    problem = result.scalar_one_or_none()
    
    if not problem:
        raise HTTPException(
            status_code=404, 
            detail="조건에 맞는 문제가 없습니다"
        )
    
    return {
        "id": str(problem.id),
        "type": problem.type,
        "question": problem.question,
        "difficulty": problem.difficulty,
        "grade": problem.grade
    }

@router.post("/check")
async def check_answer(
    data: ProblemCheck,
    db: AsyncSession = Depends(get_db)
):
    """정답 확인 및 토큰 발급"""
    
    correct_answer = None
    
    # 1. 세션의 문제인지 확인
    session_result = await db.execute(
        select(SessionModel).where(
            SessionModel.code == data.session_code,
            SessionModel.ended_at.is_(None),
            SessionModel.expires_at > datetime.now()
        )
    )
    session = session_result.scalar_one_or_none()
    
    if session and session.problems:
        # 세션 문제에서 찾기
        for problem in session.problems:
            if problem.get('id') == data.problem_id:
                correct_answer = problem.get('answer')
                print(f"✅ 세션 문제 정답 체크: {data.problem_id}")
                break
    
    # 2. 세션 문제가 아니면 DB에서 조회
    if correct_answer is None:
        result = await db.execute(
            select(ProblemModel).where(ProblemModel.id == data.problem_id)
        )
        problem = result.scalar_one_or_none()
        
        if not problem:
            raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다")
        
        correct_answer = problem.answer
    
    # 정답 비교 (대소문자 무시, 공백 제거)
    user_answer = data.answer.strip().lower()
    correct_answer_clean = correct_answer.strip().lower()
    
    is_correct = user_answer == correct_answer_clean
    
    # 정답일 경우 토큰 발급
    answer_token = None
    if is_correct:
        answer_token = create_answer_token(data.problem_id, data.session_code)
    
    return {
        "correct": is_correct,
        "message": "정답입니다! 이제 메시지를 보낼 수 있어요." if is_correct else "오답입니다. 다시 시도해보세요.",
        "answer_token": answer_token
    }

