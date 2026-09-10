// V-CHECK: универсальный глубокий ИИ-анализ для всех 12 форматов.
// В Cloud Function рядом должен лежать instructions.js.
// Функция использует уже существующую reply() и iamToken.

const { COMMON, FORMAT_RULES } = require('./instructions');

async function handleAnalyzeMaterial(data, iamToken) {
  const format = String(data.format || '').trim();
  const rules = FORMAT_RULES[format];

  if (!rules) {
    return reply(400, {
      ok: false,
      error: 'unsupported_format',
      message: 'Неизвестный формат материала.'
    });
  }

  const text = String(data.text || data.transcript || '').trim();
  const annotation = String(data.annotation || '').trim();
  const significance = String(data.significance || '').trim();
  const aiElement = String(data.aiElement || '').trim();
  const aiPlace = String(data.aiPlace || '').trim();
  const mediaObservations = data.mediaObservations || null;
  const audioObservations = data.audioObservations || null;
  const durationSeconds = Number.isFinite(Number(data.durationSeconds))
    ? Number(data.durationSeconds)
    : null;

  const hasObservations = Boolean(mediaObservations || audioObservations);

  if (!text && !hasObservations) {
    return reply(400, {
      ok: false,
      error: 'material_content_required',
      message: 'Для ИИ-анализа нужен текст материала, расшифровка или результаты анализа медиа.'
    });
  }

  if (text.length > 100000) {
    return reply(413, {
      ok: false,
      error: 'content_too_long',
      message: 'Материал слишком большой для одного ИИ-запроса. Нужен анализ по частям.'
    });
  }

  const FOLDER_ID = 'b1gstpbncj5c38bctlsu';

  const inputScope = {
    format,
    formatTitle: rules.title,
    mediaType: rules.mediaType,
    durationSeconds,
    annotation: annotation || null,
    significance: significance || null,
    aiElement: aiElement || null,
    aiPlace: aiPlace || null,
    mediaObservations,
    audioObservations
  };

  const systemPrompt = `
Ты — редактор V-CHECK. Ты проверяешь студенческий журналистский материал строго по инструктажу выбранного формата.

ОБЩИЕ ПРИНЦИПЫ:
${COMMON.principles.map((x, i) => `${i + 1}. ${x}`).join('\n')}

ВАЖНО ПРО ДОСТУПНЫЕ ДАННЫЕ:
- Для текстового формата ты видишь текст материала и данные формы.
- Для аудио ты можешь получить расшифровку и отдельно audioObservations. По одной расшифровке нельзя честно подтверждать качество звука, наличие музыки, джинглов, аутро или саунд-дизайна.
- Для видео ты можешь получить расшифровку и отдельно mediaObservations/audioObservations. По одной расшифровке нельзя честно подтверждать стендап, планы, перебивки, вертикальность, титры, монтаж, визуальные источники или качество картинки.
- Если данных для проверки нет, статус должен быть unknown, а пункт — отправлен в teacherReview. Не угадывай.

ИНСТРУКТАЖ ВЫБРАННОГО ФОРМАТА:
Название: ${rules.title}
Тип: ${rules.mediaType}
Минимальные параметры: ${JSON.stringify(rules.minimums || {})}
Хронометраж: ${JSON.stringify(rules.duration || {})}
Требования, критичные для формата:
${rules.hardRules.map((x, i) => `${i + 1}. ${x}`).join('\n')}

Блоки глубокого анализа:
${rules.deepChecks.map((x, i) => `${i + 1}. ${x}`).join('\n')}

ДОПОЛНИТЕЛЬНЫЙ КОНТЕКСТ:
${JSON.stringify(inputScope, null, 2)}

КАК ПРОВЕРЯТЬ:
1. Сначала пойми, что материал реально делает: тема, фокус, герои/спикеры, логика, источники, развитие и финал.
2. Затем пройди по каждому критичному требованию формата.
3. После этого сделай более глубокую редакторскую оценку по указанным блокам.
4. Для каждого замечания укажи конкретное доказательство: имя, роль, формулировку, эпизод, факт или короткий фрагмент. Не пиши общими словами.
5. Для warning/problem дай практическую рекомендацию: что именно изменить перед сдачей.
6. Не дублируй один и тот же недостаток под разными названиями.
7. Не придирайся ради количества замечаний. Если пункт выполнен — ставь ok.
8. Если материал превышает рекомендуемый объём текста, это само по себе не нарушение. Критичен недостаточный объём или искусственная раздутость текста.
9. Гиперссылки могут потеряться при извлечении текста из DOCX. Если название источника видно, но URL не виден, не заявляй, что ссылки нет. Укажи только то, что можно подтвердить.
10. В фактчеке особенно строго следи, чтобы нейросеть не была названа источником проверки.

СТАТУСЫ:
- ok — требование явно выполнено;
- warning — в целом выполнено, но есть заметный риск или недоработка;
- problem — критичное требование явно нарушено;
- unknown — честно проверить по доступным данным нельзя.

Верни ТОЛЬКО валидный JSON без markdown и без текста до/после JSON.
Структура строго такая:
{
  "overall": {
    "status": "ok|warning|problem",
    "summary": "3–5 предложений: что за материал, что удалось, что главное исправить"
  },
  "checks": [
    {
      "id": "короткий латинский id",
      "title": "название проверки",
      "status": "ok|warning|problem|unknown",
      "critical": true,
      "finding": "конкретный вывод",
      "evidence": ["1–3 коротких конкретных основания"],
      "recommendation": "конкретное действие или пустая строка",
      "scope": "content|visual|audio|metadata|teacher"
    }
  ],
  "strengths": ["2–5 конкретных сильных сторон"],
  "priorityFixes": [
    {
      "severity": "high|medium|low",
      "problem": "что исправить",
      "why": "почему это важно именно для выбранного формата",
      "how": "как исправить practically и конкретно"
    }
  ],
  "teacherReview": ["что невозможно честно подтвердить автоматически"],
  "finalRecommendation": "короткий редакторский итог перед сдачей"
}

В checks обязательно покрой все критичные требования, которые можно проверить по доступным данным, и ключевые deepChecks. Не ограничивайся 5–6 пунктами, если формат требует большего анализа.
`;

  const userPayload = [
    `ФОРМАТ: ${rules.title}`,
    text ? `\nТЕКСТ / РАСШИФРОВКА:\n${text}` : '',
    annotation ? `\nАННОТАЦИЯ:\n${annotation}` : '',
    significance ? `\nОБОСНОВАНИЕ ОБЩЕСТВЕННОЙ ЗНАЧИМОСТИ:\n${significance}` : '',
    aiElement ? `\nИИ-ЭЛЕМЕНТ:\n${aiElement}` : '',
    aiPlace ? `\nГДЕ ИИ-ЭЛЕМЕНТ НАХОДИТСЯ:\n${aiPlace}` : '',
    mediaObservations ? `\nВИЗУАЛЬНЫЕ НАБЛЮДЕНИЯ СИСТЕМЫ:\n${JSON.stringify(mediaObservations)}` : '',
    audioObservations ? `\nАУДИО-НАБЛЮДЕНИЯ СИСТЕМЫ:\n${JSON.stringify(audioObservations)}` : '',
    durationSeconds !== null ? `\nХРОНОМЕТРАЖ, СЕКУНДЫ: ${durationSeconds}` : ''
  ].join('');

  const response = await fetch(
    'https://ai.api.cloud.yandex.net/foundationModels/v1/completion',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${iamToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        modelUri: `gpt://${FOLDER_ID}/yandexgpt/latest`,
        completionOptions: {
          stream: false,
          temperature: 0.1,
          maxTokens: '5000'
        },
        messages: [
          { role: 'system', text: systemPrompt },
          { role: 'user', text: userPayload }
        ],
        jsonObject: true
      })
    }
  );

  const raw = await response.text();

  if (!response.ok) {
    console.error('YandexGPT error:', response.status, raw);
    return reply(502, {
      ok: false,
      error: 'yandexgpt_error',
      status: response.status,
      message: 'YandexGPT не смог выполнить анализ.'
    });
  }

  let yc;
  try {
    yc = JSON.parse(raw);
  } catch (error) {
    console.error('Bad YandexGPT response:', raw);
    return reply(502, {
      ok: false,
      error: 'bad_yandexgpt_response'
    });
  }

  const answer = yc?.result?.alternatives?.[0]?.message?.text || '';
  if (!answer) {
    return reply(502, {
      ok: false,
      error: 'empty_ai_response'
    });
  }

  let analysis;
  try {
    analysis = JSON.parse(answer);
  } catch (error) {
    console.error('AI returned non-JSON:', answer);
    return reply(502, {
      ok: false,
      error: 'invalid_ai_json',
      message: 'ИИ вернул ответ не в ожидаемом формате. Попробуйте ещё раз.'
    });
  }

  return reply(200, {
    ok: true,
    ai: true,
    model: 'yandexgpt',
    format,
    formatTitle: rules.title,
    mediaType: rules.mediaType,
    analysis,
    usage: yc?.result?.usage || null
  });
}
