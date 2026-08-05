import RegisterForm from "@/components/forms/RegisterForm";

export default function CadastroPage() {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <h1>Cada escritório, seu próprio ambiente.</h1>
        <p>
          Ao se cadastrar, você cria um escritório isolado no sistema. Outros
          escritórios não terão acesso aos seus clientes, processos ou
          documentos — garantindo privacidade total entre as bancas.
        </p>
      </section>

      <section className="auth-card-wrap">
        <div className="auth-card">
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}
