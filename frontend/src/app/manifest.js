export default function manifest() {
  return {
    name: "LexOffice — ERP Jurídico",
    short_name: "LexOffice",
    description:
      "Clientes, processos, prazos, documentos e financeiro do escritório em um só lugar.",
    // O sistema vive no painel: instalado, é nele que o app deve abrir.
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    lang: "pt-BR",
    background_color: "#10131c",
    theme_color: "#1c2333",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // O Android recorta o ícone em várias formas; o maskable traz o logo
      // reduzido sobre fundo cheio para não perder as bordas no corte.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Agenda", short_name: "Agenda", url: "/dashboard/compromissos" },
      { name: "Assistente IA", short_name: "Assistente", url: "/assistente-ia" },
    ],
  };
}
