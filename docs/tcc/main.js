const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Header, Footer, PageNumber, AlignmentType,
} = require("./build_rt.js");
const sec = require("./gerar_rt.js");

const footer = new Footer({
  children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888888" }),
      ],
    }),
  ],
});

const doc = new Document({
  title: "Sistema Web para Gerenciamento de Escritório de Advocacia",
  subject: "Relatório técnico do TCC — revisão 1.8 com auditoria de 27/10/2026",
  creator: "João Henrique Souza Sabino e Guilherme Munhoz",
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
      title: { run: { color: "000000" } },
      heading1: { run: { color: "000000" } },
      heading2: { run: { color: "000000" } },
      heading3: { run: { color: "000000" } },
      heading4: { run: { color: "000000" } },
      heading5: { run: { color: "000000" } },
      heading6: { run: { color: "000000" } },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1417, bottom: 1417, left: 1701, right: 1134 }, // ABNT-like margins
        },
      },
      footers: { default: footer },
      children: [
        ...sec.capa,
        ...sec.resumo,
        ...sec.sumario,
        ...sec.introducao,
        ...sec.modelagemNegocio,
        ...sec.requisitos,
        ...sec.modelagemSistemas,
        ...sec.modelagemDados,
        ...sec.prototipos,
        ...sec.arquitetura,
        ...sec.trabalhosFuturos,
        ...sec.conclusao,
        ...sec.referencias,
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(`${__dirname}/RT-TDS-2026-39_v1.8.docx`, buffer);
  console.log("OK: documento gerado.");
});
