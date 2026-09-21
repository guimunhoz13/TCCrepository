import {
  STATUS_PROCESSO,
  ordemStatus,
  rotuloStatus,
  badgeStatus,
  corStatus,
} from "../statusProcesso";

describe("status do processo", () => {
  test("cobre os quatro status do modelo", () => {
    expect(STATUS_PROCESSO.map((s) => s.valor)).toEqual([
      "Em andamento",
      "Concluido",
      "Suspenso",
      "Arquivado",
    ]);
  });

  test("acentua Concluído, que no banco é gravado sem acento", () => {
    expect(rotuloStatus("Concluido")).toBe("Concluído");
  });

  test("cada status tem um selo próprio — nenhum par se confunde", () => {
    const selos = STATUS_PROCESSO.map((s) => s.badge);
    expect(new Set(selos).size).toBe(selos.length);
  });

  test("a cor vem da identidade do status, não da posição na lista", () => {
    // Um escritório sem processos suspensos não pode fazer Arquivado
    // herdar a cor de Suspenso.
    const semSuspenso = ["Em andamento", "Concluido", "Arquivado"];
    expect(semSuspenso.map((v) => corStatus(v, "light"))).toEqual([
      "#b5791f",
      "#1f7a52",
      "#8a91a6",
    ]);
  });

  test("cada tema tem sua própria cor, validada contra o fundo dele", () => {
    for (const status of STATUS_PROCESSO) {
      expect(corStatus(status.valor, "light")).not.toBe(corStatus(status.valor, "dark"));
    }
  });

  test("status desconhecido não quebra nem rouba a cor de outro", () => {
    expect(rotuloStatus("Inexistente")).toBe("Inexistente");
    expect(badgeStatus("Inexistente")).toBe("badge-muted");
    expect(ordemStatus("Inexistente")).toBe(STATUS_PROCESSO.length);
    expect(corStatus("Inexistente", "light")).toBe("#8a91a6");
  });

  test("a ordem mantém verde e ameixa longe do âmbar", () => {
    expect(ordemStatus("Em andamento")).toBeLessThan(ordemStatus("Concluido"));
    expect(ordemStatus("Suspenso")).toBeLessThan(ordemStatus("Arquivado"));
  });
});
