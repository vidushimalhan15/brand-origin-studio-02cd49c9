
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg m-4">
                    <div className="flex items-center gap-2 mb-4 text-red-700">
                        <AlertCircle className="w-6 h-6" />
                        <h2 className="text-lg font-semibold">Something went wrong</h2>
                    </div>

                    <div className="bg-white p-4 rounded border border-red-100 overflow-auto max-h-[400px]">
                        <p className="font-mono text-sm text-red-600 font-bold mb-2">
                            {this.state.error?.toString()}
                        </p>
                        {this.state.errorInfo && (
                            <pre className="font-mono text-xs text-gray-600 whitespace-pre-wrap">
                                {this.state.errorInfo.componentStack}
                            </pre>
                        )}
                    </div>

                    <Button
                        className="mt-4 bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => window.location.reload()}
                    >
                        Reload Page
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
