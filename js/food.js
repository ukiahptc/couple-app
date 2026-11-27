// ───────── 맛집 기록장 ─────────
const FOOD_CATS = [['음식점', '🍴'], ['카페', '☕'], ['요리', '🍚'], ['술집', '🍺']];
const foodEmoji = name => (FOOD_CATS.find(c => c[0] === name) || FOOD_CATS[0])[1];
const FOOD_SORTS = { new: '최신순', star: '별점순', name: '이름순' };
const food = { sort: 'new', cat: null, again: false, q: '' };
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.500L12 17.400 6.100 20.500l1.200-6.500L2.500 9.400l6.600-.9z"/></svg>';
const stars = n => `<span class="stars" aria-label="별점 ${n}점">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'on' : ''}">${STAR}</i>`).join('')}</span>`;
const FOOD_COLS = 'id, name, category, again, visit_date, rating, memo, link, photos, created_at';

async function renderFood(id) {
  if (id) return renderFoodDetail(id);
  setHeader('맛집 기록장', { back: true, action: { icon: 'plus', label: '맛집 추가', onClick: () => openFoodSheet(null) } });
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const { data, error } = await sb.from('places').select(FOOD_COLS)
    .order('visit_date', { ascending: false }).order('created_at', { ascending: false });
  if (location.hash !== '#/food') return;
  if (error) { view.innerHTML = `<div class="blank">맛집을 불러오지 못했습니다. (${esc(koError(error))})</div>`; return; }
  const urls = await photoUrls(data.map(p => p.photos[0]).filter(Boolean));
  if (location.hash !== '#/food') return;

  const draw = () => {
    const q = food.q.trim().toLowerCase();
    let rows = data.filter(p => (!food.cat || p.category === food.cat) && (!food.again || p.again)
      && (!q || p.name.toLowerCase().includes(q) || p.memo.toLowerCase().includes(q)));
    if (food.sort === 'star') rows = [...rows].sort((a, b) => b.rating - a.rating);
    if (food.sort === 'name') rows = [...rows].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    document.getElementById('fCount').textContent = `총 ${rows.length}개`;
    document.getElementById('fGrid').innerHTML = rows.length ? rows.map(p => `
      <a class="fcard" href="#/food/${p.id}">
        <span class="fphoto">${urls[p.photos[0]] ? `<img src="${esc(urls[p.photos[0]])}" alt="" loading="lazy">` : `<span class="fnone">${foodEmoji(p.category)}</span>`}
          <span class="fbadge">${foodEmoji(p.category)} ${esc(p.category)}</span>${p.again ? '<span class="fagain" aria-label="또갈집">♥</span>' : ''}</span>
        <span class="fname"><b>${esc(p.name)}</b>${p.rating ? `<span class="fstar">${STAR}${p.rating.toFixed(1)}</span>` : ''}</span>
      </a>`).join('') : `<div class="blank">${data.length ? '조건에 맞는 맛집이 없어요' : '아직 남긴 맛집이 없어요. 오른쪽 위 + 로 추가해 보세요'}</div>`;
    view.querySelectorAll('[data-fc]').forEach(b => {
      const on = b.dataset.fc === 'again' ? food.again : b.dataset.fc === (food.cat || '');
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
    });
  };
  view.innerHTML = `
    <div class="fbar">
      <select id="fSort" aria-label="정렬">${Object.entries(FOOD_SORTS).map(([k, v]) => `<option value="${k}" ${food.sort === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <input id="fQ" type="search" placeholder="이름·메모 검색" value="${esc(food.q)}" aria-label="검색">
      <span id="fCount" class="fcount"></span>
    </div>
    <div class="fchips">
      <button class="fchip" data-fc="">전체</button>
      ${FOOD_CATS.map(([n, e]) => `<button class="fchip" data-fc="${n}">${e} ${n}</button>`).join('')}
      <button class="fchip" data-fc="again">♥ 또갈집</button>
    </div>
    <div class="fgrid" id="fGrid"></div>`;
  document.getElementById('fSort').onchange = e => { food.sort = e.target.value; draw(); };
  document.getElementById('fQ').oninput = e => { food.q = e.target.value; draw(); };
  view.querySelectorAll('[data-fc]').forEach(b => { b.onclick = () => {
    if (b.dataset.fc === 'again') food.again = !food.again; else food.cat = b.dataset.fc || null;
    draw();
  }; });
  draw();
}

async function renderFoodDetail(id) {
  const back = () => { backBtn.onclick = () => { location.hash = '#/food'; }; };
  setHeader('맛집 기록장', { back: true }); back();
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const { data: p, error } = await sb.from('places').select(FOOD_COLS).eq('id', id).maybeSingle();
  if (location.hash !== '#/food/' + id) return;
  if (error || !p) { view.innerHTML = `<div class="blank">${error ? esc(koError(error)) : '삭제되었거나 없는 기록입니다.'}</div>`; return; }
  setHeader('맛집 기록장', { back: true, action: { icon: 'edit', label: '수정', onClick: () => openFoodSheet(p) } }); back();
  const urls = await photoUrls(p.photos);
  if (location.hash !== '#/food/' + id) return;
  const d = parseDate(p.visit_date);
  const safeLink = /^https?:\/\//i.test(p.link) ? p.link : '';
  view.innerHTML = `
    ${p.photos.length ? `<div class="fshots ${p.photos.length === 1 ? 'one' : ''}">${p.photos.map(x => urls[x] ? `<img src="${esc(urls[x])}" alt="${esc(p.name)} 사진">` : '').join('')}</div>` : ''}
    <div class="fdetail">
      <div class="fmeta"><span class="fbadge static">${foodEmoji(p.category)} ${esc(p.category)}</span>${p.again ? '<span class="fbadge static again">♥ 또갈집</span>' : ''}</div>
      <h2>${esc(p.name)}</h2>
      <div class="fwhen">${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEK[d.getDay()]}요일</div>
      ${p.rating ? stars(p.rating) : ''}
      ${p.memo ? `<p class="fmemo">${esc(p.memo)}</p>` : ''}
      ${safeLink ? `<a class="btn ghost" href="${esc(safeLink)}" target="_blank" rel="noopener noreferrer">지도에서 보기</a>` : ''}
    </div>`;
}

// 맛집 추가 / 수정
function openFoodSheet(p) {
  let cat = p?.category || '음식점', again = p ? p.again : false, rating = p?.rating || 0;
  const s = makeSheet(p ? '기록 수정' : '기록 추가', `
    <div class="fchips insheet" id="shCat"></div>
    <input name="name" class="titleinput" maxlength="40" placeholder="가게 이름" value="${esc(p?.name || '')}" aria-label="가게 이름" required>
    <label class="rowline">또갈집<input type="checkbox" class="switch" name="again" ${again ? 'checked' : ''}></label>
    <div class="rowline">날짜<input type="date" name="date" value="${p?.visit_date || toISO(today0())}" aria-label="날짜" required></div>
    <div class="shotrow" id="shShots"></div>
    <div class="starpick" id="shStars" role="radiogroup" aria-label="별점"></div>
    <textarea name="memo" rows="4" maxlength="2000" placeholder="메모" aria-label="메모">${esc(p?.memo || '')}</textarea>
    <input name="link" type="text" inputmode="url" autocapitalize="off" autocorrect="off" maxlength="500" placeholder="링크 (네이버 지도, 카카오맵 등)" value="${esc(p?.link || '')}" aria-label="지도 링크">`,
    !!p, '이 기록 삭제');
  const { sheet, form, msg } = s;
  const picker = photoPicker(sheet.querySelector('#shShots'), p?.photos || []);

  const drawCat = () => {
    sheet.querySelector('#shCat').innerHTML = FOOD_CATS.map(([n, e]) =>
      `<button type="button" class="fchip ${cat === n ? 'on' : ''}" data-c="${n}" aria-pressed="${cat === n}">${e} ${n}</button>`).join('');
    sheet.querySelectorAll('[data-c]').forEach(b => { b.onclick = () => { cat = b.dataset.c; drawCat(); }; });
  };
  const drawStars = () => {
    sheet.querySelector('#shStars').innerHTML = [1, 2, 3, 4, 5].map(i =>
      `<button type="button" class="${i <= rating ? 'on' : ''}" data-s="${i}" role="radio" aria-checked="${i === rating}" aria-label="${i}점">${STAR}</button>`).join('');
    // 같은 별을 다시 누르면 별점을 지운다
    sheet.querySelectorAll('[data-s]').forEach(b => { b.onclick = () => { const n = Number(b.dataset.s); rating = rating === n ? 0 : n; drawStars(); }; });
  };
  drawCat(); drawStars();

  form.onsubmit = async e => {
    e.preventDefault();
    const name = form.name.value.trim();
    // 지도 앱의 '공유' 글을 통째로 붙여도 주소만 골라낸다. http 가 없으면 붙여 준다.
    const raw = form.link.value.trim(), found = raw.match(/https?:\/\/\S+/i);
    const link = found ? found[0] : raw && /^[^\s/]+\.[^\s]+$/.test(raw) ? 'https://' + raw : '';
    if (!name) { msg.textContent = '가게 이름을 입력해 주세요.'; return; }
    if (raw && !link) { msg.textContent = '링크 칸에는 지도 주소를 붙여 넣어 주세요.'; return; }
    const btn = form.querySelector('.ok'); btn.disabled = true;
    try {
      const photos = await picker.upload('food', (i, n) => { msg.className = 'msg ok'; msg.textContent = `사진 올리는 중 (${i}/${n})`; });
      const row = { name, category: cat, again: form.again.checked, visit_date: form.date.value, rating, memo: form.memo.value.trim(), link, photos };
      const { error } = p ? await sb.from('places').update(row).eq('id', p.id) : await sb.from('places').insert(row);
      if (error) throw error;
    } catch (err) {
      await picker.undo();
      btn.disabled = false; msg.className = 'msg'; msg.textContent = photoErr(err);
      return;
    }
    picker.finish();
    if (!p) notifyPartner('맛집을 기록했어요', name, '#/food');
    s.close();
    if (p) renderFoodDetail(p.id); else renderFood();
  };
  if (s.del) s.del.onclick = async () => {
    if (!confirm(`'${p.name}' 기록을 삭제할까요? 사진도 함께 지워집니다.`)) return;
    const { error } = await sb.from('places').delete().eq('id', p.id);
    if (error) { msg.textContent = koError(error); return; }
    removePhotos(p.photos).catch(() => {});
    s.close(); location.hash = '#/food';
  };
  if (!p) form.name.focus();
}
