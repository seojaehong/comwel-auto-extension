/**
 * WebSquare $w.alert/$w.confirm 패치
 * MAIN world에서 실행 — page context의 $w 객체에 직접 접근
 */
(function() {
  let attempts = 0;
  const maxAttempts = 60; // 30초 동안 시도
  let fallbackPatched = false;

  function isAutomationActive() {
    if (document.documentElement.hasAttribute('data-comwel-auto')) {
      return true;
    }

    try {
      if (window.top && window.top !== window) {
        const topDoc = window.top.document;
        if (topDoc?.documentElement?.hasAttribute('data-comwel-auto')) {
          return true;
        }
      }
    } catch (e) {
      // cross-frame 접근 불가 시 무시
    }

    try {
      return localStorage.getItem('comwel-auto-active') === 'true';
    } catch (e) {
      return false;
    }
  }

  function patchWindowFallbacks() {
    if (fallbackPatched) return;
    fallbackPatched = true;

    const _origAlert = window.alert;
    window.alert = function(msg) {
      if (isAutomationActive()) {
        console.log('[comwel-ext] window.alert 자동 닫기: ' + msg);
        return;
      }
      return _origAlert.call(window, msg);
    };

    const _origConfirm = window.confirm;
    window.confirm = function(msg) {
      if (isAutomationActive()) {
        console.log('[comwel-ext] window.confirm 자동 true: ' + msg);
        return true;
      }
      return _origConfirm.call(window, msg);
    };

    console.log('[comwel-ext] window.alert/window.confirm fallback 패치 완료');
  }

  function patchWebSquare() {
    attempts++;

    patchWindowFallbacks();

    if (typeof $w === 'undefined' || !$w || !$w.alert) {
      if (attempts < maxAttempts) {
        setTimeout(patchWebSquare, 500);
      } else {
        console.log('[comwel-ext] $w 패치 실패: 30초 대기 초과');
      }
      return;
    }

    // $w.alert 패치
    const _origWAlert = $w.alert;
    $w.alert = function(msg, callback) {
      console.log('[comwel-ext] $w.alert 가로채기: ' + msg);
      if (isAutomationActive()) {
        console.log('[comwel-ext] 자동화 중 → $w.alert 자동 확인');
        if (typeof callback === 'function') callback();
        return;
      }
      return _origWAlert.call($w, msg, callback);
    };

    // $w.confirm 패치
    if ($w.confirm) {
      const _origWConfirm = $w.confirm;
      $w.confirm = function(msg, callback) {
        console.log('[comwel-ext] $w.confirm 가로채기: ' + msg);
        if (isAutomationActive()) {
          console.log('[comwel-ext] 자동화 중 → $w.confirm 자동 true');
          if (typeof callback === 'function') callback(true);
          return;
        }
        return _origWConfirm.call($w, msg, callback);
      };
    }

    console.log('[comwel-ext] WebSquare $w.alert/$w.confirm 패치 완료 (' + attempts + '번째 시도)');
  }

  patchWebSquare();
})();
