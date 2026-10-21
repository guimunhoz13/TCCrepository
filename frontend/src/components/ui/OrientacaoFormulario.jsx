import { CircleHelp } from "lucide-react";

/** Introdução curta para explicar objetivo, sequência e campos de um formulário. */
export default function OrientacaoFormulario({ titulo, descricao, etapas = [] }) {
  return (
    <aside className="orientacao-formulario" aria-label={`Orientação: ${titulo}`}>
      <span className="orientacao-formulario-icone" aria-hidden="true">
        <CircleHelp size={18} />
      </span>
      <div>
        <strong>{titulo}</strong>
        <p>{descricao}</p>
        {etapas.length > 0 && (
          <ol aria-label="Sequência recomendada">
            {etapas.map((etapa) => <li key={etapa}>{etapa}</li>)}
          </ol>
        )}
      </div>
    </aside>
  );
}
