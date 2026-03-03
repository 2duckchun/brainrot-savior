// Brainrot Savior

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
