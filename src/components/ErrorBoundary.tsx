import { Component, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Erro não tratado na aplicação:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md space-y-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-6" />
            </div>
            <h1 className="text-xl font-semibold">Algo deu errado</h1>
            <p className="text-muted-foreground text-sm">
              Ocorreu um erro inesperado. Tente recarregar a página; se o problema continuar,
              entre em contato com o suporte.
            </p>
            <Button onClick={() => window.location.reload()}>Recarregar página</Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
