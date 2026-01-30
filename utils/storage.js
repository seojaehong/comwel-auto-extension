/**
 * Storage Utility - 데이터 저장 및 암호화 유틸리티
 */

const StorageUtil = {
  // 간단한 암호화 (Base64 + 문자 치환)
  // 실제 프로덕션에서는 더 강력한 암호화 사용 권장
  encrypt(text) {
    if (!text) return '';
    const encoded = btoa(unescape(encodeURIComponent(text)));
    return encoded.split('').reverse().join('');
  },

  decrypt(encoded) {
    if (!encoded) return '';
    try {
      const reversed = encoded.split('').reverse().join('');
      return decodeURIComponent(escape(atob(reversed)));
    } catch (e) {
      console.error('복호화 오류:', e);
      return '';
    }
  },

  // 로그인 정보 저장
  async saveCredentials(userId, password) {
    const data = {
      userId: this.encrypt(userId),
      password: this.encrypt(password),
      savedAt: Date.now()
    };
    await chrome.storage.local.set({ credentials: data });
    return true;
  },

  // 로그인 정보 불러오기
  async getCredentials() {
    const result = await chrome.storage.local.get('credentials');
    if (!result.credentials) return null;

    return {
      userId: this.decrypt(result.credentials.userId),
      password: this.decrypt(result.credentials.password),
      savedAt: result.credentials.savedAt
    };
  },

  // 로그인 정보 삭제
  async clearCredentials() {
    await chrome.storage.local.remove('credentials');
    return true;
  },

  // 자동입력 데이터 저장
  async saveFormData(formName, data) {
    const key = `form_${formName}`;
    await chrome.storage.local.set({ [key]: data });
    return true;
  },

  // 자동입력 데이터 불러오기
  async getFormData(formName) {
    const key = `form_${formName}`;
    const result = await chrome.storage.local.get(key);
    return result[key] || null;
  },

  // 작업 큐 저장
  async saveTaskQueue(tasks) {
    await chrome.storage.local.set({ taskQueue: tasks });
    return true;
  },

  // 작업 큐 불러오기
  async getTaskQueue() {
    const result = await chrome.storage.local.get('taskQueue');
    return result.taskQueue || [];
  },

  // 작업 큐 비우기
  async clearTaskQueue() {
    await chrome.storage.local.remove('taskQueue');
    return true;
  },

  // 설정 저장
  async saveSettings(settings) {
    await chrome.storage.local.set({ settings });
    return true;
  },

  // 설정 불러오기
  async getSettings() {
    const result = await chrome.storage.local.get('settings');
    return result.settings || {
      autoLogin: false,
      showNotifications: true,
      delayBetweenActions: 1000
    };
  }
};

// Content script와 popup에서 모두 사용 가능하도록 전역 노출
if (typeof window !== 'undefined') {
  window.StorageUtil = StorageUtil;
}
