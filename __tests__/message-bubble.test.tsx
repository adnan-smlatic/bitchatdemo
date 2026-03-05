import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '@/components/chat/message-bubble';
import type { Message } from '@/types';

function makeMessage(overrides: Partial<Message> = {}): Message {
	return {
		id: 'msg-1',
		threadId: 'thread-1',
		senderType: 'visitor',
		senderId: 'visitor-1',
		content: 'Hello world',
		messageType: 'text',
		metadata: null,
		status: 'sent',
		createdAt: '2025-01-01T12:00:00Z',
		readAt: null,
		...overrides,
	};
}

describe('MessageBubble', () => {
	it('renders message content', () => {
		render(<MessageBubble message={makeMessage()} isOwn={false} />);
		expect(screen.getByText('Hello world')).toBeDefined();
	});

	it('renders system messages as centered pills', () => {
		const msg = makeMessage({
			senderType: 'system',
			content: 'Conversation resolved',
		});
		render(<MessageBubble message={msg} isOwn={false} />);
		expect(screen.getByText('Conversation resolved')).toBeDefined();
	});

	it('shows delivery status for own messages', () => {
		render(<MessageBubble message={makeMessage({ status: 'sending' })} isOwn={true} />);
		expect(screen.getByLabelText('Message sending')).toBeDefined();
	});

	it('shows retry button for failed own messages', () => {
		const onRetry = () => {};
		render(
			<MessageBubble
				message={makeMessage({ status: 'failed' })}
				isOwn={true}
				onRetry={onRetry}
			/>
		);
		expect(screen.getByText('Retry')).toBeDefined();
	});
});
