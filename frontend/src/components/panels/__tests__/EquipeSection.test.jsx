/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { EquipeSection } from "../ConfigPanel";
import { alternarAtivoDoUsuario, excluirUsuario } from "../../../services/api";

const confirmar = jest.fn();
jest.mock("../../../contexts/ConfirmacaoContext", () => ({
  useConfirmacao: () => confirmar,
}));
jest.mock("../../../services/api", () => ({
  alternarAtivoDoUsuario: jest.fn(),
  excluirUsuario: jest.fn(),
}));
jest.mock("../../../hooks/useFotoProtegida", () => () => null);

const ADMIN = { id: 1, nome: "Admin", email: "admin@example.com", tipo_usuario: "admin", ativo: true };
const MEMBRO = { id: 2, nome: "Bia", email: "bia@example.com", tipo_usuario: "secretaria", ativo: true };

beforeEach(() => {
  jest.clearAllMocks();
  confirmar.mockResolvedValue(true);
});

test("administrador pode desativar e excluir outro usuário, mas não a própria conta", async () => {
  const setDados = jest.fn();
  const feedback = jest.fn();
  alternarAtivoDoUsuario.mockResolvedValue({ ...MEMBRO, ativo: false });
  excluirUsuario.mockResolvedValue(null);

  render(
    <EquipeSection
      dados={{ usuario: ADMIN, membros: [ADMIN, MEMBRO] }}
      setDados={setDados}
      feedback={feedback}
      admin
    />
  );

  expect(screen.getAllByRole("button", { name: "Desativar acesso" })).toHaveLength(1);
  expect(screen.getAllByRole("button", { name: "Excluir" })).toHaveLength(1);

  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Desativar acesso" })));
  expect(alternarAtivoDoUsuario).toHaveBeenCalledWith(MEMBRO.id);

  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Excluir" })));
  expect(excluirUsuario).toHaveBeenCalledWith(MEMBRO.id);
  expect(setDados).toHaveBeenCalled();
});

test("cancelar a confirmação não exclui o usuário", async () => {
  confirmar.mockResolvedValue(false);
  render(
    <EquipeSection
      dados={{ usuario: ADMIN, membros: [ADMIN, MEMBRO] }}
      setDados={jest.fn()}
      feedback={jest.fn()}
      admin
    />
  );

  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Excluir" })));
  expect(excluirUsuario).not.toHaveBeenCalled();
});
