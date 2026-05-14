import Link from "next/link";

export default function Sidebar() {
  return (
    <div
      className="d-flex flex-column p-4"
      style={{
        width: "260px",
        minHeight: "100vh",
        background: "var(--color-primary)",
        color: "white",
      }}
    >
      <h2 className="fw-bold mb-5">
        Advocacia
      </h2>

      <nav className="d-flex flex-column gap-3">

        <Link
          href="/dashboard"
          className="text-white text-decoration-none"
        >
          Dashboard
        </Link>

        <Link
          href="/dashboard/clientes"
          className="text-white text-decoration-none"
        >
          Clientes
        </Link>

        <Link
          href="/dashboard/processos"
          className="text-white text-decoration-none"
        >
          Processos
        </Link>

        <Link
          href="/dashboard/agenda"
          className="text-white text-decoration-none"
        >
          Agenda
        </Link>

        <Link
          href="/dashboard/documentos"
          className="text-white text-decoration-none"
        >
          Documentos
        </Link>

        <Link
          href="/"
          className="text-danger text-decoration-none mt-5"
        >
          Logout
        </Link>

      </nav>
    </div>
  );
}