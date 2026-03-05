import { NextRequest } from 'next/server';
import { createSSEStream, getSSEHeaders } from '@/shared/lib/sse-emitter';

export const dynamic = 'force-dynamic';

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ threadId: string }> }
) {
	const { threadId } = await params;
	const stream = createSSEStream(`thread:${threadId}`);

	return new Response(stream, {
		headers: getSSEHeaders(),
	});
}
