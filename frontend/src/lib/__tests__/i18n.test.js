import { traduzir, IDIOMAS_SUPORTADOS } from "../i18n";

describe("IDIOMAS_SUPORTADOS", () => {
  test("inclui português, inglês e espanhol", () => {
    expect(IDIOMAS_SUPORTADOS).toEqual(["pt-BR", "en-US", "es-ES"]);
  });
});

describe("traduzir", () => {
  test("retorna a tradução correta para cada idioma suportado", () => {
    expect(traduzir("pt-BR", "nav_dashboard")).toBe("Dashboard");
    expect(traduzir("en-US", "nav_dashboard")).toBe("Dashboard");
    expect(traduzir("es-ES", "nav_clientes")).not.toBe("nav_clientes");
  });

  test("recai para pt-BR quando o idioma não é suportado", () => {
    expect(traduzir("fr-FR", "nav_dashboard")).toBe(
      traduzir("pt-BR", "nav_dashboard")
    );
  });

  test("recai para a própria chave quando ela não existe em nenhum dicionário", () => {
    expect(traduzir("pt-BR", "chave_que_nao_existe")).toBe(
      "chave_que_nao_existe"
    );
  });
});
