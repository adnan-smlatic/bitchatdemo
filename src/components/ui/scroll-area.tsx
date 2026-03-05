'use client';

import { forwardRef } from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '@/shared/lib/utils';

const ScrollArea = forwardRef<
	React.ComponentRef<typeof ScrollAreaPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
	<ScrollAreaPrimitive.Root
		ref={ref}
		className={cn('relative overflow-hidden', className)}
		{...props}
	>
		<ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
			{children}
		</ScrollAreaPrimitive.Viewport>
		<ScrollAreaPrimitive.Scrollbar
			orientation="vertical"
			className="flex touch-none select-none p-0.5 transition-colors data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2.5"
		>
			<ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-neutral-200 dark:bg-neutral-700" />
		</ScrollAreaPrimitive.Scrollbar>
	</ScrollAreaPrimitive.Root>
));

ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };
