'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		console.error('ErrorBoundary caught:', error, errorInfo);
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
					<div className="text-4xl">⚠</div>
					<h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
						Something went wrong
					</h2>
					<p className="text-sm text-neutral-500">
						{this.state.error?.message ?? 'An unexpected error occurred'}
					</p>
					<Button onClick={this.handleReset} variant="secondary">
						Try again
					</Button>
				</div>
			);
		}

		return this.props.children;
	}
}

export { ErrorBoundary };
