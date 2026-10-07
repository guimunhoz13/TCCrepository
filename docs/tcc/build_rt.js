const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ImageRun, Header, Footer,
  PageNumber, ShadingType, VerticalAlign, HeadingLevel, PageBreak,
} = require("docx");

const DIAG = `${__dirname}/diagramas`;
const ORIG = `${__dirname}/imagens_capa`;

const AZUL = "1F3864";
const DOURADO = "8C6D1F";
const CINZA = "555555";

function img(path, widthPx, heightPx, maxWidthPx = 560) {
  const scale = Math.min(1, maxWidthPx / widthPx);
  return new ImageRun({
    type: path.endsWith(".png") ? "png" : "jpg",
    data: fs.readFileSync(path),
    transformation: { width: Math.round(widthPx * scale), height: Math.round(heightPx * scale) },
  });
}

function figura(path, widthPx, heightPx, legenda, maxWidthPx) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 80 },
      children: [img(path, widthPx, heightPx, maxWidthPx)],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: legenda, italics: true, size: 20, color: CINZA })],
    }),
  ];
}

function h1(texto) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 420, after: 200 },
    children: [new TextRun({ text: texto, bold: true, size: 30, color: AZUL })],
  });
}

function h2(texto) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 160 },
    children: [new TextRun({ text: texto, bold: true, size: 25, color: AZUL })],
  });
}

function h3(texto) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 220, after: 120 },
    children: [new TextRun({ text: texto, bold: true, size: 22 })],
  });
}

function p(texto, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 180, line: 300 },
    children: Array.isArray(texto)
      ? texto
      : [new TextRun({ text: texto, size: 22, ...opts })],
  });
}

function bullet(texto) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 100, line: 276 },
    bullet: { level: 0 },
    children: [new TextRun({ text: texto, size: 22 })],
  });
}

function celula(texto, opts = {}) {
  return new TableCell({
    width: { size: opts.width || 2000, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [new TextRun({ text: texto, bold: !!opts.bold, size: opts.size || 19, color: opts.color })],
      }),
    ],
  });
}

module.exports = { img, figura, h1, h2, h3, p, bullet, celula, AZUL, DOURADO, CINZA, DIAG, ORIG,
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ImageRun, Header, Footer, PageNumber, ShadingType, VerticalAlign, HeadingLevel, PageBreak };
