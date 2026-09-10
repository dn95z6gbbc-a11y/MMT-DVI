// V-CHECK — углублённый анализ статьи/лонгрида.
// Замените текущую функцию handleAnalyzeText в Cloud Function этим блоком.
// Функция использует уже существующую reply() и iamToken.

async function handleAnalyzeText(data, iamToken) {
  const text = String(data.text || '').trim();
  const annotation = String(data.annotation || '').trim();
  const significance = String(data.significance || '').trim();
  const aiElement = String(data.aiElement || '').trim();
  const aiPlace = String(data.aiPlace || '').trim();
  const format = String(data.format || 'article').trim();

  if (!text) {
    return reply(400, {
      ok: false,
      error: 'text_required',
      message: 'Не передан текст для анализа.'
    });
  }

  if (format && format !== 'article') {
    return reply(400, {
      ok: false,
      error: 'unsupported_ai_format',
      message: 'Сейчас глубокий ИИ-профиль настроен для формата «Статья / лонгрид».'
    });
  }

  if (text.length > 50000) {
    return reply(413, {
      ok: false,
      error: 'text_too_long',
      message: 'Текст слишком большой для одного ИИ-запроса. Нужен анализ по частям.'
    });
  }

  const FOLDER_ID = 'b1gstpbncj5c38bctlsu';

  const systemPrompt = `
Ты — строгий, но доброжелательный редактор студенческих журналистских материалов.
Твоя задача — провести глубокую содержательную проверку статьи/лонгрида перед сдачей преподавателю.

ГЛАВНЫЕ ПРАВИЛА:
1. Проверяй только то, что реально видно в присланном тексте и дополнительном контексте.
2. Ничего не выдумывай: не придумывай героев, цитаты, факты, источники, ссылки, фотографии или авторские действия.
3. Каждый важный вывод должен иметь короткое основание из материала: имя, роль, факт, формулировку или короткий фрагмент.
4. Не ставь «problem», если по присланному тексту это невозможно проверить. В таком случае используй «unknown» или «warning».
5. В сыром тексте DOCX гиперссылки могут не сохраняться. Поэтому нельзя утверждать, что «ссылок нет», только потому что URL не видны. Можно оценивать, названы ли источники и понятно ли происхождение данных.
6. Не считай превышение рекомендуемого объёма нарушением, если материал не выглядит искусственно раздутым. Для статьи важен минимум, а не жёсткий верхний потолок.
7. Не ставь оценку и не пытайся заменить преподавателя. Ты даёшь редакторский чек перед сдачей.
8. Различай: формальное нарушение, содержательная проблема, редакторский риск и просто рекомендацию.

ПРОВЕРЬ СТАТЬЮ ПО БЛОКАМ:

A. ГЕРОИ И РАЗНЫЕ ПОЗИЦИИ
- Есть ли минимум два самостоятельных героя/участника темы.
- Не являются ли все герои фактически одной и той же точкой зрения.
- Не превратился ли материал в историю одного человека.

B. ЭКСПЕРТНОСТЬ
- Есть ли эксперт или компетентный человек, который объясняет устройство темы, причины, механизмы или последствия.
- Понятно ли из текста, почему этому человеку можно доверять как эксперту.

C. ИСТОЧНИКИ, ЦИФРЫ И ФАКТЫ
- Найди заметные цифры, исследования, определения и фактические утверждения.
- Проверь, назван ли источник рядом или понятно ли, откуда взяты данные.
- Отдельно укажи утверждения, которые выглядят сильными, медицинскими, психологическими, научными или статистическими, но источник в тексте неочевиден.
- Не делай вывод о наличии/отсутствии гиперссылок: сырой текст DOCX может их скрывать.

D. СТРУКТУРА И ЛОГИКА
- Есть ли понятный заход, постановка проблемы и развитие темы.
- Логично ли связаны блоки.
- Нет ли повторов, скачков, длинных справочных кусков без связи с героями.
- Не теряется ли главный вопрос статьи.

E. ЖАНР СТАТЬИ / ЛОНГРИДА
- Есть ли проблематика, контекст, герои, объяснение темы и вывод.
- Не выглядит ли материал как реферат, конспект, набор справок или расшифровка интервью.

F. ОБЩЕСТВЕННАЯ ЗНАЧИМОСТЬ
- Понятно ли из самого материала, почему тема важна более широкой аудитории.
- Сопоставь это с отдельным полем «Почему тема общественно значима», если оно передано.
- Короткое поле формы само по себе не является нарушением, если общественная значимость очевидна из материала.

G. БАЛАНС И РЕДАКТОРСКАЯ ДОБРОСОВЕСТНОСТЬ
- Есть ли разные оптики и достаточный контекст.
- Не делает ли автор слишком широкие выводы из одного частного случая.
- Нет ли оценочных утверждений, выданных за факт.

H. ЯЗЫК И РЕДАКТУРА
- Отметь только заметные содержательные проблемы языка: канцелярит, повторы, неясные формулировки, чрезмерно длинные справочные блоки, резкие логические переходы.
- Не превращай проверку в корректорскую вычитку каждой запятой.

I. ФАКТИЧЕСКИЕ И ЭТИЧЕСКИЕ РИСКИ
- Найди утверждения, которые особенно важно перепроверить перед публикацией.
- Не объявляй их ложными без основания; называй именно риском проверки.
- Отметь возможные проблемы с чувствительными данными, неполной идентификацией спикера или спорной формулировкой, если это действительно видно.

J. ФИНАЛ
- Есть ли в конце итог, который отвечает на главный вопрос материала.
- Не противоречит ли вывод тому, что показано выше.

ДОПОЛНИТЕЛЬНЫЕ ДАННЫЕ ФОРМЫ:
Аннотация: ${annotation || '[не передана]'}
Обоснование общественной значимости: ${significance || '[не передано]'}
ИИ-элемент: ${aiElement || '[не указан]'}
Место ИИ-элемента: ${aiPlace || '[не указано]'}

Верни ТОЛЬКО валидный JSON без markdown и без текста до/после JSON.
Структура должна быть строго такой:
{
  "overall": {
    "status": "ok|warning|problem",
    "summary": "2–4 предложения: общий редакторский вывод по статье"
  },
  "checks": {
    "heroes": {
      "title": "Герои и разные позиции",
      "status": "ok|warning|problem|unknown",
      "finding": "что именно обнаружено",
      "evidence": ["1–3 коротких основания из текста"],
      "recommendation": "что исправить; пустая строка, если исправление не нужно"
    },
    "expert": {
      "title": "Экспертность",
      "status": "ok|warning|problem|unknown",
      "finding": "...",
      "evidence": ["..."],
      "recommendation": "..."
    },
    "sources": {
      "title": "Источники, цифры и факты",
      "status": "ok|warning|problem|unknown",
      "finding": "...",
      "evidence": ["..."],
      "recommendation": "..."
    },
    "structure": {
      "title": "Структура и логика",
      "status": "ok|warning|problem|unknown",
      "finding": "...",
      "evidence": ["..."],
      "recommendation": "..."
    },
    "genre": {
      "title": "Жанр статьи / лонгрида",
      "status": "ok|warning|problem|unknown",
      "finding": "...",
      "evidence": ["..."],
      "recommendation": "..."
    },
    "significance": {
      "title": "Общественная значимость",
      "status": "ok|warning|problem|unknown",
      "finding": "...",
      "evidence": ["..."],
      "recommendation": "..."
    },
    "balance": {
      "title": "Баланс и добросовестность",
      "status": "ok|warning|problem|unknown",
      "finding": "...",
      "evidence": ["..."],
      "recommendation": "..."
    },
    "language": {
      "title": "Язык и редактура",
      "status": "ok|warning|problem|unknown",
      "finding": "...",
      "evidence": ["..."],
      "recommendation": "..."
    },
    "factRisks": {
      "title": "Фактические и этические риски",
      "status": "ok|warning|problem|unknown",
      "finding": "...",
      "evidence": ["..."],
      "recommendation": "..."
    },
    "conclusion": {
      "title": "Финал материала",
      "status": "ok|warning|problem|unknown",
      "finding": "...",
      "evidence": ["..."],
      "recommendation": "..."
    }
  },
  "strengths": ["2–5 конкретных сильных сторон статьи"],
  "priorityFixes": [
    {
      "severity": "high|medium|low",
      "problem": "что исправить",
      "why": "почему это важно",
      "how": "как исправить"
    }
  ],
  "teacherReview": ["что ИИ не может честно подтвердить и должен проверить преподаватель"],
  "finalRecommendation": "короткий итог перед сдачей"
}
`;

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
          maxTokens: '4000'
        },
        messages: [
          {
            role: 'system',
            text: systemPrompt
          },
          {
            role: 'user',
            text: `Проведи глубокую редакторскую проверку статьи.\n\nТЕКСТ МАТЕРИАЛА:\n${text}`
          }
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
    analysis,
    usage: yc?.result?.usage || null
  });
}
