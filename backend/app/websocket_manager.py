from typing import Dict, Set
from fastapi import WebSocket
import json
import asyncio

class ConnectionManager:
    """WebSocket 연결 관리"""
    
    def __init__(self):
        # session_code -> Set[WebSocket]
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.max_connections_per_session = 50
    
    async def connect(self, websocket: WebSocket, session_code: str) -> bool:
        """WebSocket 연결"""
        await websocket.accept()
        
        # 세션이 없으면 생성
        if session_code not in self.active_connections:
            self.active_connections[session_code] = set()
        
        # 연결 수 제한 체크
        if len(self.active_connections[session_code]) >= self.max_connections_per_session:
            await websocket.send_json({
                "error": "SESSION_FULL",
                "message": "세션이 가득 찼습니다 (최대 50명)"
            })
            await websocket.close()
            return False
        
        # 연결 추가
        self.active_connections[session_code].add(websocket)
        
        # 연결 성공 메시지
        await websocket.send_json({
            "event": "connected",
            "payload": {
                "session_code": session_code,
                "user_count": len(self.active_connections[session_code])
            }
        })
        
        return True
    
    def disconnect(self, websocket: WebSocket, session_code: str):
        """WebSocket 연결 해제"""
        if session_code in self.active_connections:
            self.active_connections[session_code].discard(websocket)
            
            # 세션에 아무도 없으면 삭제
            if not self.active_connections[session_code]:
                del self.active_connections[session_code]
    
    async def broadcast(self, session_code: str, message: dict):
        """특정 세션의 모든 클라이언트에게 메시지 전송"""
        if session_code not in self.active_connections:
            return
        
        # 비동기 병렬 전송
        tasks = []
        for websocket in self.active_connections[session_code].copy():
            try:
                tasks.append(websocket.send_json(message))
            except Exception:
                # 연결이 끊어진 소켓은 제거
                self.active_connections[session_code].discard(websocket)
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    def get_session_user_count(self, session_code: str) -> int:
        """세션의 연결된 사용자 수"""
        if session_code in self.active_connections:
            return len(self.active_connections[session_code])
        return 0

# 전역 인스턴스
manager = ConnectionManager()

