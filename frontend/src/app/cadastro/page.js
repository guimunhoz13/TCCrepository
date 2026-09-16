import Link from "next/link";
import RegisterForm from "@/components/forms/RegisterForm";
import styles from "../login/page.module.css";
import Logo from "@/components/ui/Logo";

export default function CadastroPage() {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <Link href="/" className={styles.backBrand}>
          <Logo size={18} />
          LexOffice
        </Link>

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
