export default function Sidebar() {
  return (
    <aside
      className="bg-dark text-white d-flex flex-column p-4"
      style={{
        width: "260px",
        height: "100vh",
      }}
    >

      <h3 className="mb-5">
        TCC Advocacia
      </h3>

      <nav className="d-flex flex-column gap-3">

        <a
          href="/dashboard"
          className="text-white text-decoration-none"
        >
          Dashboard
        </a>

        <a
          href="/clientes"
          className="text-white text-decoration-none"
        >
          Clientes
        </a>

        <a
          href="/processos"
          className="text-white text-decoration-none"
        >
          Processos
        </a>

        <a
          href="/audiencias"
          className="text-white text-decoration-none"
        >
          Audiências
        </a>

        <a
          href="/documentos"
          className="text-white text-decoration-none"
        >
          Documentos
        </a>

      </nav>

    </aside>
  );
}