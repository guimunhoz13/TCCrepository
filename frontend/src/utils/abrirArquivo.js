/** Reserva a aba durante o clique; a API pode responder após expirar a ativação. */
export async function abrirArquivo(obterBlob, nomeArquivo = "documento") {
  const janela = window.open("", "_blank");
  if (janela) janela.opener = null;
  let url;
  try {
    const blob = await obterBlob();
    url = URL.createObjectURL(blob);
    if (janela && !janela.closed) {
      janela.location.replace(url);
      return "aba";
    }
    // Navegadores incorporados podem impedir qualquer popup. O arquivo ainda
    // pode ser salvo, sem expor URL autenticada nem token no endereço.
    const link = document.createElement("a");
    link.href = url;
    const extensao = {
      "application/pdf": ".pdf", "image/png": ".png", "image/jpeg": ".jpg",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    }[blob.type] || "";
    link.download = /\.[a-z0-9]+$/i.test(nomeArquivo) ? nomeArquivo : nomeArquivo + extensao;
    document.body.appendChild(link);
    link.click();
    link.remove();
    return "download";
  } catch (erro) {
    if (janela && !janela.closed) janela.close();
    throw erro;
  } finally {
    if (url) setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}
