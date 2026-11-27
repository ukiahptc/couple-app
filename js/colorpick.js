// ───────── 색 고르기 창 ─────────
// 앱 어디서든 같은 창으로 색을 고른다. openColorPicker({ value: '#rrggbb', onDone: hex => {} })
// 표준(정해 둔 색) / 사용자 지정(색상 판 + 명도 + 색상 코드) 두 가지 방법, 최근에 쓴 색 5개, 스포이드(지원하는 브라우저만).
const CP_PRESETS = ['#ff8fab', '#ffd0dc', '#e2557a', '#f5923e', '#f5b942', '#fff3b8', '#7fc47a', '#e2f5d0', '#5c9c52', '#7fb7e6', '#d6ecff', '#3a447e', '#c9a7f5', '#e9defa', '#b98a5e', '#8a5a3c', '#6d3f2a', '#3b342c', '#9a9186', '#ffffff'];
const cpHex = (r, g, b) => '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
const cpRgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const cpValid = hex => /^#[0-9a-f]{6}$/i.test(hex || '');
// h: 0~360, s·v: 0~1
function cpFromHsv(h, s, v) {
  const f = n => { const k = (n + h / 60) % 6; return (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255; };
  return [f(5), f(3), f(1)];
}
function cpToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), d = mx - Math.min(r, g, b);
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, mx ? d / mx : 0, mx];
}
const cpRecent = () => { try { return JSON.parse(localStorage.getItem('cpRecent') || '[]').filter(cpValid).slice(0, 5); } catch (e) { return []; } };

function openColorPicker({ value, onDone }) {
  let [h, s, v] = cpToHsv(...cpRgb(cpValid(value) ? value : '#7fb7e6'));
  const wrap = document.createElement('div');
  wrap.className = 'cpwrap';
  wrap.innerHTML = `
    <div class="cp" role="dialog" aria-modal="true" aria-label="색 고르기">
      <div class="cptabs"><button type="button" data-t="std">표준</button><button type="button" data-t="custom">사용자 지정</button></div>
      <div class="cpstd">${CP_PRESETS.map(c => `<button type="button" class="cpsw" data-c="${c}" style="--c:${c}" aria-label="${c}"></button>`).join('')}</div>
      <div class="cpcustom" hidden>
        <div class="cpfield" role="slider" aria-label="색상과 채도" tabindex="0"><i class="cpdot"></i></div>
        <div class="cpval"><input type="range" class="cprange" min="0" max="100" aria-label="명도"><span class="cppct"></span></div>
      </div>
      <div class="cpinfo">
        <i class="cpnow"></i>
        <label>색상 코드<input class="cphex" maxlength="7" autocapitalize="off" autocomplete="off" spellcheck="false" aria-label="색상 코드"></label>
        <span>빨간색<b class="cpr"></b></span><span>녹색<b class="cpg"></b></span><span>파란색<b class="cpb"></b></span>
      </div>
      <div class="cprecent">
        ${Array.from({ length: 5 }, (_, i) => { const c = cpRecent()[i]; return `<button type="button" class="cpsw ${c ? '' : 'none'}" ${c ? `data-c="${c}" style="--c:${c}" aria-label="최근 색 ${c}"` : 'disabled aria-label="비어 있음"'}></button>`; }).join('')}
        ${'EyeDropper' in window ? '<button type="button" class="cpsw cpeye" aria-label="화면에서 색 뽑기">💧</button>' : ''}
      </div>
      <div class="cpbtns"><button type="button" class="cpno">취소</button><button type="button" class="cpok">완료</button></div>
    </div>`;
  document.body.appendChild(wrap);
  const $ = q => wrap.querySelector(q);
  const field = $('.cpfield'), range = $('.cprange'), hexIn = $('.cphex');
  const hex = () => cpHex(...cpFromHsv(h, s, v));
  // 지금 값을 화면 전체에 반영한다
  const paint = (keepHex) => {
    const now = hex(), [r, g, b] = cpRgb(now);
    $('.cpdot').style.cssText = `left:${h / 360 * 100}%;top:${s * 100}%;background:${cpHex(...cpFromHsv(h, s, 1))}`;
    range.value = Math.round(v * 100);
    range.style.setProperty('--c', cpHex(...cpFromHsv(h, s, 1)));
    $('.cppct').textContent = Math.round(v * 100) + ' %';
    $('.cpnow').style.background = now;
    if (!keepHex) hexIn.value = now.toUpperCase();
    $('.cpr').textContent = r; $('.cpg').textContent = g; $('.cpb').textContent = b;
    wrap.querySelectorAll('.cpsw[data-c]').forEach(x => x.classList.toggle('on', x.dataset.c === now));
  };
  const setHex = (c, keepHex) => { [h, s, v] = cpToHsv(...cpRgb(c)); paint(keepHex); };
  const tab = t => {
    $('.cpstd').hidden = t !== 'std'; $('.cpcustom').hidden = t !== 'custom';
    wrap.querySelectorAll('.cptabs button').forEach(x => x.classList.toggle('on', x.dataset.t === t));
  };
  wrap.querySelectorAll('.cptabs button').forEach(x => { x.onclick = () => tab(x.dataset.t); });
  wrap.querySelectorAll('.cpsw[data-c]').forEach(x => { x.onclick = () => setHex(x.dataset.c); });
  // 색상 판: 가로는 색상, 세로는 채도(위가 흰색). 누른 채로 끌 수 있다.
  const pick = e => {
    const r = field.getBoundingClientRect(), cl = (n, a, b) => Math.max(a, Math.min(b, n));
    h = cl((e.clientX - r.left) / r.width, 0, 1) * 359.999; s = cl((e.clientY - r.top) / r.height, 0, 1);
    if (v < .05) v = 1;   // 명도가 0이면 무엇을 골라도 검정이라, 처음 고를 때는 밝게 올려 준다
    paint();
  };
  field.onpointerdown = e => { field.setPointerCapture(e.pointerId); pick(e); };
  field.onpointermove = e => { if (field.hasPointerCapture(e.pointerId)) pick(e); };
  field.onkeydown = e => {
    const d = { ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -.02], ArrowDown: [0, .02] }[e.key];
    if (!d) return;
    e.preventDefault(); h = (h + d[0] + 360) % 360; s = Math.max(0, Math.min(1, s + d[1])); paint();
  };
  range.oninput = () => { v = range.value / 100; paint(); };
  hexIn.oninput = () => { const c = (hexIn.value[0] === '#' ? '' : '#') + hexIn.value.trim(); if (cpValid(c)) setHex(c.toLowerCase(), true); };
  hexIn.onblur = () => paint();
  const eye = $('.cpeye');
  if (eye) eye.onclick = () => new EyeDropper().open().then(r => setHex(r.sRGBHex.toLowerCase()), () => {});
  const close = () => wrap.remove();
  $('.cpno').onclick = close;
  wrap.onclick = e => { if (e.target === wrap) close(); };
  $('.cpok').onclick = () => {
    const c = hex();
    try { localStorage.setItem('cpRecent', JSON.stringify([c, ...cpRecent().filter(x => x !== c)].slice(0, 5))); } catch (e) { /* 저장 공간을 못 쓰는 경우는 넘어간다 */ }
    close(); onDone(c);
  };
  tab(CP_PRESETS.includes(hex()) || !cpValid(value) ? 'std' : 'custom');
  paint();
}

// ───────── 테마 색 ─────────
// 고른 색 하나에서 세 가지를 만든다: 형광펜·선택 표시(theme), 버튼(soft), 진한 강조(deep).
// 글씨가 묻히지 않게, 어두운 색을 고르면 같은 계열의 밝은 색으로 올려서 쓴다. 이 기기에만 저장한다.
const THEME_DEFAULT = '#ffd0dc';
function cpHsl(hh, s, l) {   // h: 0~360, s·l: 0~1 → '#rrggbb'
  const a = s * Math.min(l, 1 - l), f = n => { const k = (n + hh / 30) % 12; return (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255; };
  return cpHex(f(0), f(8), f(4));
}
function themeShades(hex) {
  const [r, g, b] = cpRgb(hex).map(x => x / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0, h = cpToHsv(r * 255, g * 255, b * 255)[0];
  const keep = l >= .75 && l <= .93, tl = keep ? l : l < .75 ? .88 : .93;   // 너무 어둡거나 너무 흰 색은 형광펜으로 보이는 밝기로 맞춘다
  return { theme: keep ? hex : cpHsl(h, s, tl), soft: cpHsl(h, s, Math.min(.96, tl + .03)), deep: cpHsl(h, Math.min(s, .6), .48), tape: cpHsl(h, Math.min(s, .75), .76) + 'a6' };
}
const themeColor = () => { try { const c = localStorage.getItem('themeColor'); return cpValid(c) ? c : ''; } catch (e) { return ''; } };
function applyTheme(hex) {
  const st = document.documentElement.style;
  if (!cpValid(hex)) { ['--theme', '--theme-soft', '--theme-deep', '--theme-tape'].forEach(k => st.removeProperty(k)); return; }
  const t = themeShades(hex);
  st.setProperty('--theme', t.theme); st.setProperty('--theme-soft', t.soft); st.setProperty('--theme-deep', t.deep); st.setProperty('--theme-tape', t.tape);
}
function setTheme(hex) {
  try { if (cpValid(hex)) localStorage.setItem('themeColor', hex); else localStorage.removeItem('themeColor'); } catch (e) { /* 저장 공간을 못 쓰는 경우는 넘어간다 */ }
  applyTheme(hex);
}
applyTheme(themeColor());

// 메모지 색: 노란 메모지(만난 날, 통독 현황, 성경책 칸 등)의 종이 색. 글씨가 보이도록 어두운 색은 밝게 올려 쓴다.
const MEMO_DEFAULT = '#fff3b8';
const memoColor = () => { try { const c = localStorage.getItem('memoColor'); return cpValid(c) ? c : ''; } catch (e) { return ''; } };
function memoShade(hex) {
  const [r, g, b] = cpRgb(hex).map(x => x / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (l >= .78) return hex;
  return cpHsl(cpToHsv(r * 255, g * 255, b * 255)[0], d ? d / (1 - Math.abs(2 * l - 1)) : 0, .86);
}
function applyMemo(hex) {
  const st = document.documentElement.style;
  if (cpValid(hex)) st.setProperty('--memo', memoShade(hex)); else st.removeProperty('--memo');
}
function setMemo(hex) {
  try { if (cpValid(hex)) localStorage.setItem('memoColor', hex); else localStorage.removeItem('memoColor'); } catch (e) { /* 저장 공간을 못 쓰는 경우는 넘어간다 */ }
  applyMemo(hex);
}
applyMemo(memoColor());

// 바탕 색: 격자무늬 종이의 색. 격자 줄은 바탕보다 조금 진하게 맞춘다. 글씨가 보이도록 어두운 색은 밝게 올려 쓴다.
const PAPER_DEFAULT = '#fffdf6';
const paperColor = () => { try { const c = localStorage.getItem('paperColor'); return cpValid(c) ? c : ''; } catch (e) { return ''; } };
function applyPaper(hex) {
  const st = document.documentElement.style, meta = document.querySelector('meta[name="theme-color"]');
  if (!cpValid(hex)) { st.removeProperty('--paper'); st.removeProperty('--paper-line'); if (meta) meta.content = PAPER_DEFAULT; return; }
  const bg = memoShade(hex), line = cpHex(...cpRgb(bg).map((x, i) => x * .93 + [59, 52, 44][i] * .07));
  st.setProperty('--paper', bg); st.setProperty('--paper-line', line);
  if (meta) meta.content = bg;
}
function setPaper(hex) {
  try { if (cpValid(hex)) localStorage.setItem('paperColor', hex); else localStorage.removeItem('paperColor'); } catch (e) { /* 저장 공간을 못 쓰는 경우는 넘어간다 */ }
  applyPaper(hex);
}
applyPaper(paperColor());
