# Lovable Clone: AI App Builder

A production-style React + TypeScript application that converts natural language prompts into a generated app preview and code workspace using Gemini, now backed by Firebase Authentication and Firestore chat history.

## Why This Project Stands Out

- End-to-end product thinking: prompt -> generation -> preview -> code explorer -> export.
- Real AI integration with observable request lifecycle and API call metrics.
- Strong UX details: responsive layout, improved visual hierarchy, conversation flow, and fast interactions.
- Practical user value: private cloud chat history and downloadable generated project files.

## Core Features

- Prompt-based app generation powered by Gemini (`@google/genai`).
- Live preview pane (`iframe`) for generated `previewHtml`.
- Code explorer for generated file tree and source inspection.
- One user request = one Gemini API call (duplicate submit protection).
- API call logging with totals in console (`total`, `success`, `failed`, `inFlight`).
- Dedicated login/sign-up page with email/password and Google login via Firebase Authentication.
- Per-user chat history stored in Firestore.
- Export generated output:
  - download full project as `.zip`
  - download active file from code view

## Tech Stack

- Frontend: React 19, TypeScript, Vite
- Backend services: Firebase Authentication, Firestore
- AI SDK: `@google/genai`
- Export utility: `jszip`
- Styling: Tailwind CDN + custom theme tokens

## Architecture Flow

```text
User Prompt
  -> App.tsx (request orchestration + auth + cloud persistence)
  -> services/geminiService.ts (Gemini call + metrics logging)
  -> services/firebase.ts (Firebase app + auth + firestore bootstrap)
  -> services/workspaceService.ts (per-user workspace CRUD)
  -> GeneratedApp payload (previewHtml + files + explanation)
  -> PreviewArea.tsx (preview/code/extract/download)
  -> ChatArea.tsx (conversation timeline + input)
```

## Project Structure

```text
.
|-- App.tsx
|-- index.tsx
|-- index.html
|-- types.ts
|-- firestore.rules
|-- services/
|   |-- firebase.ts
|   |-- geminiService.ts
|   `-- workspaceService.ts
`-- components/
    |-- ChatArea.tsx
    |-- PreviewArea.tsx
    `-- Icons.tsx
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Environment Setup

Create `.env.local` in project root:

```env
GEMINI_API_KEY=your_gemini_api_key
```

### Firebase Setup

1. In Firebase Console, enable `Authentication -> Sign-in method -> Email/Password` and `Google`.
2. Create a Firestore database for project `lovable-clone-project`.
3. Publish the rules from `firestore.rules` so users can only access their own history.

```bash
firebase deploy --only firestore:rules
```

The app already contains the provided Firebase web configuration in `services/firebase.ts`.

### Run in Development

```bash
npm run dev
```

Open `http://localhost:3000`.

### Production Build

```bash
npm run build
npm run preview
```

## API Observability

This project logs both UI request lifecycle and Gemini API lifecycle in the browser console:

- UI layer:
  - request start
  - request complete
  - request failed
- Gemini service layer:
  - call started
  - call succeeded/failed
  - running totals

This makes debugging and usage tracking straightforward during demos and interviews.

## Persistence and Export

- Firestore path: `users/{uid}/workspaces/{workspaceId}`
- Unauthenticated users land on a separate auth page before entering the workspace.
- Each signed-in user sees only their own saved chats.
- Latest workspace auto-loads after login.
- Export options from preview/code header:
  - full generated project as `.zip`
  - active file as single download

## NPM Scripts

- `npm run dev`: start local dev server
- `npm run build`: create production build
- `npm run preview`: preview production build locally

## Security Notes

- Never commit real API keys.
- Keep `.env.local` private and rotate keys if exposed.
- Firestore rules should always restrict access to `request.auth.uid == userId`.

## Demo Link

- AI Studio reference: `https://ai.studio/apps/drive/1CpgquTNczq5bVAfSbEZJ_SUV7iSPwSoi`
