// ───────── 홈: 위젯을 세로로 쌓은 화면 ─────────

// 이번 달 작은 달력. marks: 기념일이 있는 날짜(숫자) 모음
function miniCalendar(marks) {
  const t = today0(), y = t.getFullYear(), m = t.getMonth();
  const first = new Date(y, m, 1).getDay();           // 1일의 요일
  const last = new Date(y, m + 1, 0).getDate();       // 이번 달 마지막 날
  const cells = [];
  for (let i = 0; i < first; i++) cells.push('<span></span>');
  for (let d = 1; d <= last; d++) {
    const dow = (first + d - 1) % 7;
    const cls = [dow === 0 ? 'sun' : dow === 6 ? 'sat' : '',
      d === t.getDate() ? 'today' : '', marks.has(d) ? 'mark' : ''].join(' ').trim();
    cells.push(`<span class="${cls}">${d}</span>`);
  }
  return `
    <div class="mcal" aria-label="${m + 1}월 달력">
      <div class="mtitle">${m + 1}월</div>
      <div class="mgrid head">${WEEK.map((w, i) => `<span class="${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}">${w}</span>`).join('')}</div>
      <div class="mgrid">${cells.join('')}</div>
    </div>`;
}

// 이번 달에 일정이나 기념일이 있는 날짜들
function marksThisMonth(annRows, events) {
  const t = today0(), first = new Date(t.getFullYear(), t.getMonth(), 1), last = new Date(t.getFullYear(), t.getMonth() + 1, 0);
  const anns = annsForRange(annRows, first, last);
  const marks = new Set();
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    if (itemsOn(new Date(d), events, anns, null).length) marks.add(d.getDate());
  }
  return marks;
}

const widget = (page, shade, body) => `
  <a class="widget" href="#/${page.id}" style="--shade:${shade}">
    <div class="wtitle">${icon(page.icon)}<span>${page.name}</span></div>
    ${body}
  </a>`;

function renderHome() {
  const me = state.members.find(m => m.user_id === state.user.id);
  const partner = state.members.find(m => m.user_id !== state.user.id);
  setHeader(partner ? `${me?.nickname} ♡ ${partner.nickname}` : (me?.nickname || '우리'), { gear: true });
  const P = id => PAGES.find(p => p.id === id);
  const sd = state.couple.start_date, t = today0();

  document.body.classList.add('onhome');
  const draw = ({ anns = [], events = [], album = [], aurls = {} } = {}) => {
    // 오늘부터 30일 안의 일정을 가까운 순으로 3개까지. 누구 일정인지도 함께 보여 준다.
    const until = new Date(t); until.setDate(until.getDate() + 30);
    const annList = annsForRange(anns, t, until), names = ownerNames(), coming = [];
    for (let n = 0; n <= 30 && coming.length < 3; n++) {
      const d = new Date(t); d.setDate(d.getDate() + n);
      for (const x of itemsOn(d, events, annList, null)) if (coming.length < 3) coming.push({ x, d, n });
    }
    const shot = album[0];
    const ago = d => { const n = diffDays(t, parseDate(d)); return n === 0 ? '오늘' : n === 1 ? '어제' : `${parseDate(d).getMonth() + 1}월 ${parseDate(d).getDate()}일`; };
    const row = (href, left, right) => `<a class="hli" href="${href}"><span>${left}</span><small>${right}</small></a>`;
    view.innerHTML = `
      <div class="hdate">${t.getMonth() + 1}월 ${t.getDate()}일 ${WEEK[t.getDay()]}요일</div>
      ${!partner ? `
      <section class="invite">
        <div class="label">상대방에게 이 초대 코드를 알려 주세요</div>
        <div class="code">${esc(state.couple.invite_code)}</div>
        <button class="link" id="refreshBtn">상대방이 입력했어요. 새로고침</button>
      </section>` : ''}

      <div class="htop ${shot && aurls[shot.thumb] ? '' : 'solo'}">
        <a class="hnote" href="#/dday"><i class="tape"></i>
          ${sd ? `<p>우리가 만난 지</p><b>${daysTogether(sd)}일</b><p>${esc(nextMilestoneText(sd).replace('다음 기념일 ', ''))}</p>`
            : `<p>우리가 만난 날을</p><b>언제?</b><p>눌러서 알려 주세요</p>`}</a>
        ${shot && aurls[shot.thumb] ? `<a class="hpol" href="#/album" aria-label="사진 앨범"><img src="${esc(aurls[shot.thumb])}" alt=""><span>${esc(shot.caption || ago(shot.taken_date))}</span></a>` : ''}
      </div>

      <div id="hgrow">${growWidget(growCache)}</div>

      <h2 class="hmark green">오늘의 말씀</h2>
      <button class="hverse" id="hverse" hidden></button>

      <h2 class="hmark">다가오는 일정</h2>
      ${coming.length ? coming.map(({ x, d, n }) => row('#/calendar',
          `<i class="odot ${x.key}"></i>${n === 0 ? '오늘' : n === 1 ? '내일' : `${d.getMonth() + 1}월 ${d.getDate()}일(${WEEK[d.getDay()]})`} · ${esc(x.title)}`,
          `${esc(names[x.key] || '')}${x.kind === 'ann' ? ' · 기념일' : x.time ? ' · ' + fmtTime(x.time) : ''}`)).join('')
        : row('#/calendar', '한 달 안에 잡힌 일정이 없어요', '캘린더 보기')}

      <nav class="hstk" aria-label="메뉴">
        ${[['calendar', '📅', '캘린더'], ['diary', '📔', '일기'], ['food', '🍴', '맛집'], ['money', '💳', '가계부'], ['map', '🗺️', '지도'], ['album', '📷', '앨범'], ['bible', '📖', '통독'], ['qt', '🕊️', 'QT'], ['ask', '💬', '질문']]
          .map(([id, e, n]) => `<a href="#/${id}"><b aria-hidden="true">${e}</b>${n}</a>`).join('')}
      </nav>`;
    fillVerse(document.getElementById('hverse'));
    const r = document.getElementById('refreshBtn');
    if (r) r.onclick = start;
  };

  draw();                                              // 먼저 바로 그리고
  growPoints().then(g => { const box = document.getElementById('hgrow'); if (box) box.innerHTML = growWidget(g); });
  Promise.all([
    sb.from('anniversaries').select('title, date, repeat_yearly'),
    sb.from('events').select('owner_id, title, start_date, start_time, end_date, repeat_rule'),
    sb.from('album_photos').select('thumb, caption, taken_date').order('taken_date', { ascending: false }).order('created_at', { ascending: false }).limit(1),
  ]).then(async ([an, ev, al]) => {
    const album = al.data || [];
    const aurls = await photoUrls(album.map(x => x.thumb)).catch(() => ({}));
    const onHome = ['', '#', '#/'].includes(location.hash);
    // 받아 온 내용으로 다가오는 일정과 폴라로이드 사진을 채운다
    if (onHome) draw({ anns: an.data || [], events: ev.data || [], album, aurls });
  });
}
