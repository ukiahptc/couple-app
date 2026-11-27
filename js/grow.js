// ───────── 성경책 키우기 ─────────
// 앱 전체의 컨셉. '믿음' 기록은 성경책을 자라게 하고, '우리' 기록은 성경책을 꾸밀 배경과 아이템을 열어 준다.
// 성경책이 자라는 단계. need: 그 단계가 되는 데 필요한 포인트
const GROW_STAGES = [
  { need: 0,    name: '말씀 쪽지',     line: '한 구절이 적힌 작은 쪽지예요' },
  { need: 20,   name: '얇은 소책자',   line: '쪽지가 모여 작은 책이 되었어요' },
  { need: 60,   name: '작은 성경',     line: '표지가 생기고 제법 책다워졌어요' },
  { need: 150,  name: '책갈피 성경',   line: '읽던 자리를 기억하는 끈이 달렸어요' },
  { need: 350,  name: '두툼한 성경',   line: '손때 묻은 두꺼운 책이 되었어요' },
  { need: 700,  name: '금박 성경',     line: '책 옆면에 금빛이 둘렸어요' },
  { need: 1500, name: '빛나는 성경',   line: '펼칠 때마다 빛이 나요' },
];

// 단계별 그림: 얼굴이 있는 책 캐릭터 (직접 그린 단순한 선 그림). 단계가 오를수록 크고 두꺼워진다.
// 책의 위치와 크기, 얼굴 자리 (아이템을 붙일 때 쓴다)
function bookGeom(stage) {
  if (stage === 0) return { x: 66, y: 66, w: 70, h: 80, fx: 101, fy: 116, k: .9 };
  const w = [0, 74, 84, 90, 98, 104, 110][stage], h = [0, 86, 98, 106, 114, 120, 126][stage];
  const y = 150 - h;
  return { x: 100 - w / 2, y, w, h, fx: 105, fy: y + h * .5 + Math.min(46, h * .42) / 2 - 8, k: .85 };
}
function growSvg(stage, worn = []) {
  const ink = '#3b342c';
  const B = bookGeom(stage), has = id => worn.includes(id), top = B.y, cx = B.x + B.w / 2;
  const back = has('wings') ? `
    <path d="M${B.x + 4} ${B.y + B.h * .45}c-26-22-44-14-40 6c-10 2-8 16 4 16c-4 10 10 16 36 4z" fill="#fff" stroke="${ink}" stroke-width="2.200" stroke-linejoin="round"/>
    <path d="M${B.x + B.w - 4} ${B.y + B.h * .45}c26-22 44-14 40 6c10 2 8 16-4 16c4 10-10 16-36 4z" fill="#fff" stroke="${ink}" stroke-width="2.200" stroke-linejoin="round"/>` : '';
  const front = [
    has('glasses') ? `<g fill="rgba(255,255,255,.35)" stroke="${ink}" stroke-width="2"><circle cx="${B.fx - 11 * B.k}" cy="${B.fy}" r="7.500"/><circle cx="${B.fx + 11 * B.k}" cy="${B.fy}" r="7.500"/></g><path d="M${B.fx - 11 * B.k + 7.5} ${B.fy}h${22 * B.k - 15}" stroke="${ink}" stroke-width="2"/>` : '',
    has('ribbon') ? `<g stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M${cx} ${top - 2}l-17-10v20z" fill="#ff8fab"/><path d="M${cx} ${top - 2}l17-10v20z" fill="#ff8fab"/><circle cx="${cx}" cy="${top - 2}" r="5" fill="#e2557a"/></g>` : '',
    has('flower') ? `<g transform="translate(${B.x + B.w - 14} ${top + 1})" stroke="${ink}" stroke-width="1.800">${[0, 72, 144, 216, 288].map(r => `<ellipse cx="0" cy="-8" rx="5" ry="7" fill="#fff" transform="rotate(${r})"/>`).join('')}<circle r="4.500" fill="#f5b942"/></g>` : '',
    has('beanie') ? `<g stroke="${ink}" stroke-width="2.200" stroke-linejoin="round"><path d="M${B.x + 6} ${top + 5}c2-${B.w * .5} ${B.w - 14}-${B.w * .5} ${B.w - 12} 0z" fill="#7fb7e6"/><rect x="${B.x + 2}" y="${top}" width="${B.w - 4}" height="11" rx="5.500" fill="#fff"/><circle cx="${cx}" cy="${top - B.w * .36}" r="8" fill="#fff"/></g>` : '',
    has('crown') ? `<path d="M${cx - 22} ${top + 3}l-3-24 14 12 11-18 11 18 14-12-3 24z" fill="#f5cf5a" stroke="${ink}" stroke-width="2.200" stroke-linejoin="round"/><circle cx="${cx}" cy="${top - 4}" r="3" fill="#e2557a" stroke="${ink}" stroke-width="1.500"/>` : '',
    has('balloon') ? `<path d="M${B.x + B.w + 1} ${B.y + B.h * .62}q10-${B.h * .3} 16-${B.h * .62 + 2}" fill="none" stroke="${ink}" stroke-width="1.800"/><path d="M${B.x + B.w + 17} ${top}c-14-12-16-30-6-34c6-2 10 2 6 8c4-6 10-10 15-5c8 8-4 24-15 31z" fill="#ff6b8b" stroke="${ink}" stroke-width="2.200" stroke-linejoin="round"/>` : '',
  ].join('');
  const face = (cx, cy, k = 1) => `
    <circle class="gb-eye" cx="${cx - 11 * k}" cy="${cy}" r="${2.6 * k}" fill="${ink}"/><circle class="gb-eye" cx="${cx + 11 * k}" cy="${cy}" r="${2.6 * k}" fill="${ink}"/>
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
    <ellipse class="gb-shadow" cx="102" cy="164" rx="56" ry="7" fill="rgba(59,52,44,.12)"/>
    <g class="gb">
      <ellipse class="gb-foot l" cx="84" cy="153" rx="11" ry="6.500" fill="#fffdf2" stroke="${ink}" stroke-width="2.200"/>
      <ellipse class="gb-foot r" cx="118" cy="153" rx="11" ry="6.500" fill="#fffdf2" stroke="${ink}" stroke-width="2.200"/>
      ${back}
      <g class="gb-body">${art}${front}</g>
    </g>
  </svg>`;
}

// 무엇이 몇 점인지. [표 이름, 이름, 점수]. 믿음 점수는 성경책을 키우고, 우리 점수는 꾸미기를 연다.
const FAITH_RULES = [['qt_answers', '질문 답', 1], ['qt_shares', 'QT 나눔', 3], ['qt_share_comments', '나눔 댓글', 1], ['bible_reads', '통독(장)', 1], ['thanks', '감사 쪽지', 1]];
const US_RULES = [['diaries', '일기', 2], ['diary_comments', '일기 댓글', 1], ['events', '일정', 1], ['places', '맛집', 2], ['trips', '데이트 지도', 2], ['album_photos', '사진', 1], ['money_dates', '가계부 데이트', 1]];
const BOTH_BONUS = 3;   // 그날 질문에 둘 다 답하면 더 받는 점수
let growCache = null;   // 마지막으로 센 결과. 화면을 바로 그릴 때 쓴다.

// 꾸미기: 우리 점수가 need 이상이면 열린다. slot 이 같은 아이템은 하나만 쓸 수 있다.
const DECO_BGS = [
  { id: 'eden',      name: '에덴동산',       need: 0 },
  { id: 'ark',       name: '노아의 무지개',   need: 10 },
  { id: 'stars',     name: '아브라함의 별밤', need: 30 },
  { id: 'galilee',   name: '갈릴리 호숫가',   need: 60 },
  { id: 'bethlehem', name: '베들레헴의 밤',   need: 100 },
  { id: 'snow',      name: '성탄절 눈밭',     need: 160 },
];
const DECO_ITEMS = [
  { id: 'ribbon',  name: '리본',   need: 5,   slot: 'head', e: '🎀' },
  { id: 'flower',  name: '꽃',     need: 15,  slot: 'side', e: '🌼' },
  { id: 'glasses', name: '안경',   need: 25,  slot: 'face', e: '👓' },
  { id: 'balloon', name: '하트 풍선', need: 45, slot: 'hand', e: '🎈' },
  { id: 'beanie',  name: '털모자', need: 80,  slot: 'head', e: '🧢' },
  { id: 'crown',   name: '왕관',   need: 130, slot: 'head', e: '👑' },
  { id: 'wings',   name: '날개',   need: 200, slot: 'back', e: '🪽' },
];
// 배경 그림 (무대 뒤에 깔린다)
function decoBg(id) {
  const ink = '#3b342c';
  const dots = (n, f, yMax, r = 2, seed = 7) => Array.from({ length: n }, (_, i) => { const a = Math.sin((i + 1) * seed * 12.9898) * 43758.5453, b = Math.sin((i + 1) * seed * 78.233) * 12345.678; const x = (a - Math.floor(a)) * 400, y = (b - Math.floor(b)) * yMax; return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r}" fill="${f}"/>`; }).join('');
  const flower = (x, y, c) => `<g transform="translate(${x} ${y})"><path d="M0 0v14" stroke="#5c9c52" stroke-width="2.500"/><circle r="6" fill="${c}" stroke="${ink}" stroke-width="1.500"/><circle r="2" fill="#f5cf5a"/></g>`;
  const tree = (x, y, k = 1, fruit = '') => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-5 0c2-14 0-24 2-36h8c0 12 2 22 4 36z" fill="#b98a5e" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/><path d="M-30-40c-12-20 6-34 20-26c4-18 34-16 34 0c18-2 22 22 6 28c2 14-18 18-28 8c-10 10-32 6-32-10z" fill="#7fc47a" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>${fruit}</g>`;
  const scenes = {
    // 에덴동산: 강이 흐르고 나무와 꽃이 있는 동산
    eden: `<rect width="400" height="214" fill="#dff5ff"/><circle cx="352" cy="36" r="18" fill="#ffe27a"/><ellipse cx="96" cy="38" rx="40" ry="13" fill="#fff"/><ellipse cx="250" cy="58" rx="34" ry="11" fill="#fff"/>
      <path d="M0 150q100-30 200-8t200-12v84H0z" fill="#bfe8a6"/><path d="M0 178q110-18 210-4t190-8v48H0z" fill="#a5dc8c"/>
      <path d="M400 150c-50 4-70 18-110 26s-60 22-50 38h70c-6-12 20-22 50-28s40-14 40-20z" fill="#9bdcf2" stroke="${ink}" stroke-width="1.500" opacity=".95"/>
      ${tree(48, 172, 1, `<circle cx="-12" cy="-44" r="4.500" fill="#ffc9d6" stroke="${ink}" stroke-width="1.200"/><circle cx="10" cy="-54" r="4.500" fill="#ffc9d6" stroke="${ink}" stroke-width="1.200"/><circle cx="18" cy="-34" r="4.500" fill="#ffc9d6" stroke="${ink}" stroke-width="1.200"/>`)}${tree(362, 150, .7)}
      ${flower(96, 186, '#ff8fab')}${flower(128, 198, '#fff')}${flower(22, 196, '#c9a7f5')}${flower(338, 196, '#f5b942')}
      <g transform="translate(300 96)" fill="none" stroke="${ink}" stroke-width="1.800" stroke-linecap="round"><path d="M0 0q5-6 10 0q5-6 10 0"/><path d="M26 12q4-5 8 0q4-5 8 0"/></g>`,
    // 노아의 무지개: 비 갠 뒤 언덕 위의 방주와 무지개
    ark: `<rect width="400" height="214" fill="#d6ecff"/>
      ${['#ff8a8a', '#ffc27a', '#ffe98a', '#a8e3a0', '#9ccbf5', '#c7b0f0'].map((c, i) => `<path d="M${30 + i * 9} 190a${170 - i * 9} ${150 - i * 9} 0 0 1 ${340 - i * 18} 0" fill="none" stroke="${c}" stroke-width="9"/>`).join('')}
      <ellipse cx="60" cy="46" rx="42" ry="14" fill="#fff"/><ellipse cx="344" cy="40" rx="36" ry="12" fill="#fff"/>
      <path d="M0 166q100-26 200-6t200-10v64H0z" fill="#bfe3a6"/><rect y="186" width="400" height="28" fill="#a5d68c"/>
      <g transform="translate(318 150)" stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M-44 0h88l-12 22h-64z" fill="#b98a5e"/><rect x="-26" y="-20" width="52" height="20" fill="#d9a877"/><path d="M-32-20l32-16 32 16z" fill="#8a5a3c"/><rect x="-6" y="-12" width="12" height="12" fill="#fff6d8"/></g>
      <g transform="translate(60 120)" stroke="${ink}" stroke-width="1.800" stroke-linejoin="round"><path d="M0 0c8-8 20-6 22 2c-8 0-12 4-22-2z" fill="#fff"/><path d="M22 2l8 1" stroke="#5c9c52" stroke-width="2.500"/></g>`,
    // 아브라함의 별밤: 셀 수 없이 많은 별과 장막
    stars: `<rect width="400" height="214" fill="#232a5c"/>${dots(60, '#fff6c9', 150, 1.5)}${dots(14, '#fff', 120, 2.6, 3)}
      <path d="M0 172q100-22 200-4t200-12v58H0z" fill="#3a447e"/><rect y="188" width="400" height="26" fill="#333c72"/>
      <g transform="translate(64 176)" stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M-40 0l40-46 40 46z" fill="#d9a877"/><path d="M0-46l-10 46h20z" fill="#5a3a2a"/><path d="M-40 0l40-46 40 46" fill="none"/></g>
      <g transform="translate(340 184)"><path d="M-8 0l8-14 8 14z" fill="#ff9a4d" stroke="${ink}" stroke-width="1.500"/><path d="M-12 2h24" stroke="${ink}" stroke-width="3" stroke-linecap="round"/></g>`,
    // 갈릴리 호숫가: 잔잔한 호수와 고깃배
    galilee: `<rect width="400" height="214" fill="#cdeeff"/><circle cx="56" cy="42" r="19" fill="#ffd45c"/>
      <path d="M0 112q60-34 130-10t120-14 150 12v30H0z" fill="#b7d8b0"/>
      <rect y="116" width="400" height="48" fill="#6cc3e6"/><path d="M0 130q25-8 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0" fill="none" stroke="#fff" stroke-width="3"/>
      <g transform="translate(322 138)" stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M-34 0h68l-10 16h-48z" fill="#b98a5e"/><path d="M0 0v-46" stroke-width="2.500"/><path d="M2-44l26 34h-26z" fill="#fffdf2"/></g>
      <path d="M0 158q100-14 200 0t200 0v56H0z" fill="#f6dfa4"/>
      <g transform="translate(52 188)" stroke="${ink}" stroke-width="1.800" stroke-linejoin="round"><path d="M-14 0c8-10 22-10 30 0c-8 10-22 10-30 0z" fill="#9ccbf5"/><path d="M16 0l10-7v14z" fill="#9ccbf5"/><circle cx="-6" cy="-1" r="1.300" fill="${ink}"/></g>`,
    // 베들레헴의 밤: 큰 별과 작은 마구간
    bethlehem: `<rect width="400" height="214" fill="#1f2752"/>${dots(40, '#fff6c9', 140, 1.5, 9)}
      <g transform="translate(316 44)"><path d="M0-30l5 22 22 8-22 8-5 34-5-34-22-8 22-8z" fill="#ffe89a"/><path d="M0 12v70" stroke="#ffe89a" stroke-width="3" opacity=".45"/></g>
      <path d="M0 172q100-20 200-4t200-10v56H0z" fill="#39447c"/><rect y="188" width="400" height="26" fill="#323b70"/>
      <g transform="translate(316 176)" stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M-42-26l42-24 42 24z" fill="#8a5a3c"/><rect x="-34" y="-26" width="68" height="34" fill="#d9a877"/><rect x="-12" y="-12" width="24" height="20" fill="#ffe9a8"/><path d="M-9 2h18l-3 6h-12z" fill="#b98a5e"/></g>
      <g transform="translate(44 150)" stroke="${ink}" stroke-width="1.800"><rect x="-8" y="-4" width="16" height="30" rx="3" fill="#5a4a6e"/><rect x="18" y="4" width="14" height="22" rx="3" fill="#4d4366"/><rect x="-30" y="8" width="16" height="18" rx="3" fill="#4d4366"/><rect x="-3" y="4" width="6" height="7" fill="#ffe9a8" stroke="none"/></g>`,
    // 성탄절 눈밭
    snow: `<rect width="400" height="214" fill="#e4f0fb"/>${dots(40, '#fff', 170, 3, 5)}<path d="M0 162q100-24 200-6t200-8v66H0z" fill="#fff"/><g transform="translate(52 150)" stroke="${ink}" stroke-width="2"><circle cy="6" r="16" fill="#fff"/><circle cy="-16" r="11" fill="#fff"/><circle cx="-4" cy="-18" r="1.200" fill="${ink}"/><circle cx="4" cy="-18" r="1.200" fill="${ink}"/><path d="M0-14l8 2-8 2z" fill="#f5923e"/></g><g transform="translate(350 168)" stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M0 0h-24l24-46 24 46z" fill="#6fb872"/><rect x="-4" y="0" width="8" height="10" fill="#b98a5e"/><path d="M0-58l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z" fill="#ffd45c"/></g>`,
  };
  return `<svg class="petbg" viewBox="0 0 400 214" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${scenes[id] || scenes.eden}</svg>`;
}

// 지금 고른 꾸미기. 커플 정보에 저장하고, 저장 칸이 아직 없으면 이 기기에만 기억한다.
let decoState = null;
async function loadDeco() {
  if (decoState) return decoState;
  let d = null;
  const r = await sb.from('couples').select('deco').eq('id', state.couple.id).maybeSingle().then(x => x, () => ({ error: true }));
  if (!r.error && r.data?.deco) d = r.data.deco;
  else { try { d = JSON.parse(localStorage.getItem('deco') || 'null'); } catch (e) { d = null; } }
  return (decoState = { bg: d?.bg || 'eden', items: Array.isArray(d?.items) ? d.items : [] });
}
async function saveDeco() {
  try { localStorage.setItem('deco', JSON.stringify(decoState)); } catch (e) { /* 저장 공간을 못 쓰는 경우는 넘어간다 */ }
  const { error } = await sb.from('couples').update({ deco: decoState }).eq('id', state.couple.id);
  return !error;
}
// 열리지 않은 것은 입히지 않는다
function wornNow(g) {
  const d = decoState || { bg: 'eden', items: [] };
  const ok = x => x && x.need <= g.us;
  return { bg: ok(DECO_BGS.find(b => b.id === d.bg)) ? d.bg : 'eden', items: d.items.filter(id => ok(DECO_ITEMS.find(x => x.id === id))) };
}

// 표가 아직 없으면 0으로 센다
async function growPoints() {
  const count = t => sb.from(t).select('id', { count: 'exact', head: true }).then(r => (r.error ? 0 : r.count || 0), () => 0);
  const [fc, uc, ans] = await Promise.all([
    Promise.all(FAITH_RULES.map(r => (r[0] === 'qt_answers' ? 0 : count(r[0])))),
    Promise.all(US_RULES.map(r => count(r[0]))),
    sb.from('qt_answers').select('q_date').limit(5000).then(r => r.data || [], () => []),
    loadDeco(),
  ]);
  const perDay = {};
  ans.forEach(r => { perDay[r.q_date] = (perDay[r.q_date] || 0) + 1; });
  const both = Object.values(perDay).filter(n => n >= 2).length;
  const faithItems = FAITH_RULES.map(([t, name, pts], i) => ({ name, pts, n: t === 'qt_answers' ? ans.length : fc[i] }));
  const usItems = US_RULES.map(([, name, pts], i) => ({ name, pts, n: uc[i] }));
  const sum = list => list.reduce((a, x) => a + x.n * x.pts, 0);
  const points = sum(faithItems) + both * BOTH_BONUS, us = sum(usItems);
  let stage = 0;
  GROW_STAGES.forEach((x, i) => { if (points >= x.need) stage = i; });
  return (growCache = { points, us, stage, faithItems, usItems, both });
}
// 다음에 열릴 꾸미기
const nextGift = us => [...DECO_BGS, ...DECO_ITEMS].filter(x => x.need > us).sort((a, b) => a.need - b.need)[0];
const growBar = g => {
  const cur = GROW_STAGES[g.stage], nx = GROW_STAGES[g.stage + 1];
  const pct = nx ? (g.points - cur.need) / (nx.need - cur.need) * 100 : 100;
  const gift = nextGift(g.us);
  return `<div class="bbar"><i style="width:${Math.max(g.points ? 3 : 0, pct)}%"></i></div>
    <p class="seednext">⭐ 믿음 ${g.points.toLocaleString('ko-KR')}점${nx ? ` · ${nx.name}까지 ${(nx.need - g.points).toLocaleString('ko-KR')}점` : ' · 다 자랐어요'}</p>
    <p class="seednext">🎁 우리 ${g.us.toLocaleString('ko-KR')}점${gift ? ` · ‘${gift.name}’까지 ${(gift.need - g.us).toLocaleString('ko-KR')}점` : ' · 꾸미기를 모두 열었어요'}</p>`;
};

// 살아 움직이는 성경책: 숨 쉬고, 눈을 깜빡이고, 좌우로 걸어 다니고, 누르면 뛰면서 말을 한다.
const PET_LINES = ['오늘도 같이 읽어요!', '기록할수록 내가 커져요', '오늘의 질문 답했어요?', '말씀 한 구절 어때요?', '둘이 함께라 좋아요', '쑥쑥 자라는 중!', '간지러워요 ㅎㅎ', '오늘 감사한 일은요?', '통독 한 장만 더!'];
function growWidget(g) {
  if (!g) return '<section class="pet"><div class="petfield"></div></section>';
  return `
    <section class="pet">
      <div class="petfield">
        ${decoBg(wornNow(g).bg)}
        <div class="petbubble" hidden></div>
        <button class="petchar" type="button" aria-label="성경책 쓰다듬기"><span class="petflip">${growSvg(g.stage, wornNow(g).items)}</span></button>
      </div>
      <a class="petinfo seedinfo" href="#/grow" aria-label="성경책 키우기 자세히">
        <small>우리 성경책 · ${g.stage + 1}단계</small><b>${GROW_STAGES[g.stage].name}</b>${growBar(g)}
      </a>
    </section>`;
}
let petTimer = 0;
// box 안에 성경책을 그리고 움직이기 시작한다. 화면이 바뀌면 스스로 멈춘다.
function mountPet(box, g) {
  if (!box) return;
  clearTimeout(petTimer);
  box.innerHTML = growWidget(g);
  const field = box.querySelector('.petfield'), ch = box.querySelector('.petchar'), bubble = box.querySelector('.petbubble');
  if (!ch) return;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let x = 0;
  const place = nx => {
    ch.classList.toggle('left', nx < x);
    x = nx;
    field.style.setProperty('--px', x + 'px');
  };
  const wander = () => {
    if (!ch.isConnected) return;
    const range = Math.max(0, (field.clientWidth - ch.clientWidth) / 2 - 6);
    place(Math.round((Math.random() * 2 - 1) * range));
    ch.classList.add('walk');
    setTimeout(() => ch.classList.remove('walk'), 1700);
    petTimer = setTimeout(wander, 3200 + Math.random() * 3000);
  };
  if (!calm) petTimer = setTimeout(wander, 1200);
  let hide = 0;
  ch.onclick = () => {
    ch.classList.remove('jump'); void ch.offsetWidth; ch.classList.add('jump');
    bubble.textContent = PET_LINES[Math.floor(Math.random() * PET_LINES.length)];
    bubble.hidden = false;
    clearTimeout(hide); hide = setTimeout(() => { bubble.hidden = true; }, 2200);
    for (let i = 0; i < 5; i++) {
      const p = document.createElement('i');
      p.className = 'petpop';
      p.textContent = ['⭐', '💛', '✨', '💗'][Math.floor(Math.random() * 4)];
      p.style.setProperty('--dx', Math.round(Math.random() * 120 - 60) + 'px');
      p.style.animationDelay = i * 60 + 'ms';
      field.appendChild(p);
      setTimeout(() => p.remove(), 1300);
    }
  };
}

async function renderGrow() {
  setHeader('성경책 키우기', { back: true });
  const draw = (g, note = '') => {
    const worn = wornNow(g);
    const chip = (x, on, kind) => {
      const open = x.need <= g.us;
      return `<button class="dchip ${on ? 'on' : ''} ${open ? '' : 'lock'}" data-kind="${kind}" data-id="${x.id}" ${open ? '' : 'disabled'}>
        <span class="dart">${kind === 'bg' ? decoBg(x.id) : `<b aria-hidden="true">${x.e}</b>`}</span>
        <b>${x.name}</b><small>${open ? (on ? '쓰는 중' : '열림') : `🔒 우리 ${x.need}점`}</small></button>`;
    };
    const rows = (list, extra = '') => list.map(x => `<div class="grow"><span>${x.name} <small>${x.pts}점</small></span><b>${x.n.toLocaleString('ko-KR')}개 · ${(x.n * x.pts).toLocaleString('ko-KR')}점</b></div>`).join('') + extra;
    view.innerHTML = `
      <div id="gpet"></div>
      <p class="hubline">${GROW_STAGES[g.stage].line}. 성경책을 눌러 보세요.</p>

      <h2 class="hmark">꾸미기</h2>
      <p class="hint">‘우리’ 탭의 기록이 쌓이면 배경과 아이템이 열려요. 고른 모습은 두 사람에게 똑같이 보여요.</p>
      <p class="msg" id="dMsg" role="alert">${esc(note)}</p>
      <div class="dgrid">${DECO_BGS.map(x => chip(x, worn.bg === x.id, 'bg')).join('')}</div>
      <div class="dgrid">${DECO_ITEMS.map(x => chip(x, worn.items.includes(x.id), 'item')).join('')}</div>

      <h2 class="hmark green">자라는 단계</h2>
      <p class="hint">‘믿음’ 탭의 기록이 쌓이면 성경책이 자라요.</p>
      <div class="gstages">${GROW_STAGES.map((s, i) => `
        <div class="gstage ${i === g.stage ? 'now' : i > g.stage ? 'yet' : ''}">${growSvg(i)}<b>${s.name}</b><small>${s.need.toLocaleString('ko-KR')}점</small></div>`).join('')}</div>

      <h2 class="hmark green">믿음 점수 ${g.points.toLocaleString('ko-KR')}점</h2>
      ${rows(g.faithItems, `<div class="grow"><span>질문에 둘 다 답한 날 <small>${BOTH_BONUS}점 더</small></span><b>${g.both}일 · ${g.both * BOTH_BONUS}점</b></div>`)}
      <h2 class="hmark">우리 점수 ${g.us.toLocaleString('ko-KR')}점</h2>
      ${rows(g.usItems)}
      <p class="hint">둘이 남긴 기록을 모두 합쳐서 세요. 기록을 지우면 그만큼 줄어들어요.</p>`;
    mountPet(document.getElementById('gpet'), g);
    view.querySelectorAll('.dchip:not(.lock)').forEach(b => { b.onclick = async () => {
      const id = b.dataset.id;
      if (b.dataset.kind === 'bg') decoState.bg = id;
      else if (decoState.items.includes(id)) decoState.items = decoState.items.filter(x => x !== id);
      else {
        const slot = DECO_ITEMS.find(x => x.id === id).slot;   // 같은 자리 아이템은 바꿔 낀다
        decoState.items = decoState.items.filter(x => DECO_ITEMS.find(y => y.id === x)?.slot !== slot).concat(id);
      }
      const y = window.scrollY;
      draw(g); window.scrollTo(0, y);
      if (!(await saveDeco())) document.getElementById('dMsg').textContent = '이 휴대폰에만 저장됐어요. Supabase에서 꾸미기용 SQL을 실행하면 두 사람에게 함께 보여요.';
    }; });
  };
  if (growCache && decoState) draw(growCache); else view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const g = await growPoints();
  if (location.hash === '#/grow') draw(g);
}
