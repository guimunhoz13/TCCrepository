"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HelpCircle, Search, X } from "lucide-react";
import { SECOES_AJUDA, buscarNaAjuda, secaoDoPainel } from "@/lib/ajuda";

/** Central de ajuda.
 *
 * Não reaproveita o OverlayPanel porque precisa abrir *por cima* de um
 * painel já aberto — a ajuda é contextual ao que a pessoa está vendo.
 */
export default function AjudaPanel({ aberto, painel = null, onFechar }) {
  const [termo, setTermo] = useState("");
  const [secaoId, setSecaoId] = useState(SECOES_AJUDA[0].id);
  const caixaRef = useRef(null);
  const buscaRef = useRef(null);
  const conteudoRef = useRef(null);

  // Ao abrir, começa no assunto do painel que está aberto; sem painel,
  // na visão geral.
  useEffect(() => {
    if (!aberto) return;
    const contextual = secaoDoPainel(painel);
    setSecaoId(contextual ? contextual.id : SECOES_AJUDA[0].id);
    setTermo("");
    buscaRef.current?.focus();
  }, [aberto, painel]);

  useEffect(() => {
    if (!aberto) return;

    function aoTeclar(evento) {
      if (evento.key === "Escape") {
        evento.stopPropagation();
        onFechar();
        return;
      }
      // Mantém o Tab dentro da ajuda enquanto ela estiver aberta.
      if (evento.key !== "Tab" || !caixaRef.current) return;
      const focaveis = caixaRef.current.querySelectorAll(
        'button, input, a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }

    // Na fase de captura para o Escape fechar a ajuda, e não o painel que
    // está atrás dela.
    window.addEventListener("keydown", aoTeclar, true);
    return () => window.removeEventListener("keydown", aoTeclar, true);
  }, [aberto, onFechar]);

  const secoes = useMemo(() => buscarNaAjuda(termo), [termo]);

  // Com a busca ativa, a seção escolhida pode ter sumido da lista.
  const secaoAtual =
    secoes.find((secao) => secao.id === secaoId) || secoes[0] || null;

  useEffect(() => {
    conteudoRef.current?.scrollTo?.({ top: 0 });
  }, [secaoAtual?.id]);

  if (!aberto) return null;

  return (
    <>
      <div className="overlay-backdrop ajuda-backdrop" onClick={onFechar} />
      <div
        className="ajuda-painel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ajuda-titulo"
        ref={caixaRef}
      >
        <header className="ajuda-header">
          <div className="ajuda-header-titulo">
            <HelpCircle size={19} />
            <h3 id="ajuda-titulo">Central de ajuda</h3>
          </div>
          <div className="ajuda-busca">
            <Search size={15} />
            <input
              ref={buscaRef}
              type="search"
              value={termo}
              placeholder="Buscar na ajuda..."
              aria-label="Buscar na ajuda"
              onChange={(e) => setTermo(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onFechar}
            aria-label="Fechar a ajuda"
            title="Fechar a ajuda"
          >
            <X size={18} />
          </button>
        </header>

        {secoes.length === 0 ? (
          <div className="empty-state" style={{ margin: 26 }}>
            Nada encontrado para “{termo}”.
          </div>
        ) : (
          <div className="ajuda-corpo">
            <nav className="ajuda-indice" aria-label="Assuntos da ajuda">
              {secoes.map((secao) => (
                <button
                  type="button"
                  key={secao.id}
                  className={`ajuda-indice-item ${
                    secaoAtual?.id === secao.id ? "active" : ""
                  }`}
                  aria-current={secaoAtual?.id === secao.id ? "true" : undefined}
                  onClick={() => setSecaoId(secao.id)}
                >
                  {secao.titulo}
                </button>
              ))}
            </nav>

            <div className="ajuda-conteudo" ref={conteudoRef}>
              {secaoAtual && (
                <>
                  <h4>{secaoAtual.titulo}</h4>
                  <p className="ajuda-resumo">{secaoAtual.resumo}</p>
                  {secaoAtual.topicos.map((topico) => (
                    <div className="ajuda-topico" key={topico.titulo}>
                      <strong>{topico.titulo}</strong>
                      <p>{topico.texto}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
