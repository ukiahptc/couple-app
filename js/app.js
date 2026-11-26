// ───────── 설정 ─────────
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

// 앱 상태: 로그인한 사용자, 내 커플, 커플 멤버 목록
const state = { user: null, couple: null, members: [] };

const view = document.getElementById('view');
const title = document.getElementById('pageTitle');
const backBtn = document.getElementById('backBtn');
const menuBtn = document.getElementById('menuBtn');

// 사용자가 입력한 글자를 화면에 넣을 때 태그로 해석되지 않게 한다
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function setHeader(text, { back = false, menu = false } = {}) {
  title.textContent = text;
  backBtn.hidden = !back;
  menuBtn.hidden = !menu;
}

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
  setHeader('우리');
  view.innerHTML = `
    <form class="card form" id="authForm">
      <h2>${isLogin ? '로그인' : '회원가입'}</h2>
      <label>이메일<input type="email" name="email" autocomplete="email" required></label>
      <label>비밀번호<input type="password" name="password" minlength="6"
        autocomplete="${isLogin ? 'current-password' : 'new-password'}" required></label>
      <p class="msg" id="msg"></p>
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
    btn.disabled = true; msg.textContent = '';
    const { data, error } = isLogin
      ? await sb.auth.signInWithPassword(cred)
      : await sb.auth.signUp(cred);
    btn.disabled = false;
    if (error) { msg.textContent = koError(error); return; }
    // 이메일 인증이 켜져 있으면 가입 직후에는 세션이 없다
    if (!data.session) {
      msg.className = 'msg ok';
      msg.textContent = '인증 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인해 주세요.';
      return;
    }
    start();
  };
}

// ───────── 화면: 커플 연결 ─────────
function renderLink() {
  setHeader('커플 연결', { menu: true });
  view.innerHTML = `
    <div class="card form">
      <h2>우리 둘을 연결해요</h2>
      <label>내 닉네임<input id="nick" maxlength="12" placeholder="예: 준원" required></label>
      <p class="msg" id="msg"></p>
      <button class="btn" id="createBtn">새로 시작하기 (초대 코드 만들기)</button>
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
function renderHome() {
  setHeader('우리', { menu: true });
  const me = state.members.find(m => m.user_id === state.user.id);
  const partner = state.members.find(m => m.user_id !== state.user.id);
  const waiting = !partner ? `
    <section class="card invite">
      <div class="label">상대방에게 이 초대 코드를 알려 주세요</div>
      <div class="code">${esc(state.couple.invite_code)}</div>
      <button class="link" id="refreshBtn">상대방이 입력했어요. 새로고침</button>
    </section>` : '';
  view.innerHTML = `
    ${waiting}
    <section class="dday">
      <div class="label">${esc(me?.nickname)} ♥ ${partner ? esc(partner.nickname) : '?'}</div>
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
  const r = document.getElementById('refreshBtn');
  if (r) r.onclick = start;
}

function renderPage(page) {
  setHeader(page.name, { back: true });
  view.innerHTML = `
    <div class="empty">
      <div class="emoji">${page.emoji}</div>
      <p><b>${page.name}</b><br>${page.stage}단계에서 만들어집니다.</p>
    </div>`;
}

function renderMessage(text) {
  setHeader('우리');
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
  page ? renderPage(page) : renderHome();
  window.scrollTo(0, 0);
}

// ───────── 시작 ─────────
// 로그인 여부 → 커플 연결 여부 순으로 확인해서 알맞은 화면을 보여 준다.
async function start() {
  view.innerHTML = '<div class="empty"><p>불러오는 중…</p></div>';
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

backBtn.addEventListener('click', () => { location.hash = ''; });
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
