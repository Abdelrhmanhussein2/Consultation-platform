import React, { useState, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';
import { subscribeDialog } from './dialogManager';

export default function GlobalDialog() {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: "تنبيه",
    message: "",
    confirmText: "حسناً",
    cancelText: null,
    variant: "primary",
    onConfirm: null,
    onCancel: null
  });

  useEffect(() => {
    const unsubscribe = subscribeDialog((data) => {
      setDialogState(data);
    });
    return unsubscribe;
  }, []);

  const handleClose = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    const fn = dialogState.onConfirm || handleClose;
    handleClose();
    if (fn) fn();
  };

  const handleCancel = () => {
    const fn = dialogState.onCancel || handleClose;
    handleClose();
    if (fn) fn();
  };

  return (
    <ConfirmModal
      isOpen={dialogState.isOpen}
      title={dialogState.title}
      message={dialogState.message}
      confirmText={dialogState.confirmText}
      cancelText={dialogState.cancelText}
      variant={dialogState.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
}
