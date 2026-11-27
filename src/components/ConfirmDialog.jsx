import { Modal, Button } from 'react-bootstrap'

// Diálogo de confirmação simples. "options" é uma lista de botões:
// [{ label, variant, value }]. onClose(value) recebe o valor escolhido
// (ou null se o diálogo foi fechado).
export default function ConfirmDialog({ show, title, children, options, onClose }) {
  return (
    <Modal show={show} onHide={() => onClose(null)} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        {options.map(opt => (
          <Button key={opt.label} variant={opt.variant || 'secondary'} onClick={() => onClose(opt.value)}>
            {opt.label}
          </Button>
        ))}
      </Modal.Footer>
    </Modal>
  )
}
