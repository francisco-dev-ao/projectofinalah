import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary component for catching errors in the cart context
 */
export class CartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the console
    console.error('Cart context error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any fallback UI
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-red-800 font-medium">Erro ao carregar o carrinho</h3>
          <p className="text-red-600 text-sm">
            Ocorreu um erro ao inicializar o carrinho. Por favor, tente recarregar a página.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded text-red-800 text-sm"
          >
            Recarregar página
          </button>
          <p className="text-xs text-gray-500 mt-4">
            Erro técnico: {this.state.error?.message}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
