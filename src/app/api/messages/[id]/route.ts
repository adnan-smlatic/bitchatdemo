import { NextRequest, NextResponse } from 'next/server';
import { updateMessageStatus, markMessagesAsRead } from '@/db/queries';
import { publish } from '@/shared/lib/sse-emitter';

export const dynamic = 'force-dynamic';

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const body = (await request.json()) as {
		status?: 'sending' | 'sent' | 'delivered' | 'failed';
		markRead?: { threadId: string; senderType: 'visitor' | 'agent' };
	};

	if (body.markRead) {
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

	if (body.status) {
		const message = await updateMessageStatus(id, body.status);
		if (!message) {
			return NextResponse.json({ message: 'Message not found' }, { status: 404 });
		}
		return NextResponse.json(message);
	}

	return NextResponse.json({ message: 'No update specified' }, { status: 400 });
}
