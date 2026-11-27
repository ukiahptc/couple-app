// ───────── 알림 ─────────
// 내가 무언가를 추가하면 서버 함수(notify)를 불러 상대방 기기에 알림을 보낸다.
// 받는 쪽은 설정 화면에서 '알림 켜기'를 한 번 눌러야 한다. 아이폰은 홈 화면에 추가한 앱에서만 된다.
const pushReady = () => typeof VAPID_PUBLIC_KEY === 'string' && VAPID_PUBLIC_KEY.length > 20;
const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const b64ToBytes = s => { const p = '='.repeat((4 - s.length % 4) % 4), raw = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(raw, c => c.charCodeAt(0)); };

// 지금 상태: unconfigured(서버 설정 전) | install(홈 화면 추가 필요) | unsupported | denied | on | off
async function pushState() {
  if (!pushReady()) return 'unconfigured';
  if (!pushSupported()) return /iphone|ipad/i.test(navigator.userAgent) && !isStandalone() ? 'install' : 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await navigator.serviceWorker.ready;
  return (await reg.pushManager.getSubscription()) && Notification.permission === 'granted' ? 'on' : 'off';
}

async function enablePush() {
  if (await Notification.requestPermission() !== 'granted') throw new Error('알림 권한이 허용되지 않았습니다.');
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription()
    || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID_PUBLIC_KEY) });
  const k = sub.toJSON().keys;
  // 같은 기기를 다른 계정으로 쓴 적이 있으면 예전 줄이 남아 있을 수 있어 먼저 지우고 넣는다
  await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  const { error } = await sb.from('push_subscriptions').insert({ endpoint: sub.endpoint, p256dh: k.p256dh, auth: k.auth });
  if (error) throw error;
}

async function disablePush() {
  const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  await sub.unsubscribe();
}

// 상대방에게 알리기. 실패해도 저장에는 영향이 없도록 조용히 넘어간다.
// what 예: '일기를 썼어요'  detail 예: 일기 제목  url 예: '#/diary'
function notifyPartner(what, detail, url) {
  const me = state.members.find(m => m.user_id === state.user.id)?.nickname || '상대방';
  logNotice(`${me} 님이 ${what}`, detail, url);   // 앱 안 알림 창에도 남긴다
  if (!pushReady() || state.members.length < 2) return;
  sb.functions.invoke('notify', { body: { title: `${me} 님이 ${what}`, body: detail || '', url } }).catch(() => {});
}

// 설정 화면의 알림 줄
async function drawPushRow(box) {
  const st = await pushState();
  const text = {
    unconfigured: '알림 서버 설정이 아직 끝나지 않았어요',
    install: '아이폰은 홈 화면에 추가한 앱에서만 알림을 받을 수 있어요',
    unsupported: '이 브라우저는 알림을 지원하지 않아요',
    denied: '알림이 차단되어 있어요. 기기 설정에서 이 앱의 알림을 허용해 주세요',
    on: '상대방이 무언가를 추가하면 알림이 와요',
    off: '상대방이 무언가를 추가하면 알려 드려요',
  }[st];
  box.innerHTML = `<div class="dmain"><div class="d">알림</div><div class="t">${st === 'on' ? '켜짐' : '꺼짐'}</div><div class="d" id="pushMsg">${text}</div></div>
    ${st === 'on' || st === 'off' ? `<button class="btn small ghost" id="pushBtn">${st === 'on' ? '끄기' : '켜기'}</button>` : ''}`;
  const btn = box.querySelector('#pushBtn');
  if (btn) btn.onclick = async () => {
    btn.disabled = true;
    try { st === 'on' ? await disablePush() : await enablePush(); }
    catch (err) { box.querySelector('#pushMsg').textContent = koError(err); btn.disabled = false; return; }
    drawPushRow(box);
  };
}
