"""JWT 토큰 생성 및 검증"""
import jwt
from datetime import datetime, timedelta
from typing import Optional

# 실제 배포 시에는 환경 변수로 관리해야 함
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"

def create_answer_token(problem_id: str, session_code: str) -> str:
    """
    정답 검증 후 발급하는 토큰
    
    Args:
        problem_id: 문제 ID
        session_code: 세션 코드
        
    Returns:
        JWT 토큰 문자열
    """
    payload = {
        "problem_id": problem_id,
        "session_code": session_code,
        "exp": datetime.utcnow() + timedelta(minutes=10),  # 10분 유효
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_answer_token(token: str, session_code: str) -> Optional[dict]:
    """
    정답 토큰 검증
    
    Args:
        token: JWT 토큰
        session_code: 현재 세션 코드
        
    Returns:
        검증 성공 시 payload, 실패 시 None
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # 세션 코드 일치 확인
        if payload.get("session_code") != session_code:
            return None
            
        return payload
    except jwt.ExpiredSignatureError:
        # 토큰 만료
        return None
    except jwt.InvalidTokenError:
        # 잘못된 토큰
        return None

