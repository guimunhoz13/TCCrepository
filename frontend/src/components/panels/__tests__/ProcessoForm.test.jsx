/**
 * @jest-environment jsdom
 */
import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ProcessoForm from "../ProcessoForm";

const inicial = {
  numero_processo: "",
  titulo: "",
  descricao: "",
  status: "Em andamento",
  cliente: "",
  advogado: "",
  data_inicio: "",
  data_fim: "",
  area_direito: "",
  vara: "",
  comarca: "",
  valor_causa: "",
  nome_parte_contraria: "",
  nome_advogado_adverso: "",
  oab_advogado_adverso: "",
  percentual_honorarios_sucumbencia: "",
  sigiloso: false,
};

function FormularioControlado({ errosCampos = {}, onLimparErroCampo = jest.fn() }) {
  const [formulario, setFormulario] = useState(inicial);
  return (
    <ProcessoForm
      formulario={formulario}
      setFormulario={setFormulario}
      clientes={[{ id: 1, nome: "Ana Cliente" }]}
      advogados={[{ id: 2, nome: "Bruno Advogado" }]}
      onSubmit={(evento) => evento.preventDefault()}
      salvando={false}
      submitLabel="Cadastrar processo"
      errosCampos={errosCampos}
      onLimparErroCampo={onLimparErroCampo}
    />
  );
}

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = jest.fn();
});

test("explica as etapas e atualiza o progresso dos obrigatórios", () => {
  render(<FormularioControlado />);

  expect(screen.getByText("0 de 5 obrigatórios")).toBeTruthy();
  expect(screen.getByRole("navigation", { name: "Etapas do cadastro do processo" })).toBeTruthy();

  fireEvent.change(screen.getByLabelText(/Número do processo/), {
    target: { value: "0001234-56.2026.8.26.0100" },
  });
  fireEvent.change(screen.getByLabelText(/^Título/), { target: { value: "Cobrança" } });
  fireEvent.change(screen.getByLabelText(/^Descrição/), { target: { value: "Cobrança contratual" } });

  expect(screen.getByText("3 de 5 obrigatórios")).toBeTruthy();
  expect(screen.getByRole("button", { name: /Identificação/ }).className).toContain("concluida");
});

test("associa o erro da API ao campo e o limpa quando o usuário corrige", async () => {
  const limpar = jest.fn();
  render(
    <FormularioControlado
      errosCampos={{ numero_processo: "Este número já está cadastrado." }}
      onLimparErroCampo={limpar}
    />
  );

  const campo = screen.getByLabelText(/Número do processo/);
  expect(campo.getAttribute("aria-invalid")).toBe("true");
  expect(campo.getAttribute("aria-describedby")).toContain("numero_processo-erro");
  expect(screen.getByRole("alert").textContent).toBe("Este número já está cadastrado.");
  await waitFor(() => expect(document.activeElement).toBe(campo));

  fireEvent.change(campo, { target: { value: "0009999-11.2026.8.26.0100" } });
  expect(limpar).toHaveBeenCalledWith("numero_processo");
});
