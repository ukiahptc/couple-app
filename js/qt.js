// ───────── QT 나눔 ─────────
// #/qt 나눔 보관함(전체 목록과 찾기), #/qt/<나눔 id> 나눔 한 편
const SHARE_COLS = 'id, author_id, share_date, book, passage, body, created_at';
const shareTitle = s => [s.book ? BOOKS[s.book - 1].name : '', s.passage].filter(Boolean).join(' ') || '나눔';
const qtDate = iso => { const d = parseDate(iso); return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()} (${WEEK[d.getDay()]})`; };

async function renderQt(param) {
  return param ? renderQtShare(param) : renderQtShares();
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

// 나눔 보관함: 전체를 달마다 묶어 보여 주고, 성경 책이나 낱말로 찾는다
async function renderQtShares() {
  setHeader('QT 나눔', { back: true, action: { icon: 'plus', label: '나눔 쓰기', onClick: () => openShareSheet(null) } });
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const { data, error } = await sb.from('qt_shares').select(`${SHARE_COLS}, qt_share_comments(count)`).order('share_date', { ascending: false }).order('created_at', { ascending: false }).limit(1000);
  if (location.hash !== '#/qt') return;
  if (error) { view.innerHTML = `<div class="blank">${esc(koError(error))}</div>`; return; }
  if (!data.length) { view.innerHTML = '<div class="empty"><b>아직 나눔이 없어요</b><p>QT를 하고 느낀 점을 오른쪽 위 + 버튼으로 남겨 보세요.</p></div>'; return; }
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
  const back = () => { backBtn.onclick = () => { location.hash = '#/qt'; }; };
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
    sh.close(); location.hash = '#/qt';
  };
}
