from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, Field
from ..database import get_db
from ..models import Problem as ProblemModel
from ..utils.token import create_answer_token

router = APIRouter(prefix="/problems", tags=["problems"])

class ProblemCheck(BaseModel):
    problem_id: str
    answer: str
    session_code: str = Field(..., min_length=8, max_length=8)

@router.get("/next")
async def get_next_problem(
    grade: str = None,
    difficulty: int = 3,
    type: str = None,
    db: AsyncSession = Depends(get_db)
):
    """다음 문제 조회 (랜덤)"""
    
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
    
    # 문제 조회
    result = await db.execute(
        select(ProblemModel).where(ProblemModel.id == data.problem_id)
    )
    problem = result.scalar_one_or_none()
    
    if not problem:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다")
    
    # 정답 비교 (대소문자 무시, 공백 제거)
    user_answer = data.answer.strip().lower()
    correct_answer = problem.answer.strip().lower()
    
    is_correct = user_answer == correct_answer
    
    # 정답일 경우 토큰 발급
    answer_token = None
    if is_correct:
        answer_token = create_answer_token(data.problem_id, data.session_code)
    
    return {
        "correct": is_correct,
        "message": "정답입니다! 이제 메시지를 보낼 수 있어요." if is_correct else "오답입니다. 다시 시도해보세요.",
        "answer_token": answer_token
    }

