'use client';

import { useState, useCallback } from 'react';
import * as Popover from '@radix-ui/react-popover';
import {
	MessageSquare,
	X,
	Star,
	Check,
	Send,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { useVisitorChat } from '../hooks/use-visitor-chat';
import { ErrorBoundary } from '@/shared/components/error-boundary';
import { api } from '@/shared/lib/api-client';
import { useChatStore } from '@/stores/chat-store';

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
	return (
		<div className="flex gap-1">
			{[1, 2, 3, 4, 5].map((star) => (
				<button
					key={star}
					type="button"
					onClick={() => onChange(star)}
					className="transition-transform hover:scale-110"
					aria-label={`${star} star${star > 1 ? 's' : ''}`}
				>
					<Star
						className={cn(
							'h-7 w-7 transition-colors',
							star <= value
								? 'fill-amber-400 text-amber-400'
								: 'text-neutral-200 dark:text-neutral-700'
						)}
					/>
				</button>
			))}
		</div>
	);
}

function RatingPanel({ threadId, onDone }: { threadId: string; onDone: () => void }) {
	const [rating, setRating] = useState(0);
	const [comment, setComment] = useState('');
	const [submitted, setSubmitted] = useState(false);

	const handleSubmit = async () => {
		await api.patch(`/api/threads/${threadId}`, {
			status: 'closed',
			resolution: { rating, visitorComment: comment || null },
		});
		setSubmitted(true);
	};

	if (submitted) {
		return (
			<div className="flex flex-col items-center gap-2 border-t border-neutral-100 p-6 text-center dark:border-neutral-800">
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
					<Check className="h-4 w-4" />
				</div>
				<p className="text-sm font-medium text-neutral-900 dark:text-white">Thanks for your feedback!</p>
				<button onClick={onDone} className="mt-1 text-xs text-blue-600 hover:underline dark:text-blue-400">Close</button>
			</div>
		);
	}

	return (
		<div className="border-t border-neutral-100 p-4 dark:border-neutral-800">
			<p className="mb-3 text-[13px] font-medium text-neutral-900 dark:text-white">How was your experience?</p>
			<div className="mb-3">
				<StarRating value={rating} onChange={setRating} />
			</div>
			<textarea
				value={comment}
				onChange={(e) => setComment(e.target.value)}
				placeholder="Any feedback? (optional)"
				className="mb-3 w-full resize-none rounded-lg border border-neutral-200 bg-white p-2.5 text-xs leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
				rows={2}
			/>
			<div className="flex gap-2">
				<button
					onClick={handleSubmit}
					disabled={rating === 0}
					className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
				>
					Submit feedback
				</button>
				<button onClick={onDone} className="rounded-lg px-3 py-2 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800">
					Skip
				</button>
			</div>
		</div>
	);
}

function ChatWidget() {
	const [open, setOpen] = useState(false);
	const [showRating, setShowRating] = useState(false);
	const {
		visitorId,
		thread,
		threadId,
		messages,
		typing,
		hasMore,
		isLoadingMore,
		send,
		handleTyping,
		loadMore,
		startNewChat,
	} = useVisitorChat();

	const retryMessage = useChatStore((s) => s.retryMessage);

	const isResolved = thread?.status === 'resolved';
	const isClosed = thread?.status === 'closed';

	const handleEndChat = useCallback(async () => {
		if (!threadId) return;
		await api.patch(`/api/threads/${threadId}`, { status: 'resolved' });
		setShowRating(true);
	}, [threadId]);

	return (
		<Popover.Root open={open} onOpenChange={setOpen}>
			<Popover.Trigger asChild>
				<button
					className={cn(
						'fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200',
						'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 hover:shadow-xl',
						'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2'
					)}
					aria-label={open ? 'Close chat' : 'Open chat support'}
				>
					{open ? (
						<X className="h-5 w-5" />
					) : (
						<MessageSquare className="h-5 w-5" />
					)}
				</button>
			</Popover.Trigger>

			<Popover.Portal>
				<Popover.Content
					side="top"
					align="end"
					sideOffset={12}
					className={cn(
						'z-50 flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl',
						'h-[min(480px,calc(100vh-120px))] w-[min(360px,calc(100vw-40px))]',
						'dark:border-neutral-800 dark:bg-neutral-900',
						'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-3 data-[state=open]:duration-200',
						'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-3 data-[state=closed]:duration-150'
					)}
				>
					{/* Header */}
					<div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
						<div className="flex items-center gap-2.5">
							<div className="relative">
								<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
									<MessageSquare className="h-4 w-4 text-white" />
								</div>
								<div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-neutral-900" />
							</div>
							<div>
								<h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Support</h3>
								<p className="text-[11px] text-neutral-500 dark:text-neutral-400">
									{isResolved ? 'Conversation resolved' : isClosed ? 'Conversation closed' : 'Online — replies in minutes'}
								</p>
							</div>
						</div>

						{thread && thread.status === 'open' && messages.length > 0 && (
							<button
								onClick={handleEndChat}
								className="rounded-md px-2 py-1 text-[11px] text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
							>
								End chat
							</button>
						)}
					</div>

					{/* Body */}
					<ErrorBoundary>
						{messages.length > 0 ? (
							<MessageList
								messages={messages}
								currentUserId={visitorId}
								hasMore={hasMore}
								isLoadingMore={isLoadingMore}
								onLoadMore={loadMore}
								onRetry={retryMessage}
								typingName={typing}
							/>
						) : (
							<div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
								<div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
									<MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								</div>
								<div>
									<p className="text-sm font-medium text-neutral-900 dark:text-white">Hey there!</p>
									<p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
										Have a question? Send us a message<br />and we&#39;ll get back to you quickly.
									</p>
								</div>
							</div>
						)}
					</ErrorBoundary>

					{/* Resolution prompt */}
					{isResolved && !isClosed && !showRating && (
						<div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
							<span className="text-xs text-neutral-500 dark:text-neutral-400">Conversation resolved</span>
							<div className="flex gap-2">
								<button
									onClick={startNewChat}
									className="rounded-md px-2.5 py-1.5 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
								>
									New chat
								</button>
								<button
									onClick={() => setShowRating(true)}
									className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
								>
									Rate experience
								</button>
							</div>
						</div>
					)}

					{showRating && threadId && (
						<RatingPanel threadId={threadId} onDone={() => setShowRating(false)} />
					)}

					{/* Input */}
					{!isResolved && !isClosed && !showRating && (
						<MessageInput onSend={send} onTyping={handleTyping} placeholder="Type a message..." />
					)}

					{isClosed && !showRating && (
						<div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
							<span className="text-xs text-neutral-400">This conversation has ended</span>
							<button
								onClick={startNewChat}
								className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
							>
								New chat
							</button>
						</div>
					)}
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}

export { ChatWidget };
