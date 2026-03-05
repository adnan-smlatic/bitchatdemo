import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChatStore } from '@/stores/chat-store';
import type { Message } from '@/types';

// Mock api-client
vi.mock('@/shared/lib/api-client', () => ({
	api: {
		get: vi.fn(),
		post: vi.fn(),
		patch: vi.fn(),
	},
}));

describe('chat-store', () => {
	beforeEach(() => {
		// Reset zustand store between tests
		useChatStore.setState({
			threads: [],
			messages: new Map(),
			loadingThreads: false,
			loadingMessages: new Map(),
			hasMore: new Map(),
			nextCursor: new Map(),
		});
	});

	it('adds a message optimistically with status "sending"', async () => {
		const { api } = await import('@/shared/lib/api-client');
		const sentMessage: Message = {
			id: 'server-msg-1',
			threadId: 'thread-1',
			senderType: 'visitor',
			senderId: 'visitor-1',
			content: 'Hello!',
			messageType: 'text',
			metadata: null,
			status: 'sent',
			createdAt: new Date().toISOString(),
			readAt: null,
		};

		vi.mocked(api.post).mockResolvedValue({ data: sentMessage, error: null });

		const promise = useChatStore.getState().sendMessage({
			threadId: 'thread-1',
			senderId: 'visitor-1',
			senderType: 'visitor',
			content: 'Hello!',
		});

		// Immediately after calling sendMessage, an optimistic message should exist
		const messagesWhileSending = useChatStore.getState().messages.get('thread-1') ?? [];
		expect(messagesWhileSending.length).toBe(1);
		expect(messagesWhileSending[0].status).toBe('sending');
		expect(messagesWhileSending[0].content).toBe('Hello!');

		// After promise resolves, status should be updated to 'sent'
		await promise;
		const messagesAfterSent = useChatStore.getState().messages.get('thread-1') ?? [];
		expect(messagesAfterSent.length).toBe(1);
		expect(messagesAfterSent[0].status).toBe('sent');
		expect(messagesAfterSent[0].id).toBe('server-msg-1');
	});

	it('marks message as failed when API returns an error', async () => {
		const { api } = await import('@/shared/lib/api-client');
		vi.mocked(api.post).mockResolvedValue({ data: null, error: { message: 'Network error', status: 0 } });

		await useChatStore.getState().sendMessage({
			threadId: 'thread-1',
			senderId: 'visitor-1',
			senderType: 'visitor',
			content: 'This will fail',
		});

		const messages = useChatStore.getState().messages.get('thread-1') ?? [];
		expect(messages.length).toBe(1);
		expect(messages[0].status).toBe('failed');
	});

	it('deduplicates messages by ID', () => {
		const msg: Message = {
			id: 'msg-1',
			threadId: 'thread-1',
			senderType: 'visitor',
			senderId: 'visitor-1',
			content: 'Hello',
			messageType: 'text',
			metadata: null,
			status: 'sent',
			createdAt: new Date().toISOString(),
			readAt: null,
		};

		useChatStore.getState().addMessage(msg);
		useChatStore.getState().addMessage(msg); // duplicate

		const messages = useChatStore.getState().messages.get('thread-1') ?? [];
		expect(messages.length).toBe(1);
	});
});
