# [Claude Code 완벽 가이드] 6편: 파일 읽기/쓰기/편집

## 이전 편 요약

5편에서는 Claude Code 기본 명령어를 배웠습니다. 이번 편에서는 파일 작업을 자세히 알아봅니다.

---

## Claude Code의 파일 도구

Claude Code는 세 가지 파일 도구를 사용합니다:

| 도구 | 용도 |
|------|------|
| **Read** | 파일 읽기 |
| **Write** | 새 파일 생성 |
| **Edit** | 기존 파일 수정 |

---

## 파일 읽기 (Read)

### 기본 사용법

```
config.json 파일 읽어줘
```

```
src/index.js 내용 보여줘
```

### 여러 파일 읽기

```
src 폴더에 있는 모든 JavaScript 파일 읽어줘
```

### 특정 부분만 읽기

```
app.js에서 100번째 줄부터 150번째 줄까지만 보여줘
```

### 이미지 파일

Claude Code는 이미지도 읽을 수 있습니다:

```
screenshot.png 봐줘
```

---

## 파일 생성 (Write)

### 새 파일 만들기

```
index.html 파일 만들어줘. 기본 HTML5 구조로.
```

### 내용 지정하기

```
config.json 파일 만들고 다음 내용 넣어줘:
{
  "port": 3000,
  "debug": true
}
```

### 여러 파일 한 번에

```
다음 파일들 만들어줘:
- src/index.js (Express 서버)
- src/routes/api.js (API 라우트)
- package.json (의존성 포함)
```

---

## 파일 수정 (Edit)

### 특정 부분 수정

```
config.json에서 port를 8080으로 바꿔줘
```

### 추가하기

```
index.js 맨 위에 이 import 문 추가해줘:
import axios from 'axios';
```

### 삭제하기

```
app.js에서 모든 console.log 문 삭제해줘
```

### 치환하기

```
모든 파일에서 'oldFunction'을 'newFunction'으로 바꿔줘
```

---

## 실제 예시

### 예시 1: 설정 파일 수정

**요청:**
```
package.json에 scripts 섹션에 "dev": "nodemon index.js" 추가해줘
```

**Claude 작업:**
```json
// 수정 전
"scripts": {
  "start": "node index.js"
}

// 수정 후
"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js"
}
```

### 예시 2: 코드 리팩토링

**요청:**
```
utils.js에 있는 calculateTotal 함수를 화살표 함수로 바꿔줘
```

**Claude 작업:**
```javascript
// 수정 전
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// 수정 후
const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};
```

---

## 권한 확인

파일을 수정할 때 Claude는 확인을 요청합니다:

```
Claude: 다음 파일을 수정하시겠습니까?
File: src/config.js
Changes: port 값을 3000에서 8080으로 변경

[Y/n]
```

- **Y** 또는 **Enter**: 승인
- **n**: 거부

### 자동 승인 설정

자주 쓰는 작업은 자동 승인할 수 있습니다:

```
/allow Edit
```

---

## 대용량 파일 처리

### 파일이 너무 클 때

```
이 파일이 너무 커서 일부만 보여줄게요.
1-100번째 줄을 표시합니다.
```

### 특정 부분 요청

```
large-file.js에서 'function processData' 함수만 찾아서 보여줘
```

---

## 파일 검색

### 파일 찾기

```
프로젝트에서 .env 파일 찾아줘
```

### 내용으로 검색

```
'API_KEY'가 포함된 파일 찾아줘
```

### 패턴 검색

```
src 폴더에서 TODO 주석이 있는 파일 모두 찾아줘
```

---

## 주의사항

### 1. 민감한 파일

`.env`, 비밀번호, API 키가 포함된 파일은 주의하세요.

### 2. 백업

중요한 파일 수정 전에 백업을 권장합니다:

```
config.json 수정하기 전에 config.backup.json으로 복사해둬
```

### 3. Git 사용

변경 사항을 추적하려면 Git을 사용하세요:

```
git status로 변경된 파일 확인해줘
```

---

## 다음 편 예고

7편에서는 **Bash 명령어 활용**을 알아봅니다.

- npm, git 등 CLI 도구 사용
- 빌드 & 테스트 자동화
- 시스템 명령어 실행

[7편 보러가기 →](#)

---

*이전 글: [5편 - Claude Code 기본 명령어](#)*
*다음 글: [7편 - Bash 명령어 활용](#)*
