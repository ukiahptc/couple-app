// ───────── 디데이 ─────────
// 날짜는 모두 'YYYY-MM-DD' 글자로 저장하고, 계산할 때만 Date로 바꾼다.
const DAY_MS = 86400000;
const parseDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today0 = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
const toISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmtDate = d => `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
const diffDays = (a, b) => Math.round((a - b) / DAY_MS);
// 남은 날 수 → 'D-18', '오늘', 'D+3'
const ddayLabel = n => (n === 0 ? '오늘' : n > 0 ? `D-${n}` : `D+${-n}`);

// 사귄 날부터 오늘까지 며칠째인지 (사귄 날 = 1일째)
function daysTogether(startISO) {
  return diffDays(today0(), parseDate(startISO)) + 1;
}

// 사귄 날로 자동 계산되는 기념일: 다가오는 100일 단위 3개 + 다음 주년 1개
function autoMilestones(startISO) {
  const start = parseDate(startISO), today = today0();
  const days = daysTogether(startISO);
  const list = [];
  if (days < 1) return list;                      // 사귄 날이 미래면 계산하지 않는다
  const first = Math.ceil(days / 100) * 100;      // 오늘이 딱 100일 단위면 오늘 포함
  for (let k = first; k < first + 300; k += 100) {
    const d = new Date(start); d.setDate(d.getDate() + k - 1);
    list.push({ title: `${k}일`, date: d, auto: true });
  }
  for (let n = 1; n < 200; n++) {
    const d = new Date(start.getFullYear() + n, start.getMonth(), start.getDate());
    if (d >= today) { list.push({ title: `${n}주년`, date: d, auto: true }); break; }
  }
  return list;
}

// 직접 등록한 기념일의 다음 날짜 (매년 반복이면 올해 또는 내년)
function nextOccurrence(row) {
  const d = parseDate(row.date), today = today0();
  if (!row.repeat_yearly) return d;
  const n = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  if (n < today) n.setFullYear(n.getFullYear() + 1);
  return n;
}

// 홈 화면에 보여 줄 가장 가까운 자동 기념일 한 줄
function nextMilestoneText(startISO) {
  const m = autoMilestones(startISO).sort((a, b) => a.date - b.date)[0];
  return m ? `다음 기념일 ${m.title} · ${ddayLabel(diffDays(m.date, today0()))}` : '';
}

async function renderDday() {
  setHeader('디데이', { back: true });
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';

  const { data: rows, error } = await sb.from('anniversaries')
    .select('id, title, date, repeat_yearly').order('date');
  if (location.hash !== '#/dday') return;          // 불러오는 사이 다른 화면으로 갔으면 그리지 않는다
  drawDday(rows || [], error);
}

// editing: 열려 있는 입력 폼. null | 'start' | 'new' | 기념일 id
function drawDday(rows, loadError, editing = null) {
  const sd = state.couple.start_date;
  const today = today0();
  const redraw = e => drawDday(rows, loadError, e);

  const custom = rows.map(r => ({ ...r, title: r.title, date: nextOccurrence(r), row: r }));
  const all = [...(sd ? autoMilestones(sd) : []), ...custom]
    .map(x => ({ ...x, left: diffDays(x.date, today) }));
  const upcoming = all.filter(x => x.left >= 0).sort((a, b) => a.left - b.left);
  const past = all.filter(x => x.left < 0).sort((a, b) => b.left - a.left);

  const line = x => `
    <li class="drow">
      <div class="dmain">
        <div class="t">${esc(x.title)}${x.row?.repeat_yearly ? ' <span class="tag">매년</span>' : ''}</div>
        <div class="d">${fmtDate(x.date)}</div>
      </div>
      <div class="dleft ${x.left === 0 ? 'now' : ''}">${ddayLabel(x.left)}</div>
      ${x.row ? `<button class="iconbtn edit" data-id="${x.row.id}" aria-label="${esc(x.title)} 수정">${icon('edit')}</button>` : '<span class="iconbtn"></span>'}
    </li>`;

  const startForm = `
    <form class="form inline" id="startForm">
      <label>우리가 만난 날<input type="date" name="date" value="${sd || ''}" max="${toISO(today)}" required></label>
      <p class="msg" id="msg" role="alert"></p>
      <div class="btns"><button class="btn" type="submit">저장</button>
      <button class="btn ghost" type="button" data-cancel>취소</button></div>
    </form>`;

  const editRow = rows.find(r => r.id === editing);
  const annForm = (editing === 'new' || editRow) ? `
    <form class="form inline" id="annForm">
      <label>이름<input name="title" maxlength="30" value="${esc(editRow?.title || '')}" placeholder="예: 첫 여행" required></label>
      <label>날짜<input type="date" name="date" value="${editRow?.date || ''}" required></label>
      <label class="check"><input type="checkbox" name="repeat" ${editRow?.repeat_yearly ? 'checked' : ''}> 매년 돌아오는 날 (생일 등)</label>
      <p class="msg" id="msg" role="alert"></p>
      <div class="btns"><button class="btn" type="submit">저장</button>
      <button class="btn ghost" type="button" data-cancel>취소</button></div>
      ${editRow ? '<button class="link danger" type="button" id="delBtn">이 기념일 삭제</button>' : ''}
    </form>` : '';

  view.innerHTML = `
    ${editing === 'start' ? startForm : `
    <section class="startday">
      <div>
        <div class="d">우리가 만난 날</div>
        <div class="big">${sd ? fmtDate(parseDate(sd)) : '아직 설정하지 않았어요'}</div>
        ${sd ? `<div class="d">오늘로 ${daysTogether(sd)}일째</div>` : ''}
      </div>
      <button class="btn ghost small" id="startBtn">${sd ? '변경' : '설정'}</button>
    </section>`}

    <h2 class="sec">다가오는 날</h2>
    ${loadError ? `<div class="blank">기념일 목록을 불러오지 못했습니다. (${esc(koError(loadError))})</div>` : ''}
    ${upcoming.length ? `<ul class="dlist">${upcoming.map(line).join('')}</ul>`
      : '<div class="blank">만난 날을 설정하면 100일 단위 기념일이 자동으로 나와요</div>'}

    ${annForm || '<button class="btn ghost add" id="addBtn">기념일 추가</button>'}

    ${past.length ? `<h2 class="sec">지난 날</h2><ul class="dlist">${past.map(line).join('')}</ul>` : ''}`;

  // 폼이 열리면 화면 가운데로 보이게 한다
  const openForm = view.querySelector('form');
  if (openForm) openForm.scrollIntoView({ block: 'center' });

  const msg = () => document.getElementById('msg');
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
  on('startBtn', () => redraw('start'));
  on('addBtn', () => redraw('new'));
  view.querySelectorAll('[data-cancel]').forEach(b => { b.onclick = () => redraw(null); });
  view.querySelectorAll('.edit').forEach(b => { b.onclick = () => redraw(b.dataset.id); });

  // 만난 날 저장
  const sf = document.getElementById('startForm');
  if (sf) sf.onsubmit = async e => {
    e.preventDefault();
    const date = new FormData(sf).get('date');
    const btn = sf.querySelector('.btn'); btn.disabled = true;
    const { error } = await sb.from('couples').update({ start_date: date }).eq('id', state.couple.id);
    btn.disabled = false;
    if (error) { msg().textContent = koError(error); return; }
    state.couple.start_date = date;
    redraw(null);
  };

  // 기념일 추가 / 수정
  const af = document.getElementById('annForm');
  if (af) af.onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(af);
    const values = { title: f.get('title').trim(), date: f.get('date'), repeat_yearly: f.get('repeat') === 'on' };
    if (!values.title) { msg().textContent = '이름을 입력해 주세요.'; return; }
    const btn = af.querySelector('.btn'); btn.disabled = true;
    const q = editRow
      ? sb.from('anniversaries').update(values).eq('id', editRow.id)
      : sb.from('anniversaries').insert(values);
    const { error } = await q;
    btn.disabled = false;
    if (error) { msg().textContent = koError(error); return; }
    if (!editRow) notifyPartner('기념일을 추가했어요', values.title, '#/dday');
    renderDday();
  };

  on('delBtn', async () => {
    if (!confirm(`'${editRow.title}'을(를) 삭제할까요?`)) return;
    const { error } = await sb.from('anniversaries').delete().eq('id', editRow.id);
    if (error) { msg().textContent = koError(error); return; }
    renderDday();
  });
}
