# [Claude Code 완벽 가이드] 4편: 터미널 기본 사용법

## 이전 편 요약

3편에서는 Claude Code를 설치하고 인증했습니다. 이번 편에서는 터미널 사용의 기초를 알아봅니다.

---

## 터미널이란?

**터미널(Terminal)**은 텍스트 명령어로 컴퓨터를 조작하는 도구입니다.

- Windows: **PowerShell** 또는 **명령 프롬프트(CMD)**
- Mac/Linux: **Terminal** 또는 **Bash**

VS Code에 내장된 터미널을 사용하면 됩니다.

**터미널 열기**: `Ctrl + `` (백틱)

---

## 필수 명령어

### 1. 현재 위치 확인

**Windows (PowerShell):**
```powershell
pwd
```

**결과 예시:**
```
C:\Users\iceam\Documents
```

### 2. 폴더 내용 보기

**Windows:**
```powershell
ls
```
또는
```powershell
dir
```

**결과 예시:**
```
    Directory: C:\Users\iceam\Documents

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d----          2024-01-15    10:30                Projects
-a---          2024-01-15    09:00           1234 readme.txt
```

### 3. 폴더 이동

```powershell
cd 폴더이름
```

**예시:**
```powershell
cd Documents
cd Projects
cd ..          # 상위 폴더로
cd ~           # 홈 폴더로
```

### 4. 폴더 생성

```powershell
mkdir 폴더이름
```

**예시:**
```powershell
mkdir my-project
```

### 5. 파일 내용 보기

```powershell
cat 파일이름
```

**예시:**
```powershell
cat readme.txt
```

---

## 경로 이해하기

### 절대 경로

전체 경로를 다 적는 방식:
```
C:\Users\iceam\Documents\Projects\my-app
```

### 상대 경로

현재 위치 기준:
```
./my-app          # 현재 폴더의 my-app
../other-folder   # 상위 폴더의 other-folder
```

### 특수 경로

| 기호 | 의미 |
|------|------|
| `.` | 현재 폴더 |
| `..` | 상위 폴더 |
| `~` | 홈 폴더 |

---

## VS Code에서 폴더 열기

### 방법 1: 터미널에서

```powershell
cd C:\Users\iceam\Documents\my-project
code .
```

`.`은 현재 폴더를 의미합니다.

### 방법 2: 탐색기에서

1. 폴더에서 우클릭
2. "Code로 열기" 선택

---

## 터미널 단축키

| 단축키 | 기능 |
|--------|------|
| `Tab` | 자동 완성 |
| `↑` / `↓` | 이전 명령어 |
| `Ctrl + C` | 현재 작업 취소 |
| `Ctrl + L` | 화면 지우기 |
| `Ctrl + A` | 줄 처음으로 |
| `Ctrl + E` | 줄 끝으로 |

### Tab 자동 완성

파일이나 폴더 이름을 일부만 입력하고 **Tab** 키를 누르면 자동 완성됩니다.

```powershell
cd Docu[Tab]    # → cd Documents
```

---

## Claude Code와 터미널

Claude Code는 터미널에서 실행됩니다.

### 프로젝트 폴더에서 시작

```powershell
cd C:\Users\iceam\Documents\my-project
claude
```

이렇게 하면 Claude가 해당 프로젝트의 파일들을 볼 수 있습니다.

### Claude에게 명령어 실행 요청

```
You: git status 실행해줘

Claude: [Bash 명령어 실행]
git status
```

Claude가 대신 명령어를 실행해주므로, 터미널 명령어를 다 외울 필요는 없습니다!

---

## 유용한 추가 명령어

### 파일 복사
```powershell
cp 원본 대상
```

### 파일 이동/이름변경
```powershell
mv 원본 대상
```

### 파일/폴더 삭제
```powershell
rm 파일이름
rm -r 폴더이름    # 폴더 삭제
```

### 파일 검색
```powershell
ls -r | findstr "검색어"
```

---

## 다음 편 예고

5편부터는 **Claude Code 기본 명령어**를 본격적으로 배웁니다.

- /help, /clear 등 슬래시 명령어
- 파일 읽기/쓰기 요청 방법
- 효과적인 대화 방법

[5편 보러가기 →](#)

---

*이전 글: [3편 - Claude Code 설치](#)*
*다음 글: [5편 - Claude Code 기본 명령어](#)*
