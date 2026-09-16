import Link from "next/link";
import { Suspense } from "react";
import ConfirmarEmailForm from "@/components/forms/ConfirmarEmailForm";
import styles from "../login/page.module.css";
import Logo from "@/components/ui/Logo";

export default function ConfirmarEmailPage() {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <Link href="/" className={styles.backBrand}>
          <Logo size={18} />
          LexOffice
        </Link>

        <h1>Confirmando seu e-mail.</h1>
        <p>Só mais um instante para liberar o acesso ao seu escritório.</p>
      </section>

      <section className="auth-card-wrap">
        <div className="auth-card">
          <Suspense fallback={null}>
            <ConfirmarEmailForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
