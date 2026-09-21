/* Service worker do LexOffice.
 *
 * Existe por dois motivos: deixar o sistema instalável como aplicativo e
 * abrir uma tela explicando a falta de conexão em vez do erro cru do
 * navegador.
 *
 * O que ele NÃO faz, de propósito: guardar resposta de API. O sistema é
 * multi-escritório e autenticado por token — um cache de /api/ no disco
 * do navegador entregaria dados de um cliente a quem usasse o mesmo
 * aparelho depois, e ainda mostraria processo desatualizado como se
 * fosse o estado atual. Só os arquivos estáticos do próprio build são
 * guardados.
 */

// Trocar a versão invalida o cache anterior inteiro no próximo deploy.
const VERSAO = "lexoffice-v1";
const PAGINA_OFFLINE = "/offline";

const ESSENCIAIS = [PAGINA_OFFLINE, "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(VERSAO)
      .then((cache) => cache.addAll(ESSENCIAIS))
      // Um essencial que não baixe não pode impedir a instalação: sem
      // service worker o sistema deixaria de ser instalável.
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(chaves.filter((chave) => chave !== VERSAO).map((chave) => caches.delete(chave)))
      )
      .then(() => self.clients.claim())
  );
});

function ehEstaticoDoBuild(url) {
  // Arquivos versionados pelo Next (hash no nome) e os ícones do app.
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon-") ||
    url.pathname === "/favicon.ico"
  );
}

self.addEventListener("fetch", (evento) => {
  const requisicao = evento.request;

  if (requisicao.method !== "GET") return;

  const url = new URL(requisicao.url);

  // Outra origem (o back-end, fontes do Google) segue direto para a rede.
  if (url.origin !== self.location.origin) return;

  // Chamada de API nunca é servida do cache — nem para responder offline.
  if (url.pathname.startsWith("/api/")) return;

  if (ehEstaticoDoBuild(url)) {
    evento.respondWith(
      caches.match(requisicao).then(
        (guardado) =>
          guardado ||
          fetch(requisicao).then((resposta) => {
            if (resposta.ok) {
              const copia = resposta.clone();
              caches.open(VERSAO).then((cache) => cache.put(requisicao, copia));
            }
            return resposta;
          })
      )
    );
    return;
  }

  // Navegação: tenta a rede e, sem ela, mostra a tela de offline.
  if (requisicao.mode === "navigate") {
    evento.respondWith(
      fetch(requisicao).catch(() =>
        caches.match(PAGINA_OFFLINE).then(
          (guardado) =>
            guardado ||
            new Response("Sem conexão.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
        )
      )
    );
  }
});
