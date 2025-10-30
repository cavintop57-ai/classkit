# Cloudways MySQL 설정 가이드

## 1️⃣ Cloudways 대시보드에서 MySQL 정보 확인

### 방법 A: 웹 대시보드
1. https://platform.cloudways.com 로그인
2. 서버 선택: **phpstack-1293143-5917982**
3. **Application Management** → **Access Details** 클릭
4. **Database Access** 섹션 확인:
   - Database Name
   - Username
   - Password
   - Host (보통 localhost)

### 방법 B: SSH에서 확인
```bash
# SSH 접속
ssh comapanic2@167.172.70.163

# MySQL 설정 파일 확인
cat ~/.my.cnf

# 또는 직접 MySQL 접속 테스트
mysql -u root -p
```

---

## 2️⃣ MySQL 데이터베이스 생성

SSH에서 실행:

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS classkit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 확인
SHOW DATABASES;

# 종료
EXIT;
```

---

## 3️⃣ 환경변수 설정

### 방법 A: .env 파일 생성 (권장)

```bash
cd ~/classkit/backend
nano .env
```

내용 입력:
```env
# Domain
DOMAIN_URL=https://phpstack-1293143-5917982.cloudwaysapps.com

# MySQL Database (Cloudways에서 확인한 정보 입력)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=여기에_실제_비밀번호_입력
DB_NAME=classkit

# Optional
SQL_ECHO=false
```

저장: `Ctrl+O` → Enter → `Ctrl+X`

### 방법 B: 직접 export (임시)

```bash
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=여기에_실제_비밀번호_입력
export DB_NAME=classkit
export DOMAIN_URL=https://phpstack-1293143-5917982.cloudwaysapps.com
```

---

## 4️⃣ Python 패키지 설치

```bash
cd ~/classkit/backend
pip3 install --user -r requirements.txt
```

필수 패키지:
- `aiomysql` - MySQL 비동기 드라이버
- `pymysql` - MySQL 동기 드라이버
- `cryptography` - 암호화 (MySQL 연결 시 필요)

---

## 5️⃣ 데이터베이스 초기화

```bash
cd ~/classkit/backend
python3 -m app.init_db
```

성공 메시지:
```
✅ MySQL 사용: root@localhost/classkit
[OK] 데이터베이스 초기화 완료
  - 테이블 생성: schools, classes, sessions, messages, problems
  - 문제: 32개
```

---

## 6️⃣ 서버 시작

```bash
cd ~/classkit
bash deploy_classkit.sh
```

또는 수동:
```bash
cd ~/classkit/backend

# 환경변수 로드 (.env 사용 시 자동)
export DOMAIN_URL=https://phpstack-1293143-5917982.cloudwaysapps.com

# 서버 시작
nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > ~/classkit.log 2>&1 &
```

---

## 7️⃣ 확인

### Health Check
```bash
curl http://localhost:8000/health
```

기대 결과:
```json
{"status":"ok","database":"mysql"}
```

### 로그 확인
```bash
tail -f ~/classkit.log
```

성공 메시지:
```
✅ MySQL 사용: root@localhost/classkit
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 웹 접속
https://phpstack-1293143-5917982.cloudwaysapps.com

---

## 🐛 문제 해결

### 1. `ModuleNotFoundError: No module named 'aiomysql'`
```bash
pip3 install --user aiomysql pymysql cryptography
```

### 2. `Access denied for user 'root'@'localhost'`
- MySQL 비밀번호 확인: `cat ~/.my.cnf`
- `.env` 파일의 `DB_PASSWORD` 확인

### 3. `Unknown database 'classkit'`
```bash
mysql -u root -p -e "CREATE DATABASE classkit;"
```

### 4. `Can't connect to MySQL server`
- MySQL 서비스 확인:
```bash
systemctl status mysql
# 또는
service mysql status
```

### 5. 환경변수가 적용되지 않음
- `.env` 파일 위치 확인: `~/classkit/backend/.env`
- 파일 권한 확인: `chmod 600 ~/classkit/backend/.env`

---

## 📝 참고사항

### 로컬 개발 환경
로컬에서는 SQLite를 자동으로 사용합니다:
```bash
cd C:\classkit\backend
python -m app.init_db
python -m uvicorn app.main:app --reload
```

### 프로덕션 환경
Cloudways 서버에서는 MySQL을 자동으로 감지하여 사용합니다.

### 데이터베이스 전환
- **SQLite → MySQL**: `python3 -m app.init_db` 실행
- **MySQL → SQLite**: `.env` 파일 삭제 또는 `DB_PASSWORD` 제거

---

## ✅ 완료 체크리스트

- [ ] Cloudways 대시보드에서 MySQL 정보 확인
- [ ] MySQL 데이터베이스 생성 (`classkit`)
- [ ] `.env` 파일 생성 및 MySQL 연결 정보 입력
- [ ] `pip3 install --user -r requirements.txt` 실행
- [ ] `python3 -m app.init_db` 실행
- [ ] `bash deploy_classkit.sh` 실행
- [ ] `curl http://localhost:8000/health` 확인
- [ ] 웹 브라우저에서 https://phpstack-1293143-5917982.cloudwaysapps.com 접속

---

**문제가 계속되면**: `tail -100 ~/classkit.log` 로그를 확인하고 에러 메시지를 공유해주세요.

