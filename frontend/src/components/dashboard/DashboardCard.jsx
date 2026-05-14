export default function DashboardCard({
  titulo,
  valor,
}) {
  return (
    <div
      className="p-4 rounded-4 shadow-sm"
      style={{
        background: "white",
        border: "1px solid #E5E7EB",
      }}
    >
      <p
        className="mb-2"
        style={{
          color: "var(--color-muted)",
        }}
      >
        {titulo}
      </p>

      <h2
        className="fw-bold"
        style={{
          color: "var(--color-primary)",
        }}
      >
        {valor}
      </h2>
    </div>
  );
}