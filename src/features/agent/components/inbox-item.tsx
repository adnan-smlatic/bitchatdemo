import type { ThreadWithLastMessage } from '@/types';
import { cn } from '@/shared/lib/utils';
import { formatInboxTime } from '@/shared/lib/dates';

interface InboxItemProps {
	thread: ThreadWithLastMessage;
	isSelected: boolean;
	onSelect: (threadId: string) => void;
}

function InboxItem({ thread, isSelected, onSelect }: InboxItemProps) {
	const initials = thread.visitorName
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);

	const statusColor =
		thread.status === 'open' ? 'bg-blue-500' :
		thread.status === 'resolved' ? 'bg-emerald-500' :
		'bg-neutral-400';

	return (
		<button
			onClick={() => onSelect(thread.id)}
			className={cn(
				'flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
				isSelected
					? 'bg-blue-50 dark:bg-blue-950/30'
					: 'hover:bg-neutral-50 dark:hover:bg-neutral-900'
			)}
			aria-label={`${thread.visitorName}${thread.unreadCount > 0 ? `, ${thread.unreadCount} unread` : ''}`}
			aria-current={isSelected ? 'true' : undefined}
		>
			{/* Avatar */}
			<div className="relative shrink-0">
				<div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
					{initials}
				</div>
				<div className={cn('absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-neutral-950', statusColor)} />
			</div>

			{/* Content */}
			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between gap-2">
					<span
						className={cn(
							'truncate text-[13px]',
							thread.unreadCount > 0
								? 'font-semibold text-neutral-900 dark:text-white'
								: 'font-medium text-neutral-700 dark:text-neutral-300'
						)}
					>
						{thread.visitorName}
					</span>
					<div className="flex shrink-0 items-center gap-1.5">
						{thread.lastMessage && (
							<span className="text-[10px] text-neutral-400 dark:text-neutral-500">
								{formatInboxTime(thread.lastMessage.createdAt)}
							</span>
						)}
					</div>
				</div>

				<div className="mt-0.5 flex items-center justify-between gap-2">
					<p
						className={cn(
							'truncate text-xs',
							thread.unreadCount > 0
								? 'text-neutral-600 dark:text-neutral-400'
								: 'text-neutral-400 dark:text-neutral-500'
						)}
					>
						{thread.lastMessage?.content ?? 'No messages yet'}
					</p>
					{thread.unreadCount > 0 && (
						<span className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-medium tabular-nums text-white">
							{thread.unreadCount}
						</span>
					)}
				</div>
			</div>
		</button>
	);
}

export { InboxItem };
