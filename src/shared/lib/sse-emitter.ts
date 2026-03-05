import { SSE_HEARTBEAT_MS } from './constants';

type Controller = ReadableStreamDefaultController<Uint8Array>;

// Use globalThis to survive Next.js module isolation in dev mode (Turbopack).
// Without this, different route handlers get separate module instances,
// so publish() can never reach subscribers from subscribe().
const GLOBAL_KEY = Symbol.for('sse-channels');

type GlobalWithChannels = typeof globalThis & {
	[key: symbol]: Map<string, Set<Controller>>;
};

function getChannels(): Map<string, Set<Controller>> {
	const g = globalThis as GlobalWithChannels;
	if (!g[GLOBAL_KEY]) {
		g[GLOBAL_KEY] = new Map();
	}
	return g[GLOBAL_KEY];
}

function getChannel(name: string): Set<Controller> {
	const channels = getChannels();
	let channel = channels.get(name);
	if (!channel) {
		channel = new Set();
		channels.set(name, channel);
	}
	return channel;
}

function formatSSE(event: string, data: unknown, id?: string): string {
	let output = '';
	if (id) {
		output += `id: ${id}\n`;
	}
	output += `event: ${event}\n`;
	output += `data: ${JSON.stringify(data)}\n\n`;
	return output;
}

export function subscribe(channelName: string, controller: Controller): void {
	const channel = getChannel(channelName);
	channel.add(controller);
}

export function unsubscribe(channelName: string, controller: Controller): void {
	const channels = getChannels();
	const channel = channels.get(channelName);
	if (channel) {
		channel.delete(controller);
		if (channel.size === 0) {
			channels.delete(channelName);
		}
	}
}

export function publish(channelName: string, event: string, data: unknown, id?: string): void {
	const channel = getChannels().get(channelName);
	if (!channel) return;

	const encoded = new TextEncoder().encode(formatSSE(event, data, id));

	for (const controller of channel) {
		try {
			controller.enqueue(encoded);
		} catch {
			channel.delete(controller);
		}
	}
}

export function createSSEStream(channelName: string): ReadableStream<Uint8Array> {
	let controllerRef: Controller;
	let heartbeatInterval: ReturnType<typeof setInterval>;

	return new ReadableStream<Uint8Array>({
		start(controller) {
			controllerRef = controller;
			subscribe(channelName, controller);

			// Send initial connection event
			const connected = new TextEncoder().encode(
				formatSSE('connected', { channel: channelName })
			);
			controller.enqueue(connected);

			// Heartbeat to keep connection alive
			heartbeatInterval = setInterval(() => {
				try {
					const heartbeat = new TextEncoder().encode(': heartbeat\n\n');
					controller.enqueue(heartbeat);
				} catch {
					clearInterval(heartbeatInterval);
				}
			}, SSE_HEARTBEAT_MS);
		},
		cancel() {
			clearInterval(heartbeatInterval);
			unsubscribe(channelName, controllerRef);
		},
	});
}

export function getSSEHeaders(): HeadersInit {
	return {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache, no-transform',
		Connection: 'keep-alive',
	};
}
