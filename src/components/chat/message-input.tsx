'use client';

import { useState, useRef, useCallback, type KeyboardEvent } from 'react';
import { SendHorizonal } from 'lucide-react';

interface MessageInputProps {
	onSend: (content: string) => void;
	onTyping?: () => void;
	disabled?: boolean;
	placeholder?: string;
}

function MessageInput({
	onSend,
	onTyping,
	disabled = false,
	placeholder = 'Type a message...',
}: MessageInputProps) {
	const [value, setValue] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);

	const handleSend = useCallback(() => {
		const trimmed = value.trim();
		if (!trimmed) return;
		onSend(trimmed);
		setValue('');
		inputRef.current?.focus();
	}, [value, onSend]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLInputElement>) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				handleSend();
			}
		},
		[handleSend]
	);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setValue(e.target.value);
			onTyping?.();
		},
		[onTyping]
	);

	return (
		<div className="flex items-center gap-2 border-t border-neutral-100 px-3 py-2.5 dark:border-neutral-800">
			<input
				ref={inputRef}
				value={value}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				disabled={disabled}
				aria-label="Message input"
				className="flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed dark:text-neutral-100 dark:placeholder:text-neutral-500"
			/>
			<button
				onClick={handleSend}
				disabled={disabled || !value.trim()}
				aria-label="Send message"
				className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-all hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600"
			>
				<SendHorizonal className="h-3.5 w-3.5" />
			</button>
		</div>
	);
}

export { MessageInput };
