import { Component, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
    state = { hasError: false }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error: unknown) {
        console.error('App crashed:', error)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
                    <div className="max-w-md text-center">
                        <h1 className="mb-3 text-2xl font-bold">Something went wrong</h1>
                        <p className="mb-6 text-gray-400">
                            The app hit an unexpected error. Reload the page to continue — your saved
                            work is safe.
                        </p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black hover:bg-gray-200"
                        >
                            Reload app
                        </button>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
