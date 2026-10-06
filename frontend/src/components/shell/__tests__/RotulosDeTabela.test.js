/**
 * @jest-environment jsdom
 */
import { render, waitFor } from "@testing-library/react";
import RotulosDeTabela from "../RotulosDeTabela";

function montarTabela() {
  document.body.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Nome</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>Maria</td><td>Ativo</td></tr>
          <tr><td colspan="2">Nenhum registro</td></tr>
        </tbody>
      </table>
    </div>`;
}

describe("RotulosDeTabela", () => {
  test("copia o cabeçalho de cada coluna para o data-label da célula", () => {
    montarTabela();
    render(<RotulosDeTabela />);

    const celulas = document.querySelectorAll("tbody tr:first-child td");
    expect([...celulas].map((td) => td.dataset.label)).toEqual(["Nome", "Status"]);
  });

  test("linha que ocupa a tabela inteira (vazio, carregando) fica sem rótulo", () => {
    montarTabela();
    render(<RotulosDeTabela />);

    expect(document.querySelector("td[colspan]").dataset.label).toBe("");
  });

  test("rotula também as linhas que aparecem depois", async () => {
    montarTabela();
    render(<RotulosDeTabela />);

    const linha = document.createElement("tr");
    linha.innerHTML = "<td>João</td><td>Inativo</td>";
    document.querySelector("tbody").appendChild(linha);

    await waitFor(() => expect(linha.children[1].dataset.label).toBe("Status"));
  });
});
