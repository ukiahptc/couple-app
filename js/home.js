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
  setHeader(partner ? `${me?.nickname} & ${partner.nickname}` : (me?.nickname || '우리'), { gear: true });
  const P = id => PAGES.find(p => p.id === id);
  const sd = state.couple.start_date, t = today0();

  const draw = (annRows, events) => {
    view.innerHTML = `
      ${!partner ? `
      <section class="invite">
        <div class="label">상대방에게 이 초대 코드를 알려 주세요</div>
        <div class="code">${esc(state.couple.invite_code)}</div>
        <button class="link" id="refreshBtn">상대방이 입력했어요. 새로고침</button>
      </section>` : ''}

      ${widget(P('dday'), '#ddd6fe', sd
        ? `<div class="wnum">D+${daysTogether(sd)}</div><div class="wsub">${nextMilestoneText(sd)}</div>`
        : `<div class="wempty">눌러서 우리가 만난 날을 설정해 주세요</div>`)}

      ${widget(P('calendar'), '#fbcfe8', `
        <div class="wcal">
          <div class="todaytile"><span>${WEEK[t.getDay()]}요일</span><b>${t.getDate()}</b></div>
          ${miniCalendar(marksThisMonth(annRows, events))}
        </div>`)}

      ${widget(P('food'), '#fecdd3', '<div class="wempty">아직 남긴 맛집이 없어요</div>')}
      ${widget(P('diary'), '#bbf7d0', '<div class="wempty">아직 쓴 일기가 없어요</div>')}
      ${widget(P('money'), '#fde68a', '<div class="wempty">아직 적은 내역이 없어요</div>')}
      ${widget(P('map'), '#bae6fd', '<div class="wempty">아직 표시한 장소가 없어요</div>')}
      ${widget(P('album'), '#e9d5ff', '<div class="wempty">아직 올린 사진이 없어요</div>')}`;
    const r = document.getElementById('refreshBtn');
    if (r) r.onclick = start;
  };

  draw([], []);                                        // 먼저 바로 그리고
  Promise.all([
    sb.from('anniversaries').select('title, date, repeat_yearly'),
    sb.from('events').select('owner_id, title, start_date, start_time, end_date, repeat_rule'),
  ]).then(([an, ev]) => {
    const onHome = !PAGES.some(p => location.hash === '#/' + p.id);
    if (onHome && (an.data?.length || ev.data?.length)) draw(an.data || [], ev.data || []);  // 받아 오면 달력 표시를 채운다
  });
}
