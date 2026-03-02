"use client";
import { Component, type ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="flex min-h-screen items-center justify-center p-8">
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center max-w-md">
            <p className="text-sm font-medium text-red-700">Something went wrong.</p>
            <p className="mt-1 text-xs text-gray-500">Reload the page to try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
