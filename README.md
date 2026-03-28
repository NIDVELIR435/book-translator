# Book Translator

EPUB to AI translation backend. Upload an EPUB file and get a translated EPUB using OpenAI or Anthropic.

## Requirements

- Node.js >= 20

## Setup

1. Clone and install dependencies:

```bash
npm install
```

2. Copy environment template and set your API key(s):

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `TRANSLATION_PROVIDER` | `openai` or `anthropic` |
| `OPENAI_API_KEY` | Required when `TRANSLATION_PROVIDER=openai` |
| `ANTHROPIC_API_KEY` | Required when `TRANSLATION_PROVIDER=anthropic` |

## Running the app

**Development (watch mode):**

```bash
npm run start:dev
```

**Development (one-off):**

```bash
npm run dev
```

**Production (build then run):**

```bash
npm run build
npm start
```

Server listens on `http://localhost:<PORT>`. Swagger UI: `http://localhost:<PORT>/api`.

## Using the API

**Translate an EPUB**

- **Endpoint:** `POST /translate`
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `file` (required): EPUB file (max 50 MB)
  - `targetLanguage` (required): Target locale, e.g. `es`, `fr`, `en-US` (2–10 chars, pattern `[a-z]{2}(-[A-Za-z0-9]+)?`)
- **Response:** Translated EPUB as `application/epub+zip` attachment (`translated.epub`)

Example with cURL:

```bash
curl -X POST http://localhost:3000/translate \
  -F "file=@/path/to/book.epub" \
  -F "targetLanguage=es" \
  -o translated.epub
```

Interactive docs and try-it-out: open `/api` in the browser.

## Tests

```bash
npm test
```
