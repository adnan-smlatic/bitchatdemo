'use client';

import type { ThreadWithLastMessage } from '@/types';
import { InboxItem } from './inbox-item';
import { cn } from '@/shared/lib/utils';

type SortMode = 'recent' | 'unread';

interface InboxListProps {
	threads: ThreadWithLastMessage[];
	selectedThreadId: string | null;
	sortMode: SortMode;
	onSortChange: (mode: SortMode) => void;
	onSelectThread: (threadId: string) => void;
	loading: boolean;
}

function InboxList({
	threads,
	selectedThreadId,
	sortMode,
	onSortChange,
	onSelectThread,
	loading,
}: InboxListProps) {
	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between px-3 py-2.5">
				<h2 className="text-[13px] font-semibold text-neutral-900 dark:text-white">
					Conversations
				</h2>
				<div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700">
					{(['recent', 'unread'] as const).map((mode) => (
						<button
							key={mode}
							onClick={() => onSortChange(mode)}
							className={cn(
								'px-2.5 py-1 text-[11px] font-medium capitalize transition-colors first:rounded-l-[7px] last:rounded-r-[7px]',
								sortMode === mode
									? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
									: 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
							)}
							aria-label={`Sort by ${mode}`}
							aria-pressed={sortMode === mode}
						>
							{mode}
						</button>
					))}
				</div>
			</div>

			{/* List */}
			<nav className="flex-1 overflow-y-auto" role="listbox" aria-label="Conversations">
				{loading && threads.length === 0 ? (
					<div className="flex items-center justify-center py-16 text-xs text-neutral-400">
						Loading conversations...
					</div>
				) : threads.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
						<svg className="h-8 w-8 text-neutral-200 dark:text-neutral-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
							<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
						</svg>
						<span className="text-xs text-neutral-400">No conversations yet</span>
					</div>
				) : (
					threads.map((thread) => (
						<div key={thread.id} role="option" aria-selected={thread.id === selectedThreadId}>
							<InboxItem
								thread={thread}
								isSelected={thread.id === selectedThreadId}
								onSelect={onSelectThread}
							/>
						</div>
					))
				)}
			</nav>
		</div>
	);
}

export { InboxList };
