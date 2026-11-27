// ───────── 사진 공통 (맛집·앨범 등에서 같이 쓴다) ─────────
const PHOTO_BUCKET = 'photos';
const photoUrlCache = new Map(); // 경로 → { url, until }

// 큰 사진을 긴 변 1600px 의 JPEG 로 줄인다 (저장 공간 절약)
async function shrinkPhoto(file, max = 1600) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('사진을 읽지 못했습니다.')); i.src = url; });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', 0.82));
    if (!blob) throw new Error('사진을 변환하지 못했습니다.');
    return blob;
  } finally { URL.revokeObjectURL(url); }
}

// 올리고 저장소 경로를 돌려준다. folder 예: 'food'
async function uploadPhoto(file, folder, max = 1600) {
  const blob = await shrinkPhoto(file, max);
  const path = `${state.couple.id}/${folder}/${crypto.randomUUID()}.jpg`;
  const { error } = await sb.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
  if (error) throw error;
  return path;
}

// 경로 여러 개 → { 경로: 볼 수 있는 주소 }. 비공개 저장소라 하루짜리 주소를 받아 쓴다.
async function photoUrls(paths) {
  const now = Date.now(), out = {};
  const need = [...new Set(paths)].filter(p => { const c = photoUrlCache.get(p); if (c && c.until > now) { out[p] = c.url; return false; } return true; });
  if (need.length) {
    const { data } = await sb.storage.from(PHOTO_BUCKET).createSignedUrls(need, 86400);
    for (const r of data || []) if (r.signedUrl) { photoUrlCache.set(r.path, { url: r.signedUrl, until: now + 80000000 }); out[r.path] = r.signedUrl; }
  }
  return out;
}

async function removePhotos(paths) {
  if (paths.length) await sb.storage.from(PHOTO_BUCKET).remove(paths);
}

// 시트 안의 사진 칸. box 안에 미리보기와 '사진 추가' 버튼을 그리고, 저장할 때 save() 를 부른다.
function photoPicker(box, paths, max = 4) {
  const shots = paths.map(path => ({ path })), removed = [];
  const fileIn = document.createElement('input');
  fileIn.type = 'file'; fileIn.accept = 'image/*'; fileIn.multiple = true; fileIn.hidden = true;
  box.after(fileIn);
  const draw = async () => {
    const urls = await photoUrls(shots.filter(x => x.path).map(x => x.path));
    box.innerHTML = shots.map((x, i) => `
      <span class="shot"><img src="${esc(x.preview || urls[x.path] || '')}" alt="사진 ${i + 1}">
        <button type="button" data-rm="${i}" aria-label="사진 ${i + 1} 빼기">${icon('close')}</button></span>`).join('')
      + (shots.length < max ? `<button type="button" class="shot add">${icon('plus')}<small>사진 추가</small></button>` : '');
    box.querySelectorAll('[data-rm]').forEach(b => { b.onclick = () => {
      const [x] = shots.splice(Number(b.dataset.rm), 1);
      if (x.path) removed.push(x.path); else URL.revokeObjectURL(x.preview);
      draw();
    }; });
    const add = box.querySelector('.add'); if (add) add.onclick = () => fileIn.click();
  };
  fileIn.onchange = () => {
    for (const f of [...fileIn.files].slice(0, max - shots.length)) shots.push({ file: f, preview: URL.createObjectURL(f) });
    fileIn.value = ''; draw();
  };
  draw();
  let fresh = [];
  return {
    // 새 사진을 올리고 전체 경로 목록을 돌려준다
    async upload(folder, onStep) {
      const todo = shots.filter(x => x.file && !x.path);
      for (let i = 0; i < todo.length; i++) { onStep(i + 1, todo.length); todo[i].path = await uploadPhoto(todo[i].file, folder); fresh.push(todo[i].path); }
      return shots.map(x => x.path);
    },
    // DB 저장이 실패했을 때: 방금 올린 사진을 되돌린다
    async undo() { await removePhotos(fresh).catch(() => {}); for (const x of shots) if (fresh.includes(x.path)) delete x.path; fresh = []; },
    // DB 저장이 끝났을 때: 뺀 사진을 저장소에서 지운다
    finish() { removePhotos(removed).catch(() => {}); },
  };
}
const photoErr = err => /bucket|storage|row-level|policy/i.test(err?.message || '') ? '사진 저장소 설정이 아직 안 된 것 같습니다. Supabase에서 SQL을 실행했는지 확인해 주세요.' : koError(err);
