export default function Button({
  children,
  type = "button",
}) {
  return (
    <button
      type={type}
      className="w-100 border-0 text-white py-2 px-4"
      style={{
        backgroundColor: "var(--color-primary)",
        borderRadius: "var(--border-radius)",
      }}
    >
      {children}
    </button>
  );
}