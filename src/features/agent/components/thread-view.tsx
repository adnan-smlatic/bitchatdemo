'use client';

import { useState } from 'react';
import {
	ArrowLeft,
	CheckCircle2,
	RotateCcw,
	Clock,
	MessageSquare,
	Star,
	MessageCircle,
	StickyNote,
	CircleDot,
} from 'lucide-react';
import type { Message, ThreadWithLastMessage } from '@/types';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/shared/components/error-boundary';
import { api } from '@/shared/lib/api-client';
import { useChatStore } from '@/stores/chat-store';
import { formatRelativeDate } from '@/shared/lib/dates';
import { cn } from '@/shared/lib/utils';

interface ThreadViewProps {
	thread: ThreadWithLastMessage;
	messages: Message[];
	agentId: string;
	hasMore: boolean;
	isLoadingMore: boolean;
	onLoadMore: () => void;
	onSend: (content: string) => void;
	onTyping: () => void;
	typingName: string | null;
	onBack?: () => void;
}

function ThreadView({
	thread,
	messages,
	agentId,
	hasMore,
	isLoadingMore,
	onLoadMore,
	onSend,
	onTyping,
	typingName,
	onBack,
}: ThreadViewProps) {
	const retryMessage = useChatStore((s) => s.retryMessage);
	const [agentNotes, setAgentNotes] = useState('');

	const handleResolve = async () => {
		await api.patch(`/api/threads/${thread.id}`, {
			status: 'resolved',
			resolution: {
				resolvedBy: agentId,
				resolvedAt: new Date().toISOString(),
				agentNotes: agentNotes || null,
			},
		});
		setAgentNotes('');
	};

	const handleReopen = async () => {
		await api.patch(`/api/threads/${thread.id}`, { status: 'open' });
	};

	const statusBadge =
		thread.status === 'open' ? 'blue' as const :
		thread.status === 'resolved' ? 'green' as const :
		'default' as const;

	const initials = thread.visitorName
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);

	return (
		<div className="flex h-full w-full">
			{/* Chat area */}
			<div className="flex min-w-0 flex-1 flex-col">
				{/* Header */}
				<div className="flex h-12 shrink-0 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
					<div className="flex items-center gap-3">
						{onBack && (
							<button
								onClick={onBack}
								aria-label="Back to inbox"
								className="mr-1 flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 lg:hidden dark:text-neutral-400 dark:hover:bg-neutral-800"
							>
								<ArrowLeft className="h-4 w-4" />
							</button>
						)}
						<div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
							{initials}
						</div>
						<div>
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium text-neutral-900 dark:text-white">
									{thread.visitorName}
								</span>
								<Badge variant={statusBadge}>{thread.status}</Badge>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						{thread.status === 'open' && (
							<button
								onClick={handleResolve}

								className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
							>
								<CheckCircle2 className="h-3.5 w-3.5" />
								Resolve
							</button>
						)}
						{thread.status === 'resolved' && (
							<button
								onClick={handleReopen}

								className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
							>
								<RotateCcw className="h-3.5 w-3.5" />
								Reopen
							</button>
						)}
					</div>
				</div>

				{/* Messages */}
				<ErrorBoundary>
					<MessageList
						messages={messages}
						currentUserId={agentId}
						hasMore={hasMore}
						isLoadingMore={isLoadingMore}
						onLoadMore={onLoadMore}
						onRetry={retryMessage}
						typingName={typingName}
					/>
				</ErrorBoundary>

				{/* Input */}
				{thread.status !== 'closed' ? (
					<MessageInput onSend={onSend} onTyping={onTyping} placeholder="Type a reply..." />
				) : (
					<div className="border-t border-neutral-200 px-4 py-3 text-center text-xs text-neutral-400 dark:border-neutral-800">
						This conversation is closed
					</div>
				)}
			</div>

			{/* Detail sidebar */}
			<div className="hidden w-[260px] shrink-0 overflow-y-auto border-l border-neutral-200 lg:block dark:border-neutral-800">
				<div className="p-4">
					{/* Visitor info */}
					<div className="mb-5 flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
							{initials}
						</div>
						<div>
							<p className="text-sm font-medium text-neutral-900 dark:text-white">{thread.visitorName}</p>
							<p className="text-[11px] text-neutral-400 dark:text-neutral-500">
								Started {formatRelativeDate(thread.createdAt)}
							</p>
						</div>
					</div>

					{/* Ticket status section */}
					<div className="mb-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
						<div className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
							<h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
								Ticket Status
							</h4>
						</div>
						<div className="p-3 space-y-2.5">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
									<CircleDot className="h-3.5 w-3.5" />
									<span>Status</span>
								</div>
								<Badge variant={statusBadge}>{thread.status}</Badge>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
									<MessageSquare className="h-3.5 w-3.5" />
									<span>Messages</span>
								</div>
								<span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{messages.length}</span>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
									<Clock className="h-3.5 w-3.5" />
									<span>Created</span>
								</div>
								<span className="text-xs text-neutral-600 dark:text-neutral-300">{formatRelativeDate(thread.createdAt)}</span>
							</div>
						</div>
					</div>

					{/* Resolution info */}
					{thread.resolution && (thread.status === 'resolved' || thread.status === 'closed') && (
						<div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30">
							<div className="border-b border-emerald-100 px-3 py-2 dark:border-emerald-900">
								<h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
									<CheckCircle2 className="h-3 w-3" />
									Resolution
								</h4>
							</div>
							<div className="space-y-2.5 p-3">
								{thread.resolution.resolvedAt && (
									<div className="flex items-center justify-between">
										<span className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70">Resolved</span>
										<span className="text-xs text-emerald-700 dark:text-emerald-300">
											{formatRelativeDate(thread.resolution.resolvedAt)}
										</span>
									</div>
								)}
								{thread.resolution.rating && (
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-1.5 text-[11px] text-emerald-600/70 dark:text-emerald-400/70">
											<Star className="h-3 w-3" />
											Rating
										</div>
										<div className="flex items-center gap-0.5">
											{[1, 2, 3, 4, 5].map((s) => (
												<Star
													key={s}
													className={cn(
														'h-3 w-3',
														s <= (thread.resolution?.rating ?? 0)
															? 'fill-amber-400 text-amber-400'
															: 'text-neutral-200 dark:text-neutral-700'
													)}
												/>
											))}
										</div>
									</div>
								)}
								{thread.resolution.visitorComment && (
									<div>
										<div className="mb-1 flex items-center gap-1.5 text-[11px] text-emerald-600/70 dark:text-emerald-400/70">
											<MessageCircle className="h-3 w-3" />
											Visitor feedback
										</div>
										<p className="rounded-md bg-white/60 px-2 py-1.5 text-xs leading-relaxed text-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-300">
											{thread.resolution.visitorComment}
										</p>
									</div>
								)}
								{thread.resolution.agentNotes && (
									<div>
										<div className="mb-1 flex items-center gap-1.5 text-[11px] text-emerald-600/70 dark:text-emerald-400/70">
											<StickyNote className="h-3 w-3" />
											Agent notes
										</div>
										<p className="rounded-md bg-white/60 px-2 py-1.5 text-xs leading-relaxed text-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-300">
											{thread.resolution.agentNotes}
										</p>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Reopened indicator */}
					{thread.status === 'open' && thread.resolution?.resolvedAt && (
						<div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30">
							<div className="flex items-center gap-2 px-3 py-2.5">
								<RotateCcw className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
								<span className="text-xs font-medium text-amber-700 dark:text-amber-300">
									Previously resolved, reopened
								</span>
							</div>
						</div>
					)}

					{/* Agent notes input */}
					{thread.status === 'open' && (
						<div className="rounded-lg border border-neutral-200 dark:border-neutral-800">
							<div className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
								<label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
									<StickyNote className="h-3 w-3" />
									Notes
								</label>
							</div>
							<div className="p-3">
								<textarea
									value={agentNotes}
									onChange={(e) => setAgentNotes(e.target.value)}
									placeholder="Add notes before resolving..."
									className="w-full resize-none rounded-md border border-neutral-200 bg-white p-2 text-xs leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
									rows={3}
								/>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export { ThreadView };
