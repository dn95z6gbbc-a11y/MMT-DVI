const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra }
});

function extractText(data) {
  if (typeof data?.output_text === 'string') return data.output_text;
  const parts = [];
  for (const item of data?.output || []) {
    for (const c of item?.content || []) {
      if ((c?.type === 'output_text' || c?.type === 'text') && typeof c.text === 'string') parts.push(c.text);
    }
  }
  return parts.join('\n').trim();
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405);
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Bad JSON' }, 400); }
    const question = String(body?.question || '').trim();
    const snapshot = body?.snapshot;
    const calculation = body?.calculation;
    if (!question || !snapshot) return json({ error: 'question and snapshot are required' }, 400);

    const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
    if (!token) return json({ error: 'AI Gateway authentication is not configured' }, 503);

    const instructions = `Ты — финансовый помощник внутри личного приложения бюджета. Отвечай по-русски, коротко, конкретно и без морализаторства.
Тебе передают SNAPSHOT — фактические данные приложения, и CALCULATION — детерминированный расчётный движок приложения.
Правила:
1. SNAPSHOT и CALCULATION — источник истины. Не выдумывай суммы, даты, оплаты или доходы.
2. Всегда отличай: факт, фиксированный план, плавающую/неподтверждённую статью и гипотезу пользователя.
3. Если пользователь задаёт сценарий «если будет X», не считай X уже сохранённым фактом. Явно назови допущение.
4. Для вопросов «сколько отложить», «хватит ли», «что будет если» покажи ключевую арифметику по датам. Если CALCULATION уже дал точный ответ, не меняй его без явной математической ошибки.
5. Плавающие расходы и доходы не считай гарантированными. Объясняй, как они влияют на запас.
6. Не давай инвестиционных рекомендаций. Это инструмент планирования повседневного cash flow.
7. Не пиши общих советов, если вопрос конкретный. Ответ должен помогать принять ближайшее решение.
8. Если данных не хватает, назови ровно какой факт нужно уточнить.`;

    const payload = {
      model: 'openai/gpt-5.6-terra',
      reasoning: { effort: 'medium' },
      max_output_tokens: 1200,
      input: [
        { role: 'developer', content: [{ type: 'input_text', text: instructions }] },
        { role: 'user', content: [{ type: 'input_text', text: JSON.stringify({ question, snapshot, calculation }) }] }
      ]
    };

    let upstream;
    try {
      upstream = await fetch('https://ai-gateway.vercel.sh/v1/responses', {
        method: 'POST',
        headers: { 'authorization': `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      return json({ error: 'AI Gateway request failed' }, 502);
    }
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return json({ error: data?.error?.message || 'AI Gateway error' }, upstream.status);
    const answer = extractText(data);
    if (!answer) return json({ error: 'Empty model response' }, 502);
    return json({ answer, model: 'openai/gpt-5.6-terra' });
  }
};
