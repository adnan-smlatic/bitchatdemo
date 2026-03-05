'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { usePresenceStore } from '@/stores/presence-store';
import { useSSE } from '@/shared/hooks/use-sse';
import { playNotification } from '@/shared/lib/sounds';
import { api } from '@/shared/lib/api-client';
import type { Message, TypingEvent, Thread, ThreadResolution } from '@/types';

const VISITOR_ID_KEY = 'bitchat-visitor-id';
const VISITOR_NAME_KEY = 'bitchat-visitor-name';
const VISITOR_THREAD_KEY = 'bitchat-visitor-thread';

function getOrCreateVisitorId(): string {
	if (typeof window === 'undefined') return '';
	let id = localStorage.getItem(VISITOR_ID_KEY);
	if (!id) {
		id = `visitor-${crypto.randomUUID().slice(0, 8)}`;
		localStorage.setItem(VISITOR_ID_KEY, id);
	}
	return id;
}

function getOrCreateVisitorName(): string {
	if (typeof window === 'undefined') return '';
	let name = localStorage.getItem(VISITOR_NAME_KEY);
	if (!name) {
		const names = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley'];
		name = names[Math.floor(Math.random() * names.length)];
		localStorage.setItem(VISITOR_NAME_KEY, name);
	}
	return name;
}

export function useVisitorChat() {
	const visitorId = useRef(getOrCreateVisitorId()).current;
	const visitorName = useRef(getOrCreateVisitorName()).current;

	// Track threadId in local state so SSE reconnects when thread is created
	const [activeThreadId, setActiveThreadId] = useState<string | null>(() => {
		if (typeof window === 'undefined') return null;
		return localStorage.getItem(VISITOR_THREAD_KEY);
	});

	const {
		threads,
		messages,
		fetchMessages,
		fetchOlderMessages,
		sendMessage,
		createThread,
		addMessage,
		updateThread,
		hasMore,
		loadingMessages,
	} = useChatStore();

	const { setTyping, handleTypingInput, typingByThread } = usePresenceStore();

	// Find this visitor's thread from store
	const thread = threads.find((t) => t.id === activeThreadId) ??
		threads.find((t) => t.visitorId === visitorId) ?? null;
	const threadId = activeThreadId ?? thread?.id ?? null;
	const threadMessages = threadId ? messages.get(threadId) ?? [] : [];
	const typing = threadId ? typingByThread.get(threadId) ?? null : null;

	// SSE connection for the thread
	useSSE({
		url: threadId ? `/api/sse/${threadId}` : '',
		enabled: !!threadId,
		onEvent: useCallback(
			(event: string, data: unknown) => {
				if (event === 'message') {
					const msg = data as Message;
					// Only add messages from agent/system (not our own)
					if (msg.senderId !== visitorId) {
						addMessage(msg);
						playNotification();
					}
				}
				if (event === 'typing') {
					const typingData = data as TypingEvent;
					if (typingData.senderId !== visitorId && threadId) {
						setTyping(threadId, {
							senderId: typingData.senderId,
							senderType: typingData.senderType,
						});
					}
				}
				if (event === 'thread-status') {
					const statusData = data as { status: string; resolution?: ThreadResolution | null };
					// Update thread status locally instead of fetching all threads
					if (threadId) {
						updateThread({
							id: threadId,
							status: statusData.status as Thread['status'],
							...(statusData.resolution ? { resolution: statusData.resolution } : {}),
						});
						// Refresh messages for the system message
						fetchMessages(threadId);
					}
					// Notify visitor when agent resolves/closes the chat
					if (statusData.status === 'resolved' || statusData.status === 'closed') {
						playNotification();
					}
				}
				if (event === 'messages-read') {
					if (threadId) fetchMessages(threadId);
				}
			},
			[visitorId, threadId, addMessage, setTyping, fetchMessages, updateThread]
		),
	});

	// Load only the visitor's thread on mount (not all threads)
	useEffect(() => {
		if (activeThreadId) {
			// Fetch only this thread's data
			api.get<Thread>(`/api/threads/${activeThreadId}`).then(({ data }) => {
				if (data) {
					updateThread({ ...data, lastMessage: null, unreadCount: 0 });
				} else {
					// Thread no longer exists — clear stale ID
					localStorage.removeItem(VISITOR_THREAD_KEY);
					setActiveThreadId(null);
				}
			});
		}
	}, [activeThreadId, updateThread]);

	// Load messages when thread found
	useEffect(() => {
		if (threadId) {
			fetchMessages(threadId);
		}
	}, [threadId, fetchMessages]);

	const send = useCallback(
		async (content: string) => {
			let currentThreadId = threadId;

			if (!currentThreadId) {
				const newThread = await createThread({
					visitorId,
					visitorName,
				});
				if (!newThread) return;
				currentThreadId = newThread.id;
				setActiveThreadId(currentThreadId);
				localStorage.setItem(VISITOR_THREAD_KEY, currentThreadId);
			}

			await sendMessage({
				threadId: currentThreadId,
				senderId: visitorId,
				senderType: 'visitor',
				content,
			});
		},
		[threadId, visitorId, visitorName, createThread, sendMessage]
	);

	const handleTyping = useCallback(() => {
		if (threadId) {
			handleTypingInput(threadId, visitorId, 'visitor');
		}
	}, [threadId, visitorId, handleTypingInput]);

	const loadMore = useCallback(() => {
		if (threadId) {
			fetchOlderMessages(threadId);
		}
	}, [threadId, fetchOlderMessages]);

	const startNewChat = useCallback(() => {
		// Clear old thread from store so the fallback lookup doesn't find it
		if (threadId) {
			const currentThreads = useChatStore.getState().threads;
			useChatStore.setState({
				threads: currentThreads.filter((t) => t.id !== threadId),
			});
		}
		localStorage.removeItem(VISITOR_THREAD_KEY);
		setActiveThreadId(null);
	}, [threadId]);

	return {
		visitorId,
		visitorName,
		thread,
		threadId,
		messages: threadMessages,
		typing: typing?.senderType === 'agent' ? 'Support' : null,
		hasMore: threadId ? hasMore.get(threadId) ?? false : false,
		isLoadingMore: threadId ? loadingMessages.get(threadId) ?? false : false,
		send,
		handleTyping,
		loadMore,
		startNewChat,
	};
}
