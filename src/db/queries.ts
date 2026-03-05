import { desc, eq, lt, and, isNull, sql } from 'drizzle-orm';
import { db } from './index';
import { threads, messages, participants } from './schema';
import type {
	Thread,
	Message,
	ThreadWithLastMessage,
	PaginatedMessages,
	Participant,
	MessageMetadata,
	ThreadResolution,
} from '@/types';
import { MESSAGES_PAGE_SIZE } from '@/shared/lib/constants';

function serializeThread(row: typeof threads.$inferSelect): Thread {
	return {
		id: row.id,
		visitorId: row.visitorId,
		visitorName: row.visitorName,
		status: row.status,
		resolution: row.resolution ?? null,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

function serializeMessage(row: typeof messages.$inferSelect): Message {
	return {
		id: row.id,
		threadId: row.threadId,
		senderType: row.senderType,
		senderId: row.senderId,
		content: row.content,
		messageType: row.messageType,
		metadata: row.metadata ?? null,
		status: row.status,
		createdAt: row.createdAt.toISOString(),
		readAt: row.readAt?.toISOString() ?? null,
	};
}

function serializeParticipant(row: typeof participants.$inferSelect): Participant {
	return {
		id: row.id,
		type: row.type,
		name: row.name,
		isOnline: row.isOnline,
		lastSeen: row.lastSeen.toISOString(),
	};
}

export async function getThreadsWithLastMessage(): Promise<ThreadWithLastMessage[]> {
	const rows = await db.execute<{
		id: string;
		visitor_id: string;
		visitor_name: string;
		status: 'open' | 'resolved' | 'closed';
		resolution: ThreadResolution | null;
		created_at: string;
		updated_at: string;
		last_msg_id: string | null;
		last_msg_thread_id: string | null;
		last_msg_sender_type: 'visitor' | 'agent' | 'system' | null;
		last_msg_sender_id: string | null;
		last_msg_content: string | null;
		last_msg_message_type: 'text' | 'image' | 'file' | 'system' | null;
		last_msg_metadata: MessageMetadata | null;
		last_msg_status: 'sending' | 'sent' | 'delivered' | 'failed' | null;
		last_msg_created_at: string | null;
		last_msg_read_at: string | null;
		unread_count: number;
	}>(sql`
		SELECT
			t.*,
			lm.id          AS last_msg_id,
			lm.thread_id   AS last_msg_thread_id,
			lm.sender_type AS last_msg_sender_type,
			lm.sender_id   AS last_msg_sender_id,
			lm.content     AS last_msg_content,
			lm.message_type AS last_msg_message_type,
			lm.metadata    AS last_msg_metadata,
			lm.status      AS last_msg_status,
			lm.created_at  AS last_msg_created_at,
			lm.read_at     AS last_msg_read_at,
			COALESCE(uc.cnt, 0)::int AS unread_count
		FROM threads t
		LEFT JOIN LATERAL (
			SELECT * FROM messages m
			WHERE m.thread_id = t.id
			ORDER BY m.created_at DESC
			LIMIT 1
		) lm ON true
		LEFT JOIN LATERAL (
			SELECT COUNT(*)::int AS cnt FROM messages m
			WHERE m.thread_id = t.id
				AND m.sender_type = 'visitor'
				AND m.read_at IS NULL
		) uc ON true
		ORDER BY t.updated_at DESC
	`);

	return rows.map((row) => ({
		id: row.id,
		visitorId: row.visitor_id,
		visitorName: row.visitor_name,
		status: row.status,
		resolution: row.resolution ?? null,
		createdAt: new Date(row.created_at).toISOString(),
		updatedAt: new Date(row.updated_at).toISOString(),
		lastMessage: row.last_msg_id
			? {
					id: row.last_msg_id,
					threadId: row.last_msg_thread_id!,
					senderType: row.last_msg_sender_type!,
					senderId: row.last_msg_sender_id!,
					content: row.last_msg_content!,
					messageType: row.last_msg_message_type!,
					metadata: row.last_msg_metadata ?? null,
					status: row.last_msg_status!,
					createdAt: new Date(row.last_msg_created_at!).toISOString(),
					readAt: row.last_msg_read_at
						? new Date(row.last_msg_read_at).toISOString()
						: null,
				}
			: null,
		unreadCount: row.unread_count,
	}));
}

export async function getThreadById(id: string): Promise<Thread | null> {
	const [thread] = await db.select().from(threads).where(eq(threads.id, id));
	return thread ? serializeThread(thread) : null;
}

export async function createThread(
	id: string,
	visitorId: string,
	visitorName: string
): Promise<Thread> {
	const [thread] = await db
		.insert(threads)
		.values({ id, visitorId, visitorName })
		.returning();
	return serializeThread(thread);
}

export async function updateThreadStatus(
	id: string,
	status: 'open' | 'resolved' | 'closed'
): Promise<Thread | null> {
	const [thread] = await db
		.update(threads)
		.set({ status, updatedAt: new Date() })
		.where(eq(threads.id, id))
		.returning();
	return thread ? serializeThread(thread) : null;
}

export async function getMessagesPaginated(
	threadId: string,
	cursor?: string,
	limit: number = MESSAGES_PAGE_SIZE
): Promise<PaginatedMessages> {
	const conditions = cursor
		? and(
				eq(messages.threadId, threadId),
				lt(
					messages.createdAt,
					db
						.select({ createdAt: messages.createdAt })
						.from(messages)
						.where(eq(messages.id, cursor))
				)
			)
		: eq(messages.threadId, threadId);

	const rows = await db
		.select()
		.from(messages)
		.where(conditions)
		.orderBy(desc(messages.createdAt))
		.limit(limit + 1);

	const hasMore = rows.length > limit;
	const sliced = hasMore ? rows.slice(0, limit) : rows;

	return {
		messages: sliced.reverse().map(serializeMessage),
		hasMore,
		nextCursor: hasMore ? sliced[0].id : null,
	};
}

export async function createMessage(
	id: string,
	threadId: string,
	senderType: 'visitor' | 'agent' | 'system',
	senderId: string,
	content: string,
	messageType: 'text' | 'image' | 'file' | 'system' = 'text',
	metadata?: MessageMetadata
): Promise<Message> {
	return db.transaction(async (tx) => {
		const [message] = await tx
			.insert(messages)
			.values({ id, threadId, senderType, senderId, content, messageType, metadata })
			.returning();

		await tx
			.update(threads)
			.set({ updatedAt: new Date() })
			.where(eq(threads.id, threadId));

		return serializeMessage(message);
	});
}

export async function markMessagesAsRead(
	threadId: string,
	senderType: 'visitor' | 'agent'
): Promise<number> {
	const result = await db.execute<{ count: number }>(sql`
		UPDATE messages
		SET read_at = NOW()
		WHERE thread_id = ${threadId}
			AND sender_type = ${senderType}
			AND read_at IS NULL
	`);
	return result.count;
}

export async function updateMessageStatus(
	id: string,
	status: 'sending' | 'sent' | 'delivered' | 'failed'
): Promise<Message | null> {
	const [message] = await db
		.update(messages)
		.set({ status })
		.where(eq(messages.id, id))
		.returning();
	return message ? serializeMessage(message) : null;
}

export async function getOrCreateParticipant(
	id: string,
	type: 'visitor' | 'agent',
	name: string
): Promise<Participant> {
	const [result] = await db
		.insert(participants)
		.values({ id, type, name, isOnline: true, lastSeen: new Date() })
		.onConflictDoUpdate({
			target: participants.id,
			set: { isOnline: true, lastSeen: new Date() },
		})
		.returning();
	return serializeParticipant(result);
}
