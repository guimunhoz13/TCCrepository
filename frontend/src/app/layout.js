import Providers from "@/components/Providers";
import RegistrarServiceWorker from "@/components/RegistrarServiceWorker";
import "./globals.css";

export const metadata = {
  title: "LexOffice — ERP Jurídico",
  description: "Sistema ERP multi-escritório para advocacia",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "LexOffice",
    // O iOS não lê theme_color do manifest; a barra de status segue este
    // estilo para acompanhar o topo escuro do sistema.
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f2ea" },
    { media: "(prefers-color-scheme: dark)", color: "#1c2333" },
  ],
};

const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem('theme');
    var theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <RegistrarServiceWorker />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
