import {
  escritorioAindaVazio,
  primeirosPassos,
  progressoDosPassos,
} from "../onboarding";

const usuario = { nome: "Ana", email: "ana@exemplo.com" };
const stats = {
  escritorio: { nome: "Silva Advocacia" },
  totais: { clientes: 1, processos: 0, agenda: 1, documentos: 0 },
};

describe("onboarding", () => {
  test("calcula o progresso a partir dos dados reais do escritório", () => {
    const passos = primeirosPassos({ stats, usuario });
    expect(progressoDosPassos(passos)).toEqual({ concluidos: 3, total: 5, percentual: 60 });
  });

  test("orienta a cadastrar cliente antes do processo", () => {
    const semCliente = { ...stats, totais: { ...stats.totais, clientes: 0 } };
    const processo = primeirosPassos({ stats: semCliente, usuario }).find((p) => p.id === "processo");
    expect(processo.painel).toBe("clientes");
    expect(processo.acao).toContain("cliente primeiro");
  });

  test("não oferece etapas que o perfil não pode criar", () => {
    const passos = primeirosPassos({
      stats,
      usuario,
      pode: (area) => area !== "documentos",
    });
    expect(passos.some((passo) => passo.id === "documento")).toBe(false);
  });

  test("identifica um escritório sem dados operacionais", () => {
    expect(escritorioAindaVazio({ totais: {} })).toBe(true);
    expect(escritorioAindaVazio(stats)).toBe(false);
  });
});
