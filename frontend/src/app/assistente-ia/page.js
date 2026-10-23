"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/shell/AppSidebar";
import TopBar from "@/components/shell/TopBar";
import AssistenteChat from "@/components/assistente/AssistenteChat";
import { PanelProvider } from "@/contexts/PanelContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import GuiaContextual from "@/components/shell/GuiaContextual";

function AssistenteContent() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="app-shell">
      <AppSidebar />

      <main id="conteudo-principal" className="app-main">
        <TopBar
          title="Assistente IA"
          subtitle="Converse com o auxiliar jurídico do escritório"
          ajudaAssunto="assistente"
        />

        <GuiaContextual assunto="assistente" />

        <AssistenteChat />
      </main>

    </div>
  );
}

export default function AssistenteIAPage() {
  return (
    <PreferencesProvider>
      <PanelProvider>
        <AssistenteContent />
      </PanelProvider>
    </PreferencesProvider>
  );
}
