import LoginForm from "@/components/forms/LoginForm";
import styles from "./page.module.css";

const steps = [
  {
    title: "Cadastre seu escritório",
    description: "Leva menos de 2 minutos, sem cartão de crédito.",
  },
  {
    title: "Organize clientes e processos",
    description: "Tudo isolado por escritório, com histórico completo.",
  },
  {
    title: "Acompanhe em um painel só",
    description: "Agenda, documentos e financeiro num único lugar.",
  },
];

const previewRows = [
  { name: "Processo nº 0043/2026", status: "Em andamento", tone: "warning" },
  { name: "Processo nº 0041/2026", status: "Concluído", tone: "success" },
  { name: "Processo nº 0038/2026", status: "Aguardando", tone: "muted" },
];

export default function Home() {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <h1>Gestão jurídica moderna para cada escritório.</h1>
        <p>
          LexOffice isola os dados de cada escritório de advocacia. Clientes,
          advogados, processos e documentos ficam organizados em um único
          painel elegante — com painéis sobrepostos, gráficos e calendário
          integrado.
        </p>

        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className={styles.preview} aria-hidden="true">
          <div className={styles.previewStats}>
            <div>
              <span>Escritórios ativos</span>
              <strong>1.240</strong>
            </div>
            <div>
              <span>Processos geridos</span>
              <strong>38.900</strong>
            </div>
            <div>
              <span>Uptime</span>
              <strong>99,9%</strong>
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