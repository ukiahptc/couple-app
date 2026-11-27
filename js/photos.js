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
async function uploadPhoto(file, folder) {
  const blob = await shrinkPhoto(file);
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
