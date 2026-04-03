import "./DeleteIconButton.css";

export default function DeleteIconButton({
  onClick,
  ariaLabel = "Eliminar",
  title,
  className = "",
  type = "button",
  disabled = false,
}) {
  const classes = ["ui-delete-btn", className].filter(Boolean).join(" ");

  return (
    <button
      type={type}
      className={classes}
      aria-label={ariaLabel}
      title={title || ariaLabel}
      onClick={onClick}
      disabled={disabled}
    >
      X
    </button>
  );
}
