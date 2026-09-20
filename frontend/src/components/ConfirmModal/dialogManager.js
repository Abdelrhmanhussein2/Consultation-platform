// Global dialog manager for replacing browser alert() and confirm() with Diwan ConfirmModal

let listeners = [];

export const showDialog = ({
  title = "تنبيه",
  message = "",
  confirmText = "حسناً",
  cancelText = null,
  variant = "primary", // 'primary' | 'danger' | 'warning' | 'info' | 'success'
  onConfirm = null,
  onCancel = null
}) => {
  return new Promise((resolve) => {
    const dialogData = {
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      variant,
      onConfirm: () => {
        if (onConfirm) onConfirm();
        resolve(true);
      },
      onCancel: () => {
        if (onCancel) onCancel();
        resolve(false);
      }
    };
    listeners.forEach((listener) => listener(dialogData));
  });
};

export const subscribeDialog = (listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};

// Override native window.alert globally so no browser flag / alert popup ever shows!
if (typeof window !== "undefined") {
  window.alert = (message) => {
    const msgStr = typeof message === "object" ? JSON.stringify(message) : String(message || "");
    const isError = msgStr.includes("خطأ") || msgStr.includes("فشل") || msgStr.toLowerCase().includes("error") || msgStr.toLowerCase().includes("fail");
    showDialog({
      title: isError ? "تنبيه خطأ" : "تنبيه",
      message: msgStr,
      confirmText: "حسناً",
      cancelText: null,
      variant: isError ? "danger" : "primary"
    });
  };
}
