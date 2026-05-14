export default function Topbar() {
  return (
    <div
      className="d-flex justify-content-between align-items-center mb-4"
    >
      <div>
        <h2
          className="fw-bold"
          style={{
            color: "var(--color-primary)",
          }}
        >
          Dashboard
        </h2>

        <p
          style={{
            color: "var(--color-muted)",
          }}
        >
          Bem-vindo ao sistema jurídico
        </p>
      </div>

      <div
        className="px-3 py-2 rounded-pill"
        style={{
          background: "#EEF2FF",
          color: "var(--color-primary)",
          fontWeight: "600",
        }}
      >
        Advogado
      </div>
    </div>
  );
}