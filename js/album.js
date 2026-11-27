// ───────── 사진 앨범 ─────────
// 사진마다 큰 사진(path)과 목록용 작은 사진(thumb)을 함께 올린다.
const ALBUM_MAX_ONCE = 20;
const fileDate = f => toISO(new Date(f.lastModified || Date.now()));

async function renderAlbum() {
  setHeader('사진 앨범', { back: true, action: { icon: 'plus', label: '사진 올리기', onClick: () => document.getElementById('aFile')?.click() } });
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const { data, error } = await sb.from('album_photos').select('id, path, thumb, taken_date, caption, uploaded_by, created_at')
    .order('taken_date', { ascending: false }).order('created_at', { ascending: false });
  if (location.hash !== '#/album') return;
  if (error) { view.innerHTML = `<div class="blank">앨범을 불러오지 못했습니다. (${esc(koError(error))})</div>`; return; }
  const urls = await photoUrls(data.map(x => x.thumb));
  if (location.hash !== '#/album') return;

  let grid = '', prev = null;
  data.forEach((x, i) => {
    const ym = x.taken_date.slice(0, 7);
    if (ym !== prev) { const [y, m] = ym.split('-'); grid += `${prev ? '</div>' : ''}<h2 class="mmonth">${y}년 ${Number(m)}월</h2><div class="agrid">`; prev = ym; }
    grid += `<button class="athumb" data-i="${i}" aria-label="${x.taken_date} 사진${x.caption ? ', ' + esc(x.caption) : ''}">${urls[x.thumb] ? `<img src="${esc(urls[x.thumb])}" alt="" loading="lazy">` : ''}</button>`;
  });
  view.innerHTML = `
    <input type="file" id="aFile" accept="image/*" multiple hidden>
    <p class="msg ok" id="aMsg" role="status"></p>
    <div class="acount">사진 ${data.length}장</div>
    ${data.length ? grid + '</div>' : '<div class="blank">아직 올린 사진이 없어요. 오른쪽 위 + 로 올려 보세요</div>'}`;
  view.querySelectorAll('.athumb').forEach(b => { b.onclick = () => openViewer(data, Number(b.dataset.i)); });

  const fileIn = document.getElementById('aFile'), msg = document.getElementById('aMsg');
  fileIn.onchange = async () => {
    const files = [...fileIn.files]; fileIn.value = '';
    if (!files.length) return;
    const todo = files.slice(0, ALBUM_MAX_ONCE);
    actionBtn.disabled = true; msg.className = 'msg ok';
    let done = 0, failed = null;
    for (const f of todo) {
      msg.textContent = `사진 올리는 중 (${done + 1}/${todo.length})`;
      const up = [];
      try {
        up.push(await uploadPhoto(f, 'album'));
        up.push(await uploadPhoto(f, 'album', 400));
        const { error } = await sb.from('album_photos').insert({ path: up[0], thumb: up[1], taken_date: fileDate(f) });
        if (error) throw error;
        done++;
      } catch (err) { await removePhotos(up).catch(() => {}); failed = err; break; }
    }
    actionBtn.disabled = false;
    if (location.hash !== '#/album') return;
    await renderAlbum();
    const m2 = document.getElementById('aMsg');
    if (failed) { m2.className = 'msg'; m2.textContent = `${done}장 올리고 멈췄습니다. ${photoErr(failed)}`; }
    else if (files.length > todo.length) m2.textContent = `한 번에 ${ALBUM_MAX_ONCE}장까지 올립니다. 나머지 ${files.length - todo.length}장은 다시 골라 주세요.`;
  };
}

// 사진 크게 보기: 좌우 넘기기, 날짜·설명 고치기, 삭제
function openViewer(list, start) {
  let i = start;
  const el = document.createElement('div');
  el.className = 'sheet viewer';
  document.body.appendChild(el); document.body.classList.add('noscroll');
  const close = changed => { el.remove(); document.body.classList.remove('noscroll'); document.removeEventListener('keydown', onKey); if (changed && location.hash === '#/album') renderAlbum(); };
  let dirty = false;
  const go = d => { const n = i + d; if (n >= 0 && n < list.length) { i = n; draw(); } };
  const onKey = e => { if (e.key === 'Escape') close(dirty); if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); };
  document.addEventListener('keydown', onKey);

  const draw = async () => {
    const x = list[i], d = parseDate(x.taken_date);
    el.innerHTML = `
      <div class="vbox" role="dialog" aria-modal="true" aria-label="사진 보기">
        <div class="vhead">
          <button class="roundbtn" id="vClose" aria-label="닫기">${icon('close')}</button>
          <span>${i + 1} / ${list.length}</span>
          <button class="roundbtn" id="vEdit" aria-label="날짜와 설명 고치기">${icon('edit')}</button>
        </div>
        <div class="vstage">
          <img id="vImg" alt="${esc(x.caption || '사진')}">
          <button class="vnav prev" id="vPrev" aria-label="이전 사진" ${i === 0 ? 'hidden' : ''}>${icon('back')}</button>
          <button class="vnav next" id="vNext" aria-label="다음 사진" ${i === list.length - 1 ? 'hidden' : ''}>${icon('chevron')}</button>
        </div>
        <div class="vfoot">
          <div class="dmeta">${whoTag(x.uploaded_by)} · ${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEK[d.getDay()]}요일</div>
          ${x.caption ? `<p>${esc(x.caption)}</p>` : ''}
        </div>
      </div>`;
    el.querySelector('#vClose').onclick = () => close(dirty);
    el.querySelector('#vPrev').onclick = () => go(-1);
    el.querySelector('#vNext').onclick = () => go(1);
    el.querySelector('#vEdit').onclick = () => openAlbumSheet(x, changed => {
      dirty = true;
      if (changed === 'deleted') { list.splice(i, 1); if (!list.length) return close(true); i = Math.min(i, list.length - 1); }
      draw();
    });
    // 손가락으로 좌우로 밀어 넘기기
    let sx = null;
    const stage = el.querySelector('.vstage');
    stage.ontouchstart = e => { sx = e.touches[0].clientX; };
    stage.ontouchend = e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); };
    const shown = x.id, u = await photoUrls([x.path]);
    if (list[i]?.id === shown && u[x.path]) el.querySelector('#vImg').src = u[x.path];
  };
  draw();
}

function openAlbumSheet(x, onDone) {
  const s = makeSheet('사진 정보', `
    <div class="rowline">날짜<input type="date" name="date" value="${x.taken_date}" aria-label="날짜" required></div>
    <textarea name="caption" rows="3" maxlength="200" placeholder="사진 설명" aria-label="사진 설명">${esc(x.caption)}</textarea>`, true, '이 사진 삭제');
  s.sheet.style.zIndex = 60;   // 사진 보기 화면 위에 뜬다
  const { form, msg } = s;
  form.onsubmit = async e => {
    e.preventDefault();
    const row = { taken_date: form.date.value, caption: form.caption.value.trim() };
    const { error } = await sb.from('album_photos').update(row).eq('id', x.id);
    if (error) { msg.textContent = koError(error); return; }
    Object.assign(x, row); s.close(); document.body.classList.add('noscroll'); onDone('saved');
  };
  s.del.onclick = async () => {
    if (!confirm('이 사진을 삭제할까요?')) return;
    const { error } = await sb.from('album_photos').delete().eq('id', x.id);
    if (error) { msg.textContent = koError(error); return; }
    removePhotos([x.path, x.thumb]).catch(() => {});
    s.close(); document.body.classList.add('noscroll'); onDone('deleted');
  };
}
