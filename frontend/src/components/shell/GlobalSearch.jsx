"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, User, Briefcase, FileText, X } from "lucide-react";

function normalizar(valor) {
  return (valor || "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export default function GlobalSearch({ clientes = [], processos = [], documentos = [], onSelect }) {
  const [termo, setTermo] = useState("");
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function aoClicarFora(evento) {
      if (containerRef.current && !containerRef.current.contains(evento.target)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  const resultados = useMemo(() => {
    const alvo = normalizar(termo.trim());
    if (alvo.length < 2) return { clientes: [], processos: [], documentos: [] };

    return {
      clientes: clientes
        .filter(
          (c) =>
            normalizar(c.nome).includes(alvo) ||
            normalizar(c.cpf).includes(alvo) ||
            normalizar(c.email).includes(alvo)
        )
        .slice(0, 4),
      processos: processos
        .filter(
          (p) =>
            normalizar(p.numero_processo).includes(alvo) ||
            normalizar(p.titulo).includes(alvo) ||
            normalizar(p.cliente_nome).includes(alvo)
        )
        .slice(0, 4),
      documentos: documentos
        .filter(
          (d) =>
            normalizar(d.nome_arquivo).includes(alvo) ||
            normalizar(d.numero_processo).includes(alvo)
        )
        .slice(0, 4),
    };
  }, [termo, clientes, processos, documentos]);

  const totalResultados =
    resultados.clientes.length + resultados.processos.length + resultados.documentos.length;

  function selecionar(tipo, item) {
    setTermo("");
    setAberto(false);
    onSelect?.(tipo, item);
  }

  return (
    <div className="global-search" ref={containerRef}>
      <Search size={16} className="global-search-icon" />
      <input
        type="text"
        placeholder="Buscar clientes, processos, documentos..."
        value={termo}
        onChange={(e) => {
          setTermo(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
      />
      {termo && (
        <button
          type="button"
          className="global-search-clear"
          onClick={() => {
            setTermo("");
            setAberto(false);
          }}
          aria-label="Limpar busca"
        >
          <X size={14} />
        </button>
      )}

      {aberto && termo.trim().length >= 2 && (
        <div className="global-search-results">
          {totalResultados === 0 ? (
            <div className="global-search-empty">Nada encontrado para &quot;{termo}&quot;.</div>
          ) : (
            <>
              {resultados.clientes.length > 0 && (
                <div className="global-search-group">
                  <span className="global-search-group-label">Clientes</span>
                  {resultados.clientes.map((c) => (
                    <button
                      type="button"
                      key={`cliente-${c.id}`}
                      className="global-search-item"
                      onClick={() => selecionar("clientes", c)}
                    >
                      <User size={15} />
                      <span>
                        <strong>{c.nome}</strong>
                        <small>{c.cpf}</small>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {resultados.processos.length > 0 && (
                <div className="global-search-group">
                  <span className="global-search-group-label">Processos</span>
                  {resultados.processos.map((p) => (
                    <button
                      type="button"
                      key={`processo-${p.id}`}
                      className="global-search-item"
                      onClick={() => selecionar("processos", p)}
                    >
                      <Briefcase size={15} />
                      <span>
                        <strong>{p.numero_processo}</strong>
                        <small>{p.titulo}</small>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {resultados.documentos.length > 0 && (
                <div className="global-search-group">
                  <span className="global-search-group-label">Documentos</span>
                  {resultados.documentos.map((d) => (
                    <button
                      type="button"
                      key={`documento-${d.id}`}
                      className="global-search-item"
                      onClick={() => selecionar("documentos", d)}
                    >
                      <FileText size={15} />
                      <span>
                        <strong>{d.nome_arquivo}</strong>
                        <small>{d.numero_processo}</small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
