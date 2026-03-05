import { createSSEStream, getSSEHeaders } from '@/shared/lib/sse-emitter';

export const dynamic = 'force-dynamic';

export async function GET() {
	const stream = createSSEStream('inbox');

	return new Response(stream, {
		headers: getSSEHeaders(),
	});
}
