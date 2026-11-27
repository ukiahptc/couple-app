// ───────── 설정 ─────────
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 아이콘 (SVG 선 그림). 이모지는 기기마다 모양이 달라서 쓰지 않는다.
const ICON = {
  home:     '<path d="M4 11l8-7 8 7v8a1 1 0 01-1 1H5a1 1 0 01-1-1z"/><path d="M10 20v-5h4v5"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  records:  '<path d="M7 4h10a2 2 0 012 2v14H7a2 2 0 01-2-2V6a2 2 0 012-2z"/><path d="M9 9h6M9 13h6"/>',
  map:      '<path d="M12 21s-6-5.500-6-10a6 6 0 0112 0c0 4.500-6 10-6 10z"/><circle cx="12" cy="11" r="2.200"/>',
  album:    '<rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.200"/><path d="M8 6l1.500-2h5L16 6"/>',
  heart:    '<path d="M12 20s-7-4.300-9-8.600C1.600 8.200 3.500 5 6.800 5c1.900 0 3.400.9 5.200 2.800C13.800 5.900 15.300 5 17.200 5c3.300 0 5.200 3.200 3.800 6.400-2 4.300-9 8.600-9 8.600z"/>',
  diary:    '<path d="M6 4h11a1 1 0 011 1v15H7a1 1 0 01-1-1z"/><path d="M6 8H4M6 12H4M6 16H4M10 9h4"/>',
  food:     '<path d="M7 3v8M5 3v5a2 2 0 004 0V3M7 11v10M17 3c-2 1-3 3.500-3 6.500 0 1.500 1 2.500 3 2.500zm0 9v9"/>',
  money:    '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M7 15h3"/>',
  chevron:  '<path d="M9 5l7 7-7 7"/>',
  gear:     '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M5.600 18.400l2.100-2.100M16.300 7.700l2.100-2.100"/>',
  back:     '<path d="M15 5l-7 7 7 7"/>',
  close:    '<path d="M6 6l12 12M18 6L6 18"/>',
  check:    '<path d="M5 12.500l4.500 4.500L19 7.500"/>',
  comment:  '<path d="M5 5h14a1 1 0 011 1v9a1 1 0 01-1 1h-7l-4 4v-4H5a1 1 0 01-1-1V6a1 1 0 011-1z"/>',
  plus:     '<path d="M12 5v14M5 12h14"/>',
  edit:     '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[name]}</svg>`;

// 화면 정의. 홈의 위젯을 누르면 각 화면으로 들어가고, 뒤로 버튼으로 홈에 돌아온다.
// 기능을 만들 때 여기에 render 함수를 연결한다.
const PAGES = [
  { id: 'dday',     name: '디데이',     icon: 'heart',    stage: 2, render: () => renderDday() },
  { id: 'calendar', name: '커플 캘린더', icon: 'calendar', stage: 2, render: () => renderCalendar() },
  { id: 'diary',    name: '커플 일기장', icon: 'diary',    stage: 2, render: param => renderDiary(param) },
  { id: 'food',     name: '맛집 기록장', icon: 'food',     stage: 3, render: param => renderFood(param) },
  { id: 'money',    name: '데이트 가계부', icon: 'money',  stage: 3, render: param => renderMoney(param) },
  { id: 'map',      name: '데이트 지도', icon: 'map',      stage: 3, render: param => renderMap(param) },
  { id: 'album',    name: '사진 앨범',   icon: 'album',    stage: 4, render: () => renderAlbum() },
  { id: 'settings', name: '설정',       icon: 'gear',     render: () => renderSettings() },
];

// 앱 상태: 로그인한 사용자, 내 커플, 커플 멤버 목록
const state = { user: null, couple: null, members: [] };

const view = document.getElementById('view');
const title = document.getElementById('pageTitle');
const backBtn = document.getElementById('backBtn');
const menuBtn = document.getElementById('menuBtn');
const gearBtn = document.getElementById('gearBtn');
const actionBtn = document.getElementById('actionBtn');

// 사용자가 입력한 글자를 화면에 넣을 때 태그로 해석되지 않게 한다
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// action: 오른쪽 위 둥근 버튼 하나 { icon, label, onClick }
function setHeader(text, { back = false, menu = false, gear = false, action = null } = {}) {
  title.textContent = text;
  backBtn.hidden = !back;
  menuBtn.hidden = !menu;
  gearBtn.hidden = !gear;
  actionBtn.hidden = !action;
  if (action) {
    actionBtn.innerHTML = icon(action.icon);
    actionBtn.setAttribute('aria-label', action.label);
    actionBtn.onclick = action.onClick;
  }
  backBtn.onclick = () => { location.hash = '#/'; };
}

// 예전 아래 탭 메뉴의 흔적. 지금은 홈 위젯으로 이동하므로 아무 일도 하지 않는다.
function setTabs() {}

const BRAND = `
  <div class="brand">
    <div class="logo">${icon('heart')}</div>
    <div class="word">우리</div>
    <p>둘만의 일정과 기록을 한곳에</p>
  </div>`;

// Supabase 영어 오류를 한국어로
function koError(err) {
  const m = err?.message || String(err);
  if (/Invalid login credentials/i.test(m)) return '이메일 또는 비밀번호가 맞지 않습니다.';
  if (/already registered/i.test(m)) return '이미 가입된 이메일입니다. 로그인해 주세요.';
  if (/at least 6 characters/i.test(m)) return '비밀번호는 6자 이상이어야 합니다.';
  if (/Email not confirmed/i.test(m)) return '이메일 인증이 필요합니다. 받은 메일의 링크를 눌러 주세요.';
  if (/valid email|invalid format/i.test(m)) return '이메일 주소 형식을 확인해 주세요.';
  if (/rate limit/i.test(m)) return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  if (/permission denied|does not exist|schema cache/i.test(m)) return 'DB 설정이 아직 안 된 것 같습니다. Supabase에서 SQL을 실행했는지 확인해 주세요.';
  if (/Failed to fetch|NetworkError/i.test(m)) return '인터넷 연결을 확인해 주세요.';
  return m;
}

// ───────── 화면: 로그인 / 회원가입 ─────────
function renderAuth(mode = 'login') {
  const isLogin = mode === 'login';
  setHeader('우리'); setTabs(null);
  view.innerHTML = `
    ${BRAND}
    <form class="card form" id="authForm">
      <h2>${isLogin ? '로그인' : '회원가입'}</h2>
      <label>이메일<input type="email" name="email" inputmode="email" autocomplete="email" autocapitalize="none" required></label>
      <label>비밀번호<input type="password" name="password" minlength="6"
        autocomplete="${isLogin ? 'current-password' : 'new-password'}" required></label>
      <p class="msg" id="msg" role="alert"></p>
      <button class="btn" type="submit">${isLogin ? '로그인' : '가입하기'}</button>
      <button class="link" type="button" id="switchBtn">
        ${isLogin ? '처음이신가요? 회원가입' : '이미 계정이 있어요. 로그인'}
      </button>
    </form>`;
  document.getElementById('switchBtn').onclick = () => renderAuth(isLogin ? 'signup' : 'login');
  document.getElementById('authForm').onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const cred = { email: f.get('email').trim(), password: f.get('password') };
    const msg = document.getElementById('msg');
    const btn = e.target.querySelector('.btn');
    btn.disabled = true; btn.textContent = '잠시만요…'; msg.textContent = '';
    const { data, error } = isLogin
      ? await sb.auth.signInWithPassword(cred)
      // 인증 메일의 링크를 누르면 이 앱 주소로 돌아오게 한다
      : await sb.auth.signUp({ ...cred, options: { emailRedirectTo: location.origin + location.pathname } });
    btn.disabled = false; btn.textContent = isLogin ? '로그인' : '가입하기';
    if (error) { msg.textContent = koError(error); return; }
    // 이메일 인증이 켜져 있으면 가입 직후에는 세션이 없다
    if (!data.session) {
      msg.className = 'msg ok';
      msg.textContent = '인증 메일을 보냈습니다. 메일의 링크를 누른 뒤, 이 앱으로 돌아와 로그인해 주세요.';
      return;
    }
    start();
  };
}

// ───────── 화면: 커플 연결 ─────────
function renderLink() {
  setHeader('커플 연결', { menu: true }); setTabs(null);
  view.innerHTML = `
    <div class="card form">
      <h2>우리 둘을 연결해요</h2>
      <label>내 닉네임<input id="nick" maxlength="12" placeholder="예: 준원" required></label>
      <p class="msg" id="msg" role="alert"></p>
      <button class="btn" id="createBtn">초대 코드 만들기</button>
      <div class="or">또는</div>
      <label>받은 초대 코드<input id="code" maxlength="6" placeholder="6자리"
        autocapitalize="characters" autocomplete="off"></label>
      <button class="btn ghost" id="joinBtn">초대 코드로 연결하기</button>
    </div>`;
  const msg = document.getElementById('msg');
  const nick = () => document.getElementById('nick').value.trim();
  const run = async (btn, fn) => {
    if (!nick()) { msg.textContent = '닉네임을 입력해 주세요.'; return; }
    btn.disabled = true; msg.textContent = '';
    const { error } = await fn();
    btn.disabled = false;
    if (error) { msg.textContent = koError(error); return; }
    start();
  };
  document.getElementById('createBtn').onclick = e =>
    run(e.target, () => sb.rpc('create_couple', { p_nickname: nick() }));
  document.getElementById('joinBtn').onclick = e => {
    const code = document.getElementById('code').value.trim();
    if (code.length !== 6) { msg.textContent = '초대 코드 6자리를 입력해 주세요.'; return; }
    run(e.target, () => sb.rpc('join_couple', { p_code: code, p_nickname: nick() }));
  };
}

// ───────── 화면: 아직 안 만든 기능 ─────────
function renderPage(page) {
  setHeader(page.name, { back: true });
  view.innerHTML = `
    <div class="empty">
      <div class="chip">${icon(page.icon)}</div>
      <b>${page.name}</b>
      <p>${page.stage}단계에서 만들어집니다.</p>
    </div>`;
}

// ───────── 화면: 설정 ─────────
function renderSettings() {
  setHeader('설정', { back: true });
  const me = state.members.find(m => m.user_id === state.user.id);
  const partner = state.members.find(m => m.user_id !== state.user.id);
  view.innerHTML = `
    <ul class="dlist">
      <li class="drow"><div class="dmain"><div class="d">내 닉네임</div><div class="t">${esc(me?.nickname)}</div></div></li>
      <li class="drow"><div class="dmain"><div class="d">상대방</div><div class="t">${partner ? esc(partner.nickname) : '아직 연결되지 않았어요'}</div></div></li>
      <li class="drow"><div class="dmain"><div class="d">초대 코드</div><div class="t">${esc(state.couple.invite_code)}</div></div></li>
      <li class="drow"><div class="dmain"><div class="d">로그인 계정</div><div class="t">${esc(state.user.email)}</div></div></li>
    </ul>
    <button class="btn ghost add" id="logoutBtn">로그아웃</button>`;
  document.getElementById('logoutBtn').onclick = logout;
}

function renderMessage(text) {
  setHeader('우리'); setTabs(null);
  view.innerHTML = `<div class="empty"><p>${esc(text)}</p>
    <button class="btn ghost" id="retryBtn">다시 시도</button></div>`;
  document.getElementById('retryBtn').onclick = start;
}

// ───────── 라우터 ─────────
// 주소의 # 뒤를 보고 화면을 바꾼다. 커플 연결이 끝난 뒤에만 동작한다.
function route() {
  document.body.classList.remove('onhome');   // 홈에서만 전체 손글씨체를 쓴다 (renderHome 이 다시 붙인다)
  if (!state.couple) return;
  document.querySelectorAll('.sheet').forEach(el => el.remove());
  document.body.classList.remove('noscroll');
  // '#/diary/글번호' 처럼 뒤에 붙은 값은 param으로 넘긴다
  const [id, param] = location.hash.replace('#/', '').split('/');
  const page = PAGES.find(p => p.id === id);
  if (page?.render) page.render(param);
  else if (page) renderPage(page);
  else renderHome();
  window.scrollTo(0, 0);
}

// ───────── 시작 ─────────
// 로그인 여부 → 커플 연결 여부 순으로 확인해서 알맞은 화면을 보여 준다.
async function start() {
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const { data: { session } } = await sb.auth.getSession();
  state.user = session?.user ?? null;
  state.couple = null; state.members = [];
  if (!state.user) { renderAuth(); return; }

  // 접근 규칙 덕분에 내 커플의 멤버만 내려온다 (0~2명)
  const { data: members, error } = await sb.from('members').select('user_id, couple_id, nickname');
  if (error) { renderMessage(koError(error)); return; }
  if (!members.length) { renderLink(); return; }

  const { data: couple, error: e2 } = await sb.from('couples')
    .select('id, invite_code, start_date').single();
  if (e2) { renderMessage(koError(e2)); return; }
  state.members = members;
  state.couple = couple;
  route();
}

async function logout() {
  if (!confirm('로그아웃할까요?')) return;
  await sb.auth.signOut();
  location.hash = '';
  start();
}
menuBtn.addEventListener('click', logout);
window.addEventListener('hashchange', route);

// 손글씨체로 보이는 줄에 Gaegu 에 없는 한글이 섞이면 그 글자만 다른 글꼴로 바뀌어 깨져 보인다.
// 그런 줄은 통째로 본문 글꼴(nohw)로 바꾼다. 화면이 바뀔 때마다 다시 살핀다.
const HW_SPOTS = '#pageTitle, .hli span, .hli small, .hpol span, .hnote p, .hnote b, .mtitle2 h2, .fdetail h2, .dfull h2, .tripwhere b, .reghead h2, .sheethead b, .mmonth, .daytitle, .btn.wide';
function fixHandwriting() {
  document.querySelectorAll(HW_SPOTS).forEach(el => {
    const bad = [...el.textContent].some(c => c >= '\uac00' && c <= '\ud7a3' && !GAEGU_HANGUL.has(c));
    el.classList.toggle('nohw', bad);
  });
}
let hwTimer = 0;
new MutationObserver(() => { clearTimeout(hwTimer); hwTimer = setTimeout(fixHandwriting, 0); })
  .observe(document.body, { childList: true, subtree: true, characterData: true });
// 인터넷이 끊기면 위에 안내 띠를 보여 주고, 다시 연결되면 지금 화면을 새로 불러온다
const offlineBar = document.getElementById('offline');
const syncOnline = () => { offlineBar.hidden = navigator.onLine; };
window.addEventListener('offline', syncOnline);
window.addEventListener('online', () => { syncOnline(); if (state.user && !document.querySelector('.sheet')) route(); });
syncOnline();
start();

// 서비스 워커 등록: 오프라인에서도 앱 껍데기가 열리게 한다.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}
