import LoginForm from "@/components/forms/LoginForm";

export default function Home() {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <h1>Gestão jurídica moderna para cada escritório.</h1>
        <p>
          LexOffice isola os dados de cada escritório de advocacia. Clientes,
          advogados, processos e documentos ficam organizados em um único painel
          elegante — com painéis sobrepostos, gráficos e calendário integrado.
        </p>
      </section>

      <section className="auth-card-wrap">
        <div className="auth-card">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
