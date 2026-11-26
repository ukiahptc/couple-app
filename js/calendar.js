// ───────── 커플 캘린더 ─────────
// 일정의 날짜와 시간은 'YYYY-MM-DD', 'HH:MM' 글자 그대로 저장한다 (시간대 변환 없음).
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const REPEAT_LABEL = { none: '안 함', weekly: '매주', monthly: '매월', yearly: '매년' };

// 화면이 바뀌어도 기억할 캘린더 상태
const cal = { y: null, m: null, sel: null, filter: { me: true, pt: true, us: true }, events: [], anns: [] };

// 'HH:MM' → '오후 8:00'
function fmtTime(t) {
  const [h, m] = t.split(':').map(Number);
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')}`;
}

// 누구 일정인지: 'me' 나 / 'pt' 상대 / 'us' 우리
function ownerKey(ownerId) {
  if (!ownerId) return 'us';
  return ownerId === state.user.id ? 'me' : 'pt';
}
function ownerNames() {
  const me = state.members.find(m => m.user_id === state.user.id);
  const pt = state.members.find(m => m.user_id !== state.user.id);
  return { me: me?.nickname || '나', pt: pt?.nickname || null, us: '우리', ptId: pt?.user_id || null };
}

// 이 일정이 base 날짜에 '시작'하는지 (반복 규칙 포함)
function startsOn(ev, base) {
  const start = parseDate(ev.start_date);
  if (base < start) return false;
  switch (ev.repeat_rule) {
    case 'weekly':  return diffDays(base, start) % 7 === 0;
    case 'monthly': return base.getDate() === start.getDate();
    case 'yearly':  return base.getDate() === start.getDate() && base.getMonth() === start.getMonth();
    default:        return base.getTime() === start.getTime();
  }
}

// 이 일정이 date 날짜에 걸쳐 있는지 (여러 날 일정이면 기간 안의 모든 날)
function occursOn(ev, date) {
  const span = Math.min(diffDays(parseDate(ev.end_date), parseDate(ev.start_date)), 60);
  for (let k = 0; k <= span; k++) {
    const base = new Date(date); base.setDate(base.getDate() - k);
    if (startsOn(ev, base)) return true;
  }
  return false;
}

// 그날 보여 줄 것들: 일정 + 기념일. 시간 순으로 정렬한다.
function itemsOn(date, events, anns, filter) {
  const list = events.filter(ev => (!filter || filter[ownerKey(ev.owner_id)]) && occursOn(ev, date))
    .map(ev => ({ kind: 'event', key: ownerKey(ev.owner_id), title: ev.title, time: ev.start_time?.slice(0, 5) || '', ev }));
  if (!filter || filter.us) {
    for (const a of anns) if (a.date.getTime() === date.getTime()) list.push({ kind: 'ann', key: 'us', title: a.title, time: '' });
  }
  return list.sort((a, b) => a.time.localeCompare(b.time));
}

// 달력에 표시할 기념일 (자동 계산 + 직접 등록). from~to 사이 해마다 반복되는 날도 펼친다.
function annsForRange(rows, from, to) {
  const out = [], sd = state.couple.start_date;
  if (sd) {
    const start = parseDate(sd);
    for (let k = 100; ; k += 100) {
      const d = new Date(start); d.setDate(d.getDate() + k - 1);
      if (d > to) break;
      if (d >= from) out.push({ title: `${k}일`, date: d });
    }
    for (let y = from.getFullYear(); y <= to.getFullYear(); y++) {
      const d = new Date(y, start.getMonth(), start.getDate());
      if (y > start.getFullYear() && d >= from && d <= to) out.push({ title: `${y - start.getFullYear()}주년`, date: d });
    }
  }
  for (const r of rows) {
    const base = parseDate(r.date);
    if (!r.repeat_yearly) { if (base >= from && base <= to) out.push({ title: r.title, date: base }); continue; }
    for (let y = from.getFullYear(); y <= to.getFullYear(); y++) {
      const d = new Date(y, base.getMonth(), base.getDate());
      if (d >= from && d <= to) out.push({ title: r.title, date: d });
    }
  }
  return out;
}

async function renderCalendar() {
  const t = today0();
  if (cal.y === null) { cal.y = t.getFullYear(); cal.m = t.getMonth(); cal.sel = toISO(t); }
  setHeader('커플 캘린더', { back: true, action: { icon: 'plus', label: '일정 추가', onClick: () => openEventSheet(null) } });
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';

  const [ev, an] = await Promise.all([
    sb.from('events').select('id, owner_id, title, start_date, start_time, end_date, end_time, repeat_rule, memo'),
    sb.from('anniversaries').select('title, date, repeat_yearly'),
  ]);
  if (location.hash !== '#/calendar') return;
  cal.events = ev.data || []; cal.annRows = an.data || [];
  cal.error = ev.error;
  drawCalendar();
}

function drawCalendar() {
  const t = today0(), names = ownerNames();
  const first = new Date(cal.y, cal.m, 1), last = new Date(cal.y, cal.m + 1, 0);
  const gridStart = new Date(first); gridStart.setDate(1 - first.getDay());          // 그 주 일요일
  const gridEnd = new Date(last); gridEnd.setDate(last.getDate() + 6 - last.getDay()); // 그 주 토요일
  const anns = annsForRange(cal.annRows, gridStart, gridEnd);

  let cells = '';
  for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
    const iso = toISO(d), dow = d.getDay();
    const items = itemsOn(new Date(d), cal.events, anns, cal.filter);
    const cls = ['cell', d.getMonth() !== cal.m ? 'other' : '', dow === 0 ? 'sun' : dow === 6 ? 'sat' : '',
      iso === toISO(t) ? 'today' : '', iso === cal.sel ? 'sel' : ''].join(' ');
    cells += `
      <button class="${cls}" data-date="${iso}" aria-label="${d.getMonth() + 1}월 ${d.getDate()}일, 일정 ${items.length}개">
        <span class="num">${d.getDate()}</span>
        ${items.slice(0, 2).map(x => `<span class="evchip ${x.key}">${esc(x.title)}</span>`).join('')}
        ${items.length > 2 ? `<span class="more">+${items.length - 2}</span>` : ''}
      </button>`;
  }

  const selDate = parseDate(cal.sel);
  const selAnns = annsForRange(cal.annRows, selDate, selDate);
  const selItems = itemsOn(selDate, cal.events, selAnns, cal.filter);
  const chip = (key, label) => label ? `
    <button class="ownchip ${key} ${cal.filter[key] ? 'on' : ''}" data-filter="${key}" aria-pressed="${cal.filter[key]}">${esc(label)}</button>` : '';

  view.innerHTML = `
    <div class="calhead">
      <button class="iconbtn" id="prevM" aria-label="이전 달">${icon('back')}</button>
      <button class="monthbtn" id="todayBtn">${cal.y}년 ${cal.m + 1}월</button>
      <button class="iconbtn" id="nextM" aria-label="다음 달">${icon('chevron')}</button>
    </div>
    <div class="ownrow">${chip('me', names.me)}${chip('pt', names.pt)}${chip('us', names.us)}</div>
    ${cal.error ? `<div class="blank">일정을 불러오지 못했습니다. (${esc(koError(cal.error))})</div>` : ''}
    <div class="calgrid whead">${WEEK.map((w, i) => `<span class="${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}">${w}</span>`).join('')}</div>
    <div class="calgrid">${cells}</div>

    <h2 class="daytitle">${selDate.getMonth() + 1}월 ${selDate.getDate()}일 ${WEEK[selDate.getDay()]}요일</h2>
    ${selItems.length ? selItems.map((x, i) => `
      <button class="evcard ${x.key}" data-i="${i}">
        <span class="evtime">${x.kind === 'ann' ? '기념일' : x.time
          ? `${fmtTime(x.time)}${x.ev.end_time ? `<small>~ ${fmtTime(x.ev.end_time.slice(0, 5))}</small>` : ''}` : '하루 종일'}</span>
        <span class="evtitle">${esc(x.title)}</span>
      </button>`).join('')
      : '<div class="blank">이날은 일정이 없어요</div>'}`;

  const move = n => { const d = new Date(cal.y, cal.m + n, 1); cal.y = d.getFullYear(); cal.m = d.getMonth(); drawCalendar(); };
  document.getElementById('prevM').onclick = () => move(-1);
  document.getElementById('nextM').onclick = () => move(1);
  document.getElementById('todayBtn').onclick = () => { cal.y = t.getFullYear(); cal.m = t.getMonth(); cal.sel = toISO(t); drawCalendar(); };
  view.querySelectorAll('[data-filter]').forEach(b => { b.onclick = () => { cal.filter[b.dataset.filter] = !cal.filter[b.dataset.filter]; drawCalendar(); }; });
  view.querySelectorAll('.cell').forEach(b => { b.onclick = () => {
    cal.sel = b.dataset.date;
    const d = parseDate(cal.sel); cal.y = d.getFullYear(); cal.m = d.getMonth();   // 흐린 날짜를 누르면 그 달로 이동
    const y = window.scrollY; drawCalendar(); window.scrollTo(0, y);
  }; });
  view.querySelectorAll('.evcard').forEach(b => { b.onclick = () => {
    const x = selItems[Number(b.dataset.i)];
    if (x.kind === 'ann') location.hash = '#/dday'; else openEventSheet(x.ev);
  }; });
}

// ───────── 일정 추가 / 수정 화면 (아래에서 올라오는 시트) ─────────
function openEventSheet(ev) {
  const names = ownerNames();
  const v = ev ? { ...ev, start_time: ev.start_time?.slice(0, 5) || '', end_time: ev.end_time?.slice(0, 5) || '' }
    : { owner_id: state.user.id, title: '', start_date: cal.sel, start_time: '09:00', end_date: cal.sel, end_time: '10:00', repeat_rule: 'none', memo: '' };
  let owner = ev ? ownerKey(ev.owner_id) : 'me';
  const allDay = ev ? !ev.start_time : false;

  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.innerHTML = `
    <form class="sheetbody form" role="dialog" aria-modal="true" aria-label="${ev ? '일정 수정' : '일정 추가'}">
      <div class="sheethead">
        <button type="button" class="roundbtn" id="shClose" aria-label="닫기">${icon('close')}</button>
        <b>${ev ? '일정 수정' : '일정 추가'}</b>
        <button type="submit" class="roundbtn ok" aria-label="저장">${icon('check')}</button>
      </div>
      <div class="ownrow" id="shOwner"></div>
      <label class="sr">제목</label>
      <input name="title" class="titleinput" maxlength="60" placeholder="제목" value="${esc(v.title)}" aria-label="제목" required>
      <label class="rowline">하루 종일<input type="checkbox" name="allday" class="switch" ${allDay ? 'checked' : ''}></label>
      <div class="rowline">시작<span><input type="date" name="sd" value="${v.start_date}" aria-label="시작 날짜" required>
        <input type="time" name="st" value="${v.start_time}" aria-label="시작 시간"></span></div>
      <div class="rowline">종료<span><input type="date" name="ed" value="${v.end_date}" aria-label="종료 날짜" required>
        <input type="time" name="et" value="${v.end_time}" aria-label="종료 시간"></span></div>
      <label class="rowline">반복<select name="repeat">${Object.entries(REPEAT_LABEL).map(([k, l]) =>
        `<option value="${k}" ${v.repeat_rule === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <textarea name="memo" maxlength="500" placeholder="메모" aria-label="메모" rows="4">${esc(v.memo || '')}</textarea>
      <p class="msg" id="shMsg" role="alert"></p>
      ${ev ? '<button type="button" class="link danger" id="shDel">이 일정 삭제</button>' : ''}
    </form>`;
  document.body.appendChild(sheet);
  document.body.classList.add('noscroll');
  const form = sheet.querySelector('form'), msg = sheet.querySelector('#shMsg');
  const close = () => { sheet.remove(); document.body.classList.remove('noscroll'); };

  const drawOwner = () => {
    sheet.querySelector('#shOwner').innerHTML = ['me', 'pt', 'us'].filter(k => names[k]).map(k =>
      `<button type="button" class="ownchip ${k} ${owner === k ? 'on' : ''}" data-o="${k}" aria-pressed="${owner === k}">${esc(names[k])}</button>`).join('');
    sheet.querySelectorAll('[data-o]').forEach(b => { b.onclick = () => { owner = b.dataset.o; drawOwner(); }; });
  };
  drawOwner();

  // 하루 종일이면 시간 칸을 숨긴다
  const syncAllDay = () => { const on = form.allday.checked; form.st.hidden = on; form.et.hidden = on; };
  form.allday.onchange = syncAllDay; syncAllDay();
  // 시작 날짜를 종료보다 뒤로 옮기면 종료도 따라간다
  form.sd.onchange = () => { if (form.ed.value < form.sd.value) form.ed.value = form.sd.value; };

  sheet.querySelector('#shClose').onclick = close;
  sheet.onclick = e => { if (e.target === sheet) close(); };

  form.onsubmit = async e => {
    e.preventDefault();
    const on = form.allday.checked;
    const row = {
      owner_id: owner === 'us' ? null : owner === 'me' ? state.user.id : names.ptId,
      title: form.title.value.trim(),
      start_date: form.sd.value, start_time: on ? null : (form.st.value || null),
      end_date: form.ed.value, end_time: on ? null : (form.et.value || null),
      repeat_rule: form.repeat.value, memo: form.memo.value.trim() || null,
    };
    if (!row.title) { msg.textContent = '제목을 입력해 주세요.'; return; }
    if (!on && !row.start_time) { msg.textContent = '시작 시간을 넣거나 하루 종일을 켜 주세요.'; return; }
    if (row.end_date < row.start_date || (row.end_date === row.start_date && row.end_time && row.end_time < row.start_time)) {
      msg.textContent = '종료가 시작보다 빠릅니다.'; return;
    }
    const btn = form.querySelector('.ok'); btn.disabled = true;
    const { error } = ev ? await sb.from('events').update(row).eq('id', ev.id) : await sb.from('events').insert(row);
    btn.disabled = false;
    if (error) { msg.textContent = koError(error); return; }
    cal.sel = row.start_date;
    const d = parseDate(cal.sel); cal.y = d.getFullYear(); cal.m = d.getMonth();
    close(); renderCalendar();
  };

  const del = sheet.querySelector('#shDel');
  if (del) del.onclick = async () => {
    if (!confirm(ev.repeat_rule !== 'none' ? '반복되는 일정 전체가 삭제됩니다. 삭제할까요?' : `'${ev.title}' 일정을 삭제할까요?`)) return;
    const { error } = await sb.from('events').delete().eq('id', ev.id);
    if (error) { msg.textContent = koError(error); return; }
    close(); renderCalendar();
  };
  form.title.focus();
}
