import { Component, ErrorInfo, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex-1 p-8">
          <div className="max-w-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-semibold text-rose-700 dark:text-rose-300">
              Erro ao renderizar a página
            </h2>
            <p className="text-sm text-rose-600 dark:text-rose-400 font-mono break-all">
              {this.state.error.message}
            </p>
            <pre className="text-xs text-rose-500 dark:text-rose-500 overflow-auto max-h-48 whitespace-pre-wrap">
              {this.state.error.stack}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="text-sm font-medium text-rose-600 dark:text-rose-400 underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
