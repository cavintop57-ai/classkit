from sqlalchemy import Column, String, Integer, Boolean, Text, ForeignKey, TIMESTAMP, CHAR, JSON
from sqlalchemy.sql import func
import uuid
from .database import Base

class School(Base):
    __tablename__ = "schools"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

class Class(Base):
    __tablename__ = "classes"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    school_id = Column(String(36), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    grade = Column(String(10), nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    class_id = Column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    code = Column(CHAR(6), nullable=False, unique=True)  # 알파벳1 + 숫자5
    problems = Column(JSON, nullable=True)  # 세션에 사용할 문제 3개
    student_names = Column(JSON, nullable=True)  # 학생 명단 (검증용)
    started_at = Column(TIMESTAMP, server_default=func.now())
    ended_at = Column(TIMESTAMP, nullable=True)
    expires_at = Column(TIMESTAMP, nullable=False)

class Problem(Base):
    __tablename__ = "problems"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    class_id = Column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    type = Column(String(20), nullable=False)  # vocabulary, proverb, math
    difficulty = Column(Integer, nullable=False)  # 1-5
    grade = Column(String(10), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    nickname = Column(String(20), nullable=False)
    avatar_id = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    moderated = Column(Boolean, default=False)

class Log(Base):
    __tablename__ = "logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=True)
    event_type = Column(String(50), nullable=False)
    payload = Column(JSON, nullable=False, default={})
    timestamp = Column(TIMESTAMP, server_default=func.now())

