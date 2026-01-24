import "./ImageModal.css";

function ImageModal({ open, backgroundImage, onClose, onUrlChange, onFileChange }) {
  if (!open) return null;

  return (
    <div className="modal">
      <div className="modal__content">
        <div className="modal__header">
          <h2>Imagen de fondo</h2>
          <button className="modal__close" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <p className="modal__hint">
          Puedes subir una imagen o pegar una URL. Para Google Maps, usa una captura de pantalla.
        </p>
        <label className="modal__label">
          URL de la imagen
          <input value={backgroundImage} onChange={(event) => onUrlChange(event.target.value)} placeholder="https://..." />
        </label>
        <label className="modal__label">
          Subir archivo
          <input type="file" accept="image/*" onChange={onFileChange} />
        </label>
      </div>
    </div>
  );
}

export default ImageModal;
