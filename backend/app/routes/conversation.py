"""
자연스러운 발화 생성 라우트
GPT API를 사용하여 유머, 속담, 격려말 등을 생성합니다.
"""

from fastapi import APIRouter, HTTPException
import openai
import os
from typing import Optional

router = APIRouter()

# OpenAI API 키 설정
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("⚠️ OPENAI_API_KEY가 설정되지 않았습니다. GPT 기능이 비활성화됩니다.")

@router.get("/generate-speech")
async def generate_speech(
    context: str = "classroom",
    category: str = "humor"
):
    """
    자연스러운 발화 생성
    
    Args:
        context: 발화 맥락 (classroom: 교실, break: 쉬는시간, etc.)
        category: 카테고리 (humor: 유머, proverb: 속담, encouragement: 격려)
    
    Returns:
        생성된 발화 텍스트
    """
    
    # OpenAI API 키가 없으면 샘플 발화 반환
    if not OPENAI_API_KEY:
        return generate_sample_speech(category)
    
    try:
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        
        # 카테고리별 프롬프트 설정
        prompts = {
            "humor": "초등학생들에게 친근하고 재미있는 한 문장 유머나 농담을 생성해주세요. 20자 이내로 짧게 작성해주세요.",
            "proverb": "초등학생들에게 도움이 되는 속담이나 격려의 말을 한 문장으로 생성해주세요. 30자 이내로 작성해주세요.",
            "encouragement": "수업 중인 초등학생들을 응원하는 친근한 한 문장을 생성해주세요. 25자 이내로 작성해주세요.",
            "weather": "초등학생들에게 오늘 날씨에 대해 친근하게 알려주는 한 문장을 생성해주세요. 25자 이내로 작성해주세요.",
            "quote": "초등학생들에게 동기부여가 되는 명언이나 격려의 말을 한 문장으로 생성해주세요. 30자 이내로 작성해주세요.",
            "math": "초등학생들이 흥미를 느낄 수 있는 간단한 수학 문제나 수학 팁을 한 문장으로 생성해주세요. 25자 이내로 작성해주세요.",
            "study": "공부에 대한 동기부여나 학습 팁을 초등학생들에게 친근하게 알려주는 한 문장을 생성해주세요. 25자 이내로 작성해주세요."
        }
        
        prompt = prompts.get(category, prompts["humor"])
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "당신은 친근하고 밝은 초등학교 선생님입니다. 짧고 간결한 응답을 해주세요."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=50,
            temperature=0.8
        )
        
        generated_text = response.choices[0].message.content.strip()
        
        print(f"🤖 GPT 발화 생성: {generated_text}")
        return {"text": generated_text, "source": "gpt"}
        
    except Exception as e:
        print(f"❌ GPT API 호출 오류: {e}")
        # 오류 시 샘플 발화 반환
        return generate_sample_speech(category)


def generate_sample_speech(category: str) -> dict:
    """샘플 발화 생성 (GPT API 없을 때)"""
    
    samples = {
        "humor": [
            "오늘 날씨가 참 맑네요! 🌞",
            "모두들 화이팅! 💪",
            "오늘도 즐겁게 수업해요! 😊",
            "공부는 마법과 같아요! ✨",
            "우리 모두 톡톡 튀는 생각을 해봐요! 💡",
            "웃으면 복이 온다고 해요! 😄",
            "오늘 점심 뭐 먹을까요? 🍽️"
        ],
        "proverb": [
            "새벽에 일어나는 새가 벌레를 잡는다고 해요! 🐦",
            "작은 시작이 큰 성취로 이어져요! 🌱",
            "함께 하면 더 즐거워요! 👥",
            "꾸준함이 최고의 무기예요! 🎯",
            "서두르지 않고 천천히 해봐요! 🐢",
            "미루지 말고 지금 바로 해봐요! ⚡",
            "열심히 하면 반드시 좋은 일이 있어요! 💫"
        ],
        "encouragation": [
            "모두 열심히 하고 있어요! 👏",
            "한 걸음씩 차근차근! 🚶",
            "오늘도 멋진 하루 되세요! 🌈",
            "작은 노력들이 모이면 큰 성과예요! 🌟",
            "포기하지 말고 도전해봐요! 🎪",
            "여러분은 충분히 훌륭해요! 🌟",
            "오늘도 최선을 다해봐요! 💖"
        ],
        "weather": [
            "오늘 날씨 참 좋네요! ☀️",
            "가을 하늘이 참 푸르러요! 🌤️",
            "바람이 시원하게 불어와요! 💨",
            "비가 온다면 우산 준비하세요! ☔",
            "날씨가 선선해서 기분 좋아요! 🍂"
        ],
        "quote": [
            "노력은 배신하지 않아요! 💪",
            "실패는 성공의 어머니예요! 🌱",
            "지금 바로 시작해봐요! 🚀",
            "작은 변화가 큰 차이를 만들어요! ✨",
            "용기를 내 봐요! 🦸"
        ],
        "math": [
            "1 더하기 1은 뭘까요? 1+1=? 🤔",
            "3 곱하기 2는? 3×2=? 🧮",
            "원둘레 구하는 공식 기억나요? ⭕",
            "직각삼각형은 90도예요! 📐",
            "분수 더하기 재미있어요! 🍕"
        ],
        "study": [
            "책 한 권 더 읽어봐요! 📚",
            "공책 꽉 채워보세요! ✏️",
            "오늘 배운 거 복습해봐요! 🔄",
            "집중하면 잘 풀려요! 🎯",
            "질문이 있으면 언제든지! 🙋"
        ]
    }
    
    import random
    selected = random.choice(samples.get(category, samples["humor"]))
    
    print(f"📝 샘플 발화 생성 ({category}): {selected}")
    return {"text": selected, "source": "sample"}


@router.get("/test")
async def test_conversation():
    """발화 생성 테스트 엔드포인트"""
    return {
        "humor": await generate_speech(category="humor"),
        "proverb": await generate_speech(category="proverb"),
        "encouragement": await generate_speech(category="encouragement")
    }
