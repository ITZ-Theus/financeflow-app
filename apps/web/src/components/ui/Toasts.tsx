import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { useToastStore, type ToastType } from '../../store/toastStore'

const icons: Record<ToastType, JSX.Element> = {
  success: <CheckCircle2 size={18} />,
  error: <AlertTriangle size={18} />,
  info: <Info size={18} />,
}

export function Toasts() {
  const { toasts, remove } = useToastStore()

  return (
    <div className="toast-viewport" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast-card" data-type={toast.type}>
          <div className="toast-card__icon">{icons[toast.type]}</div>
          <div className="toast-card__content">
            <strong>{toast.title}</strong>
            {toast.description && <span>{toast.description}</span>}
          </div>
          <button
            className="toast-card__close"
            onClick={() => remove(toast.id)}
            aria-label="Fechar notificacao"
            type="button"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  )
}
