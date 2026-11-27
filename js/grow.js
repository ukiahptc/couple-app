// ───────── 성경책 키우기 ─────────
// 앱 전체의 컨셉. 둘이 무엇이든 기록할 때마다 포인트가 쌓이고, 포인트만큼 성경책이 자란다.
// 성경책이 자라는 단계. need: 그 단계가 되는 데 필요한 포인트
const GROW_STAGES = [
  { need: 0,    name: '말씀 쪽지',     line: '한 구절이 적힌 작은 쪽지예요' },
  { need: 30,   name: '얇은 소책자',   line: '쪽지가 모여 작은 책이 되었어요' },
  { need: 100,  name: '작은 성경',     line: '표지가 생기고 제법 책다워졌어요' },
  { need: 250,  name: '책갈피 성경',   line: '읽던 자리를 기억하는 끈이 달렸어요' },
  { need: 600,  name: '두툼한 성경',   line: '손때 묻은 두꺼운 책이 되었어요' },
  { need: 1200, name: '금박 성경',     line: '책 옆면에 금빛이 둘렸어요' },
  { need: 2500, name: '빛나는 성경',   line: '펼칠 때마다 빛이 나요' },
];

// 단계별 그림: 얼굴이 있는 책 캐릭터 (직접 그린 단순한 선 그림). 단계가 오를수록 크고 두꺼워진다.
function growSvg(stage) {
  const ink = '#3b342c';
  const face = (cx, cy, k = 1) => `
    <circle cx="${cx - 11 * k}" cy="${cy}" r="${2.6 * k}" fill="${ink}"/><circle cx="${cx + 11 * k}" cy="${cy}" r="${2.6 * k}" fill="${ink}"/>
    <path d="M${cx - 6 * k} ${cy + 8 * k}q${6 * k} ${6 * k} ${12 * k} 0" fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="${cx - 19 * k}" cy="${cy + 7 * k}" rx="${4 * k}" ry="${2.6 * k}" fill="#ffb3c4"/><ellipse cx="${cx + 19 * k}" cy="${cy + 7 * k}" rx="${4 * k}" ry="${2.6 * k}" fill="#ffb3c4"/>`;
  let art;
  if (stage === 0) {
    art = `<path d="M66 70l66-6 6 78-70 6z" fill="#fffdf2" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M118 65l14-1 1 14z" fill="#f1eee4" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M80 84h34M80 94h24" stroke="#cfc8b8" stroke-width="3" stroke-linecap="round"/>${face(101, 116, .9)}`;
  } else {
    // 책 크기와 두께
    const w = [0, 74, 84, 90, 98, 104, 110][stage], h = [0, 86, 98, 106, 114, 120, 126][stage], t = [0, 6, 10, 12, 18, 20, 22][stage];
    const x = 100 - w / 2, y = 150 - h, cover = ['', '#bfd9f2', '#b98a5e', '#b98a5e', '#8a5a3c', '#8a5a3c', '#6d3f2a'][stage];
    const edge = stage >= 5 ? '#f5cf5a' : '#fffdf2';
    art = `
      ${stage === 6 ? [[100, y - 26, 0], [52, y - 6, -40], [148, y - 6, 40], [30, y + 34, -75], [170, y + 34, 75]].map(([sx, sy, r]) => `<path d="M${sx} ${sy - 9}v18" transform="rotate(${r} ${sx} ${sy})" stroke="#f5b942" stroke-width="4" stroke-linecap="round"/>`).join('') : ''}
      <path d="M${x + t} ${y + t}h${w}v${h - t}h-${w}z" fill="${edge}" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round" transform="translate(0 0)"/>
      ${Array.from({ length: Math.max(1, Math.round(t / 4)) }, (_, i) => `<path d="M${x + w + 2 + i * 4} ${y + 6 + i * 4}v${h - 8}" stroke="${stage >= 5 ? '#d9a93a' : '#cfc8b8'}" stroke-width="1.5"/>`).join('')}
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${cover}" stroke="${ink}" stroke-width="2.4"/>
      <path d="M${x + 11} ${y + 2}v${h - 4}" stroke="${ink}" stroke-width="2" opacity=".55"/>
      ${stage >= 2 ? `<path d="M${100 + 5} ${y + 14}v22M${100 - 4} ${y + 21}h18" stroke="${stage >= 5 ? '#f5cf5a' : '#fff3d6'}" stroke-width="4.5" stroke-linecap="round"/>` : `<path d="M${x + 24} ${y + 20}h${w - 38}M${x + 24} ${y + 30}h${w - 50}" stroke="#fffdf2" stroke-width="3.5" stroke-linecap="round"/>`}
      ${stage >= 3 ? `<path d="M${x + w - 20} ${y + h - 2}v20l5-5 5 5v-20" fill="#e2557a" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>` : ''}
      <rect x="${100 - 30 + 5}" y="${y + h * .5 - 4}" width="60" height="${Math.min(46, h * .42)}" rx="14" fill="#fffdf2" stroke="${ink}" stroke-width="2"/>
      ${face(105, y + h * .5 + Math.min(46, h * .42) / 2 - 8, .85)}`;
  }
  return `<svg viewBox="0 0 200 180" role="img" aria-label="${GROW_STAGES[stage].name}">
    <ellipse cx="102" cy="162" rx="62" ry="7" fill="rgba(59,52,44,.12)"/>
    ${art}
  </svg>`;
}

// 무엇이 몇 점인지. [표 이름, 이름, 점수]
const GROW_RULES = [
  ['qt_answers', '질문 답', 1], ['qt_shares', 'QT 나눔', 3], ['qt_share_comments', '나눔 댓글', 1], ['bible_reads', '통독(장)', 1],
  ['diaries', '일기', 2], ['diary_comments', '일기 댓글', 1], ['events', '일정', 1],
  ['places', '맛집', 2], ['trips', '데이트 지도', 2], ['album_photos', '사진', 1], ['money_dates', '가계부 데이트', 1],
];
const BOTH_BONUS = 3;   // 그날 질문에 둘 다 답하면 더 받는 점수
let growCache = null;   // 마지막으로 센 결과. 화면을 바로 그릴 때 쓴다.

// 표가 아직 없으면 0으로 센다
async function growPoints() {
  const count = t => sb.from(t).select('id', { count: 'exact', head: true }).then(r => (r.error ? 0 : r.count || 0), () => 0);
  const [counts, ans] = await Promise.all([
    Promise.all(GROW_RULES.map(r => (r[0] === 'qt_answers' ? 0 : count(r[0])))),
    sb.from('qt_answers').select('q_date').limit(5000).then(r => r.data || [], () => []),
  ]);
  const perDay = {};
  ans.forEach(r => { perDay[r.q_date] = (perDay[r.q_date] || 0) + 1; });
  const both = Object.values(perDay).filter(n => n >= 2).length;
  const items = GROW_RULES.map(([t, name, pts], i) => ({ name, pts, n: t === 'qt_answers' ? ans.length : counts[i] }));
  const points = items.reduce((a, x) => a + x.n * x.pts, 0) + both * BOTH_BONUS;
  let stage = 0;
  GROW_STAGES.forEach((x, i) => { if (points >= x.need) stage = i; });
  return (growCache = { points, stage, items, both });
}
const growBar = g => {
  const cur = GROW_STAGES[g.stage], nx = GROW_STAGES[g.stage + 1];
  const pct = nx ? (g.points - cur.need) / (nx.need - cur.need) * 100 : 100;
  return `<div class="bbar"><i style="width:${Math.max(g.points ? 3 : 0, pct)}%"></i></div>
    <p class="seednext">⭐ ${g.points.toLocaleString('ko-KR')}점${nx ? ` · ${nx.name}까지 ${(nx.need - g.points).toLocaleString('ko-KR')}점` : ' · 다 자랐어요'}</p>`;
};

// 홈에 놓는 작은 카드
function growWidget(g) {
  if (!g) return '<a class="hgrow" href="#/grow"><div class="seedinfo"><small>우리 성경책</small><b>…</b></div></a>';
  return `
    <a class="hgrow" href="#/grow" aria-label="성경책 키우기">
      <div class="seedart">${growSvg(g.stage)}</div>
      <div class="seedinfo"><small>우리 성경책 · ${g.stage + 1}단계</small><b>${GROW_STAGES[g.stage].name}</b>${growBar(g)}</div>
    </a>`;
}

async function renderGrow() {
  setHeader('성경책 키우기', { back: true });
  const draw = g => {
    view.innerHTML = `
      <section class="seed big">
        <div class="seedart">${growSvg(g.stage)}</div>
        <div class="seedinfo"><small>우리 성경책 · ${g.stage + 1}단계</small><b>${GROW_STAGES[g.stage].name}</b><p>${GROW_STAGES[g.stage].line}</p>${growBar(g)}</div>
      </section>

      <h2 class="hmark green">자라는 단계</h2>
      <div class="gstages">${GROW_STAGES.map((s, i) => `
        <div class="gstage ${i === g.stage ? 'now' : i > g.stage ? 'yet' : ''}">${growSvg(i)}<b>${s.name}</b><small>${s.need.toLocaleString('ko-KR')}점</small></div>`).join('')}</div>

      <h2 class="hmark">포인트는 이렇게 쌓여요</h2>
      <p class="hint">둘이 남긴 기록을 모두 합쳐서 세요. 기록을 지우면 그만큼 줄어들어요.</p>
      ${g.items.map(x => `<div class="grow"><span>${x.name} <small>${x.pts}점</small></span><b>${x.n.toLocaleString('ko-KR')}개 · ${(x.n * x.pts).toLocaleString('ko-KR')}점</b></div>`).join('')}
      <div class="grow"><span>질문에 둘 다 답한 날 <small>${BOTH_BONUS}점 더</small></span><b>${g.both}일 · ${g.both * BOTH_BONUS}점</b></div>`;
  };
  if (growCache) draw(growCache); else view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const g = await growPoints();
  if (location.hash === '#/grow') draw(g);
}
