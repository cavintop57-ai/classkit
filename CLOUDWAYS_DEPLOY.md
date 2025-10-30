# Cloudways 배포 가이드

## ✅ 자동 배포 (GitHub Hook 사용)

현재 GitHub에 푸시했으므로, Cloudways에서 다음 방법으로 배포하세요:

### 방법 1: SSH로 수동 배포 (권장)

1. Cloudways 웹 콘솔에 접속
2. SSH 터미널 열기
3. 다음 명령어 실행:

```bash
cd ~/classkit
bash deploy_classkit.sh
```

---

### 방법 2: Git Pull로 수동 배포

```bash
cd ~/classkit
git pull origin main
bash deploy_classkit.sh
```

---

## 📝 배포 전 확인사항

### 1. OpenAI API 키 설정

Cloudways SSH에서 다음 명령어로 환경변수 추가:

```bash
# 환경변수 파일에 추가 (nano 또는 vim 사용)
export OPENAI_API_KEY="your-api-key-here"
```

또는 `.bashrc` 또는 `.profile` 파일에 추가:

```bash
echo 'export OPENAI_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc
```

**참고**: 실제 API 키는 Cloudways 환경변수 설정에서 추가하세요.

### 2. MySQL 데이터베이스 확인

`~/.my.cnf` 파일이 있는지 확인:

```bash
cat ~/.my.cnf
```

없으면 Cloudways에서 MySQL 정보를 받아서 생성:

```bash
# ~/.my.cnf 파일 생성
cat > ~/.my.cnf << 'EOF'
[client]
host=localhost
user=your_mysql_user
password=your_mysql_password
database=classkit
EOF
```

---

## 🔍 배포 후 확인

### 1. 서버 상태 확인

```bash
# 프로세스 확인
ps aux | grep uvicorn

# 로그 확인
tail -f ~/classkit.log
```

### 2. Health Check

브라우저에서 접속:
- http://167.172.70.163:8000/health
- 또는 https://phpstack-1293143-5917982.cloudwaysapps.com/health

정상 응답:
```json
{"status": "healthy", "database": "connected"}
```

### 3. 위젯 접속 확인

- https://phpstack-1293143-5917982.cloudwaysapps.com/

---

## 🐛 문제 해결

### 서버가 시작되지 않는 경우

```bash
# 기존 프로세스 완전 제거
pkill -9 -f uvicorn
sleep 2

# 다시 시작
bash deploy_classkit.sh
```

### Python 패키지 오류

```bash
cd ~/classkit/backend
source venv/bin/activate
pip install -r requirements.txt --upgrade
```

### 데이터베이스 오류

```bash
cd ~/classkit/backend
source venv/bin/activate
python -m app.init_db
```

---

## 📞 추가 지원

문제가 계속되면 다음 정보를 확인하세요:

1. Cloudways 로그: `~/classkit.log`
2. Python 버전: `python3 --version` (3.9+ 필요)
3. 필수 패키지: `pip list | grep -E "fastapi|uvicorn"`
4. 포트 사용 중: `lsof -i :8000`

---

## 🎉 배포 완료

배포가 성공하면:

✅ https://phpstack-1293143-5917982.cloudwaysapps.com/ 에서 위젯 접속
✅ QR 코드가 정상 생성됨
✅ 학생 모바일 앱이 정상 작동함
✅ AI 자동 발화 기능 작동 (OPENAI_API_KEY 설정 시)

