interface ApiError {
	message: string;
	status: number;
}

interface ApiResponse<T> {
	data: T | null;
	error: ApiError | null;
}

async function request<T>(
	url: string,
	options?: RequestInit
): Promise<ApiResponse<T>> {
	try {
		const response = await fetch(url, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...options?.headers,
			},
		});

		if (!response.ok) {
			const body = await response.json().catch(() => ({ message: 'Request failed' }));
			return {
				data: null,
				error: {
					message: (body as Record<string, string>).message ?? 'Request failed',
					status: response.status,
				},
			};
		}

		const data = (await response.json()) as T;
		return { data, error: null };
	} catch {
		return {
			data: null,
			error: { message: 'Network error', status: 0 },
		};
	}
}

export const api = {
	get<T>(url: string): Promise<ApiResponse<T>> {
		return request<T>(url);
	},

	post<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
		return request<T>(url, {
			method: 'POST',
			body: JSON.stringify(body),
		});
	},

	patch<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
		return request<T>(url, {
			method: 'PATCH',
			body: JSON.stringify(body),
		});
	},
};
