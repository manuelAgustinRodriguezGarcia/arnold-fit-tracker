import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button
            variant={danger ? "danger" : "primary"}
            size="lg"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
          <Button variant="secondary" size="lg" onClick={onClose}>
            {cancelLabel}
          </Button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
