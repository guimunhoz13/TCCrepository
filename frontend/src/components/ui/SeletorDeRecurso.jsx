"use client";

import { useId, useState } from "react";
import { useListaPaginada } from "@/hooks/useRecurso";
import { useValorAtrasado } from "@/hooks/useValorAtrasado";

/** Pesquisa no servidor: nenhum registro fica inacessível após a primeira página. */
export default function SeletorDeRecurso({ rotulo, buscar, chaves = [], valor, selecionado, onChange, descrever }) {
  const id = useId();
  const [termo, setTermo] = useState("");
  const busca = useValorAtrasado(termo, 250);
  const lista = useListaPaginada(
    (page) => buscar({ busca, page, page_size: 20 }),
    [busca, ...chaves]
  );
  const itens = selecionado && !lista.itens.some((item) => String(item.id) === String(selecionado.id))
    ? [selecionado, ...lista.itens] : lista.itens;

  return (
    <div className="seletor-recurso">
      <label htmlFor={`${id}-busca`}>Buscar {rotulo.toLowerCase()}</label>
      <input id={`${id}-busca`} type="search" value={termo} placeholder="Digite nome ou número"
        onChange={(event) => setTermo(event.target.value)} aria-describedby={`${id}-estado`} />
      <label htmlFor={`${id}-selecao`}>{rotulo} em foco (opcional)</label>
      <select id={`${id}-selecao`} value={valor} onChange={(event) => {
        const item = itens.find((item) => String(item.id) === event.target.value);
        onChange(item || null);
      }}>
        <option value="">Sem {rotulo.toLowerCase()} selecionado</option>
        {itens.map((item) => <option key={item.id} value={item.id}>{descrever(item)}</option>)}
      </select>
      <small id={`${id}-estado`} role="status">
        {lista.erro || (lista.carregando ? "Buscando…" : `${lista.itens.length} de ${lista.total} encontrados`)}
      </small>
      {lista.temMais && <button type="button" className="link-botao" onClick={lista.carregarMais} disabled={lista.carregandoMais}>
        {lista.carregandoMais ? "Carregando…" : "Carregar mais resultados"}
      </button>}
    </div>
  );
}
