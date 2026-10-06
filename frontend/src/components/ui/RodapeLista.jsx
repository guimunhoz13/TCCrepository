"use client";

/** Rodapé das tabelas paginadas: quantos itens aparecem do total e o botão
 *  para buscar a próxima página. */
export default function RodapeLista({ quantidade, total, temMais, carregandoMais, onCarregarMais }) {
  if (!total || (!temMais && quantidade === total)) return null;

  return (
    <div className="rodape-lista">
      <span>
        Mostrando {quantidade} de {total}
      </span>
      {temMais && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onCarregarMais}
          disabled={carregandoMais}
        >
          {carregandoMais ? "Carregando..." : "Carregar mais"}
        </button>
      )}
    </div>
  );
}
