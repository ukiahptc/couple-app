// ───────── 귀여운 아이콘 ─────────
// 성경책 캐릭터와 같은 그림체(먹색 테두리 + 파스텔 색 + 작은 얼굴)로 직접 그린 아이콘. cuteIcon('home') 처럼 쓴다.
const CUTE_ICONS = (() => {
  const ink = '#3b342c';
  // 얼굴: 눈 두 개, 웃는 입, 볼터치
  const face = (x, y, k = 1) => `<g stroke="none"><ellipse cx="${x - 8.5 * k}" cy="${y + 2.6 * k}" rx="${2.3 * k}" ry="${1.5 * k}" fill="#ffb3c4"/><ellipse cx="${x + 8.5 * k}" cy="${y + 2.6 * k}" rx="${2.3 * k}" ry="${1.5 * k}" fill="#ffb3c4"/><circle cx="${x - 5 * k}" cy="${y}" r="${1.5 * k}" fill="${ink}"/><circle cx="${x + 5 * k}" cy="${y}" r="${1.5 * k}" fill="${ink}"/></g><path d="M${x - 2.5 * k} ${y + 2.8 * k}q${2.5 * k} ${2.6 * k} ${5 * k} 0" fill="none" stroke="${ink}" stroke-width="1.5" stroke-linecap="round"/>`;
  return {
    // 탭
    home: `<rect x="31" y="9" width="5" height="9" rx="1" fill="#d9a877"/><rect x="10" y="22" width="28" height="20" rx="4" fill="#fffdf2"/><path d="M5 24L24 7l19 17z" fill="#ff8fab"/>${face(24, 31)}`,
    us: `<path d="M37 21c-5-4-8-7-8-11c0-5 6-6 8-2c2-4 8-3 8 2c0 4-3 7-8 11z" fill="#ffd0dc"/><path d="M21 42C10 34 4 27 4 19c0-10 12-12 17-4c5-8 17-6 17 4c0 8-6 15-17 23z" fill="#ff8fab"/>${face(21, 24)}`,
    faith: `<path d="M13 9h25v32H13z" fill="#fffdf2"/><rect x="9" y="6" width="27" height="35" rx="4" fill="#b98a5e"/><path d="M14 7v33" stroke-width="1.5" opacity=".5"/><path d="M25 10v9M21.500 13.500h7" stroke="#fff3d6" stroke-width="3"/><rect x="15" y="23" width="20" height="13" rx="5" fill="#fffdf2"/>${face(25, 28, .8)}<path d="M29 41v5l2.500-2 2.500 2v-5" fill="#e2557a"/>`,
    // 우리
    calendar: `<rect x="7" y="10" width="34" height="32" rx="6" fill="#fffdf2"/><path d="M7 20v-4a6 6 0 0 1 6-6h22a6 6 0 0 1 6 6v4z" fill="#ff8fab"/><path d="M16 6v8M32 6v8" stroke-width="2.600"/>${face(24, 29)}`,
    diary: `<rect x="10" y="6" width="29" height="36" rx="5" fill="#c9a7f5"/><path d="M16 6v36" stroke-width="1.500" opacity=".5"/><path d="M7 14h6M7 24h6M7 34h6" stroke-width="2.400"/><rect x="20" y="11" width="14" height="6" rx="2" fill="#fffdf2"/>${face(27, 27)}`,
    food: `<path d="M17 9c-2-2 2-3 0-5.500M24 9c-2-2 2-3 0-5.500M31 9c-2-2 2-3 0-5.500" fill="none" stroke-width="1.600" opacity=".55"/><path d="M10 25c0-12 28-12 28 0z" fill="#fff"/><path d="M5 24h38c0 11-8 18-19 18S5 35 5 24z" fill="#ffc9a8"/>${face(24, 31)}`,
    money: `<circle cx="24" cy="25" r="18" fill="#f5cf5a"/><circle cx="24" cy="25" r="13.500" fill="#ffe89a" stroke-width="1.400" opacity=".9"/>${face(24, 24)}<path d="M38 6l1.200 3 3 1.200-3 1.200-1.200 3-1.200-3-3-1.200 3-1.200z" fill="#fff" stroke-width="1.200"/>`,
    map: `<ellipse cx="24" cy="43" rx="8" ry="2.500" fill="rgba(59,52,44,.15)" stroke="none"/><path d="M24 42C14 31 9 25 9 19a15 15 0 0 1 30 0c0 6-5 12-15 23z" fill="#7fc47a"/>${face(24, 18)}`,
    album: `<path d="M17 14l2.500-5h9l2.500 5z" fill="#7fb7e6"/><rect x="5" y="13" width="38" height="28" rx="7" fill="#bfdcf5"/><circle cx="24" cy="27" r="10" fill="#fffdf2"/>${face(24, 26, .8)}<circle cx="37" cy="19" r="1.800" fill="#f5cf5a" stroke-width="1.200"/>`,
    // 믿음
    ask: `<path d="M9 8h30a5 5 0 0 1 5 5v18a5 5 0 0 1-5 5H24l-9 8v-8H9a5 5 0 0 1-5-5V13a5 5 0 0 1 5-5z" fill="#d6ecff"/>${face(24, 21)}`,
    qt: `<path d="M9 27l-6-5 1 10z" fill="#fff"/><path d="M8 30c0-9 9-13 18-11c2-7 13-7 15 0c1 4-1 7-4 8c0 9-8 14-16 14S8 37 8 30z" fill="#fff"/><path d="M15 29c4-6 12-6 15 0c-3 5-11 6-15 0z" fill="#dfeaf6"/><path d="M41 20l5 2-5 2z" fill="#f5923e"/><g stroke="none"><circle cx="36" cy="20" r="1.600" fill="${ink}"/><ellipse cx="33" cy="24" rx="2.300" ry="1.500" fill="#ffb3c4"/></g><path d="M45 23c3 0 3 5-1 5c-2 0-2-3 1-5z" fill="#7fc47a" stroke-width="1.300"/>`,
    bible: `<path d="M24 13c-5-4-12-4-19-2v27c7-2 14-2 19 2c5-4 12-4 19-2V11c-7-2-14-2-19 2z" fill="#fffdf2"/><path d="M24 13v27" stroke-width="1.500"/><path d="M9 17q5-1.500 10 0M29 17q5-1.500 10 0" fill="none" stroke="#cfc8b8" stroke-width="1.800"/>${face(24, 27, 1.5)}<path d="M33 36v8l2.500-2 2.500 2v-8" fill="#e2557a"/>`,
    thanks: `<path d="M14 12h20v3c4 2 6 5 6 9v13a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6V24c0-4 2-7 6-9z" fill="#e6f6ff"/><rect x="12" y="5" width="24" height="8" rx="3" fill="#d9a877"/><path d="M24 23.500c-2.500-3.500-7-.500-4 3l4 3.500 4-3.500c3-3.500-1.500-6.500-4-3z" fill="#ff8fab" stroke-width="1.400"/>${face(24, 35, .9)}`,
  };
})();
const cuteIcon = name => (CUTE_ICONS[name] ? `<svg class="cicon" viewBox="0 0 48 48" aria-hidden="true"><g stroke="#3b342c" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${CUTE_ICONS[name]}</g></svg>` : '');
