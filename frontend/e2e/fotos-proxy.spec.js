import { expect, test } from "@playwright/test";

test.use({ trace: "off" });

test("foto autenticada chega intacta pelo proxy da interface", async ({ request, baseURL }) => {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  // Este cenário grava somente no banco exclusivo de E2E.
  expect(["127.0.0.1", "localhost"]).toContain(new URL(api).hostname);
  expect(["127.0.0.1", "localhost"]).toContain(new URL(baseURL).hostname);
  const login = await request.post(`${api}/login/`, {
    data: { email: "admin@demo.lexnexo.app", senha: "Demo@1234" },
  });
  expect(login.status()).toBe(200);
  const { access } = await login.json();
  const headers = { Authorization: `Bearer ${access}` };
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAIAAABMXPacAAABL0lEQVR4nO3TMREAMAwDsbRYwx9DYPwiEfDw57e7Q+eH2wjQ84CYADEBYgLEBIgJEBMgJkBMgJgAMQFiAsQEiAkQEyAmQEyAmAAxAWICxASICRATICZATICYADEBYgLEBIgJEBMgJkBMgJgAMQFiAsQEiAkQEyAmQEyAmAAxAWICxASICRATICZATICYADEBYgLEBIgJEBMgJkBMgJgAMQFiAsQEiAkQEyAmQEyAmAAxAWICxASICRATICZATICYADEBYgLEBIgJEBMgJkBMgJgAMQFiAsQEiAkQEyAmQEyAmAAxAWICxASICRATICZATICYADEBYgLEBIgJEBMgJkBMgJgAMQFiAsQEiAkQEyAmQEyAmAAxAWICxASICRATICZATICYADEBYgLEBJjWAacGAixmW2LIAAAAAElFTkSuQmCC", "base64");
  const salvar = await request.patch(`${api}/configuracoes/conta/`, {
    headers, multipart: { foto: { name: "foto-sintetica.png", mimeType: "image/png", buffer: png } },
  });
  expect(salvar.status()).toBe(200);
  const caminho = new URL((await salvar.json()).usuario.foto, api).pathname;
  const direto = await request.get(new URL(caminho, api).href, { headers });
  expect(direto.status()).toBe(200);
  const proxy = await request.get(new URL(caminho, baseURL).href, { headers });
  expect(proxy.status()).toBe(200);
  expect(proxy.headers()["content-type"]).toContain("image/webp");
  expect(await proxy.body()).toEqual(await direto.body());
  const anonimo = await request.get(new URL(caminho, baseURL).href);
  expect(anonimo.status()).toBe(401);
});
