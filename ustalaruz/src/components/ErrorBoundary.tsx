import { Component, type ErrorInfo, type ReactNode } from 'react';
import ServerErrorPage from './ServerErrorPage';
import { reportError } from '../lib/errorReporter';

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
}

// Catches render-time crashes anywhere below it in the tree - without this,
// an uncaught error in a component unmounts the whole React tree and the
// user sees a blank white page with no way back except a manual reload.
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error('[ErrorBoundary] Render crash:', error, info.componentStack);
		reportError(error.message || 'Render crash', 'error-boundary', {
			stack: error.stack,
			componentStack: info.componentStack,
		});
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen w-full flex items-center justify-center p-4 bg-white dark:bg-surface">
					<ServerErrorPage />
				</div>
			);
		}
		return this.props.children;
	}
}
