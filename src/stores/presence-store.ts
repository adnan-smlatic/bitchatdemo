import { create } from 'zustand';
import { api } from '@/shared/lib/api-client';
import { TYPING_DEBOUNCE_MS, TYPING_TIMEOUT_MS } from '@/shared/lib/constants';
import type { SenderType } from '@/types';

interface TypingState {
	senderId: string;
	senderType: SenderType;
}

interface PresenceState {
	typingByThread: Map<string, TypingState | null>;
	typingTimeouts: Map<string, ReturnType<typeof setTimeout>>;
	lastTypingSent: Map<string, number>;

	setTyping: (threadId: string, typing: TypingState | null) => void;
	clearTyping: (threadId: string) => void;
	sendTypingIndicator: (
		threadId: string,
		senderId: string,
		senderType: Exclude<SenderType, 'system'>,
		isTyping: boolean
	) => void;
	handleTypingInput: (
		threadId: string,
		senderId: string,
		senderType: Exclude<SenderType, 'system'>
	) => void;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
	typingByThread: new Map(),
	typingTimeouts: new Map(),
	lastTypingSent: new Map(),

	setTyping: (threadId, typing) => {
		const { typingByThread, typingTimeouts } = get();

		// Clear existing timeout
		const existingTimeout = typingTimeouts.get(threadId);
		if (existingTimeout) {
			clearTimeout(existingTimeout);
		}

		const newTyping = new Map(typingByThread);
		newTyping.set(threadId, typing);

		const newTimeouts = new Map(typingTimeouts);

		if (typing) {
			// Auto-clear typing after timeout
			const timeout = setTimeout(() => {
				get().clearTyping(threadId);
			}, TYPING_TIMEOUT_MS);
			newTimeouts.set(threadId, timeout);
		} else {
			newTimeouts.delete(threadId);
		}

		set({ typingByThread: newTyping, typingTimeouts: newTimeouts });
	},

	clearTyping: (threadId) => {
		const { typingByThread, typingTimeouts } = get();
		const timeout = typingTimeouts.get(threadId);
		if (timeout) clearTimeout(timeout);

		const newTyping = new Map(typingByThread);
		newTyping.set(threadId, null);

		const newTimeouts = new Map(typingTimeouts);
		newTimeouts.delete(threadId);

		set({ typingByThread: newTyping, typingTimeouts: newTimeouts });
	},

	sendTypingIndicator: (threadId, senderId, senderType, isTyping) => {
		api.post('/api/typing', { threadId, senderId, senderType, isTyping });
	},

	handleTypingInput: (threadId, senderId, senderType) => {
		const { lastTypingSent, sendTypingIndicator } = get();
		const now = Date.now();
		const lastSent = lastTypingSent.get(threadId) ?? 0;

		// Debounce: only send if enough time has passed
		if (now - lastSent > TYPING_DEBOUNCE_MS) {
			sendTypingIndicator(threadId, senderId, senderType, true);

			const newLastSent = new Map(lastTypingSent);
			newLastSent.set(threadId, now);
			set({ lastTypingSent: newLastSent });
		}
	},
}));
