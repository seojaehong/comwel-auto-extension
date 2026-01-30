# [Chrome 확장프로그램] 근로복지공단 업무 자동화 만들기 - 5편: 일괄 처리 & CSV 다운로드

## 이전 편 요약

4편에서는 API를 호출하는 코드를 작성했습니다. 이번 편에서는 여러 사업장을 일괄 처리하고 CSV로 다운로드하는 기능을 구현합니다.

---

## 일괄 처리 구현

### 순차 처리 with 딜레이

서버에 부하를 주지 않기 위해 요청 사이에 **2초 간격**을 둡니다.

```javascript
async function startApiDownload() {
  const saeopjangList = parseSaeopjangList();
  const results = [];

  for (let i = 0; i < saeopjangList.length; i++) {
    if (!isApiRunning) break;  // 중지 버튼 처리

    const saeopjang = saeopjangList[i];

    // 진행률 업데이트
    updateProgress(i + 1, saeopjangList.length, saeopjang.name);

    try {
      // API 호출
      const result = await callAPI(saeopjang);
      results.push({ saeopjang, ...result });
    } catch (error) {
      results.push({ saeopjang, success: false, error: error.message });
    }

    // 다음 요청 전 대기 (마지막 제외)
    if (i < saeopjangList.length - 1) {
      await delay(2000);  // 2초 대기
    }
  }

  displayResults(results);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 진행률 표시

```javascript
function updateProgress(current, total, name) {
  const progressBar = document.getElementById('apiProgressBar');
  const progressText = document.getElementById('apiProgressText');

  const percent = (current / total) * 100;
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${current} / ${total} 완료 (${name})`;
}
```

[스크린샷: 진행률 표시 UI]

---

## CSV 변환 & 다운로드

### 필요한 컬럼만 추출

API 응답에는 50개 이상의 컬럼이 있지만, 실제로 필요한 건 4개뿐:

```javascript
const columnMap = [
  { eng: 'GEUNROJA_NM', kor: '이름' },
  { eng: 'GEUNROJA_RGNO', kor: '주민등록번호' },
  { eng: 'GY_MM_AVG_BOSU_PRC', kor: '월평균보수' },
  { eng: 'GYB_JAGYEOK_CHWIDEUK_DT', kor: '취득일' }
];
```

### 데이터 포맷팅

```javascript
function formatValue(columnName, value) {
  if (!value) return '';

  // 주민등록번호: 8501011234567 → 850101-1234567
  if (columnName === 'GEUNROJA_RGNO' && value.length >= 7) {
    return value.substring(0, 6) + '-' + value.substring(6);
  }

  // 월평균보수: 3500000 → 3,500,000
  if (columnName === 'GY_MM_AVG_BOSU_PRC') {
    return Number(value).toLocaleString('ko-KR');
  }

  // 취득일: 20240101 → 2024-01-01
  if (columnName === 'GYB_JAGYEOK_CHWIDEUK_DT' && value.length === 8) {
    return `${value.substring(0,4)}-${value.substring(4,6)}-${value.substring(6)}`;
  }

  return value;
}
```

### CSV 생성 코드

```javascript
function createCSV(rows, saeopjangName) {
  // 한글 헤더
  const headers = columnMap.map(c => c.kor);

  // BOM 추가 (엑셀에서 한글 깨짐 방지)
  let csvContent = '\uFEFF' + headers.join(',') + '\n';

  rows.forEach(row => {
    const values = columnMap.map(col => {
      let val = row[col.eng] || '';
      val = formatValue(col.eng, val);

      // 쉼표가 포함된 값은 따옴표로 감싸기
      if (String(val).includes(',')) {
        val = `"${val}"`;
      }
      return val;
    });
    csvContent += values.join(',') + '\n';
  });

  return csvContent;
}
```

### 파일 다운로드

```javascript
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
```

---

## 전체 흐름 통합

API 호출 후 바로 CSV 다운로드:

```javascript
function callComwelAPIWithToken(saeopjang, options, tokenMap) {
  // ... API 호출 코드 ...

  return fetch(url, { method: 'POST', headers, body })
    .then(response => response.json())
    .then(data => {
      const rows = data.dsOutList || [];

      if (rows.length > 0) {
        // CSV 생성 및 다운로드
        const csvContent = createCSV(rows, saeopjang.name);
        const filename = `근로자고용정보현황조회_고용_${saeopjang.name}.csv`;
        downloadCSV(csvContent, filename);
      }

      return { success: true, count: rows.length };
    });
}
```

---

## 완성된 CSV 결과

[스크린샷: 다운로드된 CSV 파일]

```csv
이름,주민등록번호,월평균보수,취득일
홍길동,850101-1234567,"3,500,000",2024-01-01
김철수,900215-1234567,"2,800,000",2023-06-15
이영희,880330-2234567,"3,200,000",2022-03-01
```

### Before vs After

| Before (원본) | After (가공) |
|---------------|--------------|
| GEUNROJA_NM | 이름 |
| 8501011234567 | 850101-1234567 |
| 3500000 | 3,500,000 |
| 20240101 | 2024-01-01 |

---

## 결과 표시

```javascript
function displayResults(results) {
  const resultBox = document.getElementById('apiResult');

  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;
  const downloadCount = results.filter(r => r.count > 0).length;

  let html = `
    <p><strong>완료:</strong> ${successCount}건 성공, ${failCount}건 실패</p>
    <p><strong>다운로드:</strong> ${downloadCount}건</p>
    <hr>
  `;

  results.forEach(result => {
    const status = result.success ? '✓' : '✗';
    const color = result.success ? 'green' : 'red';
    const name = result.saeopjang.name;

    html += `<p style="color: ${color};">
      ${status} ${name}
      ${result.success ? `(${result.count}건)` : `- ${result.error}`}
    </p>`;
  });

  resultBox.innerHTML = html;
}
```

[스크린샷: 결과 표시 화면]

```
완료: 12건 성공, 0건 실패
다운로드: 10건 (데이터가 있는 사업장)

✓ 마산 (30건 다운로드됨)
✓ 민락 (27건 다운로드됨)
✓ 발산 (8건 다운로드됨)
✓ 부평 (45건 다운로드됨)
...
```

---

## 사업장 목록 CSV 파일

여러 사업장을 한 번에 처리하려면 CSV 파일로 준비:

```csv
83602013240,50000021821,마산
31951004920,50000021821,민락
38821013400,50000021821,발산
79516010160,50000021821,부평
```

**형식**: `관리번호,사업장ID,사업장명`

파일 업로드하면 자동으로 텍스트박스에 입력됩니다.

---

## 중지 기능

오래 걸리는 작업을 중간에 멈출 수 있습니다:

```javascript
let isApiRunning = false;

document.getElementById('btnStopApiDownload').addEventListener('click', () => {
  isApiRunning = false;
  showStatus('중지되었습니다.', 'info');
});
```

---

## 다음 편 예고

6편(마지막)에서는 에러 처리와 마무리 작업을 다룹니다.

- 401 토큰 만료 처리
- 에러 상황별 안내 메시지
- 확장프로그램 배포 방법
- 전체 소스 코드 정리

[6편 보러가기 →](#)

---

*이전 글: [4편 - API 연동 구현](#)*
*다음 글: [6편 - 에러 처리 & 마무리](#)*
