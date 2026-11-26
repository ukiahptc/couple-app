// 파일을 수정해 배포할 때마다 이 버전 숫자를 올리면 새 파일이 적용된다.
const CACHE = 'couple-app-v13';
const FILES = ['./', 'index.html', 'css/style.css', 'css/tokens.css', 'css/fonts.css', 'js/app.js', 'js/dday.js', 'js/home.js', 'js/calendar.js', 'js/diary.js', 'js/money.js', 'js/config.js', 'js/vendor/supabase.js', 'manifest.webmanifest', 'icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 네트워크 우선, 실패하면 캐시 사용 (같은 출처의 GET 요청만)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
