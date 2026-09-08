"use client";

import { useEffect, useState } from "react";
import { Newspaper, ExternalLink } from "lucide-react";
import { getNoticiasJuridicas } from "@/services/api";

function formatarData(publicadoEm) {
  if (!publicadoEm) return "";
  const data = new Date(publicadoEm);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NoticiasColuna({ titulo, itens }) {
  if (itens.length === 0) return null;

  return (
    <div className="news-column">
      <h4>{titulo}</h4>
      <div className="news-list">
        {itens.map((item, index) => (
          <a
            key={`${item.link}-${index}`}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="news-card"
          >
            <div className="news-card-meta">
              {item.fonte && <span>{item.fonte}</span>}
              {formatarData(item.publicado_em) && (
                <span>{formatarData(item.publicado_em)}</span>
              )}
            </div>
            <strong>{item.titulo}</strong>
            {item.resumo && <p>{item.resumo}</p>}
            <span className="news-card-link">
              Ler notícia <ExternalLink size={12} />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function NoticiasSection() {
  const [noticias, setNoticias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const dados = await getNoticiasJuridicas();
        if (!ativo) return;
        setNoticias(dados?.noticias || []);
        setAviso(dados?.aviso || "");
      } catch (error) {
        if (ativo) setErro(error.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  const juridicas = noticias.filter((item) => item.categoria_id === "juridico");
  const criminais = noticias.filter((item) => item.categoria_id === "criminal");

  return (
    <section className="news-section" id="noticias">
      <div className="news-section-header">
        <Newspaper size={18} />
        <h3>Notícias do mundo jurídico e criminal</h3>
      </div>

      {erro && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          {erro}
        </div>
      )}
      {!erro && aviso && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          {aviso}
        </div>
      )}

      {carregando && <div className="empty-state">Carregando notícias...</div>}

      {!carregando && !erro && noticias.length === 0 && (
        <div className="empty-state">
          Nenhuma notícia disponível no momento.
        </div>
      )}

      {!carregando && noticias.length > 0 && (
        <div className="news-columns">
          <NoticiasColuna titulo="Mundo Jurídico" itens={juridicas} />
          <NoticiasColuna titulo="Mundo Criminal" itens={criminais} />
        </div>
      )}
    </section>
  );
}
