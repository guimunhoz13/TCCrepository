export default function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
}) {
  return (
    <div className="mb-3">

      <label
        className="form-label fw-medium"
        style={{
          color: "var(--color-primary)",
        }}
      >
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="form-control"
        style={{
          borderRadius: "12px",
          padding: "12px",
          border: "1px solid #d1d5db",
          color: "#111827",
          backgroundColor: "#ffffff",
        }}
      />

    </div>
  );
}