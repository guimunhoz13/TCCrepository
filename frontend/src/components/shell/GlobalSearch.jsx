"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import {
  MINIMO_CARACTERES,
  agruparResultados,
  contarResultados,
} from "@/lib/busca";
import { buscarNoEscritorio } from "@/services/api";
import { useRecurso } from "@/hooks/useRecurso";
import { useValorAtrasado } from "@/hooks/useValorAtrasado";

export default function GlobalSearch({ onSelect }) {
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

  // Espera a pessoa parar de digitar antes de consultar o servidor.
  const termoAtrasado = useValorAtrasado(termo.trim(), 250);
  const pesquisar = termoAtrasado.length >= MINIMO_CARACTERES;
  const busca = useRecurso(() => buscarNoEscritorio(termoAtrasado), [termoAtrasado], {
    ativo: pesquisar,
  });
  const grupos = pesquisar ? agruparResultados(busca.dados) : [];
  const total = contarResultados(grupos);
  const aguardando = termo.trim() !== termoAtrasado || busca.carregando;

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
        aria-label="Buscar em todo o escritório"
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
          {busca.erro ? (
            <div className="global-search-empty">{busca.erro}</div>
          ) : aguardando && total === 0 ? (
            <div className="global-search-empty">Buscando...</div>
          ) : total === 0 ? (
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
