# BitChatDemo

A real-time customer support chat system. 

If I was doing this for real I'd completely seperate the entire backend into something like Larvel with a proper Admin managment panel. I am not a fan of doing DB work, APIs and simmilar stuff in Typescript as I think it was not designed for this. It doesn't lead to a good DX and you end up with a thousand packages and libraries often conflicting with each other

I chose SSE instead of simulated events, because it felt more realistic and it's the same amount of effort. I also chose local Postgres instead of Supabase due to simplicity. 

Majority of the project was written with Claude Code Opus 4.6, first starting with a high level architecture overview plan by giving it the task requirements and my own thoughts about it. 

I also used things like frontend design skills, and agents to proof all the work. 

You can see actual prompts in AI_USAGE.md but it contains swearing. 


## Quick Start

```bash
createdb chatdemo
bun install
bun run db:migrate
bun run db:seed
bun run build
bun start
```

Then open:
- `http://localhost:3000/visitor` — Mock website with floating chat widget
- `http://localhost:3000/agent` — Agent inbox and conversation management

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router (Bun)                  │
│                                                                 │
│  PAGES                              API ROUTES                  │
│  ─────                              ──────────                  │
│  /           Landing (links)        GET  /api/threads           │
│  /visitor    Mock site + widget     POST /api/threads           │
│  /agent      Inbox + thread view    GET  /api/threads/:id       │
│                                     PATCH /api/threads/:id      │
│                                     GET  /api/messages          │
│                                     POST /api/messages          │
│                                     PATCH /api/messages/read    │
│                                     POST /api/typing            │
│                                                                 │
│  SSE STREAMS                                                    │
│  ───────────                                                    │
│  GET /api/sse/:threadId   Per-thread (messages, typing, status) │
│  GET /api/sse/inbox       Inbox-wide (new messages, updates)    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  In-Memory SSE Pub/Sub (sse-emitter.ts)                        │
│  ──────────────────────────────────────                         │
│  channels Map<string, Set<Controller>>                          │
│    "thread:{id}" → message, typing, thread-status events        │
│    "inbox"       → new-message, thread-update events            │
│                                                                 │
│  Scaling path: swap Map → Redis pub/sub (zero API changes)      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PostgreSQL + Drizzle ORM                                       │
│  ────────────────────────                                       │
│  threads     │ id, visitor_id, visitor_name, status,            │
│              │ resolution (JSONB), created_at, updated_at       │
│              │ idx: updated_at                                   │
│  messages    │ id, thread_id, sender_type, sender_id, content,  │
│              │ message_type, metadata (JSONB), status,           │
│              │ created_at, read_at                               │
│              │ idx: thread_id; (thread_id, created_at);          │
│              │      (thread_id, sender_type, read_at)            │
│  participants│ id, type, name, is_online, last_seen             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Message Flow

```
VISITOR                         SERVER                        AGENT
───────                         ──────                        ─────
types message
      │
      ▼
POST /api/messages ────────▶  INSERT into PostgreSQL
                              status = 'sent'
zustand optimistic                │
update (sending)                  │
      │                           ├──▶  SSE → inbox channel
      │                           │               │
      ▼                           │               ▼
SSE confirms 'sent' ◀────────────┤     zustand updates inbox
                                  │     unread++, preview updated
                                  │
                                  │     agent replies
                                  │     POST /api/messages
                                  │               │
                                  ◀───────────────┘
                                  INSERT into db
                                  │
SSE push to visitor ◀─────────────┘
      │
      ▼
visitor sees reply
notification sound plays
```

## State Management

### Zustand (chat-store.ts)

Chosen over Context API for:
- **No provider nesting** — single `create()` call, import anywhere
- **Selective subscriptions** — components only re-render on the slices they use
- **Optimistic updates** — straightforward imperative mutations with `set()`
- **Direct access outside React** — `useChatStore.getState()` for SSE handlers

The store manages:
- `threads: ThreadWithLastMessage[]` — inbox list with preview data
- `messages: Map<string, Message[]>` — per-thread message arrays
- Pagination state (`hasMore`, `nextCursor`) per thread
- Optimistic send flow: insert with `status: 'sending'`, replace on server response

### Zustand (presence-store.ts)

Separate store for typing indicators to avoid re-rendering the full chat on every keystroke. Debounced at 300ms with a 2s auto-clear timeout.

### Trade-offs

- **SSE over simulated transport**: The spec allows simulated real-time (BroadcastChannel, localStorage, polling) or a managed service (Firebase/Supabase). I chose Server-Sent Events instead — it's real server-push without third-party dependencies. Native `EventSource` gives auto-reconnection and HTTP/2 multiplexing for free, with zero client libraries. SSE is server-to-client only, but that fits perfectly: the server pushes messages/typing/status updates, while clients send actions via normal POST/PATCH routes. No bidirectional streaming is needed since clients make discrete requests, not continuous streams.
- **In-memory pub/sub**: Works for single-process deployment. For horizontal scaling, swap to Redis pub/sub — the `publish(channel, event, data)` interface stays identical.


## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun |
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | PostgreSQL + Drizzle ORM |
| State | Zustand |
| Real-time | Server-Sent Events |
| UI | Tailwind CSS + Radix UI + lucide-react |
| Virtualization | @tanstack/react-virtual v3 |
| Dates | date-fns |
| Theme | next-themes |
| Testing | Vitest + React Testing Library |

## Folder Structure

```
src/
├── app/                    # Next.js pages + API routes
│   ├── page.tsx            # Landing page
│   ├── visitor/page.tsx    # Mock website + chat widget
│   ├── agent/page.tsx      # Agent dashboard
│   └── api/                # REST + SSE endpoints
├── features/               # Feature-scoped components + hooks
│   ├── visitor/            # Chat widget, useVisitorChat hook
│   └── agent/              # Inbox, thread view, useAgentInbox hook
├── components/
│   ├── ui/                 # Shared primitives (Button, Badge)
│   └── chat/               # Shared chat components (bubble, list, input)
├── shared/
│   ├── components/         # Error boundary, offline banner, theme toggle
│   ├── hooks/              # useSSE
│   └── lib/                # SSE emitter, API client, dates, sounds, utils
├── stores/                 # Zustand stores
├── db/                     # Drizzle schema, queries, seed data
└── types/                  # TypeScript interfaces
```

## Key Features

- **Optimistic send with retry**: Messages appear instantly with a "sending" indicator, confirmed via SSE, with a retry button on failure
- **Delivery states**: Single check (sent), double check (delivered), double blue check (read) — using lucide-react icons
- **Virtualized message list**: Handles 200+ messages efficiently with cursor-based pagination on scroll-up
- **Ticket lifecycle**: Open -> Resolved -> Closed with system messages, visitor rating (1-5 stars + comment), and agent notes
- **Typing indicators**: Debounced at 300ms, auto-clear after 2s
- **Dark mode**: next-themes with Tailwind CSS v4 custom variant
- **Notification sound**: Plays on incoming messages from the other party
- **Responsive**: All pages work on mobile — agent inbox uses show/hide pattern for list vs thread view
- **Offline banner**: Detects network state, shows warning
- **Error boundaries**: Wrap all major UI sections

## Extensibility

The schema is designed for growth:

- **File attachments**: `message_type: 'image'|'file'` + `metadata` JSONB (`{ fileUrl, fileName, mimeType }`)
- **Real-time translation**: `metadata.originalLang` + `metadata.translatedContent`
- **System messages**: `sender_type: 'system'` for lifecycle events (already implemented)

## Improvements With More Time

- **Redis pub/sub** for horizontal scaling (multiple server instances)
- **File upload** support with S3/R2 storage
- **Real-time translation** via LLM API middleware
- **Agent authentication** (currently uses a hardcoded agent ID)
- **Visitor identification** via cookies or fingerprinting (currently localStorage)
- **E2E tests** with Playwright covering the full visitor-to-agent flow
- **Message search** across threads
- **Canned responses** for agents
- **Assignment** — multiple agents with thread assignment
- **Analytics dashboard** — response times, resolution rates, CSAT scores
- **Rate limiting** on API routes
- **WebSocket upgrade** if bidirectional streaming becomes needed

## Tests

```bash
bun run test
```

Runs 10 tests across 3 files:
- `chat-store.test.ts` — Optimistic send, failure handling, deduplication
- `message-ordering.test.ts` — Out-of-order messages sorted by timestamp, thread preview updates
- `message-bubble.test.tsx` — Render content, system messages, delivery status, retry button
