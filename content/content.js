/**
 * Content Script - 근로복지공단 사이트에 주입되는 스크립트
 * WebSquare 프레임워크 기반 사이트 자동화
 */

const ComwelAuto = {
  // 초기화
  init() {
    console.log('[근로복지공단 자동화] Content script 로드됨');
    this.setupMessageListener();
    this.checkAutoLogin();
  },

  // 메시지 리스너 설정 (popup/background와 통신)
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('[근로복지공단 자동화] 메시지 수신:', request.action);

      switch (request.action) {
        case 'login':
          this.performLogin(request.data).then(sendResponse);
          return true;

        case 'extractData':
          this.extractPageData(request.dataType).then(sendResponse);
          return true;

        case 'fillForm':
          this.fillFormData(request.data).then(sendResponse);
          return true;

        case 'runBatchTask':
          this.runBatchTask(request.tasks).then(sendResponse);
          return true;

        case 'getPageInfo':
          sendResponse(this.getPageInfo());
          return false;

        // API 직접 호출 기능
        case 'apiQuery':
          this.apiQuery(request.params).then(sendResponse);
          return true;

        case 'apiExcelDownload':
          this.apiExcelDownload(request.params).then(sendResponse);
          return true;

        case 'apiBatchDownload':
          this.apiBatchDownload(request.saeopjangList, request.options).then(sendResponse);
          return true;

        case 'getAuthStatus':
          sendResponse(this.getAuthStatus());
          return false;

        default:
          sendResponse({ success: false, error: '알 수 없는 명령' });
          return false;
      }
    });
  },

  // 자동 로그인 체크
  async checkAutoLogin() {
    const settings = await StorageUtil.getSettings();
    if (settings.autoLogin && this.isLoginPage()) {
      const credentials = await StorageUtil.getCredentials();
      if (credentials) {
        setTimeout(() => this.performLogin(credentials), 1000);
      }
    }
  },

  // 로그인 페이지 확인
  isLoginPage() {
    // WebSquare 로그인 폼 확인
    const loginForm = document.querySelector('input[type="password"]');
    const loginUrl = window.location.href.includes('login');
    return loginForm !== null || loginUrl;
  },

  // 로그인 수행
  async performLogin(credentials) {
    try {
      // WebSquare 입력 필드 찾기 (일반적인 패턴)
      const userIdInput = document.querySelector(
        'input[id*="userId"], input[id*="user_id"], input[id*="loginId"], input[name*="userId"]'
      ) || document.querySelector('input[type="text"]');

      const passwordInput = document.querySelector(
        'input[id*="password"], input[id*="passwd"], input[id*="userPw"], input[name*="password"]'
      ) || document.querySelector('input[type="password"]');

      if (!userIdInput || !passwordInput) {
        return { success: false, error: '로그인 입력 필드를 찾을 수 없습니다.' };
      }

      // 값 입력 (WebSquare 호환)
      this.setInputValue(userIdInput, credentials.userId);
      this.setInputValue(passwordInput, credentials.password);

      // 로그인 버튼 찾기 및 클릭
      const loginBtn = document.querySelector(
        'button[id*="login"], button[id*="Login"], input[type="submit"], button[type="submit"], a[id*="login"]'
      );

      if (loginBtn) {
        await this.delay(300);
        loginBtn.click();
        return { success: true, message: '로그인 시도 완료' };
      } else {
        return { success: false, error: '로그인 버튼을 찾을 수 없습니다.' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // WebSquare 호환 입력값 설정
  setInputValue(element, value) {
    // 일반 입력
    element.value = value;

    // 이벤트 트리거 (WebSquare가 감지할 수 있도록)
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

    // WebSquare 전용 처리
    if (typeof $w !== 'undefined' && $w.getComponentById) {
      try {
        const compId = element.id;
        const comp = $w.getComponentById(compId);
        if (comp && comp.setValue) {
          comp.setValue(value);
        }
      } catch (e) {
        // WebSquare 컴포넌트가 아닌 경우 무시
      }
    }
  },

  // 페이지 데이터 추출
  async extractPageData(dataType) {
    try {
      let data = [];

      switch (dataType) {
        case 'table':
          data = this.extractTableData();
          break;
        case 'form':
          data = this.extractFormData();
          break;
        case 'grid':
          data = this.extractGridData();
          break;
        default:
          data = this.extractAllData();
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 테이블 데이터 추출
  extractTableData() {
    const tables = document.querySelectorAll('table');
    const results = [];

    tables.forEach((table, tableIndex) => {
      const rows = table.querySelectorAll('tr');
      const tableData = [];

      rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        const rowData = [];
        cells.forEach(cell => {
          rowData.push(cell.innerText.trim());
        });
        if (rowData.length > 0) {
          tableData.push(rowData);
        }
      });

      if (tableData.length > 0) {
        results.push({
          tableIndex,
          data: tableData
        });
      }
    });

    return results;
  },

  // 폼 데이터 추출
  extractFormData() {
    const inputs = document.querySelectorAll('input, select, textarea');
    const formData = {};

    inputs.forEach(input => {
      const name = input.name || input.id;
      if (name && input.type !== 'password') {
        formData[name] = input.value;
      }
    });

    return formData;
  },

  // WebSquare Grid 데이터 추출
  extractGridData() {
    const grids = [];

    // WebSquare 그리드 찾기
    if (typeof $w !== 'undefined' && $w.getComponentById) {
      const gridElements = document.querySelectorAll('[id*="grid"], [id*="Grid"]');
      gridElements.forEach(element => {
        try {
          const grid = $w.getComponentById(element.id);
          if (grid && grid.getRowCount) {
            const rowCount = grid.getRowCount();
            const colCount = grid.getColumnCount ? grid.getColumnCount() : 0;
            const gridData = [];

            for (let i = 0; i < rowCount; i++) {
              const rowData = grid.getRowData ? grid.getRowData(i) : {};
              gridData.push(rowData);
            }

            grids.push({
              gridId: element.id,
              data: gridData
            });
          }
        } catch (e) {
          // 그리드가 아닌 경우 무시
        }
      });
    }

    return grids;
  },

  // 모든 데이터 추출
  extractAllData() {
    return {
      tables: this.extractTableData(),
      forms: this.extractFormData(),
      grids: this.extractGridData()
    };
  },

  // 폼 자동 입력
  async fillFormData(data) {
    try {
      let filledCount = 0;

      for (const [fieldName, value] of Object.entries(data)) {
        // 다양한 선택자로 필드 찾기
        const field = document.querySelector(
          `input[name="${fieldName}"], input[id="${fieldName}"], ` +
          `select[name="${fieldName}"], select[id="${fieldName}"], ` +
          `textarea[name="${fieldName}"], textarea[id="${fieldName}"]`
        );

        if (field) {
          this.setInputValue(field, value);
          filledCount++;
          await this.delay(100); // 입력 간 딜레이
        }
      }

      return {
        success: true,
        message: `${filledCount}개 필드 입력 완료`,
        filledCount
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 일괄 작업 실행
  async runBatchTask(tasks) {
    const results = [];
    const settings = await StorageUtil.getSettings();
    const delay = settings.delayBetweenActions || 1000;

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];

      try {
        let result;

        switch (task.type) {
          case 'fill':
            result = await this.fillFormData(task.data);
            break;
          case 'click':
            result = await this.clickElement(task.selector);
            break;
          case 'extract':
            result = await this.extractPageData(task.dataType);
            break;
          case 'wait':
            await this.delay(task.duration || 1000);
            result = { success: true };
            break;
          default:
            result = { success: false, error: '알 수 없는 작업 유형' };
        }

        results.push({ taskIndex: i, ...result });

        // 진행 상황 전송
        chrome.runtime.sendMessage({
          action: 'taskProgress',
          current: i + 1,
          total: tasks.length,
          result
        });

        await this.delay(delay);
      } catch (error) {
        results.push({ taskIndex: i, success: false, error: error.message });
      }
    }

    return { success: true, results };
  },

  // 요소 클릭
  async clickElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.click();
      return { success: true };
    }
    return { success: false, error: '요소를 찾을 수 없습니다.' };
  },

  // 현재 페이지 정보
  getPageInfo() {
    return {
      url: window.location.href,
      title: document.title,
      hasLoginForm: this.isLoginPage(),
      tables: document.querySelectorAll('table').length,
      forms: document.querySelectorAll('form').length,
      inputs: document.querySelectorAll('input').length
    };
  },

  // 지연 함수
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // ==================== API 직접 호출 기능 ====================

  // 인증 상태 확인
  getAuthStatus() {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    const hasToken = !!cookies['access_token'];
    return {
      isLoggedIn: hasToken,
      hasAccessToken: hasToken,
      hasRefreshToken: !!cookies['refresh_token'],
      sessionId: cookies['sid'] || null
    };
  },

  // API 조회 호출
  async apiQuery(params) {
    try {
      if (typeof ComwelAPI === 'undefined') {
        return { success: false, error: 'API Client가 로드되지 않았습니다.' };
      }

      const result = await ComwelAPI.selectGeunrojaGyIryeok(params);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // API 엑셀 다운로드 호출
  async apiExcelDownload(params) {
    try {
      if (typeof ComwelAPI === 'undefined') {
        return { success: false, error: 'API Client가 로드되지 않았습니다.' };
      }

      const result = await ComwelAPI.registExcelDownload(params);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // 일괄 다운로드
  async apiBatchDownload(saeopjangList, options) {
    try {
      if (typeof ComwelAPI === 'undefined') {
        return { success: false, error: 'API Client가 로드되지 않았습니다.' };
      }

      const results = await ComwelAPI.batchProcess(saeopjangList, options);
      return { success: true, results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// 페이지 로드 시 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ComwelAuto.init());
} else {
  ComwelAuto.init();
}
