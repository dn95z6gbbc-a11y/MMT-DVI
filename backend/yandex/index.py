import json
import os
from typing import Any, Dict

from openai import OpenAI

BASE_URL = os.getenv("BASE_URL", "https://ai.api.cloud.yandex.net/v1")
API_KEY = os.getenv("API_KEY", "")
MODEL_NAME = os.getenv("MODEL_NAME", "")
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "https://dn95z6gbbc-a11y.github.io")

client = OpenAI(base_url=BASE_URL, api_key=API_KEY) if API_KEY else None

SYSTEM_PROMPT = r"""
Ты — редактор учебного проекта MMT ДВИ. Проверяешь ФАКТУРУ будущей расширенной новостной заметки ученика.

Методика MMT:
- Новость — то, что уже произошло. Будущее событие — анонс.
- Информационный заголовок базово сообщает, кто/что сделал; без игры слов и авторской оценки.
- Лид: кто? что? где? когда? + краткий итог; источник информации должен быть назван уже в лиде.
- Тело: почему? как? + новая фактура и детали. Причина события и предыстория не одно и то же.
- В учебной расширенной новости нужен содержательный реально полученный комментарий.
- Бэкграунд должен объяснять именно это событие. «Раньше такого не было» само по себе не бэкграунд.
- Факт, мнение, слух и предположение нельзя смешивать.
- Источник оценивается не по престижности профессии, а по тому, МОЖЕТ ЛИ ИМЕННО ОН знать заявленный факт и откуда у него это знание.
- Если есть спор, обвинение или конфликт, нужна вторая сторона либо честная фиксация попытки получить её позицию.
- Неподтверждённые утверждения о преступлении, коррупции, вине, мотивах и намерениях нельзя выдавать за факт.
- Новостной текст нейтрален: без авторской позиции, оценочной и разговорной лексики, канцелярита и штампов.

Твоя задача — не написать материал вместо ученика и не придумывать факты. Нужно проверить связи между полями карточки.
Если ответ бессмысленный, не отвечает на вопрос, противоречит другим полям, является слухом или источник неочевидно компетентен — скажи это прямо.
Если данных недостаточно, проси конкретно дособрать фактуру, а не фантазируй.

Верни ТОЛЬКО валидный JSON без Markdown и без текста до/после него в формате:
{
  "verdict": "можно собирать дальше" | "нужно дособрать" | "нельзя использовать как есть",
  "summary": "краткий итог в 1-3 предложениях",
  "items": [
    {
      "criterion": "название критерия",
      "status": "ok" | "warn" | "bad",
      "problem": "что именно увидел; для ok — что работает",
      "why": "почему это важно журналисту",
      "what_to_verify": "что проверить или дособрать; пустая строка, если ничего",
      "next_action": "одно конкретное действие ученика"
    }
  ],
  "strengths": ["не более 3 реально подтверждаемых сильных сторон"],
  "priority": ["не более 3 правок в порядке важности"]
}

Обязательно проверь: инфоповод; логическую согласованность полей; компетентность источника; факт/мнение/слух/предположение; неподтверждённые обвинения; комментарий; бэкграунд; язык.
Не хвали поле за одну лишь заполненность.
""".strip()


def _headers(origin: str = "") -> Dict[str, str]:
    allow = ALLOWED_ORIGIN or origin or "*"
    return {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": allow,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Vary": "Origin",
        "Cache-Control": "no-store",
    }


def _response(status: int, body: Dict[str, Any], origin: str = "") -> Dict[str, Any]:
    return {
        "statusCode": status,
        "headers": _headers(origin),
        "body": json.dumps(body, ensure_ascii=False),
    }


def _parse_event(event: Any) -> Dict[str, Any]:
    if not isinstance(event, dict):
        return {}
    body = event.get("body", event)
    if isinstance(body, str):
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            return {}
    return body if isinstance(body, dict) else {}


def _origin(event: Dict[str, Any]) -> str:
    headers = event.get("headers") or {}
    if not isinstance(headers, dict):
        return ""
    return str(headers.get("origin") or headers.get("Origin") or "")


def _method(event: Dict[str, Any]) -> str:
    return str(
        event.get("httpMethod")
        or (event.get("requestContext") or {}).get("http", {}).get("method")
        or "POST"
    ).upper()


def _clean_json_text(text: str) -> str:
    text = (text or "").strip()
    if text.startswith("```"):
        text = text.replace("```json", "", 1).replace("```", "", 1)
        if text.endswith("```"):
            text = text[:-3]
    return text.strip()


def _validate_review(review: Any) -> Dict[str, Any]:
    if not isinstance(review, dict):
        raise ValueError("model response is not an object")

    allowed_verdicts = {"можно собирать дальше", "нужно дособрать", "нельзя использовать как есть"}
    verdict = review.get("verdict")
    if verdict not in allowed_verdicts:
        verdict = "нужно дособрать"

    clean_items = []
    for item in review.get("items") or []:
        if not isinstance(item, dict):
            continue
        status = item.get("status") if item.get("status") in {"ok", "warn", "bad"} else "warn"
        clean_items.append({
            "criterion": str(item.get("criterion") or "Редакторская проверка")[:120],
            "status": status,
            "problem": str(item.get("problem") or "")[:1200],
            "why": str(item.get("why") or "")[:1200],
            "what_to_verify": str(item.get("what_to_verify") or "")[:1200],
            "next_action": str(item.get("next_action") or "")[:1200],
        })

    return {
        "verdict": verdict,
        "summary": str(review.get("summary") or "")[:1800],
        "items": clean_items[:12],
        "strengths": [str(x)[:500] for x in (review.get("strengths") or []) if str(x).strip()][:3],
        "priority": [str(x)[:500] for x in (review.get("priority") or []) if str(x).strip()][:3],
    }


def handler(event, context):
    event = event if isinstance(event, dict) else {}
    origin = _origin(event)

    if _method(event) == "OPTIONS":
        return _response(204, {}, origin)

    if ALLOWED_ORIGIN and origin and origin != ALLOWED_ORIGIN:
        return _response(403, {"ok": False, "error": "origin_not_allowed"}, origin)

    if not API_KEY or not MODEL_NAME or client is None:
        return _response(503, {"ok": False, "error": "backend_not_configured"}, origin)

    data = _parse_event(event)
    packet = data.get("packet") if isinstance(data.get("packet"), dict) else data
    if not isinstance(packet, dict):
        return _response(400, {"ok": False, "error": "invalid_packet"}, origin)

    facts = packet.get("facts")
    if not isinstance(facts, dict):
        return _response(400, {"ok": False, "error": "facts_required"}, origin)

    serialized = json.dumps(packet, ensure_ascii=False)
    if len(serialized) > 20000:
        return _response(413, {"ok": False, "error": "packet_too_large"}, origin)

    user_prompt = (
        "Проверь эту карточку фактуры. Формальные стоп-сигналы уже найдены локально, но не считай их единственными возможными ошибками. "
        "Найди смысловые проблемы и верни JSON строго по заданной схеме.\n\n"
        + serialized
    )

    try:
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
            max_tokens=1800,
            response_format={"type": "json_object"},
        )
        content = completion.choices[0].message.content or "{}"
        review = _validate_review(json.loads(_clean_json_text(content)))
        return _response(200, {"ok": True, "provider": "yandex", "review": review}, origin)
    except json.JSONDecodeError:
        return _response(502, {"ok": False, "error": "invalid_model_json"}, origin)
    except Exception as exc:
        print(f"semantic review failed: {type(exc).__name__}: {exc}")
        return _response(502, {"ok": False, "error": "model_request_failed"}, origin)
