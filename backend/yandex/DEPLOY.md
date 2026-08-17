# MMT ДВИ — Yandex Cloud semantic reviewer

Backend for the semantic review of a student's news fact card.

## Files

- `index.py` — Yandex Cloud Function handler.
- `requirements.txt` — Python dependency list.

## Recommended Yandex Cloud settings

- Runtime: Python 3.12.
- Entrypoint: `index.handler`.
- Memory: 256 MB.
- Timeout: 30 seconds.
- Service account: `function-sa`.
- Environment variables:
  - `BASE_URL=https://ai.api.cloud.yandex.net/v1`
  - `MODEL_NAME=gpt://<FOLDER_ID>/yandexgpt/latest`
  - `ALLOWED_ORIGIN=https://dn95z6gbbc-a11y.github.io`
- Lockbox secret exposed as environment variable:
  - `API_KEY` -> secret `api-key-secret`, key `api-key`.

## IAM

Create service account `function-sa` and give it role:

- `ai.languageModels.user`

Create a service-account API key scoped to:

- `yc.ai.languageModels.execute`

Store the API key value in Yandex Lockbox as:

- secret name: `api-key-secret`
- key: `api-key`

Give `function-sa` role `lockbox.payloadViewer` on that secret.

## Function access

For the current GitHub Pages prototype, the function must be public so the browser can invoke it over HTTPS. The function itself restricts browser CORS to the MMT GitHub Pages origin and never returns the Yandex API key.

After deployment the endpoint will look like:

`https://functions.yandexcloud.net/<FUNCTION_ID>`

Put only this public endpoint into `mmt-config.js` as `aiReviewEndpoint`. Never put an API key into the repository or browser code.

## Request

POST JSON:

```json
{
  "packet": {
    "schema": "mmt-news-semantic-review-v1",
    "facts": {}
  }
}
```

## Response

```json
{
  "ok": true,
  "review": {
    "verdict": "нужно дособрать",
    "summary": "...",
    "issues": [],
    "strengths": [],
    "questionsForStudent": []
  },
  "meta": {
    "provider": "yandex",
    "modelVersion": "..."
  }
}
```
