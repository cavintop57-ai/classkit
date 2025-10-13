from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from datetime import datetime
from ..database import get_db
from ..models import Message as MessageModel, Session as SessionModel
from ..websocket_manager import manager
from ..utils.token import verify_answer_token

router = APIRouter(prefix="/messages", tags=["messages"])

class MessageCreate(BaseModel):
    code: str = Field(..., min_length=8, max_length=8)  # 8자리 영숫자
    nickname: str = Field(..., min_length=1, max_length=20)
    avatar_id: int = Field(..., ge=1, le=64)
    content: str = Field(..., min_length=1, max_length=200)
    answer_token: str = Field(..., description="정답 검증 후 발급받은 토큰")

class MessageResponse(BaseModel):
    id: str
    nickname: str
    avatar_id: int
    content: str
    created_at: datetime

@router.post("", response_model=MessageResponse, status_code=201)
async def create_message(
    data: MessageCreate,
    db: AsyncSession = Depends(get_db)
):
    """학생 메시지 생성 (정답 검증 필수)"""
    
    # 정답 토큰 검증
    token_payload = verify_answer_token(data.answer_token, data.code)
    if not token_payload:
        raise HTTPException(
            status_code=403,
            detail="정답을 먼저 맞혀야 메시지를 보낼 수 있습니다"
        )
    
    # 세션 검증
    result = await db.execute(
        select(SessionModel).where(
            SessionModel.code == data.code,
            SessionModel.ended_at.is_(None),
            SessionModel.expires_at > datetime.now()
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다")
    
    # 메시지 생성
    message = MessageModel(
        session_id=session.id,
        nickname=data.nickname,
        avatar_id=data.avatar_id,
        content=data.content
    )
    
    db.add(message)
    await db.commit()
    await db.refresh(message)
    
    # WebSocket으로 브로드캐스트
    await manager.broadcast(data.code, {
        "event": "newMessage",
        "payload": {
            "nickname": message.nickname,
            "avatar_id": message.avatar_id,
            "content": message.content,
            "timestamp": message.created_at.isoformat()
        }
    })
    
    return MessageResponse(
        id=str(message.id),
        nickname=message.nickname,
        avatar_id=message.avatar_id,
        content=message.content,
        created_at=message.created_at
    )

@router.get("")
async def get_messages(
    session_code: str,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """세션의 최근 메시지 조회"""
    
    # 세션 찾기
    result = await db.execute(
        select(SessionModel).where(SessionModel.code == session_code)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다")
    
    # 메시지 조회 (최근순)
    result = await db.execute(
        select(MessageModel)
        .where(MessageModel.session_id == session.id)
        .order_by(MessageModel.created_at.desc())
        .limit(limit)
    )
    messages = result.scalars().all()
    
    return {
        "messages": [
            {
                "id": str(m.id),
                "nickname": m.nickname,
                "avatar_id": m.avatar_id,
                "content": m.content,
                "created_at": m.created_at
            }
            for m in messages
        ],
        "count": len(messages)
    }

