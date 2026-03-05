import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, ...props }, ref) => {
		return (
			<input
				ref={ref}
				className={cn(
					'flex h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 shadow-sm transition-colors',
					'placeholder:text-neutral-400',
					'focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
					'disabled:cursor-not-allowed disabled:opacity-50',
					'dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-blue-600 dark:focus:ring-blue-500/30',
					className
				)}
				{...props}
			/>
		);
	}
);

Input.displayName = 'Input';

export { Input };
