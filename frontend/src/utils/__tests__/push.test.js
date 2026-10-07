import { chaveParaBytes } from "../push";

test("converte a chave pública VAPID (base64url) para bytes", () => {
  // 65 bytes: 0x04 + coordenadas X e Y do ponto P-256.
  const bytes = new Uint8Array(65).map((_, i) => (i === 0 ? 4 : i));
  const base64url = Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  expect(Array.from(chaveParaBytes(base64url))).toEqual(Array.from(bytes));
});
