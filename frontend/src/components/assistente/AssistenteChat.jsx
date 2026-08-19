"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";
import {
  enviarMensagemIA,
  getClientes,
  getProcessos,
  normalizarLista,
} from "@/services/api";

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
  const [clientes, setClientes] = useState([]);
  const [processos, setProcessos] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [processoId, setProcessoId] = useState("");
  const mensagensRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    async function carregarContexto() {
      try {
        const [dadosClientes, dadosProcessos] = await Promise.all([
          getClientes(),
          getProcessos(),
        ]);
        setClientes(normalizarLista(dadosClientes));
        setProcessos(normalizarLista(dadosProcessos));
      } catch {
        /* contexto opcional */
      }
    }

    carregarContexto();
  }, []);

  useEffect(() => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
    }
  }, [mensagens, carregando]);

  const processosFiltrados = clienteId
    ? processos.filter((p) => String(p.cliente) === String(clienteId))
    : processos;

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
      </div>

      <div className="chat-context-bar">
        <select
          value={clienteId}
          onChange={(e) => {
            setClienteId(e.target.value);
            setProcessoId("");
          }}
        >
          <option value="">Cliente (opcional)</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>

        <select
          value={processoId}
          onChange={(e) => setProcessoId(e.target.value)}
        >
          <option value="">Processo (opcional)</option>
          {processosFiltrados.map((p) => (
            <option key={p.id} value={p.id}>
              {p.numero_processo} — {p.titulo}
            </option>
          ))}
        </select>
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
        <textarea
          ref={inputRef}
          placeholder="Digite sua pergunta..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={carregando}
          rows={1}
        />
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
