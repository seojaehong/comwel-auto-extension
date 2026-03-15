'use strict';

/**
 * 토탈서비스 엑셀 업로드 화면 자동 이동
 *
 * WebSquare 기반 SPA → URL 변경이 아닌 메뉴 클릭으로 이동
 * v1: 화면 이동까지만 (파일 첨부는 사용자 수동)
 */

const ComwelUploadHelper = {
  // WebSquare 메뉴 셀렉터 (변경 시 여기만 수정)
  SELECTORS: {
    // 좌측 메뉴 트리
    menuTree: '#leftMenu, .lnb_menu, [id*="leftMenu"]',
    // 자격관리 메뉴
    qualificationMenu: '[data-menu-id*="jakyeok"], [title*="자격관리"], .menu-item:has(> span:contains("자격관리"))',
    // 취득신고 하위메뉴
    acquisitionMenu: '[data-menu-id*="chwideuk"], [title*="취득신고"], .sub-menu-item:has(> span:contains("취득신고"))',
    // 상실신고 하위메뉴
    lossMenu: '[data-menu-id*="sangshil"], [title*="상실신고"], .sub-menu-item:has(> span:contains("상실신고"))',
    // 파일업로드 탭
    fileUploadTab: '[data-tab*="file"], [title*="파일업로드"], button:contains("파일업로드"), a:contains("파일업로드")',
    // 엑셀업로드 버튼 (파일 선택)
    fileInput: 'input[type="file"][accept*=".xls"], input[type="file"]',
  },

  /**
   * 취득신고 엑셀 업로드 화면으로 이동
   * @param {string} boheomFg - 보험구분 ('3'=고용, '4'=산재)
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async navigateToAcquisitionUpload(boheomFg) {
    return this._navigateToUpload('acquisition', boheomFg);
  },

  /**
   * 상실신고 엑셀 업로드 화면으로 이동
   * @param {string} boheomFg
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async navigateToLossUpload(boheomFg) {
    return this._navigateToUpload('loss', boheomFg);
  },

  /**
   * 업로드 화면 이동 내부 로직
   */
  async _navigateToUpload(type, boheomFg) {
    try {
      // Step 1: 자격관리 메뉴 클릭
      const qualMenu = await this._findAndClick(this.SELECTORS.qualificationMenu, '자격관리');
      if (!qualMenu.success) {
        // 대안: WebSquare 메뉴 API 직접 호출
        const wsResult = await this._tryWebSquareMenu(type);
        if (wsResult.success) return wsResult;
        return { success: false, message: '자격관리 메뉴를 찾을 수 없습니다. 수동으로 이동해주세요.\n경로: 자격관리 > ' + (type === 'acquisition' ? '취득신고' : '상실신고') + ' > 파일업로드' };
      }

      await this._wait(500);

      // Step 2: 취득/상실 신고 메뉴 클릭
      const subSelector = type === 'acquisition' ? this.SELECTORS.acquisitionMenu : this.SELECTORS.lossMenu;
      const subLabel = type === 'acquisition' ? '취득신고' : '상실신고';
      const subMenu = await this._findAndClick(subSelector, subLabel);
      if (!subMenu.success) {
        return { success: false, message: `${subLabel} 메뉴를 찾을 수 없습니다. 수동으로 이동해주세요.` };
      }

      await this._wait(1000);

      // Step 3: 파일업로드 탭 클릭
      const uploadTab = await this._findAndClick(this.SELECTORS.fileUploadTab, '파일업로드');
      if (!uploadTab.success) {
        return { success: false, message: '파일업로드 탭을 찾을 수 없습니다. 화면에서 직접 "파일업로드" 탭을 클릭해주세요.' };
      }

      await this._wait(500);

      return {
        success: true,
        message: `${subLabel} > 파일업로드 화면으로 이동했습니다. 생성된 엑셀 파일을 선택해주세요.`,
      };
    } catch (error) {
      return {
        success: false,
        message: `화면 이동 중 오류: ${error.message}\n수동 경로: 자격관리 > ${type === 'acquisition' ? '취득신고' : '상실신고'} > 파일업로드`,
      };
    }
  },

  /**
   * WebSquare 메뉴 API로 직접 이동 시도
   */
  async _tryWebSquareMenu(type) {
    try {
      // WebSquare의 $w 또는 메뉴 함수가 있는지 확인
      if (typeof $w !== 'undefined' && $w.executeMenu) {
        const menuId = type === 'acquisition' ? 'menu_chwideuk_file' : 'menu_sangshil_file';
        $w.executeMenu(menuId);
        await this._wait(1000);
        return { success: true, message: 'WebSquare 메뉴 API로 이동했습니다.' };
      }

      // 토탈서비스 내부 메뉴 함수 시도
      if (typeof goMenu === 'function') {
        const menuCode = type === 'acquisition' ? 'TGJS0301' : 'TGJS0401';
        goMenu(menuCode);
        await this._wait(1000);
        return { success: true, message: '내부 메뉴 함수로 이동했습니다.' };
      }

      return { success: false, message: 'WebSquare 메뉴 API를 찾을 수 없습니다.' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  },

  /**
   * DOM 요소 찾아서 클릭
   * @param {string} selectorGroup - 쉼표로 구분된 복수 셀렉터
   * @param {string} label - 로그용 레이블
   * @returns {Promise<{success: boolean}>}
   */
  async _findAndClick(selectorGroup, label) {
    const selectors = selectorGroup.split(',').map(s => s.trim());

    for (const selector of selectors) {
      try {
        // :contains() 의사 클래스는 표준이 아니므로 수동 처리
        if (selector.includes(':contains(')) {
          const match = selector.match(/(.*):contains\("(.+)"\)/);
          if (match) {
            const baseSelector = match[1] || '*';
            const text = match[2];
            const elements = document.querySelectorAll(baseSelector);
            for (const el of elements) {
              if (el.textContent && el.textContent.trim().includes(text)) {
                el.click();
                return { success: true };
              }
            }
          }
          continue;
        }

        // :has() 의사 클래스도 수동 처리
        if (selector.includes(':has(')) {
          continue; // 복잡한 셀렉터는 건너뛰고 다른 셀렉터 시도
        }

        const el = document.querySelector(selector);
        if (el) {
          el.click();
          return { success: true };
        }
      } catch (e) {
        // 셀렉터 파싱 실패 → 다음 시도
      }
    }

    // 최후 수단: 텍스트 기반 검색
    const allElements = document.querySelectorAll('a, button, span, li, div[role="menuitem"]');
    for (const el of allElements) {
      if (el.textContent && el.textContent.trim() === label) {
        el.click();
        return { success: true };
      }
    }

    return { success: false };
  },

  /**
   * 현재 페이지가 업로드 화면인지 확인
   * @returns {boolean}
   */
  isOnUploadPage() {
    const fileInput = document.querySelector(this.SELECTORS.fileInput);
    const pageText = document.body.innerText || '';
    return !!fileInput || pageText.includes('파일업로드') || pageText.includes('엑셀업로드');
  },

  /**
   * 업로드 결과 상태 확인
   * @returns {{ uploaded: boolean, message: string }}
   */
  getUploadStatus() {
    const pageText = document.body.innerText || '';
    if (pageText.includes('처리완료') || pageText.includes('업로드완료')) {
      return { uploaded: true, message: '업로드가 완료되었습니다.' };
    }
    if (pageText.includes('오류') || pageText.includes('실패')) {
      return { uploaded: false, message: '업로드 중 오류가 발생했습니다. 화면을 확인해주세요.' };
    }
    return { uploaded: false, message: '업로드 대기 중' };
  },

  /**
   * 대기 유틸리티
   */
  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};

/**
 * WebSquare confirm/alert 팝업 자동 닫기
 * "확인", "예", "OK" 버튼을 찾아 클릭, 최대 5초 대기
 */
async function dismissPopups(wait) {
  for (let i = 0; i < 10; i++) {
    let dismissed = false;

    // 방법 1: WebSquare confirm/alert 팝업의 "확인"/"예" 버튼 (visible한 것만)
    document.querySelectorAll('button, input[type="button"], span, a').forEach(el => {
      if (dismissed) return;
      const txt = (el.textContent || el.value || '').trim();
      if ((txt === '확인' || txt === '예' || txt === 'OK') && el.offsetParent !== null) {
        // 팝업/모달 안에 있는 버튼인지 확인
        const parent = el.closest('[class*="confirm"], [class*="alert"], [class*="msgbox"], [class*="popup"], [id*="Confirm"], [id*="confirm"], [id*="alert"], [id*="Alert"]');
        if (parent && parent.offsetParent !== null) {
          console.log('[comwel-ext] 팝업 확인 버튼 클릭: id=' + el.id + ' text=' + txt);
          el.click();
          dismissed = true;
        }
      }
    });

    // 방법 2: WebSquare $w.confirm 전역 확인 버튼 (w2popup_confirm)
    if (!dismissed) {
      const wsConfirmBtn = document.querySelector('.w2popup_confirm .w2popup_btn_area button, .w2popup_confirm .w2popup_btn_area span, .w2popup_confirm .w2popup_btn_area a');
      if (wsConfirmBtn && wsConfirmBtn.offsetParent !== null) {
        console.log('[comwel-ext] WebSquare confirm 버튼 클릭');
        wsConfirmBtn.click();
        dismissed = true;
      }
    }

    // 방법 3: 화면에 보이는 모든 "확인" 버튼 중 z-index가 높은 것 (최후 수단)
    if (!dismissed) {
      const allConfirmBtns = [];
      document.querySelectorAll('button, input[type="button"], span').forEach(el => {
        const txt = (el.textContent || el.value || '').trim();
        if ((txt === '확인' || txt === '예') && el.offsetParent !== null) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            allConfirmBtns.push(el);
          }
        }
      });
      // 가장 나중에 나타난 (DOM 순서상 뒤) 확인 버튼 클릭
      if (allConfirmBtns.length > 0) {
        const lastBtn = allConfirmBtns[allConfirmBtns.length - 1];
        // 하단 footer 버튼은 제외 (만족도 조사 확인 등)
        if (!lastBtn.id.includes('footer')) {
          console.log('[comwel-ext] 확인 버튼 강제 클릭: id=' + lastBtn.id);
          lastBtn.click();
          dismissed = true;
        }
      }
    }

    if (!dismissed) break; // 더 이상 팝업 없음
    await wait(500);
  }
}

/**
 * 자동 업로드 실행
 * popup에서 base64 엑셀 + 사업장 관리번호를 받아 전체 흐름 자동 실행
 */
async function executeAutoUpload(msg) {
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    // Step 1: 사업장관리번호 입력
    const gwanriInput = document.getElementById('mf_wfm_content_maeGwanriNo');
    console.log('[comwel-ext] Step1 - gwanriInput:', !!gwanriInput);
    if (!gwanriInput) return { success: false, message: '취득/상실 신고 화면이 아닙니다. 먼저 취득신고 메뉴로 이동하세요.' };

    gwanriInput.value = msg.gwanriNo;
    gwanriInput.dispatchEvent(new Event('change', { bubbles: true }));
    gwanriInput.dispatchEvent(new Event('input', { bubbles: true }));

    // Step 2: 사업장 조회 (돋보기 클릭 → 팝업에서 "조회" → "선택" 클릭)
    // 취득: btnSaeopjangSearch / 상실: btnGybSaeopjangSearch
    const searchBtn = document.getElementById('mf_wfm_content_btnSaeopjangSearch')
      || document.getElementById('mf_wfm_content_btnGybSaeopjangSearch');
    if (searchBtn) {
      searchBtn.click();
      console.log('[comwel-ext] Step2 - 사업장 조회 팝업 열기');
      await wait(2000);

      // 팝업 내 "조회" 버튼 클릭 (관리번호가 자동 입력됨)
      const popSearchBtn = document.getElementById('mf_wfm_content_WZ0101_P06_wframe_btnSearch');
      if (popSearchBtn) {
        popSearchBtn.click();
        console.log('[comwel-ext] Step2 - 팝업 조회 버튼 클릭');
        await wait(2000);
      }

      // "선택" 버튼 클릭 (첫 번째 행)
      let selected = false;
      for (let attempt = 0; attempt < 10; attempt++) {
        // 정확한 ID: 그리드 첫 행 선택 버튼
        const selectBtn = document.getElementById('mf_wfm_content_WZ0101_P06_wframe_grdSamuSaeopjangInfo_button_0_0');
        if (selectBtn) {
          selectBtn.click();
          selected = true;
          console.log('[comwel-ext] Step2 - 사업장 선택 완료');
          break;
        }
        // 폴백: "선택" 텍스트 버튼 찾기
        const fallbackBtns = document.querySelectorAll('[id*="WZ0101_P06"] button, [id*="SamuSaeopjang"] button');
        for (const btn of fallbackBtns) {
          if (btn.textContent.trim() === '선택') {
            btn.click();
            selected = true;
            console.log('[comwel-ext] Step2 - 사업장 선택 (폴백)');
            break;
          }
        }
        if (selected) break;
        await wait(500);
      }

      if (!selected) {
        console.log('[comwel-ext] Step2 - 사업장 선택 실패, 수동 선택 필요');
      }

      await wait(3000); // 사업장 정보 로드 대기 (체크박스 활성화까지)
    }

    // Step 3: 보험구분 체크 (고용+산재+국민연금+건강보험 전체)
    // 취득: chkNpsyn, chkNhicyn / 상실: chkNpsbyn, chkNhicbyn
    console.log('[comwel-ext] Step3 - 보험구분 체크');
    const checkboxIds = [
      'chkGybyn_input_0', 'chkSjbyn_input_0',
      'chkNpsyn_input_0', 'chkNhicyn_input_0',     // 취득
      'chkNpsbyn_input_0', 'chkNhicbyn_input_0',   // 상실
    ];
    checkboxIds.forEach(id => {
      const cb = document.getElementById('mf_wfm_content_' + id);
      if (cb) {
        console.log('[comwel-ext] 체크박스', id, ':', cb.checked);
        if (!cb.checked) cb.click();
      }
    });
    await wait(500);

    // Step 4: "엑셀파일 불러오기" 라디오 선택
    // 취득: Radio00_input_1 / 상실: rdoSingofg_input_1
    const radioExcel = document.getElementById('mf_wfm_content_Radio00_input_1')
      || document.getElementById('mf_wfm_content_rdoSingofg_input_1');
    if (radioExcel && !radioExcel.checked) {
      radioExcel.click();
      console.log('[comwel-ext] Step4 - 엑셀파일 불러오기 라디오 선택');
      await wait(1000);
    }

    // Step 4b: 모달 열기
    const excelBtn = document.getElementById('mf_wfm_content_btnExcelIlban');
    if (!excelBtn) {
      const excelBtnFallback = document.getElementById('mf_wfm_content_btnEXCEL');
      if (!excelBtnFallback) return { success: false, message: '엑셀파일 불러오기 버튼을 찾을 수 없습니다.' };
      excelBtnFallback.click();
      console.log('[comwel-ext] Step4 - btnEXCEL 폴백 클릭');
    } else {
      excelBtn.click();
      console.log('[comwel-ext] Step4 - btnExcelIlban 클릭 (모달 열기)');
    }

    // Step 5: 모달 내 file input 대기 (최대 10초)
    let fileInput = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      await wait(500);
      fileInput = document.getElementById('mf_wfm_content_grdMokrokExcel_excelPop_wframe_filename');
      if (fileInput) break;
      if (!fileInput) fileInput = document.querySelector('input[type="file"][name="filename"]');
      if (!fileInput) fileInput = document.querySelector('[id*="excelPop"] input[type="file"]');
      if (fileInput) break;
      console.log('[comwel-ext] 모달 file input 대기 중... attempt=' + (attempt + 1));
    }
    if (!fileInput) return { success: false, message: '파일 업로드 모달을 찾을 수 없습니다. (10초 대기 초과)' };

    const binary = atob(msg.fileBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const file = new File([bytes], msg.fileName, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    await wait(500);

    // Step 6: "파일 업로드" 버튼 클릭
    let uploadBtn = document.getElementById('mf_wfm_content_grdMokrokExcel_excelPop_wframe_sendFILE');
    if (!uploadBtn) {
      document.querySelectorAll('button, input[type="button"], a, span').forEach(el => {
        const txt = (el.textContent || el.value || '').trim();
        if (txt === '파일 업로드' || txt === '파일업로드') uploadBtn = el;
      });
    }

    if (uploadBtn) {
      uploadBtn.click();
      console.log('[comwel-ext] Step6 - 파일 업로드 클릭');
      await wait(3000);
      await dismissPopups(wait);
    } else {
      return { success: false, message: '파일 업로드 버튼을 찾을 수 없습니다.' };
    }

    // Step 7: 순차 실행 (임시저장 → 신고자료검증 → 접수)
    // uploadAction: 'temp' = 임시저장만, 'verify' = 임시저장+검증, 'submit' = 임시저장+검증+접수
    const steps = [];
    if (msg.uploadAction === 'temp' || msg.uploadAction === 'verify' || msg.uploadAction === 'submit') {
      steps.push({ label: '임시저장', find: () => document.getElementById('mf_wfm_content_btnImsiSave') || document.getElementById('mf_wfm_content_wq_uuid_1483') });
    }
    if (msg.uploadAction === 'verify' || msg.uploadAction === 'submit') {
      steps.push({ label: '신고자료 검증', find: () => {
        let btn = null;
        document.querySelectorAll('input[type="button"]').forEach(el => {
          if ((el.value || '').trim() === '신고자료 검증') btn = el;
        });
        return btn;
      }});
    }
    if (msg.uploadAction === 'submit') {
      // 취득: btnJeopsu1 / 상실: btnJeopsu
      steps.push({ label: '접수', find: () => document.getElementById('mf_wfm_content_btnJeopsu1') || document.getElementById('mf_wfm_content_btnJeopsu') });
    }

    for (const step of steps) {
      await wait(2000);

      // WebSquare confirm/alert 팝업 자동 닫기 (최대 5초)
      await dismissPopups(wait);

      const actionBtn = step.find();
      if (actionBtn) {
        console.log('[comwel-ext] Step7 - ' + step.label + ' 버튼 클릭, id=' + actionBtn.id);
        actionBtn.click();
        await wait(1500);

        // 클릭 후 나타나는 confirm 팝업 자동 처리 (최대 5초)
        await dismissPopups(wait);
      } else {
        return { success: true, message: `${msg.gwanriNo} ${step.label} 버튼 미발견 - 수동 처리 필요` };
      }
    }

    const finalLabel = steps.length > 0 ? steps[steps.length - 1].label : '엑셀 업로드';
    return { success: true, message: `${msg.gwanriNo} ${finalLabel} 완료` };
  } catch (e) {
    return { success: false, message: '자동 업로드 오류: ' + e.message };
  }
}

// 메시지 리스너 등록 (popup에서 호출)
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'navigateToUpload') {
      const fn = msg.type === 'acquisition'
        ? ComwelUploadHelper.navigateToAcquisitionUpload.bind(ComwelUploadHelper)
        : ComwelUploadHelper.navigateToLossUpload.bind(ComwelUploadHelper);
      fn(msg.boheomFg).then(result => sendResponse(result));
      return true; // async response
    }
    if (msg.action === 'checkUploadPage') {
      sendResponse({
        isOnUploadPage: ComwelUploadHelper.isOnUploadPage(),
        status: ComwelUploadHelper.getUploadStatus(),
      });
    }
    if (msg.action === 'resetPage') {
      // 배치 처리: 다음 사업장을 위해 페이지 리셋
      const menuCode = msg.menuCode || '10501';
      console.log('[comwel-ext] resetPage: 메뉴 ' + menuCode + ' 클릭');

      // 정확한 좌측 메뉴 ID로 클릭
      const menuIds = {
        '10501': 'mf_gen_firstGenerator_side_3_gen_SecondGenerator_side_0_subtitle',
        '10502': 'mf_gen_firstGenerator_side_3_gen_SecondGenerator_side_1_subtitle',
      };

      let menuLink = document.getElementById(menuIds[menuCode]);

      // 폴백: 텍스트로 찾기
      if (!menuLink) {
        document.querySelectorAll('a').forEach(a => {
          if (a.textContent.trim().includes(menuCode) && a.offsetParent !== null) {
            menuLink = a;
          }
        });
      }

      if (menuLink) {
        menuLink.click();
        console.log('[comwel-ext] resetPage: 메뉴 클릭 완료, id=' + menuLink.id);
      } else {
        console.log('[comwel-ext] resetPage: 메뉴 미발견, 페이지 새로고침');
        location.reload();
      }
      sendResponse({ success: true });
      return;
    }
    if (msg.action === 'autoUpload') {
      console.log('[comwel-ext] autoUpload 요청 수신:', msg.gwanriNo, msg.fileName);
      executeAutoUpload(msg).then(result => {
        console.log('[comwel-ext] autoUpload 결과:', JSON.stringify(result));
        sendResponse(result);
      }).catch(err => {
        console.error('[comwel-ext] autoUpload 오류:', err);
        sendResponse({ success: false, message: 'content script 오류: ' + err.message });
      });
      return true; // async response
    }
  });
}
