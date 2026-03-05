'use client';

import { useRef, useCallback, useEffect } from 'react';

interface UseAutoScrollOptions {
	dependency: unknown;
	threshold?: number;
}

export function useAutoScroll({ dependency, threshold = 100 }: UseAutoScrollOptions) {
	const containerRef = useRef<HTMLDivElement>(null);
	const shouldAutoScroll = useRef(true);

	const checkShouldAutoScroll = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;

		const { scrollTop, scrollHeight, clientHeight } = container;
		shouldAutoScroll.current =
			scrollHeight - scrollTop - clientHeight < threshold;
	}, [threshold]);

	const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
		const container = containerRef.current;
		if (!container) return;

		container.scrollTo({
			top: container.scrollHeight,
			behavior,
		});
	}, []);

	useEffect(() => {
		if (shouldAutoScroll.current) {
			scrollToBottom();
		}
	}, [dependency, scrollToBottom]);

	return {
		containerRef,
		scrollToBottom,
		onScroll: checkShouldAutoScroll,
	};
}
