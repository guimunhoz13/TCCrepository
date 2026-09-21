import Logo from "@/components/ui/Logo";

export const metadata = {
  title: "Sem conexão — LexOffice",
};

export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: "48px 24px",
        textAlign: "center",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <Logo size={40} />
      <h1 style={{ fontFamily: '"Fraunces", serif', fontSize: "1.6rem", margin: 0 }}>
        Sem conexão
      </h1>
      <p style={{ color: "var(--text-muted)", maxWidth: 420, lineHeight: 1.6 }}>
        O LexOffice precisa de internet para mostrar processos, prazos e
        documentos atualizados. Assim que a conexão voltar, recarregue a
        página.
      </p>
    </main>
  );
}
