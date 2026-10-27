"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";
import {
  enviarMensagemIA,
  getClientes,
  getProcessos,
} from "@/services/api";
import SeletorDeRecurso from "@/components/ui/SeletorDeRecurso";

const MENSAGEM_INICIAL = {
  id: "welcome",
  role: "assistant",
  content:
    "Olá! Sou o assistente jurídico do seu escritório. Posso ajudar com resumos de processos, informações sobre clientes e orientações gerais. Como posso ajudar?",
};

export default function AssistenteChat() {
  const [mensagens, setMensagens] = useState([MENSAGEM_INICIAL]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [cliente, setCliente] = useState(null);
  const [processo, setProcesso] = useState(null);
  const clienteId = cliente?.id || "";
  const processoId = processo?.id || "";
  const mensagensRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
    }
  }, [mensagens, carregando]);

  function montarHistorico() {
    return mensagens
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));
  }

  async function handleEnviar(event) {
    event?.preventDefault();

    const pergunta = texto.trim();
    if (!pergunta || carregando) return;

    setTexto("");
    setErro("");

    const msgUsuario = {
      id: `user-${Date.now()}`,
      role: "user",
      content: pergunta,
    };

    setMensagens((prev) => [...prev, msgUsuario]);
    setCarregando(true);

    try {
      const historico = montarHistorico();
      const contexto = {};

      if (clienteId) contexto.cliente_id = Number(clienteId);
      if (processoId) contexto.processo_id = Number(processoId);

      const data = await enviarMensagemIA({
        mensagem: pergunta,
        historico,
        contexto,
      });

      setMensagens((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.resposta,
        },
      ]);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleEnviar(event);
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>
          <Bot size={22} />
          Assistente IA
        </h3>
        <p>Auxiliar jurídico do escritório — powered by OpenAI</p>
        <p className="chat-aviso-revisao">
          Use como apoio: confira nomes, valores, prazos e fundamentos antes de usar a resposta.
          Evite inserir documentos, endereços ou contatos pessoais na conversa.
        </p>
      </div>

      <div className="chat-context-bar">
        <SeletorDeRecurso rotulo="Cliente" buscar={getClientes} valor={clienteId}
          selecionado={cliente} onChange={(item) => { setCliente(item); setProcesso(null); }}
          descrever={(item) => item.nome} />
        <SeletorDeRecurso key={clienteId || "todos"} rotulo="Processo"
          buscar={(params) => getProcessos({ ...params, cliente: clienteId })}
          chaves={[clienteId]} valor={processoId} selecionado={processo} onChange={setProcesso}
          descrever={(item) => `${item.numero_processo} — ${item.titulo}`} />
      </div>

      {erro && (
        <div className="alert alert-error chat-error">{erro}</div>
      )}

      <div className="chat-messages" ref={mensagensRef}>
        {mensagens.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.role}`}>
            <div className="chat-message-avatar">
              {msg.role === "assistant" ? (
                <Bot size={18} />
              ) : (
                <User size={18} />
              )}
            </div>
            <div>
              <div className="chat-message-label">
                {msg.role === "assistant" ? "Assistente" : "Você"}
              </div>
              <div className="chat-message-bubble">{msg.content}</div>
            </div>
          </div>
        ))}

        {carregando && (
          <div className="chat-message assistant">
            <div className="chat-message-avatar">
              <Bot size={18} />
            </div>
            <div className="chat-loading">
              <div className="chat-loading-dots">
                <span />
                <span />
                <span />
              </div>
              Pensando...
            </div>
          </div>
        )}
      </div>

      <form className="chat-input-area" onSubmit={handleEnviar}>
        <div className="chat-input-campo">
          <label htmlFor="pergunta-assistente">Pergunta para o assistente</label>
          <textarea
            id="pergunta-assistente"
            ref={inputRef}
            placeholder="Ex.: Resuma os últimos andamentos deste processo"
            aria-describedby="pergunta-assistente-ajuda"
            maxLength={4000}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={carregando}
            rows={1}
          />
          <span id="pergunta-assistente-ajuda">Enter envia; Shift + Enter cria uma nova linha.</span>
        </div>
        <button
          type="submit"
          className="chat-send-btn"
          disabled={carregando || !texto.trim()}
        >
          <Send size={16} />
          Enviar
        </button>
      </form>
    </div>
  );
}
