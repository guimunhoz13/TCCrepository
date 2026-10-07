/**
 * Inscrição do aparelho nas notificações push (Web Push).
 *
 * O navegador só entrega push a um service worker registrado — por isso
 * funciona no sistema publicado (produção) e, no iPhone, apenas com o
 * LexOffice instalado na tela de início (iOS 16.4+).
 */

/** Chave pública VAPID (base64url) no formato que o PushManager pede. */
export function chaveParaBytes(base64url) {
  const preenchido = base64url + "=".repeat((4 - (base64url.length % 4)) % 4);
  const binario = atob(preenchido.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binario, (letra) => letra.charCodeAt(0));
}

// Sem acesso ao serviço de push (rede bloqueada, por exemplo), o navegador
// pode ficar esperando para sempre; o botão não pode ficar travado.
const LIMITE_INSCRICAO_MS = 20000;

function comLimiteDeTempo(promessa) {
  return Promise.race([
    promessa,
    new Promise((_, rejeitar) =>
      setTimeout(() => rejeitar(new Error("o serviço de notificações do navegador não respondeu")), LIMITE_INSCRICAO_MS)
    ),
  ]);
}

export function pushSuportado() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function registroDoServiceWorker() {
  const registro = await navigator.serviceWorker.getRegistration("/");
  if (!registro) {
    throw new Error(
      "O aplicativo ainda não terminou de instalar neste navegador. Recarregue a página e tente de novo."
    );
  }
  return navigator.serviceWorker.ready;
}

export async function inscricaoAtual() {
  if (!pushSuportado()) return null;
  const registro = await navigator.serviceWorker.getRegistration("/");
  return registro ? registro.pushManager.getSubscription() : null;
}

/** Pede permissão e inscreve este aparelho. Devolve a inscrição (JSON). */
export async function inscreverEsteAparelho(chavePublica) {
  if (!pushSuportado()) {
    throw new Error("Este navegador não aceita notificações. No iPhone, instale o LexOffice na tela de início.");
  }
  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") {
    throw new Error("As notificações foram bloqueadas. Libere nas configurações do navegador para este site.");
  }
  const registro = await registroDoServiceWorker();
  let inscricao;
  try {
    inscricao =
      (await registro.pushManager.getSubscription()) ||
      (await comLimiteDeTempo(
        registro.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: chaveParaBytes(chavePublica),
        })
      ));
  } catch (erro) {
    // A mensagem do navegador vem em inglês e não diz o que fazer.
    throw new Error(
      "O navegador não conseguiu ativar as notificações. Em janela anônima elas não funcionam; " +
        `abra o sistema numa janela normal e tente de novo. (${erro?.message || erro})`
    );
  }
  return inscricao.toJSON();
}

/** Cancela a inscrição deste aparelho. Devolve o endpoint cancelado. */
export async function cancelarEsteAparelho() {
  const inscricao = await inscricaoAtual();
  if (!inscricao) return null;
  const endpoint = inscricao.endpoint;
  await inscricao.unsubscribe();
  return endpoint;
}
