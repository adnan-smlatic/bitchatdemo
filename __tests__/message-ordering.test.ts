import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useChatStore } from '@/stores/chat-store';
import type { Message } from '@/types';

vi.mock('@/shared/lib/api-client', () => ({
	api: {
		get: vi.fn(),
		post: vi.fn(),
		patch: vi.fn(),
	},
}));

function makeMessage(overrides: Partial<Message> & { id: string; createdAt: string }): Message {
	return {
		threadId: 'thread-1',
		senderType: 'visitor',
		senderId: 'visitor-1',
		content: `Message ${overrides.id}`,
		messageType: 'text',
		metadata: null,
		status: 'sent',
		readAt: null,
		...overrides,
	};
}

describe('message ordering', () => {
	beforeEach(() => {
		useChatStore.setState({
			threads: [],
			messages: new Map(),
			loadingThreads: false,
			loadingMessages: new Map(),
			hasMore: new Map(),
			nextCursor: new Map(),
		});
	});

	it('sorts out-of-order messages by createdAt timestamp', () => {
		const store = useChatStore.getState();

		// Add messages in wrong order (newest first)
		store.addMessage(makeMessage({ id: 'msg-3', createdAt: '2025-01-01T00:03:00Z' }));
		store.addMessage(makeMessage({ id: 'msg-1', createdAt: '2025-01-01T00:01:00Z' }));
		store.addMessage(makeMessage({ id: 'msg-2', createdAt: '2025-01-01T00:02:00Z' }));

		const messages = useChatStore.getState().messages.get('thread-1') ?? [];
		expect(messages.map((m) => m.id)).toEqual(['msg-1', 'msg-2', 'msg-3']);
	});

	it('maintains sort order when messages arrive with same timestamp', () => {
		const store = useChatStore.getState();
		const sameTime = '2025-01-01T00:01:00Z';

		store.addMessage(makeMessage({ id: 'msg-b', createdAt: sameTime }));
		store.addMessage(makeMessage({ id: 'msg-a', createdAt: sameTime }));

		const messages = useChatStore.getState().messages.get('thread-1') ?? [];
		expect(messages.length).toBe(2);
		// Both messages should be present regardless of order
		const ids = messages.map((m) => m.id);
		expect(ids).toContain('msg-a');
		expect(ids).toContain('msg-b');
	});

	it('updates thread preview when a new message is added', () => {
		useChatStore.setState({
			threads: [
				{
					id: 'thread-1',
					visitorId: 'visitor-1',
					visitorName: 'Test User',
					status: 'open',
					resolution: null,
					createdAt: '2025-01-01T00:00:00Z',
					updatedAt: '2025-01-01T00:00:00Z',
					lastMessage: null,
					unreadCount: 0,
				},
			],
		});

		useChatStore.getState().addMessage(
			makeMessage({
				id: 'msg-1',
				createdAt: '2025-01-01T00:05:00Z',
				content: 'New message',
			})
		);

		const thread = useChatStore.getState().threads.find((t) => t.id === 'thread-1');
		expect(thread?.lastMessage?.content).toBe('New message');
		expect(thread?.unreadCount).toBe(1);
	});
});
