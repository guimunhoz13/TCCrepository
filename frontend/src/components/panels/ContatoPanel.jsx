"use client";

import { useEffect, useState } from "react";
import { usePanel } from "@/contexts/PanelContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import { getDashboardStats } from "@/services/api";

export default function ContatoPanel() {
  const { activePanel } = usePanel();
  const [escritorio, setEscritorio] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (activePanel !== "contato") return;

    getDashboardStats()
      .then((data) => setEscritorio(data.escritorio))
      .catch((error) => setErro(error.message));
  }, [activePanel]);

  if (activePanel !== "contato") return null;

  return (
    <OverlayPanel>
      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="contact-grid">
        <div className="contact-item">
          <strong>Escritório</strong>
          <span>{escritorio?.nome || "—"}</span>
        </div>
        <div className="contact-item">
          <strong>CNPJ</strong>
          <span>{escritorio?.cnpj || "—"}</span>
        </div>
        <div className="contact-item">
          <strong>E-mail</strong>
          <span>{escritorio?.email || "—"}</span>
        </div>
        <div className="contact-item">
          <strong>Telefone</strong>
          <span>{escritorio?.telefone || "—"}</span>
        </div>
        <div className="contact-item">
          <strong>Endereço</strong>
          <span>
            {escritorio
              ? `${escritorio.endereco}${escritorio.cidade ? `, ${escritorio.cidade}` : ""}${escritorio.estado ? ` - ${escritorio.estado}` : ""}`
              : "—"}
          </span>
        </div>
        <div className="contact-item">
          <strong>Sobre o sistema</strong>
          <span>
            LexOffice é um ERP jurídico multi-escritório. Cada escritório possui
            dados isolados: clientes, advogados, processos e documentos ficam
            visíveis apenas para usuários do mesmo escritório.
          </span>
        </div>
      </div>
    </OverlayPanel>
  );
}
