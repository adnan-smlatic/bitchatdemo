'use client';

import { MessageSquare } from 'lucide-react';
import { useAgentInbox } from '@/features/agent/hooks/use-agent-inbox';
import { InboxList } from '@/features/agent/components/inbox-list';
import { ThreadView } from '@/features/agent/components/thread-view';
import { ThemeToggle } from '@/shared/components/theme-toggle';
import { ErrorBoundary } from '@/shared/components/error-boundary';
import { APP_NAME } from '@/shared/lib/constants';

export default function AgentPage() {
	const {
		agentId,
		threads,
		selectedThread,
		selectedThreadId,
		messages,
		typing,
		hasMore,
		isLoadingMore,
		loadingThreads,
		sortMode,
		setSortMode,
		selectThread,
		send,
		handleTyping,
		loadMore,
	} = useAgentInbox();

	const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);
	const openCount = threads.filter((t) => t.status === 'open').length;
	const resolvedCount = threads.filter((t) => t.status === 'resolved' || t.status === 'closed').length;

	return (
		<div className="flex h-dvh flex-col bg-white dark:bg-neutral-950">
			{/* Top bar */}
			<header className="flex h-12 shrink-0 items-center justify-between border-b border-neutral-200 px-3 sm:px-4 dark:border-neutral-800">
				<div className="flex items-center gap-2.5">
					<div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-[10px] font-bold text-white">
						B
					</div>
					<span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
						{APP_NAME}
					</span>
					<span className="hidden text-xs text-neutral-400 sm:inline dark:text-neutral-500">Agent</span>
				</div>

				<div className="flex items-center gap-3 sm:gap-4">
					{/* Stats */}
					<div className="flex items-center gap-2 text-[11px] sm:gap-3">
						<span className="text-neutral-500 dark:text-neutral-400">
							<span className="font-medium text-neutral-900 dark:text-neutral-100">{openCount}</span> open
						</span>
						<span className="hidden text-neutral-300 sm:inline dark:text-neutral-700">|</span>
						<span className="hidden text-neutral-500 sm:inline dark:text-neutral-400">
							<span className="font-medium text-neutral-900 dark:text-neutral-100">{resolvedCount}</span> resolved
						</span>
						{totalUnread > 0 && (
							<>
								<span className="text-neutral-300 dark:text-neutral-700">|</span>
								<span className="text-blue-600 dark:text-blue-400">
									<span className="font-medium">{totalUnread}</span> unread
								</span>
							</>
						)}
					</div>
					<ThemeToggle />
				</div>
			</header>

			{/* Main */}
			<div className="flex flex-1 overflow-hidden">
				{/* Inbox — full width on mobile when no thread selected, hidden when thread selected */}
				<div
					className={`w-full shrink-0 border-r border-neutral-200 dark:border-neutral-800 lg:w-[340px] ${selectedThread ? 'hidden lg:block' : ''}`}
				>
					<ErrorBoundary>
						<InboxList
							threads={threads}
							selectedThreadId={selectedThreadId}
							sortMode={sortMode}
							onSortChange={setSortMode}
							onSelectThread={selectThread}
							loading={loadingThreads}
						/>
					</ErrorBoundary>
				</div>

				{/* Thread — full width on mobile when selected, hidden when no thread */}
				<div className={`min-w-0 flex-1 ${!selectedThread ? 'hidden lg:flex' : 'flex'}`}>
					{selectedThread ? (
						<ErrorBoundary>
							<ThreadView
								thread={selectedThread}
								messages={messages}
								agentId={agentId}
								hasMore={hasMore}
								isLoadingMore={isLoadingMore}
								onLoadMore={loadMore}
								onSend={send}
								onTyping={handleTyping}
								typingName={typing}
								onBack={() => selectThread('')}
							/>
						</ErrorBoundary>
					) : (
						<div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
								<MessageSquare className="h-5 w-5 text-neutral-400" />
							</div>
							<div>
								<p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
									Select a conversation
								</p>
								<p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
									{threads.length} conversation{threads.length !== 1 ? 's' : ''} in inbox
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
