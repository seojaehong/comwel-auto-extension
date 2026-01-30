# [Chrome 확장프로그램] 근로복지공단 업무 자동화 만들기 - 4편: API 연동 구현

## 이전 편 요약

3편에서는 개발자 도구로 API를 분석했습니다. 이번 편에서는 실제로 API를 호출하는 코드를 작성합니다.

---

## 핵심 과제: HttpOnly 쿠키 읽기

3편에서 언급했듯이, 인증 토큰(access_token)은 **HttpOnly 쿠키**에 저장되어 있습니다.

```javascript
// 이 방법은 동작하지 않음!
const token = document.cookie; // HttpOnly 쿠키는 안 읽힘
```

### 해결책: chrome.cookies API

Chrome 확장프로그램은 `chrome.cookies` API로 HttpOnly 쿠키도 읽을 수 있습니다!

```javascript
// manifest.json에 권한 추가 필요
"permissions": ["cookies"]
"host_permissions": ["https://*.comwel.or.kr/*"]
```

```javascript
// 쿠키 읽기
const cookies = await chrome.cookies.getAll({ domain: 'comwel.or.kr' });
const tokenMap = {};
cookies.forEach(c => {
  tokenMap[c.name] = c.value;
});

console.log(tokenMap['access_token']); // JWT 토큰!
```

---

## popup.js 핵심 코드

### 1. 사업장 목록 파싱

CSV 형식의 입력을 파싱합니다:
```
관리번호,사업장ID,사업장명
83602013240,50000021821,마산
```

```javascript
function parseSaeopjangList() {
  const text = document.getElementById('saeopjangList').value.trim();
  if (!text) return [];

  const lines = text.split('\n').filter(line => line.trim());
  const list = [];

  for (const line of lines) {
    const parts = line.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      list.push({
        gwanriNo: parts[0],           // 관리번호
        saeopjangId: parts[1],        // 사업장 ID
        name: parts[2] || parts[0]    // 사업장명
      });
    }
  }

  return list;
}
```

### 2. 토큰 가져오기

```javascript
async function getTokens() {
  const cookies = await chrome.cookies.getAll({ domain: 'comwel.or.kr' });
  const tokenMap = {};
  cookies.forEach(c => {
    tokenMap[c.name] = c.value;
  });

  if (!tokenMap['access_token']) {
    throw new Error('access_token을 찾을 수 없습니다. 다시 로그인해주세요.');
  }

  return tokenMap;
}
```

### 3. API 호출 함수

페이지 컨텍스트에서 실행해야 하므로 `chrome.scripting.executeScript`를 사용합니다:

```javascript
async function startApiDownload() {
  const saeopjangList = parseSaeopjangList();
  if (saeopjangList.length === 0) {
    showStatus('사업장 목록을 입력하세요.', 'error');
    return;
  }

  // 현재 탭 확인
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs[0]?.url?.includes('comwel.or.kr')) {
    throw new Error('근로복지공단 사이트 탭에서 실행해주세요.');
  }

  // 토큰 가져오기
  const tokenMap = await getTokens();

  // 각 사업장별로 API 호출
  for (const saeopjang of saeopjangList) {
    const result = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: callComwelAPI,  // 아래에서 정의
      args: [saeopjang, options, tokenMap]
    });

    // 결과 처리...
  }
}
```

---

## API 호출 함수 상세

페이지 내에서 실행될 함수입니다:

```javascript
function callComwelAPI(saeopjang, options, tokenMap) {
  const BASE_URL = 'https://total.comwel.or.kr/api/v1/total/gaip';

  // 헤더 구성
  const headers = {
    'Content-Type': 'application/json;charset=UTF-8',
    'Accept': 'application/json',
    'Authorization': `Bearer ${tokenMap.access_token}`,
    'x-refresh-token': tokenMap.refresh_token || '',
    'x-custom-header-ia': saeopjang.saeopjangId,  // 사업장 ID!
  };

  // 요청 본문
  const payload = {
    dsInInfo: [{
      BOHEOM_FG: options.boheomFg,      // 3: 고용보험
      GWANRI_NO: saeopjang.gwanriNo,    // 관리번호
      GY_STATUS_CD: options.gyStatusCd, // 0: 고용중
      USER_GROUP_FG: '5',
      ST_SER: '1',
      ED_SER: 2000,
      // ... 기타 파라미터
    }],
    session: {
      MENU_ID: '100110001004',
      MENU_SER: '99'
    }
  };

  // API 호출
  return fetch(`${BASE_URL}/wl/selectGeunrojaGyIryeok`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
    credentials: 'include'
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    // 응답 구조: { dsOutList: [...] }
    const rows = data.dsOutList || [];
    return { success: true, data: rows, count: rows.length };
  })
  .catch(error => {
    return { success: false, error: error.message };
  });
}
```

---

## 응답 데이터 구조

API 응답 예시:

```json
{
  "dsOutList": [
    {
      "GEUNROJA_NM": "홍길동",
      "GEUNROJA_RGNO": "8501011234567",
      "GY_MM_AVG_BOSU_PRC": "3500000",
      "GYB_JAGYEOK_CHWIDEUK_DT": "20240101",
      "GY_STATUS_NM": "고용",
      "GY_JIKJONG_NM": "사무원"
    },
    // ... 더 많은 근로자 데이터
  ]
}
```

### 주의! dsOutInfo vs dsOutList

처음에 `dsOutInfo`로 파싱했다가 데이터가 계속 비어있었습니다.

```javascript
// 틀린 코드
const rows = data.dsOutInfo?.[0];  // undefined!

// 맞는 코드
const rows = data.dsOutList;  // 데이터 배열!
```

API 분석할 때 **응답 구조를 정확히** 확인하는 게 중요합니다.

---

## 디버깅 팁

### 1. Console 로그 활용

```javascript
console.log('=== API 응답 ===');
console.log(JSON.stringify(data, null, 2));
console.log('응답 키:', Object.keys(data));
```

[스크린샷: Console에 출력된 API 응답]

### 2. 401 에러 = 토큰 만료

```
API 오류: 401
```

이 에러가 나면 토큰이 만료된 것입니다.
- 근로복지공단 사이트에서 **새로고침(F5)**
- 다시 시도

### 3. Network 탭에서 요청 확인

확장프로그램에서 보낸 요청도 Network 탭에서 확인할 수 있습니다.

[스크린샷: Network 탭에서 확장프로그램 요청 확인]

---

## 전체 흐름 정리

```
1. 사용자가 사업장 목록 입력
2. "다운로드 시작" 버튼 클릭
3. chrome.cookies.getAll()로 토큰 가져오기
4. 각 사업장마다:
   a. chrome.scripting.executeScript()로 API 호출
   b. 응답 데이터 받기
   c. 다음 사업장으로 (2초 대기)
5. 결과 표시
```

---

## 다음 편 예고

5편에서는 여러 사업장을 일괄 처리하고 CSV로 다운로드하는 기능을 구현합니다.

- 일괄 처리 루프
- 진행률 표시
- CSV 변환 및 다운로드
- 한글 헤더 & 데이터 포맷팅

[5편 보러가기 →](#)

---

*이전 글: [3편 - API 분석 & 리버스 엔지니어링](#)*
*다음 글: [5편 - 일괄 처리 & CSV 다운로드](#)*
