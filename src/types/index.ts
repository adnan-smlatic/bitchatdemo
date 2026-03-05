export type ThreadStatus = 'open' | 'resolved' | 'closed';
export type SenderType = 'visitor' | 'agent' | 'system';
export type MessageType = 'text' | 'image' | 'file' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'failed';

export interface ThreadResolution {
	rating: number | null;
	resolvedBy: string | null;
	resolvedAt: string | null;
	agentNotes: string | null;
	visitorComment: string | null;
}

export interface MessageMetadata {
	fileUrl?: string;
	fileName?: string;
	fileSize?: number;
	mimeType?: string;
	originalLang?: string;
	translatedContent?: string;
}

export interface Thread {
	id: string;
	visitorId: string;
	visitorName: string;
	status: ThreadStatus;
	resolution: ThreadResolution | null;
	createdAt: string;
	updatedAt: string;
}

export interface Message {
	id: string;
	threadId: string;
	senderType: SenderType;
	senderId: string;
	content: string;
	messageType: MessageType;
	metadata: MessageMetadata | null;
	status: MessageStatus;
	createdAt: string;
	readAt: string | null;
}

export interface Participant {
	id: string;
	type: Exclude<SenderType, 'system'>;
	name: string;
	isOnline: boolean;
	lastSeen: string;
}

export interface ThreadWithLastMessage extends Thread {
	lastMessage: Message | null;
	unreadCount: number;
}

export interface SSEEvent {
	event: string;
	data: string;
	id?: string;
}

export interface TypingEvent {
	threadId: string;
	senderId: string;
	senderType: SenderType;
	isTyping: boolean;
}

export interface SendMessagePayload {
	threadId: string;
	senderType: Exclude<SenderType, 'system'>;
	senderId: string;
	content: string;
	messageType?: MessageType;
	metadata?: MessageMetadata;
}

export interface CreateThreadPayload {
	visitorId: string;
	visitorName: string;
}

export interface PaginatedMessages {
	messages: Message[];
	hasMore: boolean;
	nextCursor: string | null;
}

export interface ResolveThreadPayload {
	status: 'resolved' | 'closed';
	resolution?: Partial<ThreadResolution>;
}
