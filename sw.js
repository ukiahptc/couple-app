// 파일을 수정해 배포할 때마다 이 버전 숫자를 올리면 새 파일이 적용된다.
const CACHE = 'couple-app-v38';
// 글꼴은 바뀌지 않으므로 따로 보관하고, 한 번 받으면 계속 그것을 쓴다.
const FONT_CACHE = 'couple-app-fonts-v1';
const FONTS = ['fonts/gaegu-400.woff2', 'fonts/gaegu-700.woff2', 'fonts/gowun-dodum-400.woff2'];
const FILES = ['./', 'index.html', 'css/style.css', 'css/tokens.css', 'css/fonts.css', 'js/app.js', 'js/dday.js', 'js/home.js', 'js/calendar.js', 'js/diary.js', 'js/money.js', 'js/photos.js', 'js/push.js', 'js/food.js', 'js/map.js', 'js/album.js', 'js/verse.js', 'js/bible.js', 'js/grow.js', 'js/qt.js', 'js/askdata.js', 'js/ask.js', 'js/thanks.js', 'data/verses.json', 'data/regions.json', 'js/config.js', 'js/glyphs.js', 'js/vendor/supabase.js', 'manifest.webmanifest', 'icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(Promise.all([
    // 브라우저가 따로 보관해 둔 옛 파일을 쓰지 않도록 서버에서 새로 받는다
    caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))),
    caches.open(FONT_CACHE).then(c => c.addAll(FONTS)),
  ]).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FONT_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 네트워크 우선, 실패하면 캐시 사용 (같은 출처의 GET 요청만)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.endsWith('.woff2')) {   // 글꼴: 보관한 것 먼저
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone(); caches.open(FONT_CACHE).then(c => c.put(e.request, copy)); return res;
    })));
    return;
  }
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })   // 서버에 새 버전이 있는지 매번 확인한다 (GitHub Pages 는 10분 동안 옛 파일을 주기도 한다)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// 알림이 오면 화면에 띄운다
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || '우리', {
    body: d.body || '', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: d.url || '#/' },
  }));
});

// 알림을 누르면 앱을 열고 해당 화면으로 간다
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const hash = (e.notification.data && e.notification.data.url) || '#/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => c.url.startsWith(self.registration.scope));
    if (open) { open.postMessage({ goto: hash }); return open.focus(); }
    return self.clients.openWindow(self.registration.scope + hash);
  }));
});
