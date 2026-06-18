import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// Toast types
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), 3000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    const icons = {
        success: <CheckCircle className="h-4 w-4 text-emerald-400" />,
        error: <AlertCircle className="h-4 w-4 text-red-400" />,
        info: <Info className="h-4 w-4 text-blue-400" />,
        warning: <AlertTriangle className="h-4 w-4 text-amber-400" />
    };

    const bgColors = {
        success: 'bg-emerald-500/10 border-emerald-500/30',
        error: 'bg-red-500/10 border-red-500/30',
        info: 'bg-blue-500/10 border-blue-500/30',
        warning: 'bg-amber-500/10 border-amber-500/30'
    };

    return (
        <div
            role={toast.type === 'error' ? 'alert' : 'status'}
            aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${bgColors[toast.type]} backdrop-blur-sm slide-in-from-bottom`}
        >
            {icons[toast.type]}
            <span className="text-sm text-[hsl(var(--foreground))]">{toast.message}</span>
            <button
                onClick={() => onRemove(toast.id)}
                className="ml-auto p-1 hover:bg-white/10 rounded transition-colors"
                aria-label="Dismiss notification"
            >
                <X className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
            </button>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const counterRef = useRef(0);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = `toast-${++counterRef.current}-${Date.now()}`;
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
