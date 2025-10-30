# 문제 데이터 관리 가이드

## 📋 CSV 파일로 문제 관리하기

이 폴더의 `problems.csv` 파일을 수정하면 학생용 문제를 쉽게 관리할 수 있습니다.

## 📁 파일 구조

```
backend/data/
├── problems.csv       # 문제 데이터 (수정 가능)
└── classkit.db        # SQLite 데이터베이스 (자동 생성)
```

## 📝 CSV 파일 형식

`problems.csv` 파일은 다음과 같은 컬럼으로 구성됩니다:

| 컬럼 | 설명 | 예시 |
|------|------|------|
| `type` | 문제 유형 (vocabulary, proverb, vocab) | `vocabulary` |
| `grade` | 학년 | `3`, `4`, `5`, `6` |
| `difficulty` | 난이도 (1-5) | `3` |
| `question` | 문제 | `영어 단어: 사과` |
| `answer` | 정답 | `apple` |
| `hint` | 힌트 (선택) | `과일입니다` |
| `word` | 단어 (vocabulary 전용) | `apple` |
| `meaning` | 뜻 (vocabulary 전용) | `사과` |
| `example` | 예문 (vocabulary 전용) | `I like apples.` |
| `example_ko` | 예문 번역 (vocabulary 전용) | `나는 사과를 좋아해요.` |

## 🔄 데이터베이스에 반영하기

### 방법 1: 백엔드 재시작 (자동 로드)

백엔드를 처음 실행하면 자동으로 CSV 파일을 읽어서 데이터베이스에 저장합니다.

```bash
cd backend
python -m app.init_db
```

### 방법 2: 수동 실행 (데이터 재로드)

```bash
cd backend
python -m app.seed_data
```

**⚠️ 주의**: 이 명령은 기존 문제를 삭제하고 CSV 파일의 내용으로 새로 저장합니다.

## ✏️ 문제 추가/수정 예시

### 영어 단어 문제 추가

```csv
vocabulary,5,3,영어 단어: 창의적인,creative,새로운 것을 만드는,creative,창의적인,Be creative!,창의적이세요!
```

### 속담 문제 추가

```csv
proverb,4,2,속담: 백지장도 맞들면 ______,낫다,함께하면,,,,,
```

### 어휘 문제 추가

```csv
vocab,6,4,다음 뜻의 단어는? '어려운 상황을 견디고 이겨내는 힘',인내,참을성,,,,,
```

## 📊 문제 유형별 가이드

### 1. vocabulary (영어 단어)
- 영어 단어의 뜻, 예문 포함
- `word`, `meaning`, `example`, `example_ko` 컬럼 필수

### 2. proverb (속담)
- 한국 속담 빈칸 채우기
- `question`, `answer`, `hint` 컬럼 사용

### 3. vocab (국어 어휘)
- 국어 단어의 뜻 설명
- `question`, `answer`, `hint` 컬럼 사용

## 🎯 난이도 가이드

| 난이도 | 설명 | 예시 |
|--------|------|------|
| 1 | 매우 쉬움 | 3학년: 사과, 고양이, 책 |
| 2 | 쉬움 | 4학년: 행복한, 아름다운 |
| 3 | 보통 | 5학년: 정직한, 부지런한 |
| 4 | 어려움 | 6학년: 창의적인, 책임감 |
| 5 | 매우 어려움 | 고급 어휘 |

## 💡 팁

1. **엑셀로 편집**: CSV 파일을 엑셀로 열어서 편집하면 편리합니다.
2. **UTF-8 인코딩**: 한글이 깨지지 않도록 UTF-8로 저장하세요.
3. **빈 줄 제거**: 마지막에 빈 줄이 있으면 삭제하세요.
4. **따옴표 주의**: 내용에 쉼표가 있으면 따옴표로 감싸세요.

## 🚀 빠른 시작

1. `problems.csv` 파일을 엑셀로 엽니다
2. 문제를 추가하거나 수정합니다
3. UTF-8 형식으로 저장합니다
4. 백엔드를 재시작합니다: `python -m app.init_db`

## 🔗 관련 파일

- `problems.csv`: 문제 데이터
- `../app/seed_data.py`: CSV 로드 스크립트
- `../app/models.py`: 데이터베이스 모델
- `../app/routes/problems.py`: 문제 API

---

**문제가 생겼나요?** 백엔드 로그를 확인해보세요:
```bash
cd backend
python -m app.main
```

