import { cn } from '@/shared/lib/utils';

interface TypingIndicatorProps {
	name?: string;
	className?: string;
}

function TypingIndicator({ name, className }: TypingIndicatorProps) {
	return (
		<div
			className={cn('flex items-center gap-2 px-4 py-2', className)}
			aria-live="polite"
			aria-label={name ? `${name} is typing` : 'Someone is typing'}
		>
			<div className="flex items-center gap-1 rounded-2xl bg-neutral-100 px-3 py-2 dark:bg-neutral-800">
				<span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-[typing-dot_1s_ease-in-out_infinite] dark:bg-neutral-500" />
				<span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-[typing-dot_1s_ease-in-out_0.15s_infinite] dark:bg-neutral-500" />
				<span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-[typing-dot_1s_ease-in-out_0.3s_infinite] dark:bg-neutral-500" />
			</div>
			{name && (
				<span className="text-[11px] text-neutral-400 dark:text-neutral-500">
					{name} is typing
				</span>
			)}
		</div>
	);
}

export { TypingIndicator };
