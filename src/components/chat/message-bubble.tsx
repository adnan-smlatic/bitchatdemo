import type { Message } from '@/types';
import { cn } from '@/shared/lib/utils';
import { formatMessageTime } from '@/shared/lib/dates';
import { DeliveryStatus } from './delivery-status';
import { Button } from '@/components/ui/button';

interface MessageBubbleProps {
	message: Message;
	isOwn: boolean;
	onRetry?: (message: Message) => void;
}

function MessageBubble({ message, isOwn, onRetry }: MessageBubbleProps) {
	if (message.senderType === 'system') {
		return (
			<div className="flex justify-center py-1.5">
				<span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500">
					{message.content}
				</span>
			</div>
		);
	}

	return (
		<div
			className={cn(
				'flex flex-col gap-0.5',
				isOwn ? 'items-end' : 'items-start'
			)}
		>
			<div
				className={cn(
					'max-w-[75%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed',
					isOwn
						? 'bg-blue-600 text-white'
						: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
				)}
			>
				{message.content}
			</div>
			<div className="flex items-center gap-1 px-1">
				<span className="text-[10px] text-neutral-400 dark:text-neutral-500">
					{formatMessageTime(message.createdAt)}
				</span>
				{isOwn && <DeliveryStatus status={message.status} readAt={message.readAt} />}
				{message.status === 'failed' && onRetry && (
					<Button
						variant="ghost"
						size="xs"
						className="h-4 px-1 text-[10px] text-red-500"
						onClick={() => onRetry(message)}
						aria-label="Retry sending message"
					>
						Retry
					</Button>
				)}
			</div>
		</div>
	);
}

export { MessageBubble };
