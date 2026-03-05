'use client';

import { useEffect, useRef, useCallback } from 'react';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface SSEOptions {
	url: string;
	onEvent: (event: string, data: unknown) => void;
	enabled?: boolean;
}

export function useSSE({ url, onEvent, enabled = true }: SSEOptions) {
	const eventSourceRef = useRef<EventSource | null>(null);
	const onEventRef = useRef(onEvent);
	onEventRef.current = onEvent;

	const connect = useCallback(() => {
		if (!enabled) return;

		const es = new EventSource(`${basePath}${url}`);
		eventSourceRef.current = es;

		const handler = (e: MessageEvent) => {
			try {
				const data: unknown = JSON.parse(e.data as string);
				onEventRef.current(e.type, data);
			} catch {
				// Invalid JSON, ignore
			}
		};

		es.addEventListener('message', handler);
		es.addEventListener('connected', handler);
		es.addEventListener('typing', handler);
		es.addEventListener('thread-status', handler);
		es.addEventListener('messages-read', handler);
		es.addEventListener('new-message', handler);
		es.addEventListener('thread-update', handler);

		es.onerror = () => {
			// EventSource auto-reconnects, but we close if it's in CLOSED state
			if (es.readyState === EventSource.CLOSED) {
				es.close();
			}
		};

		return es;
	}, [url, enabled]);

	useEffect(() => {
		const es = connect();
		return () => {
			es?.close();
		};
	}, [connect]);

	return {
		close: () => {
			eventSourceRef.current?.close();
		},
	};
}
