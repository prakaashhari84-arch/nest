'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (React.Component as any) {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-3xl bg-rose-50 border-2 border-rose-200 text-center space-y-4 my-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-base text-rose-950">
              {this.props.fallbackTitle || 'Something went wrong rendering this view'}
            </h3>
            <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto">
              {this.state.error?.message || 'An unexpected error occurred. You can safely reload the view.'}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload & Recover View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
