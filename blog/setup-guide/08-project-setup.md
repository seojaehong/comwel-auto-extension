# [Claude Code 완벽 가이드] 8편: 프로젝트 설정 (CLAUDE.md)

## 이전 편 요약

7편에서는 Bash 명령어 활용을 배웠습니다. 이번 편에서는 프로젝트별 설정 방법을 알아봅니다.

---

## CLAUDE.md란?

**CLAUDE.md**는 프로젝트 루트에 있는 설정 파일입니다.

Claude Code가 프로젝트를 이해하는 데 도움이 되는 정보를 담습니다.

```
my-project/
├── CLAUDE.md          ← 프로젝트 설정
├── src/
├── package.json
└── ...
```

---

## CLAUDE.md 생성

### 자동 생성

```
/init
```

Claude가 프로젝트를 분석하고 CLAUDE.md를 자동 생성합니다.

### 수동 생성

```
CLAUDE.md 파일 만들어줘
```

---

## CLAUDE.md 구조

### 기본 템플릿

```markdown
# 프로젝트 이름

## 개요
이 프로젝트는 ...

## 기술 스택
- Node.js
- Express
- MongoDB

## 폴더 구조
- src/: 소스 코드
- tests/: 테스트 파일
- docs/: 문서

## 실행 방법
npm install
npm run dev

## 주요 명령어
- npm run dev: 개발 서버
- npm test: 테스트 실행
- npm run build: 빌드

## 규칙
- 코드 스타일: ESLint + Prettier
- 커밋 메시지: Conventional Commits
- 브랜치 전략: Git Flow
```

---

## 섹션별 설명

### 1. 개요

프로젝트가 무엇인지 간단히 설명

```markdown
## 개요
근로복지공단 업무 자동화를 위한 Chrome 확장프로그램입니다.
- 근로자 정보 일괄 조회
- CSV 다운로드
- 다중 사업장 처리
```

### 2. 기술 스택

사용하는 기술 목록

```markdown
## 기술 스택
- Chrome Extension (Manifest V3)
- Vanilla JavaScript
- Chrome APIs (cookies, scripting, storage)
```

### 3. 폴더 구조

주요 폴더와 역할

```markdown
## 폴더 구조
- popup/: 팝업 UI
- content/: 콘텐츠 스크립트
- background/: 백그라운드 서비스
- utils/: 유틸리티 함수
```

### 4. 주요 명령어

자주 쓰는 명령어

```markdown
## 주요 명령어
- 없음 (브라우저 확장프로그램)

## 테스트 방법
1. chrome://extensions 열기
2. 개발자 모드 ON
3. 폴더 로드
```

### 5. 규칙

코딩 컨벤션, 커밋 규칙 등

```markdown
## 규칙
- 함수명: camelCase
- 파일명: kebab-case
- 주석: 한글 OK
- 들여쓰기: 2칸
```

---

## CLAUDE.md 활용

### Claude가 참조하는 정보

CLAUDE.md가 있으면 Claude가:
- 프로젝트 구조를 빠르게 파악
- 적절한 기술 스택으로 코드 작성
- 프로젝트 규칙을 준수

### 예시 대화

**CLAUDE.md 없을 때:**
```
You: API 엔드포인트 추가해줘

Claude: 어떤 프레임워크를 사용하고 있나요?
Express? Fastify? Koa?
```

**CLAUDE.md 있을 때:**
```
You: API 엔드포인트 추가해줘

Claude: Express 라우터에 새 엔드포인트를 추가하겠습니다.
[코드 작성 시작]
```

---

## 고급 설정

### 무시할 파일/폴더

```markdown
## 무시
- node_modules/
- dist/
- .env
- *.log
```

### 중요 파일

```markdown
## 중요 파일
- src/config.js: 설정 파일 (수정 시 주의)
- src/db/schema.js: DB 스키마
```

### 커스텀 명령어

```markdown
## 커스텀 명령어
- /deploy: npm run build && npm run deploy
- /test-all: npm test && npm run e2e
```

---

## 여러 프로젝트 관리

각 프로젝트마다 CLAUDE.md를 만들면 Claude가 프로젝트별로 다르게 동작합니다.

```
~/projects/
├── project-a/
│   └── CLAUDE.md  (React 프로젝트)
├── project-b/
│   └── CLAUDE.md  (Node.js API)
└── project-c/
    └── CLAUDE.md  (Python ML)
```

---

## 다음 편 예고

9편부터는 **bkit 플러그인**을 알아봅니다!

bkit은 Claude Code의 기능을 확장하는 플러그인으로, 체계적인 개발 방법론(PDCA)을 제공합니다.

[9편 보러가기 →](#)

---

*이전 글: [7편 - Bash 명령어 활용](#)*
*다음 글: [9편 - bkit 플러그인 설치](#)*
