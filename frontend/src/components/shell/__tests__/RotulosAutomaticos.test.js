/**
 * @jest-environment jsdom
 */
import { fireEvent, render, waitFor } from "@testing-library/react";
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

  test("mostra e associa a orientação de campos complexos", () => {
    document.body.innerHTML = `
      <div class="form-field"><label>Número do processo</label><input /></div>`;
    render(<RotulosAutomaticos />);

    const campo = document.querySelector("input");
    const dica = document.querySelector(".field-hint");
    expect(dica.textContent).toContain("numeração única do CNJ");
    expect(campo.getAttribute("aria-describedby")).toContain(dica.id);
  });

  test("identifica visualmente campos obrigatórios sem duplicar o marcador", async () => {
    document.body.innerHTML = `
      <div class="form-field"><label>Nome</label><input required /></div>`;
    render(<RotulosAutomaticos />);

    await waitFor(() =>
      expect(document.querySelectorAll(".campo-obrigatorio")).toHaveLength(1)
    );
    expect(document.querySelector("label").textContent).toContain("obrigatório");
  });

  test("explica o erro junto ao campo e move o foco para ele", async () => {
    document.body.innerHTML = `
      <form><div class="form-field"><label>E-mail</label><input type="email" required /></div></form>`;
    render(<RotulosAutomaticos />);

    const campo = document.querySelector("input");
    fireEvent.invalid(campo);

    expect(document.querySelector(".field-error").textContent).toBe("Preencha o campo “E-mail”.");
    expect(campo.getAttribute("aria-invalid")).toBe("true");
    expect(campo.getAttribute("aria-describedby")).toContain("-erro");
    await waitFor(() => expect(document.activeElement).toBe(campo));
  });

  test("remove a mensagem quando o valor fica válido", () => {
    document.body.innerHTML = `
      <form><div class="form-field"><label>E-mail</label><input type="email" required /></div></form>`;
    render(<RotulosAutomaticos />);

    const campo = document.querySelector("input");
    fireEvent.invalid(campo);
    fireEvent.input(campo, { target: { value: "ana@exemplo.com" } });

    expect(document.querySelector(".field-error")).toBeNull();
    expect(campo.hasAttribute("aria-invalid")).toBe(false);
  });

  test("preserva o erro retornado pela API até o formulário limpar o estado", () => {
    document.body.innerHTML = `
      <form>
        <div class="form-field form-field-invalid">
          <label for="titulo">Título</label>
          <input id="titulo" aria-invalid="true" />
          <p class="field-error field-error-api">Este título já existe.</p>
        </div>
      </form>`;
    render(<RotulosAutomaticos />);

    const campo = document.querySelector("input");
    fireEvent.input(campo, { target: { value: "Novo título" } });

    expect(document.querySelector(".field-error-api").textContent).toBe(
      "Este título já existe."
    );
    expect(campo.getAttribute("aria-invalid")).toBe("true");
  });

  test("associa automaticamente erros da API ao campo com o mesmo name", () => {
    document.body.innerHTML = `
      <div class="overlay-panel"><form>
        <div class="form-field">
          <label for="email-cliente">E-mail</label>
          <input id="email-cliente" name="email" />
        </div>
      </form></div>`;
    render(<RotulosAutomaticos />);

    const campo = document.querySelector("input");
    campo.focus();
    window.dispatchEvent(
      new CustomEvent("lexnexo:erros-api", {
        detail: { campos: { email: "Este e-mail já está cadastrado." } },
      })
    );

    expect(document.querySelector(".field-error-api-automatico").textContent).toBe(
      "Este e-mail já está cadastrado."
    );
    expect(campo.getAttribute("aria-invalid")).toBe("true");

    fireEvent.input(campo, { target: { value: "novo@exemplo.com" } });
    expect(document.querySelector(".field-error-api-automatico")).toBeNull();
  });

  test("permite voltar uma etapa que preserva os dados sem pedir descarte", () => {
    const aoVoltar = jest.fn();
    window.confirm = jest.fn(() => false);
    const { getByRole, getByLabelText } = render(
      <><RotulosAutomaticos /><form>
        <label htmlFor="nome-etapa">Nome</label><input id="nome-etapa" name="nome" defaultValue="Ana" />
        <button type="button" data-preserva-formulario onClick={aoVoltar}>Voltar</button>
      </form></>
    );
    getByLabelText("Nome").focus();
    fireEvent.input(getByLabelText("Nome"), { target: { value: "Ana Maria" } });
    fireEvent.click(getByRole("button", { name: "Voltar" }));
    expect(aoVoltar).toHaveBeenCalled();
    expect(window.confirm).not.toHaveBeenCalled();
    expect(getByLabelText("Nome").value).toBe("Ana Maria");
  });

  test("avisa antes de cancelar um formulário com alterações", () => {
    const aoCancelar = jest.fn();
    window.confirm = jest.fn(() => false);
    const { getByRole, getByLabelText } = render(
      <>
        <RotulosAutomaticos />
        <div className="overlay-panel" role="dialog">
          <form>
            <div className="form-field">
              <label htmlFor="nome-protegido">Nome</label>
              <input id="nome-protegido" name="nome" defaultValue="Ana" />
            </div>
            <button type="button" onClick={aoCancelar}>Cancelar</button>
          </form>
        </div>
      </>
    );

    const campo = getByLabelText("Nome");
    campo.focus();
    fireEvent.input(campo, { target: { value: "Ana Maria" } });
    fireEvent.click(getByRole("button", { name: "Cancelar" }));

    expect(window.confirm).toHaveBeenCalledWith(
      "Há alterações não salvas. Deseja sair e descartá-las?"
    );
    expect(aoCancelar).not.toHaveBeenCalled();
  });
});
