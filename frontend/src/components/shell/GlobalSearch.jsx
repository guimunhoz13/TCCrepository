"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import {
  MINIMO_CARACTERES,
  buscarEmTudo,
  contarResultados,
} from "@/lib/busca";

export default function GlobalSearch({ colecoes = {}, onSelect }) {
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

  const grupos = useMemo(() => buscarEmTudo(termo, colecoes), [termo, colecoes]);
  const total = contarResultados(grupos);

  function selecionar(painel, item) {
    setTermo("");
    setAberto(false);
    onSelect?.(painel, item);
  }

  return (
    <div className="global-search" ref={containerRef}>
      <Search size={16} className="global-search-icon" />
      <input
        type="text"
        placeholder="Buscar em todo o escritório..."
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

      {aberto && termo.trim().length >= MINIMO_CARACTERES && (
        <div className="global-search-results">
          {total === 0 ? (
            <div className="global-search-empty">
              Nada encontrado para &quot;{termo}&quot;.
            </div>
          ) : (
            grupos.map((grupo) => {
              const Icone = grupo.icone;
              return (
                <div className="global-search-group" key={grupo.chave}>
                  <span className="global-search-group-label">{grupo.rotulo}</span>
                  {grupo.itens.map((item) => (
                    <button
                      type="button"
                      key={`${grupo.chave}-${item.id}`}
                      className="global-search-item"
                      onClick={() => selecionar(grupo.painel, item)}
                    >
                      <Icone size={15} />
                      <span>
                        <strong>{grupo.titulo(item)}</strong>
                        <small>{grupo.detalhe(item)}</small>
                      </span>
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
