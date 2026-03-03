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
