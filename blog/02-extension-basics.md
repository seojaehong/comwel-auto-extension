# [Chrome 확장프로그램] 근로복지공단 업무 자동화 만들기 - 2편: 기초 구조

## 이전 편 요약

1편에서는 프로젝트의 목적과 전체 구조를 살펴봤습니다. 이번 편에서는 실제로 Chrome 확장프로그램의 기본 뼈대를 만들어봅니다.

---

## Chrome 확장프로그램의 구성 요소

Chrome 확장프로그램은 크게 3가지 영역으로 나뉩니다.

[스크린샷: Chrome 확장프로그램 구조 다이어그램]

### 1. Popup (팝업)
- 확장프로그램 아이콘 클릭 시 나타나는 창
- 사용자와 상호작용하는 UI
- `popup.html`, `popup.js`, `popup.css`

### 2. Content Script (콘텐츠 스크립트)
- 웹 페이지에 주입되는 스크립트
- 페이지의 DOM에 접근 가능
- 페이지의 JavaScript 컨텍스트에서 실행
- `content.js`

### 3. Background (백그라운드)
- 브라우저 뒤에서 항상 실행
- 이벤트 처리, 데이터 관리
- Manifest V3에서는 Service Worker로 동작
- `background.js`

---

## Manifest V3 vs V2

Chrome은 2024년부터 **Manifest V2를 지원 중단**하고 있습니다. 따라서 새로 만드는 확장프로그램은 반드시 **Manifest V3**로 만들어야 합니다.

주요 차이점:

| 항목 | V2 | V3 |
|-----|----|----|
| 백그라운드 | background page | service worker |
| 원격 코드 | 허용 | 금지 |
| API | chrome.* | chrome.* (일부 변경) |

---

## manifest.json 작성

확장프로그램의 설정 파일입니다. 모든 것의 시작점이죠.

```json
{
  "manifest_version": 3,
  "name": "근로복지공단 자동화",
  "version": "1.0.0",
  "description": "근로복지공단 사이트(total.comwel.or.kr) 업무 자동화 확장프로그램",
  "permissions": [
    "storage",
    "activeTab",
    "scripting",
    "cookies"
  ],
  "host_permissions": [
    "https://total.comwel.or.kr/*",
    "https://*.comwel.or.kr/*"
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "background/background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://total.comwel.or.kr/*", "https://*.comwel.or.kr/*"],
      "js": ["utils/storage.js", "content/content.js"],
      "run_at": "document_end"
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### 주요 설정 설명

**permissions** - 필요한 권한들:
- `storage`: 설정 저장
- `activeTab`: 현재 탭 접근
- `scripting`: 스크립트 주입
- `cookies`: 쿠키 읽기 (HttpOnly 포함!)

**host_permissions** - 접근할 사이트:
- 근로복지공단 도메인에만 동작하도록 제한

**content_scripts** - 자동 주입할 스크립트:
- `matches`: 어떤 URL에서 실행할지
- `run_at`: 언제 실행할지 (document_end = 페이지 로드 완료 후)

---

## 팝업 UI 만들기

### popup.html

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>근로복지공단 자동화</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <!-- 헤더 -->
    <header class="header">
      <h1>🏢 근로복지공단 자동화</h1>
      <span class="version">v1.0.0</span>
    </header>

    <!-- 탭 메뉴 -->
    <nav class="tabs">
      <button class="tab active" data-tab="api">API다운로드</button>
      <button class="tab" data-tab="settings">설정</button>
    </nav>

    <!-- API 다운로드 탭 -->
    <section id="api" class="tab-content active">
      <div class="card">
        <h2>사업장 목록</h2>
        <div class="form-group">
          <label>사업장 정보 입력 (한 줄에 하나씩)</label>
          <textarea id="saeopjangList" rows="6"
            placeholder="관리번호,사업장ID,사업장명
83602013240,50000021821,ABC회사
83602013241,50000021822,DEF회사"></textarea>
        </div>
        <div class="form-group">
          <label>또는 CSV 파일 업로드</label>
          <input type="file" id="saeopjangFile" accept=".csv,.txt">
        </div>
      </div>

      <div class="card">
        <h2>일괄 다운로드 실행</h2>
        <div id="apiProgress" class="progress-container" style="display: none;">
          <div class="progress-bar">
            <div class="progress-fill" id="apiProgressBar"></div>
          </div>
          <p class="progress-text" id="apiProgressText">0 / 0 완료</p>
        </div>
        <div class="button-group">
          <button id="btnStartApiDownload" class="btn primary">
            일괄 다운로드 시작
          </button>
          <button id="btnStopApiDownload" class="btn danger" disabled>
            중지
          </button>
        </div>
      </div>

      <div class="card">
        <h2>실행 결과</h2>
        <div id="apiResult" class="result-box">
          <p class="placeholder">결과가 여기에 표시됩니다.</p>
        </div>
      </div>
    </section>
  </div>

  <script src="../utils/storage.js"></script>
  <script src="popup.js"></script>
</body>
</html>
```

[스크린샷: 팝업 UI 완성된 모습]

### popup.css (일부)

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 400px;
  min-height: 500px;
  font-family: 'Malgun Gothic', sans-serif;
  font-size: 14px;
  background: #f5f5f5;
}

.container {
  padding: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header h1 {
  font-size: 18px;
  color: #1a73e8;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn.primary {
  background: #1a73e8;
  color: white;
}

.btn.danger {
  background: #dc3545;
  color: white;
}

.progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #1a73e8;
  transition: width 0.3s;
}
```

---

## 폴더 구조 만들기

최종 폴더 구조:

```
comwel-auto-extension/
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js          (다음 편에서 작성)
├── content/
│   └── content.js        (다음 편에서 작성)
├── background/
│   └── background.js     (기본 틀만)
├── utils/
│   └── storage.js        (저장소 유틸)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 확장프로그램 테스트하기

### 1. Chrome에서 확장프로그램 페이지 열기
주소창에 `chrome://extensions` 입력

### 2. 개발자 모드 켜기
오른쪽 상단의 "개발자 모드" 토글 ON

[스크린샷: 개발자 모드 토글]

### 3. 확장프로그램 로드
"압축해제된 확장 프로그램을 로드합니다" 클릭 → 폴더 선택

[스크린샷: 확장프로그램 로드된 모습]

### 4. 테스트
- 확장프로그램 아이콘 클릭
- 팝업이 정상적으로 표시되는지 확인

---

## 다음 편 예고

3편에서는 근로복지공단 사이트의 API를 분석합니다.

- 개발자 도구 Network 탭 활용법
- API 요청/응답 구조 파악
- 인증 토큰 이해하기

[3편 보러가기 →](#)

---

*이전 글: [1편 - 프로젝트 소개](#)*
*다음 글: [3편 - API 분석 & 리버스 엔지니어링](#)*
