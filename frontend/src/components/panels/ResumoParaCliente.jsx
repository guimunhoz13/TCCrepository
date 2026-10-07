"use client";

import { useState } from "react";
import { Copy, MessageCircle, RefreshCw, Sparkles } from "lucide-react";
import Janela from "@/components/ui/Janela";
import { useAvisos } from "@/contexts/AvisosContext";
import { useRecurso } from "@/hooks/useRecurso";
import { gerarResumoParaCliente } from "@/services/api";
import { abrirWhatsApp } from "@/utils/whatsapp";

export function descreverOrigem({ fonte, andamentos }) {
  const quantos = andamentos === 1 ? "1 andamento recente" : `${andamentos} andamentos recentes`;
  if (fonte === "ia") {
    return andamentos ? `Escrito pela IA a partir de ${quantos}.` : "Escrito pela IA (sem andamentos registrados).";
  }
  return andamentos
    ? `Modelo automático com ${quantos} em linguagem simples.`
    : "Modelo automático: não há andamentos registrados neste processo.";
}

/**
 * Resumo do andamento em linguagem simples, para mandar ao cliente. O
 * texto é editável: o advogado revisa antes de enviar.
 */
export default function ResumoParaCliente({ processoId, onFechar }) {
  const avisar = useAvisos();
  const [versao, setVersao] = useState(0);
  const recurso = useRecurso(() => gerarResumoParaCliente(processoId), [processoId, versao]);
  const resumo = recurso.dados;
  // O texto editado vale enquanto for sobre o mesmo resumo gerado.
  const [edicao, setEdicao] = useState({ base: null, texto: "" });
  const texto = resumo && edicao.base === resumo ? edicao.texto : resumo?.texto ?? "";

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      avisar("Mensagem copiada.");
    } catch {
      avisar("Não deu para copiar automaticamente. Selecione o texto e copie.", "erro");
    }
  }

  return (
    <Janela titulo="Atualizar o cliente" onFechar={onFechar} largura={560}>
      {recurso.carregando && <p className="dica-campo">Escrevendo o resumo…</p>}
      {recurso.erro && <div className="alert alert-error">{recurso.erro}</div>}
      {resumo && !recurso.carregando && (
        <div className="resumo-cliente">
          <p className="dica-campo" style={{ marginTop: 0 }}>
            {resumo.fonte === "ia" && <Sparkles size={13} aria-hidden="true" />}{" "}
            {descreverOrigem(resumo)} Revise antes de enviar.
          </p>
          <textarea
            aria-label="Mensagem para o cliente"
            rows={12}
            value={texto}
            onChange={(e) => setEdicao({ base: resumo, texto: e.target.value })}
          />
          <div className="export-row">
            {resumo.cliente_telefone && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => abrirWhatsApp(resumo.cliente_telefone, texto)}
              >
                <MessageCircle size={14} /> Enviar pelo WhatsApp
              </button>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={copiar}>
              <Copy size={14} /> Copiar
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setVersao((v) => v + 1)}>
              <RefreshCw size={14} /> Gerar de novo
            </button>
          </div>
          {!resumo.cliente_telefone && (
            <p className="dica-campo">{resumo.cliente_nome} não tem telefone cadastrado: copie e envie por onde preferir.</p>
          )}
        </div>
      )}
    </Janela>
  );
}
