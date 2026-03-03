# Brainrot Savior - Chrome Extension Design

## Overview

YouTube 사용 습관을 개선하기 위한 Chrome 익스텐션. Shorts 차단, 5초 건너뛰기 차단, 사용 시간 추적 기능을 제공한다.

## MVP Features

### 1. YouTube Shorts 차단

- CSS `display: none`으로 Shorts 관련 DOM 요소 즉시 숨김
  - 홈 피드의 Shorts 셸프 (`ytd-rich-shelf-renderer[is-shorts]`)
  - 사이드바의 Shorts 탭
  - 탐색 페이지의 Shorts 섹션
- MutationObserver로 SPA 페이지 전환 시 새로 렌더링되는 Shorts 요소 감지 및 숨김
- `/shorts/xxxxx` URL 접근 시 `/watch?v=xxxxx`로 리다이렉트

### 2. 5초 건너뛰기(→) 차단

- `document.addEventListener('keydown', handler, true)` 캡처 단계 등록
- 영상 플레이어에 포커스가 있을 때만 `ArrowRight` 차단
  - `event.preventDefault()` + `event.stopImmediatePropagation()`
- input, textarea, contenteditable 요소에서는 정상 동작 유지

### 3. 사용 시간 추적

**데이터 수집 (Background Service Worker):**
- `chrome.tabs.onActivated` / `chrome.tabs.onUpdated`로 YouTube 탭 활성 감지
- YouTube 탭 활성 시 시간 카운트, 비활성 시 중지
- `chrome.storage.local`에 일별 사용 시간 저장 (키: `YYYY-MM-DD`, 값: 초 단위)

**유튜브 페이지 내 배지 (Content Script):**
- YouTube 상단 네비게이션 바 옆에 작은 배지 삽입
- 오늘 사용 시간 실시간 표시 (예: "오늘 1시간 23분")
- Service Worker로부터 주기적으로 업데이트

**팝업 대시보드:**
- 오늘 / 이번 주 / 이번 달 사용 시간 표시
- 일별 바 차트로 추이 시각화
- 순수 HTML/CSS/JS

## Architecture

```
manifest.json (Manifest V3)
    ├── content.js + content.css  →  YouTube 페이지에 주입
    │   ├── Shorts DOM 숨김 (CSS + MutationObserver)
    │   ├── /shorts/ URL 리다이렉트
    │   ├── ArrowRight 키 차단
    │   └── 사용 시간 배지 삽입
    ├── background.js (Service Worker)
    │   ├── YouTube 탭 활성 감지
    │   ├── 시간 카운트 및 저장
    │   └── Content Script와 메시지 통신
    └── popup.html/js/css
        └── 사용 시간 대시보드
```

## Tech Stack

- Manifest V3
- Vanilla JavaScript (프레임워크 없음)
- chrome.storage.local (데이터 저장)
- 빌드 도구 없음

## Non-Goals (MVP 이후)

- 사이트 시간 제한 설정
- 기능별 ON/OFF 토글
- 다른 SNS (Instagram, Twitter 등) 지원
- 브라우징 패턴 분석 리포트
