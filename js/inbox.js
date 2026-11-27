// ───────── 알림 창 ─────────
// 상대방이 남긴 기록과 포인트 사용 내역이 여기에 쌓인다. 휴대폰 알림을 꺼 두어도 앱 안에서 볼 수 있다.
// 어디까지 봤는지는 이 기기에 기억한다(noticeSeen).
const noticeSeen = () => { try { return localStorage.getItem('noticeSeen') || '1970-01-01T00:00:00Z'; } catch (e) { return '1970-01-01T00:00:00Z'; } };

// 알림 한 줄 남기기. 실패해도(표가 아직 없어도) 조용히 넘어간다.
function logNotice(title, body, url) {
  sb.from('notices').insert({ title: String(title).slice(0, 80), body: String(body || '').slice(0, 160), url: url || '#/' }).then(() => {}, () => {});
}

// 종 버튼의 빨간 점: 내가 아닌 사람이 남긴 새 알림이 있으면 켠다
async function refreshBell() {
  const dot = document.getElementById('bellDot');
  if (!dot || !state.user) return;
  const n = await sb.from('notices').select('id', { count: 'exact', head: true }).neq('user_id', state.user.id).gt('created_at', noticeSeen())
    .then(r => (r.error ? 0 : r.count || 0), () => 0);
  dot.hidden = !n;
  dot.textContent = n > 9 ? '9+' : n;
}

function noticeWhen(iso) {
  const d = new Date(iso), min = Math.floor((Date.now() - d) / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  if (min < 60 * 24) return `${Math.floor(min / 60)}시간 전`;
  if (min < 60 * 24 * 7) return `${Math.floor(min / 1440)}일 전`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
// 주소를 보고 어울리는 아이콘을 고른다
const noticeIcon = url => {
  const id = (url || '').replace('#/', '').split('/')[0];
  return cuteIcon({ shop: 'money', grow: 'faith', dday: 'calendar' }[id] || id) || cuteIcon('us');
};

async function renderInbox() {
  setHeader('알림', { back: true });
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const { data, error } = await sb.from('notices').select('*').order('created_at', { ascending: false }).limit(60);
  if (location.hash !== '#/inbox') return;
  if (error) { view.innerHTML = '<div class="empty"><p>알림 창을 쓰려면 Supabase에서 016_notices.sql을 한 번 실행해 주세요.</p></div>'; return; }
  const seen = noticeSeen();
  view.innerHTML = data.length ? `
    <p class="hubline">상대방의 기록과 포인트 사용 내역이 쌓여요. 최근 60개까지 보여요.</p>
    <div class="nlist">${data.map(n => `
      <a class="nrow ${n.created_at > seen && n.user_id !== state.user.id ? 'new' : ''}" href="${/^#\/[\w\-\/]*$/.test(n.url) ? n.url : '#/'}">
        <span class="nicon">${noticeIcon(n.url)}</span>
        <span class="nmain"><b>${esc(n.title)}</b>${n.body ? `<small>${esc(n.body)}</small>` : ''}</span>
        <time>${noticeWhen(n.created_at)}</time>
      </a>`).join('')}</div>`
    : '<div class="empty"><b>아직 알림이 없어요</b><p>기록을 남기거나 포인트를 쓰면 여기에 쌓여요.</p></div>';
  try { localStorage.setItem('noticeSeen', new Date().toISOString()); } catch (e) { /* 저장 공간을 못 쓰는 경우는 넘어간다 */ }
  refreshBell();
}
