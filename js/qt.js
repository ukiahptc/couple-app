// ───────── QT: 질문 카드 · 나눔 · 자라는 성경책 ─────────
// #/qt 오늘의 질문과 최근 나눔, #/qt/cards 지난 질문 카드, #/qt/shares 나눔 보관함, #/qt/<나눔 id> 나눔 한 편
const qtQuestion = (date = today0()) => {
  const n = Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(2026, 0, 1)) / 86400000);
  return QT_QUESTIONS[((n % QT_QUESTIONS.length) + QT_QUESTIONS.length) % QT_QUESTIONS.length];
};
const SHARE_COLS = 'id, author_id, share_date, book, passage, body, created_at';
const shareTitle = s => [s.book ? BOOKS[s.book - 1].name : '', s.passage].filter(Boolean).join(' ') || '나눔';
const qtDate = iso => { const d = parseDate(iso); return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()} (${WEEK[d.getDay()]})`; };

// 포인트: 질문에 답하면 1점, 그날 둘 다 답하면 3점 더, 나눔 한 편 3점, 통독 한 장 1점. 표가 아직 없으면 0으로 센다.
async function growPoints() {
  const count = t => sb.from(t).select('id', { count: 'exact', head: true }).then(r => (r.error ? 0 : r.count || 0), () => 0);
  const [ans, s, b] = await Promise.all([
    sb.from('qt_answers').select('q_date').limit(5000).then(r => r.data || [], () => []),
    count('qt_shares'), count('bible_reads'),
  ]);
  const perDay = {};
  ans.forEach(r => { perDay[r.q_date] = (perDay[r.q_date] || 0) + 1; });
  const both = Object.values(perDay).filter(n => n >= 2).length;
  return { points: ans.length + both * 3 + s * 3 + b, a: ans.length, both, s, b };
}
function growCard({ points, a, both, s, b }) {
  let st = 0;
  GROW_STAGES.forEach((x, i) => { if (points >= x.need) st = i; });
  const cur = GROW_STAGES[st], nx = GROW_STAGES[st + 1];
  const pct = nx ? (points - cur.need) / (nx.need - cur.need) * 100 : 100;
  return `
    <section class="seed">
      <div class="seedart">${growSvg(st)}</div>
      <div class="seedinfo">
        <small>우리 성경책 · ${st + 1}단계</small>
        <b>${cur.name}</b>
        <p>${cur.line}</p>
        <div class="bbar"><i style="width:${Math.max(points ? 3 : 0, pct)}%"></i></div>
        <p class="seednext">⭐ ${points.toLocaleString('ko-KR')}점${nx ? ` · ${nx.name}까지 ${(nx.need - points).toLocaleString('ko-KR')}점` : ' · 다 자랐어요'}</p>
      </div>
      <p class="seedhow">답 ${a}개 · 둘 다 답한 날 ${both}일(+3) · 나눔 ${s}편(×3) · 통독 ${b}장</p>
    </section>`;
}

async function renderQt(param) {
  if (param === 'cards') return renderQtCards();
  if (param === 'shares') return renderQtShares();
  if (param) return renderQtShare(param);
  setHeader('QT', { back: true, action: { icon: 'plus', label: '나눔 쓰기', onClick: () => openShareSheet(null) } });
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const today = toISO(today0()), q = qtQuestion();
  const [ans, sh, seed] = await Promise.all([
    sb.from('qt_answers').select('id, user_id, body, question').eq('q_date', today),
    sb.from('qt_shares').select(`${SHARE_COLS}, qt_share_comments(count)`).order('share_date', { ascending: false }).order('created_at', { ascending: false }).limit(3),
    growPoints(),
  ]);
  if (location.hash !== '#/qt') return;
  const err = ans.error || sh.error;
  const partner = state.members.find(m => m.user_id !== state.user.id);
  const mine = (ans.data || []).find(x => x.user_id === state.user.id);
  const theirs = (ans.data || []).find(x => x.user_id !== state.user.id);
  const pn = esc(partner?.nickname || '상대방');
  view.innerHTML = `
    ${err ? `<p class="msg" role="alert">${esc(koError(err))}</p>` : ''}
    ${growCard(seed)}

    <h2 class="hmark green">오늘의 질문</h2>
    <section class="qcard">
      <p class="qq">${esc(mine?.question || q)}</p>
      ${mine ? `
        <div class="qa me">${whoTag(state.user.id)}<p>${esc(mine.body)}</p><button class="link" id="qEdit">고치기</button></div>
        ${theirs ? `<div class="qa pt">${whoTag(theirs.user_id)}<p>${esc(theirs.body)}</p></div>`
          : `<p class="hint">${pn} 님의 답을 기다리고 있어요.</p>`}`
        : `
        ${theirs ? `<p class="hint">${pn} 님이 먼저 답했어요. 내 답을 쓰면 서로의 답이 열려요.</p>` : ''}
        <form id="qForm"><textarea name="body" maxlength="1000" rows="3" placeholder="내 답을 적어 보세요" aria-label="내 답" required></textarea>
          <button class="btn small" type="submit">답하기</button></form>`}
      <p class="msg" id="qMsg" role="alert"></p>
    </section>
    <a class="hli" href="#/qt/cards"><span>지난 질문 카드 모아 보기</span><small>›</small></a>

    <h2 class="hmark">최근 나눔</h2>
    ${(sh.data || []).length ? sh.data.map(shareCard).join('') : '<p class="hint">QT를 하고 느낀 점을 나눠 보세요. 오른쪽 위 + 버튼으로 쓸 수 있어요.</p>'}
    <a class="hli" href="#/qt/shares"><span>나눔 보관함 전체 보기</span><small>›</small></a>`;

  const msg = document.getElementById('qMsg');
  const form = document.getElementById('qForm');
  const save = async (body, btn) => {
    if (btn) btn.disabled = true;
    const { error } = mine
      ? await sb.from('qt_answers').update({ body }).eq('id', mine.id)
      : await sb.from('qt_answers').insert({ q_date: today, question: q, body });
    if (error) { if (btn) btn.disabled = false; msg.textContent = koError(error); return; }
    if (!mine) notifyPartner('오늘의 질문에 답했어요', theirs ? '서로의 답이 열렸어요' : '답을 쓰면 서로의 답이 열려요', '#/qt');
    renderQt();
  };
  if (form) form.onsubmit = e => { e.preventDefault(); const v = form.body.value.trim(); if (v) save(v, form.querySelector('.btn')); };
  const edit = document.getElementById('qEdit');
  if (edit) edit.onclick = () => {
    const s = makeSheet('내 답 고치기', `<textarea name="body" class="plainbody" maxlength="1000" rows="6" aria-label="내 답" required>${esc(mine.body)}</textarea>`);
    s.form.onsubmit = async e => { e.preventDefault(); const v = s.form.body.value.trim(); if (!v) return; s.close(); save(v); };
  };
}

function shareCard(s) {
  const n = s.qt_share_comments?.[0]?.count || 0;
  return `
    <a class="dcard scard" href="#/qt/${s.id}">
      <div class="dhead"><b>${esc(shareTitle(s))}</b>${whoTag(s.author_id)}<span class="dtime">· ${qtDate(s.share_date)}</span></div>
      <p class="dprev">${esc(s.body)}</p>
      ${n ? `<div class="dcount">${icon('comment')}${n}</div>` : ''}
    </a>`;
}

// 지난 질문 카드: 날짜별로 둘의 답을 모아 본다. 내가 답하지 않은 날의 상대 답은 가려 둔다.
async function renderQtCards() {
  setHeader('지난 질문 카드', { back: true });
  backBtn.onclick = () => { location.hash = '#/qt'; };
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const { data, error } = await sb.from('qt_answers').select('user_id, q_date, question, body').order('q_date', { ascending: false }).limit(400);
  if (location.hash !== '#/qt/cards') return;
  if (error) { view.innerHTML = `<div class="blank">${esc(koError(error))}</div>`; return; }
  const days = new Map();
  for (const r of data) { if (!days.has(r.q_date)) days.set(r.q_date, []); days.get(r.q_date).push(r); }
  if (!days.size) { view.innerHTML = '<div class="empty"><b>아직 카드가 없어요</b><p>오늘의 질문에 답하면 여기에 쌓여요.</p></div>'; return; }
  view.innerHTML = `<p class="hint">모은 카드 ${days.size}장</p>` + [...days].map(([date, rows]) => {
    const mine = rows.find(r => r.user_id === state.user.id), theirs = rows.find(r => r.user_id !== state.user.id);
    return `
      <section class="qcard past">
        <small class="qdate">${qtDate(date)}</small>
        <p class="qq">${esc(rows[0].question)}</p>
        ${mine ? `<div class="qa me">${whoTag(mine.user_id)}<p>${esc(mine.body)}</p></div>` : ''}
        ${theirs ? (mine ? `<div class="qa pt">${whoTag(theirs.user_id)}<p>${esc(theirs.body)}</p></div>` : '<p class="hint">내가 답하지 않은 날이라 상대방의 답은 가려져 있어요.</p>') : ''}
      </section>`;
  }).join('');
}

// 나눔 보관함: 전체를 달마다 묶어 보여 주고, 성경 책이나 낱말로 찾는다
async function renderQtShares() {
  setHeader('나눔 보관함', { back: true, action: { icon: 'plus', label: '나눔 쓰기', onClick: () => openShareSheet(null) } });
  backBtn.onclick = () => { location.hash = '#/qt'; };
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const { data, error } = await sb.from('qt_shares').select(`${SHARE_COLS}, qt_share_comments(count)`).order('share_date', { ascending: false }).order('created_at', { ascending: false }).limit(1000);
  if (location.hash !== '#/qt/shares') return;
  if (error) { view.innerHTML = `<div class="blank">${esc(koError(error))}</div>`; return; }
  if (!data.length) { view.innerHTML = '<div class="empty"><b>아직 나눔이 없어요</b><p>오른쪽 위 + 버튼으로 첫 나눔을 남겨 보세요.</p></div>'; return; }
  const used = [...new Set(data.map(s => s.book).filter(Boolean))].sort((a, b) => a - b);
  view.innerHTML = `
    <div class="sfilter">
      <select id="sBook" aria-label="성경 책으로 찾기"><option value="">모든 책</option>${used.map(n => `<option value="${n}">${BOOKS[n - 1].name}</option>`).join('')}</select>
      <select id="sWho" aria-label="쓴 사람"><option value="">둘 다</option><option value="me">내가 쓴 것</option><option value="pt">상대가 쓴 것</option></select>
      <input id="sText" type="search" placeholder="낱말로 찾기" aria-label="낱말로 찾기">
    </div>
    <div id="sList"></div>`;
  const draw = () => {
    const book = +document.getElementById('sBook').value, who = document.getElementById('sWho').value, text = document.getElementById('sText').value.trim();
    const rows = data.filter(s => (!book || s.book === book)
      && (!who || (who === 'me') === (s.author_id === state.user.id))
      && (!text || (shareTitle(s) + ' ' + s.body).includes(text)));
    let html = `<p class="hint">나눔 ${rows.length}편</p>`, prev = '';
    for (const s of rows) {
      const m = s.share_date.slice(0, 7);
      if (m !== prev) { html += `<h2 class="daytitle">${+m.slice(0, 4)}년 ${+m.slice(5)}월</h2>`; prev = m; }
      html += shareCard(s);
    }
    document.getElementById('sList').innerHTML = html;
  };
  ['sBook', 'sWho', 'sText'].forEach(id => { document.getElementById(id).oninput = draw; });
  draw();
}

// 나눔 한 편과 댓글
async function renderQtShare(id) {
  setHeader('나눔', { back: true });
  const back = () => { backBtn.onclick = () => { history.length > 1 ? history.back() : (location.hash = '#/qt'); }; };
  back();
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const [d, c] = await Promise.all([
    sb.from('qt_shares').select(SHARE_COLS).eq('id', id).maybeSingle(),
    sb.from('qt_share_comments').select('id, author_id, body, created_at').eq('share_id', id).order('created_at'),
  ]);
  if (location.hash !== '#/qt/' + id) return;
  const s = d.data;
  if (d.error || !s) { view.innerHTML = `<div class="blank">${d.error ? esc(koError(d.error)) : '삭제되었거나 없는 나눔입니다.'}</div>`; return; }
  if (s.author_id === state.user.id) { setHeader('나눔', { back: true, action: { icon: 'edit', label: '나눔 수정', onClick: () => openShareSheet(s) } }); back(); }
  const cTime = iso => { const t = new Date(iso); return `${t.getMonth() + 1}월 ${t.getDate()}일 ${fmtTime(`${t.getHours()}:${t.getMinutes()}`)}`; };
  view.innerHTML = `
    <article class="dfull">
      <div class="dmeta">${qtDate(s.share_date)}</div>
      <h2>${esc(shareTitle(s))}</h2>
      <div class="dmeta">${whoTag(s.author_id)}</div>
      <p class="dbody">${esc(s.body)}</p>
    </article>
    <h2 class="daytitle">댓글 ${c.data?.length || 0}</h2>
    ${(c.data || []).map(x => `
      <div class="cmt">
        <div class="cmeta">${whoTag(x.author_id)}<span class="dtime">· ${cTime(x.created_at)}</span>
          ${x.author_id === state.user.id ? `<button class="cdel" data-id="${x.id}" aria-label="댓글 삭제">${icon('close')}</button>` : ''}</div>
        <p>${esc(x.body)}</p>
      </div>`).join('')}
    <form class="cform" id="cForm">
      <input name="body" maxlength="500" placeholder="댓글 남기기" aria-label="댓글" autocomplete="off" required>
      <button class="btn small" type="submit">등록</button>
    </form>
    <p class="msg" id="msg" role="alert"></p>`;
  const msg = document.getElementById('msg');
  document.getElementById('cForm').onsubmit = async e => {
    e.preventDefault();
    const body = e.target.body.value.trim();
    if (!body) return;
    const btn = e.target.querySelector('.btn'); btn.disabled = true;
    const { error } = await sb.from('qt_share_comments').insert({ share_id: id, body });
    btn.disabled = false;
    if (error) { msg.textContent = koError(error); return; }
    notifyPartner('나눔에 댓글을 남겼어요', body, '#/qt/' + id);
    const y = window.scrollY; await renderQtShare(id); window.scrollTo(0, y);
  };
  view.querySelectorAll('.cdel').forEach(b => { b.onclick = async () => {
    if (!confirm('이 댓글을 삭제할까요?')) return;
    const { error } = await sb.from('qt_share_comments').delete().eq('id', b.dataset.id);
    if (error) { msg.textContent = koError(error); return; }
    renderQtShare(id);
  }; });
}

// 나눔 쓰기 / 수정
function openShareSheet(s) {
  const sh = makeSheet(s ? '나눔 수정' : '나눔 쓰기', `
    <div class="rowline">날짜<span><input type="date" name="date" value="${s?.share_date || toISO(today0())}" aria-label="날짜" required></span></div>
    <div class="rowline">본문<span class="spass">
      <select name="book" aria-label="성경 책"><option value="">책 선택</option>${BOOKS.map(b => `<option value="${b.no}" ${s?.book === b.no ? 'selected' : ''}>${b.name}</option>`).join('')}</select>
      <input name="passage" maxlength="60" placeholder="예: 3장 16-21절" value="${esc(s?.passage || '')}" aria-label="장과 절"></span></div>
    <textarea name="body" class="plainbody" maxlength="5000" rows="9" placeholder="말씀을 읽고 느낀 점, 붙잡은 것, 적용할 것을 나눠 보세요." aria-label="나눔 내용" required>${esc(s?.body || '')}</textarea>`,
    !!s, '이 나눔 삭제');
  sh.form.classList.add('tall');
  sh.form.onsubmit = async e => {
    e.preventDefault();
    const row = { share_date: sh.form.date.value, book: +sh.form.book.value || null, passage: sh.form.passage.value.trim(), body: sh.form.body.value.trim() };
    if (!row.body) { sh.msg.textContent = '나눔 내용을 적어 주세요.'; return; }
    const btn = sh.form.querySelector('.ok'); btn.disabled = true;
    const { error } = s ? await sb.from('qt_shares').update(row).eq('id', s.id) : await sb.from('qt_shares').insert(row);
    if (error) { btn.disabled = false; sh.msg.textContent = koError(error); return; }
    if (!s) notifyPartner('QT 나눔을 올렸어요', shareTitle(row), '#/qt');
    sh.close();
    s ? renderQtShare(s.id) : route();
  };
  if (sh.del) sh.del.onclick = async () => {
    if (!confirm('이 나눔을 삭제할까요? 댓글도 함께 지워집니다.')) return;
    const { error } = await sb.from('qt_shares').delete().eq('id', s.id);
    if (error) { sh.msg.textContent = koError(error); return; }
    sh.close(); location.hash = '#/qt/shares';
  };
}
