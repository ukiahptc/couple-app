// ───────── 오늘의 질문 ─────────
// 하루에 질문 하나. 둘 다 답해야 서로의 답이 열린다. 아래에는 지난 질문 카드가 쌓인다.
const askQuestion = (date = today0()) => {
  const n = Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(2026, 0, 1)) / 86400000);
  return ASK_QUESTIONS[((n % ASK_QUESTIONS.length) + ASK_QUESTIONS.length) % ASK_QUESTIONS.length];
};
const askDate = iso => { const d = parseDate(iso); return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()} (${WEEK[d.getDay()]})`; };

async function renderAsk() {
  setHeader('오늘의 질문', { back: true });
  view.innerHTML = '<div class="spinner" role="status" aria-label="불러오는 중"></div>';
  const today = toISO(today0()), q = askQuestion();
  const { data, error } = await sb.from('qt_answers').select('id, user_id, q_date, question, body').order('q_date', { ascending: false }).limit(400);
  if (location.hash !== '#/ask') return;
  const rows = data || [];
  const partner = state.members.find(m => m.user_id !== state.user.id);
  const pn = esc(partner?.nickname || '상대방');
  const mine = rows.find(x => x.q_date === today && x.user_id === state.user.id);
  const theirs = rows.find(x => x.q_date === today && x.user_id !== state.user.id);
  const days = new Map();
  for (const r of rows) { if (r.q_date === today) continue; if (!days.has(r.q_date)) days.set(r.q_date, []); days.get(r.q_date).push(r); }

  view.innerHTML = `
    ${error ? `<p class="msg" role="alert">${esc(koError(error))}</p>` : ''}
    <section class="qcard today">
      <small class="qdate">${askDate(today)}</small>
      <p class="qq">${esc(mine?.question || q)}</p>
      ${mine ? `
        <div class="qa me">${whoTag(state.user.id)}<p>${esc(mine.body)}</p><button class="link" id="qEdit">고치기</button></div>
        ${theirs ? `<div class="qa pt">${whoTag(theirs.user_id)}<p>${esc(theirs.body)}</p></div>`
          : `<p class="hint">${pn} 님의 답을 기다리고 있어요. 둘 다 답하면 3점을 더 받아요.</p>`}`
        : `
        ${theirs ? `<p class="hint">${pn} 님이 먼저 답했어요. 내 답을 쓰면 서로의 답이 열려요.</p>` : ''}
        <form id="qForm"><textarea name="body" maxlength="1000" rows="3" placeholder="내 답을 적어 보세요" aria-label="내 답" required></textarea>
          <button class="btn small" type="submit">답하기</button></form>`}
      <p class="msg" id="qMsg" role="alert"></p>
    </section>

    <h2 class="hmark">지난 질문 카드${days.size ? ` ${days.size}장` : ''}</h2>
    ${days.size ? [...days].map(([date, list]) => {
      const m = list.find(r => r.user_id === state.user.id), t = list.find(r => r.user_id !== state.user.id);
      return `
        <section class="qcard past">
          <small class="qdate">${askDate(date)}</small>
          <p class="qq">${esc(list[0].question)}</p>
          ${m ? `<div class="qa me">${whoTag(m.user_id)}<p>${esc(m.body)}</p></div>` : ''}
          ${t ? (m ? `<div class="qa pt">${whoTag(t.user_id)}<p>${esc(t.body)}</p></div>` : '<p class="hint">내가 답하지 않은 날이라 상대방의 답은 가려져 있어요.</p>') : ''}
        </section>`;
    }).join('') : '<p class="hint">답한 질문이 여기에 한 장씩 쌓여요.</p>'}`;

  const msg = document.getElementById('qMsg');
  const save = async (body, btn) => {
    if (btn) btn.disabled = true;
    const { error: e } = mine
      ? await sb.from('qt_answers').update({ body }).eq('id', mine.id)
      : await sb.from('qt_answers').insert({ q_date: today, question: q, body });
    if (e) { if (btn) btn.disabled = false; msg.textContent = koError(e); return; }
    if (!mine) notifyPartner('오늘의 질문에 답했어요', theirs ? '서로의 답이 열렸어요' : '답을 쓰면 서로의 답이 열려요', '#/ask');
    renderAsk();
  };
  const form = document.getElementById('qForm');
  if (form) form.onsubmit = e => { e.preventDefault(); const v = form.body.value.trim(); if (v) save(v, form.querySelector('.btn')); };
  const edit = document.getElementById('qEdit');
  if (edit) edit.onclick = () => {
    const s = makeSheet('내 답 고치기', `<textarea name="body" class="plainbody" maxlength="1000" rows="6" aria-label="내 답" required>${esc(mine.body)}</textarea>`);
    s.form.onsubmit = async e => { e.preventDefault(); const v = s.form.body.value.trim(); if (!v) return; s.close(); save(v); };
  };
}
