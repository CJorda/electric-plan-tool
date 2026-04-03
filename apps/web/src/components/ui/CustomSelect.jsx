import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

function CustomSelect({
  value,
  options,
  placeholder,
  onChange,
  onKeyDown,
  disabled = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selectedLabel = useMemo(() => {
    const selected = options.find((option) => option.value === value);
    if (selected) return selected.label;
    return placeholder || "";
  }, [options, placeholder, value]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
  };

  const handleSelect = (nextValue) => {
    if (disabled) return;
    onChange?.(nextValue);
    setOpen(false);
  };

  return (
    <div className={`app-select ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        className="app-select__trigger"
        onClick={handleToggle}
        onKeyDown={onKeyDown}
        disabled={disabled}
      >
        <span className="app-select__label">{selectedLabel || placeholder}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div
          className="app-select__menu"
          role="listbox"
          onClick={() => setOpen(false)}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                "app-select__option" +
                (option.value === value ? " app-select__option--active" : "") +
                (option.disabled ? " app-select__option--disabled" : "")
              }
              onClick={() => !option.disabled && handleSelect(option.value)}
              disabled={option.disabled}
              role="option"
              aria-selected={option.value === value}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
