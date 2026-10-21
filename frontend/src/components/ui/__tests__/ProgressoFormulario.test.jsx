/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import ProgressoFormulario from "../ProgressoFormulario";


test("mostra o progresso e identifica os itens concluídos", () => {
  render(
    <ProgressoFormulario
      itens={[
        { rotulo: "Nome", concluido: true },
        { rotulo: "E-mail", concluido: false },
        { rotulo: "Telefone", concluido: true },
      ]}
    />
  );

  expect(screen.getByText("2 de 3 itens essenciais preenchidos")).toBeTruthy();
  expect(screen.getByRole("progressbar").getAttribute("value")).toBe("2");
  expect(screen.getByText("✓ Nome").classList.contains("concluido")).toBe(true);
  expect(screen.getByText("• E-mail").classList.contains("concluido")).toBe(false);
});
