// ───────── 감사 일기: 쪽지 항아리와 주간 감사 카드 ─────────
// #/thanks 항아리와 이번 주 쪽지, #/thanks/<그 주 일요일 날짜> 그 주의 감사 카드
const NOTE_COLORS = ['#ffd0dc', '#fff3b8', '#d6ecff', '#e2f5d0', '#e9defa', '#ffe4c9'];
const weekStart = iso => { const d = parseDate(iso); d.setDate(d.getDate() - d.getDay()); return toISO(d); };   // 주일(일요일)부터 한 주
const weekLabel = ws => { const a = parseDate(ws), b = parseDate(ws); b.setDate(b.getDate() + 6); return `${a.getMonth() + 1}월 ${a.getDate()}일 ~ ${b.getMonth() + 1}월 ${b.getDate()}일`; };
let thanksRows = [];

// 항아리 그림: 쪽지가 쌓일수록 차오른다
function jarSvg(count) {
  const ink = '#3b342c', n = Math.min(count, 36);
  let notes = '';
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 6), col = i % 6, jit = Math.sin((i + 1) * 12.9898) * 43758.5453, r = (jit - Math.floor(jit));
    const x = 42 + col * 20 + (row % 2) * 8 + r * 5, y = 176 - row * 17 - r * 4;
    notes += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="17" height="13" rx="2.500" fill="${NOTE_COLORS[i % 6]}" stroke="${ink}" stroke-width="1.500" transform="rotate(${(r * 50 - 25).toFixed(0)} ${(x + 8).toFixed(1)} ${(y + 6).toFixed(1)})"/>`;
  }
  return `<svg class="jar" viewBox="0 0 200 210" role="img" aria-label="감사 쪽지 ${count}장이 든 항아리">
    <path d="M52 44c-22 12-28 30-28 60v64c0 20 12 30 30 30h92c18 0 30-10 30-30v-64c0-30-6-48-28-60z" fill="rgba(255,255,255,.75)" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
    ${notes}
    <path d="M38 96c0-18 4-30 14-38" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".9"/>
    <rect x="48" y="22" width="104" height="24" rx="8" fill="#d9a877" stroke="${ink}" stroke-width="3"/>
    <path d="M86 46c-8 14-8 22 4 22c-2 8 6 12 10 6c4 6 12 2 10-6c12 0 12-8 4-22" fill="#ff8fab" stroke="${ink}" stroke-width="2.200" stroke-linejoin="round"/>
  </svg>`;
}

async function renderThanks(param) {
  if (param) return renderThanksWeek(param);
  setHeader('감사 일기', { back: true });
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const { data, error } = await sb.from('thanks').select('id, user_id, thank_date, body, created_at').order('thank_date', { ascending: false }).order('created_at', { ascending: false }).limit(3000);
  if (location.hash !== '#/thanks') return;
  thanksRows = data || [];
  drawThanks(error ? koError(error) : '');
}

function thankNote(r, i, canDelete) {
  return `<div class="tnote" style="--c:${NOTE_COLORS[i % 6]};--r:${(i % 3 - 1) * .8}deg">
    <p>${esc(r.body)}</p><small>${whoTag(r.user_id)}${canDelete && r.user_id === state.user.id ? `<button class="cdel" data-id="${r.id}" aria-label="쪽지 삭제">${icon('close')}</button>` : ''}</small></div>`;
}

function drawThanks(msg) {
  const today = toISO(today0()), ws = weekStart(today);
  const mineToday = thanksRows.filter(r => r.thank_date === today && r.user_id === state.user.id).length;
  const week = thanksRows.filter(r => r.thank_date >= ws);
  const weeks = new Map();
  for (const r of thanksRows) { const w = weekStart(r.thank_date); weeks.set(w, (weeks.get(w) || 0) + 1); }
  view.innerHTML = `
    <section class="jarbox">
      ${jarSvg(thanksRows.length)}
      <div><small>우리 감사 항아리</small><b>${thanksRows.length.toLocaleString('ko-KR')}장</b>
        <button class="btn small" id="tPick" ${thanksRows.length ? '' : 'disabled'}>쪽지 하나 뽑기</button></div>
    </section>

    <h2 class="hmark green">오늘의 감사</h2>
    <form id="tForm" class="tform">
      <input name="body" maxlength="200" placeholder="${mineToday ? '하나 더 적어 볼까요?' : '오늘 감사한 일을 한 줄로'}" aria-label="감사한 일" autocomplete="off" required>
      <button class="btn small" type="submit">넣기</button>
    </form>
    <p class="hint">${mineToday ? `오늘 ${mineToday}장을 넣었어요.` : '짧아도 좋아요. 쪽지 한 장마다 믿음 점수 1점이 쌓여요.'}</p>
    <p class="msg" id="tMsg" role="alert">${esc(msg || '')}</p>

    <h2 class="hmark">이번 주 쪽지 ${week.length}장</h2>
    ${week.length ? `<div class="tnotes">${week.map((r, i) => thankNote(r, i, true)).join('')}</div>
      <a class="hli" href="#/thanks/${ws}"><span>이번 주 감사 카드 만들기</span><small>›</small></a>`
      : '<p class="hint">이번 주 첫 감사를 적어 보세요.</p>'}

    ${weeks.size > (week.length ? 1 : 0) ? `<h2 class="hmark">지난 감사 카드</h2>` : ''}
    ${[...weeks].filter(([w]) => w !== ws).map(([w, n]) => `<a class="hli" href="#/thanks/${w}"><span>${weekLabel(w)}</span><small>${n}장 ›</small></a>`).join('')}`;

  const msgEl = document.getElementById('tMsg');
  document.getElementById('tForm').onsubmit = async e => {
    e.preventDefault();
    const body = e.target.body.value.trim();
    if (!body) return;
    const btn = e.target.querySelector('.btn'); btn.disabled = true;
    const { data, error } = await sb.from('thanks').insert({ thank_date: today, body }).select('id, user_id, thank_date, body, created_at').single();
    if (error) { btn.disabled = false; msgEl.textContent = koError(error); return; }
    thanksRows.unshift(data);
    notifyPartner('감사 쪽지를 넣었어요', body, '#/thanks');
    drawThanks();
  };
  document.getElementById('tPick').onclick = () => {
    const r = thanksRows[Math.floor(Math.random() * thanksRows.length)], d = parseDate(r.thank_date);
    const el = document.createElement('div');
    el.className = 'vfull';
    el.innerHTML = `<div class="vcard tpick" role="dialog" aria-label="뽑은 감사 쪽지"><i class="tape"></i>
      <h2>${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일의 감사</h2><p>${esc(r.body)}</p><small>${whoTag(r.user_id)}</small>
      <span class="vsrc">화면을 누르면 닫혀요</span></div>`;
    el.onclick = () => el.remove();
    document.body.appendChild(el);
  };
  view.querySelectorAll('.cdel').forEach(b => { b.onclick = async () => {
    if (!confirm('이 쪽지를 지울까요?')) return;
    const { error } = await sb.from('thanks').delete().eq('id', b.dataset.id);
    if (error) { msgEl.textContent = koError(error); return; }
    thanksRows = thanksRows.filter(r => r.id !== b.dataset.id);
    drawThanks();
  }; });
}

// 한 주의 감사 카드. 이미지로 저장하거나 공유할 수 있다.
async function renderThanksWeek(ws) {
  setHeader('감사 카드', { back: true });
  backBtn.onclick = () => { location.hash = '#/thanks'; };
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const end = parseDate(ws); end.setDate(end.getDate() + 6);
  const { data, error } = await sb.from('thanks').select('id, user_id, thank_date, body, created_at').gte('thank_date', ws).lte('thank_date', toISO(end)).order('thank_date').order('created_at');
  if (location.hash !== '#/thanks/' + ws) return;
  if (error) { view.innerHTML = `<div class="blank">${esc(koError(error))}</div>`; return; }
  const rows = data || [];
  view.innerHTML = `
    <section class="tcard" id="tCard"><i class="tape"></i>
      <h2>우리가 감사한 것들</h2>
      <small class="tweek">${weekLabel(ws)} · ${rows.length}장</small>
      ${rows.length ? rows.map(r => `<div class="tline"><i class="odot ${r.user_id === state.user.id ? 'me' : 'pt'}"></i><p>${esc(r.body)}</p><small>${parseDate(r.thank_date).getDate()}일</small></div>`).join('')
        : '<p class="hint">이 주에는 쪽지가 없어요.</p>'}
      <p class="tverse">범사에 감사하라<br><small>데살로니가전서 5장 18절</small></p>
    </section>
    ${rows.length ? '<button class="btn" id="tSave">이미지로 저장하기</button>' : ''}
    <p class="msg" id="tMsg" role="alert"></p>`;
  const save = document.getElementById('tSave');
  if (save) save.onclick = async () => {
    save.disabled = true;
    try {
      const blob = await thanksImage(ws, rows);
      const file = new File([blob], `감사카드-${ws}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file] });
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
    } catch (e) {
      if (e.name !== 'AbortError') document.getElementById('tMsg').textContent = '이미지를 만들지 못했습니다. ' + (e.message || '');
    }
    save.disabled = false;
  };
}

// 감사 카드를 그림 파일로 그린다 (1080 × 세로는 내용에 맞춤)
async function thanksImage(ws, rows) {
  const W = 1080, PAD = 96, names = ownerNames();
  await Promise.all(['700 72px Gaegu', '400 40px Gaegu', '400 40px "Gowun Dodum"'].map(f => document.fonts.load(f, '감사'))).catch(() => {});
  const cv = document.createElement('canvas'), c = cv.getContext('2d');
  const body = '40px "Gowun Dodum", "Apple SD Gothic Neo", sans-serif';
  c.font = body;
  const wrap = (text, max) => {   // 글자 단위로 줄을 나눈다
    const lines = []; let line = '';
    for (const ch of [...text]) { if (c.measureText(line + ch).width > max && line) { lines.push(line); line = ch.trim() ? ch : ''; } else line += ch; }
    if (line) lines.push(line);
    return lines;
  };
  const shown = rows.slice(0, 14), more = rows.length - shown.length;
  const items = shown.map(r => ({ r, lines: wrap(r.body, W - PAD * 2 - 70) }));
  const listH = items.reduce((a, x) => a + x.lines.length * 58 + 62, 0);
  const H = Math.max(1350, 420 + listH + (more ? 70 : 0) + 260);
  cv.width = W; cv.height = H;
  c.fillStyle = '#fffdf6'; c.fillRect(0, 0, W, H);
  c.strokeStyle = '#f1eee4'; c.lineWidth = 2;
  for (let x = 0; x <= W; x += 54) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
  for (let y = 0; y <= H; y += 54) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.fillStyle = '#fff3b8'; c.fillRect(48, 70, W - 96, H - 130);
  c.save(); c.translate(W / 2, 70); c.rotate(-.03); c.fillStyle = 'rgba(240,150,170,.7)'; c.fillRect(-150, -26, 300, 54); c.restore();
  c.fillStyle = '#3b342c'; c.textBaseline = 'top';
  c.font = '700 76px Gaegu, "Gowun Dodum", sans-serif'; c.fillText('우리가 감사한 것들', PAD, 150);
  c.font = '400 40px Gaegu, "Gowun Dodum", sans-serif'; c.fillStyle = '#6b6154'; c.fillText(`${weekLabel(ws)} · ${rows.length}장`, PAD, 252);
  let y = 350;
  for (const { r, lines } of items) {
    const mine = r.user_id === state.user.id;
    c.fillStyle = mine ? '#ff8fab' : '#6aa9d8'; c.beginPath(); c.arc(PAD + 14, y + 24, 12, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#3b342c'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#3b342c'; c.font = body;
    lines.forEach((ln, i) => c.fillText(ln, PAD + 50, y + i * 58));
    y += lines.length * 58;
    c.fillStyle = '#8a7f70'; c.font = '30px "Gowun Dodum", sans-serif';
    c.fillText(`${names[mine ? 'me' : 'pt'] || ''} · ${parseDate(r.thank_date).getMonth() + 1}월 ${parseDate(r.thank_date).getDate()}일`, PAD + 50, y + 2);
    y += 62;
    c.setLineDash([10, 10]); c.strokeStyle = 'rgba(59,52,44,.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(PAD, y - 12); c.lineTo(W - PAD, y - 12); c.stroke(); c.setLineDash([]);
  }
  if (more) { c.fillStyle = '#8a7f70'; c.font = body; c.fillText(`그리고 ${more}장 더`, PAD + 50, y + 6); }
  c.textAlign = 'center'; c.fillStyle = '#3b342c';
  c.font = '700 56px Gaegu, "Gowun Dodum", sans-serif'; c.fillText('범사에 감사하라', W / 2, H - 250);
  c.font = '32px "Gowun Dodum", sans-serif'; c.fillStyle = '#6b6154'; c.fillText('데살로니가전서 5장 18절', W / 2, H - 178);
  return new Promise((ok, no) => cv.toBlob(b => (b ? ok(b) : no(new Error('빈 그림'))), 'image/png'));
}
