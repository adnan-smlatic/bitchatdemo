import { jsonb, pgTable, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import type { MessageMetadata, ThreadResolution } from '@/types';

export const threads = pgTable('threads', {
	id: text('id').primaryKey(),
	visitorId: text('visitor_id').notNull(),
	visitorName: text('visitor_name').notNull(),
	status: text('status', { enum: ['open', 'resolved', 'closed'] })
		.notNull()
		.default('open'),
	resolution: jsonb('resolution').$type<ThreadResolution>(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
	index('threads_updated_at_idx').on(table.updatedAt),
]);

export const messages = pgTable('messages', {
	id: text('id').primaryKey(),
	threadId: text('thread_id')
		.notNull()
		.references(() => threads.id, { onDelete: 'cascade' }),
	senderType: text('sender_type', { enum: ['visitor', 'agent', 'system'] }).notNull(),
	senderId: text('sender_id').notNull(),
	content: text('content').notNull(),
	messageType: text('message_type', { enum: ['text', 'image', 'file', 'system'] })
		.notNull()
		.default('text'),
	metadata: jsonb('metadata').$type<MessageMetadata>(),
	status: text('status', { enum: ['sending', 'sent', 'delivered', 'failed'] })
		.notNull()
		.default('sent'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	readAt: timestamp('read_at', { withTimezone: true }),
}, (table) => [
	index('messages_thread_id_idx').on(table.threadId),
	index('messages_thread_id_created_at_idx').on(table.threadId, table.createdAt),
	index('messages_unread_idx').on(table.threadId, table.senderType, table.readAt),
]);

export const participants = pgTable('participants', {
	id: text('id').primaryKey(),
	type: text('type', { enum: ['visitor', 'agent'] }).notNull(),
	name: text('name').notNull(),
	isOnline: boolean('is_online').notNull().default(false),
	lastSeen: timestamp('last_seen', { withTimezone: true }).notNull().defaultNow(),
});
