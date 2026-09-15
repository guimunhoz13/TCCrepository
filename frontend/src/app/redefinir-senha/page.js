import Link from "next/link";
import { Suspense } from "react";
import { Scale } from "lucide-react";
import RedefinirSenhaForm from "@/components/forms/RedefinirSenhaForm";
import styles from "../login/page.module.css";

export default function RedefinirSenhaPage() {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <Link href="/" className={styles.backBrand}>
          <Scale size={18} />
          LexOffice
        </Link>

        <h1>Escolha uma nova senha.</h1>
        <p>Defina uma nova senha forte para voltar a acessar o sistema.</p>
      </section>

      <section className="auth-card-wrap">
        <div className="auth-card">
          <Suspense fallback={null}>
            <RedefinirSenhaForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
