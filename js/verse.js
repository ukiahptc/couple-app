// ───────── 오늘의 말씀 ─────────
// data/verses.json 의 구절을 날짜 순서로 돌린다. 날짜가 기준이라 두 사람에게 같은 날 같은 구절이 보인다.
// 본문: 성경전서 개역한글판(대한성서공회)
let versesCache = null;
function loadVerses() {
  return versesCache || (versesCache = fetch('data/verses.json').then(r => r.json()).catch(() => { versesCache = null; return []; }));
}
// 2026년 1월 1일부터 며칠째인지로 순번을 정한다
function verseOf(list, date = today0()) {
  if (!list.length) return null;
  const n = Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(2026, 0, 1)) / 86400000);
  return list[((n % list.length) + list.length) % list.length];
}
// 홈의 말씀 카드를 채운다
async function fillVerse(box) {
  const v = verseOf(await loadVerses());
  if (!v || !box.isConnected) return;
  box.innerHTML = `<p>${esc(v.t)}</p><small>${esc(v.r)}</small>`;
  box.hidden = false;
  box.onclick = () => openVerse(v);
}
// 눌렀을 때 크게 보기
function openVerse(v) {
  const el = document.createElement('div');
  el.className = 'vfull';
  el.innerHTML = `<div class="vcard" role="dialog" aria-label="오늘의 말씀"><i class="tape"></i>
    <h2>오늘의 말씀</h2><p>${esc(v.t)}</p><small>${esc(v.r)}</small>
    <span class="vsrc">성경전서 개역한글판</span></div>`;
  el.onclick = () => el.remove();
  document.body.appendChild(el);
}
