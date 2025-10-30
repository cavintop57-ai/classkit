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
    code: str = Field(..., min_length=6, max_length=6)  # 6자리 세션 코드 (예: A12345)
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
    
    # 정답 토큰 검증 (샘플 토큰은 허용)
    if not data.answer_token.startswith('sample-token-'):
        token_payload = verify_answer_token(data.answer_token, data.code)
        if not token_payload:
            raise HTTPException(
                status_code=403,
                detail="정답을 먼저 맞혀야 메시지를 보낼 수 있습니다"
            )
    else:
        print(f"🎮 샘플 토큰 허용: {data.answer_token}")
    
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
    
    # 학생명단 검증 (명단이 있을 경우만)
    if session.student_names and len(session.student_names) > 0:
        if data.nickname not in session.student_names:
            print(f"⚠️ 등록되지 않은 학생명: {data.nickname} (명단: {session.student_names})")
            raise HTTPException(
                status_code=403,
                detail=f"학생명단에 등록되지 않은 이름입니다. 등록된 학생명: {', '.join(session.student_names[:5])}{'...' if len(session.student_names) > 5 else ''}"
            )
        print(f"✅ 학생명 검증 통과: {data.nickname}")
    
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
    broadcast_message = {
        "event": "newMessage",
        "payload": {
            "nickname": message.nickname,
            "avatar_id": message.avatar_id,
            "content": message.content,
            "timestamp": message.created_at.isoformat()
        }
    }
    print(f"📤 WebSocket 브로드캐스트: {data.code} → {message.nickname}: {message.content}")
    await manager.broadcast(data.code, broadcast_message)
    
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

