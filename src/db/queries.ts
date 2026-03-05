import { desc, eq, lt, and, isNull, count } from 'drizzle-orm';
import { db } from './index';
import { threads, messages, participants } from './schema';
import type {
	Thread,
	Message,
	ThreadWithLastMessage,
	PaginatedMessages,
	Participant,
	MessageMetadata,
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
	const allThreads = await db
		.select()
		.from(threads)
		.orderBy(desc(threads.updatedAt));

	const result: ThreadWithLastMessage[] = [];

	for (const thread of allThreads) {
		const [lastMsg] = await db
			.select()
			.from(messages)
			.where(eq(messages.threadId, thread.id))
			.orderBy(desc(messages.createdAt))
			.limit(1);

		const [unreadResult] = await db
			.select({ value: count() })
			.from(messages)
			.where(
				and(
					eq(messages.threadId, thread.id),
					eq(messages.senderType, 'visitor'),
					isNull(messages.readAt)
				)
			);

		result.push({
			...serializeThread(thread),
			lastMessage: lastMsg ? serializeMessage(lastMsg) : null,
			unreadCount: unreadResult?.value ?? 0,
		});
	}

	return result;
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
	let cursorDate: Date | undefined;

	if (cursor) {
		const [cursorMsg] = await db
			.select({ createdAt: messages.createdAt })
			.from(messages)
			.where(eq(messages.id, cursor));
		cursorDate = cursorMsg?.createdAt;
	}

	const conditions = cursorDate
		? and(eq(messages.threadId, threadId), lt(messages.createdAt, cursorDate))
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
	const [message] = await db
		.insert(messages)
		.values({ id, threadId, senderType, senderId, content, messageType, metadata })
		.returning();

	await db
		.update(threads)
		.set({ updatedAt: new Date() })
		.where(eq(threads.id, threadId));

	return serializeMessage(message);
}

export async function markMessagesAsRead(
	threadId: string,
	senderType: 'visitor' | 'agent'
): Promise<number> {
	const result = await db
		.update(messages)
		.set({ readAt: new Date() })
		.where(
			and(
				eq(messages.threadId, threadId),
				eq(messages.senderType, senderType),
				isNull(messages.readAt)
			)
		)
		.returning({ id: messages.id });

	return result.length;
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
	const [existing] = await db
		.select()
		.from(participants)
		.where(eq(participants.id, id));

	if (existing) {
		const [updated] = await db
			.update(participants)
			.set({ isOnline: true, lastSeen: new Date() })
			.where(eq(participants.id, id))
			.returning();
		return serializeParticipant(updated);
	}

	const [created] = await db
		.insert(participants)
		.values({ id, type, name, isOnline: true })
		.returning();
	return serializeParticipant(created);
}
