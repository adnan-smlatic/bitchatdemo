'use client';

import { useEffect, useCallback, useState } from 'react';
import { useChatStore } from '@/stores/chat-store';
import { usePresenceStore } from '@/stores/presence-store';
import { useSSE } from '@/shared/hooks/use-sse';
import { AGENT_ID, AGENT_NAME } from '@/shared/lib/constants';
import type { Message, ThreadWithLastMessage, TypingEvent } from '@/types';

type SortMode = 'recent' | 'unread';

export function useAgentInbox() {
	const {
		threads,
		messages,
		fetchThreads,
		fetchMessages,
		fetchOlderMessages,
		sendMessage,
		addMessage,
		updateThread,
		markMessagesRead,
		hasMore,
		loadingMessages,
		loadingThreads,
	} = useChatStore();

	const { setTyping, handleTypingInput, typingByThread } = usePresenceStore();

	const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
	const [sortMode, setSortMode] = useState<SortMode>('recent');

	const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null;
	const threadMessages = selectedThreadId
		? messages.get(selectedThreadId) ?? []
		: [];
	const typing = selectedThreadId
		? typingByThread.get(selectedThreadId) ?? null
		: null;

	// SSE for inbox updates — picks up new threads and messages
	useSSE({
		url: '/api/sse/inbox',
		onEvent: useCallback(
			(event: string, data: unknown) => {
				if (event === 'new-message') {
					const payload = data as { threadId: string; message: Message };
					if (payload.message.senderId !== AGENT_ID) {
						addMessage(payload.message);
						// If this is a brand new thread we don't know about, refetch
						const known = useChatStore.getState().threads.some(
							(t) => t.id === payload.threadId
						);
						if (!known) {
							fetchThreads();
						}
					}
				}
				if (event === 'thread-update') {
					const thread = data as ThreadWithLastMessage;
					updateThread(thread);
				}
			},
			[addMessage, updateThread, fetchThreads]
		),
	});

	// SSE for selected thread — typing, messages, status changes
	useSSE({
		url: selectedThreadId ? `/api/sse/${selectedThreadId}` : '',
		enabled: !!selectedThreadId,
		onEvent: useCallback(
			(event: string, data: unknown) => {
				if (event === 'message') {
					const msg = data as Message;
					if (msg.senderId !== AGENT_ID) {
						addMessage(msg);
						// Mark as read immediately since agent has this thread open
						if (selectedThreadId) {
							markMessagesRead(selectedThreadId, 'visitor');
						}
					}
				}
				if (event === 'typing') {
					const typingData = data as TypingEvent;
					if (typingData.senderId !== AGENT_ID && selectedThreadId) {
						setTyping(selectedThreadId, {
							senderId: typingData.senderId,
							senderType: typingData.senderType,
						});
					}
				}
				if (event === 'thread-status') {
					// Refresh to get latest status
					fetchThreads();
					if (selectedThreadId) fetchMessages(selectedThreadId);
				}
				if (event === 'messages-read') {
					// Visitor read our messages — refresh to get readAt timestamps
					if (selectedThreadId) fetchMessages(selectedThreadId);
				}
			},
			[selectedThreadId, addMessage, setTyping, fetchThreads, fetchMessages, markMessagesRead]
		),
	});

	// Initial load
	useEffect(() => {
		fetchThreads();
	}, [fetchThreads]);

	// Periodic refresh to catch new threads (fallback for SSE race conditions)
	useEffect(() => {
		const interval = setInterval(() => {
			fetchThreads();
		}, 10000);
		return () => clearInterval(interval);
	}, [fetchThreads]);

	// Load messages when thread selected
	useEffect(() => {
		if (selectedThreadId) {
			fetchMessages(selectedThreadId);
			markMessagesRead(selectedThreadId, 'visitor');
		}
	}, [selectedThreadId, fetchMessages, markMessagesRead]);

	const sortedThreads = [...threads].sort((a, b) => {
		if (sortMode === 'unread') {
			if (a.unreadCount !== b.unreadCount) {
				return b.unreadCount - a.unreadCount;
			}
		}
		return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
	});

	const send = useCallback(
		async (content: string) => {
			if (!selectedThreadId) return;

			await sendMessage({
				threadId: selectedThreadId,
				senderId: AGENT_ID,
				senderType: 'agent',
				content,
			});
		},
		[selectedThreadId, sendMessage]
	);

	const handleTyping = useCallback(() => {
		if (selectedThreadId) {
			handleTypingInput(selectedThreadId, AGENT_ID, 'agent');
		}
	}, [selectedThreadId, handleTypingInput]);

	const loadMore = useCallback(() => {
		if (selectedThreadId) {
			fetchOlderMessages(selectedThreadId);
		}
	}, [selectedThreadId, fetchOlderMessages]);

	const selectThread = useCallback(
		(threadId: string) => {
			setSelectedThreadId(threadId || null);
			if (threadId) {
				markMessagesRead(threadId, 'visitor');
			}
		},
		[markMessagesRead]
	);

	return {
		agentId: AGENT_ID,
		agentName: AGENT_NAME,
		threads: sortedThreads,
		selectedThread,
		selectedThreadId,
		messages: threadMessages,
		typing: typing?.senderType === 'visitor' ? selectedThread?.visitorName ?? 'Visitor' : null,
		hasMore: selectedThreadId ? hasMore.get(selectedThreadId) ?? false : false,
		isLoadingMore: selectedThreadId ? loadingMessages.get(selectedThreadId) ?? false : false,
		loadingThreads,
		sortMode,
		setSortMode,
		selectThread,
		send,
		handleTyping,
		loadMore,
	};
}
