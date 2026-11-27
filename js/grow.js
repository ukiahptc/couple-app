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
// cover: 직접 고른 표지 색(없으면 단계별 기본 색)
function growSvg(stage, worn = [], cover = '') {
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
    art = `<path d="M66 70l66-6 6 78-70 6z" fill="${cover || '#fffdf2'}" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M118 65l14-1 1 14z" fill="#f1eee4" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M80 84h34M80 94h24" stroke="#cfc8b8" stroke-width="3" stroke-linecap="round"/>${face(101, 116, .9)}`;
  } else {
    // 책 크기와 두께
    const w = [0, 74, 84, 90, 98, 104, 110][stage], h = [0, 86, 98, 106, 114, 120, 126][stage], t = [0, 6, 10, 12, 18, 20, 22][stage];
    const x = 100 - w / 2, y = 150 - h, base = ['', '#bfd9f2', '#b98a5e', '#b98a5e', '#8a5a3c', '#8a5a3c', '#6d3f2a'][stage];
    const edge = stage >= 5 ? '#f5cf5a' : '#fffdf2';
    art = `
      ${stage === 6 ? [[100, y - 26, 0], [52, y - 6, -40], [148, y - 6, 40], [30, y + 34, -75], [170, y + 34, 75]].map(([sx, sy, r]) => `<path d="M${sx} ${sy - 9}v18" transform="rotate(${r} ${sx} ${sy})" stroke="#f5b942" stroke-width="4" stroke-linecap="round"/>`).join('') : ''}
      <path d="M${x + t} ${y + t}h${w}v${h - t}h-${w}z" fill="${edge}" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round" transform="translate(0 0)"/>
      ${Array.from({ length: Math.max(1, Math.round(t / 4)) }, (_, i) => `<path d="M${x + w + 2 + i * 4} ${y + 6 + i * 4}v${h - 8}" stroke="${stage >= 5 ? '#d9a93a' : '#cfc8b8'}" stroke-width="1.5"/>`).join('')}
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${cover || base}" stroke="${ink}" stroke-width="2.4"/>
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

// 꾸미기 숍: '우리' 점수로 테마(바탕 그림), 그 테마에 놓는 소품, 성경책이 걸치는 아이템을 산다.
// 산 것은 옷장에 모이고, 옷장에서 눌러서 쓰거나 뺀다. slot 이 같은 아이템은 하나만 걸친다.
const DECO_ITEMS = [
  { id: 'ribbon',  name: '리본',     price: 5,  slot: 'head', e: '🎀' },
  { id: 'flower',  name: '꽃',       price: 8,  slot: 'side', e: '🌼' },
  { id: 'glasses', name: '안경',     price: 12, slot: 'face', e: '👓' },
  { id: 'balloon', name: '하트 풍선', price: 15, slot: 'hand', e: '🎈' },
  { id: 'beanie',  name: '털모자',   price: 20, slot: 'head', e: '🧢' },
  { id: 'crown',   name: '왕관',     price: 30, slot: 'head', e: '👑' },
  { id: 'wings',   name: '날개',     price: 40, slot: 'back', e: '🪽' },
];
// 테마: 성경 이야기 순서. 바탕 그림(하늘과 땅)과 소품을 따로 판다. 에덴동산 바탕은 처음부터 가지고 있다.
// back: 땅 뒤에 그리는 소품. box: 숍에서 그 소품만 크게 보여 줄 범위.
const DECO_THEMES = [
  { id: 'eden', name: '에덴동산', price: 0, props: [
    { id: 'sun',     name: '해와 구름', price: 2, back: true, box: '200 5 190 100' },
    { id: 'tree',    name: '나무',     price: 4, box: '-20 95 160 90' },
    { id: 'flowers', name: '꽃밭',     price: 3, box: '10 152 140 62' },
    { id: 'river',   name: '강',       price: 4, box: '250 135 150 79' },
    { id: 'birds',   name: '새',       price: 2, back: true, box: '270 75 100 55' },
  ] },
  { id: 'ark', name: '노아의 무지개', price: 15, props: [
    { id: 'rainbow', name: '무지개', price: 6, back: true, box: '0 0 400 214' },
    { id: 'clouds',  name: '구름',   price: 3, back: true, box: '0 10 130 70' },
    { id: 'ark',     name: '방주',   price: 6, box: '258 105 120 75' },
    { id: 'dove',    name: '비둘기', price: 4, box: '35 100 70 40' },
  ] },
  { id: 'stars', name: '아브라함의 별밤', price: 25, props: [
    { id: 'many', name: '수많은 별', price: 6, back: true, box: '100 0 200 110' },
    { id: 'moon', name: '초승달',   price: 4, back: true, box: '285 10 100 60' },
    { id: 'tent', name: '장막',     price: 6, box: '10 120 110 66' },
    { id: 'fire', name: '모닥불',   price: 4, box: '305 160 70 40' },
  ] },
  { id: 'galilee', name: '갈릴리 호숫가', price: 35, props: [
    { id: 'sun',   name: '해',     price: 3, back: true, box: '10 8 100 60' },
    { id: 'hills', name: '먼 산',  price: 4, back: true, box: '60 76 160 70' },
    { id: 'boat',  name: '고깃배', price: 6, box: '272 86 110 76' },
    { id: 'fish',  name: '물고기', price: 4, box: '20 168 70 40' },
  ] },
  { id: 'bethlehem', name: '베들레헴의 밤', price: 45, props: [
    { id: 'stars',   name: '작은 별들', price: 4, back: true, box: '60 0 200 110' },
    { id: 'bigstar', name: '큰 별',    price: 8, back: true, box: '246 8 140 100' },
    { id: 'stable',  name: '마구간',   price: 8, box: '262 118 110 72' },
    { id: 'village', name: '마을',     price: 5, box: '-6 132 100 56' },
  ] },
  { id: 'snow', name: '성탄절 눈밭', price: 55, props: [
    { id: 'flakes',  name: '눈송이',   price: 4, back: true, box: '100 20 200 110' },
    { id: 'snowman', name: '눈사람',   price: 6, box: '12 116 80 62' },
    { id: 'tree',    name: '성탄 나무', price: 8, box: '296 96 104 84' },
  ] },
];
// 테마 그림 조각: 하늘(sky), 땅(ground), 소품(props). 처음 쓸 때 한 번만 만든다.
let decoArtCache = null;
function decoArt() {
  if (decoArtCache) return decoArtCache;
  const ink = '#3b342c';
  const dots = (n, f, yMax, r = 2, seed = 7) => Array.from({ length: n }, (_, i) => { const a = Math.sin((i + 1) * seed * 12.9898) * 43758.5453, b = Math.sin((i + 1) * seed * 78.233) * 12345.678; const x = (a - Math.floor(a)) * 400, y = (b - Math.floor(b)) * yMax; return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r}" fill="${f}"/>`; }).join('');
  const flower = (x, y, c) => `<g transform="translate(${x} ${y})"><path d="M0 0v14" stroke="#5c9c52" stroke-width="2.500"/><circle r="6" fill="${c}" stroke="${ink}" stroke-width="1.500"/><circle r="2" fill="#f5cf5a"/></g>`;
  const tree = (x, y, k = 1, fruit = '') => `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-5 0c2-14 0-24 2-36h8c0 12 2 22 4 36z" fill="#b98a5e" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/><path d="M-30-40c-12-20 6-34 20-26c4-18 34-16 34 0c18-2 22 22 6 28c2 14-18 18-28 8c-10 10-32 6-32-10z" fill="#7fc47a" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>${fruit}</g>`;
  return (decoArtCache = {
    // 에덴동산: 강이 흐르고 나무와 꽃이 있는 동산
    eden: {
      sky: `<rect width="400" height="214" fill="#dff5ff"/>`,
      ground: `<path d="M0 150q100-30 200-8t200-12v84H0z" fill="#bfe8a6"/><path d="M0 178q110-18 210-4t190-8v48H0z" fill="#a5dc8c"/>`,
      props: {
        sun: `<circle cx="352" cy="36" r="18" fill="#ffe27a"/><ellipse cx="96" cy="38" rx="40" ry="13" fill="#fff"/><ellipse cx="250" cy="58" rx="34" ry="11" fill="#fff"/>`,
        river: `<path d="M400 150c-50 4-70 18-110 26s-60 22-50 38h70c-6-12 20-22 50-28s40-14 40-20z" fill="#9bdcf2" stroke="${ink}" stroke-width="1.500" opacity=".95"/>`,
        tree: tree(48, 172, 1, `<circle cx="-12" cy="-44" r="4.500" fill="#ffc9d6" stroke="${ink}" stroke-width="1.200"/><circle cx="10" cy="-54" r="4.500" fill="#ffc9d6" stroke="${ink}" stroke-width="1.200"/><circle cx="18" cy="-34" r="4.500" fill="#ffc9d6" stroke="${ink}" stroke-width="1.200"/>`) + tree(362, 150, .7),
        flowers: flower(96, 186, '#ff8fab') + flower(128, 198, '#fff') + flower(22, 196, '#c9a7f5') + flower(338, 196, '#f5b942'),
        birds: `<g transform="translate(300 96)" fill="none" stroke="${ink}" stroke-width="1.800" stroke-linecap="round"><path d="M0 0q5-6 10 0q5-6 10 0"/><path d="M26 12q4-5 8 0q4-5 8 0"/></g>`,
      },
    },
    // 노아의 무지개: 비 갠 뒤 언덕 위의 방주와 무지개
    ark: {
      sky: `<rect width="400" height="214" fill="#d6ecff"/>`,
      ground: `<path d="M0 166q100-26 200-6t200-10v64H0z" fill="#bfe3a6"/><rect y="186" width="400" height="28" fill="#a5d68c"/>`,
      props: {
        rainbow: ['#ff8a8a', '#ffc27a', '#ffe98a', '#a8e3a0', '#9ccbf5', '#c7b0f0'].map((c, i) => `<path d="M${30 + i * 9} 190a${170 - i * 9} ${150 - i * 9} 0 0 1 ${340 - i * 18} 0" fill="none" stroke="${c}" stroke-width="9"/>`).join(''),
        clouds: `<ellipse cx="60" cy="46" rx="42" ry="14" fill="#fff"/><ellipse cx="344" cy="40" rx="36" ry="12" fill="#fff"/>`,
        ark: `<g transform="translate(318 150)" stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M-44 0h88l-12 22h-64z" fill="#b98a5e"/><rect x="-26" y="-20" width="52" height="20" fill="#d9a877"/><path d="M-32-20l32-16 32 16z" fill="#8a5a3c"/><rect x="-6" y="-12" width="12" height="12" fill="#fff6d8"/></g>`,
        dove: `<g transform="translate(60 120)" stroke="${ink}" stroke-width="1.800" stroke-linejoin="round"><path d="M0 0c8-8 20-6 22 2c-8 0-12 4-22-2z" fill="#fff"/><path d="M22 2l8 1" stroke="#5c9c52" stroke-width="2.500"/></g>`,
      },
    },
    // 아브라함의 별밤: 셀 수 없이 많은 별과 장막
    stars: {
      sky: `<rect width="400" height="214" fill="#232a5c"/>${dots(14, '#fff', 120, 2.6, 3)}`,
      ground: `<path d="M0 172q100-22 200-4t200-12v58H0z" fill="#3a447e"/><rect y="188" width="400" height="26" fill="#333c72"/>`,
      props: {
        many: dots(60, '#fff6c9', 150, 1.5),
        moon: `<path d="M338 22a22 22 0 1 0 18 36a17 17 0 1 1-18-36z" fill="#ffe89a"/>`,
        tent: `<g transform="translate(64 176)" stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M-40 0l40-46 40 46z" fill="#d9a877"/><path d="M0-46l-10 46h20z" fill="#5a3a2a"/><path d="M-40 0l40-46 40 46" fill="none"/></g>`,
        fire: `<g transform="translate(340 184)"><path d="M-8 0l8-14 8 14z" fill="#ff9a4d" stroke="${ink}" stroke-width="1.500"/><path d="M-12 2h24" stroke="${ink}" stroke-width="3" stroke-linecap="round"/></g>`,
      },
    },
    // 갈릴리 호숫가: 잔잔한 호수와 고깃배
    galilee: {
      sky: `<rect width="400" height="214" fill="#cdeeff"/>`,
      ground: `<rect y="116" width="400" height="48" fill="#6cc3e6"/><path d="M0 130q25-8 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0" fill="none" stroke="#fff" stroke-width="3"/><path d="M0 158q100-14 200 0t200 0v56H0z" fill="#f6dfa4"/>`,
      props: {
        sun: `<circle cx="56" cy="42" r="19" fill="#ffd45c"/>`,
        hills: `<path d="M0 112q60-34 130-10t120-14 150 12v30H0z" fill="#b7d8b0"/>`,
        boat: `<g transform="translate(322 138)" stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M-34 0h68l-10 16h-48z" fill="#b98a5e"/><path d="M0 0v-46" stroke-width="2.500"/><path d="M2-44l26 34h-26z" fill="#fffdf2"/></g>`,
        fish: `<g transform="translate(52 188)" stroke="${ink}" stroke-width="1.800" stroke-linejoin="round"><path d="M-14 0c8-10 22-10 30 0c-8 10-22 10-30 0z" fill="#9ccbf5"/><path d="M16 0l10-7v14z" fill="#9ccbf5"/><circle cx="-6" cy="-1" r="1.300" fill="${ink}"/></g>`,
      },
    },
    // 베들레헴의 밤: 큰 별과 작은 마구간
    bethlehem: {
      sky: `<rect width="400" height="214" fill="#1f2752"/>`,
      ground: `<path d="M0 172q100-20 200-4t200-10v56H0z" fill="#39447c"/><rect y="188" width="400" height="26" fill="#323b70"/>`,
      props: {
        stars: dots(40, '#fff6c9', 140, 1.5, 9),
        bigstar: `<g transform="translate(316 44)"><path d="M0-30l5 22 22 8-22 8-5 34-5-34-22-8 22-8z" fill="#ffe89a"/><path d="M0 12v70" stroke="#ffe89a" stroke-width="3" opacity=".45"/></g>`,
        stable: `<g transform="translate(316 176)" stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M-42-26l42-24 42 24z" fill="#8a5a3c"/><rect x="-34" y="-26" width="68" height="34" fill="#d9a877"/><rect x="-12" y="-12" width="24" height="20" fill="#ffe9a8"/><path d="M-9 2h18l-3 6h-12z" fill="#b98a5e"/></g>`,
        village: `<g transform="translate(44 150)" stroke="${ink}" stroke-width="1.800"><rect x="-8" y="-4" width="16" height="30" rx="3" fill="#5a4a6e"/><rect x="18" y="4" width="14" height="22" rx="3" fill="#4d4366"/><rect x="-30" y="8" width="16" height="18" rx="3" fill="#4d4366"/><rect x="-3" y="4" width="6" height="7" fill="#ffe9a8" stroke="none"/></g>`,
      },
    },
    // 성탄절 눈밭
    snow: {
      sky: `<rect width="400" height="214" fill="#e4f0fb"/>`,
      ground: `<path d="M0 162q100-24 200-6t200-8v66H0z" fill="#fff"/>`,
      props: {
        flakes: dots(40, '#fff', 170, 3, 5),
        snowman: `<g transform="translate(52 150)" stroke="${ink}" stroke-width="2"><circle cy="6" r="16" fill="#fff"/><circle cy="-16" r="11" fill="#fff"/><circle cx="-4" cy="-18" r="1.200" fill="${ink}"/><circle cx="4" cy="-18" r="1.200" fill="${ink}"/><path d="M0-14l8 2-8 2z" fill="#f5923e"/></g>`,
        tree: `<g transform="translate(350 168)" stroke="${ink}" stroke-width="2" stroke-linejoin="round"><path d="M0 0h-24l24-46 24 46z" fill="#6fb872"/><rect x="-4" y="0" width="8" height="10" fill="#b98a5e"/><path d="M0-58l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z" fill="#ffd45c"/></g>`,
      },
    },
  });
}
// 배경 그림. on: 놓을 소품 id 목록('eden.tree' 꼴) 또는 'all'. box 를 주면 그 범위만 크게 보여 준다.
function decoBg(id, on = [], box = null) {
  const th = DECO_THEMES.find(t => t.id === id) || DECO_THEMES[0], art = decoArt()[th.id];
  const has = p => on === 'all' || on.includes(th.id + '.' + p.id);
  const layer = back => th.props.filter(p => !!p.back === back && has(p)).map(p => art.props[p.id]).join('');
  return `<svg class="petbg" viewBox="${box || '0 0 400 214'}" preserveAspectRatio="${box ? 'xMidYMid' : 'xMidYMax'} slice" aria-hidden="true">${art.sky}${layer(true)}${art.ground}${layer(false)}</svg>`;
}

// 꾸미기 상태. bg: 쓰는 테마, props: 놓아 둔 소품, items: 걸친 아이템, owned: 산 것 전부.
// 커플 정보에 저장하고, 서버에서 못 읽으면 이 기기에 기억해 둔 것을 쓴다.
let decoState = null;
const decoList = v => (Array.isArray(v) ? v.filter(x => typeof x === 'string') : []);
const cleanDeco = d => ({ cover: /^#[0-9a-f]{6}$/i.test(d?.cover || '') ? d.cover : '', bg: d?.bg || 'eden', items: decoList(d?.items), props: decoList(d?.props), owned: decoList(d?.owned) });
async function fetchDeco() {
  const r = await sb.from('couples').select('deco').eq('id', state.couple.id).maybeSingle().then(x => x, () => ({ error: true }));
  return !r.error && r.data ? cleanDeco(r.data.deco) : null;
}
async function loadDeco(fresh) {
  if (decoState && !fresh) return decoState;
  let d = await fetchDeco();
  if (!d) { try { d = cleanDeco(JSON.parse(localStorage.getItem('deco') || 'null')); } catch (e) { d = cleanDeco(null); } }
  return (decoState = d);
}
// 저장 직전에 서버 것을 다시 읽어, 상대가 그 사이에 산 것이 지워지지 않게 합친다
async function saveDeco() {
  const now = await fetchDeco();
  if (now) decoState.owned = [...new Set([...now.owned, ...decoState.owned])];
  try { localStorage.setItem('deco', JSON.stringify(decoState)); } catch (e) { /* 저장 공간을 못 쓰는 경우는 넘어간다 */ }
  const { error } = await sb.from('couples').update({ deco: decoState }).eq('id', state.couple.id).then(x => x, () => ({ error: true }));
  return !error;
}
// 숍에서 파는 것 전부: 테마 바탕, 소품('테마.소품'), 아이템
const SHOP_GOODS = [
  ...DECO_THEMES.map(t => ({ id: t.id, name: t.name + ' 바탕', price: t.price, kind: 'bg' })),
  ...DECO_THEMES.flatMap(t => t.props.map(p => ({ id: t.id + '.' + p.id, name: p.name, price: p.price, kind: 'prop', theme: t.id }))),
  ...DECO_ITEMS.map(x => ({ ...x, kind: 'item' })),
];
const goodOf = id => SHOP_GOODS.find(x => x.id === id);
const isOwned = id => id === 'eden' || !!decoState?.owned.includes(id);
const decoSpent = () => [...new Set(decoState?.owned || [])].reduce((a, id) => a + (goodOf(id)?.price || 0), 0);
const decoWallet = g => Math.max(0, g.us - decoSpent());   // 쓸 수 있는 점수 = 모은 우리 점수 − 쓴 점수
// 지금 보여 줄 모습. 가지고 있지 않은 것은 빼고 그린다.
function wornNow() {
  const d = decoState || cleanDeco(null);
  const bg = isOwned(d.bg) && DECO_THEMES.some(t => t.id === d.bg) ? d.bg : 'eden';
  return { bg, cover: d.cover, props: d.props.filter(isOwned), items: d.items.filter(id => isOwned(id) && DECO_ITEMS.some(x => x.id === id)) };
}
// 쓰기/빼기. 테마는 바꿔 깔고, 소품과 아이템은 켰다 껐다 한다. 같은 자리 아이템은 바꿔 낀다.
function applyDeco(id, on) {
  const x = goodOf(id);
  if (!x) return;
  if (x.kind === 'bg') decoState.bg = id;
  else if (x.kind === 'prop') decoState.props = decoState.props.filter(p => p !== id).concat(on ? id : []);
  else decoState.items = decoState.items.filter(i => i !== id && !(on && DECO_ITEMS.find(y => y.id === i)?.slot === x.slot)).concat(on ? id : []);
}
// 사기. 잘되면 빈 글, 안 되면 까닭을 돌려준다. 산 것은 바로 적용한다.
async function buyDeco(id, g) {
  await loadDeco(true);
  const x = goodOf(id);
  if (!x || isOwned(id)) return '이미 가지고 있어요.';
  if (x.kind === 'prop' && !isOwned(x.theme)) return '테마 바탕을 먼저 사야 해요.';
  if (x.price > decoWallet(g)) return `점수가 ${x.price - decoWallet(g)}점 모자라요.`;
  const before = JSON.stringify(decoState);
  decoState.owned.push(id);
  applyDeco(id, true);
  if (await saveDeco()) return '';
  decoState = JSON.parse(before);
  return '저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.';
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
const growBar = g => {
  const cur = GROW_STAGES[g.stage], nx = GROW_STAGES[g.stage + 1];
  const pct = nx ? (g.points - cur.need) / (nx.need - cur.need) * 100 : 100;
  return `<div class="bbar"><i style="width:${Math.max(g.points ? 3 : 0, pct)}%"></i></div>
    <p class="seednext">⭐ 믿음 ${g.points.toLocaleString('ko-KR')}점${nx ? ` · ${nx.name}까지 ${(nx.need - g.points).toLocaleString('ko-KR')}점` : ' · 다 자랐어요'}</p>
    <p class="seednext">🎁 꾸미기에 쓸 수 있는 우리 점수 ${decoWallet(g).toLocaleString('ko-KR')}점</p>`;
};

// 살아 움직이는 성경책: 숨 쉬고, 눈을 깜빡이고, 좌우로 걸어 다니고, 누르면 뛰면서 말을 한다.
const PET_LINES = ['오늘도 같이 읽어요!', '기록할수록 내가 커져요', '오늘의 질문 답했어요?', '말씀 한 구절 어때요?', '둘이 함께라 좋아요', '쑥쑥 자라는 중!', '간지러워요 ㅎㅎ', '오늘 감사한 일은요?', '통독 한 장만 더!'];
function growWidget(g) {
  if (!g) return '<section class="pet"><div class="petfield"></div></section>';
  return `
    <section class="pet">
      <div class="petfield">
        ${decoBg(wornNow().bg, wornNow().props)}
        <a class="petshop" href="#/shop">🛍 꾸미기</a>
        <div class="petbubble" hidden></div>
        <button class="petchar" type="button" aria-label="성경책 쓰다듬기"><span class="petflip">${growSvg(g.stage, wornNow().items, wornNow().cover)}</span></button>
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
  const draw = g => {
    const rows = (list, extra = '') => list.map(x => `<div class="grow"><span>${x.name} <small>${x.pts}점</small></span><b>${x.n.toLocaleString('ko-KR')}개 · ${(x.n * x.pts).toLocaleString('ko-KR')}점</b></div>`).join('') + extra;
    view.innerHTML = `
      <div id="gpet"></div>
      <p class="hubline">${GROW_STAGES[g.stage].line}. 성경책을 눌러 보세요.</p>

      <h2 class="hmark">꾸미기</h2>
      <p class="hint">‘우리’ 탭의 기록으로 모은 점수로 배경과 소품, 아이템을 사서 꾸며요.</p>
      <nav class="shoptabs"><a href="#/shop">🛍 숍</a><a href="#/shop/closet">🚪 옷장</a></nav>

      <h2 class="hmark green">자라는 단계</h2>
      <p class="hint">‘믿음’ 탭의 기록이 쌓이면 성경책이 자라요.</p>
      <div class="gstages">${GROW_STAGES.map((s, i) => `
        <div class="gstage ${i === g.stage ? 'now' : i > g.stage ? 'yet' : ''}">${growSvg(i)}<b>${s.name}</b><small>${s.need.toLocaleString('ko-KR')}점</small></div>`).join('')}</div>

      <h2 class="hmark green">믿음 점수 ${g.points.toLocaleString('ko-KR')}점</h2>
      ${rows(g.faithItems, `<div class="grow"><span>질문에 둘 다 답한 날 <small>${BOTH_BONUS}점 더</small></span><b>${g.both}일 · ${g.both * BOTH_BONUS}점</b></div>`)}
      <h2 class="hmark">우리 점수 ${g.us.toLocaleString('ko-KR')}점</h2>
      ${rows(g.usItems)}
      <div class="grow"><span>꾸미기에 쓴 점수</span><b>−${decoSpent().toLocaleString('ko-KR')}점</b></div>
      <div class="grow"><span>쓸 수 있는 점수</span><b>${decoWallet(g).toLocaleString('ko-KR')}점</b></div>
      <p class="hint">둘이 남긴 기록을 모두 합쳐서 세요. 기록을 지우면 그만큼 줄어들어요.</p>`;
    mountPet(document.getElementById('gpet'), g);
  };
  if (growCache && decoState) draw(growCache); else view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const g = await growPoints();
  if (location.hash === '#/grow') draw(g);
}

// ───────── 꾸미기 숍과 옷장 ─────────
// 숍(#/shop): 점수로 산다. 옷장(#/shop/closet): 산 것만 모여 있고, 눌러서 쓰거나 뺀다.
async function renderShop(param) {
  const closet = param === 'closet', here = location.hash;
  setHeader(closet ? '옷장' : '꾸미기 숍', { back: true });
  const draw = (g, note = '', ok = false) => {
    const worn = wornNow(), left = decoWallet(g);
    // 숍의 물건 한 칸
    const sell = (id, art, lockTheme) => {
      const x = goodOf(id), have = isOwned(id), poor = !have && x.price > left;
      return `<button class="dchip ${have ? 'have' : ''} ${lockTheme && !have ? 'lock' : ''} ${poor ? 'poor' : ''}" data-buy="${id}" ${have ? 'disabled' : ''}>
        <span class="dart">${art}</span><b>${x.name}</b><small>${have ? '✓ 가지고 있어요' : `${x.price}점`}</small></button>`;
    };
    // 옷장의 물건 한 칸
    const wear = (id, art, on, name) => `<button class="dchip ${on ? 'on' : ''}" data-wear="${id}" aria-pressed="${on}">
        <span class="dart">${art}</span><b>${name || goodOf(id).name}</b><small>${on ? '쓰는 중' : '눌러서 쓰기'}</small></button>`;
    const emoji = x => `<b aria-hidden="true">${x.e}</b>`;
    let body;
    if (!closet) {
      body = DECO_THEMES.map(t => {
        const have = isOwned(t.id);
        return `<section class="shopth">
          <div class="shophead"><span class="dart">${decoBg(t.id, 'all')}</span>
            <div><b>${t.name}</b><small>${have ? '✓ 바탕을 가지고 있어요' : `바탕 ${t.price}점 · 소품 ${t.props.length}개`}</small>
            ${have ? '' : `<button class="shopbuy ${t.price > left ? 'poor' : ''}" data-buy="${t.id}">바탕 사기 · ${t.price}점</button>`}</div></div>
          <div class="dgrid">${t.props.map(p => sell(t.id + '.' + p.id, decoBg(t.id, [t.id + '.' + p.id], p.box), !have)).join('')}</div>
        </section>`;
      }).join('') + `<h2 class="hmark">성경책 아이템</h2><div class="dgrid">${DECO_ITEMS.map(x => sell(x.id, emoji(x))).join('')}</div>`;
    } else {
      const th = DECO_THEMES.find(t => t.id === worn.bg);
      const myProps = th.props.filter(p => isOwned(th.id + '.' + p.id)), myItems = DECO_ITEMS.filter(x => isOwned(x.id));
      const empty = what => `<p class="hint">${what} <a href="#/shop">숍에서 보기</a></p>`;
      body = `<h2 class="hmark">테마</h2>
        <div class="dgrid">${DECO_THEMES.filter(t => isOwned(t.id)).map(t => wear(t.id, decoBg(t.id, decoState.props.filter(isOwned)), worn.bg === t.id, t.name)).join('')}</div>
        <h2 class="hmark green">${th.name} 소품</h2>
        ${myProps.length ? `<div class="dgrid">${myProps.map(p => wear(th.id + '.' + p.id, decoBg(th.id, [th.id + '.' + p.id], p.box), worn.props.includes(th.id + '.' + p.id))).join('')}</div>` : empty('이 테마의 소품이 아직 없어요.')}
        <h2 class="hmark">표지 색</h2>
        <div class="coverrow"><button class="cpsw" id="coverPick" style="--c:${worn.cover || '#f1eee4'}" aria-label="표지 색 고르기"></button>
          <button class="txt" id="coverPick2">🎨 색 고르기</button>${worn.cover ? '<button class="txt" id="coverReset">기본 색으로</button>' : ''}</div>
        <p class="hint">${worn.cover ? '고른 색이 표지에 칠해져 있어요.' : '지금은 자라는 단계에 맞는 기본 색이에요.'}</p>
        <h2 class="hmark green">성경책 아이템</h2>
        ${myItems.length ? `<div class="dgrid">${myItems.map(x => wear(x.id, emoji(x), worn.items.includes(x.id))).join('')}</div>` : empty('아직 산 아이템이 없어요.')}
        <p class="hint">모자처럼 같은 자리에 쓰는 아이템은 하나만 걸칠 수 있어요. 고른 모습은 두 사람에게 똑같이 보여요.</p>`;
    }
    view.innerHTML = `
      <div id="gpet"></div>
      <p class="wallet">🎁 쓸 수 있는 점수 <b>${left.toLocaleString('ko-KR')}점</b><small>모은 우리 점수 ${g.us.toLocaleString('ko-KR')}점 − 쓴 점수 ${decoSpent().toLocaleString('ko-KR')}점</small></p>
      <nav class="shoptabs"><a href="#/shop" ${closet ? '' : 'aria-current="page"'}>🛍 숍</a><a href="#/shop/closet" ${closet ? 'aria-current="page"' : ''}>🚪 옷장</a></nav>
      <p class="msg ${ok ? 'ok' : ''}" id="dMsg" role="alert">${esc(note)}</p>
      ${body}`;
    mountPet(document.getElementById('gpet'), g);
    const redraw = (note, ok) => { const y = window.scrollY; draw(g, note, ok); window.scrollTo(0, y); };
    view.querySelectorAll('[data-buy]').forEach(b => { b.onclick = async () => {
      const x = goodOf(b.dataset.buy);
      if (x.kind === 'prop' && !isOwned(x.theme)) return redraw('테마 바탕을 먼저 사야 소품을 살 수 있어요.');
      if (x.price > left) return redraw(`‘${x.name}’까지 ${x.price - left}점이 더 필요해요.`);
      if (!confirm(`‘${x.name}’ · ${x.price}점\n살까요? 사고 나면 ${left - x.price}점이 남아요.`)) return;
      b.disabled = true;
      const err = await buyDeco(x.id, g);
      if (location.hash === here) redraw(err || `‘${x.name}’ 구매 완료! 바로 적용했어요. 옷장에서 빼거나 바꿀 수 있어요.`, !err);
    }; });
    const setCover = async c => {
      decoState.cover = c; redraw('');
      if (!(await saveDeco()) && location.hash === here) document.getElementById('dMsg').textContent = '이 휴대폰에만 반영됐어요. 인터넷 연결을 확인해 주세요.';
    };
    view.querySelectorAll('#coverPick, #coverPick2').forEach(b => { b.onclick = () => openColorPicker({ value: worn.cover || '#b98a5e', onDone: setCover }); });
    const reset = document.getElementById('coverReset');
    if (reset) reset.onclick = () => setCover('');
    view.querySelectorAll('[data-wear]').forEach(b => { b.onclick = async () => {
      const id = b.dataset.wear, x = goodOf(id);
      applyDeco(id, x.kind === 'bg' ? true : b.getAttribute('aria-pressed') !== 'true');
      redraw('');
      if (!(await saveDeco()) && location.hash === here) document.getElementById('dMsg').textContent = '이 휴대폰에만 반영됐어요. 인터넷 연결을 확인해 주세요.';
    }; });
  };
  if (growCache && decoState) draw(growCache); else view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const g = await growPoints();
  await loadDeco(true);
  if (location.hash === here) draw(g);
}
