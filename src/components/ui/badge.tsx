import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: 'default' | 'blue' | 'green' | 'red' | 'yellow';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none',
				variant === 'default' && 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
				variant === 'blue' && 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
				variant === 'green' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
				variant === 'red' && 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
				variant === 'yellow' && 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
				className
			)}
			{...props}
		/>
	);
}

export { Badge, type BadgeProps };
