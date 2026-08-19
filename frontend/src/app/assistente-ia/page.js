"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/shell/AppSidebar";
import TopBar from "@/components/shell/TopBar";
import AssistenteChat from "@/components/assistente/AssistenteChat";
import ClientesPanel from "@/components/panels/ClientesPanel";
import ProcessosPanel from "@/components/panels/ProcessosPanel";
import AgendaPanel from "@/components/panels/AgendaPanel";
import DocumentosPanel from "@/components/panels/DocumentosPanel";
import ContatoPanel from "@/components/panels/ContatoPanel";
import ConfigPanel from "@/components/panels/ConfigPanel";
import AdvogadosPanel from "@/components/panels/AdvogadosPanel";
import PlanosPanel from "@/components/panels/PlanosPanel";
import { PanelProvider } from "@/contexts/PanelContext";

function AssistenteContent() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      router.replace("/");
    }
  }, [router]);

  return (
    <div className="app-shell">
      <AppSidebar />

      <main className="app-main">
        <TopBar
          title="Assistente IA"
          subtitle="Converse com o auxiliar jurídico do escritório"
        />

        <AssistenteChat />
      </main>

      <ClientesPanel />
      <ProcessosPanel />
      <AgendaPanel />
      <DocumentosPanel />
      <ContatoPanel />
      <ConfigPanel />
      <AdvogadosPanel />
      <PlanosPanel />
    </div>
  );
}

export default function AssistenteIAPage() {
  return (
    <PanelProvider>
      <AssistenteContent />
    </PanelProvider>
  );
}
