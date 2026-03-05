import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/shared/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
	size?: 'xs' | 'sm' | 'md' | 'icon';
	asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant = 'primary', size = 'md', asChild, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button';

		return (
			<Comp
				ref={ref}
				className={cn(
					'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-150',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1',
					'disabled:pointer-events-none disabled:opacity-40',
					'cursor-pointer',
					variant === 'primary' && 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:bg-blue-800',
					variant === 'secondary' && 'border border-neutral-200 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50 active:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-750 dark:active:bg-neutral-700',
					variant === 'ghost' && 'text-neutral-600 hover:bg-neutral-100 active:bg-neutral-150 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:active:bg-neutral-750',
					variant === 'danger' && 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800',
					size === 'xs' && 'h-6 px-2 text-[11px]',
					size === 'sm' && 'h-8 px-3 text-xs',
					size === 'md' && 'h-9 px-4 text-sm',
					size === 'icon' && 'h-8 w-8 text-sm',
					className
				)}
				{...props}
			/>
		);
	}
);

Button.displayName = 'Button';

export { Button, type ButtonProps };
