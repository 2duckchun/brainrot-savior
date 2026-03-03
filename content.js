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
