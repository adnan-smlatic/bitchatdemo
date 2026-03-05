import { NextRequest, NextResponse } from 'next/server';
import { markMessagesAsRead } from '@/db/queries';
import { publish } from '@/shared/lib/sse-emitter';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
	const body = (await request.json()) as {
		markRead: { threadId: string; senderType: 'visitor' | 'agent' };
	};

	if (!body.markRead?.threadId || !body.markRead?.senderType) {
		return NextResponse.json(
			{ message: 'markRead.threadId and markRead.senderType are required' },
			{ status: 400 }
		);
	}

	const count = await markMessagesAsRead(
		body.markRead.threadId,
		body.markRead.senderType
	);

	publish(`thread:${body.markRead.threadId}`, 'messages-read', {
		threadId: body.markRead.threadId,
		senderType: body.markRead.senderType,
		count,
	});

	return NextResponse.json({ read: count });
}
