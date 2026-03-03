// === 사용 시간 추적 ===

let activeYouTubeTabId = null;
let trackingInterval = null;

function getTodayKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isYouTubeUrl(url) {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname;
    return hostname === 'www.youtube.com' || hostname === 'youtube.com' || hostname === 'm.youtube.com';
  } catch {
    return false;
  }
}

async function incrementTime() {
  const key = getTodayKey();
  const result = await chrome.storage.local.get(key);
  const currentSeconds = result[key] || 0;
  await chrome.storage.local.set({ [key]: currentSeconds + 1 });
}

function startTracking() {
  if (trackingInterval) return;
  trackingInterval = setInterval(incrementTime, 1000);
  // Also set an alarm as a fallback to keep service worker alive
  chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 });
}

function stopTracking() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  chrome.alarms.clear('keepAlive');
}

async function checkActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && isYouTubeUrl(tab.url)) {
      activeYouTubeTabId = tab.id;
      startTracking();
    } else {
      activeYouTubeTabId = null;
      stopTracking();
    }
  } catch {
    stopTracking();
  }
}

// 탭 전환 시
chrome.tabs.onActivated.addListener(() => {
  checkActiveTab();
});

// 탭 URL 변경 시
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url || changeInfo.status === 'complete') {
    checkActiveTab();
  }
});

// 윈도우 포커스 변경 시
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    stopTracking();
  } else {
    checkActiveTab();
  }
});

// Alarm handler — re-check tracking state when alarm fires
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    checkActiveTab();
  }
});

// Content script에서 시간 요청 처리
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TODAY_TIME') {
    const key = getTodayKey();
    chrome.storage.local.get(key).then(result => {
      sendResponse({ seconds: result[key] || 0 });
    });
    return true; // async sendResponse
  }
});
