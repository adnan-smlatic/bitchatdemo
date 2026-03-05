import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getThreadById, updateThreadStatus, createMessage } from '@/db/queries';
import { publish } from '@/shared/lib/sse-emitter';
import { AGENT_ID } from '@/shared/lib/constants';
import type { ResolveThreadPayload } from '@/types';
import { db } from '@/db/index';
import { threads } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const thread = await getThreadById(id);

	if (!thread) {
		return NextResponse.json({ message: 'Thread not found' }, { status: 404 });
	}

	return NextResponse.json(thread);
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const body = (await request.json()) as ResolveThreadPayload & {
		status?: 'open' | 'resolved' | 'closed';
		resolution?: {
			rating?: number | null;
			resolvedBy?: string | null;
			resolvedAt?: string | null;
			agentNotes?: string | null;
			visitorComment?: string | null;
		};
	};

	if (!body.status) {
		return NextResponse.json({ message: 'status is required' }, { status: 400 });
	}

	// Update thread status
	const thread = await updateThreadStatus(id, body.status);
	if (!thread) {
		return NextResponse.json({ message: 'Thread not found' }, { status: 404 });
	}

	// Update resolution data if provided
	if (body.resolution) {
		const existing = thread.resolution ?? {
			rating: null,
			resolvedBy: null,
			resolvedAt: null,
			agentNotes: null,
			visitorComment: null,
		};
		const merged = { ...existing, ...body.resolution };
		await db
			.update(threads)
			.set({ resolution: merged })
			.where(eq(threads.id, id));
		thread.resolution = merged;
	}

	// Insert system message for status changes
	let systemContent = '';
	if (body.status === 'resolved') {
		systemContent = 'Conversation marked as resolved';
	} else if (body.status === 'closed') {
		systemContent = 'Conversation closed';
	} else if (body.status === 'open') {
		systemContent = 'Conversation reopened';
	}

	if (systemContent) {
		const systemMsg = await createMessage(
			nanoid(),
			id,
			'system',
			AGENT_ID,
			systemContent,
			'system'
		);
		publish(`thread:${id}`, 'message', systemMsg);
		publish('inbox', 'new-message', { threadId: id, message: systemMsg });
	}

	publish(`thread:${id}`, 'thread-status', { status: thread.status, resolution: thread.resolution });
	publish('inbox', 'thread-update', thread);

	return NextResponse.json(thread);
}
