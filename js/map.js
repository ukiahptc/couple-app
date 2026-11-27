// ───────── 데이트 지도 ─────────
// 전국(시·도) → 시·도 안의 시·군·구. 기록이 있는 지역은 사진이나 색으로 채운다.
// 경계 자료: data/regions.json (통계청 2013년 행정구역 경계를 줄여서 만든 것)
let REGIONS = null;
const mapState = { sel: null };
async function loadRegions() {
  if (!REGIONS) {
    const r = await fetch('data/regions.json');
    if (!r.ok) throw new Error('지도 자료를 불러오지 못했습니다.');
    REGIONS = await r.json();
  }
  return REGIONS;
}
// 전국 지도에서 이름이 겹치는 시·도의 글자 위치를 조금 옮긴다
const NUDGE = { 31: [900, 1100], 23: [-700, 0], 11: [0, -150] };
const regionLabel = n => n.includes(' ') ? n.split(' ')[1] : n;
const mapPeriod = t => { const f = s => s.replaceAll('-', '. ') + '.'; return t.start_date === t.end_date ? f(t.start_date) : `${f(t.start_date)} ~ ${f(t.end_date)}`; };

async function renderMap(prov) {
  setHeader('데이트 지도', { back: true });
  if (prov) backBtn.onclick = () => { location.hash = '#/map'; };
  const here = location.hash;
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  let R, trips;
  try {
    const [reg, res] = await Promise.all([loadRegions(),
      sb.from('trips').select('id, region_code, title, start_date, end_date, memo, photos, created_at').order('start_date', { ascending: false }).order('created_at', { ascending: false })]);
    if (res.error) throw res.error;
    R = reg; trips = res.data;
  } catch (err) {
    if (location.hash === here) view.innerHTML = `<div class="blank">지도를 불러오지 못했습니다. (${esc(koError(err))})</div>`;
    return;
  }
  if (location.hash !== here) return;
  if (prov && !R.M[prov]) { location.hash = '#/map'; return; }
  const byRegion = {};
  for (const t of trips) (byRegion[t.region_code] ||= []).push(t);
  const total = Object.values(R.M).reduce((a, v) => a + v.length, 0);
  const picker = `<select id="mProv" aria-label="지도 범위"><option value="">전국 지도</option>${R.P.map(p => `<option value="${p.c}" ${p.c === prov ? 'selected' : ''}>${p.n}</option>`).join('')}</select>`;
  const wire = () => { document.getElementById('mProv').onchange = e => { mapState.sel = null; location.hash = e.target.value ? '#/map/' + e.target.value : '#/map'; }; };

  if (!prov) {
    const visited = Object.keys(byRegion).length;
    const [x0, y0, x1, y1] = R.box, fs = (x1 - x0) / 34;
    view.innerHTML = `
      <div class="mapbar">${picker}<span class="mapstat">방문 지역 <b>${(visited / total * 100).toFixed(1)}%</b></span></div>
      <svg class="kmap" viewBox="${x0} ${y0} ${x1 - x0} ${y1 - y0}" role="group" aria-label="전국 지도">
        ${R.P.map(p => { const n = R.M[p.c].filter(m => byRegion[m.c]).length;
          return `<a href="#/map/${p.c}" aria-label="${p.n}, 방문 ${n}곳"><path class="reg" d="${p.d}"/></a>`; }).join('')}
        ${Object.values(R.M).flat().filter(m => byRegion[m.c]).map(m => `<path class="reg on dot" d="${m.d}"/>`).join('')}
        ${R.P.map(p => { const [dx, dy] = NUDGE[p.c] || [0, 0]; return `<text x="${p.x + dx}" y="${p.y + dy}" font-size="${fs}">${p.s}</text>`; }).join('')}
      </svg>
      <p class="maphint">시·도를 누르면 그 지역 지도가 열립니다. 방문한 시·군·구 ${visited}곳 / 전체 ${total}곳</p>`;
    wire(); return;
  }

  const list = R.M[prov], P = R.P.find(p => p.c === prov);
  const urls = await photoUrls(list.map(m => byRegion[m.c]?.find(t => t.photos.length)?.photos[0]).filter(Boolean));
  if (location.hash !== here) return;
  if (mapState.sel && !list.some(m => m.c === mapState.sel)) mapState.sel = null;
  const bx = R.V[prov];   // 먼 섬(옹진군·울릉군)은 화면 밖에 두고 아래 목록에서 고른다
  const w = bx[2] - bx[0], h = bx[3] - bx[1], pad = Math.max(w, h) * 0.04, fs = Math.max(w, h) / (list.length > 30 ? 50 : 34);
  // 이름이 지역 폭보다 길면 지도에는 쓰지 않는다 (아래 목록에서 고를 수 있다)
  const fits = m => regionLabel(m.n).length * fs * 0.95 <= m.b[2] - m.b[0];
  const cover = m => urls[byRegion[m.c]?.find(t => t.photos.length)?.photos[0]];

  const draw = () => {
    const visited = list.filter(m => byRegion[m.c]).length, sel = list.find(m => m.c === mapState.sel);
    // 선택한 지역은 맨 위에 그려야 굵은 테두리가 가려지지 않는다
    const order = [...list].sort((a, b) => (a.c === mapState.sel) - (b.c === mapState.sel));
    view.innerHTML = `
      <div class="mapbar">${picker}<span class="mapstat">방문 지역 <b>${visited}/${list.length}</b></span></div>
      <svg class="kmap" viewBox="${bx[0] - pad} ${bx[1] - pad} ${w + pad * 2} ${h + pad * 2}" role="group" aria-label="${P.n} 지도">
        <defs>${list.filter(cover).map(m => `<clipPath id="cp${m.c}"><path d="${m.d}"/></clipPath>`).join('')}</defs>
        ${order.map(m => `
          <g class="regg ${m.c === mapState.sel ? 'sel' : ''}" data-r="${m.c}" role="button" tabindex="0" aria-label="${m.n}${byRegion[m.c] ? ', 방문 완료' : ''}">
            <path class="reg ${byRegion[m.c] ? 'on' : ''}" d="${m.d}"/>
            ${cover(m) ? `<image href="${esc(cover(m))}" x="${m.b[0]}" y="${m.b[1]}" width="${m.b[2] - m.b[0]}" height="${m.b[3] - m.b[1]}" preserveAspectRatio="xMidYMid slice" clip-path="url(#cp${m.c})"/><path class="edge" d="${m.d}"/>` : ''}
          </g>`).join('')}
        ${list.filter(m => !cover(m) && fits(m)).map(m => `<text x="${m.x}" y="${m.y}" font-size="${fs}">${regionLabel(m.n)}</text>`).join('')}
      </svg>
      <div class="mapbar"><select id="mReg" aria-label="지역 선택"><option value="">지역을 고르거나 지도에서 눌러 주세요</option>${list.map(m => `<option value="${m.c}" ${m.c === mapState.sel ? 'selected' : ''}>${m.n}${byRegion[m.c] ? ' ✓' : ''}</option>`).join('')}</select></div>
      ${sel ? `
      <section class="regpanel" id="regPanel">
        <div class="reghead"><h2>${sel.n}</h2>${byRegion[sel.c] ? '<span class="fbadge static">방문 완료</span>' : ''}</div>
        ${(byRegion[sel.c] || []).map((t, i) => `
          <article class="trip">
            ${t.photos.length ? `<div class="fshots ${t.photos.length === 1 ? 'one' : ''}" data-shots="${i}"></div>` : ''}
            <div class="triphead"><div><b>${esc(t.title)}</b><small>${mapPeriod(t)}</small></div>
              <button class="iconbtn" data-edit="${i}" aria-label="${esc(t.title)} 수정">${icon('edit')}</button></div>
            ${t.memo ? `<p class="fmemo">${esc(t.memo)}</p>` : ''}
          </article>`).join('') || '<p class="maphint">아직 이 지역의 기록이 없어요</p>'}
        <button class="btn ghost wide inline" id="addTrip">데이트 기록 추가</button>
      </section>` : ''}`;
    wire();
    const pick = c => { mapState.sel = c || null; draw(); document.getElementById('regPanel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); };
    view.querySelectorAll('[data-r]').forEach(g => {
      g.onclick = () => pick(g.dataset.r);
      g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(g.dataset.r); } };
    });
    document.getElementById('mReg').onchange = e => pick(e.target.value);
    if (!sel) return;
    const mine = byRegion[sel.c] || [];
    document.getElementById('addTrip').onclick = () => openTripSheet(sel, `${P.n} ${sel.n}`, null, prov);
    view.querySelectorAll('[data-edit]').forEach(b => { b.onclick = () => openTripSheet(sel, `${P.n} ${sel.n}`, mine[Number(b.dataset.edit)], prov); });
    // 기록 사진은 주소를 받아 온 뒤에 채운다
    photoUrls(mine.flatMap(t => t.photos)).then(u => view.querySelectorAll('[data-shots]').forEach(box => {
      const t = mine[Number(box.dataset.shots)];
      box.innerHTML = t.photos.map(x => u[x] ? `<img src="${esc(u[x])}" alt="${esc(t.title)} 사진">` : '').join('');
    }));
  };
  draw();
}

// 데이트 기록 추가 / 수정
function openTripSheet(region, fullName, t, prov) {
  const today = toISO(today0());
  const s = makeSheet(t ? '데이트 기록 수정' : '데이트 기록 추가', `
    <div class="tripwhere"><b>${region.n}</b><small>${fullName.replace(' ' + region.n, '')}</small></div>
    <input name="title" class="titleinput" maxlength="40" placeholder="제목" value="${esc(t?.title || '')}" aria-label="제목" required>
    <div class="rowline">시작일<input type="date" name="sd" value="${t?.start_date || today}" aria-label="시작일" required></div>
    <div class="rowline">종료일<input type="date" name="ed" value="${t?.end_date || today}" aria-label="종료일" required></div>
    <div class="shotrow" id="shShots"></div>
    <textarea name="memo" rows="4" maxlength="2000" placeholder="메모" aria-label="메모">${esc(t?.memo || '')}</textarea>`,
    !!t, '이 기록 삭제');
  const { sheet, form, msg } = s;
  const picker = photoPicker(sheet.querySelector('#shShots'), t?.photos || []);
  form.sd.onchange = () => { if (form.ed.value < form.sd.value) form.ed.value = form.sd.value; };
  form.onsubmit = async e => {
    e.preventDefault();
    const title = form.title.value.trim();
    if (!title) { msg.textContent = '제목을 입력해 주세요.'; return; }
    if (form.ed.value < form.sd.value) { msg.textContent = '종료일이 시작일보다 빠릅니다.'; return; }
    const btn = form.querySelector('.ok'); btn.disabled = true;
    try {
      const photos = await picker.upload('map', (i, n) => { msg.className = 'msg ok'; msg.textContent = `사진 올리는 중 (${i}/${n})`; });
      const row = { region_code: region.c, title, start_date: form.sd.value, end_date: form.ed.value, memo: form.memo.value.trim(), photos };
      const { error } = t ? await sb.from('trips').update(row).eq('id', t.id) : await sb.from('trips').insert(row);
      if (error) throw error;
    } catch (err) {
      await picker.undo();
      btn.disabled = false; msg.className = 'msg'; msg.textContent = photoErr(err);
      return;
    }
    picker.finish(); s.close(); renderMap(prov);
  };
  if (s.del) s.del.onclick = async () => {
    if (!confirm(`'${t.title}' 기록을 삭제할까요? 사진도 함께 지워집니다.`)) return;
    const { error } = await sb.from('trips').delete().eq('id', t.id);
    if (error) { msg.textContent = koError(error); return; }
    removePhotos(t.photos).catch(() => {});
    s.close(); renderMap(prov);
  };
  if (!t) form.title.focus();
}
