import { useEffect, useMemo, useState } from "react";
import { subscribeToToasts } from "../../lib/toast.js";
import "./ToastViewport.css";

function ToastViewport() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((toast) => {
      setItems((prev) => [...prev, toast]);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const timers = items.map((item) =>
      setTimeout(() => {
        setItems((prev) => prev.filter((toast) => toast.id !== item.id));
      }, item.duration)
    );
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [items]);

  const visibleItems = useMemo(() => items.slice(-4), [items]);

  if (visibleItems.length === 0) return null;

  return (
    <div className="toast-viewport" role="status" aria-live="polite" aria-atomic="true">
      {visibleItems.map((item) => (
        <div key={item.id} className={`toast toast--${item.type}`}>
          <div className="toast__message">{item.message}</div>
          <button
            type="button"
            className="toast__close"
            onClick={() => setItems((prev) => prev.filter((toast) => toast.id !== item.id))}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastViewport;
