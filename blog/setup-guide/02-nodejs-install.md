# [Claude Code 완벽 가이드] 2편: Node.js & npm 설치

## 이전 편 요약

1편에서는 VS Code를 설치했습니다. 이번 편에서는 Claude Code 실행에 필요한 **Node.js**를 설치합니다.

---

## Node.js란?

**Node.js**는 JavaScript를 브라우저 밖에서 실행할 수 있게 해주는 런타임입니다.

원래 JavaScript는 웹 브라우저에서만 동작했는데, Node.js 덕분에 컴퓨터에서 직접 실행할 수 있게 되었습니다.

**npm (Node Package Manager)**은 Node.js와 함께 설치되는 패키지 관리자입니다. Claude Code도 npm으로 설치합니다.

---

## Node.js 설치하기

### 1. 다운로드

공식 사이트: 👉 https://nodejs.org/

[스크린샷: Node.js 공식 사이트]

**두 가지 버전이 있습니다:**
- **LTS (Long Term Support)**: 안정 버전 ✅ 권장
- **Current**: 최신 기능 (불안정할 수 있음)

**LTS 버전** 다운로드를 클릭하세요.

### 2. 설치

다운로드된 설치 파일 실행 (node-v*-x64.msi)

[스크린샷: Node.js 설치 마법사]

**설치 옵션:**
- 기본값으로 진행 (Next 계속 클릭)
- ✅ "Add to PATH" 자동 선택됨 (중요!)

### 3. 설치 확인

**VS Code 터미널**을 열고 (Ctrl + `):

```bash
node --version
```

결과 예시:
```
v20.11.0
```

npm도 확인:
```bash
npm --version
```

결과 예시:
```
10.2.4
```

[스크린샷: 버전 확인 결과]

버전 번호가 나오면 설치 성공!

---

## 설치 안 되는 경우

### "node를 찾을 수 없습니다" 에러

**원인**: PATH에 Node.js가 추가되지 않음

**해결 방법 1**: VS Code 재시작
- VS Code를 완전히 종료하고 다시 열기

**해결 방법 2**: 컴퓨터 재시작
- Windows를 재부팅

**해결 방법 3**: 수동으로 PATH 추가
1. Windows 검색 → "환경 변수"
2. "시스템 환경 변수 편집" 클릭
3. "환경 변수" 버튼
4. "Path" 선택 → "편집"
5. 다음 경로 추가:
   - `C:\Program Files\nodejs\`

[스크린샷: 환경 변수 설정]

---

## npm 기본 개념

npm은 **패키지(라이브러리)**를 설치하고 관리하는 도구입니다.

### 전역 설치 vs 로컬 설치

**전역 설치 (-g)**
```bash
npm install -g 패키지이름
```
- 컴퓨터 전체에서 사용 가능
- CLI 도구에 주로 사용
- Claude Code는 전역 설치

**로컬 설치**
```bash
npm install 패키지이름
```
- 현재 프로젝트에서만 사용
- 프로젝트별 라이브러리에 사용

---

## npm 유용한 명령어

| 명령어 | 설명 |
|--------|------|
| `npm install -g 패키지` | 전역 설치 |
| `npm list -g --depth=0` | 전역 설치된 패키지 목록 |
| `npm update -g 패키지` | 패키지 업데이트 |
| `npm uninstall -g 패키지` | 패키지 삭제 |

---

## (선택) nvm 사용하기

**nvm (Node Version Manager)**을 사용하면 여러 버전의 Node.js를 설치하고 전환할 수 있습니다.

### Windows에서 nvm 설치

1. nvm-windows 다운로드: https://github.com/coreybutler/nvm-windows/releases
2. `nvm-setup.exe` 실행
3. 설치 완료 후:

```bash
# 사용 가능한 버전 목록
nvm list available

# 특정 버전 설치
nvm install 20.11.0

# 버전 전환
nvm use 20.11.0

# 현재 버전 확인
node --version
```

**초보자는 nvm 없이 Node.js 직접 설치로 충분합니다!**

---

## 다음 편 예고

3편에서는 드디어 **Claude Code CLI**를 설치합니다!

- npm으로 Claude Code 설치
- Anthropic 계정 인증
- 첫 번째 대화 해보기

[3편 보러가기 →](#)

---

*이전 글: [1편 - VS Code 설치](#)*
*다음 글: [3편 - Claude Code CLI 설치](#)*
