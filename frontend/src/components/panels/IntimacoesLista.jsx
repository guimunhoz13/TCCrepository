"use client";

import { useState } from "react";
import { CheckCheck, ExternalLink, RefreshCw } from "lucide-react";
import { useListaPaginada } from "@/hooks/useRecurso";
import { useAvisos } from "@/contexts/AvisosContext";
import { usePanel, PANELS } from "@/contexts/PanelContext";
import RodapeLista from "@/components/ui/RodapeLista";
import { buscarIntimacoesNoDjen, getIntimacoes, marcarIntimacaoComoLida } from "@/services/api";
import { formatarData } from "@/utils/formato";

const TAMANHO_RESUMO = 320;

export function descreverPrazo(intimacao) {
  if (!intimacao.prazo_final) return null;
  const tipo = intimacao.prazo_dias_uteis ? "úteis" : "corridos";
  const base = `${intimacao.prazo_dias} dias ${tipo} · vence ${formatarData(intimacao.prazo_final)}`;
  return intimacao.prazo_estimado ? `${base} (estimado — confira)` : base;
}

function Intimacao({ intimacao, podeEditar, onLida, onAbrirProcesso }) {
  const [aberta, setAberta] = useState(false);
  const longa = intimacao.texto.length > TAMANHO_RESUMO;
  const texto = aberta || !longa ? intimacao.texto : `${intimacao.texto.slice(0, TAMANHO_RESUMO)}…`;
  const prazo = descreverPrazo(intimacao);

  return (
    <li className={`intimacao ${intimacao.lida ? "lida" : ""}`}>
      <div className="intimacao-topo">
        <strong>{intimacao.tipo_comunicacao}</strong>
        <span className="intimacao-origem">
          {intimacao.tribunal} · {intimacao.orgao}
        </span>
        {!intimacao.lida && <span className="badge badge-warning">Nova</span>}
      </div>
      <div className="intimacao-meta">
        {intimacao.processo ? (
          <button type="button" className="link-botao" onClick={() => onAbrirProcesso(intimacao.processo)}>
            {intimacao.numero_processo}
          </button>
        ) : (
          <span title="Processo não cadastrado no sistema">{intimacao.numero_processo} (não cadastrado)</span>
        )}
        {intimacao.cliente_nome && <span>{intimacao.cliente_nome}</span>}
        <span>Publicada em {formatarData(intimacao.data_publicacao)}</span>
        {intimacao.advogado_nome && <span>Para {intimacao.advogado_nome}</span>}
      </div>
      {prazo && (
        <span className={`badge ${intimacao.prazo_estimado ? "badge-warning" : "badge-danger"}`}>
          Prazo: {prazo}
        </span>
      )}
      <p className="intimacao-texto">{texto}</p>
      <div className="export-row">
        {longa && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAberta(!aberta)} aria-expanded={aberta}>
            {aberta ? "Mostrar menos" : "Ler tudo"}
          </button>
        )}
        {intimacao.link && (
          <a className="btn btn-secondary btn-sm" href={intimacao.link} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={14} /> Ver no DJEN
          </a>
        )}
        {podeEditar && !intimacao.lida && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onLida(intimacao)}>
            <CheckCheck size={14} /> Marcar como lida
          </button>
        )}
      </div>
    </li>
  );
}

/**
 * Intimações do DJEN em nome dos advogados do escritório, com o prazo já
 * calculado e lançado na agenda.
 */
export default function IntimacoesLista({ ativo, podeEditar }) {
  const avisar = useAvisos();
  const { openPanel } = usePanel();
  const [somenteNovas, setSomenteNovas] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const lista = useListaPaginada(
    (page) => getIntimacoes({ page, ...(somenteNovas ? { lida: "false" } : {}) }),
    [somenteNovas],
    { ativo }
  );

  async function buscar() {
    try {
      setBuscando(true);
      const res = await buscarIntimacoesNoDjen();
      avisar(res.detail);
      lista.recarregar();
    } catch (e) {
      avisar(e.message, "erro");
    } finally {
      setBuscando(false);
    }
  }

  async function marcarLida(intimacao) {
    try {
      await marcarIntimacaoComoLida(intimacao.id);
      lista.recarregar();
    } catch (e) {
      avisar(e.message, "erro");
    }
  }

  return (
    <div>
      <div className="quadro-filtros">
        <label className="toggle-row" style={{ border: 0, padding: 0, gap: 10 }}>
          <span className="toggle-label">Só as não lidas</span>
          <span className="switch">
            <input type="checkbox" checked={somenteNovas} onChange={(e) => setSomenteNovas(e.target.checked)} />
            <span className="switch-track" />
          </span>
        </label>
        {podeEditar && (
          <button type="button" className="btn btn-primary btn-sm" onClick={buscar} disabled={buscando}>
            <RefreshCw size={14} /> {buscando ? "Buscando…" : "Buscar no DJEN"}
          </button>
        )}
      </div>
      <p className="dica-campo" style={{ marginTop: 0, marginBottom: 14 }}>
        Busca pela OAB de cada advogado no Diário de Justiça Eletrônico Nacional. O prazo
        conta do primeiro dia útil após a publicação, sem fins de semana, feriados nacionais,
        recesso forense e os feriados locais cadastrados na agenda — confira o texto antes de
        confiar na data.
      </p>

      {lista.erro && <div className="alert alert-error">{lista.erro}</div>}
      {lista.carregando && lista.itens.length === 0 && <div className="empty-state">Carregando…</div>}
      {!lista.carregando && lista.itens.length === 0 && (
        <div className="empty-state">
          {somenteNovas ? "Nenhuma intimação nova." : "Nenhuma intimação importada ainda."}
        </div>
      )}
      <ul className="lista-intimacoes">
        {lista.itens.map((intimacao) => (
          <Intimacao
            key={intimacao.id}
            intimacao={intimacao}
            podeEditar={podeEditar}
            onLida={marcarLida}
            onAbrirProcesso={(processoId) => openPanel(PANELS.PROCESSOS, "ficha", { processoId })}
          />
        ))}
      </ul>
      <RodapeLista
        quantidade={lista.itens.length}
        total={lista.total}
        temMais={lista.temMais}
        carregandoMais={lista.carregandoMais}
        onCarregarMais={lista.carregarMais}
      />
    </div>
  );
}
