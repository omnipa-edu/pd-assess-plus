/**
 * Section Error Boundary Component
 * A lightweight error boundary for specific sections/components
 * Falls back to a simple error message instead of full error UI
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';

import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  sectionName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(
      `Section Error Boundary caught an error${this.props.sectionName ? ` in ${this.props.sectionName}` : ''}`,
      error,
      { componentStack: errorInfo.componentStack }
    );

    this.setState({ error });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {this.props.sectionName ? `Error in ${this.props.sectionName}` : 'Something went wrong'}
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              {this.state.error?.message || 'An unexpected error occurred in this section.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="mt-2"
            >
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}





