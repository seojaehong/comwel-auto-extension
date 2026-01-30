/**
 * API Client - 근로복지공단 API 직접 호출
 */

const ComwelAPI = {
  // API 기본 URL
  BASE_URL: 'https://total.comwel.or.kr/api/v1/total/gaip',

  // 현재 페이지에서 인증 토큰 가져오기
  getAuthTokens() {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    return {
      accessToken: cookies['access_token'] || '',
      refreshToken: cookies['refresh_token'] || '',
      sid: cookies['sid'] || '',
      dataBasicKey: cookies['dataBasicKey'] || ''
    };
  },

  // 공통 헤더 생성
  getHeaders(saeopjangId) {
    const tokens = this.getAuthTokens();

    return {
      'Content-Type': 'application/json;charset=UTF-8',
      'Accept': 'application/json',
      'Authorization': `Bearer ${tokens.accessToken}`,
      'x-refresh-token': tokens.refreshToken,
      'x-custom-header-ia': saeopjangId || '',
      'submissionid': 'mf_wfm_content_searchList',
      'xaction': '/api/v1/total/gaip/wl/selectGeunrojaGyIryeok'
    };
  },

  // 근로자 고용정보 조회
  async selectGeunrojaGyIryeok(params) {
    const {
      gwanriNo,           // 관리번호 (사업장)
      saeopjangId,        // 사업장 ID (헤더용)
      boheomFg = '3',     // 보험구분: 3=고용보험
      gyStatusCd = '0',   // 고용상태: 0=고용중, 1=고용종료
      stSer = '1',        // 시작 번호
      edSer = 2000        // 끝 번호
    } = params;

    const payload = {
      dsInInfo: [{
        BOHEOM_FG: boheomFg,
        GWANRI_NO: gwanriNo,
        GEUNROJA_RGNO: '',
        GEUNROJA_NM: '',
        DAMDANGJA_ID: '',
        CHEORI_JISA_CD: '',
        SAEOPJANG_NM: '',
        GY_STATUS_CD: gyStatusCd,
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
        ST_SER: stSer,
        ED_SER: edSer,
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

    const response = await fetch(`${this.BASE_URL}/wl/selectGeunrojaGyIryeok`, {
      method: 'POST',
      headers: this.getHeaders(saeopjangId),
      body: JSON.stringify(payload),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }

    return await response.json();
  },

  // 엑셀 다운로드 요청
  async registExcelDownload(params) {
    const {
      gwanriNo,
      saeopjangId,
      boheomType = '고용',  // 고용 or 산재
      johoeCnt = 30
    } = params;

    const fileName = `근로자고용정보현황조회_${boheomType}_${gwanriNo}.xlsx`;

    const payload = {
      dsInInfo: {
        MENU_ID: '100110001004',
        MENU_URL: '/ui/w/wl/WL0503.xml',
        POPUP_URL: '',
        FILE_NM: fileName,
        JOHOE_CNT: johoeCnt
      },
      session: {
        client_ip: null,
        ADMIN_SESSION_VO: null,
        SESSION_VO: null,
        MENU_ID: '100110001004',
        MENU_SER: '99'
      }
    };

    const headers = this.getHeaders(saeopjangId);
    headers['submissionid'] = 'mf_wfm_content__sbm_excelDownload';
    headers['xaction'] = '/api/v1/total/gaip/wx/registExcelDownload';

    const response = await fetch(`${this.BASE_URL}/wx/registExcelDownload`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`엑셀 다운로드 오류: ${response.status}`);
    }

    return await response.json();
  },

  // 일괄 조회 및 다운로드
  async batchProcess(saeopjangList, options = {}) {
    const {
      boheomFg = '3',      // 3=고용보험
      gyStatusCd = '0',    // 0=고용중
      downloadExcel = true,
      delayMs = 2000       // 요청 간 대기시간
    } = options;

    const results = [];

    for (let i = 0; i < saeopjangList.length; i++) {
      const saeopjang = saeopjangList[i];

      try {
        // 진행 상황 알림
        chrome.runtime.sendMessage({
          action: 'batchProgress',
          current: i + 1,
          total: saeopjangList.length,
          saeopjang: saeopjang
        });

        // 1. 데이터 조회
        const queryResult = await this.selectGeunrojaGyIryeok({
          gwanriNo: saeopjang.gwanriNo,
          saeopjangId: saeopjang.saeopjangId,
          boheomFg,
          gyStatusCd
        });

        // 2. 엑셀 다운로드 (옵션)
        let excelResult = null;
        if (downloadExcel && queryResult) {
          // 조회 건수 확인
          const cnt = queryResult.dsOutInfo?.[0]?.length || 0;
          if (cnt > 0) {
            excelResult = await this.registExcelDownload({
              gwanriNo: saeopjang.gwanriNo,
              saeopjangId: saeopjang.saeopjangId,
              boheomType: boheomFg === '3' ? '고용' : '산재',
              johoeCnt: cnt
            });
          }
        }

        results.push({
          saeopjang,
          success: true,
          queryResult,
          excelResult
        });

      } catch (error) {
        results.push({
          saeopjang,
          success: false,
          error: error.message
        });
      }

      // 요청 간 대기
      if (i < saeopjangList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }
};

// 전역 노출
if (typeof window !== 'undefined') {
  window.ComwelAPI = ComwelAPI;
}
