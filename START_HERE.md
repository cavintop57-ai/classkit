# ⚡ ClassKit 배포 시작!

## ✅ 준비 완료!
- ✅ GitHub 레포: https://github.com/cavintop57-ai/classkit
- ✅ Cloudways 서버: 167.172.70.163
- ✅ 모든 파일 정리 완료

---

## 🚀 지금 바로 배포 (2분!)

### 1️⃣ 배치파일 실행

```cmd
deploy.bat
```

**자동으로:**
1. GitHub 푸시
2. 배포 명령어 클립보드 복사
3. SSH 접속 안내

---

### 2️⃣ SSH 접속 & 붙여넣기

```bash
ssh master_xhbedwcksw@167.172.70.163
```

비밀번호: `Q1w2e3r4!@`

**붙여넣기:**
- `Shift + Insert` 또는
- `Ctrl + Shift + V` 또는
- `마우스 우클릭`

---

### 3️⃣ 위젯 설정

`widget/src/main.js` (10-11줄):

```javascript
const API_BASE = 'http://167.172.70.163:8000/api';
const WS_BASE = 'ws://167.172.70.163:8000';
```

---

## 🌐 접속 URL

- **모바일**: http://167.172.70.163:8000
- **위젯**: http://localhost:5173

---

## 🔄 업데이트

```cmd
update.bat
```

---

## 📋 배포 파일 정리

**필수 파일 (4개):**
1. ⭐ `deploy.bat` - 첫 배포
2. 🔄 `update.bat` - 업데이트
3. 📄 `manual_deploy_steps.txt` - 수동 가이드
4. 📄 `ONELINER_DEPLOY.txt` - 원라이너 명령어

**가이드 문서 (2개):**
- `DEPLOY_CLOUDWAYS.md` - 상세 가이드
- `README_DEPLOY.md` - 빠른 요약

**개발 도구:**
- `start_backend.bat` - 로컬 백엔드
- `start_widget.bat` - 로컬 위젯

---

**지금 바로 `deploy.bat` 실행하세요!** 🚀

