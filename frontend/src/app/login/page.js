import Link from "next/link";
import LoginForm from "@/components/forms/LoginForm";
import styles from "./page.module.css";
import Logo from "@/components/ui/Logo";

const previewRows = [
  { name: "Processo nº 0043/2026", status: "Em andamento", tone: "warning" },
  { name: "Processo nº 0041/2026", status: "Concluído", tone: "success" },
  { name: "Processo nº 0038/2026", status: "Aguardando", tone: "muted" },
];

export default function LoginPage() {
  return (
    <main id="conteudo-principal" className="auth-page">
      <section className="auth-hero">
        <Link href="/" className={styles.backBrand}>
          <Logo size={18} />
          LexNexo
        </Link>

        <h1>Bem-vindo de volta.</h1>
        <p>
          Acesse o painel do seu escritório: clientes, processos, agenda e
          documentos organizados em um único lugar.
        </p>

        <div className={styles.preview} aria-hidden="true">
          <div className={styles.previewStats}>
            <div>
              <span>Plano inicial</span>
              <strong>Gratuito</strong>
            </div>
            <div>
              <span>Usuários incluídos</span>
              <strong>3</strong>
            </div>
            <div>
              <span>Processos ativos</span>
              <strong>30</strong>
            </div>
          </div>
          <div className={styles.previewList}>
            {previewRows.map((row) => (
              <div key={row.name} className={styles.previewRow}>
                <span>{row.name}</span>
                <span className={`badge badge-${row.tone}`}>
                  {row.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="auth-card-wrap">
        <div className="auth-card">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
