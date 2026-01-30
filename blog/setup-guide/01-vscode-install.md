# [Claude Code 완벽 가이드] 1편: VS Code 설치 & 기본 설정

## 시리즈 소개

이 시리즈는 **AI 코딩 어시스턴트 Claude Code**를 처음부터 설정하고 활용하는 방법을 다룹니다.

프로그래밍 경험이 없어도 따라할 수 있도록 **VS Code 설치**부터 시작합니다.

---

## VS Code란?

**Visual Studio Code (VS Code)**는 Microsoft에서 만든 무료 코드 편집기입니다.

- 무료 & 오픈소스
- 가볍고 빠름
- 확장 프로그램으로 기능 추가 가능
- Windows, Mac, Linux 모두 지원

Claude Code는 터미널에서 실행되지만, VS Code와 함께 사용하면 훨씬 편리합니다.

---

## VS Code 설치하기

### 1. 다운로드

공식 사이트에서 다운로드:
👉 https://code.visualstudio.com/

[스크린샷: VS Code 공식 사이트 다운로드 페이지]

**Download for Windows** 버튼 클릭

### 2. 설치

다운로드된 설치 파일 실행 (VSCodeUserSetup-x64-*.exe)

[스크린샷: 설치 마법사]

**설치 옵션 (체크 권장):**
- ✅ "PATH에 추가" (중요!)
- ✅ "Code로 열기" 컨텍스트 메뉴 추가
- ✅ 바탕화면 아이콘 생성

### 3. 실행 확인

설치 완료 후 VS Code 실행

[스크린샷: VS Code 첫 실행 화면]

---

## 한글 설정 (선택사항)

VS Code 기본 언어는 영어입니다. 한글로 바꾸려면:

1. **Ctrl + Shift + X** (확장 프로그램)
2. **Korean Language Pack** 검색
3. **Install** 클릭
4. VS Code 재시작

[스크린샷: Korean Language Pack 설치]

---

## 필수 확장 프로그램

### 1. Korean Language Pack
- 한글 인터페이스

### 2. Material Icon Theme
- 파일 아이콘 예쁘게

### 3. Prettier
- 코드 자동 정렬

### 4. GitLens (선택)
- Git 기능 강화

**설치 방법:**
1. **Ctrl + Shift + X**
2. 확장 프로그램 이름 검색
3. **Install** 클릭

---

## 기본 설정

### 자동 저장 켜기

1. **파일 → 기본 설정 → 설정** (또는 Ctrl + ,)
2. "auto save" 검색
3. **Files: Auto Save** → `afterDelay` 선택

[스크린샷: 자동 저장 설정]

### 폰트 크기 조절

설정에서 "font size" 검색
- **Editor: Font Size**: 14~16 권장

### 테마 변경

1. **Ctrl + K, Ctrl + T**
2. 원하는 테마 선택

인기 테마:
- Dark+ (기본)
- One Dark Pro
- Dracula

---

## 터미널 열기

VS Code에는 터미널이 내장되어 있습니다.

**터미널 열기**: **Ctrl + `** (백틱, 숫자 1 왼쪽 키)

[스크린샷: VS Code 터미널]

Claude Code는 이 터미널에서 실행합니다!

---

## 폴더 열기

### 방법 1: 메뉴
**파일 → 폴더 열기**

### 방법 2: 드래그 앤 드롭
폴더를 VS Code로 끌어다 놓기

### 방법 3: 터미널
```bash
code C:\Users\내이름\프로젝트폴더
```

---

## 유용한 단축키

| 단축키 | 기능 |
|--------|------|
| Ctrl + ` | 터미널 열기/닫기 |
| Ctrl + B | 사이드바 열기/닫기 |
| Ctrl + P | 파일 빠른 열기 |
| Ctrl + Shift + P | 명령 팔레트 |
| Ctrl + S | 저장 |
| Ctrl + Z | 실행 취소 |
| Ctrl + Shift + Z | 다시 실행 |
| Ctrl + / | 주석 토글 |

---

## 다음 편 예고

2편에서는 **Node.js**를 설치합니다.

Node.js는 JavaScript를 컴퓨터에서 실행할 수 있게 해주는 프로그램이며, Claude Code 설치에 필요합니다.

[2편 보러가기 →](#)

---

## 시리즈 목차

**Part 1: 환경 설정**
- 1편: VS Code 설치 & 기본 설정 ✓ (현재)
- 2편: Node.js & npm 설치
- 3편: Claude Code CLI 설치 & 인증
- 4편: 터미널 기본 사용법

**Part 2: Claude Code 기초**
- 5~8편

**Part 3: bkit 플러그인**
- 9~12편

**Part 4: 실전 프로젝트**
- 13~18편: 근로복지공단 자동화
