/**
 * @jest-environment jsdom
 */
import { render, waitFor } from "@testing-library/react";
import RotulosAutomaticos from "../RotulosAutomaticos";

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

describe("RotulosAutomaticos — tabelas", () => {
  test("copia o cabeçalho de cada coluna para o data-label da célula", () => {
    montarTabela();
    render(<RotulosAutomaticos />);

    const celulas = document.querySelectorAll("tbody tr:first-child td");
    expect([...celulas].map((td) => td.dataset.label)).toEqual(["Nome", "Status"]);
  });

  test("linha que ocupa a tabela inteira (vazio, carregando) fica sem rótulo", () => {
    montarTabela();
    render(<RotulosAutomaticos />);

    expect(document.querySelector("td[colspan]").dataset.label).toBe("");
  });

  test("rotula também as linhas que aparecem depois", async () => {
    montarTabela();
    render(<RotulosAutomaticos />);

    const linha = document.createElement("tr");
    linha.innerHTML = "<td>João</td><td>Inativo</td>";
    document.querySelector("tbody").appendChild(linha);

    await waitFor(() => expect(linha.children[1].dataset.label).toBe("Status"));
  });
});

describe("RotulosAutomaticos — formulários", () => {
  test("liga o label ao campo do mesmo bloco", () => {
    document.body.innerHTML = `
      <div class="form-field"><label>Nome</label><input type="text" /></div>
      <div class="form-field"><label>Estado civil</label><select><option>-</option></select></div>`;
    render(<RotulosAutomaticos />);

    const [nome, estado] = document.querySelectorAll("label");
    expect(document.getElementById(nome.htmlFor).tagName).toBe("INPUT");
    expect(document.getElementById(estado.htmlFor).tagName).toBe("SELECT");
  });

  test("respeita o id que o campo já tem", () => {
    document.body.innerHTML = `<div class="form-field"><label>E-mail</label><input id="email" /></div>`;
    render(<RotulosAutomaticos />);

    expect(document.querySelector("label").htmlFor).toBe("email");
  });

  test("não mexe em label que já envolve o campo", () => {
    document.body.innerHTML = `<div class="form-field"><label>Ativo <input type="checkbox" /></label></div>`;
    render(<RotulosAutomaticos />);

    expect(document.querySelector("label").htmlFor).toBe("");
  });
});
