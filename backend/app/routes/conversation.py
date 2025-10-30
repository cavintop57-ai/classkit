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
        
        # 카테고리별 프롬프트 설정 (응원과 격려 중심)
        prompts = {
            "humor": "초등학생들을 응원하는 따뜻하고 긍정적인 한 문장을 생성해주세요. 25자 이내로 작성해주세요.",
            "proverb": "초등학생들을 격려하는 속담이나 따뜻한 격려의 말을 한 문장으로 생성해주세요. 30자 이내로 작성해주세요.",
            "encouragement": "친구들을 응원하는 따뜻하고 친근한 한 문장을 생성해주세요. 30자 이내로 작성해주세요.",
            "weather": "오늘 날씨에 대해 친구들을 응원하는 따뜻한 한 문장을 생성해주세요. 25자 이내로 작성해주세요.",
            "quote": "친구들을 격려하는 따뜻한 한 문장을 생성해주세요. 30자 이내로 작성해주세요.",
            "math": "공부를 하는 친구들을 응원하는 따뜻한 한 문장을 생성해주세요. 25자 이내로 작성해주세요.",
            "study": "열심히 공부하는 친구들을 응원하는 따뜻하고 격려하는 한 문장을 생성해주세요. 30자 이내로 작성해주세요."
        }
        
        prompt = prompts.get(category, prompts["humor"])
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "당신은 친구들을 응원하고 격려하는 따뜻한 초등학교 학생입니다. 항상 따뜻하고 긍정적인 말만 합니다."},
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
            "오늘도 모두 수고했어요! 🌟",
            "친구들이 정말 멋져요! 💪",
            "우리 모두 잘하고 있어요! ✨",
            "오늘도 화이팅입니다! 😊",
            "친구들이 최고예요! 💖",
            "모두들 대단해요! 👏",
            "오늘도 열심히 하는 모습 멋져요! 🌈"
        ],
        "proverb": [
            "함께하면 더 즐겁고 좋아요! 👥",
            "작은 시작이 큰 성취로 이어져요! 🌱",
            "꾸준히 노력하면 반드시 좋아요! 🎯",
            "천천히 해도 괜찮아요! 🐢",
            "친구들을 응원해요! ⚡",
            "모두가 최선을 다하고 있어요! 💫",
            "서로 도와주는 모습이 예뻐요! 🤝"
        ],
        "encouragation": [
            "모두 열심히 해서 멋져요! 👏",
            "한 걸음씩 차근차근 잘하고 있어요! 🚶",
            "오늘도 멋진 하루 되세요! 🌈",
            "작은 노력이 큰 성과를 만들어요! 🌟",
            "포기하지 않고 도전하는 모습 대단해요! 🎪",
            "친구들은 충분히 훌륭해요! 🌟",
            "오늘도 최선을 다해서 멋져요! 💖"
        ],
        "weather": [
            "날씨 좋은 날 함께 지내요! ☀️",
            "밝은 하늘처럼 모두 밝게 지내요! 🌤️",
            "시원한 바람처럼 시원하게 지내요! 💨",
            "비 올 때도 함께 있으면 좋아요! ☔",
            "맑은 날씨처럼 맑게 웃어요! 🍂"
        ],
        "quote": [
            "노력은 배신하지 않아요! 💪",
            "실패해도 다시 도전하면 돼요! 🌱",
            "지금 잘하고 있어요! 🚀",
            "작은 변화가 큰 차이를 만들어요! ✨",
            "용기를 내서 하는 모습 멋져요! 🦸"
        ],
        "math": [
            "수학 열심히 하는 친구들 대단해요! 🧮",
            "공부하는 모습이 멋져요! 📊",
            "문제 풀 때 집중하는 모습 좋아요! 📐",
            "함께 공부해서 더 재미있어요! ✏️",
            "계산 잘하는 친구들 최고예요! 🎯"
        ],
        "study": [
            "공부 열심히 하는 친구들 화이팅! 📚",
            "노력하는 모습이 정말 멋져요! ✏️",
            "오늘도 열심히 해서 대단해요! 🔄",
            "집중하는 모습이 예뻐요! 🎯",
            "궁금한 게 있으면 언제든 물어봐요! 🙋"
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
