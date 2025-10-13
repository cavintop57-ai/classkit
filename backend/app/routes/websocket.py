from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..websocket_manager import manager

router = APIRouter()

@router.websocket("/ws/{session_code}")
async def websocket_endpoint(websocket: WebSocket, session_code: str):
    """WebSocket 연결 엔드포인트"""
    
    # 연결
    connected = await manager.connect(websocket, session_code)
    
    if not connected:
        return
    
    try:
        # 메시지 수신 루프
        while True:
            data = await websocket.receive_text()
            
            # 클라이언트로부터 받은 메시지를 같은 세션의 모든 클라이언트에게 브로드캐스트
            # (실제로는 여기서 데이터베이스에 저장하고 검증해야 함)
            await manager.broadcast(session_code, {
                "event": "echo",
                "payload": {"message": data}
            })
            
    except WebSocketDisconnect:
        # 연결 해제
        manager.disconnect(websocket, session_code)
        
        # 남은 사용자들에게 알림
        await manager.broadcast(session_code, {
            "event": "statsUpdate",
            "payload": {
                "user_count": manager.get_session_user_count(session_code)
            }
        })
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, session_code)

