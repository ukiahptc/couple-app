// ───────── 커플 일기장 ─────────
const DIARY_COLS = 'id, author_id, title, body, entry_date, entry_time';

// 글쓴이 이름표: <span class="who me">준원</span>
function whoTag(userId) {
  const names = ownerNames(), key = userId === state.user.id ? 'me' : 'pt';
  return `<span class="who ${key}">${esc(names[key] || '알 수 없음')}</span>`;
}
const nowTime = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const commentCount = row => row.diary_comments?.[0]?.count || 0;

// 목록에서 쓰는 일기 카드
function diaryCard(r, thumb) {
  const n = commentCount(r);
  return `
    <a class="dcard" href="#/diary/${r.id}">
      <div class="dhead"><b>${esc(r.title)}</b>${whoTag(r.author_id)}<span class="dtime">· ${fmtTime(r.entry_time.slice(0, 5))}</span></div>
      ${r.body ? `<p class="dprev">${esc(r.body)}</p>` : ''}
      ${thumb ? `<div class="dthumbs"><img src="${esc(thumb)}" alt="" loading="lazy">${r.photos.length > 1 ? `<span>+${r.photos.length - 1}</span>` : ''}</div>` : ''}
      ${n ? `<div class="dcount">${icon('comment')}${n}</div>` : ''}
    </a>`;
}

async function renderDiary(id) {
  if (id) return renderDiaryDetail(id);
  setHeader('커플 일기장', { back: true, action: { icon: 'plus', label: '새 일기', onClick: () => openDiarySheet(null) } });
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const { data, error } = await withPhotos('diaries', extra => sb.from('diaries').select(`${DIARY_COLS}${extra}, diary_comments(count)`)
    .order('entry_date', { ascending: false }).order('entry_time', { ascending: false }));
  if (location.hash !== '#/diary') return;
  const thumbs = error ? {} : await photoUrls(data.map(r => r.photos?.[0]).filter(Boolean));
  if (location.hash !== '#/diary') return;
  if (error) { view.innerHTML = `<div class="blank">일기를 불러오지 못했습니다. (${esc(koError(error))})</div>`; return; }
  if (!data.length) {
    view.innerHTML = `<div class="empty"><div class="chip">${icon('diary')}</div><b>첫 일기를 남겨 보세요</b>
      <p>오른쪽 위 + 버튼으로 쓸 수 있어요.</p></div>`;
    return;
  }
  // 같은 날 쓴 글끼리 묶고, 날짜 도장은 그날 첫 글 옆에만 찍는다
  let html = '', prev = null;
  for (const r of data) {
    const d = parseDate(r.entry_date);
    html += `
      <div class="drowwrap">
        ${r.entry_date !== prev ? `<div class="stamp"><span>${d.getMonth() + 1}월</span><b>${d.getDate()}</b><span class="y">${d.getFullYear()}</span></div>` : '<div class="stamp none"></div>'}
        ${diaryCard(r, thumbs[r.photos?.[0]])}
      </div>`;
    prev = r.entry_date;
  }
  view.innerHTML = html;
}

async function renderDiaryDetail(id) {
  setHeader('커플 일기장', { back: true });
  backBtn.onclick = () => { location.hash = '#/diary'; };
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const [d, c] = await Promise.all([
    withPhotos('diaries', extra => sb.from('diaries').select(DIARY_COLS + extra).eq('id', id).maybeSingle()),
    sb.from('diary_comments').select('id, author_id, body, created_at').eq('diary_id', id).order('created_at'),
  ]);
  if (location.hash !== '#/diary/' + id) return;
  const r = d.data;
  if (d.error || !r) { view.innerHTML = `<div class="blank">${d.error ? esc(koError(d.error)) : '삭제되었거나 없는 일기입니다.'}</div>`; return; }
  const mine = r.author_id === state.user.id;
  if (mine) {
    setHeader('커플 일기장', { back: true, action: { icon: 'edit', label: '일기 수정', onClick: () => openDiarySheet(r) } });
    backBtn.onclick = () => { location.hash = '#/diary'; };
  }
  const date = parseDate(r.entry_date);
  const cTime = iso => { const t = new Date(iso); return `${t.getMonth() + 1}월 ${t.getDate()}일 ${fmtTime(`${t.getHours()}:${t.getMinutes()}`)}`; };
  view.innerHTML = `
    <article class="dfull">
      <div class="dmeta">${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEK[date.getDay()]}요일 · ${fmtTime(r.entry_time.slice(0, 5))}</div>
      <h2>${esc(r.title)}</h2>
      <div class="dmeta">${whoTag(r.author_id)}</div>
      <p class="dbody">${esc(r.body)}</p>
      ${r.photos?.length ? `<div class="fshots ${r.photos.length === 1 ? 'one' : ''}" id="dShots"></div>` : ''}
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

  if (r.photos?.length) photoUrls(r.photos).then(u => { const box = document.getElementById('dShots');
    if (box) box.innerHTML = r.photos.map(x => u[x] ? `<img src="${esc(u[x])}" alt="일기 사진">` : '').join(''); });
  const msg = document.getElementById('msg');
  document.getElementById('cForm').onsubmit = async e => {
    e.preventDefault();
    const body = e.target.body.value.trim();
    if (!body) return;
    const btn = e.target.querySelector('.btn'); btn.disabled = true;
    const { error } = await sb.from('diary_comments').insert({ diary_id: id, body });
    btn.disabled = false;
    if (error) { msg.textContent = koError(error); return; }
    const y = window.scrollY; await renderDiaryDetail(id); window.scrollTo(0, y);
  };
  view.querySelectorAll('.cdel').forEach(b => { b.onclick = async () => {
    if (!confirm('이 댓글을 삭제할까요?')) return;
    const { error } = await sb.from('diary_comments').delete().eq('id', b.dataset.id);
    if (error) { msg.textContent = koError(error); return; }
    renderDiaryDetail(id);
  }; });
}

// 새 일기 / 일기 수정 화면
function openDiarySheet(r) {
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.innerHTML = `
    <form class="sheetbody form tall" role="dialog" aria-modal="true" aria-label="${r ? '일기 수정' : '새 일기'}">
      <div class="sheethead">
        <button type="button" class="roundbtn" id="shClose" aria-label="닫기">${icon('close')}</button>
        <b>${r ? '일기 수정' : '새 일기'}</b>
        <button type="submit" class="roundbtn ok" aria-label="저장">${icon('check')}</button>
      </div>
      <div class="rowline">날짜<span><input type="date" name="date" value="${r?.entry_date || toISO(today0())}" aria-label="날짜" required>
        <input type="time" name="time" value="${r ? r.entry_time.slice(0, 5) : nowTime()}" aria-label="시간" required></span></div>
      <input name="title" class="plaintitle" maxlength="60" placeholder="제목" value="${esc(r?.title || '')}" aria-label="제목" required>
      <textarea name="body" class="plainbody" maxlength="5000" placeholder="오늘 하루를 남겨보세요..." aria-label="내용" rows="8">${esc(r?.body || '')}</textarea>
      <div class="shotrow" id="shShots"></div>
      <p class="msg" id="shMsg" role="alert"></p>
      ${r ? '<button type="button" class="link danger" id="shDel">이 일기 삭제</button>' : ''}
    </form>`;
  document.body.appendChild(sheet);
  document.body.classList.add('noscroll');
  const form = sheet.querySelector('form'), msg = sheet.querySelector('#shMsg');
  const close = () => { sheet.remove(); document.body.classList.remove('noscroll'); };
  // 사진 칸은 DB 에 사진 칸이 준비된 뒤에만 보인다
  const picker = photoCol.diaries ? photoPicker(sheet.querySelector('#shShots'), r?.photos || []) : null;
  sheet.querySelector('#shClose').onclick = () => {
    const dirty = form.title.value !== (r?.title || '') || form.body.value !== (r?.body || '');
    if (!dirty || confirm('쓰던 내용이 사라집니다. 닫을까요?')) close();
  };

  form.onsubmit = async e => {
    e.preventDefault();
    const row = { title: form.title.value.trim(), body: form.body.value.trim(), entry_date: form.date.value, entry_time: form.time.value };
    if (!row.title) { msg.textContent = '제목을 입력해 주세요.'; return; }
    const btn = form.querySelector('.ok'); btn.disabled = true;
    try {
      if (picker) row.photos = await picker.upload('diary', (i, n) => { msg.className = 'msg ok'; msg.textContent = `사진 올리는 중 (${i}/${n})`; });
      const { error } = r ? await sb.from('diaries').update(row).eq('id', r.id) : await sb.from('diaries').insert(row);
      if (error) throw error;
    } catch (err) {
      if (picker) await picker.undo();
      btn.disabled = false; msg.className = 'msg'; msg.textContent = photoErr(err); return;
    }
    if (picker) picker.finish();
    close();
    r ? renderDiaryDetail(r.id) : renderDiary();
  };
  const del = sheet.querySelector('#shDel');
  if (del) del.onclick = async () => {
    if (!confirm(`'${r.title}' 일기를 삭제할까요? 댓글도 함께 지워집니다.`)) return;
    const { error } = await sb.from('diaries').delete().eq('id', r.id);
    if (error) { msg.textContent = koError(error); return; }
    removePhotos(r.photos || []).catch(() => {});
    close(); location.hash = '#/diary';
  };
  form.title.focus();
}
