import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getThreadsWithLastMessage, createThread } from '@/db/queries';
import type { CreateThreadPayload } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
	const threads = await getThreadsWithLastMessage();
	return NextResponse.json(threads);
}

export async function POST(request: NextRequest) {
	const body = (await request.json()) as CreateThreadPayload;

	if (!body.visitorId || !body.visitorName) {
		return NextResponse.json(
			{ message: 'visitorId and visitorName are required' },
			{ status: 400 }
		);
	}

	const thread = await createThread(nanoid(), body.visitorId, body.visitorName);
	return NextResponse.json(thread, { status: 201 });
}
