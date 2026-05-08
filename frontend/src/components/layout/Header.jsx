export default function Header({ title }) {
  return (
    <header className="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 className="mb-1">{title}</h1>
        <p className="text-muted mb-0">
          Painel de gerenciamento jurídico
        </p>
      </div>

      <div className="text-end">
        <strong>Administrador</strong>
        <div className="text-muted small">admin@sistema.com</div>
      </div>
    </header>
  );
}