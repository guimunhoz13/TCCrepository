export function limparTelefone(telefone) {
  return (telefone || "").replace(/\D/g, "");
}

/**
 * Monta um link wa.me com a mensagem pronta. Números sem código de país
 * são tratados como brasileiros (DDD + número) e recebem o prefixo 55 —
 * ajuste manual é possível no campo de telefone antes de enviar.
 */
export function construirLinkWhatsApp(telefone, mensagem) {
  const numeros = limparTelefone(telefone);
  if (!numeros) return null;
  const comCodigoPais = numeros.length > 11 ? numeros : `55${numeros}`;
  return `https://wa.me/${comCodigoPais}?text=${encodeURIComponent(mensagem)}`;
}

export function abrirWhatsApp(telefone, mensagem) {
  const link = construirLinkWhatsApp(telefone, mensagem);
  if (!link) return false;
  window.open(link, "_blank", "noopener,noreferrer");
  return true;
}

export function montarMensagemCliente(cliente) {
  return (
    `Olá${cliente.nome ? " " + cliente.nome.split(" ")[0] : ""}, seguem os detalhes do seu cadastro:\n\n` +
    `Cliente: ${cliente.nome || "—"}\n` +
    `CPF: ${cliente.cpf || "—"}\n` +
    `E-mail: ${cliente.email || "—"}\n` +
    `Status: ${cliente.ativo ? "Ativo" : "Inativo"}`
  );
}

export function montarMensagemProcesso(processo) {
  const status = processo.status === "Concluido" ? "Concluído" : processo.status;
  return (
    "Olá, seguem os detalhes do processo:\n\n" +
    `Processo: ${processo.numero_processo || "—"}\n` +
    `Título: ${processo.titulo || "—"}\n` +
    `Status: ${status || "—"}\n` +
    (processo.cliente_nome ? `Cliente: ${processo.cliente_nome}\n` : "") +
    (processo.advogado_nome ? `Advogado responsável: ${processo.advogado_nome}` : "")
  );
}
