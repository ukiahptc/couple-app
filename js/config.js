// Supabase 접속 정보. 둘 다 공개용 값이라 코드에 넣어도 된다.
// (secret / service_role 키는 절대 여기에 넣지 않는다)
const SUPABASE_URL = 'https://gvmuxlhisqnaplzxmfhe.supabase.co';
// 알림용 공개 키(VAPID public key). 비어 있으면 알림 기능이 꺼진 상태로 동작한다.
// 짝이 되는 private key 는 Supabase 의 Edge Functions > Secrets 에만 넣는다.
const VAPID_PUBLIC_KEY = 'BCoLC3V231uT4hTL_rUTYWtBdzL3T9dLBHAuetW0PZCqtEFxGnrKOCvLhL7EaVr1MPLA_N7aMhUDPUTYF0RWjP8';
const SUPABASE_KEY = 'sb_publishable_Po9ldlwH6qpXMdewCogeCw_0wYscpCW';
