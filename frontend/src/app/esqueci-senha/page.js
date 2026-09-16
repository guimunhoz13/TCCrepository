import Link from "next/link";
import EsqueciSenhaForm from "@/components/forms/EsqueciSenhaForm";
import styles from "../login/page.module.css";
import Logo from "@/components/ui/Logo";

export default function EsqueciSenhaPage() {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <Link href="/" className={styles.backBrand}>
          <Logo size={18} />
          LexOffice
        </Link>

        <h1>Vamos recuperar seu acesso.</h1>
        <p>
          Informe o e-mail cadastrado e enviaremos um link para você escolher
          uma nova senha.
        </p>
      </section>

      <section className="auth-card-wrap">
        <div className="auth-card">
          <EsqueciSenhaForm />
        </div>
      </section>
    </main>
  );
}
