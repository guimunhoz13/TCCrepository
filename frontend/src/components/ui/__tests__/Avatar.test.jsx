/** @jest-environment jsdom */
import { render, waitFor } from "@testing-library/react";
import Avatar from "../Avatar";
import { buscarFotoAutenticada, fotoProtegida } from "../../../services/api";

jest.mock("../../../services/api", () => ({
  buscarFotoAutenticada: jest.fn(),
  fotoProtegida: jest.fn((src) => Boolean(src?.includes("/api/fotos/"))),
}));

describe("Avatar", () => {
  beforeEach(() => {
    global.URL.createObjectURL = jest.fn(() => "blob:foto-autenticada");
    global.URL.revokeObjectURL = jest.fn();
    jest.clearAllMocks();
  });

  test("busca foto protegida com a API e libera o blob ao desmontar", async () => {
    buscarFotoAutenticada.mockResolvedValue(new Blob(["foto"], { type: "image/png" }));
    const src = "http://localhost:8000/api/fotos/usuarios/fotos/perfil.png";
    const { container, unmount } = render(<Avatar src={src} nome="Ana" />);
    await waitFor(() => expect(container.querySelector("img")?.src).toBe("blob:foto-autenticada"));
    expect(fotoProtegida).toHaveBeenCalledWith(src);
    expect(buscarFotoAutenticada).toHaveBeenCalledWith(src);
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:foto-autenticada");
  });

  test("mostra inicial enquanto não há foto", () => {
    const { container } = render(<Avatar nome="Beatriz" />);
    expect(container.querySelector(".avatar-fallback")?.textContent).toBe("B");
  });
});
