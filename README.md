# Polyglot Booster

Polyglot Booster turns text, documents, and images into guided language-study material. It is built for bridge-language learning: a learner can study Japanese through Thai, Indonesian through English, or any supported source and explanation-language pair.

The application provides structured study prompts, server-side document extraction, Claude-powered tasks, saved study results, and Anki-ready reversible exports.

## What it does

- Enter text directly or upload HTML, text, XML, DOCX, PDF, JPG, or PNG files up to 4 MB.
- Select source and explanation languages independently, including preset language pairs.
- Choose a guided study workflow for translation, vocabulary, grammar, reading support, flashcards, morphology, and more.
- Run the selected task with Anthropic Claude.
- Save completed results, add notes, reopen them in the workspace, or export them.
- Edit individual flashcards before saving or exporting them.
- Export a saved result as TXT, CSV, or TSV. Every flashcard has source-to-explanation and explanation-to-source Anki rows.

Supported languages are Japanese, Thai, Indonesian, Spanish, English, and French.

## Requirements

- Node.js 20 or later
- An Anthropic API key, either configured by the host or entered by an individual user for their current session
- A Vercel Blob store when saving text inputs or reviews in a deployed environment

## Local development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Create `.env.local` with the host-owned services you want to enable:

```dotenv
# Used when a visitor has not supplied their own key in the application.
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional. Defaults to claude-sonnet-4-5.
ANTHROPIC_MODEL=claude-sonnet-4-5

# Required for persisted text inputs and saved reviews on Vercel.
BLOB_READ_WRITE_TOKEN=vercel_blob_read_write_token
```

Do not commit `.env.local` or any real API key.

## Personal API keys

The Language context panel includes an optional Anthropic API key field. A visitor can enter their own key to run study tasks and image/PDF OCR using their own Anthropic account.

The key is held only in the current React session. It is not written to local storage, saved reviews, text-input records, Vercel Blob, or source control. It is sent to the app server only with the immediate task or upload request. Closing or refreshing the page clears it.

When the field is blank, the app uses the server's `ANTHROPIC_API_KEY`. For a fully bring-your-own-key deployment, omit that environment variable; tasks that require Claude will ask the visitor to provide a key.

## Private review sync

Saved reviews are synced through a private encrypted workspace. On first use, the app creates a 256-bit private sync code and saves it only in that browser. Copy the code and enter it on another device to open the same reviews.

Before upload, reviews are encrypted in the browser with AES-GCM. Vercel Blob receives only ciphertext and stores it in a private object addressed by a one-way hash of the sync code. The sync code is never stored in Blob, and the server cannot decrypt review content.

Treat the sync code like a password: anyone who has it can open and change that workspace. Keep a copy in a password manager. There is no account recovery; losing the code means the encrypted workspace cannot be recovered.

Provider API keys are deliberately device-local and are not part of private review sync.

## Storage and uploads

Encrypted saved reviews are stored in private Vercel Blob objects. The configured Blob store must permit the application's token to read and write them.

Uploaded documents are written temporarily to the server's temporary directory while text is extracted. They are not retained as user documents after the request completes. Text-based files are extracted locally; images and scanned PDFs without usable embedded text are sent to Claude for transcription.

## Anki exports

Use **Anki CSV** or **Anki TSV** from a saved review. Each export contains these columns:

```text
Front, Back, Source language, Explanation language, Prompt, Notes, Direction
```

The flashcard workflow asks Claude for structured cards, then shows each card's front, back, and tags for editing before it is saved. Each card produces two rows so both directions are importable as basic Anki cards. The `Tags` column includes the language pair and prompt template along with any card-specific tags. Import the file into Anki as a Basic note type and map `Front` and `Back`; the other columns may be imported as fields or ignored.

Older saved results that do not contain structured cards remain exportable as one forward/reverse source-and-result pair.

## Scripts

```bash
npm run dev     # Start the Next.js development server
npm run lint    # Run ESLint
npm run build   # Build and type-check for production
npm run start   # Run the production build
```

## Deployment

The project is configured for Vercel. Connect the repository to Vercel, create a Blob store, and add the `BLOB_READ_WRITE_TOKEN` and optional Anthropic variables under Project Settings > Environment Variables. Deployments use `next build`.

Before deploying changes, run:

```bash
npm run lint
npm run build
```
