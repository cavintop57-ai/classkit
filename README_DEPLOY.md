# 🚀 ClassKit 배포하기

## 📋 배포 파일 (3개만!)

1. **`deploy.bat`** - 첫 배포
2. **`update.bat`** - 업데이트
3. **`manual_deploy_steps.txt`** - 수동 배포

---

## ⚡ 첫 배포 (3분)

### 1. GitHub 레포 확인
✅ 이미 생성됨: https://github.com/cavintop57-ai/classkit

### 2. 배치파일 실행
```cmd
deploy.bat
```

GitHub URL 입력하면 끝!

### 3. 위젯 설정
`widget/src/main.js` 수정:
```javascript
const API_BASE = 'http://167.172.70.163:8000/api';
const WS_BASE = 'ws://167.172.70.163:8000';
```

---

## 🔄 업데이트

```cmd
update.bat
```

---

## 🌐 접속

- **모바일**: http://167.172.70.163:8000
- **위젯**: `cd widget && npm run dev` → http://localhost:5173

---

**끝! 간단하죠?** 🎉

