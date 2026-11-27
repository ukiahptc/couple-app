// 알림 보내기: 앱에서 무언가를 추가하면 이 함수를 부르고, 함수가 상대방 기기로 알림을 보낸다.
// Supabase > Edge Functions 에 'notify' 라는 이름으로 올린다.
// 필요한 비밀 값(Edge Functions > Secrets): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 누가 불렀는지 로그인 토큰으로 확인한다
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: 'unauthorized' }, 401);

    const { data: me } = await admin.from('members').select('couple_id').eq('user_id', user.id).maybeSingle();
    if (!me) return json({ error: 'no couple' }, 400);

    const body = await req.json().catch(() => ({}));
    const payload = JSON.stringify({
      title: String(body.title ?? '새 소식이 있어요').slice(0, 60),
      body: String(body.body ?? '').slice(0, 120),
      url: /^#\/[\w\-\/]*$/.test(String(body.url ?? '')) ? body.url : '#/',
    });

    // 같은 커플 중 나를 뺀 사람의 기기들
    const { data: subs } = await admin.from('push_subscriptions')
      .select('id, endpoint, p256dh, auth').eq('couple_id', me.couple_id).neq('user_id', user.id);

    webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT')!, Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
    let sent = 0;
    await Promise.all((subs ?? []).map(async s => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400 });
        sent++;
      } catch (e) {
        // 더 이상 쓰지 않는 기기 주소는 지운다
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await admin.from('push_subscriptions').delete().eq('id', s.id);
        else console.error('push failed', code, (e as Error).message);
      }
    }));
    return json({ sent });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
