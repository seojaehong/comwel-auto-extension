# [Chrome 확장프로그램] 근로복지공단 업무 자동화 만들기 - 6편: 에러 처리 & 마무리

## 이전 편 요약

5편에서는 일괄 처리와 CSV 다운로드를 구현했습니다. 이번 마지막 편에서는 에러 처리와 마무리 작업을 다룹니다.

---

## 주요 에러 상황과 해결책

### 1. 401 Unauthorized - 토큰 만료

**증상:**
```
완료: 0건 성공, 13건 실패
✗ 마산 - 조회 API 오류: 401
✗ 민락 - 조회 API 오류: 401
...
```

**원인:** access_token이 만료됨 (유효기간 약 1시간)

**해결:** 근로복지공단 사이트에서 **F5 새로고침** 후 다시 시도

```javascript
// 에러 메시지 표시
if (response.status === 401) {
  throw new Error('토큰이 만료되었습니다. 사이트를 새로고침(F5) 후 다시 시도하세요.');
}
```

### 2. 403 Forbidden - 권한 없음

**원인:**
- 해당 사업장에 접근 권한이 없음
- 또는 사업장ID가 잘못됨

**해결:** 사업장ID 확인

### 3. "데이터 없음" - 조회 결과 없음

**증상:**
```
✓ 마산 (데이터 없음)
```

**원인:**
- 해당 조건(고용보험/고용중)에 해당하는 근로자가 없음
- 또는 관리번호가 잘못됨

**해결:**
- 실제 사이트에서 같은 조건으로 조회해서 확인
- 보험구분(고용/산재)이나 고용상태(고용중/종료) 변경해서 시도

### 4. Content Script 연결 실패

**증상:**
```
오류: 근로복지공단 사이트가 아닙니다.
```

**원인:** 근로복지공단 사이트 탭이 아닌 곳에서 실행

**해결:** 근로복지공단 사이트 탭을 활성화하고 실행

---

## 에러 처리 코드

```javascript
async function startApiDownload() {
  try {
    // 현재 탭 확인
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tabs[0]) {
      throw new Error('활성 탭을 찾을 수 없습니다.');
    }

    if (!tabs[0].url?.includes('comwel.or.kr')) {
      throw new Error('근로복지공단 사이트 탭에서 실행해주세요.');
    }

    // 토큰 확인
    const tokenMap = await getTokens();
    if (!tokenMap.access_token) {
      throw new Error('로그인이 필요합니다. 사이트에서 로그인 후 다시 시도하세요.');
    }

    // API 호출...

  } catch (error) {
    showStatus(error.message, 'error');
    console.error('Error:', error);
  }
}
```

---

## 사용자 경험 개선

### 로딩 상태 표시

```javascript
function updateUI(isRunning) {
  const startBtn = document.getElementById('btnStartApiDownload');
  const stopBtn = document.getElementById('btnStopApiDownload');
  const progress = document.getElementById('apiProgress');

  startBtn.disabled = isRunning;
  stopBtn.disabled = !isRunning;
  progress.style.display = isRunning ? 'block' : 'none';
}
```

### 상태 메시지 (토스트)

```javascript
function showStatus(message, type) {
  const statusEl = document.getElementById('statusMessage');
  statusEl.textContent = message;
  statusEl.className = `status-message ${type} show`;

  setTimeout(() => {
    statusEl.classList.remove('show');
  }, 3000);
}
```

```css
.status-message {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.status-message.show {
  opacity: 1;
}

.status-message.success {
  background: #4caf50;
  color: white;
}

.status-message.error {
  background: #f44336;
  color: white;
}

.status-message.info {
  background: #2196f3;
  color: white;
}
```

[스크린샷: 토스트 메시지 표시]

---

## 전체 프로젝트 구조

```
comwel-auto-extension/
├── manifest.json           # 확장프로그램 설정
├── popup/
│   ├── popup.html          # 팝업 UI
│   ├── popup.css           # 스타일
│   └── popup.js            # 메인 로직 (약 400줄)
├── content/
│   └── content.js          # 페이지 주입 스크립트
├── background/
│   └── background.js       # 백그라운드 서비스
├── utils/
│   └── storage.js          # 저장소 유틸
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── saeopjang_all.csv       # 사업장 목록 예시
└── README.txt              # 사용 설명서
```

---

## 확장프로그램 배포 방법

### 방법 1: 개발자 모드 (개인 사용)

1. `chrome://extensions` 접속
2. "개발자 모드" ON
3. "압축해제된 확장 프로그램을 로드합니다"
4. 폴더 선택

[스크린샷: 확장프로그램 로드]

### 방법 2: CRX 파일 배포 (팀 공유)

1. `chrome://extensions`에서 "확장 프로그램 패키징"
2. 생성된 `.crx` 파일 공유
3. 다른 사람은 드래그&드롭으로 설치

### 방법 3: Chrome 웹 스토어 (공개 배포)

- 개발자 등록 필요 ($5 일회성)
- 심사 과정 있음
- 이 확장프로그램은 특정 사이트용이라 웹 스토어 배포는 권장하지 않음

---

## 사용 가이드

### 1. 설치
1. 확장프로그램 폴더 다운로드
2. Chrome에서 `chrome://extensions` 열기
3. 개발자 모드 ON
4. "압축해제된 확장 프로그램을 로드합니다" → 폴더 선택

### 2. 사용
1. 근로복지공단 토탈서비스에 로그인
2. 확장프로그램 아이콘 클릭
3. 사업장 목록 입력 (또는 CSV 업로드)
   ```
   관리번호,사업장ID,사업장명
   83602013240,50000021821,마산
   ```
4. "일괄 다운로드 시작" 클릭
5. 다운로드 폴더에서 CSV 파일 확인

### 3. 트러블슈팅
- **401 에러**: 사이트 새로고침 후 재시도
- **데이터 없음**: 조회 조건(보험구분/고용상태) 확인
- **작동 안 함**: 근로복지공단 사이트 탭에서 실행 중인지 확인

---

## 향후 개선 계획

1. **취득신고 자동화**
   - 현재는 조회/다운로드만 가능
   - 신고 API 분석 후 추가 예정

2. **상실신고 자동화**
   - 퇴사자 처리 자동화

3. **보수 변경 신고**
   - 연봉 변경 시 일괄 처리

---

## 마치며

이 시리즈에서는 Chrome 확장프로그램으로 근로복지공단 업무를 자동화하는 방법을 알아봤습니다.

### 핵심 기술 정리

| 기술 | 용도 |
|-----|------|
| Manifest V3 | 확장프로그램 구조 |
| chrome.cookies | HttpOnly 쿠키 읽기 |
| chrome.scripting | 페이지 컨텍스트에서 코드 실행 |
| fetch API | 서버 API 호출 |
| Blob/URL.createObjectURL | 파일 다운로드 |

### 배운 점

1. **API 리버스 엔지니어링** - Network 탭으로 요청 분석
2. **인증 처리** - JWT 토큰, HttpOnly 쿠키
3. **Chrome 확장프로그램** - popup, content script, background
4. **사용자 경험** - 진행률 표시, 에러 메시지

---

## 전체 소스 코드

GitHub에서 전체 소스 코드를 확인할 수 있습니다:
- [comwel-auto-extension 저장소](#) (링크 추가 필요)

질문이나 피드백은 댓글로 남겨주세요!

---

*이전 글: [5편 - 일괄 처리 & CSV 다운로드](#)*

---

## 시리즈 전체 목록

1. [프로젝트 소개 & 기획](#)
2. [Chrome 확장프로그램 기초 구조](#)
3. [API 분석 & 리버스 엔지니어링](#)
4. [API 연동 구현](#)
5. [일괄 처리 & CSV 다운로드](#)
6. [에러 처리 & 마무리](#) (현재 글)
