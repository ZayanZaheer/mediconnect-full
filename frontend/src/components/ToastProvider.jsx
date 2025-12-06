import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import Toast from "./Toast.jsx";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(({ tone = "success", message }) => {
    if (!message) return;
    const id = crypto.randomUUID ? crypto.randomUUID() : `toast-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, tone, message }]);
    const timeout = setTimeout(() => removeToast(id), 4000);
    timeoutsRef.current.set(id, timeout);
  }, [removeToast]);

  const contextValue = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toasts.length > 0 ? (
        <div className="pointer-events-none fixed left-1/2 top-20 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
          {toasts.map(({ id, tone, message }) => (
            <Toast
              key={id}
              tone={tone}
              message={message}
              onDismiss={() => removeToast(id)}
            />
          ))}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider>");
  }
  return ctx.pushToast;
}
