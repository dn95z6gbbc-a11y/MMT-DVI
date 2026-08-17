# MMT ДВИ — YandexGPT semantic review backend

This folder contains the serverless backend for semantic review of a student's news fact card.

## Why Yandex Cloud Functions

The browser never receives a model credential. The function runs under a Yandex Cloud service account and uses the temporary IAM token provided by Cloud Functions in `context.token`.

## One-time setup in Yandex Cloud Console

1. Create or choose a folder for MMT ДВИ.
2. In **Identity and Access Management → Service accounts**, create a service account named `mmt-dvi-ai`.
3. Grant `mmt-dvi-ai` the **`ai.languageModels.user`** role on the folder.
4. Open **Cloud Functions** and create a function named `mmt-dvi-review`.
5. Create a function version:
   - Runtime: a current Node.js runtime (Node.js 22+ recommended).
   - Entrypoint: `index.handler`.
   - Memory: 256 MB is enough for the prototype.
   - Timeout: 30 seconds.
   - Service account: `mmt-dvi-ai`.
   - No API keys, environment variables, or Lockbox secrets are required.
   - Put the contents of `index.js` into the function editor (or upload this file).
6. Save the version and wait until it becomes Active.
7. On the function Overview page, enable **Public function** for the prototype.
8. Copy the invocation URL. It looks like:
   `https://functions.yandexcloud.net/<function_ID>`
9. Put that URL into `mmt-config.js` as `aiReviewEndpoint`.

## Security notes

- There is no secret in GitHub or in the browser.
- The public prototype endpoint accepts requests from the MMT GitHub Pages origin. CORS is not a complete anti-abuse mechanism; before a public launch, put the function behind stronger application authentication / rate limiting.
- Request size and model output are capped in code to limit accidental spend.
- Do not send unnecessary personal data about minors in test fact cards.

## Response contract

The function returns JSON:

```json
{
  "ok": true,
  "review": {
    "verdict": "нужно дособрать",
    "summary": "...",
    "issues": [
      {
        "criterion": "источник",
        "severity": "important",
        "problem": "...",
        "why": "...",
        "whatToVerify": "...",
        "nextAction": "..."
      }
    ],
    "strengths": [],
    "questionsForStudent": []
  }
}
```

The model is explicitly instructed not to invent facts or write the news article for the student.
