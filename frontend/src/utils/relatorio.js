function formatarData(valor, comHora = false) {
  if (!valor) return "—";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";
  return comHora ? data.toLocaleString("pt-BR") : data.toLocaleDateString("pt-BR");
}

function statusLabel(status) {
  return status === "Concluido" ? "Concluído" : status;
}

function escapar(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function tabela(colunas, linhas, vazio) {
  if (!linhas.length) {
    return `<p class="vazio">${escapar(vazio)}</p>`;
  }
  const cabecalho = colunas.map((c) => `<th>${escapar(c)}</th>`).join("");
  const corpo = linhas
    .map((linha) => `<tr>${linha.map((valor) => `<td>${valor}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${cabecalho}</tr></thead><tbody>${corpo}</tbody></table>`;
}

function casca({ titulo, subtitulo, escritorio, geradoEm, corpo }) {
  return `<!doctype html>
<html lang="pt-br">
<head>
<meta charset="utf-8" />
<title>${escapar(titulo)}</title>
<style>
  @import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@500;600&display=swap");
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 48px 56px;
    font-family: "DM Sans", sans-serif;
    color: #1c2333;
    background: #f5f2ea;
    -webkit-font-smoothing: antialiased;
  }
  .report {
    max-width: 880px;
    margin: 0 auto;
    background: #fffefb;
    border: 1px solid rgba(28, 35, 51, 0.14);
    border-radius: 16px;
    padding: 44px 48px;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    padding-bottom: 22px;
    margin-bottom: 26px;
    border-bottom: 2px solid rgba(28, 35, 51, 0.55);
  }
  .brand { font-family: "Fraunces", serif; font-size: 1.05rem; font-weight: 600; letter-spacing: -0.01em; }
  .brand span { display: block; font-family: "DM Sans", sans-serif; font-weight: 500; font-size: 0.78rem; color: #80869a; margin-top: 3px; }
  .meta { text-align: right; font-size: 0.8rem; color: #4b5468; }
  h1 { font-family: "Fraunces", serif; font-size: 1.6rem; font-weight: 600; letter-spacing: -0.01em; margin: 0 0 4px; }
  .subtitulo { color: #4b5468; font-size: 0.92rem; margin-bottom: 30px; }
  section { margin-bottom: 28px; }
  h2 {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 700;
    color: #a2712e;
    margin: 0 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(28, 35, 51, 0.16);
  }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px 24px; font-size: 0.9rem; }
  .grid div span { display: block; color: #80869a; font-size: 0.74rem; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.04em; }
  table { width: 100%; border-collapse: collapse; font-size: 0.86rem; }
  th, td { text-align: left; padding: 9px 10px; border-bottom: 1px solid rgba(28, 35, 51, 0.12); }
  th { color: #80869a; font-weight: 600; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid rgba(28, 35, 51, 0.4); }
  .vazio { color: #80869a; font-size: 0.86rem; font-style: italic; }
  .resumo-tiras { display: flex; gap: 0; border: 1px solid rgba(28, 35, 51, 0.16); border-radius: 10px; overflow: hidden; margin-bottom: 26px; }
  .resumo-tira { flex: 1; padding: 14px 18px; border-right: 1px solid rgba(28, 35, 51, 0.12); }
  .resumo-tira:last-child { border-right: none; }
  .resumo-tira strong { display: block; font-family: "Fraunces", serif; font-size: 1.35rem; }
  .resumo-tira span { font-size: 0.72rem; color: #80869a; text-transform: uppercase; letter-spacing: 0.04em; }
  footer { margin-top: 34px; padding-top: 16px; border-top: 1px solid rgba(28, 35, 51, 0.14); font-size: 0.74rem; color: #80869a; display: flex; justify-content: space-between; }
  .print-bar { max-width: 880px; margin: 0 auto 16px; display: flex; justify-content: flex-end; }
  .print-btn {
    border: none; cursor: pointer; padding: 10px 18px; border-radius: 9px;
    background: #1c2333; color: #f5f2ea; font-weight: 600; font-size: 0.86rem;
    font-family: "DM Sans", sans-serif;
  }
  .print-btn:hover { background: #a2712e; }
  @media print {
    .print-bar { display: none; }
    body { background: #fff; padding: 0; }
    .report { border: none; border-radius: 0; max-width: none; padding: 0; }
  }
</style>
</head>
<body>
  <div class="print-bar"><button class="print-btn" onclick="window.print()">Imprimir / Salvar como PDF</button></div>
  <div class="report">
    <header>
      <div class="brand">${escapar(escritorio)}<span>Relatório gerado pelo sistema</span></div>
      <div class="meta">Gerado em<br />${escapar(geradoEm)}</div>
    </header>
    <h1>${escapar(titulo)}</h1>
    <p class="subtitulo">${escapar(subtitulo)}</p>
    ${corpo}
    <footer>
      <span>${escapar(escritorio)}</span>
      <span>Documento gerado automaticamente — uso interno</span>
    </footer>
  </div>
</body>
</html>`;
}

export function gerarHtmlRelatorioCliente(dados) {
  const { cliente, processos = [], documentos = [], agenda = [], resumo = {}, escritorio } = dados;
  const geradoEm = formatarData(dados.gerado_em, true);

  const corpo = `
    <div class="resumo-tiras">
      <div class="resumo-tira"><strong>${resumo.total_processos ?? processos.length}</strong><span>Processos</span></div>
      <div class="resumo-tira"><strong>${resumo.total_documentos ?? documentos.length}</strong><span>Documentos</span></div>
      <div class="resumo-tira"><strong>${resumo.total_eventos ?? agenda.length}</strong><span>Eventos de agenda</span></div>
    </div>

    <section>
      <h2>Dados do cliente</h2>
      <div class="grid">
        <div><span>Nome</span>${escapar(cliente.nome)}</div>
        <div><span>CPF</span>${escapar(cliente.cpf)}</div>
        <div><span>E-mail</span>${escapar(cliente.email)}</div>
        <div><span>Telefone</span>${escapar(cliente.telefone)}</div>
        <div><span>Endereço</span>${escapar(cliente.endereco)}</div>
        <div><span>Status</span>${cliente.ativo ? "Ativo" : "Inativo"}</div>
        <div><span>Data de nascimento</span>${formatarData(cliente.data_nascimento)}</div>
        <div><span>Cliente desde</span>${formatarData(cliente.criado_em)}</div>
      </div>
    </section>

    <section>
      <h2>Processos vinculados</h2>
      ${tabela(
        ["Número", "Título", "Status", "Advogado", "Início"],
        processos.map((p) => [
          escapar(p.numero_processo), escapar(p.titulo), escapar(statusLabel(p.status)),
          escapar(p.advogado_nome), formatarData(p.data_inicio),
        ]),
        "Nenhum processo vinculado a este cliente."
      )}
    </section>

    <section>
      <h2>Documentos</h2>
      ${tabela(
        ["Arquivo", "Processo", "Enviado em"],
        documentos.map((d) => [escapar(d.nome_arquivo), escapar(d.numero_processo), formatarData(d.enviado_em, true)]),
        "Nenhum documento anexado."
      )}
    </section>

    <section>
      <h2>Agenda</h2>
      ${tabela(
        ["Evento", "Processo", "Data", "Local"],
        agenda.map((a) => [escapar(a.titulo), escapar(a.numero_processo), formatarData(a.data_evento, true), escapar(a.local_evento)]),
        "Nenhum evento de agenda vinculado."
      )}
    </section>
  `;

  return casca({
    titulo: `Relatório do cliente — ${cliente.nome}`,
    subtitulo: "Resumo completo de processos, documentos e agenda vinculados a este cliente.",
    escritorio: escritorio?.nome || "Escritório",
    geradoEm,
    corpo,
  });
}

export function gerarHtmlRelatorioProcesso(dados) {
  const { processo, cliente, documentos = [], movimentacoes = [], agenda = [], escritorio } = dados;
  const geradoEm = formatarData(dados.gerado_em, true);

  const corpo = `
    <div class="resumo-tiras">
      <div class="resumo-tira"><strong>${statusLabel(processo.status)}</strong><span>Status atual</span></div>
      <div class="resumo-tira"><strong>${documentos.length}</strong><span>Documentos</span></div>
      <div class="resumo-tira"><strong>${agenda.length}</strong><span>Eventos de agenda</span></div>
    </div>

    <section>
      <h2>Dados do processo</h2>
      <div class="grid">
        <div><span>Número</span>${escapar(processo.numero_processo)}</div>
        <div><span>Título</span>${escapar(processo.titulo)}</div>
        <div><span>Cliente</span>${escapar(cliente.nome)}</div>
        <div><span>Advogado responsável</span>${escapar(processo.advogado_nome)}</div>
        <div><span>Data de início</span>${formatarData(processo.data_inicio)}</div>
        <div><span>Data de encerramento</span>${formatarData(processo.data_fim)}</div>
      </div>
      <p style="margin-top:14px; font-size:0.88rem; line-height:1.6;">${escapar(processo.descricao)}</p>
    </section>

    <section>
      <h2>Movimentações</h2>
      ${tabela(
        ["Data", "Descrição"],
        movimentacoes.map((m) => [formatarData(m.data_movimentacao, true), escapar(m.descricao)]),
        "Nenhuma movimentação registrada."
      )}
    </section>

    <section>
      <h2>Documentos</h2>
      ${tabela(
        ["Arquivo", "Enviado em"],
        documentos.map((d) => [escapar(d.nome_arquivo), formatarData(d.enviado_em, true)]),
        "Nenhum documento anexado a este processo."
      )}
    </section>

    <section>
      <h2>Agenda</h2>
      ${tabela(
        ["Evento", "Data", "Local"],
        agenda.map((a) => [escapar(a.titulo), formatarData(a.data_evento, true), escapar(a.local_evento)]),
        "Nenhum evento de agenda vinculado."
      )}
    </section>
  `;

  return casca({
    titulo: `Relatório do processo — ${processo.numero_processo}`,
    subtitulo: `${processo.titulo} — cliente: ${cliente.nome}`,
    escritorio: escritorio?.nome || "Escritório",
    geradoEm,
    corpo,
  });
}

export function abrirRelatorio(html) {
  const janela = window.open("", "_blank");
  if (!janela) {
    throw new Error("Não foi possível abrir a janela do relatório. Verifique o bloqueador de pop-ups.");
  }
  janela.document.open();
  janela.document.write(html);
  janela.document.close();
}
