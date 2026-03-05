import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createMessage, getMessagesPaginated } from '@/db/queries';
import { publish } from '@/shared/lib/sse-emitter';
import type { SendMessagePayload } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const threadId = searchParams.get('threadId');
	const cursor = searchParams.get('cursor') ?? undefined;
	const limit = searchParams.get('limit');

	if (!threadId) {
		return NextResponse.json({ message: 'threadId is required' }, { status: 400 });
	}

	const result = await getMessagesPaginated(
		threadId,
		cursor,
		limit ? parseInt(limit, 10) : undefined
	);

	return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
	const body = (await request.json()) as SendMessagePayload;

	if (!body.threadId || !body.senderId || !body.content || !body.senderType) {
		return NextResponse.json(
			{ message: 'threadId, senderId, senderType, and content are required' },
			{ status: 400 }
		);
	}

	try {
		const message = await createMessage(
			nanoid(),
			body.threadId,
			body.senderType,
			body.senderId,
			body.content,
			body.messageType ?? 'text',
			body.metadata
		);

		publish(`thread:${body.threadId}`, 'message', message);
		publish('inbox', 'new-message', {
			threadId: body.threadId,
			message,
		});

		return NextResponse.json(message, { status: 201 });
	} catch {
		return NextResponse.json(
			{ message: 'Failed to create message' },
			{ status: 500 }
		);
	}
}
