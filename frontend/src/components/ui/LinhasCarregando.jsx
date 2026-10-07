/** Linhas-fantasma enquanto a tabela carrega: a lista já aparece com a forma
 *  final e não "pula" quando os dados chegam. */
export default function LinhasCarregando({ colunas, linhas = 3 }) {
  return Array.from({ length: linhas }, (_, linha) => (
    <tr key={linha} className="linha-carregando" aria-hidden="true">
      {Array.from({ length: colunas }, (_, coluna) => (
        <td key={coluna}>
          <span className="skeleton skeleton-texto" />
        </td>
      ))}
    </tr>
  ));
}
