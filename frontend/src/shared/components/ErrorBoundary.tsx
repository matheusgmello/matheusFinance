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
          <div className="max-w-xl bg-overdue/10 border border-overdue/30 rounded-xl p-6 space-y-3">
            <h2 className="text-base font-semibold text-overdue">
              Erro ao renderizar a página
            </h2>
            <p className="text-sm text-overdue break-all">
              {this.state.error.message}
            </p>
            <pre className="text-xs text-overdue/80 overflow-auto max-h-48 whitespace-pre-wrap">
              {this.state.error.stack}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="text-sm font-medium text-overdue underline"
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
