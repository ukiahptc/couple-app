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
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[name]}</svg>`;

// 아래 탭 메뉴 (최대 5개)
const TABS = [
  { id: '',         name: '홈',     icon: 'home' },
  { id: 'calendar', name: '캘린더', icon: 'calendar' },
  { id: 'records',  name: '기록',   icon: 'records' },
  { id: 'map',      name: '지도',   icon: 'map' },
  { id: 'album',    name: '앨범',   icon: 'album' },
];

// 화면 정의: parent가 있으면 그 탭 안의 하위 화면이다.
// 기능을 만들 때 여기에 render 함수를 연결한다.
const PAGES = [
  { id: 'calendar', name: '캘린더',     icon: 'calendar', desc: '우리 일정',      stage: 2 },
  { id: 'dday',     name: '디데이',     icon: 'heart',    desc: '기념일 세기',    stage: 2, parent: '' },
  { id: 'diary',    name: '일기장',     icon: 'diary',    desc: '함께 쓰는 일기', stage: 2, parent: 'records' },
  { id: 'food',     name: '맛집 기록장', icon: 'food',     desc: '다녀온 맛집',    stage: 3, parent: 'records' },
  { id: 'money',    name: '가계부',     icon: 'money',    desc: '데이트 비용',    stage: 3, parent: 'records' },
  { id: 'map',      name: '데이트 지도', icon: 'map',      desc: '우리가 간 곳',   stage: 3 },
  { id: 'album',    name: '사진 앨범',   icon: 'album',    desc: '추억 모아 보기', stage: 4 },
];

// 앱 상태: 로그인한 사용자, 내 커플, 커플 멤버 목록
const state = { user: null, couple: null, members: [] };

const view = document.getElementById('view');
const title = document.getElementById('pageTitle');
const backBtn = document.getElementById('backBtn');
const menuBtn = document.getElementById('menuBtn');
const tabbar = document.getElementById('tabbar');

// 사용자가 입력한 글자를 화면에 넣을 때 태그로 해석되지 않게 한다
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function setHeader(text, { back = false, menu = false } = {}) {
  title.textContent = text;
  backBtn.hidden = !back;
  menuBtn.hidden = !menu;
}

// 아래 탭을 그린다. active가 null이면 탭을 숨긴다 (로그인, 커플 연결 화면).
function setTabs(active) {
  tabbar.hidden = active === null;
  if (active === null) return;
  tabbar.innerHTML = TABS.map(t => `
    <a href="#/${t.id}" ${t.id === active ? 'aria-current="page"' : ''}>
      ${icon(t.icon)}<span>${t.name}</span>
    </a>`).join('');
}

const BRAND = `
  <div class="brand">
    <div class="logo">${icon('heart')}</div>
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

// ───────── 화면: 홈 ─────────
// 사귄 날부터 오늘까지 며칠째인지 (사귄 날 = 1일째)
function daysTogether(startDate) {
  const [y, m, d] = startDate.split('-').map(Number);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((today - new Date(y, m - 1, d)) / 86400000) + 1;
}

function renderHome() {
  setHeader('우리', { menu: true }); setTabs('');
  const me = state.members.find(m => m.user_id === state.user.id);
  const partner = state.members.find(m => m.user_id !== state.user.id);
  const sd = state.couple.start_date;
  const waiting = !partner ? `
    <section class="card invite">
      <div class="label">상대방에게 이 초대 코드를 알려 주세요</div>
      <div class="code">${esc(state.couple.invite_code)}</div>
      <button class="link" id="refreshBtn">상대방이 입력했어요. 새로고침</button>
    </section>` : '';
  view.innerHTML = `
    ${waiting}
    <a class="hero" href="#/dday">
      <div class="names">${esc(me?.nickname)} <i>&amp;</i> ${partner ? esc(partner.nickname) : '기다리는 중'}</div>
      ${sd
        ? `<div class="num">${daysTogether(sd)}<small>일째</small></div>
           <div class="since">${sd.replaceAll('-', '. ')} 부터</div>`
        : `<div class="num">우리의 날</div>
           <div class="since">사귄 날은 디데이에서 설정할 수 있어요</div>`}
    </a>
    <h2 class="sec">다가오는 일정</h2>
    <div class="card blank">아직 등록된 일정이 없어요</div>
    <h2 class="sec">최근 기록</h2>
    <div class="card blank">아직 남긴 기록이 없어요</div>`;
  const r = document.getElementById('refreshBtn');
  if (r) r.onclick = start;
}

// 기록 탭: 일기장, 맛집, 가계부로 들어가는 목록
function renderRecords() {
  setHeader('기록', {}); setTabs('records');
  view.innerHTML = PAGES.filter(p => p.parent === 'records').map(p => `
    <a class="card item" href="#/${p.id}">
      <div class="chip">${icon(p.icon)}</div>
      <div><div class="t">${p.name}</div><div class="d">${p.desc}</div></div>
      <div class="go">${icon('chevron')}</div>
    </a>`).join('');
}

function renderPage(page) {
  const sub = page.parent !== undefined;           // 하위 화면이면 뒤로 버튼
  setHeader(page.name, { back: sub }); setTabs(sub ? page.parent : page.id);
  backBtn.onclick = () => { location.hash = '#/' + (page.parent || ''); };
  view.innerHTML = `
    <div class="empty">
      <div class="chip">${icon(page.icon)}</div>
      <b>${page.name}</b>
      <p>${page.stage}단계에서 만들어집니다.</p>
    </div>`;
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
  if (!state.couple) return;
  const id = location.hash.replace('#/', '');
  const page = PAGES.find(p => p.id === id);
  if (id === 'records') renderRecords();
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

menuBtn.addEventListener('click', async () => {
  if (!confirm('로그아웃할까요?')) return;
  await sb.auth.signOut();
  location.hash = '';
  start();
});
window.addEventListener('hashchange', route);
start();

// 서비스 워커 등록: 오프라인에서도 앱 껍데기가 열리게 한다.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}
