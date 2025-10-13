"""샘플 데이터 삽입 (CSV 파일 기반)"""
import asyncio
import csv
import os
from pathlib import Path
from sqlalchemy import select
from .database import async_session
from .models import School, Class, Problem

async def seed_data():
    async with async_session() as db:
        # 학교 생성
        school = School(name="테스트 초등학교")
        db.add(school)
        await db.flush()
        
        # 반 생성
        class_5_1 = Class(
            school_id=school.id,
            grade="5-1",
            name="5학년 1반"
        )
        db.add(class_5_1)
        await db.flush()
        
        # CSV 파일에서 문제 읽기
        csv_path = Path(__file__).parent.parent / "data" / "problems.csv"
        
        if not csv_path.exists():
            print(f"[경고] CSV 파일을 찾을 수 없습니다: {csv_path}")
            print("  기본 샘플 문제를 사용합니다.")
            # 기본 샘플 문제
            problems = [
                Problem(
                    class_id=None,
                    question="영어 단어: 사과",
                    answer="apple",
                    type="vocabulary",
                    difficulty=1,
                    grade="3",
                    hint="과일입니다"
                ),
                Problem(
                    class_id=None,
                    question="속담: 티끌 모아 ______",
                    answer="태산",
                    type="proverb",
                    difficulty=1,
                    grade="3",
                    hint="작은 것도 모으면"
                ),
            ]
        else:
            print(f"[INFO] CSV 파일에서 문제 로드 중: {csv_path}")
            problems = []
            
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # CSV의 각 행을 Problem 객체로 변환
                    problem = Problem(
                        class_id=None,  # 공용
                        type=row['type'],
                        grade=row['grade'],
                        difficulty=int(row['difficulty']),
                        question=row['question'],
                        answer=row['answer'],
                        hint=row['hint'] if row['hint'] else None
                    )
                    problems.append(problem)
        
        # 문제 삽입
        for problem in problems:
            db.add(problem)
        
        await db.commit()
        
        print("[OK] 샘플 데이터 삽입 완료")
        print(f"  - 학교: {school.name}")
        print(f"  - 반: {class_5_1.name}")
        print(f"  - 문제: {len(problems)}개")
        print(f"\n[팁] 문제를 추가/수정하려면 'backend/data/problems.csv' 파일을 편집하세요!")

if __name__ == "__main__":
    print("샘플 데이터 삽입 중...")
    asyncio.run(seed_data())

