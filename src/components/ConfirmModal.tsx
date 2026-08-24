import Modal from "./Modal";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="mt-2 text-sm text-ink-soft">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[6px] border border-line bg-surface px-4 py-2 text-xs font-bold text-ink transition hover:border-ink-soft"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-[6px] bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
