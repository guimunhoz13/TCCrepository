"use client";

/** Resumo reutilizável dos campos essenciais de um cadastro longo.
 * Recebe a regra de conclusão pronta para também representar confirmações,
 * arquivos e campos condicionais sem tentar adivinhar pelo DOM. */
export default function ProgressoFormulario({ itens, titulo = "Progresso do cadastro" }) {
  const concluidos = itens.filter((item) => item.concluido).length;
  const total = itens.length;
  const percentual = total ? Math.round((concluidos / total) * 100) : 100;

  return (
    <section className="form-progress" aria-label={titulo}>
      <div className="form-progress-header">
        <div>
          <strong>{titulo}</strong>
          <span>{concluidos} de {total} itens essenciais preenchidos</span>
        </div>
        <strong aria-hidden="true">{percentual}%</strong>
      </div>
      <progress
        value={concluidos}
        max={total}
        aria-label={`${concluidos} de ${total} itens essenciais preenchidos`}
      />
      <div className="form-progress-items" aria-label="Itens essenciais">
        {itens.map((item) => (
          <span key={item.rotulo} className={item.concluido ? "concluido" : ""}>
            {item.concluido ? "✓" : "•"} {item.rotulo}
          </span>
        ))}
      </div>
    </section>
  );
}
