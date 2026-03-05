import { NextRequest, NextResponse } from 'next/server';
import { publish } from '@/shared/lib/sse-emitter';
import type { TypingEvent } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
	const body = (await request.json()) as TypingEvent;

	if (!body.threadId || !body.senderId || !body.senderType) {
		return NextResponse.json(
			{ message: 'threadId, senderId, and senderType are required' },
			{ status: 400 }
		);
	}

	publish(`thread:${body.threadId}`, 'typing', {
		senderId: body.senderId,
		senderType: body.senderType,
		isTyping: body.isTyping,
	});

	return NextResponse.json({ ok: true });
}
