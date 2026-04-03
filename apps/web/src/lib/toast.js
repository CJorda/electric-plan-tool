const listeners = new Set();

const emit = (toast) => {
  listeners.forEach((listener) => listener(toast));
};

export const subscribeToToasts = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const toast = (message, options = {}) => {
  const payload = {
    id: `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: options.type || "info",
    message,
    duration: typeof options.duration === "number" ? options.duration : 3200,
  };
  emit(payload);
  return payload.id;
};

export const toastSuccess = (message, options = {}) =>
  toast(message, { ...options, type: "success" });

export const toastError = (message, options = {}) =>
  toast(message, { ...options, type: "error" });

export const toastInfo = (message, options = {}) =>
  toast(message, { ...options, type: "info" });
