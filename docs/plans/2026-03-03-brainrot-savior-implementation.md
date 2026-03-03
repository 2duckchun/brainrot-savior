# Brainrot Savior Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** YouTube Shorts 차단, 5초 건너뛰기(→) 차단, 사용 시간 추적 기능을 제공하는 Chrome 익스텐션을 만든다.

**Architecture:** Manifest V3 기반 Chrome 익스텐션. Content script(content.js + content.css)가 YouTube 페이지에 주입되어 Shorts 숨김, 키 차단, 시간 배지를 처리한다. Background service worker(background.js)가 탭 활성 감지 및 시간 카운트를 담당한다. 팝업(popup.html/js/css)이 사용 시간 대시보드를 보여준다.

**Tech Stack:** Manifest V3, Vanilla JS, chrome.storage.local, 빌드 도구 없음

**Testing note:** Chrome 익스텐션은 브라우저 환경에서만 동작하므로, 각 태스크의 검증은 `chrome://extensions`에서 언팩 익스텐션 로드 후 수동 테스트로 진행한다.

---

### Task 1: Project Scaffolding — manifest.json + 아이콘 + 빈 파일

**Files:**
- Create: `manifest.json`
- Create: `content.js`
- Create: `content.css`
- Create: `background.js`
- Create: `popup.html`
- Create: `popup.js`
- Create: `popup.css`
- Create: `icons/icon16.png`
- Create: `icons/icon48.png`
- Create: `icons/icon128.png`

**Step 1: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Brainrot Savior",
  "version": "1.0.0",
  "description": "YouTube 사용 습관을 개선합니다. Shorts 차단, 건너뛰기 차단, 사용 시간 추적.",
  "permissions": ["storage", "tabs", "activeTab"],
  "host_permissions": ["*://*.youtube.com/*"],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["*://*.youtube.com/*"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_start"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

**Step 2: Create placeholder icons**

Generate simple colored SVG-based PNG placeholder icons (16x16, 48x48, 128x128). These can be replaced with proper icons later. Use a simple canvas-based script or any approach to create valid PNG files.

**Step 3: Create empty source files**

Create empty `content.js`, `content.css`, `background.js`, `popup.html`, `popup.js`, `popup.css` files with minimal boilerplate:

`popup.html`:
```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div id="app">
    <h1>Brainrot Savior</h1>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

`content.js`, `background.js`, `popup.js`: empty files with a single comment `// Brainrot Savior`

`content.css`, `popup.css`: empty files

**Step 4: Verify — load unpacked extension**

1. Open `chrome://extensions`
2. Enable Developer Mode
3. Click "Load unpacked" → select the `brainrot-savior` project directory
4. Expected: Extension loads without errors, icon appears in toolbar, clicking icon shows popup with "Brainrot Savior" heading

**Step 5: Commit**

```bash
git add manifest.json content.js content.css background.js popup.html popup.js popup.css icons/
git commit -m "feat: scaffold Chrome extension with Manifest V3"
```

---

### Task 2: YouTube Shorts CSS Hiding

**Files:**
- Modify: `content.css`

**Step 1: Add CSS rules to hide Shorts elements**

```css
/* === Shorts 차단 === */

/* 홈 피드의 Shorts 셸프 */
ytd-rich-shelf-renderer[is-shorts],
ytd-reel-shelf-renderer {
  display: none !important;
}

/* 사이드바의 Shorts 탭 */
ytd-mini-guide-entry-renderer a[title="Shorts"],
ytd-guide-entry-renderer a[title="Shorts"] {
  display: none !important;
}

/* 탐색/검색 결과의 Shorts */
ytd-video-renderer [overlay-style="SHORTS"],
ytd-grid-video-renderer [overlay-style="SHORTS"],
ytd-rich-item-renderer [overlay-style="SHORTS"] {
  display: none !important;
}

/* Shorts 탭 자체 (모바일 웹 대응 포함) */
ytd-pivot-bar-item-renderer a[href="/shorts"],
a[title="Shorts"][href="/shorts"] {
  display: none !important;
}
```

**Step 2: Verify — Shorts elements hidden**

1. Reload extension in `chrome://extensions`
2. Navigate to `youtube.com`
3. Expected: Shorts 셸프가 홈 피드에서 보이지 않음, 사이드바에서 Shorts 탭이 보이지 않음

**Step 3: Commit**

```bash
git add content.css
git commit -m "feat: hide YouTube Shorts elements via CSS"
```

---

### Task 3: Shorts URL Redirect

**Files:**
- Modify: `content.js`

**Step 1: Add Shorts URL redirect logic**

```javascript
// === Shorts URL 리다이렉트 ===
function redirectShortsToWatch() {
  const url = window.location.href;
  const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) {
    const videoId = shortsMatch[1];
    window.location.replace(`https://www.youtube.com/watch?v=${videoId}`);
  }
}

// 초기 로드 시 체크
redirectShortsToWatch();

// YouTube SPA 내비게이션 감지 (yt-navigate-finish 이벤트)
document.addEventListener('yt-navigate-finish', redirectShortsToWatch);
```

**Step 2: Verify — Shorts URL redirects**

1. Reload extension
2. Navigate to any YouTube Shorts URL (e.g., `youtube.com/shorts/dQw4w9WgXcQ`)
3. Expected: 자동으로 `youtube.com/watch?v=dQw4w9WgXcQ`로 리다이렉트됨

**Step 3: Commit**

```bash
git add content.js
git commit -m "feat: redirect /shorts/ URLs to /watch page"
```

---

### Task 4: MutationObserver for Dynamic Shorts Hiding

**Files:**
- Modify: `content.js`

**Step 1: Add MutationObserver to hide dynamically loaded Shorts**

Append to `content.js`:

```javascript
// === MutationObserver: 동적 Shorts 요소 숨김 ===
function hideShortsElements(root) {
  const selectors = [
    'ytd-rich-shelf-renderer[is-shorts]',
    'ytd-reel-shelf-renderer',
    'ytd-video-renderer [overlay-style="SHORTS"]',
    'ytd-grid-video-renderer [overlay-style="SHORTS"]',
    'ytd-rich-item-renderer [overlay-style="SHORTS"]',
  ];
  const query = selectors.join(', ');
  root.querySelectorAll(query).forEach(el => {
    const target = el.closest('ytd-rich-item-renderer') ||
                   el.closest('ytd-video-renderer') ||
                   el.closest('ytd-grid-video-renderer') ||
                   el;
    target.style.display = 'none';
  });
}

const observer = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        hideShortsElements(node);
      }
    }
  }
});

// DOM 준비 후 observer 시작
function startObserver() {
  hideShortsElements(document.body);
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.body) {
  startObserver();
} else {
  document.addEventListener('DOMContentLoaded', startObserver);
}
```

**Step 2: Verify — dynamic Shorts hidden**

1. Reload extension
2. Go to `youtube.com`, scroll down to trigger lazy loading
3. Expected: 스크롤 중 동적으로 로드되는 Shorts 콘텐츠도 숨겨짐

**Step 3: Commit**

```bash
git add content.js
git commit -m "feat: add MutationObserver for dynamic Shorts hiding"
```

---

### Task 5: ArrowRight Key Blocking

**Files:**
- Modify: `content.js`

**Step 1: Add ArrowRight key blocking for video player**

Append to `content.js`:

```javascript
// === 5초 건너뛰기(→) 차단 ===
document.addEventListener('keydown', function(event) {
  if (event.key !== 'ArrowRight') return;

  // input, textarea, contenteditable 에서는 허용
  const activeEl = document.activeElement;
  if (activeEl) {
    const tag = activeEl.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || activeEl.isContentEditable) {
      return;
    }
  }

  // 영상 플레이어가 페이지에 존재하고 활성 상태인지 확인
  const player = document.querySelector('#movie_player');
  if (!player) return;

  // 플레이어 내부에 포커스가 있거나, body/document에 포커스가 있을 때 차단
  // (YouTube는 플레이어 외부 클릭 시에도 키보드가 플레이어에 전달됨)
  const isPlayerFocused = player.contains(activeEl) ||
                          activeEl === document.body ||
                          activeEl === document.documentElement;

  if (isPlayerFocused) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);
```

**Step 2: Verify — ArrowRight blocked on video**

1. Reload extension
2. Open any YouTube video
3. Press `→` (Right Arrow) key
4. Expected: 영상이 5초 앞으로 이동하지 않음
5. Click on the search bar, press `→`
6. Expected: 검색창에서는 정상 커서 이동

**Step 3: Commit**

```bash
git add content.js
git commit -m "feat: block ArrowRight 5-second skip on YouTube player"
```

---

### Task 6: Background Service Worker — Time Tracking

**Files:**
- Modify: `background.js`

**Step 1: Implement time tracking in service worker**

```javascript
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
}

function stopTracking() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
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
```

**Step 2: Verify — time tracking works**

1. Reload extension
2. Open YouTube and stay on it for ~10 seconds
3. Open DevTools → Application → Local Storage (or check via `chrome.storage.local.get(null)` in service worker console)
4. Expected: 오늘 날짜 키(`2026-03-03`)에 약 10초 값이 저장됨
5. Switch to another tab, wait 5 seconds, switch back
6. Expected: 다른 탭에 있는 동안에는 카운트가 증가하지 않음

**Step 3: Commit**

```bash
git add background.js
git commit -m "feat: add background service worker for YouTube time tracking"
```

---

### Task 7: YouTube Page Time Badge

**Files:**
- Modify: `content.js`
- Modify: `content.css`

**Step 1: Add badge CSS to content.css**

Append to `content.css`:

```css
/* === 사용 시간 배지 === */
#brainrot-savior-badge {
  position: fixed;
  top: 8px;
  right: 300px;
  z-index: 9999;
  background: #282828;
  color: #fff;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-family: 'Roboto', Arial, sans-serif;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  opacity: 0.85;
  transition: opacity 0.2s;
}

#brainrot-savior-badge:hover {
  opacity: 1;
}
```

**Step 2: Add badge insertion and update logic to content.js**

Append to `content.js`:

```javascript
// === 사용 시간 배지 ===
function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `오늘 ${hours}시간 ${minutes}분`;
  }
  return `오늘 ${minutes}분`;
}

function createBadge() {
  if (document.getElementById('brainrot-savior-badge')) return;
  const badge = document.createElement('div');
  badge.id = 'brainrot-savior-badge';
  badge.textContent = '오늘 0분';
  document.body.appendChild(badge);
}

function updateBadge() {
  chrome.runtime.sendMessage({ type: 'GET_TODAY_TIME' }, (response) => {
    if (chrome.runtime.lastError) return;
    const badge = document.getElementById('brainrot-savior-badge');
    if (badge && response) {
      badge.textContent = formatTime(response.seconds);
    }
  });
}

// 배지 삽입 및 주기적 업데이트
function initBadge() {
  createBadge();
  updateBadge();
  setInterval(updateBadge, 10000); // 10초마다 업데이트
}

if (document.body) {
  initBadge();
} else {
  document.addEventListener('DOMContentLoaded', initBadge);
}
```

**Step 3: Verify — badge appears on YouTube**

1. Reload extension
2. Go to `youtube.com`
3. Expected: 페이지 상단 우측에 "오늘 0분" 배지 표시
4. 10초 후 배지가 업데이트됨

**Step 4: Commit**

```bash
git add content.js content.css
git commit -m "feat: add real-time usage time badge on YouTube page"
```

---

### Task 8: Popup Dashboard

**Files:**
- Modify: `popup.html`
- Modify: `popup.css`
- Modify: `popup.js`

**Step 1: Write popup HTML**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div id="app">
    <header>
      <h1>Brainrot Savior</h1>
      <p class="subtitle">YouTube 사용 시간</p>
    </header>

    <section class="summary">
      <div class="stat-card">
        <span class="stat-label">오늘</span>
        <span class="stat-value" id="today-time">-</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">이번 주</span>
        <span class="stat-value" id="week-time">-</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">이번 달</span>
        <span class="stat-value" id="month-time">-</span>
      </div>
    </section>

    <section class="chart-section">
      <h2>최근 7일</h2>
      <div class="chart" id="chart"></div>
    </section>
  </div>
  <script src="popup.js"></script>
</body>
</html>
```

**Step 2: Write popup CSS**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 320px;
  font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
  background: #1a1a2e;
  color: #eee;
}

#app {
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 20px;
}

header h1 {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.subtitle {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.summary {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  background: #16213e;
  border-radius: 10px;
  padding: 12px 8px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #888;
  margin-bottom: 6px;
}

.stat-value {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #e94560;
}

.chart-section h2 {
  font-size: 13px;
  font-weight: 600;
  color: #aaa;
  margin-bottom: 12px;
}

.chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 100px;
}

.chart-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.chart-bar {
  width: 100%;
  background: #e94560;
  border-radius: 4px 4px 0 0;
  min-height: 2px;
  margin-top: auto;
  transition: height 0.3s;
}

.chart-bar.today {
  background: #0f3460;
}

.chart-label {
  font-size: 10px;
  color: #666;
  margin-top: 4px;
}

.chart-time {
  font-size: 9px;
  color: #888;
  margin-bottom: 2px;
}
```

**Step 3: Write popup JS**

```javascript
function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
}

function formatShortTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function getDateKey(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getLast7Days() {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function getWeekDates() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    if (d <= today) dates.push(d);
  }
  return dates;
}

function getMonthDates() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const dates = [];
  for (let d = new Date(firstDay); d <= today; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

async function loadDashboard() {
  const last7 = getLast7Days();
  const weekDates = getWeekDates();
  const monthDates = getMonthDates();

  const allKeys = [...new Set([
    ...last7.map(getDateKey),
    ...weekDates.map(getDateKey),
    ...monthDates.map(getDateKey),
  ])];

  const data = await chrome.storage.local.get(allKeys);

  // 오늘
  const todayKey = getDateKey(new Date());
  const todaySeconds = data[todayKey] || 0;
  document.getElementById('today-time').textContent = formatTime(todaySeconds);

  // 이번 주
  const weekSeconds = weekDates.reduce((sum, d) => sum + (data[getDateKey(d)] || 0), 0);
  document.getElementById('week-time').textContent = formatTime(weekSeconds);

  // 이번 달
  const monthSeconds = monthDates.reduce((sum, d) => sum + (data[getDateKey(d)] || 0), 0);
  document.getElementById('month-time').textContent = formatTime(monthSeconds);

  // 차트
  const chartEl = document.getElementById('chart');
  chartEl.innerHTML = '';
  const maxSeconds = Math.max(...last7.map(d => data[getDateKey(d)] || 0), 1);

  last7.forEach((date, i) => {
    const key = getDateKey(date);
    const seconds = data[key] || 0;
    const heightPercent = (seconds / maxSeconds) * 100;
    const isToday = i === last7.length - 1;

    const wrapper = document.createElement('div');
    wrapper.className = 'chart-bar-wrapper';

    const timeLabel = document.createElement('span');
    timeLabel.className = 'chart-time';
    timeLabel.textContent = seconds > 0 ? formatShortTime(seconds) : '';

    const bar = document.createElement('div');
    bar.className = `chart-bar${isToday ? ' today' : ''}`;
    bar.style.height = `${Math.max(heightPercent, 2)}%`;

    const dayLabel = document.createElement('span');
    dayLabel.className = 'chart-label';
    dayLabel.textContent = DAY_NAMES[date.getDay()];

    wrapper.appendChild(timeLabel);
    wrapper.appendChild(bar);
    wrapper.appendChild(dayLabel);
    chartEl.appendChild(wrapper);
  });
}

document.addEventListener('DOMContentLoaded', loadDashboard);
```

**Step 4: Verify — popup dashboard works**

1. Reload extension
2. Spend some time on YouTube (even 30 seconds)
3. Click the extension icon in toolbar
4. Expected: 팝업에 "오늘 X분", "이번 주 X분", "이번 달 X분" 표시 + 최근 7일 바 차트

**Step 5: Commit**

```bash
git add popup.html popup.css popup.js
git commit -m "feat: add popup dashboard with usage time stats and chart"
```

---

### Task 9: Final Polish and Integration Test

**Files:**
- Review all files

**Step 1: Full integration test**

1. Load unpacked extension fresh
2. Test Shorts 차단:
   - `youtube.com` 홈에서 Shorts 셸프 숨겨짐 확인
   - 사이드바에서 Shorts 탭 숨겨짐 확인
   - `youtube.com/shorts/<id>` → `youtube.com/watch?v=<id>` 리다이렉트 확인
3. Test 5초 건너뛰기 차단:
   - 아무 영상 재생 → `→` 키 누름 → 5초 건너뛰기 안 됨 확인
   - 검색창 클릭 → `→` 키 → 커서 정상 이동 확인
4. Test 시간 추적:
   - YouTube에서 30초 이상 머무른 후 배지에 "오늘 X분" 표시 확인
   - 팝업 클릭 → 대시보드에 오늘 시간 표시 확인
   - 다른 탭으로 전환 후 돌아왔을 때 시간이 올바르게 카운트되는지 확인

**Step 2: Fix any issues found**

각 테스트에서 문제가 발견되면 해당 파일을 수정하고 다시 테스트.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: final integration polish"
```
