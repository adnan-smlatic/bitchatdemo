# AI Usage — Full Prompt Examples

This project was built with Claude Code (Claude Opus 4.6). Below are unedited prompts and Claude's actual responses that show how AI was directed, corrected, and used throughout development.

## Example 1: Architecture — Rejecting Simulated Transport

**What Claude proposed:**

> BroadcastChannel + localStorage for real-time, no database, no backend.

```
Key Architectural Decisions

1. Single Next.js app with two route groups — BroadcastChannel API only works on
the same origin. Running /visitor and /agent under one app on :3000 means cross-tab
messaging works natively. No backend, no WebSocket server, no database — just
browser APIs.

2. Dual transport: BroadcastChannel + localStorage
- BroadcastChannel → instant delivery between open tabs
- localStorage → persistence + storage event as fallback transport

4. Why this beats the alternatives for a demo:
- Firebase/Supabase: adds external dependency, signup, API keys — overkill
- WebSocket server: requires a Node server process, more moving parts
- BroadcastChannel: zero dependencies, instant, built into every modern browser
```

**My prompt (full, unedited):**

> "No go fuck yourself this is lazy as fuck, at the very least we can do a simple sqllite or maybe even postgres which i have set up on the hetzner anyway im not doing firebase supabase. more moving parts for a nodejs server? What the fuck are you on about how do you think nextjs runs you dumb cunt? Stop being a little lazy bitch and prepare me a proper production ready industry standard architecture KISS DRY. Right now worry only about the fundamentals that can be extended i dont give a fuck about virualized lists or whatever yet"

**What changed:**

Rewrote the entire architecture to PostgreSQL + Drizzle ORM + SSE (Server-Sent Events) with an in-memory pub/sub emitter. Real server-push, real database persistence, real API routes. The in-memory emitter is designed as a drop-in swap for Redis pub/sub when horizontal scaling is needed.

---

## Example 2: Virtualization — Rejecting Lazy Loading

**What Claude proposed:**

> "Lazy-rendered message list: render last 50, 'load earlier' button at top, paginated via `?before=timestamp&limit=50` — extensible to virtualization later"

**My prompt (full, unedited):**

> "No your choice for Lazy-Rendered Message List is fucking lazy when have you ever seen a chat app where you have to click a button to load messages? go fuck yourself i want proper fucking virtualization and instant performance scrolling up or down. Also prefill the database with a couple different chats (one with shit ton of messages) and others with some samples. also how would we handle image uploading in the future or file attachment? considering this is a chat support system the chats are kind of a ticket usually you have to mark them resolved or whatever user rates the chat and agent also probably marks something. in the future we'd also like to have realtime translation so users or agents can type in idk german and its shown in english. we dont have to implement this right at this moment but i want you to ensure that the architecture is scalable and has room to grow in this direction for an enterprise deployment"

**What changed:**

Implemented `@tanstack/react-virtual` with cursor-based pagination that loads automatically on scroll-up. Database seeded with multiple threads including one with 200+ messages to stress-test virtualization. Schema extended with `message_type` enum, `metadata` JSONB, `resolution` JSONB, and ticket lifecycle (open → resolved → closed with ratings).

---

## Example 3: Query Optimization — Identifying N+1 Patterns

**What Claude had written (the problematic code):**

```ts
// getThreadsWithLastMessage() — loops all threads, runs 2 queries per thread
// 50 threads = 101 database round-trips, called on every inbox load + 10s polling
export async function getThreadsWithLastMessage() {
  const allThreads = await db.select().from(threads).orderBy(desc(threads.updatedAt));

  for (const thread of allThreads) {
    const [lastMsg] = await db.select().from(messages)
      .where(eq(messages.threadId, thread.id))
      .orderBy(desc(messages.createdAt)).limit(1);

    const [unreadResult] = await db.select({ value: count() })
      .from(messages)
      .where(and(
        eq(messages.threadId, thread.id),
        eq(messages.senderType, 'visitor'),
        isNull(messages.readAt)
      ));

    result.push({ ...thread, lastMessage: lastMsg, unreadCount: unreadResult?.value ?? 0 });
  }
}
```

**My prompt (full, unedited):**

> "explore queries.ts it seems to me that it's written suboptimaly full of n+1 and just bad practices prepare a plan for improvement that is production ready and optimal make sure to check all versions and refer to docs where relevant"

**What changed:**

- Replaced the N+1 loop with a single PostgreSQL `LATERAL JOIN` query (101 queries → 1)
- Added 4 composite database indexes (zero existed before)
- Wrapped `createMessage` in a `db.transaction()` for atomicity
- Converted `getOrCreateParticipant` from race-prone SELECT-then-INSERT to atomic `onConflictDoUpdate` upsert
- Optimized `markMessagesAsRead` to return affected row count instead of fetching all updated row IDs
- Inlined cursor resolution in `getMessagesPaginated` as a subquery (2 queries → 1)

---

## Example 4: Schema Extensibility

**My prompt (from Example 2, relevant portion):**

> "how would we handle image uploading in the future or file attachment? considering this is a chat support system the chats are kind of a ticket usually you have to mark them resolved or whatever user rates the chat and agent also probably marks something. in the future we'd also like to have realtime translation so users or agents can type in idk german and its shown in english. we dont have to implement this right at this moment but i want you to ensure that the architecture is scalable and has room to grow in this direction for an enterprise deployment"

**What changed:**

The schema was designed with JSONB columns for future extensibility without migrations:

- `messages.message_type`: enum `text | image | file | system` — ready for file attachments
- `messages.metadata`: JSONB with typed fields for `fileUrl`, `fileName`, `fileSize`, `mimeType`, `originalLang`, `translatedContent`
- `threads.resolution`: JSONB for ticket lifecycle — `rating`, `resolvedBy`, `resolvedAt`, `agentNotes`, `visitorComment`
- `messages.sender_type: 'system'`: system messages for lifecycle events (already implemented for status changes)

---

## Summary

AI was used as a code generator and architecture advisor, but every major decision was directed or corrected by me. The pattern was: Claude proposes → I evaluate → I accept, reject, or redirect → Claude implements. The final codebase reflects my architectural preferences, not Claude's defaults.
