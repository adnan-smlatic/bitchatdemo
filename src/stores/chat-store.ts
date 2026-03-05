import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { api } from '@/shared/lib/api-client';
import type {
	Message,
	ThreadWithLastMessage,
	PaginatedMessages,
	SendMessagePayload,
	CreateThreadPayload,
	Thread,
} from '@/types';

interface ChatState {
	threads: ThreadWithLastMessage[];
	messages: Map<string, Message[]>;
	loadingThreads: boolean;
	loadingMessages: Map<string, boolean>;
	hasMore: Map<string, boolean>;
	nextCursor: Map<string, string | null>;

	fetchThreads: () => Promise<void>;
	fetchMessages: (threadId: string) => Promise<void>;
	fetchOlderMessages: (threadId: string) => Promise<void>;
	sendMessage: (payload: SendMessagePayload) => Promise<Message | null>;
	createThread: (payload: CreateThreadPayload) => Promise<Thread | null>;
	addMessage: (message: Message) => void;
	updateMessageStatus: (messageId: string, threadId: string, status: Message['status']) => void;
	updateThread: (thread: Partial<ThreadWithLastMessage> & { id: string }) => void;
	markMessagesRead: (threadId: string, senderType: 'visitor' | 'agent') => void;
	retryMessage: (message: Message) => Promise<Message | null>;
	setThreads: (threads: ThreadWithLastMessage[]) => void;
	getThreadMessages: (threadId: string) => Message[];
}

export const useChatStore = create<ChatState>((set, get) => ({
	threads: [],
	messages: new Map(),
	loadingThreads: false,
	loadingMessages: new Map(),
	hasMore: new Map(),
	nextCursor: new Map(),

	setThreads: (threads) => set({ threads }),

	getThreadMessages: (threadId) => get().messages.get(threadId) ?? [],

	fetchThreads: async () => {
		set({ loadingThreads: true });
		const { data } = await api.get<ThreadWithLastMessage[]>('/api/threads');
		if (data) {
			set({ threads: data });
		}
		set({ loadingThreads: false });
	},

	fetchMessages: async (threadId) => {
		const { loadingMessages } = get();
		if (loadingMessages.get(threadId)) return;

		set({ loadingMessages: new Map(loadingMessages).set(threadId, true) });

		const { data } = await api.get<PaginatedMessages>(
			`/api/messages?threadId=${threadId}`
		);

		if (data) {
			// Merge with any optimistic messages already in store
			const existing = get().messages.get(threadId) ?? [];
			const optimistic = existing.filter((m) => m.status === 'sending');
			const serverIds = new Set(data.messages.map((m) => m.id));
			const remainingOptimistic = optimistic.filter((m) => !serverIds.has(m.id));
			const merged = [...data.messages, ...remainingOptimistic].sort(
				(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
			);

			const newMessages = new Map(get().messages);
			newMessages.set(threadId, merged);

			const newHasMore = new Map(get().hasMore);
			newHasMore.set(threadId, data.hasMore);

			const newCursor = new Map(get().nextCursor);
			newCursor.set(threadId, data.nextCursor);

			set({
				messages: newMessages,
				hasMore: newHasMore,
				nextCursor: newCursor,
			});
		}

		const updated = new Map(get().loadingMessages);
		updated.set(threadId, false);
		set({ loadingMessages: updated });
	},

	fetchOlderMessages: async (threadId) => {
		const { hasMore, nextCursor, loadingMessages } = get();
		if (!hasMore.get(threadId) || loadingMessages.get(threadId)) return;

		const cursor = nextCursor.get(threadId);
		if (!cursor) return;

		set({ loadingMessages: new Map(loadingMessages).set(threadId, true) });

		const { data } = await api.get<PaginatedMessages>(
			`/api/messages?threadId=${threadId}&cursor=${cursor}`
		);

		if (data) {
			const existing = get().messages.get(threadId) ?? [];
			const newMessages = new Map(get().messages);
			newMessages.set(threadId, [...data.messages, ...existing]);

			const newHasMore = new Map(get().hasMore);
			newHasMore.set(threadId, data.hasMore);

			const newCursor = new Map(get().nextCursor);
			newCursor.set(threadId, data.nextCursor);

			set({
				messages: newMessages,
				hasMore: newHasMore,
				nextCursor: newCursor,
			});
		}

		const updated = new Map(get().loadingMessages);
		updated.set(threadId, false);
		set({ loadingMessages: updated });
	},

	sendMessage: async (payload) => {
		const optimisticId = nanoid();
		const optimisticMessage: Message = {
			id: optimisticId,
			threadId: payload.threadId,
			senderType: payload.senderType,
			senderId: payload.senderId,
			content: payload.content,
			messageType: payload.messageType ?? 'text',
			metadata: payload.metadata ?? null,
			status: 'sending',
			createdAt: new Date().toISOString(),
			readAt: null,
		};

		// Optimistic add
		get().addMessage(optimisticMessage);

		const { data, error } = await api.post<Message>('/api/messages', payload);

		if (error || !data) {
			get().updateMessageStatus(optimisticId, payload.threadId, 'failed');
			return null;
		}

		// Replace optimistic message with server response
		const threadMessages = get().messages.get(payload.threadId) ?? [];
		const updated = threadMessages.map((m) => (m.id === optimisticId ? data : m));
		const newMessages = new Map(get().messages);
		newMessages.set(payload.threadId, updated);
		set({ messages: newMessages });

		return data;
	},

	createThread: async (payload) => {
		const { data } = await api.post<Thread>('/api/threads', payload);
		if (data) {
			// Add thread to local state immediately (don't wait for fetchThreads)
			const newThread: ThreadWithLastMessage = {
				...data,
				lastMessage: null,
				unreadCount: 0,
			};
			set({ threads: [newThread, ...get().threads] });
		}
		return data;
	},

	addMessage: (message) => {
		const { messages, threads } = get();
		const existing = messages.get(message.threadId) ?? [];

		// Deduplicate by ID
		if (existing.some((m) => m.id === message.id)) return;

		const updated = [...existing, message].sort(
			(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
		);

		const newMessages = new Map(messages);
		newMessages.set(message.threadId, updated);

		// Update thread preview
		const updatedThreads = threads.map((t) => {
			if (t.id === message.threadId) {
				return {
					...t,
					lastMessage: message,
					updatedAt: message.createdAt,
					unreadCount:
						message.senderType === 'visitor'
							? t.unreadCount + 1
							: t.unreadCount,
				};
			}
			return t;
		});

		set({ messages: newMessages, threads: updatedThreads });
	},

	updateMessageStatus: (messageId, threadId, status) => {
		const threadMessages = get().messages.get(threadId) ?? [];
		const updated = threadMessages.map((m) =>
			m.id === messageId ? { ...m, status } : m
		);
		const newMessages = new Map(get().messages);
		newMessages.set(threadId, updated);
		set({ messages: newMessages });
	},

	updateThread: (partial) => {
		const { threads } = get();
		const exists = threads.some((t) => t.id === partial.id);

		if (exists) {
			const updated = threads.map((t) =>
				t.id === partial.id ? { ...t, ...partial } : t
			);
			set({ threads: updated });
		} else {
			// New thread from another tab - add it
			set({ threads: [partial as ThreadWithLastMessage, ...threads] });
		}
	},

	retryMessage: async (message) => {
		// Remove the failed message
		const threadMessages = get().messages.get(message.threadId) ?? [];
		const filtered = threadMessages.filter((m) => m.id !== message.id);
		const newMessages = new Map(get().messages);
		newMessages.set(message.threadId, filtered);
		set({ messages: newMessages });

		// Re-send
		return get().sendMessage({
			threadId: message.threadId,
			senderId: message.senderId,
			senderType: message.senderType as 'visitor' | 'agent',
			content: message.content,
			messageType: message.messageType,
			metadata: message.metadata ?? undefined,
		});
	},

	markMessagesRead: (threadId, senderType) => {
		api.patch('/api/messages/read', {
			markRead: { threadId, senderType },
		});

		// Update local state
		const threadMessages = get().messages.get(threadId) ?? [];
		const updated = threadMessages.map((m) =>
			m.senderType === senderType && !m.readAt
				? { ...m, readAt: new Date().toISOString() }
				: m
		);
		const newMessages = new Map(get().messages);
		newMessages.set(threadId, updated);

		// Reset unread count
		const updatedThreads = get().threads.map((t) =>
			t.id === threadId ? { ...t, unreadCount: 0 } : t
		);

		set({ messages: newMessages, threads: updatedThreads });
	},
}));
