'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Message } from '@/types';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';

interface MessageListProps {
	messages: Message[];
	currentUserId: string;
	hasMore: boolean;
	isLoadingMore: boolean;
	onLoadMore: () => void;
	onRetry?: (message: Message) => void;
	typingName?: string | null;
}

function MessageList({
	messages,
	currentUserId,
	hasMore,
	isLoadingMore,
	onLoadMore,
	onRetry,
	typingName,
}: MessageListProps) {
	const parentRef = useRef<HTMLDivElement>(null);
	const prevMessageCount = useRef(messages.length);
	const isAtBottomRef = useRef(true);

	const virtualizer = useVirtualizer({
		count: messages.length,
		getScrollElement: () => parentRef.current,
		estimateSize: (index) => {
			const msg = messages[index];
			if (msg.senderType === 'system') return 40;
			// Rough estimate: base height + content length factor
			return 60 + Math.ceil(msg.content.length / 40) * 20;
		},
		overscan: 10,
	});

	// Scroll to bottom on new messages if user was already at bottom
	useEffect(() => {
		if (messages.length > prevMessageCount.current && isAtBottomRef.current) {
			requestAnimationFrame(() => {
				virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
			});
		}
		prevMessageCount.current = messages.length;
	}, [messages.length, virtualizer]);

	// Initial scroll to bottom
	useEffect(() => {
		if (messages.length > 0) {
			virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
		}
		// Only on initial mount/thread switch
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Track if user is at bottom
	const handleScroll = useCallback(() => {
		const el = parentRef.current;
		if (!el) return;

		const { scrollTop, scrollHeight, clientHeight } = el;
		isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;

		// Load more when scrolling to top
		if (scrollTop < 50 && hasMore && !isLoadingMore) {
			onLoadMore();
		}
	}, [hasMore, isLoadingMore, onLoadMore]);

	const items = virtualizer.getVirtualItems();

	return (
		<div
			ref={parentRef}
			className="flex-1 overflow-auto"
			onScroll={handleScroll}
			role="log"
			aria-live="polite"
			aria-label="Message history"
		>
			{isLoadingMore && (
				<div className="flex justify-center py-2">
					<span className="text-xs text-neutral-400">Loading older messages...</span>
				</div>
			)}

			<div
				style={{
					height: `${virtualizer.getTotalSize()}px`,
					width: '100%',
					position: 'relative',
				}}
			>
				{items.map((virtualRow) => {
					const message = messages[virtualRow.index];
					return (
						<div
							key={virtualRow.key}
							data-index={virtualRow.index}
							ref={virtualizer.measureElement}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								transform: `translateY(${virtualRow.start}px)`,
							}}
						>
							<div className="px-4 py-1">
								<MessageBubble
									message={message}
									isOwn={message.senderId === currentUserId}
									onRetry={onRetry}
								/>
							</div>
						</div>
					);
				})}
			</div>

			{typingName && (
				<TypingIndicator name={typingName} />
			)}
		</div>
	);
}

export { MessageList };
