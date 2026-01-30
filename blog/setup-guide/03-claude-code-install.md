# [Claude Code 완벽 가이드] 3편: Claude Code CLI 설치 & 인증

## 이전 편 요약

2편에서는 Node.js와 npm을 설치했습니다. 이제 드디어 **Claude Code**를 설치할 차례입니다!

---

## Claude Code란?

**Claude Code**는 Anthropic에서 만든 **AI 코딩 어시스턴트**입니다.

터미널에서 실행되며, 자연어로 명령하면 코드를 작성하고, 파일을 수정하고, 명령어를 실행해줍니다.

### 특징
- 💬 자연어로 대화하며 코딩
- 📁 파일 읽기/쓰기/편집
- 🖥️ 터미널 명령어 실행
- 🔍 코드베이스 탐색 & 이해
- 🌐 웹 검색 & 정보 수집

---

## Claude Code 설치

### 1. npm으로 설치

VS Code 터미널에서:

```bash
npm install -g @anthropic-ai/claude-code
```

[스크린샷: npm 설치 진행 화면]

설치에 1~2분 정도 걸립니다.

### 2. 설치 확인

```bash
claude --version
```

결과 예시:
```
claude-code version 1.0.x
```

---

## Anthropic 계정 만들기

Claude Code를 사용하려면 **Anthropic 계정**이 필요합니다.

### 1. 가입하기

👉 https://console.anthropic.com/

[스크린샷: Anthropic 콘솔 페이지]

**Sign Up** 클릭 → 이메일로 가입

### 2. API 요금

Claude Code는 **API 사용량에 따라 요금**이 부과됩니다.

| 모델 | 입력 (1M 토큰) | 출력 (1M 토큰) |
|------|---------------|---------------|
| Claude 3.5 Sonnet | $3 | $15 |
| Claude 3 Opus | $15 | $75 |

**참고**: 일반적인 코딩 작업은 하루 $1~5 정도

### 3. 결제 수단 등록

Billing → Payment Method에서 카드 등록

---

## Claude Code 인증

### 1. 인증 시작

터미널에서:

```bash
claude
```

처음 실행하면 인증 화면이 나옵니다.

### 2. 브라우저 인증

[스크린샷: 인증 화면]

**Enter**를 누르면 브라우저가 열리고 Anthropic 로그인 페이지가 나타납니다.

1. Anthropic 계정으로 로그인
2. "Authorize" 클릭
3. 터미널로 돌아오면 인증 완료!

### 3. 인증 확인

```
✓ Authentication successful
Welcome to Claude Code!
```

---

## 첫 번째 대화

인증이 완료되면 바로 Claude와 대화할 수 있습니다.

```
You: 안녕, 간단한 Python 파일 만들어줘

Claude: 안녕하세요! 간단한 Python 파일을 만들어드리겠습니다.
[파일 생성 중...]
```

[스크린샷: 첫 대화 화면]

---

## 기본 사용법

### 대화하기

그냥 자연어로 말하면 됩니다:

```
이 폴더에 있는 파일 목록 보여줘
```

```
package.json 파일 읽어줘
```

```
hello.js 파일 만들고 "Hello World" 출력하는 코드 작성해줘
```

### 종료하기

대화를 끝내려면:

```
/exit
```

또는 **Ctrl + C** 두 번

---

## 설정 파일

Claude Code 설정은 `~/.claude/` 폴더에 저장됩니다.

**Windows 경로:**
```
C:\Users\사용자이름\.claude\
```

### 주요 파일
- `settings.json`: 기본 설정
- `.credentials.json`: 인증 정보 (건드리지 마세요!)
- `history.jsonl`: 대화 기록

---

## 자주 발생하는 문제

### "claude: command not found"

**원인**: npm 전역 경로가 PATH에 없음

**해결**:
```bash
# npm 전역 경로 확인
npm config get prefix

# 해당 경로를 PATH에 추가
```

### 인증 실패

**해결**:
```bash
# 인증 정보 초기화
claude logout

# 다시 인증
claude
```

### API 오류

**원인**: 결제 수단 미등록 또는 크레딧 부족

**해결**: https://console.anthropic.com/billing 에서 확인

---

## 다음 편 예고

4편에서는 **터미널 기본 사용법**을 알아봅니다.

터미널에 익숙하지 않아도 Claude Code를 사용할 수 있지만, 기본적인 명령어를 알면 훨씬 편리합니다.

[4편 보러가기 →](#)

---

*이전 글: [2편 - Node.js 설치](#)*
*다음 글: [4편 - 터미널 기본 사용법](#)*
