# [Chrome 확장프로그램] 근로복지공단 업무 자동화 만들기 - 3편: API 분석 & 리버스 엔지니어링

## 이전 편 요약

2편에서는 Chrome 확장프로그램의 기본 구조를 만들었습니다. 이번 편에서는 근로복지공단 사이트의 API를 분석하는 방법을 알아봅니다.

---

## 왜 API 분석이 필요한가?

화면을 자동으로 클릭하는 방식(매크로)은 불안정합니다. 사이트 디자인이 조금만 바뀌어도 동작하지 않죠.

반면 **API를 직접 호출**하면:
- 빠르고 안정적
- 화면 로딩 기다릴 필요 없음
- 서버 응답을 직접 가공 가능

---

## 개발자 도구 Network 탭 활용

### 1. 개발자 도구 열기

근로복지공단 사이트에 로그인한 상태에서:
- **F12** 키 또는
- **우클릭 → 검사**

[스크린샷: 개발자 도구 열린 모습]

### 2. Network 탭 선택

상단 탭에서 **Network** 클릭

[스크린샷: Network 탭 선택]

### 3. 필터 설정

- **Fetch/XHR** 필터 선택 (API 요청만 보기)
- **Preserve log** 체크 (페이지 이동해도 로그 유지)

[스크린샷: 필터 설정]

---

## 근로자 조회 API 캡처하기

### 1. 근로자 조회 화면으로 이동

근로복지공단 토탈서비스 → 근로자 고용정보 조회 메뉴

### 2. 조회 버튼 클릭

Network 탭을 보면 새로운 요청이 나타납니다.

[스크린샷: Network 탭에 요청 나타난 모습]

### 3. API 요청 분석

`selectGeunrojaGyIryeok` 요청을 클릭하면 상세 정보가 나옵니다.

[스크린샷: 요청 상세 정보]

---

## 요청 구조 이해하기

### Request URL
```
https://total.comwel.or.kr/api/v1/total/gaip/wl/selectGeunrojaGyIryeok
```

### Request Headers (중요!)

```
authorization: Bearer eyJhbGciOiJSUzI1NiIs...
x-custom-header-ia: 50000021821
x-refresh-token: eyJhbGciOiJIUzUxMiIs...
content-type: application/json;charset=UTF-8
```

**핵심 헤더들:**

| 헤더 | 설명 |
|-----|------|
| `authorization` | Bearer 토큰 (JWT) - 인증용 |
| `x-custom-header-ia` | 사업장 ID |
| `x-refresh-token` | 토큰 갱신용 |

### Request Payload (요청 본문)

```json
{
  "dsInInfo": [{
    "BOHEOM_FG": "3",
    "GWANRI_NO": "83602013240",
    "GY_STATUS_CD": "0",
    "USER_GROUP_FG": "5",
    "ST_SER": "1",
    "ED_SER": 2000,
    ...
  }],
  "session": {
    "MENU_ID": "100110001004",
    ...
  }
}
```

**주요 파라미터:**

| 파라미터 | 의미 | 값 예시 |
|---------|------|--------|
| `BOHEOM_FG` | 보험구분 | 3: 고용보험, 4: 산재보험 |
| `GWANRI_NO` | 관리번호 | 83602013240 |
| `GY_STATUS_CD` | 고용상태 | 0: 고용중, 1: 고용종료 |

---

## 응답 구조 이해하기

### Response 탭 확인

[스크린샷: Response 탭]

```json
{
  "dsOutList": [
    {
      "GEUNROJA_NM": "홍길동",
      "GEUNROJA_RGNO": "8501011234567",
      "GY_MM_AVG_BOSU_PRC": "3500000",
      "GYB_JAGYEOK_CHWIDEUK_DT": "20240101",
      ...
    },
    ...
  ]
}
```

**주의**: 응답은 `dsOutInfo`가 아니라 `dsOutList`입니다!

처음에 `dsOutInfo`로 파싱했다가 데이터가 안 나와서 한참 헤맸습니다 😅

---

## 인증 토큰 이해하기

### JWT (JSON Web Token)

`authorization` 헤더의 Bearer 토큰은 **JWT** 형식입니다.

```
eyJhbGciOiJSUzI1NiIs...
```

이 토큰을 [jwt.io](https://jwt.io)에서 디코딩하면:

```json
{
  "exp": 1769788441,    // 만료 시간
  "iat": 1769784841,    // 발급 시간
  "client_id": "web"
}
```

**토큰 만료 시간**: 약 1시간 (3600초)

만료되면 **401 Unauthorized** 에러가 발생합니다.

### HttpOnly 쿠키 문제

토큰은 쿠키에 저장되어 있는데, **HttpOnly** 속성이 설정되어 있습니다.

```
access_token=eyJ...; HttpOnly
```

**HttpOnly 쿠키**는 JavaScript의 `document.cookie`로 읽을 수 없습니다!

[스크린샷: 쿠키에 HttpOnly 표시된 모습]

이 문제는 4편에서 `chrome.cookies` API로 해결합니다.

---

## 여러 API 엔드포인트 정리

근로복지공단 토탈서비스에서 발견한 API들:

| API | 용도 |
|-----|------|
| `selectGeunrojaGyIryeok` | 근로자 고용정보 조회 |
| `registExcelDownload` | 엑셀 다운로드 등록 |
| `selectSamuGaesiSaeopJangInfo` | 사업장 정보 조회 |
| `selectIljariJeopsuGigan` | 접수기간 조회 |

이 중 실제로 사용할 API는 `selectGeunrojaGyIryeok`입니다.

`registExcelDownload`는 다운로드를 "등록"만 하고 실제 파일을 주지 않아서, 조회 결과를 직접 CSV로 변환하는 방식을 선택했습니다.

---

## API 분석 팁

### 1. 여러 번 요청 비교하기

같은 화면에서 다른 조건으로 조회해보면 어떤 파라미터가 바뀌는지 알 수 있습니다.

### 2. 에러 응답 확인하기

일부러 잘못된 값을 넣어보면 에러 메시지에서 힌트를 얻을 수 있습니다.

### 3. Copy as cURL 활용

요청을 우클릭 → **Copy → Copy as cURL**

[스크린샷: Copy as cURL 메뉴]

복사한 cURL 명령어를 터미널에서 실행하면 API를 테스트할 수 있습니다.

---

## 다음 편 예고

4편에서는 분석한 API를 실제로 호출하는 코드를 작성합니다.

- chrome.cookies API로 토큰 가져오기
- fetch로 API 호출하기
- 응답 데이터 처리하기

[4편 보러가기 →](#)

---

*이전 글: [2편 - Chrome 확장프로그램 기초 구조](#)*
*다음 글: [4편 - API 연동 구현](#)*
