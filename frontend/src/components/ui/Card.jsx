export default function Card({ children, className = "" }) {
  return (
    <div
      className={`shadow-sm p-4 bg-white ${className}`}
      style={{
        borderRadius: "var(--border-radius)",
      }}
    >
      {children}
    </div>
  );
}