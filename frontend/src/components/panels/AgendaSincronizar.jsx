"use client";

import { useState } from "react";
import { CalendarPlus, Copy, Download, Link2Off, RefreshCw } from "lucide-react";
import { useRecurso } from "@/hooks/useRecurso";
import { useAvisos } from "@/contexts/AvisosContext";
import { useConfirmacao } from "@/contexts/ConfirmacaoContext";
import {
  desligarAssinaturaAgenda,
  exportarAgendaICS,
  gerarAssinaturaAgenda,
  getAssinaturaAgenda,
} from "@/services/api";

const COMO_ASSINAR = [
  {
    app: "Google Agenda",
    passos: "No computador, em Outras agendas, clique em + › Do URL e cole o link.",
  },
  {
    app: "Outlook",
    passos: "Em Adicionar calendário › Assinar da Web, cole o link e dê um nome.",
  },
  {
    app: "iPhone",
    passos: "Ajustes › Calendário › Contas › Adicionar Conta › Outra › Adicionar Calendário Assinado.",
  },
];

/**
 * Leva a agenda do escritório para o calendário do celular: download
 * único (.ics) ou assinatura por link privado, que o aplicativo de agenda
 * consulta sozinho e mantém atualizada.
 */
export default function AgendaSincronizar() {
  const avisar = useAvisos();
  const confirmar = useConfirmacao();
  const assinatura = useRecurso(getAssinaturaAgenda);
  const [urlLocal, setUrlLocal] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const url = urlLocal ?? assinatura.dados?.url ?? "";

  async function executar(acao) {
    try {
      setOcupado(true);
      return await acao();
    } catch (e) {
      avisar(e.message, "erro");
      return null;
    } finally {
      setOcupado(false);
    }
  }

  async function gerar() {
    if (url) {
      const ok = await confirmar({
        titulo: "Gerar um novo link",
        mensagem: "O link atual para de funcionar. Quem assinou com ele precisa colar o novo no aplicativo de agenda.",
        acao: "Gerar novo link",
      });
      if (!ok) return;
    }
    const res = await executar(gerarAssinaturaAgenda);
    if (res) {
      setUrlLocal(res.url);
      avisar("Link de assinatura pronto. Copie e cole no seu aplicativo de agenda.");
    }
  }

  async function desligar() {
    const ok = await confirmar({
      titulo: "Desligar a assinatura",
      mensagem: "O aplicativo de agenda deixa de receber os compromissos do LexOffice.",
      acao: "Desligar",
    });
    if (!ok) return;
    const res = await executar(desligarAssinaturaAgenda);
    if (res) {
      setUrlLocal("");
      avisar("Assinatura desligada.");
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      avisar("Link copiado.");
    } catch {
      avisar("Não deu para copiar automaticamente. Selecione o link e copie.", "erro");
    }
  }

  return (
    <div className="settings-stack">
      <section className="bloco-sincronizar">
        <h4>Baixar a agenda</h4>
        <p>
          Um arquivo .ics com audiências, prazos e compromissos a partir do
          último mês. Serve para importar uma vez; mudanças feitas depois não
          vão junto.
        </p>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => exportarAgendaICS().catch((e) => avisar(e.message, "erro"))}
        >
          <Download size={14} /> Baixar agenda (.ics)
        </button>
      </section>

      <section className="bloco-sincronizar">
        <h4>Assinar no celular ou no Outlook</h4>
        <p>
          O aplicativo de agenda consulta o link de tempos em tempos e mostra
          prazos e audiências sempre atualizados, com aviso na véspera dos
          prazos. O link é pessoal: quem tiver acesso a ele lê a agenda, então
          não compartilhe.
        </p>

        {assinatura.carregando && !urlLocal ? (
          <p className="dica-campo">Carregando…</p>
        ) : url ? (
          <>
            <input
              aria-label="Link de assinatura da agenda"
              className="campo-link"
              readOnly
              value={url}
              onFocus={(e) => e.target.select()}
            />
            <div className="export-row">
              <button type="button" className="btn btn-primary btn-sm" onClick={copiar}>
                <Copy size={14} /> Copiar link
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={gerar} disabled={ocupado}>
                <RefreshCw size={14} /> Gerar novo link
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={desligar} disabled={ocupado}>
                <Link2Off size={14} /> Desligar
              </button>
            </div>
          </>
        ) : (
          <button type="button" className="btn btn-primary btn-sm" onClick={gerar} disabled={ocupado}>
            <CalendarPlus size={14} /> Criar link de assinatura
          </button>
        )}

        <ul className="lista-como-assinar">
          {COMO_ASSINAR.map((item) => (
            <li key={item.app}>
              <strong>{item.app}:</strong> {item.passos}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
