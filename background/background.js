/**
 * Background Service Worker - 확장프로그램 백그라운드 로직
 */

// 확장프로그램 설치 시 초기화
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[근로복지공단 자동화] 확장프로그램 설치됨:', details.reason);

  // 기본 설정 초기화
  chrome.storage.local.get('settings', (result) => {
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          autoLogin: false,
          showNotifications: true,
          delayBetweenActions: 1000
        }
      });
    }
  });
});

// 메시지 리스너 (popup과 content script 간 중계)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] 메시지 수신:', request.action);

  switch (request.action) {
    case 'taskProgress':
      // 작업 진행 상황을 popup에 전달
      chrome.runtime.sendMessage(request).catch(() => {
        // popup이 닫혀있으면 무시
      });
      break;

    case 'sendToContent':
      // 현재 활성 탭의 content script에 메시지 전송
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, request.message)
            .then(sendResponse)
            .catch(error => {
              sendResponse({ success: false, error: error.message });
            });
        } else {
          sendResponse({ success: false, error: '활성 탭을 찾을 수 없습니다.' });
        }
      });
      return true;

    case 'openComwelSite':
      // 근로복지공단 사이트 열기
      chrome.tabs.create({ url: 'https://total.comwel.or.kr' });
      sendResponse({ success: true });
      break;

    case 'downloadData':
      // 데이터 다운로드
      downloadAsFile(request.data, request.filename, request.type);
      sendResponse({ success: true });
      break;

    case 'relayAutoUpload':
      // popup → background → content script 중계 (팝업 닫혀도 안전)
      chrome.tabs.sendMessage(request.tabId, request.payload)
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ success: false, message: 'content script 통신 실패: ' + err.message }));
      return true; // async

    case 'downloadExcel':
      // 엑셀 파일 다운로드 (base64 → blob → download)
      downloadExcelFile(request.data, request.filename)
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true; // async
  }
});

// 데이터를 파일로 다운로드
function downloadAsFile(data, filename, type) {
  let content, mimeType;

  switch (type) {
    case 'json':
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      filename = filename || 'data.json';
      break;
    case 'csv':
      content = convertToCSV(data);
      mimeType = 'text/csv';
      filename = filename || 'data.csv';
      break;
    default:
      content = typeof data === 'string' ? data : JSON.stringify(data);
      mimeType = 'text/plain';
      filename = filename || 'data.txt';
  }

  const blob = new Blob(['\uFEFF' + content], { type: mimeType + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  });
}

// 배열 데이터를 CSV로 변환
function convertToCSV(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  // 2차원 배열인 경우
  if (Array.isArray(data[0])) {
    return data.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  // 객체 배열인 경우
  if (typeof data[0] === 'object') {
    const headers = Object.keys(data[0]);
    const rows = data.map(obj =>
      headers.map(header => `"${String(obj[header] || '').replace(/"/g, '""')}"`).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  // 단순 배열인 경우
  return data.join('\n');
}

// 엑셀 파일 다운로드 (base64 입력, MV3 서비스워커 호환 — data URL 사용)
async function downloadExcelFile(base64Data, filename) {
  const dataUrl = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + base64Data;

  return new Promise((resolve, reject) => {
    chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: true,
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(downloadId);
      }
    });
  });
}

// 알림 표시
async function showNotification(title, message) {
  const settings = await chrome.storage.local.get('settings');
  if (settings.settings?.showNotifications !== false) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: title,
      message: message
    });
  }
}
