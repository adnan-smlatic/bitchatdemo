import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import type { MessageStatus } from '@/types';
import { cn } from '@/shared/lib/utils';

interface DeliveryStatusProps {
	status: MessageStatus;
	readAt?: string | null;
	className?: string;
}

function DeliveryStatus({ status, readAt, className }: DeliveryStatusProps) {
	const isRead = !!readAt;

	return (
		<span className={cn('inline-flex items-center', className)} aria-label={`Message ${isRead ? 'read' : status}`}>
			{status === 'sending' && (
				<Clock className="h-3 w-3 animate-pulse text-neutral-300 dark:text-neutral-600" />
			)}
			{status === 'sent' && !isRead && (
				<Check className="h-3 w-3 text-neutral-400 dark:text-neutral-500" />
			)}
			{status === 'delivered' && !isRead && (
				<CheckCheck className="h-3 w-3 text-neutral-400 dark:text-neutral-500" />
			)}
			{(status === 'sent' || status === 'delivered') && isRead && (
				<CheckCheck className="h-3 w-3 text-blue-500" />
			)}
			{status === 'failed' && (
				<AlertCircle className="h-3 w-3 text-red-400" />
			)}
		</span>
	);
}

export { DeliveryStatus };
