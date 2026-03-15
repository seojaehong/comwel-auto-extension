/**
 * Popup Script - 확장프로그램 팝업 UI 로직
 */

// 전역 변수
let extractedData = null;
let isBatchRunning = false;
let isApiRunning = false;

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initApiTab();
  initDataTab();
  initBatchTab();
  initUploadTab();
  initSettingsTab();
  loadSavedData();
});

// 탭 초기화
function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // 탭 활성화
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // 콘텐츠 표시
      const tabId = tab.dataset.tab;
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(tabId).classList.add('active');

      // 탭별 초기화
      if (tabId === 'data') {
        refreshPageInfo();
      } else if (tabId === 'api') {
        checkAuthStatus();
      }
    });
  });
}

// ==================== API 다운로드 탭 ====================

function initApiTab() {
  // 사이트 열기
  document.getElementById('btnOpenSite').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://total.comwel.or.kr' });
  });

  // CSV 파일 업로드
  document.getElementById('saeopjangFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('saeopjangList').value = event.target.result;
      showStatus('파일을 불러왔습니다.', 'success');
    };
    reader.readAsText(file);
  });

  // 일괄 다운로드 시작
  document.getElementById('btnStartApiDownload').addEventListener('click', startApiDownload);

  // 중지
  document.getElementById('btnStopApiDownload').addEventListener('click', () => {
    isApiRunning = false;
    updateApiUI(false);
    showStatus('중지되었습니다.', 'info');
  });

  // 초기 인증 상태 확인
  checkAuthStatus();

  // 진행 상황 메시지 수신
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'batchProgress') {
      updateApiProgress(request.current, request.total, request.saeopjang);
    }
  });
}

// 인증 상태 확인
async function checkAuthStatus() {
  const statusBox = document.getElementById('authStatus');

  try {
    const response = await sendToContentScript({ action: 'getAuthStatus' });
    console.log('Auth status:', response);

    if (response && (response.isLoggedIn || response.hasAccessToken)) {
      statusBox.innerHTML = `
        <p style="color: green;">✓ 로그인됨</p>
        <p>세션 ID: ${response.sessionId ? response.sessionId.substring(0, 8) + '...' : '확인됨'}</p>
      `;
    } else {
      statusBox.innerHTML = `
        <p style="color: orange;">⚠ 로그인 상태 확인 필요</p>
        <p>사이트에 로그인되어 있다면 그대로 진행하세요.</p>
      `;
    }
  } catch (error) {
    console.log('Auth check error:', error);
    statusBox.innerHTML = `
      <p style="color: orange;">⚠ 근로복지공단 탭에서 실행하세요</p>
      <p>로그인된 상태라면 그대로 진행 가능합니다.</p>
    `;
  }
}

// 사업장 목록 파싱
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
        name: parts[2] || parts[0]    // 사업장명 (없으면 관리번호 사용)
      });
    }
  }

  return list;
}

// API 일괄 다운로드 시작
async function startApiDownload() {
  const saeopjangList = parseSaeopjangList();

  if (saeopjangList.length === 0) {
    showStatus('사업장 목록을 입력하세요.', 'error');
    return;
  }

  // 옵션 수집
  const options = {
    boheomFg: document.getElementById('boheomFg').value,
    gyStatusCd: document.getElementById('gyStatusCd').value,
    downloadExcel: true,
    delayMs: parseInt(document.getElementById('apiDelay').value) || 2000
  };

  isApiRunning = true;
  updateApiUI(true);

  const resultBox = document.getElementById('apiResult');
  resultBox.innerHTML = '<p>다운로드 시작...</p>';

  try {
    // 현재 탭 확인
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0] || !tabs[0].url.includes('comwel.or.kr')) {
      throw new Error('근로복지공단 사이트 탭에서 실행해주세요.');
    }

    const results = [];

    for (let i = 0; i < saeopjangList.length; i++) {
      if (!isApiRunning) break;

      const saeopjang = saeopjangList[i];
      updateApiProgress(i + 1, saeopjangList.length, saeopjang);
      resultBox.innerHTML = `<p>처리 중: ${saeopjang.name || saeopjang.gwanriNo} (${i + 1}/${saeopjangList.length})</p>`;

      try {
        // chrome.cookies API로 토큰 가져오기
        const cookies = await chrome.cookies.getAll({ domain: 'comwel.or.kr' });
        const tokenMap = {};
        cookies.forEach(c => {
          tokenMap[c.name] = c.value;
        });

        console.log('Cookie names from chrome.cookies:', Object.keys(tokenMap));

        if (!tokenMap['access_token']) {
          results.push({
            saeopjang,
            success: false,
            error: 'access_token을 찾을 수 없습니다. 다시 로그인해주세요.'
          });
          continue;
        }

        // scripting API로 API 호출 실행 (토큰 전달)
        const execResults = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: callComwelAPIWithToken,
          args: [saeopjang, options, tokenMap]
        });

        if (execResults && execResults[0]) {
          const r = execResults[0].result;
          results.push({
            saeopjang,
            success: r.success,
            error: r.error,
            data: { count: r.count, rawResponse: r.rawResponse }
          });
        }
      } catch (err) {
        results.push({
          saeopjang,
          success: false,
          error: err.message
        });
      }

      // 다음 요청 전 대기
      if (i < saeopjangList.length - 1 && isApiRunning) {
        await new Promise(r => setTimeout(r, options.delayMs));
      }
    }

    isApiRunning = false;
    updateApiUI(false);
    displayApiResults(results);
    showStatus('일괄 다운로드 완료!', 'success');

  } catch (error) {
    isApiRunning = false;
    updateApiUI(false);
    resultBox.innerHTML = `<p style="color: red;">오류: ${error.message}</p>`;
    showStatus(error.message, 'error');
  }
}

// 페이지 내에서 API 호출 (토큰을 외부에서 전달받음)
function callComwelAPIWithToken(saeopjang, options, tokenMap) {
  const BASE_URL = 'https://total.comwel.or.kr/api/v1/total/gaip';

  console.log('=== 확장프로그램 API 호출 ===');
  console.log('사업장:', saeopjang.name || saeopjang.gwanriNo);

  const headers = {
    'Content-Type': 'application/json;charset=UTF-8',
    'Accept': 'application/json',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Authorization': `Bearer ${tokenMap.access_token}`,
    'x-refresh-token': tokenMap.refresh_token || '',
    'x-custom-header-ia': saeopjang.saeopjangId,
    'submissionid': 'mf_wfm_content_searchList',
    'xaction': '/api/v1/total/gaip/wl/selectGeunrojaGyIryeok',
    'client_ip': 'null',
    'login_admin_ip': 'undefined'
  };

  const queryPayload = {
    dsInInfo: [{
      BOHEOM_FG: options.boheomFg,
      GWANRI_NO: saeopjang.gwanriNo,
      GEUNROJA_RGNO: '',
      GEUNROJA_NM: '',
      DAMDANGJA_ID: '',
      CHEORI_JISA_CD: '',
      SAEOPJANG_NM: '',
      GY_STATUS_CD: options.gyStatusCd,
      JIYEOKBONBU_GWANHAL: '',
      GY_FROM_DT: '',
      GY_TO_DT: '',
      GY_TO_FROM_DT: '',
      GY_TO_TO_DT: '',
      HYUJIK_FROM_FROM_DT: '',
      HYUJIK_FROM_TO_DT: '',
      HYUJIK_TO_FROM_DT: '',
      HYUJIK_TO_TO_DT: '',
      GEUNROJA_FG: '',
      USER_GROUP_FG: '5',
      SORT_FG: '1A',
      JEONGJEONG_YN: '',
      CHANGE_YN: '',
      SOMYEOL_YN: '',
      GEUNROJA_WONBU_NO: '',
      GS_WONBU_NO: '',
      ST_SER: '1',
      ED_SER: 2000,
      MAX_SER: '0',
      JEONBO_FROM_DT: '',
      JEONBO_TO_DT: '',
      SG_YN: '',
      SAEOPGAESI_NO: '',
      UN_CONFM_SUBSLY_MANAGE_NO: '',
      GY_JOHOE_FROM_DT: '',
      GY_JOHOE_TO_DT: '',
      TEUKSU_JIKJONG_CD: '',
      GYEYAKJIK_YN: '1',
      GYEYAK_END_DT: '1',
      rowStatus: 'C'
    }],
    session: {
      client_ip: null,
      ADMIN_SESSION_VO: null,
      SESSION_VO: null,
      MENU_ID: '100110001004',
      MENU_SER: '99'
    }
  };

  // 1단계: 데이터 조회
  return fetch(`${BASE_URL}/wl/selectGeunrojaGyIryeok`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(queryPayload),
    credentials: 'include'
  })
  .then(response => {
    console.log('API 응답 상태:', response.status);
    if (!response.ok) throw new Error(`조회 API 오류: ${response.status}`);
    return response.json();
  })
  .then(data => {
    // 디버깅: 전체 응답 구조 확인
    console.log('=== API 응답 전체 ===');
    console.log(JSON.stringify(data, null, 2));
    console.log('응답 키:', Object.keys(data));

    // 응답 구조: dsOutList 배열
    let rows = null;
    let count = 0;

    // dsOutList가 배열인 경우 (실제 API 응답 구조)
    if (Array.isArray(data?.dsOutList) && data.dsOutList.length > 0) {
      rows = data.dsOutList;
      count = rows.length;
      console.log('dsOutList에서 데이터 발견, 건수:', count);
    }
    // dsOutInfo도 체크 (다른 API 호환)
    else if (Array.isArray(data?.dsOutInfo) && data.dsOutInfo.length > 0) {
      rows = data.dsOutInfo;
      count = rows.length;
      console.log('dsOutInfo에서 데이터 발견, 건수:', count);
    }

    console.log('최종 데이터 건수:', count);

    if (count === 0 || !rows) {
      return { success: true, data: data, count: 0, message: '데이터 없음', rawResponse: JSON.stringify(data).substring(0, 1000) };
    }

    // 2단계: 조회된 데이터를 직접 엑셀로 변환하여 다운로드
    const boheomType = options.boheomFg === '3' ? '고용' : '산재';
    const fileName = `근로자고용정보현황조회_${boheomType}_${saeopjang.name || saeopjang.gwanriNo}.csv`;

    // 필요한 컬럼만 추출 (영어 → 한글 매핑)
    const columnMap = [
      { eng: 'GEUNROJA_NM', kor: '이름' },
      { eng: 'GEUNROJA_RGNO', kor: '주민등록번호' },
      { eng: 'GY_MM_AVG_BOSU_PRC', kor: '월평균보수' },
      { eng: 'GYB_JAGYEOK_CHWIDEUK_DT', kor: '취득일' }
    ];

    // 데이터를 CSV로 변환 (엑셀에서 열 수 있음)
    // rows는 위에서 이미 파싱됨
    if (rows && rows.length > 0) {
      // 한글 헤더
      const korHeaders = columnMap.map(c => c.kor);

      // CSV 내용 생성 (BOM 추가로 한글 깨짐 방지)
      let csvContent = '\uFEFF' + korHeaders.join(',') + '\n';

      rows.forEach(row => {
        const values = columnMap.map(col => {
          let val = row[col.eng] || '';

          // 주민등록번호 포맷팅 (000000-0000000)
          if (col.eng === 'GEUNROJA_RGNO' && val && val.length >= 7) {
            val = val.substring(0, 6) + '-' + val.substring(6);
          }

          // 월평균보수 쉼표 추가 (1800000 → 1,800,000)
          if (col.eng === 'GY_MM_AVG_BOSU_PRC' && val) {
            val = Number(val).toLocaleString('ko-KR');
          }

          // 취득일 포맷팅 (20250101 → 2025-01-01)
          if (col.eng === 'GYB_JAGYEOK_CHWIDEUK_DT' && val && val.length === 8) {
            val = val.substring(0, 4) + '-' + val.substring(4, 6) + '-' + val.substring(6);
          }

          // 쉼표나 줄바꿈이 있으면 따옴표로 감싸기
          if (String(val).includes(',') || String(val).includes('\n') || String(val).includes('"')) {
            val = '"' + String(val).replace(/"/g, '""') + '"';
          }
          return val;
        });
        csvContent += values.join(',') + '\n';
      });

      // Blob 생성 및 다운로드
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.replace('.xlsx', '.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('CSV 다운로드 완료:', fileName.replace('.xlsx', '.csv'));
    }

    return { success: true, data: data, count: count, downloaded: true };
  })
  .catch(error => {
    console.error('API 오류:', error);
    return { success: false, error: error.message };
  });
}

// API 결과 표시
function displayApiResults(results) {
  const resultBox = document.getElementById('apiResult');

  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;
  const downloadCount = results.filter(r => (r.data?.count ?? 0) > 0).length;

  let html = `<p><strong>완료:</strong> ${successCount}건 성공, ${failCount}건 실패</p>`;
  html += `<p><strong>다운로드:</strong> ${downloadCount}건 (데이터가 있는 사업장)</p>`;
  html += '<hr style="margin: 8px 0;">';

  results.forEach((result, idx) => {
    const status = result.success ? '✓' : '✗';
    const color = result.success ? 'green' : 'red';
    const name = result.saeopjang?.name || result.saeopjang?.gwanriNo || `#${idx + 1}`;
    const count = result.data?.count ?? 0;

    html += `<p style="color: ${color};">${status} ${name}`;
    if (result.success && count > 0) {
      html += ` (${count}건 다운로드됨)`;
    } else if (result.success && count === 0) {
      html += ` (데이터 없음)`;
      // 디버그: 원본 응답 일부 표시
      if (result.data?.rawResponse) {
        html += `</p><pre style="color: gray; font-size: 9px; max-height: 100px; overflow: auto; background: #f5f5f5; padding: 4px;">${result.data.rawResponse}</pre><p>`;
      }
    }
    if (!result.success && result.error) {
      html += ` - ${result.error}`;
    }
    html += '</p>';
  });

  resultBox.innerHTML = html;
}

// API UI 업데이트
function updateApiUI(running) {
  const progressContainer = document.getElementById('apiProgress');
  const startBtn = document.getElementById('btnStartApiDownload');
  const stopBtn = document.getElementById('btnStopApiDownload');

  progressContainer.style.display = running ? 'block' : 'none';
  startBtn.disabled = running;
  stopBtn.disabled = !running;
}

// API 진행률 업데이트
function updateApiProgress(current, total, saeopjang) {
  const progressBar = document.getElementById('apiProgressBar');
  const progressText = document.getElementById('apiProgressText');

  const percent = (current / total) * 100;
  progressBar.style.width = `${percent}%`;

  const name = saeopjang?.name || saeopjang?.gwanriNo || '';
  progressText.textContent = `${current} / ${total} 완료 ${name ? `(${name})` : ''}`;
}

// ==================== 데이터 탭 ====================

function initDataTab() {
  document.getElementById('btnRefreshInfo').addEventListener('click', refreshPageInfo);
  document.getElementById('btnExtractTable').addEventListener('click', () => extractData('table'));
  document.getElementById('btnExtractForm').addEventListener('click', () => extractData('form'));
  document.getElementById('btnExtractAll').addEventListener('click', () => extractData('all'));

  document.getElementById('btnDownloadJson').addEventListener('click', () => {
    if (extractedData) {
      downloadData(extractedData, 'comwel_data.json', 'json');
    }
  });

  document.getElementById('btnDownloadCsv').addEventListener('click', () => {
    if (extractedData) {
      let csvData = extractedData;
      if (extractedData.tables && extractedData.tables.length > 0) {
        csvData = extractedData.tables[0].data;
      }
      downloadData(csvData, 'comwel_data.csv', 'csv');
    }
  });
}

async function refreshPageInfo() {
  const infoBox = document.getElementById('pageInfo');

  try {
    const response = await sendToContentScript({ action: 'getPageInfo' });
    infoBox.innerHTML = `
      <p><strong>URL:</strong> ${response.url || 'N/A'}</p>
      <p><strong>제목:</strong> ${response.title || 'N/A'}</p>
      <p><strong>테이블:</strong> ${response.tables || 0}개</p>
      <p><strong>입력 필드:</strong> ${response.inputs || 0}개</p>
    `;
  } catch (error) {
    infoBox.innerHTML = '<p>근로복지공단 사이트에 접속해주세요.</p>';
  }
}

async function extractData(dataType) {
  const resultBox = document.getElementById('extractResult');
  resultBox.innerHTML = '<p>추출 중...</p>';

  try {
    const response = await sendToContentScript({ action: 'extractData', dataType });

    if (response.success) {
      extractedData = response.data;
      resultBox.textContent = JSON.stringify(response.data, null, 2);
      document.getElementById('btnDownloadJson').disabled = false;
      document.getElementById('btnDownloadCsv').disabled = false;
      showStatus('데이터 추출 완료', 'success');
    } else {
      resultBox.innerHTML = `<p class="placeholder">오류: ${response.error}</p>`;
    }
  } catch (error) {
    resultBox.innerHTML = '<p class="placeholder">근로복지공단 사이트에서만 사용 가능합니다.</p>';
  }
}

// ==================== 일괄작업 탭 ====================

function initBatchTab() {
  document.getElementById('batchFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('batchDataInput').value = event.target.result;
      showStatus('파일을 불러왔습니다.', 'success');
    };
    reader.readAsText(file);
  });

  document.getElementById('btnRunBatch').addEventListener('click', runBatch);

  document.getElementById('btnStopBatch').addEventListener('click', () => {
    isBatchRunning = false;
    updateBatchUI(false);
    showStatus('작업이 중지되었습니다.', 'info');
  });

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'taskProgress') {
      updateBatchProgress(request.current, request.total);
    }
  });
}

async function runBatch() {
  const input = document.getElementById('batchDataInput').value;

  try {
    const tasks = JSON.parse(input);
    if (!Array.isArray(tasks)) {
      showStatus('작업은 배열 형식이어야 합니다.', 'error');
      return;
    }

    isBatchRunning = true;
    updateBatchUI(true);

    const response = await sendToContentScript({ action: 'runBatchTask', tasks });

    isBatchRunning = false;
    updateBatchUI(false);

    if (response.success) {
      document.getElementById('batchResult').textContent = JSON.stringify(response.results, null, 2);
      showStatus('일괄 작업 완료', 'success');
    } else {
      showStatus(response.error, 'error');
    }
  } catch (e) {
    isBatchRunning = false;
    updateBatchUI(false);
    showStatus('올바른 JSON 형식이 아닙니다.', 'error');
  }
}

function updateBatchUI(running) {
  document.getElementById('batchProgress').style.display = running ? 'block' : 'none';
  document.getElementById('btnRunBatch').disabled = running;
  document.getElementById('btnStopBatch').disabled = !running;
}

function updateBatchProgress(current, total) {
  const percent = (current / total) * 100;
  document.querySelector('.progress-fill').style.width = `${percent}%`;
  document.querySelector('.progress-text').textContent = `${current} / ${total} 완료`;
}

// ==================== 설정 탭 ====================

function initSettingsTab() {
  document.getElementById('btnSaveSettings').addEventListener('click', async () => {
    const settings = {
      autoLogin: document.getElementById('settingAutoLogin').checked,
      showNotifications: document.getElementById('settingNotifications').checked,
      delayBetweenActions: parseInt(document.getElementById('settingDelay').value) || 1000
    };

    await StorageUtil.saveSettings(settings);
    showStatus('설정이 저장되었습니다.', 'success');
  });
}

// ==================== 유틸리티 함수 ====================

async function loadSavedData() {
  const settings = await StorageUtil.getSettings();
  document.getElementById('settingAutoLogin').checked = settings.autoLogin;
  document.getElementById('settingNotifications').checked = settings.showNotifications;
  document.getElementById('settingDelay').value = settings.delayBetweenActions;
}

function sendToContentScript(message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs[0]) {
        reject(new Error('활성 탭을 찾을 수 없습니다.'));
        return;
      }

      const tab = tabs[0];

      // URL 확인
      if (!tab.url || !tab.url.includes('comwel.or.kr')) {
        reject(new Error('근로복지공단 사이트가 아닙니다.'));
        return;
      }

      try {
        // 먼저 기존 방식 시도
        const response = await chrome.tabs.sendMessage(tab.id, message);
        resolve(response);
      } catch (error) {
        console.log('Content script 연결 실패, scripting API 사용:', error);

        // scripting API로 직접 실행
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: executeInPage,
            args: [message]
          });

          if (results && results[0]) {
            resolve(results[0].result);
          } else {
            reject(new Error('스크립트 실행 실패'));
          }
        } catch (scriptError) {
          reject(scriptError);
        }
      }
    });
  });
}

// 페이지 내에서 실행될 함수
function executeInPage(message) {
  // 쿠키에서 토큰 가져오기
  function getCookies() {
    return document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
  }

  if (message.action === 'getAuthStatus') {
    const cookies = getCookies();
    return {
      isLoggedIn: !!cookies['access_token'],
      hasAccessToken: !!cookies['access_token'],
      hasRefreshToken: !!cookies['refresh_token'],
      sessionId: cookies['sid'] || null
    };
  }

  if (message.action === 'getPageInfo') {
    return {
      url: window.location.href,
      title: document.title,
      tables: document.querySelectorAll('table').length,
      inputs: document.querySelectorAll('input').length
    };
  }

  return { success: false, error: '알 수 없는 명령' };
}

function downloadData(data, filename, type) {
  let content, mimeType;

  if (type === 'json') {
    content = JSON.stringify(data, null, 2);
    mimeType = 'application/json';
  } else if (type === 'csv') {
    content = convertToCSV(data);
    mimeType = 'text/csv';
  } else {
    content = String(data);
    mimeType = 'text/plain';
  }

  const blob = new Blob(['\uFEFF' + content], { type: mimeType + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

function convertToCSV(data) {
  if (!Array.isArray(data) || data.length === 0) return '';

  if (Array.isArray(data[0])) {
    return data.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  if (typeof data[0] === 'object') {
    const headers = Object.keys(data[0]);
    const rows = data.map(obj =>
      headers.map(h => `"${String(obj[h] || '').replace(/"/g, '""')}"`).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  return data.join('\n');
}

function showStatus(message, type) {
  const statusEl = document.getElementById('statusMessage');
  statusEl.textContent = message;
  statusEl.className = `status-message ${type} show`;

  setTimeout(() => {
    statusEl.classList.remove('show');
  }, 3000);
}

// ==================== 신고 자동업로드 탭 ====================

let uploadFiles = []; // { file: File, name: string, gwanriNo: string, base64: string }
let isUploading = false;

function initUploadTab() {
  // 사업장 DB 초기화
  initBizDb();

  // 파일 선택
  document.getElementById('uploadFiles').addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    uploadFiles = files.map(file => {
      // 파일명에서 사업장명 추출
      // 패턴: 취득신고서_사업장명_월.xlsx 또는 사업장명_취득신고서_성명_월.xlsx
      const nameNoExt = file.name.replace(/\.xlsx?$/i, '');
      let bizName = nameNoExt;
      const parts = nameNoExt.split('_');
      if (parts.length >= 2) {
        // "취득신고서_다이닝원청주점_202601" → 다이닝원청주점
        // "하나멜라민_취득신고서_차상화_202602" → 하나멜라민
        if (parts[0].includes('신고서')) {
          bizName = parts[1] || parts[0];
        } else if (parts[1].includes('신고서')) {
          bizName = parts[0];
        } else {
          bizName = parts[0];
        }
      }
      return { file, name: file.name, bizName, gwanriNo: '', base64: null };
    });

    // 파일 목록 표시
    const listEl = document.getElementById('uploadFileList');
    listEl.textContent = uploadFiles.map((f, i) => `${i + 1}. ${f.name} → ${f.bizName}`).join('\n');

    // 매칭 UI 표시
    showMappingUI();
    showStatus(`${uploadFiles.length}개 파일 선택됨`, 'success');
  });

  // 업로드 시작
  document.getElementById('btnStartUpload').addEventListener('click', startBatchUpload);

  // 중지
  document.getElementById('btnStopUpload').addEventListener('click', () => {
    isUploading = false;
    showStatus('업로드 중지됨', 'info');
  });
}

function showMappingUI() {
  const card = document.getElementById('uploadMappingCard');
  const container = document.getElementById('uploadMappingRows');
  card.style.display = 'block';
  container.innerHTML = '';

  let allMatched = true;

  uploadFiles.forEach((f, i) => {
    // DB에서 자동매칭
    const matched = matchGwanriNo(f.bizName);
    f.gwanriNo = matched;
    if (!matched) allMatched = false;

    const row = document.createElement('div');
    row.className = 'form-row';
    row.style.marginBottom = '8px';
    row.innerHTML = `
      <div class="form-group" style="flex:1">
        <label style="font-size:11px">${f.bizName} ${matched ? '\u2705' : '\u26a0\ufe0f 미등록'}</label>
        <input type="text" class="upload-gwanri" data-idx="${i}"
               placeholder="관리번호 입력" value="${matched}" style="font-size:12px">
      </div>
    `;
    container.appendChild(row);
  });

  // 관리번호 입력 시 DB 자동저장 + 시작 버튼 체크
  container.querySelectorAll('.upload-gwanri').forEach(input => {
    input.addEventListener('input', checkUploadReady);
    input.addEventListener('change', async function() {
      const idx = parseInt(this.dataset.idx);
      const no = this.value.trim();
      if (no && uploadFiles[idx]) {
        bizDb[uploadFiles[idx].bizName] = no;
        await saveBizDb();
        renderBizDbList();
      }
    });
  });

  document.getElementById('btnStartUpload').disabled = !allMatched;
}

function checkUploadReady() {
  const inputs = document.querySelectorAll('.upload-gwanri');
  let allFilled = true;
  inputs.forEach((input, i) => {
    uploadFiles[i].gwanriNo = input.value.trim();
    if (!input.value.trim()) allFilled = false;
  });
  document.getElementById('btnStartUpload').disabled = !allFilled;
}

async function startBatchUpload() {
  if (uploadFiles.length === 0) {
    showStatus('파일을 선택해주세요.', 'error');
    return;
  }

  // 관리번호 최종 수집
  document.querySelectorAll('.upload-gwanri').forEach((input, i) => {
    uploadFiles[i].gwanriNo = input.value.trim();
  });

  const missing = uploadFiles.filter(f => !f.gwanriNo);
  if (missing.length > 0) {
    showStatus(`관리번호 미입력: ${missing.map(f => f.bizName).join(', ')}`, 'error');
    return;
  }

  // 파일을 base64로 변환
  for (const f of uploadFiles) {
    f.base64 = await fileToBase64(f.file);
  }

  const uploadType = document.querySelector('input[name="uploadType"]:checked').value;
  const uploadAction = document.querySelector('input[name="uploadAction"]:checked').value;

  isUploading = true;
  document.getElementById('btnStartUpload').disabled = true;
  document.getElementById('btnStopUpload').disabled = false;
  document.getElementById('uploadProgress').style.display = 'block';

  const results = [];

  for (let i = 0; i < uploadFiles.length; i++) {
    if (!isUploading) break;

    const f = uploadFiles[i];
    updateUploadProgress(i, uploadFiles.length, f.bizName);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url || !tab.url.includes('comwel.or.kr')) {
        results.push({ name: f.bizName, status: 'FAIL', message: '토탈서비스 탭 아님' });
        continue;
      }

      // background를 경유해서 content script에 업로드 명령 전송
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'relayAutoUpload',
          tabId: tab.id,
          payload: {
            action: 'autoUpload',
            gwanriNo: f.gwanriNo,
            fileBase64: f.base64,
            fileName: f.name,
            uploadType: uploadType,
            uploadAction: uploadAction,
          },
        }, (res) => {
          resolve(res || { success: false, message: '응답 없음' });
        });
      });

      results.push({
        name: f.bizName,
        gwanriNo: f.gwanriNo,
        status: response.success ? 'OK' : 'FAIL',
        message: response.message || '',
      });

      // 다음 사업장 전 대기
      if (i < uploadFiles.length - 1 && isUploading) {
        await wait(2000);
      }
    } catch (e) {
      results.push({ name: f.bizName, status: 'ERROR', message: e.message });
    }
  }

  // 결과 표시
  isUploading = false;
  document.getElementById('btnStartUpload').disabled = false;
  document.getElementById('btnStopUpload').disabled = true;
  updateUploadProgress(uploadFiles.length, uploadFiles.length, '완료');

  const resultEl = document.getElementById('uploadResult');
  const ok = results.filter(r => r.status === 'OK').length;
  const fail = results.filter(r => r.status !== 'OK').length;
  resultEl.textContent = `완료: ${ok}건 성공 / ${fail}건 실패\n\n` +
    results.map(r => `${r.status === 'OK' ? '\u2705' : '\u274c'} ${r.name} (${r.gwanriNo}) - ${r.message}`).join('\n');
}

function updateUploadProgress(current, total, label) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  document.getElementById('uploadProgressBar').style.width = pct + '%';
  document.getElementById('uploadProgressText').textContent = `${current} / ${total} - ${label}`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // data:...;base64,XXXXX
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== 사업장 DB (Chrome Storage) ====================

let bizDb = {}; // { 사업장명: 관리번호 }

async function loadBizDb() {
  return new Promise(resolve => {
    chrome.storage.local.get('bizDb', (result) => {
      bizDb = result.bizDb || {};
      resolve(bizDb);
    });
  });
}

async function saveBizDb() {
  return new Promise(resolve => {
    chrome.storage.local.set({ bizDb }, resolve);
  });
}

function renderBizDbList() {
  const el = document.getElementById('bizDbList');
  const entries = Object.entries(bizDb);
  if (entries.length === 0) {
    el.textContent = '저장된 사업장이 없습니다.';
    return;
  }
  el.textContent = entries.map(([name, no]) => `${name} → ${no}`).join('\n');
}

function initBizDb() {
  loadBizDb().then(() => {
    renderBizDbList();
  });

  // 수동 추가
  document.getElementById('btnBizDbAdd').addEventListener('click', async () => {
    const name = document.getElementById('bizDbName').value.trim();
    const no = document.getElementById('bizDbNo').value.trim();
    if (!name || !no) { showStatus('사업장명과 관리번호를 입력하세요.', 'error'); return; }
    bizDb[name] = no;
    await saveBizDb();
    renderBizDbList();
    document.getElementById('bizDbName').value = '';
    document.getElementById('bizDbNo').value = '';
    showStatus(`${name} 저장됨`, 'success');
  });

  // CSV 가져오기
  document.getElementById('btnBizDbImport').addEventListener('click', () => {
    document.getElementById('bizDbImportFile').click();
  });
  document.getElementById('bizDbImportFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const lines = event.target.result.trim().split(/\r?\n/);
      let count = 0;
      lines.forEach(line => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          bizDb[parts[0]] = parts[1];
          count++;
        }
      });
      await saveBizDb();
      renderBizDbList();
      showStatus(`${count}개 사업장 가져옴`, 'success');
    };
    reader.readAsText(file);
  });
}

/**
 * 파일명에서 추출한 사업장명으로 관리번호 자동 매칭
 * 부분 매칭 지원 (DB에 "다이닝원청주점"이 있으면 파일명의 "다이닝원청주점"과 매칭)
 */
function matchGwanriNo(bizName) {
  // 정확히 일치
  if (bizDb[bizName]) return bizDb[bizName];
  // 부분 매칭 (DB 키가 bizName을 포함하거나 bizName이 DB 키를 포함)
  for (const [name, no] of Object.entries(bizDb)) {
    if (name.includes(bizName) || bizName.includes(name)) return no;
  }
  return '';
}
