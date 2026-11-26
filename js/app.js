// 메뉴 정의: 기능을 추가할 때 여기에 한 줄 넣고 render 함수를 연결한다.
const PAGES = [
  { id: 'calendar', name: '캘린더',     emoji: '📅', desc: '우리 일정',      stage: 2 },
  { id: 'dday',     name: '디데이',     emoji: '💗', desc: '기념일 세기',    stage: 2 },
  { id: 'diary',    name: '일기장',     emoji: '📔', desc: '함께 쓰는 일기', stage: 2 },
  { id: 'food',     name: '맛집 기록장', emoji: '🍜', desc: '다녀온 맛집',    stage: 3 },
  { id: 'map',      name: '데이트 지도', emoji: '🗺️', desc: '우리가 간 곳',   stage: 3 },
  { id: 'money',    name: '가계부',     emoji: '💰', desc: '데이트 비용',    stage: 3 },
  { id: 'album',    name: '사진 앨범',   emoji: '📷', desc: '추억 모아 보기', stage: 4 },
];

const view = document.getElementById('view');
const title = document.getElementById('pageTitle');
const backBtn = document.getElementById('backBtn');

function renderHome() {
  title.textContent = '우리';
  backBtn.hidden = true;
  view.innerHTML = `
    <section class="dday">
      <div class="label">우리가 함께한 지</div>
      <div class="num">D+?</div>
    </section>
    <section class="grid">
      ${PAGES.map(p => `
        <a class="tile" href="#/${p.id}">
          <div class="emoji">${p.emoji}</div>
          <div class="name">${p.name}</div>
          <div class="desc">${p.desc}</div>
        </a>`).join('')}
    </section>`;
}

function renderPage(page) {
  title.textContent = page.name;
  backBtn.hidden = false;
  view.innerHTML = `
    <div class="empty">
      <div class="emoji">${page.emoji}</div>
      <p><b>${page.name}</b><br>${page.stage}단계에서 만들어집니다.</p>
    </div>`;
}

// 주소의 # 뒤를 보고 화면을 바꾸는 간단한 라우터
function route() {
  const id = location.hash.replace('#/', '');
  const page = PAGES.find(p => p.id === id);
  page ? renderPage(page) : renderHome();
  window.scrollTo(0, 0);
}

backBtn.addEventListener('click', () => { location.hash = ''; });
window.addEventListener('hashchange', route);
route();

// 서비스 워커 등록: 오프라인에서도 앱 껍데기가 열리게 한다.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}
