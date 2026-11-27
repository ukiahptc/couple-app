// ───────── 성경 통독표 ─────────
// 책 66권을 순서대로 읽어 나가며 장마다 체크한다. 날짜에 쫓기지 않도록 "다음에 읽을 장"을 이어서 보여 준다.
const BOOKS = '창세기:50 출애굽기:40 레위기:27 민수기:36 신명기:34 여호수아:24 사사기:21 룻기:4 사무엘상:31 사무엘하:24 열왕기상:22 열왕기하:25 역대상:29 역대하:36 에스라:10 느헤미야:13 에스더:10 욥기:42 시편:150 잠언:31 전도서:12 아가:8 이사야:66 예레미야:52 예레미야애가:5 에스겔:48 다니엘:12 호세아:14 요엘:3 아모스:9 오바댜:1 요나:4 미가:7 나훔:3 하박국:3 스바냐:3 학개:2 스가랴:14 말라기:4 마태복음:28 마가복음:16 누가복음:24 요한복음:21 사도행전:28 로마서:16 고린도전서:16 고린도후서:13 갈라디아서:6 에베소서:6 빌립보서:4 골로새서:4 데살로니가전서:5 데살로니가후서:3 디모데전서:6 디모데후서:4 디도서:3 빌레몬서:1 히브리서:13 야고보서:5 베드로전서:5 베드로후서:3 요한일서:5 요한이서:1 요한삼서:1 유다서:1 요한계시록:22'
  .split(' ').map((s, i) => { const [name, n] = s.split(':'); return { no: i + 1, name, n: +n }; });
const BIBLE_TOTAL = BOOKS.reduce((a, b) => a + b.n, 0);   // 1,189장
const OT_BOOKS = 39;                                       // 구약 39권, 신약 27권
const DAILY = 3;                                           // 하루에 권하는 분량(장)
const chapUnit = b => (b.name === '시편' ? '편' : '장');

const bible = { rows: [], error: null };
const bkey = (book, ch) => book * 1000 + ch;

// 한 번에 1,000줄까지만 오므로 나눠서 모두 받는다
async function loadBible() {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('bible_reads').select('id, user_id, book, chapter, read_date').order('created_at').range(from, from + 999);
    if (error) throw error;
    all.push(...data);
    if (data.length < 1000) break;
  }
  bible.rows = all;
}

// 한 사람의 통계: 읽은 장 모음, 오늘 읽은 수, 연속 일수
function bibleStat(userId) {
  const mine = bible.rows.filter(r => r.user_id === userId);
  const set = new Set(mine.map(r => bkey(r.book, r.chapter)));
  const days = new Set(mine.map(r => r.read_date));
  const d = today0(), todayISO = toISO(d);
  if (!days.has(todayISO)) d.setDate(d.getDate() - 1);      // 오늘 아직 안 읽었어도 어제까지의 연속은 살려 둔다
  let streak = 0;
  while (days.has(toISO(d))) { streak++; d.setDate(d.getDate() - 1); }
  return { set, count: set.size, today: mine.filter(r => r.read_date === todayISO).length, streak };
}

// 아직 안 읽은 장을 성경 순서대로 n개
function nextChapters(set, n) {
  const out = [];
  for (const b of BOOKS) for (let c = 1; c <= b.n && out.length < n; c++) if (!set.has(bkey(b.no, c))) out.push({ b, c });
  return out;
}

async function toggleChapter(book, ch, redraw) {
  const mineRow = bible.rows.find(r => r.user_id === state.user.id && r.book === book && r.chapter === ch);
  if (mineRow) {
    bible.rows = bible.rows.filter(r => r !== mineRow);
    redraw();
    const { error } = mineRow.id ? await sb.from('bible_reads').delete().eq('id', mineRow.id) : { error: null };
    if (error) { bible.rows.push(mineRow); redraw(koError(error)); }
    return;
  }
  const row = { user_id: state.user.id, book, chapter: ch, read_date: toISO(today0()) };
  bible.rows.push(row);
  redraw();
  const { data, error } = await sb.from('bible_reads').insert({ book, chapter: ch, read_date: row.read_date }).select('id').single();
  if (error) { bible.rows = bible.rows.filter(r => r !== row); redraw(koError(error)); return; }
  row.id = data.id;
  // 그날 분량을 처음 채웠을 때와 한 권을 다 읽었을 때만 상대에게 알린다
  const st = bibleStat(state.user.id), b = BOOKS[book - 1];
  let done = true;
  for (let c = 1; c <= b.n; c++) if (!st.set.has(bkey(book, c))) { done = false; break; }
  if (done) notifyPartner(`${b.name} 통독을 마쳤어요`, `통독 ${Math.floor(st.count / BIBLE_TOTAL * 100)}%`, '#/bible');
  else if (st.today === DAILY) notifyPartner('오늘 성경을 읽었어요', `${b.name} ${ch}${chapUnit(b)}까지`, '#/bible');
}

async function renderBible(param) {
  const book = BOOKS[+param - 1];
  setHeader(book ? book.name : '성경 통독표', { back: true });
  if (book) backBtn.onclick = () => { location.hash = '#/bible'; };
  view.innerHTML = '<p class="hint">불러오는 중…</p>';
  bible.error = null;
  try { await loadBible(); } catch (e) { bible.error = koError(e); }
  if (!location.hash.startsWith('#/bible')) return;
  book ? drawBibleBook(book) : drawBible();
}

function drawBible(msg) {
  const me = state.members.find(m => m.user_id === state.user.id);
  const partner = state.members.find(m => m.user_id !== state.user.id);
  const mine = bibleStat(state.user.id), theirs = partner ? bibleStat(partner.user_id) : null;
  const pct = n => (n / BIBLE_TOTAL * 100).toFixed(n && n < BIBLE_TOTAL ? 1 : 0);
  const bar = (name, st, cls) => `
    <div class="bprog ${cls}">
      <div class="bwho"><b>${esc(name)}</b><span>${st.count.toLocaleString('ko-KR')} / ${BIBLE_TOTAL.toLocaleString('ko-KR')}장 · ${pct(st.count)}%</span></div>
      <div class="bbar"><i style="width:${Math.max(st.count ? 2 : 0, st.count / BIBLE_TOTAL * 100)}%"></i></div>
      <div class="bsub">${st.streak ? `🔥 ${st.streak}일 연속` : '아직 연속 기록이 없어요'} · 오늘 ${st.today}장</div>
    </div>`;
  const next = nextChapters(mine.set, DAILY);
  const left = BIBLE_TOTAL - mine.count;
  const chip = b => {
    let n = 0;
    for (let c = 1; c <= b.n; c++) if (mine.set.has(bkey(b.no, c))) n++;
    return `<a class="bchip ${n === b.n ? 'done' : n ? 'part' : ''}" href="#/bible/${b.no}"><b>${b.name}</b><small>${n}/${b.n}</small></a>`;
  };
  view.innerHTML = `
    ${bible.error ? `<p class="msg" role="alert">${esc(bible.error)}</p>` : ''}
    <section class="bnote">
      ${bar(me?.nickname || '나', mine, 'me')}
      ${theirs ? bar(partner.nickname, theirs, 'pt') : ''}
    </section>
    <p class="msg" id="bmsg" role="alert">${esc(msg || '')}</p>

    <h2 class="hmark green">다음에 읽을 장</h2>
    ${next.length ? next.map(({ b, c }) => `
      <button class="brow" data-b="${b.no}" data-c="${c}"><i class="bbox"></i><span>${b.name} ${c}${chapUnit(b)}</span></button>`).join('')
      : '<p class="hint">성경을 끝까지 다 읽었어요. 🎉</p>'}
    ${next.length ? `<p class="hint">하루 ${DAILY}장씩 읽으면 앞으로 약 ${Math.ceil(left / DAILY)}일이면 끝나요. 오늘은 ${mine.today}장 읽었어요.</p>` : ''}

    <h2 class="hmark">구약</h2>
    <div class="bgrid">${BOOKS.slice(0, OT_BOOKS).map(chip).join('')}</div>
    <h2 class="hmark">신약</h2>
    <div class="bgrid">${BOOKS.slice(OT_BOOKS).map(chip).join('')}</div>`;
  view.querySelectorAll('.brow').forEach(el => {
    el.onclick = () => toggleChapter(+el.dataset.b, +el.dataset.c, drawBible);
  });
}

function drawBibleBook(b, msg) {
  const partner = state.members.find(m => m.user_id !== state.user.id);
  const mine = bibleStat(state.user.id).set, theirs = partner ? bibleStat(partner.user_id).set : new Set();
  let n = 0;
  const cells = [];
  for (let c = 1; c <= b.n; c++) {
    const on = mine.has(bkey(b.no, c)); if (on) n++;
    cells.push(`<button class="bcell ${on ? 'on' : ''}" data-c="${c}" aria-pressed="${on}">${c}${theirs.has(bkey(b.no, c)) ? '<i></i>' : ''}</button>`);
  }
  view.innerHTML = `
    <p class="hint">읽은 ${chapUnit(b)}을 누르면 체크되고, 다시 누르면 취소돼요. ${partner ? `파란 점은 ${esc(partner.nickname)} 님이 읽은 ${chapUnit(b)}이에요.` : ''}</p>
    <div class="bcount"><b>${n}</b> / ${b.n}${chapUnit(b)}</div>
    <p class="msg" id="bmsg" role="alert">${esc(msg || '')}</p>
    <div class="bcells">${cells.join('')}</div>`;
  view.querySelectorAll('.bcell').forEach(el => {
    el.onclick = () => toggleChapter(b.no, +el.dataset.c, m => drawBibleBook(b, m));
  });
}
