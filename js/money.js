// ───────── 데이트 가계부 ─────────
// 지출은 '데이트' 단위로 묶는다. 데이트 하나 안에 지출 항목이 여러 개 들어간다.
const MONEY_CATS = [
  ['식사', '🍽️'], ['카페/디저트', '☕'], ['술', '🍶'], ['영화/공연', '🎬'], ['액티비티', '🎢'],
  ['교통', '🚕'], ['숙박', '🏨'], ['쇼핑', '🛍️'], ['선물', '🎁'], ['기타', '🧾'],
];
const catEmoji = name => (MONEY_CATS.find(c => c[0] === name) || MONEY_CATS[MONEY_CATS.length - 1])[1];
const won = n => `${Number(n).toLocaleString('ko-KR')}원`;
const sumOf = list => list.reduce((a, x) => a + x.amount, 0);
// '11월 24일' 또는 '11월 24일 ~ 26일'
function dateRange(s, e) {
  const a = parseDate(s), b = parseDate(e), md = d => `${d.getMonth() + 1}월 ${d.getDate()}일`;
  if (s === e) return md(a);
  return a.getMonth() === b.getMonth() ? `${md(a)} ~ ${b.getDate()}일` : `${md(a)} ~ ${md(b)}`;
}
// 그 데이트에서 돈을 가장 많이 쓴 분류의 그림
function topEmoji(expenses) {
  const by = {};
  for (const x of expenses) by[x.category] = (by[x.category] || 0) + x.amount;
  const top = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
  return top ? catEmoji(top[0]) : '🗓️';
}
// 이번 달에 시작한 데이트들의 지출 합계
function monthTotal(dates) {
  const ym = toISO(today0()).slice(0, 7);
  return sumOf(dates.filter(d => d.start_date.startsWith(ym)).flatMap(d => d.money_expenses || []));
}

async function renderMoney(id) {
  if (id) return renderMoneyDate(id);
  setHeader('데이트 가계부', { back: true });
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const { data, error } = await sb.from('money_dates')
    .select('id, title, start_date, end_date, money_expenses(amount, category)')
    .order('start_date', { ascending: false }).order('created_at', { ascending: false });
  if (location.hash !== '#/money') return;
  if (error) { view.innerHTML = `<div class="blank">가계부를 불러오지 못했습니다. (${esc(koError(error))})</div>`; return; }

  let list = '', prev = null;
  for (const d of data) {
    const ym = d.start_date.slice(0, 7);
    if (ym !== prev) { const [y, m] = ym.split('-'); list += `<h2 class="mmonth">${y}년 ${Number(m)}월</h2>`; prev = ym; }
    list += `
      <a class="mcard" href="#/money/${d.id}">
        <span class="memoji">${topEmoji(d.money_expenses)}</span>
        <span class="mmain"><b>${esc(d.title)}</b><small>${dateRange(d.start_date, d.end_date)}</small></span>
        <span class="mamt">${won(sumOf(d.money_expenses))}</span>
      </a>`;
  }
  view.innerHTML = `
    <section class="mtotal"><small>이번 달 데이트 지출</small><b>${won(monthTotal(data))}</b></section>
    ${list || '<div class="blank">아직 기록한 데이트가 없어요</div>'}
    <div class="bottombar"><button class="btn ghost wide" id="addDate">데이트 추가</button></div>`;
  document.getElementById('addDate').onclick = () => openMoneyDateSheet(null);
}

async function renderMoneyDate(id) {
  const back = () => { backBtn.onclick = () => { location.hash = '#/money'; }; };
  setHeader('데이트 가계부', { back: true }); back();
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const { data: d, error } = await sb.from('money_dates')
    .select('id, title, start_date, end_date, money_expenses(id, payer_id, amount, title, category, created_at)')
    .eq('id', id).maybeSingle();
  if (location.hash !== '#/money/' + id) return;
  if (error || !d) { view.innerHTML = `<div class="blank">${error ? esc(koError(error)) : '삭제되었거나 없는 데이트입니다.'}</div>`; return; }
  setHeader('데이트 가계부', { back: true, action: { icon: 'edit', label: '데이트 수정', onClick: () => openMoneyDateSheet(d) } }); back();

  const items = [...d.money_expenses].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const names = ownerNames();
  const payer = x => (!x.payer_id ? '함께' : x.payer_id === state.user.id ? names.me : names.pt || '상대');
  view.innerHTML = `
    <div class="mtitle2"><span class="memoji big">${topEmoji(items)}</span><div><h2>${esc(d.title)}</h2><small>${dateRange(d.start_date, d.end_date)}</small></div></div>
    <section class="mtotal"><small>총 지출</small><b>${won(sumOf(items))}</b></section>
    ${items.length ? items.map((x, i) => `
      <button class="mrow" data-i="${i}">
        <span class="memoji">${catEmoji(x.category)}</span>
        <span class="mmain"><b>${esc(x.title)}</b><small>${esc(x.category)}</small></span>
        <span class="mamt">${won(x.amount)}<small>${esc(payer(x))}</small></span>
      </button>`).join('') : '<div class="blank">아직 적은 지출이 없어요</div>'}
    <div class="bottombar"><button class="btn ghost wide" id="addExp">지출 추가</button></div>`;
  document.getElementById('addExp').onclick = () => openExpenseSheet(d.id, null);
  view.querySelectorAll('.mrow').forEach(b => { b.onclick = () => openExpenseSheet(d.id, items[Number(b.dataset.i)]); });
}

// 시트 공통: 만들고, 닫는 함수를 돌려준다
function makeSheet(titleText, bodyHtml, hasDelete, delLabel) {
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.innerHTML = `
    <form class="sheetbody form" role="dialog" aria-modal="true" aria-label="${titleText}">
      <div class="sheethead">
        <button type="button" class="roundbtn" id="shClose" aria-label="닫기">${icon('close')}</button>
        <b>${titleText}</b>
        <button type="submit" class="roundbtn ok" aria-label="저장">${icon('check')}</button>
      </div>
      ${bodyHtml}
      <p class="msg" id="shMsg" role="alert"></p>
      ${hasDelete ? `<button type="button" class="link danger" id="shDel">${delLabel}</button>` : ''}
    </form>`;
  document.body.appendChild(sheet);
  document.body.classList.add('noscroll');
  const close = () => { sheet.remove(); document.body.classList.remove('noscroll'); };
  sheet.querySelector('#shClose').onclick = close;
  sheet.onclick = e => { if (e.target === sheet) close(); };
  return { sheet, form: sheet.querySelector('form'), msg: sheet.querySelector('#shMsg'), close, del: sheet.querySelector('#shDel') };
}

// 데이트 추가 / 수정
function openMoneyDateSheet(d) {
  const today = toISO(today0());
  const s = makeSheet(d ? '데이트 수정' : '데이트 추가', `
    <input name="title" class="titleinput" maxlength="40" placeholder="데이트 이름 (예: 성수 데이트)" value="${esc(d?.title || '')}" aria-label="데이트 이름" required>
    <div class="rowline">시작일<input type="date" name="sd" value="${d?.start_date || today}" aria-label="시작일" required></div>
    <div class="rowline">종료일<input type="date" name="ed" value="${d?.end_date || today}" aria-label="종료일" required></div>`,
    !!d, '이 데이트 삭제');
  const { form, msg } = s;
  form.sd.onchange = () => { if (form.ed.value < form.sd.value) form.ed.value = form.sd.value; };
  form.onsubmit = async e => {
    e.preventDefault();
    const row = { title: form.title.value.trim(), start_date: form.sd.value, end_date: form.ed.value };
    if (!row.title) { msg.textContent = '데이트 이름을 입력해 주세요.'; return; }
    if (row.end_date < row.start_date) { msg.textContent = '종료일이 시작일보다 빠릅니다.'; return; }
    const btn = form.querySelector('.ok'); btn.disabled = true;
    const q = d ? sb.from('money_dates').update(row).eq('id', d.id).select('id').single()
      : sb.from('money_dates').insert(row).select('id').single();
    const { data, error } = await q;
    btn.disabled = false;
    if (error) { msg.textContent = koError(error); return; }
    s.close();
    // 새로 만들었으면 바로 그 데이트 안으로 들어가 지출을 적게 한다
    if (!d) notifyPartner('데이트 가계부를 추가했어요', row.title, '#/money/' + data.id);
    if (d) renderMoneyDate(d.id); else location.hash = '#/money/' + data.id;
  };
  if (s.del) s.del.onclick = async () => {
    if (!confirm(`'${d.title}'을(를) 삭제할까요? 안에 적은 지출도 함께 지워집니다.`)) return;
    const { error } = await sb.from('money_dates').delete().eq('id', d.id);
    if (error) { msg.textContent = koError(error); return; }
    s.close(); location.hash = '#/money';
  };
  form.title.focus();
}

// 지출 추가 / 수정
function openExpenseSheet(dateId, x) {
  const names = ownerNames();
  let payer = !x ? 'us' : !x.payer_id ? 'us' : x.payer_id === state.user.id ? 'me' : 'pt';
  let cat = x?.category || '';
  const s = makeSheet(x ? '지출 수정' : '지출 추가', `
    <div class="ownrow" id="shPayer"></div>
    <div class="amtbox"><input name="amount" inputmode="numeric" placeholder="0" value="${x ? x.amount.toLocaleString('ko-KR') : ''}" aria-label="금액" autocomplete="off" required><span>원</span></div>
    <input name="title" class="titleinput" maxlength="40" placeholder="무엇에 썼나요?" value="${esc(x?.title || '')}" aria-label="내용" required>
    <div class="catgrid" id="shCats"></div>`, !!x, '이 지출 삭제');
  const { sheet, form, msg } = s;

  const drawPayer = () => {
    const label = { me: names.me, pt: names.pt, us: '함께' };
    sheet.querySelector('#shPayer').innerHTML = ['me', 'pt', 'us'].filter(k => label[k]).map(k =>
      `<button type="button" class="ownchip ${k} ${payer === k ? 'on' : ''}" data-p="${k}" aria-pressed="${payer === k}">${esc(label[k])}</button>`).join('');
    sheet.querySelectorAll('[data-p]').forEach(b => { b.onclick = () => { payer = b.dataset.p; drawPayer(); }; });
  };
  const drawCats = () => {
    sheet.querySelector('#shCats').innerHTML = MONEY_CATS.map(([name, emoji]) =>
      `<button type="button" class="catbtn ${cat === name ? 'on' : ''}" data-c="${name}" aria-pressed="${cat === name}"><span>${emoji}</span>${name}</button>`).join('');
    sheet.querySelectorAll('[data-c]').forEach(b => { b.onclick = () => { cat = b.dataset.c; drawCats(); }; });
  };
  drawPayer(); drawCats();

  // 금액 칸: 숫자만 받고 세 자리마다 쉼표를 찍는다
  form.amount.oninput = () => {
    const n = form.amount.value.replace(/[^0-9]/g, '').slice(0, 9);
    form.amount.value = n ? Number(n).toLocaleString('ko-KR') : '';
  };

  form.onsubmit = async e => {
    e.preventDefault();
    const amount = Number(form.amount.value.replace(/[^0-9]/g, ''));
    const row = {
      date_id: dateId, amount, title: form.title.value.trim(), category: cat || '기타',
      payer_id: payer === 'us' ? null : payer === 'me' ? state.user.id : names.ptId,
    };
    if (!amount) { msg.textContent = '금액을 입력해 주세요.'; return; }
    if (!row.title) { msg.textContent = '무엇에 썼는지 입력해 주세요.'; return; }
    const btn = form.querySelector('.ok'); btn.disabled = true;
    const { error } = x ? await sb.from('money_expenses').update(row).eq('id', x.id) : await sb.from('money_expenses').insert(row);
    btn.disabled = false;
    if (error) { msg.textContent = koError(error); return; }
    if (!x) notifyPartner('지출을 적었어요', `${row.title} ${won(amount)}`, '#/money/' + dateId);
    s.close(); renderMoneyDate(dateId);
  };
  if (s.del) s.del.onclick = async () => {
    if (!confirm(`'${x.title}' ${won(x.amount)}을 삭제할까요?`)) return;
    const { error } = await sb.from('money_expenses').delete().eq('id', x.id);
    if (error) { msg.textContent = koError(error); return; }
    s.close(); renderMoneyDate(dateId);
  };
  form.amount.focus();
}
